"""Outer evidence guard for the original idle T4 baseline, independent of runner."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
UUID = 'GPU-8ef9c6ba-71c3-2bf1-3fd6-a4b1ed5d0065'
CANDIDATES = {'ollama_p4', 'llamacpp_p4', 'vllm_s8', 'vllm_s32', 'sglang_r8', 'sglang_r32'}
candidate = sys.argv[1]
assert candidate in CANDIDATES
source = ROOT / 'source'
out = source / 'load_test_v2/results' / ('t4_' + candidate + '_01')
assert not out.exists() and not (source / 'load_test_v2/.benchmark.lock').exists()
evidence_dir = ROOT / 'evidence'
evidence_dir.mkdir(exist_ok=True)
evidence_file = evidence_dir / (candidate + '.json')
assert not evidence_file.exists()
scripts = source / 'load_test_v2/scripts/cloud'
sys.path.insert(0, str(scripts))
import bootstrap_images as boot

def now():
    return datetime.now(timezone.utc).isoformat()

def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(8388608), b''):
            h.update(b)
    return h.hexdigest()

def production():
    ids = subprocess.check_output(['docker', 'ps', '-q'], text=True).split()
    rows = json.loads(subprocess.check_output(['docker', 'inspect', *ids], text=True)) if ids else []
    return sorted([{'id': r['Id'], 'name': r['Name'], 'started_at': r['State']['StartedAt'], 'pid': r['State']['Pid'], 'running': r['State']['Running']} for r in rows], key=lambda r: r['id'])

def samples():
    result = []
    for i in range(3):
        line = subprocess.check_output(['nvidia-smi', '--query-gpu=uuid,name,memory.used,memory.total,driver_version', '--format=csv,noheader,nounits'], text=True).strip()
        values = [v.strip() for v in line.split(',')]
        assert len(values) == 5
        gpu = dict(zip(['uuid', 'name', 'memory_used_mib', 'memory_total_mib', 'driver_version'], values))
        for key in ['memory_used_mib', 'memory_total_mib']:
            gpu[key] = int(gpu[key])
        pids = subprocess.check_output(['nvidia-smi', '--query-compute-apps=pid', '--format=csv,noheader,nounits'], text=True).split()
        result.append({'observed_at': now(), 'gpu': gpu, 'compute_pids': pids})
        assert gpu == {'uuid': UUID, 'name': 'Tesla T4', 'memory_used_mib': 0, 'memory_total_mib': 15360, 'driver_version': '595.91.07'} and not pids, result[-1]
        if i < 2:
            time.sleep(1)
    return result

boot.verify_sources(source)
before = json.loads((ROOT / 'production_before.json').read_text())
assert production() == before
data = {'schema_version': 1, 'candidate': candidate, 'captured_at': now(),
        'source_zip_sha256': digest(ROOT / 'transfer/source.zip'),
        'source_lock_sha256': digest(source / 'load_test_v2/config/cloud.lock.json'),
        'files47_verified': True,
        'models_lock_sha256': digest(source / 'load_test_v2/config/models.lock.json'),
        'images_lock_sha256': digest(source / 'load_test_v2/config/images.lock.json'),
        'profile_sha256': digest(source / 'load_test_v2/config/http.t4.json'),
        'initial_experiment_baseline_mib': 0, 'gpu_uuid': UUID,
        'preflight_samples': samples(), 'production_state_unchanged': True}
model_lock = json.loads((source / 'load_test_v2/config/models.lock.json').read_text())
model_id = 'qwen3_4b_gguf_q4km' if candidate in {'ollama_p4', 'llamacpp_p4'} else 'qwen3_4b_awq'
model = next(x for x in model_lock['models'] if x['id'] == model_id)
receipt_path = source / 'model_assets/portable' / model['portable_subdir'] / '.prepared.json'
model_receipt = json.loads(receipt_path.read_text())
assert model_receipt['schema_version'] == 1 and model_receipt['id'] == model_id
assert model_receipt['lineage_status'] == model_lock['lineage_status']
assert model_receipt['mode'] in {'pinned_snapshot_download', 'offline_cache_materialization', 'pinned_download_recovery_exact_optional_null_assertion'}
assert model_receipt['repository'] == model['repository'] and model_receipt['revision'] == model['revision']
assert model_receipt['model_lock_sha256'] == data['models_lock_sha256']
assert len(model_receipt['files']) == len(model['files'])
for f in model['files']:
    observed = next(x for x in model_receipt['files'] if x['path'] == f['path'])
    assert all(observed[k] == v for k, v in f.items()) and observed['actual_sha256'] == f['sha256']
data['model_preparation_receipts'] = [{'model_id': model_id, 'receipt_sha256': digest(receipt_path), 'mode': model_receipt['mode'], 'external_receipt_fields_verified': True, 'runtime_actual_files_sha_verification': 'separately_required_by_frozen_node_preflight'}]
if model_receipt['mode'] == 'pinned_download_recovery_exact_optional_null_assertion':
    recovery_path = ROOT / 'awq_preparation_recovery.json'
    assert digest(recovery_path) == digest(receipt_path)
    config = json.loads((receipt_path.parent / 'config.json').read_text())
    expected_quant = dict(model['metadata']['quantization_config'], modules_to_not_convert=None)
    assert config['quantization_config'] == expected_quant
    data['awq_preparation_recovery_sha256'] = digest(recovery_path)
assert data['source_zip_sha256'] == '9c07cdb67efc3bb90d6f47f9e785db9d56e018bbe8454be3850b90d8732d35ec'
assert data['source_lock_sha256'] == '998b52644f29a2628d021f78191c363f513481714db92f6a7d3579feefeeffe7'
evidence_file.write_text(json.dumps(data, indent=2) + '\n')
print(json.dumps({'event': 'outer_preflight_passed', 'candidate': candidate, 'gpu_uuid': UUID, 'baseline_mib': 0, 'stable_samples': 3}), flush=True)
with (ROOT / (candidate + '_console.log')).open('x') as log:
    proc = subprocess.Popen(['bash', str(scripts / 'run_t4.sh'), '--candidate', candidate, '--gpu-mode', 'cdi', '--out', str(out)], cwd=source, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    for line in proc.stdout:
        log.write(line)
        log.flush()
        print(line, end='', flush=True)
    proc.wait()
data['run_exit_code'] = proc.returncode
data['finished_at'] = now()
try:
    data['postflight_samples'] = samples()
except Exception as error:
    data['postflight_error'] = str(error)
try:
    data['production_state_unchanged'] = production() == before
    report = out / 'report.json'
    data['report_sha256'] = digest(report) if report.exists() else None
finally:
    evidence_file.write_text(json.dumps(data, indent=2) + '\n')
assert data['production_state_unchanged'] and 'postflight_error' not in data
print(json.dumps({'event': 'outer_postflight_passed', 'candidate': candidate, 'run_exit_code': proc.returncode, 'gpu_baseline_mib': 0, 'production_state_unchanged': True}), flush=True)
sys.exit(proc.returncode)
