import json
from pathlib import Path
import shutil
import subprocess
import sys

root = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
source = root / 'source'
candidate = sys.argv[1]
mapping = {'llamacpp_p4': ('llamacpp', ['llamacpp_p4']), 'vllm_s8': ('vllm', ['vllm_s8', 'vllm_s32']), 'sglang_r8': ('sglang', ['sglang_r8', 'sglang_r32'])}
assert candidate in mapping
image_key, completed = mapping[candidate]
path = root / (candidate + '_image_cleanup.json')
assert not path.exists()
assert not (source / 'load_test_v2/.benchmark.lock').exists()
for name in completed:
    evidence = json.loads((root / 'evidence' / (name + '.json')).read_text())
    assert evidence['production_state_unchanged'] and 'postflight_error' not in evidence
    assert len(evidence['postflight_samples']) == 3
    assert all(s['gpu']['memory_used_mib'] == 0 and not s['compute_pids'] for s in evidence['postflight_samples'])
    report = json.loads((source / 'load_test_v2/results' / ('t4_' + name + '_01') / 'report.json').read_text())
    assert not report['lock_retained']
    assert all(r['lifecycle_verified'] and r['gpu_released'] for r in report['candidates'])
prep = json.loads((root / (candidate + '_image_preparation.json')).read_text())
assert prep['status'] == 'verified'
lock = json.loads((source / 'load_test_v2/config/images.lock.json').read_text())
entry = next(x for x in lock['images'] if x['id'] == image_key)
docker = ['docker', '--host', 'unix:///var/run/docker.sock']
info = json.loads(subprocess.check_output(docker + ['image', 'inspect', entry['reference']], text=True))[0]
sys.path.insert(0, str(source / 'load_test_v2/scripts/cloud'))
import bootstrap_images as boot
assert boot.image_fingerprint(info) == entry['config_fingerprint']
for name in completed:
    report = json.loads((source / 'load_test_v2/results' / ('t4_' + name + '_01') / 'report.json').read_text())
    assert report['docker_images']['verified']
    observed = next(x for x in report['docker_images']['images'] if x['id'] == image_key)
    assert observed['verified'] and observed['image_id'] == info['Id'] and observed['config_fingerprint'] == entry['config_fingerprint']
assert info['Id'] not in prep['before_image_ids'], 'Refuse to remove a preexisting image'
ids = subprocess.check_output(docker + ['ps', '-aq'], text=True).split()
containers = json.loads(subprocess.check_output(docker + ['inspect', *ids], text=True)) if ids else []
assert not any(c['Image'] == info['Id'] for c in containers), 'A container still refers to this image'
refs = list(info.get('RepoTags') or []) + list(info.get('RepoDigests') or [])
expected = {entry['reference']} | ({entry['source_digest']} if entry.get('source_digest') else set())
if entry.get('source_digest'):
    expected.add(entry['reference'].rsplit(':', 1)[0] + '@' + entry['source_digest'].rsplit('@', 1)[1])
assert set(refs) == expected, {'unexpected_references': refs, 'expected': list(expected)}
receipt = {'candidate': candidate, 'image_id': info['Id'], 'removed_references': refs, 'ownership': 'image_absent_before_this_experiment_preparation', 'free_before_bytes': shutil.disk_usage(root).free}
receipt['removal_commands'] = []
for reference in dict.fromkeys(refs):
    current = subprocess.run(docker + ['image', 'inspect', reference], capture_output=True, text=True)
    if current.returncode != 0:
        assert 'No such image' in current.stderr
        continue
    current_info = json.loads(current.stdout)[0]
    assert current_info['Id'] == info['Id'] and boot.image_fingerprint(current_info) == entry['config_fingerprint']
    result = subprocess.run(docker + ['image', 'rm', '--no-prune', reference], capture_output=True, text=True)
    receipt['removal_commands'].append({'reference': reference, 'exit_code': result.returncode, 'output': result.stdout + result.stderr})
    if result.returncode:
        break
receipt['exit_code'] = next((r['exit_code'] for r in receipt['removal_commands'] if r['exit_code']), 0)
receipt['absence_checks'] = []
for reference in refs + [info['Id']]:
    check = subprocess.run(docker + ['image', 'inspect', reference], capture_output=True, text=True)
    receipt['absence_checks'].append({'reference': reference, 'absent': check.returncode != 0 and 'No such image' in check.stderr})
receipt['free_after_bytes'] = shutil.disk_usage(root).free
path.write_text(json.dumps(receipt, indent=2))
assert receipt['exit_code'] == 0, receipt['removal_commands']
assert all(c['absent'] for c in receipt['absence_checks']), 'Image removal was not confirmed'
print(json.dumps({'event': 'owned_image_removed', 'image': image_key, 'free_gib': round(receipt['free_after_bytes'] / 1024 ** 3, 2)}), flush=True)
