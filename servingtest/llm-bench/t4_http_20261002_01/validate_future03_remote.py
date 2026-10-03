"""Validate future preparation code against actual files without changing source02."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
import zipfile

ROOT = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
SOURCE = ROOT / 'source'
ZIP = ROOT / 'future03_source.zip'
DEST = ROOT / 'future03_validation'
RECEIPT = ROOT / 'future03_validation.json'
assert ROOT.resolve() == ROOT and not ROOT.is_symlink()
assert not (SOURCE / 'load_test_v2/.benchmark.lock').exists()
assert not DEST.exists() and not RECEIPT.exists()

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(8388608), b''):
            h.update(chunk)
    return h.hexdigest()

assert ZIP.resolve() == ZIP and not ZIP.is_symlink()
assert ZIP.stat().st_size == 214506
assert digest(ZIP) == '9a2bd345a38cf6d91fedc29302db38806db17e728ebc3a5fe4dbda3cd63390b9'
sys.path.insert(0, str(SOURCE / 'load_test_v2/scripts/cloud'))
import bootstrap_images as old_boot
old_boot.verify_sources(SOURCE)
old_lock_sha = digest(SOURCE / 'load_test_v2/config/cloud.lock.json')
assert old_lock_sha == '998b52644f29a2628d021f78191c363f513481714db92f6a7d3579feefeeffe7'
with zipfile.ZipFile(ZIP) as archive:
    names = archive.namelist()
    assert len(names) == len(set(names)) == 48
    for name in names:
        p = PurePosixPath(name)
        assert not p.is_absolute() and '..' not in p.parts and '\\' not in name
        assert not archive.getinfo(name).is_dir()
    DEST.mkdir()
    archive.extractall(DEST)
new_lock = json.loads((DEST / 'load_test_v2/config/cloud.lock.json').read_text())
assert digest(DEST / 'load_test_v2/config/cloud.lock.json') == '0e37e0578c0c7f8925150312d814b4e216018de1b87d3e8bf6ee4176fe340b6d'
files = new_lock['files']
assert len(files) == 47
assert set(names) == {item['path'] for item in files} | {'load_test_v2/config/cloud.lock.json'}
for item in files:
    p = DEST / item['path']
    assert p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(DEST)
    assert digest(p) == item['sha256']
result = subprocess.run([sys.executable, '-B', str(DEST / 'load_test_v2/scripts/cloud/prepare_models.py'),
                         '--lock', str(SOURCE / 'load_test_v2/config/models.lock.json'),
                         '--root', str(SOURCE), '--model', 'qwen3_4b_awq', '--validate-only'],
                        capture_output=True, text=True)
receipt = {'schema_version': 1, 'source02_lock_sha256': old_lock_sha,
           'future03_zip_sha256': digest(ZIP), 'future03_files47_verified': True,
           'mode': 'read_only_actual_awq_validate_only_no_inference',
           'exit_code': result.returncode, 'stderr': result.stderr,
           'validation': json.loads(result.stdout) if result.returncode == 0 else result.stdout}
old_boot.verify_sources(SOURCE)
receipt['source02_unchanged_after_validation'] = digest(SOURCE / 'load_test_v2/config/cloud.lock.json') == old_lock_sha
RECEIPT.write_text(json.dumps(receipt, indent=2) + '\n')
assert result.returncode == 0 and receipt['source02_unchanged_after_validation'], receipt
print(json.dumps({'event': 'future03_actual_awq_validation', 'status': 'passed', 'files': len(receipt['validation']['models'][0]['files']), 'source02_unchanged': True}))
