#!/usr/bin/env python3
"""Load and verify the frozen images with host Python; Node stays in Docker."""
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
    for item in frozen['files']:
        file = prep.inside(root, root.joinpath(*prep.relative_path(item['path']).parts))
        if prep.digest(file) != item['sha256']:
            raise ValueError('Frozen source changed: ' + item['path'])
    return frozen


def verify_transfer(bundle, transfer, expected):
    if transfer.get('schema_version') != 1 or transfer.get('status') != 'completed' or transfer.get('platform') != 'linux/amd64':
        raise ValueError('A completed linux/amd64 image transfer is required')
    images = transfer.get('images', [])
    if len(images) != 5:
        raise ValueError('Exactly five image archives are required')
    for field in ['id', 'reference', 'file']:
        if len(set(x.get(field) for x in images)) != 5:
            raise ValueError('Duplicate image transfer ' + field)
    identity = lambda rows: sorted((x['id'], x['reference'], x['config_fingerprint']) for x in rows)
    if identity(images) != identity(expected):
        raise ValueError('Transferred images differ from the source image lock')
    for item in images:
        if not re.fullmatch(r'[a-z]+\.tar', item['file']) or not re.fullmatch(r'[a-f0-9]{64}', item.get('sha256', '')):
            raise ValueError('Invalid image archive path or fingerprint')
        file = prep.inside(bundle, bundle / item['file'])
        if not file.is_file() or file.stat().st_size != item['bytes'] or prep.digest(file) != item['sha256']:
            raise ValueError('Transfer archive differs: ' + item['file'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[3]
    frozen = verify_sources(root)
    bundle = args.bundle.resolve()
    transfer = json.loads((bundle / 'images.transfer.json').read_text(encoding='utf-8-sig'))
    verify_transfer(bundle, transfer, frozen['images'])
    if args.verify_only:
        print(json.dumps({'status': 'archive_hashes_verified', 'image_count': 5, 'images_loaded': False}))
        return
    if sys.platform != 'linux':
        raise ValueError('Image loading bootstrap requires Linux; --verify-only is portable')
    docker = ['docker', '--host', 'unix:///var/run/docker.sock']
    for item in transfer['images']:
        # Every archive is verified before the first daemon mutation.
        subprocess.run(docker + ['image', 'load', '--input', str(bundle / item['file'])], check=True)
    for item in frozen['images']:
        output = subprocess.check_output(docker + ['image', 'inspect', item['reference']], text=True)
        info = json.loads(output)[0]
        if image_fingerprint(info) != item['config_fingerprint']:
            raise ValueError('Loaded image content differs: ' + item['id'])
    print(json.dumps({'status': 'loaded_and_content_verified', 'image_count': 5,
                      'gpu_access_requested': False, 'inference_run': False}))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
