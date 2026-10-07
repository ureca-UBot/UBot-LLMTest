import json
from pathlib import Path
import subprocess
import sys

root = Path('/home/ubuntu/llm-bench/t4_http_20261002_01')
source = root / 'source'
assert not (source / 'load_test_v2/.benchmark.lock').exists()
print(json.dumps({'event': 'awq_preparation', 'status': 'starting', 'revision': '74d4bd2bd4bff9cafc9345221320bffb08b406a3'}), flush=True)
with (root / 'awq_preparation.log').open('x') as log:
    result = subprocess.run([str(root / 'prep-venv/bin/python'), str(source / 'load_test_v2/scripts/cloud/prepare_models.py'), '--download', '--model', 'qwen3_4b_awq'], stdout=log, stderr=subprocess.STDOUT, timeout=1200)
print(json.dumps({'event': 'awq_preparation_finished', 'exit_code': result.returncode, 'sha256_verified': result.returncode == 0}), flush=True)
if result.returncode:
    print((root / 'awq_preparation.log').read_text()[-3000:], flush=True)
sys.exit(result.returncode)
