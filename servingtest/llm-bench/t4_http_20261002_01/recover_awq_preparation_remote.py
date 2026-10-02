"""Preserve frozen source/lock; recover only the exact known optional null metadata field."""
import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys
import uuid

root = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
source = root / 'source'
sys.path.insert(0, str(source / 'load_test_v2/scripts/cloud'))
import bootstrap_images as boot
import prepare_models as prep
frozen = boot.verify_sources(source)
assert len(frozen['files']) == 47 and prep.digest(source / 'load_test_v2/config/cloud.lock.json') == '998b52644f29a2628d021f78191c363f513481714db92f6a7d3579feefeeffe7'
recovery_path = root / 'awq_preparation_recovery.json'
assert not recovery_path.exists() and not recovery_path.is_symlink()
lock_path = source / 'load_test_v2/config/models.lock.json'
lock = prep.validate_lock(json.loads(lock_path.read_text()))
prep.verify_template(source, lock)
model = next(x for x in lock['models'] if x['id'] == 'qwen3_4b_awq')
portable = source / 'model_assets/portable'
failed = list(portable.glob('.Qwen3-4B-AWQ.prepare-*'))
assert len(failed) == 1
old = failed[0]
assert old.resolve() == old and not old.is_symlink()
config_path = old / 'config.json'
file_lock = next(x for x in model['files'] if x['path'] == 'config.json')
assert config_path.stat().st_size == file_lock['bytes'] and prep.digest(config_path) == file_lock['sha256'] == 'cf74d40352c502483cca3a94fd8037dce0d7b31c21831f1721ff6ee360b50075'
config = json.loads(config_path.read_text())
actual = config['quantization_config']
expected = model['metadata']['quantization_config']
assert set(actual) - set(expected) == {'modules_to_not_convert'}
assert actual['modules_to_not_convert'] is None
assert {k: v for k, v in actual.items() if k != 'modules_to_not_convert'} == expected
verified_model = copy.deepcopy(model)
verified_model['metadata']['quantization_config']['modules_to_not_convert'] = None
destination = portable / model['portable_subdir']
assert not destination.exists() and not destination.is_symlink()
staging = portable / ('.Qwen3-4B-AWQ.recover-' + str(uuid.uuid4()))
staging.mkdir()
for f in model['files']:
    p = old / f['path']
    assert p.is_file() and not p.is_symlink() and p.stat().st_size == f['bytes'] and prep.digest(p) == f['sha256']
    target = staging / f['path']
    target.parent.mkdir(parents=True, exist_ok=True)
    os.link(p, target)
files = prep.verify_files(staging, verified_model, lock)
receipt = {'schema_version': 1, 'id': model['id'], 'repository': model['repository'], 'revision': model['revision'],
           'model_lock_sha256': prep.digest(lock_path), 'prepared_at': datetime.now(timezone.utc).isoformat(),
           'mode': 'pinned_download_recovery_exact_optional_null_assertion', 'lineage_status': lock['lineage_status'],
           'files': files, 'preparation_validation_note': 'Frozen config SHA matches. All declared quantization metadata matches. The sole additional field modules_to_not_convert is exactly null; no model/config/source/lock bytes changed.',
           'prior_failed_staging_preserved': str(old), 'storage': 'ordinary regular files; hardlinked to verified download to avoid duplicate disk allocation'}
(staging / '.prepared.json').write_text(json.dumps(receipt, indent=2) + '\n')
assert not destination.exists() and not destination.is_symlink() and not recovery_path.exists()
os.rename(staging, destination)
recovery_path.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'event': 'awq_recovered', 'files': len(files), 'all_file_sha256_verified': True, 'additional_field': {'modules_to_not_convert': None}, 'source_and_lock_unchanged': True}), flush=True)
