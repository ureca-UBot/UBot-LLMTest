#!/usr/bin/env python3
"""Prepare and run one serving engine using pinned public images; no Docker image builds/TARs."""
import argparse
import csv
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from urllib import request, parse
import uuid

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ENGINES = ('ollama', 'llamacpp', 'vllm', 'sglang')


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda: f.read(8 * 1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    temp.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
    os.replace(temp, path)


def copy_download(stream, destination, expected):
    h = hashlib.sha256()
    count = 0
    with Path(destination).open('wb') as output:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b''):
            output.write(block)
            count += len(block)
            h.update(block)
    if count != expected['bytes'] or h.hexdigest() != expected['sha256']:
        raise ValueError('Downloaded model size/SHA mismatch: ' + expected['path'])


def model_ids(engine):
    return ['qwen3_4b_gguf_q4km'] if engine in ('ollama', 'llamacpp') else ['qwen3_4b_awq']


def core_modules(root):
    path = root / 'load_test_v2/scripts/cloud/prepare_models.py'
    spec = importlib.util.spec_from_file_location('repro_model_prepare', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(command, *, env=None, capture=True, timeout=30):
    return subprocess.run(command, env=env, check=True, text=True,
                          capture_output=capture, timeout=timeout)


def image_identity(reference):
    image = json.loads(run(['docker', 'image', 'inspect', reference]).stdout)[0]
    if image.get('Os') != 'linux' or image.get('Architecture') != 'amd64':
        raise ValueError('Only linux/amd64 engine images are supported')
    return {'reference': reference, 'image_id': image['Id'], 'repo_digests': image.get('RepoDigests', []),
            'created': image.get('Created'), 'rootfs': image['RootFS']}


def assert_ready_images(expected, observe=image_identity):
    for entry in expected:
        if observe(entry['reference'])['image_id'] != entry['image_id']:
            raise ValueError('Prepared image changed: ' + entry['reference'])


def gpu_snapshot():
    rows = list(csv.reader(run(['nvidia-smi', '--query-gpu=index,uuid,name,driver_version,memory.used',
                               '--format=csv,noheader,nounits']).stdout.splitlines()))
    gpu = next((r for r in rows if r[0].strip() == '0'), None)
    if not gpu or len(gpu) != 5 or not gpu[4].strip().isdigit():
        raise ValueError('GPU 0 must report measurable VRAM')
    processes = run(['nvidia-smi', '--query-compute-apps=gpu_uuid,pid',
                     '--format=csv,noheader,nounits']).stdout
    pids = [r[1].strip() for r in csv.reader(processes.splitlines())
            if len(r) == 2 and r[0].strip() == gpu[1].strip()]
    return {'index': '0', 'uuid': gpu[1].strip(), 'name': gpu[2].strip(),
            'driver': gpu[3].strip(), 'memory_mib': int(gpu[4].strip()), 'compute_pids': pids}


def assert_idle(snapshot, gpu_uuid=None):
    if gpu_uuid is not None and snapshot['uuid'] != gpu_uuid:
        raise ValueError('GPU UUID changed; the original cleanup baseline cannot be verified')
    if snapshot['memory_mib'] != 0 or snapshot['compute_pids']:
        raise ValueError('GPU is not released: ' + json.dumps(snapshot))


class Environment:
    def __init__(self, root=ROOT):
        self.root = Path(root).resolve()
        self.code = self.root / 'load_test_v2/docker/reproduce'
        self.pins = read(self.code / 'pins.json')
        self.state = self.root / '.repro-state'
        self.models_path = self.root / self.pins['models_file']
        if digest(self.models_path) != self.pins['model_lock_sha256']:
            raise ValueError('Model lock differs from the reproduction pins')
        self.models = read(self.models_path)
        self.prep = core_modules(self.root)
        self.prep.validate_lock(self.models)
        self.prep.verify_template(self.root, self.models)
        sources = sorted(p for p in self.code.iterdir() if p.is_file() and p.suffix != '.log')
        self.spec_sha = hashlib.sha256(''.join(p.name + digest(p) for p in sources).encode()).hexdigest()
        self.project = 'ubot-repro-' + hashlib.sha256((str(self.root) + self.spec_sha).encode()).hexdigest()[:12]
        self.env = {**os.environ, 'LLM_WORKSPACE': str(self.root), 'LLM_REPRO_PROJECT': self.project,
                    'NVIDIA_VISIBLE_DEVICES': 'void'}

    def compose(self, *args, mode=None, env=None, capture=True, timeout=30):
        command = ['docker', 'compose', '--project-name', self.project, '-f', str(self.code / 'compose.yaml')]
        if mode:
            command += ['-f', str(self.code / ('compose.' + mode + '.yaml'))]
        return run(command + list(args), env=self.env if env is None else env, capture=capture, timeout=timeout)

    def doctor(self):
        endpoint = os.environ.get('DOCKER_HOST')
        if not endpoint:
            contexts = json.loads(run(['docker', 'context', 'inspect']).stdout)
            endpoint = contexts[0]['Endpoints']['docker']['Host']
        if not endpoint.startswith(('unix://', 'npipe://')):
            raise ValueError('Run this helper against a local Docker daemon; bind paths belong to this host')
        info = json.loads(run(['docker', 'info', '--format', '{{json .}}']).stdout)
        if info.get('OSType') != 'linux' or info.get('Architecture') not in ('x86_64', 'amd64'):
            raise ValueError('Docker must run Linux amd64 containers')
        self.compose('config', '--quiet')
        return {'docker_server': info['ServerVersion'], 'docker_endpoint': endpoint,
                'python': sys.version, 'platform': self.pins['platform']}

    def plan(self, engines):
        ids = sorted({m for e in engines for m in model_ids(e)})
        return {'engines': engines, 'images': {e: self.pins['images'][e] for e in engines},
                'models': [{'id': m['id'], 'repository': m['repository'], 'revision': m['revision'],
                            'bytes': sum(f['bytes'] for f in m['files'])} for m in self.models['models'] if m['id'] in ids],
                'sglang_preparation': 'volume with system-site-packages venv and vllm==0.8.4',
                'build_required': False, 'tar_required': False, 'spec_sha256': self.spec_sha,
                'network_accessed': False, 'gpu_access_requested': False}

    def prepare_models(self, engines, validate=False):
        ids = {m for e in engines for m in model_ids(e)}
        output = []
        for model in self.models['models']:
            if model['id'] not in ids:
                continue
            destination = self.root / 'model_assets/portable' / model['portable_subdir']
            self.prep.inside(self.root, destination)
            if destination.exists():
                output.append(self.prep.materialize(self.root, self.models, model, None, validate_only=True,
                                                    lock_sha256=self.pins['model_lock_sha256']))
                continue
            if validate:
                raise ValueError('Prepare model before starting: ' + model['id'])
            destination.parent.mkdir(parents=True, exist_ok=True)
            staging = destination.parent / ('.' + model['portable_subdir'] + '.prepare-' + uuid.uuid4().hex)
            staging.mkdir()
            try:
                for file in model['files']:
                    target = staging.joinpath(*self.prep.relative_path(file['path']).parts)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    url = ('https://huggingface.co/' + model['repository'] + '/resolve/' + model['revision'] + '/' +
                           parse.quote(file['path'], safe='/'))
                    print('Downloading ' + model['id'] + '/' + file['path'], flush=True)
                    req = request.Request(url, headers={'User-Agent': 'UBot-LLMTest-reproduction/1'})
                    with request.urlopen(req, timeout=60) as stream:
                        copy_download(stream, target, file)
                verified = self.prep.verify_files(staging, model, self.models)
                receipt = {'schema_version': 1, 'id': model['id'], 'repository': model['repository'],
                           'revision': model['revision'], 'model_lock_sha256': self.pins['model_lock_sha256'],
                           'mode': 'pinned_https_download', 'prepared_at': time.time(),
                           'lineage_status': self.models['lineage_status'], 'files': verified}
                write(staging / '.prepared.json', receipt)
                if destination.exists():
                    raise ValueError('Model destination appeared; refusing to overwrite it')
                staging.rename(destination)
                output.append({'id': model['id'], 'status': 'prepared', 'path': str(destination)})
            except Exception as error:
                write(staging / '.failed.json', {'ready': False, 'error': str(error)})
                raise
        return output

    def check_not_active(self):
        if (self.state / 'active.json').exists():
            raise ValueError('Stop and release the current engine before preparing/starting another')
        ids = run(['docker', 'ps', '--filter', 'label=com.docker.compose.project=' + self.project,
                   '--format', '{{.ID}}']).stdout.strip()
        if ids:
            raise ValueError('This reproduction project still has running containers; inspect before continuing')

    def prepare(self, engines):
        self.check_not_active()
        host = self.doctor()
        images = []
        for engine in engines:
            reference = self.pins['images'][engine]
            run(['docker', 'image', 'pull', '--platform', 'linux/amd64', reference], capture=False, timeout=3600)
            images.append(image_identity(reference))
        models = self.prepare_models(engines)
        sglang = None
        if 'sglang' in engines:
            # Receipts are inside the volume; log all install output separately.
            print('Preparing SGLang Python dependencies in the Docker volume', flush=True)
            try:
                prepared = self.compose('run', '--rm', '--no-deps', 'sglang-prepare', timeout=3600)
            except subprocess.CalledProcessError as error:
                write(self.state / 'sglang-install-output.json', {'ready': False, 'stdout': error.stdout, 'stderr': error.stderr})
                raise
            write(self.state / 'sglang-install-output.json', {'stdout': prepared.stdout, 'stderr': prepared.stderr})
            observed = self.compose('run', '--rm', '--no-deps', 'sglang-prepare', '--validate-only', timeout=120)
            sglang = json.loads(observed.stdout.splitlines()[-1])
            write(self.state / 'sglang-environment.json', sglang)
        previous = read(self.state / 'ready.json') if (self.state / 'ready.json').exists() else {}
        if previous.get('spec_sha256') != self.spec_sha:
            previous = {}
        if previous:
            merged_models = {entry['id']: entry for entry in previous.get('models', [])}
            merged_models.update({entry['id']: entry for entry in models})
            models = list(merged_models.values())
            selected = {entry['reference']: entry for entry in previous.get('images', [])}
            selected.update({entry['reference']: entry for entry in images})
            images = list(selected.values())
        receipt = {'ready': True, 'spec_sha256': self.spec_sha, 'project': self.project,
                   'prepared_at': time.time(), 'images': images, 'models': models, 'host': host,
                   'sglang_environment_record': '.repro-state/sglang-environment.json' if sglang else previous.get('sglang_environment_record')}
        write(self.state / 'ready.json', receipt)
        print(json.dumps(receipt, indent=2))

    def wait_ready(self, engine, port):
        path = '/api/tags' if engine == 'ollama' else '/health' if engine == 'llamacpp' else '/v1/models'
        deadline = time.monotonic() + 600
        while time.monotonic() < deadline:
            try:
                with request.urlopen('http://127.0.0.1:' + str(port) + path, timeout=3) as response:
                    if response.status == 200:
                        return
            except (OSError, ValueError):
                pass
            time.sleep(1)
        raise TimeoutError('Engine readiness timed out; inspect .repro-state session logs')

    def start(self, engine, hardware, limit, port, mode):
        if sys.platform != 'linux':
            raise ValueError('GPU serving starts on Linux; use this script on the cloud/WSL host')
        self.check_not_active()
        host = self.doctor()
        ready = read(self.state / 'ready.json')
        if ready.get('spec_sha256') != self.spec_sha or ready.get('project') != self.project:
            raise ValueError('Run prepare again; reproduction inputs changed')
        expected = [i for i in ready['images'] if i['reference'] == self.pins['images'][engine]]
        if len(expected) != 1:
            raise ValueError('Prepare this engine first')
        assert_ready_images(expected)
        self.prepare_models([engine], validate=True)
        if engine == 'sglang':
            self.compose('run', '--rm', '--no-deps', 'sglang-prepare', '--validate-only', timeout=120)
        gpu = gpu_snapshot()
        assert_idle(gpu)
        if engine == 'vllm' and tuple(int(x) for x in gpu['driver'].split('.')) < (580, 95, 5):
            raise ValueError('The pinned CUDA 13 vLLM image requires driver >=580.95.05 in this experiment')
        if hardware == 't4' and 'T4' not in gpu['name'] or hardware == 'l4' and 'L4' not in gpu['name']:
            raise ValueError('GPU does not match the selected hardware preset')
        limit = limit or self.pins['hardware_defaults'][hardware][engine]
        env = {**self.env, 'LLM_PORT': str(port), 'LLM_GPU_ID': gpu['uuid'],
               'LLM_GPU_DEVICE': 'nvidia.com/gpu=' + gpu['uuid'], 'OLLAMA_PARALLEL': str(limit),
               'LLAMACPP_PARALLEL': str(limit), 'LLAMACPP_CTX_SIZE': str(4096 * limit),
               'VLLM_MAX_NUM_SEQS': str(limit), 'SGLANG_MAX_RUNNING_REQUESTS': str(limit)}
        configuration = json.loads(self.compose('config', '--format', 'json', mode=mode, env=env).stdout)
        session_dir = self.state / 'sessions' / uuid.uuid4().hex
        session = {'engine': engine, 'project': self.project, 'hardware': hardware, 'internal_limit': limit,
                   'port': port, 'gpu_mode': mode, 'gpu_baseline': gpu, 'started_at': time.time(),
                   'spec_sha256': self.spec_sha, 'image': expected[0], 'host': host,
                   'session_directory': str(session_dir), 'configuration': configuration, 'status': 'starting'}
        session['model_lock_sha256'] = self.pins['model_lock_sha256']
        session['models'] = self.models
        if engine == 'sglang':
            session['sglang_environment'] = read(self.state / 'sglang-environment.json')
        write(self.state / 'active.json', session)
        write(session_dir / 'session.json', session)
        for source in self.code.iterdir():
            if source.is_file():
                archived = session_dir / 'source_inputs' / source.name
                archived.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, archived)
        try:
            self.compose('up', '-d', '--no-deps', '--pull', 'never', engine, mode=mode, env=env, capture=False, timeout=120)
            self.wait_ready(engine, port)
            if engine == 'ollama':
                cid = self.compose('ps', '-q', engine).stdout.strip()
                run(['docker', 'exec', cid, 'ollama', 'create', 'qwen3-baseline:4b', '-f', '/repro/Modelfile'], timeout=300)
            session['status'] = 'ready'
            write(self.state / 'active.json', session)
            write(session_dir / 'session.json', session)
            print(json.dumps({'status': 'ready', 'engine': engine, 'internal_limit': limit,
                              'endpoint': 'http://127.0.0.1:' + str(port), 'session_directory': str(session_dir)}))
        except Exception:
            self.stop()
            raise

    def stop(self):
        path = self.state / 'active.json'
        if not path.exists():
            raise ValueError('No owned active session recorded')
        session = read(path)
        project = session['project']
        directory = Path(session['session_directory']).resolve()
        if not re.fullmatch(r'ubot-repro-[a-f0-9]{12}', project) or not directory.is_relative_to((self.state / 'sessions').resolve()):
            raise ValueError('Invalid session ownership/path; refusing cleanup')
        ids = run(['docker', 'ps', '-aq', '--filter', 'label=com.docker.compose.project=' + project]).stdout.split()
        for cid in ids:
            info = json.loads(run(['docker', 'inspect', cid]).stdout)[0]
            labels = info.get('Config', {}).get('Labels', {})
            if labels.get('com.docker.compose.project') != project or labels.get('io.ubot.llm.reproduction') != 'true':
                raise ValueError('Container ownership mismatch; refusing cleanup')
            logs = subprocess.run(['docker', 'logs', cid], capture_output=True, text=True, timeout=30)
            write(directory / (cid + '-logs.json'), {'stdout': logs.stdout, 'stderr': logs.stderr})
            run(['docker', 'stop', '--time', '180', cid], timeout=210)
            run(['docker', 'rm', cid], timeout=30)
        samples = []
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            gpu = gpu_snapshot()
            if gpu['uuid'] != session['gpu_baseline']['uuid']:
                raise ValueError('GPU UUID changed; cleanup is unverified')
            if gpu['memory_mib'] == 0 and not gpu['compute_pids']:
                samples.append(gpu)
                if len(samples) == 3:
                    session.update({'status': 'stopped', 'gpu_released': True, 'release_samples': samples})
                    write(directory / 'session.json', session)
                    path.unlink()
                    print(json.dumps({'stopped': True, 'gpu_released': True, 'samples': 3}))
                    return
            else:
                samples = []
            time.sleep(1)
        write(directory / 'cleanup-failed.json', {'gpu_released': False, 'last_snapshot': gpu})
        raise ValueError('GPU cleanup did not reach 0 MiB/no compute PID for three samples; active gate retained')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['plan', 'prepare', 'start', 'stop', 'doctor', 'status'])
    parser.add_argument('--engine', choices=['all', *ENGINES], default='all')
    parser.add_argument('--hardware', choices=['t4', 'l4', 'local'], default='t4')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--port', type=int, default=19551)
    parser.add_argument('--gpu-mode', choices=['gpus', 'cdi'], default='gpus')
    args = parser.parse_args(argv)
    if args.limit is not None and not 1 <= args.limit <= 256:
        parser.error('--limit must be 1..256')
    if not 1024 <= args.port <= 65535:
        parser.error('--port must be 1024..65535')
    if args.action == 'start' and args.engine == 'all':
        parser.error('Start exactly one engine; use --engine NAME')
    environment = Environment()
    selected = list(ENGINES) if args.engine == 'all' else [args.engine]
    if args.action == 'plan':
        print(json.dumps(environment.plan(selected), indent=2))
        return
    if args.action == 'doctor':
        print(json.dumps(environment.doctor(), indent=2))
        return
    if args.action == 'status':
        p = environment.state / 'active.json'
        print(json.dumps(read(p) if p.exists() else {'active': False}, indent=2))
        return
    environment.state.mkdir(exist_ok=True)
    lock = environment.state / 'operation.lock'
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        raise ValueError('Another operation or interrupted preparation holds .repro-state/operation.lock; inspect before recovery')
    os.write(fd, json.dumps({'pid': os.getpid(), 'project': environment.project, 'created_at': time.time()}).encode())
    os.close(fd)
    try:
        if args.action == 'prepare':
            environment.prepare(selected)
        elif args.action == 'start':
            if args.engine == 'all':
                raise ValueError('Start exactly one engine; use --engine NAME')
            environment.start(args.engine, args.hardware, args.limit, args.port, args.gpu_mode)
        else:
            environment.stop()
    finally:
        lock.unlink()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
