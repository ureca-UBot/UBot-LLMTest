#!/usr/bin/env python3
"""Prepare SGLang dependencies in a volume, then launch without installation."""
import hashlib
import json
from pathlib import Path
import os
import re
import subprocess
import sys
import time
import venv

HERE = Path(__file__).resolve().parent
ENV_ROOT = Path('/opt/ubot-venv')
PYTHON = ENV_ROOT / 'bin/python'
READY = ENV_ROOT / '.ready.json'


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def normalize(name):
    return re.sub(r'[-_.]+', '-', name).lower()


def differences(expected, observed):
    actual = {normalize(p['name']): p['version'] for p in observed}
    return [{'package': name, 'expected': version, 'actual': actual.get(normalize(name))}
            for name, version in sorted(expected.items()) if actual.get(normalize(name)) != version]


def package_spec(pins):
    body = {'base': pins['images']['sglang'], 'core': pins['sglang_core'],
            'constraints': (HERE / 'sglang-core.constraints.txt').read_text(encoding='utf-8')}
    return hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()


def observe():
    code = """
import importlib.metadata as m, json, sys
names = {d.metadata['Name'] for d in m.distributions() if d.metadata.get('Name')}
import torch
print(json.dumps({'python': sys.version, 'packages': [{'name': n, 'version': m.version(n)} for n in sorted(names)],
                  'torch': {'version': torch.__version__, 'cuda_build': torch.version.cuda},
                  'gpu_access_requested': False, 'model_initialized': False}))
"""
    env = {**os.environ, 'NVIDIA_VISIBLE_DEVICES': 'void', 'CUDA_VISIBLE_DEVICES': ''}
    return json.loads(subprocess.check_output([str(PYTHON), '-c', code], text=True, env=env))


def check_core(pins, inventory):
    delta = differences(pins['sglang_core'], inventory['packages'])
    if inventory['torch']['cuda_build'] != pins['sglang_cuda_build']:
        delta.append({'package': 'torch.cuda_build', 'expected': pins['sglang_cuda_build'],
                      'actual': inventory['torch']['cuda_build']})
    if delta:
        raise RuntimeError('Core package mismatch: ' + json.dumps(delta))


def validate(pins):
    if not READY.exists() or not PYTHON.exists():
        raise RuntimeError('Run reproduce.py prepare --engine sglang before starting SGLang')
    receipt = read(READY)
    if receipt.get('spec_sha256') != package_spec(pins):
        raise RuntimeError('SGLang preparation receipt belongs to different inputs')
    actual = observe()
    check_core(pins, actual)
    expected = {p['name']: p['version'] for p in receipt['inventory']['packages']}
    if differences(expected, actual['packages']):
        raise RuntimeError('Prepared Python environment has changed')
    if {normalize(p['name']) for p in actual['packages']} != {normalize(p['name']) for p in receipt['inventory']['packages']}:
        raise RuntimeError('Prepared Python package set has changed')
    return receipt


def install(pins):
    if READY.exists():
        return validate(pins)
    ENV_ROOT.mkdir(parents=True, exist_ok=True)
    # --without-pip avoids Ubuntu ensurepip/apt requirements. The base pip can
    # manage this interpreter with --python; base packages remain visible.
    venv.EnvBuilder(system_site_packages=True, with_pip=False).create(ENV_ROOT)
    subprocess.run([sys.executable, '-m', 'pip', '--python', str(PYTHON), 'install',
                    '--no-cache-dir', '--constraint', str(HERE / 'sglang-core.constraints.txt'),
                    '--extra-index-url', 'https://download.pytorch.org/whl/cu124', 'vllm==0.8.4'], check=True)
    actual = observe()
    check_core(pins, actual)
    baseline = {p['name']: p['version'] for p in pins['reference_packages']}
    receipt = {'schema_version': 1, 'spec_sha256': package_spec(pins), 'base_image': pins['images']['sglang'],
               'prepared_at': time.time(), 'inventory': actual,
               'reference_version_differences': differences(baseline, actual['packages']),
               'reference_extra_packages': sorted({normalize(p['name']) for p in actual['packages']} -
                                                  {normalize(p['name']) for p in pins['reference_packages']}),
               'pip_freeze': subprocess.check_output([str(PYTHON), '-m', 'pip', 'freeze'], text=True).splitlines(),
               'ready': True}
    temporary = READY.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, READY)
    return receipt


def main(argv=None):
    args = list(sys.argv[1:] if argv is None else argv)
    pins = read(HERE / 'pins.json')
    if args[:1] == ['--launch']:
        validate(pins)
        os.execv(str(PYTHON), [str(PYTHON), '-m', 'sglang.launch_server', *args[1:]])
    elif args == ['--validate-only']:
        receipt = validate(pins)
    elif not args:
        receipt = install(pins)
    else:
        raise ValueError('Use no arguments for preparation, --validate-only, or --launch SERVER_ARGS')
    print(json.dumps(receipt))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
