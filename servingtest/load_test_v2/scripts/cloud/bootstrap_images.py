#!/usr/bin/env python3
"""Prepare locked images for all candidates, or one engine plus its runner.

Public registry access is enabled only by --pull. --verify-only performs file
and manifest checks without invoking Docker, its daemon, or the network.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

import prepare_models as prep

FIELDS = ['User', 'Env', 'Entrypoint', 'Cmd', 'WorkingDir', 'ExposedPorts',
          'Volumes', 'Labels', 'Healthcheck', 'StopSignal', 'Shell', 'OnBuild', 'ArgsEscaped']
IMAGE_IDS = {'ollama', 'llamacpp', 'vllm', 'sglang', 'runner'}
CANDIDATES = {'ollama_p4': 'ollama', 'llamacpp_p4': 'llamacpp',
              'vllm_s8': 'vllm', 'vllm_s32': 'vllm', 'sglang_r8': 'sglang', 'sglang_r32': 'sglang'}
ENGINE_NAMES = {'ollama': 'ollama', 'llamacpp': 'llama.cpp', 'vllm': 'vllm', 'sglang': 'sglang'}
PUBLIC_IDS = {'ollama', 'llamacpp', 'vllm'}
DIGEST_REFERENCE = re.compile(r'(?:[A-Za-z0-9_.-]+(?::[0-9]+)?/)*[A-Za-z0-9_.-]+@sha256:[a-f0-9]{64}')


def image_fingerprint(info):
    if info.get('Os') != 'linux' or info.get('Architecture') != 'amd64' or info.get('RootFS', {}).get('Type') != 'layers' or not info['RootFS'].get('Layers'):
        raise ValueError('Only complete linux/amd64 images are allowed')
    value = {'os': info['Os'], 'architecture': info['Architecture'], 'variant': info.get('Variant') or '',
             'created': info['Created'], 'rootfs': {'type': 'layers', 'layers': info['RootFS']['Layers']},
             'config': {field: info.get('Config', {}).get(field) for field in FIELDS}}
    body = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(body).hexdigest()


def verify_sources(root):
    lock_file = root / 'load_test_v2/config/cloud.lock.json'
    frozen = json.loads(lock_file.read_text(encoding='utf-8-sig'))
    if frozen.get('schema_version') != 1 or frozen.get('platform') != 'linux/amd64' or not frozen.get('files'):
        raise ValueError('A complete frozen source lock is required')
    paths = set()
    for item in frozen['files']:
        if item.get('path') in paths or not re.fullmatch(r'[a-f0-9]{64}', item.get('sha256', '')):
            raise ValueError('Unique frozen source paths and fingerprints are required')
        paths.add(item['path'])
        file = prep.inside(root, root.joinpath(*prep.relative_path(item['path']).parts))
        if prep.digest(file) != item['sha256']:
            raise ValueError('Frozen source changed: ' + item['path'])
    images_path = 'load_test_v2/config/images.lock.json'
    profile_path = 'load_test_v2/config/http.t4.json'
    models_path = 'load_test_v2/config/models.lock.json'
    if not {images_path, profile_path, models_path}.issubset(paths):
        raise ValueError('The whole image/model/profile config locks must be frozen')
    if frozen.get('profile_file') != profile_path or frozen.get('models_file') != models_path:
        raise ValueError('Unexpected frozen profile/model config path')
    profile_file = root / profile_path
    model_file = root / models_path
    if prep.digest(profile_file) != frozen.get('profile_sha256') or prep.digest(model_file) != frozen.get('models_sha256'):
        raise ValueError('Frozen profile/model config fingerprint mismatch')
    images = json.loads((root / images_path).read_text(encoding='utf-8-sig'))
    if images.get('schema_version') != 1 or images.get('platform') != 'linux/amd64' or images.get('images') != frozen.get('images'):
        raise ValueError('Source image lock differs from the whole frozen image identities')
    if len(images['images']) != 5 or {item.get('id') for item in images['images']} != IMAGE_IDS:
        raise ValueError('Exactly five locked image identities are required')
    for item in images['images']:
        if not re.fullmatch(r'[a-f0-9]{64}', item.get('config_fingerprint', '')) or item.get('platform') != 'linux/amd64' or not item.get('reference'):
            raise ValueError('Invalid locked image identity')
        if item['id'] in PUBLIC_IDS and not DIGEST_REFERENCE.fullmatch(item.get('source_digest') or ''):
            raise ValueError('Public image source must be repository@sha256:64')
    prep.validate_lock(json.loads(model_file.read_text(encoding='utf-8-sig')))
    profile = json.loads(profile_file.read_text(encoding='utf-8-sig'))
    candidates = profile.get('candidates', [])
    if len(candidates) != 6 or {item.get('id') for item in candidates} != set(CANDIDATES):
        raise ValueError('Exactly six fixed candidate identities are required')
    locked = {item['id']: item for item in images['images']}
    for candidate in candidates:
        image_id = CANDIDATES[candidate['id']]
        if candidate.get('engine') != ENGINE_NAMES[image_id] or candidate.get('runtime', {}).get('image') != locked[image_id]['reference']:
            raise ValueError('Candidate engine/image differs from its full config lock')
    return frozen


def verify_transfer(bundle, transfer, expected, archive_ids=None):
    if transfer.get('schema_version') != 1 or transfer.get('status') != 'completed' or transfer.get('platform') != 'linux/amd64':
        raise ValueError('A completed linux/amd64 image transfer is required')
    images = transfer.get('images', [])
    if not isinstance(images, list) or len(images) != 5 or any(not isinstance(item, dict) for item in images):
        raise ValueError('Exactly five image archives are required')
    for field in ['id', 'reference', 'file']:
        if len(set(x.get(field) for x in images)) != 5:
            raise ValueError('Duplicate image transfer ' + field)
    identity = lambda rows: sorted((x['id'], x['reference'], x['config_fingerprint']) for x in rows)
    if identity(images) != identity(expected):
        raise ValueError('Transferred images differ from the source image lock')
    required = set(IMAGE_IDS if archive_ids is None else archive_ids)
    if not required.issubset(IMAGE_IDS):
        raise ValueError('Unknown archive image selection')
    for item in images:
        if not re.fullmatch(r'[a-z]+\.tar', item['file']) or not re.fullmatch(r'[a-f0-9]{64}', item.get('sha256', '')):
            raise ValueError('Invalid image archive path or fingerprint')
        if not isinstance(item.get('bytes'), int) or isinstance(item['bytes'], bool) or item['bytes'] < 1:
            raise ValueError('Invalid image archive byte count')
        # Identity/header checks cover all five entries, even when unrelated
        # tar files are deliberately absent from a selected-candidate bundle.
        if item['id'] not in required:
            continue
        file = prep.inside(bundle, bundle / item['file'])
        if not file.is_file() or file.stat().st_size != item['bytes'] or prep.digest(file) != item['sha256']:
            raise ValueError('Transfer archive differs: ' + item['file'])
    return {item['id']: item for item in images}


def docker_run(command):
    return subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)


def required_command(command_runner, command):
    result = command_runner(command)
    if result.returncode != 0:
        raise ValueError('Docker operation failed: ' + (result.stderr or result.stdout or 'unknown error').strip())
    return result


def inspect_image(command_runner, docker, reference, expected, allow_missing=False):
    result = command_runner(docker + ['image', 'inspect', reference])
    if result.returncode != 0:
        message = result.stderr or result.stdout or ''
        if allow_missing and re.search(r'no such image', message, re.IGNORECASE):
            return False
        raise ValueError('Docker inspection failed: ' + message.strip())
    records = json.loads(result.stdout)
    if not isinstance(records, list) or len(records) != 1 or image_fingerprint(records[0]) != expected['config_fingerprint']:
        raise ValueError('Image content differs: ' + expected['id'])
    return True


def main(argv=None, root=None, command_runner=None, runtime_platform=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--candidate', choices=sorted(CANDIDATES), help='prepare only this engine and the common runner')
    parser.add_argument('--pull', action='store_true', help='explicitly allow digest-pinned public engine pulls; custom images still need archives')
    args = parser.parse_args(argv)
    root = Path(root).resolve() if root is not None else Path(__file__).resolve().parents[3]
    frozen = verify_sources(root)
    bundle = args.bundle.resolve()
    transfer = json.loads((bundle / 'images.transfer.json').read_text(encoding='utf-8-sig'))
    selected = {CANDIDATES[args.candidate], 'runner'} if args.candidate else set(IMAGE_IDS)
    pull_ids = selected & PUBLIC_IDS if args.pull else set()
    archive_ids = selected - pull_ids
    archives = verify_transfer(bundle, transfer, frozen['images'], archive_ids)
    selected_order = [item['id'] for item in frozen['images'] if item['id'] in selected]
    if args.verify_only:
        output = {'status': 'archive_hashes_verified', 'image_count': len(selected), 'images_loaded': False,
                  'candidate': args.candidate, 'selected_image_ids': selected_order, 'archive_count': len(archive_ids),
                  'full_identity_count': 5, 'public_fingerprint_pending': sorted(pull_ids),
                  'network_accessed': False, 'daemon_accessed': False}
        print(json.dumps(output))
        return output
    if (runtime_platform or sys.platform) != 'linux':
        raise ValueError('Image loading bootstrap requires Linux; --verify-only is portable')
    docker = ['docker', '--host', 'unix:///var/run/docker.sock']
    runner = command_runner or docker_run
    locked = {item['id']: item for item in frozen['images']}
    outcomes = []
    # Check every selected archive before this first mutation. Verify the
    # custom runner immediately, before any authorized public registry pull.
    for image_id in sorted(archive_ids, key=lambda value: (value != 'runner', value)):
        item = archives[image_id]
        required_command(runner, docker + ['image', 'load', '--input', str(bundle / item['file'])])
        inspect_image(runner, docker, item['reference'], locked[image_id])
        outcomes.append({'id': image_id, 'preparation': 'archive_loaded_and_verified'})
    for image_id in selected_order:
        if image_id not in pull_ids:
            continue
        item = locked[image_id]
        if inspect_image(runner, docker, item['reference'], item, allow_missing=True):
            outcomes.append({'id': image_id, 'preparation': 'existing_frozen_alias_verified'})
            continue
        reference = item['source_digest']
        if not DIGEST_REFERENCE.fullmatch(reference):
            raise ValueError('Public source digest is invalid')
        required_command(runner, docker + ['image', 'pull', '--platform', 'linux/amd64', reference])
        inspect_image(runner, docker, reference, item)
        required_command(runner, docker + ['image', 'tag', reference, item['reference']])
        inspect_image(runner, docker, item['reference'], item)
        outcomes.append({'id': image_id, 'preparation': 'digest_pulled_and_frozen_alias_verified'})
    output = {'status': 'loaded_and_content_verified', 'image_count': len(selected), 'candidate': args.candidate,
              'selected_image_ids': selected_order, 'full_identity_count': 5, 'archive_count': len(archive_ids),
              'preparation': outcomes, 'gpu_access_requested': False, 'inference_run': False}
    print(json.dumps(output))
    return output


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
