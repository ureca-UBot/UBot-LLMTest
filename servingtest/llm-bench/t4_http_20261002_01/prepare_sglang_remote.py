"""Load the exact frozen custom image from a verified gzip without a second tar copy."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

root = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
assert root.resolve() == root and not root.is_symlink()
source = root / 'source'
assert not (source / 'load_test_v2/.benchmark.lock').exists()
gpu = subprocess.check_output(['nvidia-smi', '--query-gpu=uuid,memory.used', '--format=csv,noheader,nounits'], text=True).strip()
assert gpu == 'GPU-8ef9c6ba-71c3-2bf1-3fd6-a4b1ed5d0065, 0'
sys.path.insert(0, str(source / 'load_test_v2/scripts/cloud'))
import bootstrap_images as boot
frozen = boot.verify_sources(source)
entry = next(x for x in frozen['images'] if x['id'] == 'sglang')
transfer = root / 'transfer'
boot.verify_transfer(transfer, json.loads((transfer / 'images.transfer.json').read_text()), frozen['images'], {'runner'})
archive = transfer / 'sglang.tar.gz'
assert archive.resolve() == archive and archive.is_file() and not archive.is_symlink()
compressed_bytes = 8783194576
compressed_sha = '06c1e1de935d00f87f5fda06de74592516f5afe7a26a5c169849bae691efe35d'
tar_bytes = 8809637376
tar_sha = '014e3d7f8f5d790d17f4ca0443496882e1ac0130ad168d47e1c698c7485f13ac'
metadata = next(x for x in json.loads((transfer / 'images.transfer.json').read_text())['images'] if x['id'] == 'sglang')
assert metadata['sha256'] == tar_sha and metadata['bytes'] == tar_bytes and metadata['config_fingerprint'] == entry['config_fingerprint']
assert archive.stat().st_size == compressed_bytes
print(json.dumps({'event': 'sglang_archive_verification', 'phase': 'compressed_sha'}), flush=True)
assert boot.prep.digest(archive) == compressed_sha
h = hashlib.sha256()
count = 0
print(json.dumps({'event': 'sglang_archive_verification', 'phase': 'exact_original_tar_sha_without_publishing_tar'}), flush=True)
with gzip.open(archive, 'rb') as stream:
    for chunk in iter(lambda: stream.read(8388608), b''):
        h.update(chunk)
        count += len(chunk)
assert h.hexdigest() == tar_sha and count == tar_bytes
# The source archive is already on disk. Require store + exact unpacked tar
# stream + 2 GiB reserve; real snapshot allocation/metadata remains observable.
required_free = 8809583800 + 17055615488 + 2 * 1024 ** 3
free = shutil.disk_usage(root).free
assert free >= required_free, {'free_bytes': free, 'minimum': required_free}
docker = ['docker', '--host', 'unix:///var/run/docker.sock']
existing = subprocess.run(docker + ['image', 'inspect', entry['reference']], capture_output=True, text=True)
assert existing.returncode != 0 and 'No such image' in existing.stderr, 'Refuse to overwrite an existing frozen reference'
docker_root = subprocess.check_output(docker + ['info', '--format', '{{.DockerRootDir}}'], text=True).strip()
assert os.stat(root).st_dev == os.stat(docker_root).st_dev == os.stat('/var/lib/containerd').st_dev
before_ids = sorted(set(subprocess.check_output(docker + ['image', 'ls', '-q', '--no-trunc'], text=True).split()))
receipt_file = root / 'sglang_r8_image_preparation.json'
assert not receipt_file.exists()
receipt = {'candidate': 'sglang_r8', 'before_image_ids': before_ids, 'free_before_bytes': free, 'status': 'preparing', 'archive_sha256': compressed_sha, 'compressed_bytes': compressed_bytes, 'required_free_bytes': required_free, 'docker_root': docker_root, 'same_filesystem_verified': True, 'compressed_sha_verified': True, 'original_tar_sha_verified': True, 'original_tar_sha256': tar_sha, 'original_tar_bytes': count, 'preparation': 'same_frozen_archive_gzip_verified_and_direct_loaded'}
receipt_file.write_text(json.dumps(receipt, indent=2))
print(json.dumps({'event': 'sglang_image_load', 'free_gib': round(free / 1024 ** 3, 2)}), flush=True)
stage = 'docker_load'
try:
    with (root / 'sglang_r8_image_preparation.log').open('x') as log:
        result = subprocess.run(docker + ['image', 'load', '--input', str(archive)], stdout=log, stderr=subprocess.STDOUT)
    receipt['docker_load_exit_code'] = result.returncode
    assert result.returncode == 0, 'Docker load failed; inspect preparation log'
    stage = 'portable_image_fingerprint'
    info = json.loads(subprocess.check_output(docker + ['image', 'inspect', entry['reference']], text=True))[0]
    assert boot.image_fingerprint(info) == entry['config_fingerprint']
    assert info['Id'] not in before_ids
    receipt.update(image_id=info['Id'], config_fingerprint=entry['config_fingerprint'], portable_fingerprint_verified=True)
    stage = 'owned_uploaded_gzip_cleanup'
    assert archive.resolve() == archive and not archive.is_symlink()
    archive.unlink()
    receipt.update(status='verified', exit_code=0, owned_uploaded_gzip_removed_after_verification=True)
except Exception as error:
    receipt.update(status='failed', exit_code=1, failure_stage=stage, error=str(error))
finally:
    receipt['free_after_bytes'] = shutil.disk_usage(root).free
    receipt_file.write_text(json.dumps(receipt, indent=2))
print(json.dumps({'event': 'sglang_prepared', 'status': receipt['status'], 'free_gib': round(receipt['free_after_bytes'] / 1024 ** 3, 2)}), flush=True)
sys.exit(receipt['exit_code'])
