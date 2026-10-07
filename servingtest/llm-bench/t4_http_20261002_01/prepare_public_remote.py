import json
from pathlib import Path
import shutil
import subprocess
import sys

root = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
source = root / 'source'
candidate = sys.argv[1]
assert candidate in {'llamacpp_p4', 'vllm_s8'}
assert not (source / 'load_test_v2/.benchmark.lock').exists()
gpu = subprocess.check_output(['nvidia-smi', '--query-gpu=uuid,memory.used', '--format=csv,noheader,nounits'], text=True).strip()
assert gpu == 'GPU-8ef9c6ba-71c3-2bf1-3fd6-a4b1ed5d0065, 0'
free = shutil.disk_usage(root).free
minimum = (10 if candidate == 'llamacpp_p4' else 34) * 1024 ** 3
assert free >= minimum, {'free_bytes': free, 'minimum': minimum}
before_ids = sorted(set(subprocess.check_output(['docker', 'image', 'ls', '-q', '--no-trunc'], text=True).split()))
receipt_file = root / (candidate + '_image_preparation.json')
assert not receipt_file.exists()
receipt = {'candidate': candidate, 'before_image_ids': before_ids, 'free_before_bytes': free, 'status': 'preparing'}
receipt_file.write_text(json.dumps(receipt, indent=2))
print(json.dumps({'event': 'public_image_prepare', 'candidate': candidate, 'free_gib': round(free / 1024 ** 3, 2)}), flush=True)
with (root / (candidate + '_image_preparation.log')).open('x') as log:
    result = subprocess.run(['python3', str(source / 'load_test_v2/scripts/cloud/bootstrap_images.py'), '--bundle', str(root / 'transfer'), '--candidate', candidate, '--pull'], stdout=log, stderr=subprocess.STDOUT)
receipt['exit_code'] = result.returncode
receipt['free_after_bytes'] = shutil.disk_usage(root).free
receipt['status'] = 'verified' if result.returncode == 0 else 'failed'
receipt_file.write_text(json.dumps(receipt, indent=2))
print(json.dumps({'event': 'image_prepared', 'candidate': candidate, 'exit_code': result.returncode, 'free_after_gib': round(receipt['free_after_bytes'] / 1024 ** 3, 2)}), flush=True)
if result.returncode:
    print((root / (candidate + '_image_preparation.log')).read_text()[-4000:], flush=True)
sys.exit(result.returncode)
