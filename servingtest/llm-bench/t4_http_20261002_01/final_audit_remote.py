"""Record final read-only state after all six authorized T4 candidates finish."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time

ROOT = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
SOURCE = ROOT / 'source'
OUTPUT = ROOT / 'final_remote_audit.json'
assert ROOT.resolve() == ROOT and not ROOT.is_symlink() and not OUTPUT.exists()
sys.path.insert(0, str(SOURCE / 'load_test_v2/scripts/cloud'))
import bootstrap_images as boot
boot.verify_sources(SOURCE)

def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as stream:
        for chunk in iter(lambda: stream.read(8388608), b''):
            h.update(chunk)
    return h.hexdigest()

def command(args):
    return subprocess.check_output(args, text=True).strip()

ids = command(['docker', 'ps', '-aq']).split()
containers = json.loads(command(['docker', 'inspect', *ids])) if ids else []
running = sorted([{'id': x['Id'], 'name': x['Name'], 'started_at': x['State']['StartedAt'],
                   'pid': x['State']['Pid'], 'running': x['State']['Running']}
                  for x in containers if x['State']['Running']], key=lambda x: x['id'])
before = json.loads((ROOT / 'production_before.json').read_text())
owned = [{'id': x['Id'], 'name': x['Name']} for x in containers
         if x['Name'].lstrip('/').startswith('llm-benchmark-v2-')
         or any(m.get('Source', '').startswith(str(SOURCE)) for m in x.get('Mounts', []))]
samples = []
for i in range(3):
    values = [x.strip() for x in command(['nvidia-smi', '--query-gpu=uuid,name,memory.used,memory.total,driver_version', '--format=csv,noheader,nounits']).split(',')]
    assert len(values) == 5
    gpu = dict(zip(['uuid', 'name', 'memory_used_mib', 'memory_total_mib', 'driver_version'], values))
    gpu['memory_used_mib'] = int(gpu['memory_used_mib'])
    gpu['memory_total_mib'] = int(gpu['memory_total_mib'])
    samples.append({'observed_at': datetime.now(timezone.utc).isoformat(), 'gpu': gpu,
                    'compute_pids': command(['nvidia-smi', '--query-compute-apps=pid', '--format=csv,noheader,nounits']).split()})
    if i < 2:
        time.sleep(1)
profile = json.loads((SOURCE / 'load_test_v2/config/http.t4.json').read_text())
ports = sorted({int(x['host'].rsplit(':', 1)[1]) for x in profile['candidates']})
port_checks = []
for port in ports:
    with socket.socket() as sock:
        try:
            sock.bind(('0.0.0.0', port))
            port_checks.append({'port': port, 'available': True})
        except OSError as error:
            port_checks.append({'port': port, 'available': False, 'error': str(error)})
packages = ['libnvidia-container1', 'libnvidia-container-tools', 'nvidia-container-toolkit-base', 'nvidia-container-toolkit']
versions = {p: command(['dpkg-query', '-W', '-f=${Version}', p]) for p in packages}
repo = '/home/ubuntu/UBot-LLMTest'
reports = []
for candidate in profile['candidates']:
    cid = candidate['id']
    report_path = SOURCE / 'load_test_v2/results' / ('t4_' + cid + '_01') / 'report.json'
    evidence_path = ROOT / 'evidence' / (cid + '.json')
    report = json.loads(report_path.read_text())
    evidence = json.loads(evidence_path.read_text())
    reports.append({'candidate': cid, 'report_sha256': digest(report_path), 'evidence_report_sha_matches': digest(report_path) == evidence['report_sha256'],
                    'status': report['status'], 'outer_exit_code': evidence['run_exit_code'],
                    'production_state_unchanged': evidence['production_state_unchanged'], 'lock_retained': report['lock_retained']})
data = {'schema_version': 1, 'captured_at': datetime.now(timezone.utc).isoformat(),
        'source02_files47_verified': True, 'source02_lock_sha256': digest(SOURCE / 'load_test_v2/config/cloud.lock.json'),
        'production_before': before, 'production_after': running, 'production_state_unchanged': running == before,
        'owned_experiment_containers': owned, 'gpu_samples': samples, 'experiment_ports': port_checks,
        'benchmark_lock_present': (SOURCE / 'load_test_v2/.benchmark.lock').exists(), 'toolkit_package_versions': versions,
        'cdi_spec_sha256': digest(Path('/var/run/cdi/nvidia.yaml')), 'cdi_devices': command(['nvidia-ctk', 'cdi', 'list']),
        'original_clone_head': command(['git', '-C', repo, 'rev-parse', 'HEAD']),
        'original_clone_branch': command(['git', '-C', repo, 'branch', '--show-current']),
        'original_clone_status': command(['git', '--no-optional-locks', '-C', repo, 'status', '--porcelain']),
        'free_disk_gib': round(shutil.disk_usage(ROOT).free / 1024 ** 3, 3), 'reports': reports}
data['passed'] = (data['source02_lock_sha256'] == '998b52644f29a2628d021f78191c363f513481714db92f6a7d3579feefeeffe7'
                  and data['production_state_unchanged'] and not owned and not data['benchmark_lock_present']
                  and all(x['available'] for x in port_checks) and all(v == '1.20.1-1' for v in versions.values())
                  and data['original_clone_head'].startswith('9f837b36') and data['original_clone_branch'] == 'serving'
                  and not data['original_clone_status']
                  and all(x['gpu'] == {'uuid': 'GPU-8ef9c6ba-71c3-2bf1-3fd6-a4b1ed5d0065', 'name': 'Tesla T4', 'memory_used_mib': 0, 'memory_total_mib': 15360, 'driver_version': '595.91.07'} and not x['compute_pids'] for x in samples)
                  and all(x['evidence_report_sha_matches'] and x['outer_exit_code'] == 0 and x['production_state_unchanged'] and not x['lock_retained'] for x in reports))
OUTPUT.write_text(json.dumps(data, indent=2) + '\n')
print(json.dumps({'event': 'final_remote_audit', 'passed': data['passed'], 'gpu_mib': [x['gpu']['memory_used_mib'] for x in samples], 'production_unchanged': data['production_state_unchanged'], 'owned_containers': len(owned), 'free_disk_gib': data['free_disk_gib']}))
sys.exit(0 if data['passed'] else 1)
