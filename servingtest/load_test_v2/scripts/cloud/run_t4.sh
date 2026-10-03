#!/usr/bin/env bash
set -euo pipefail

# Run only the pinned Node/Docker CLI wrapper. Its source bind uses the same
# absolute path on host and in the wrapper: Docker interprets engine mount
# sources on the host, rather than in this runner container.
if [[ "$(uname -s)" != Linux ]]; then
  printf '%s\n' 'The T4 launcher requires Linux.' >&2
  exit 1
fi
case "$(uname -m)" in
  x86_64|amd64) ;;
  *) printf '%s\n' 'The frozen runner requires linux/amd64.' >&2; exit 1 ;;
esac
command -v python3 >/dev/null || { printf '%s\n' 'Install host Python 3 to read the image lock.' >&2; exit 1; }
command -v docker >/dev/null || { printf '%s\n' 'Install host Docker CLI and load the frozen images.' >&2; exit 1; }
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd -P)"
case "$PROJECT_ROOT" in
  *,*) printf '%s\n' 'The workspace path cannot contain a comma in a Docker bind mount.' >&2; exit 1 ;;
esac

DRY_RUN=false
HAS_CONFIG=false
HAS_MANIFEST=false
GPU_MODE=gpus
HAS_GPU_MODE=false
NODE_ARGS=()
while (($#)); do
  case "$1" in
    --dry-run)
      if [[ "$DRY_RUN" == true ]]; then printf '%s\n' 'Duplicate --dry-run.' >&2; exit 1; fi
      DRY_RUN=true; NODE_ARGS+=("$1"); shift ;;
    --gpu-mode)
      if [[ "$HAS_GPU_MODE" == true ]]; then printf '%s\n' 'Duplicate --gpu-mode.' >&2; exit 1; fi
      if (($# < 2)) || [[ "$2" != gpus && "$2" != cdi ]]; then printf '%s\n' 'GPU mode must be gpus or cdi.' >&2; exit 1; fi
      GPU_MODE="$2"; HAS_GPU_MODE=true; NODE_ARGS+=("$1" "$2"); shift 2 ;;
    --config|--manifest|--out|--candidate)
      if (($# < 2)) || [[ "$2" == --* ]]; then printf '%s\n' "Missing value for $1." >&2; exit 1; fi
      [[ "$1" != --config ]] || HAS_CONFIG=true
      [[ "$1" != --manifest ]] || HAS_MANIFEST=true
      NODE_ARGS+=("$1" "$2"); shift 2 ;;
    *) printf '%s\n' 'Use run_t4.sh [--dry-run] [--config FILE] [--manifest FILE] [--out NEW_DIRECTORY] [--candidate ID] [--gpu-mode gpus|cdi].' >&2; exit 1 ;;
  esac
done
[[ "$HAS_CONFIG" == true ]] || NODE_ARGS+=(--config "$PROJECT_ROOT/load_test_v2/config/http.t4.json")
[[ "$HAS_MANIFEST" == true ]] || NODE_ARGS+=(--manifest "$PROJECT_ROOT/load_test_v2/config/cloud.lock.json")

# Verify before executing even the runner image. Docker Desktop's OCI index ID
# can differ after loading into a classic Linux daemon, so compare the portable
# content identity, then launch the locally observed immutable image ID.
RUNNER_IMAGE_ID="$(python3 - "$PROJECT_ROOT" <<'PY'
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1])
lock = json.loads((root / 'load_test_v2/config/images.lock.json').read_text(encoding='utf-8-sig'))
matches = [item for item in lock.get('images', []) if item.get('id') == 'runner']
if len(matches) != 1:
    raise SystemExit('Exactly one frozen runner image is required.')
item = matches[0]
if not re.fullmatch(r'llm-frozen/runner:[a-z0-9-]+', item.get('reference', '')):
    raise SystemExit('Invalid frozen runner reference.')
try:
    result = subprocess.run(['docker', '--host', 'unix:///var/run/docker.sock', 'image', 'inspect', item['reference']],
                            capture_output=True, text=True, timeout=30, check=True)
    info = json.loads(result.stdout)[0]
except (subprocess.SubprocessError, ValueError, IndexError) as error:
    raise SystemExit(f'Load the frozen runner image first: {error}')
if (info.get('Os') != 'linux' or info.get('Architecture') != 'amd64'
        or info.get('RootFS', {}).get('Type') != 'layers' or not info.get('RootFS', {}).get('Layers')
        or any(not re.fullmatch(r'sha256:[a-f0-9]{64}', layer) for layer in info['RootFS']['Layers'])):
    raise SystemExit('The runner must be a complete linux/amd64 image.')
fields = ['User', 'Env', 'Entrypoint', 'Cmd', 'WorkingDir', 'ExposedPorts', 'Volumes', 'Labels',
          'Healthcheck', 'StopSignal', 'Shell', 'OnBuild', 'ArgsEscaped']
identity = {'os': info['Os'], 'architecture': info['Architecture'], 'variant': info.get('Variant') or '',
            'created': info['Created'], 'rootfs': {'type': 'layers', 'layers': info['RootFS']['Layers']},
            'config': {field: info.get('Config', {}).get(field) for field in fields}}
encoded = json.dumps(identity, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
if hashlib.sha256(encoded).hexdigest() != item.get('config_fingerprint'):
    raise SystemExit('The loaded runner image content differs from the frozen lock.')
if not re.fullmatch(r'sha256:[a-f0-9]{64}', info.get('Id', '')):
    raise SystemExit('The runner has no usable immutable local image ID.')
print(info['Id'])
PY
)"

DOCKER_ARGS=(--host unix:///var/run/docker.sock run --rm --pull never --platform linux/amd64 --init --stop-timeout 180)
if [[ "$DRY_RUN" == true ]]; then
  DOCKER_ARGS+=(--network none -e NVIDIA_VISIBLE_DEVICES=void
    --mount "type=bind,source=$PROJECT_ROOT,target=$PROJECT_ROOT,readonly")
  printf '%s\n' 'Dry run starts only the frozen wrapper: no GPU, Docker socket, or network is exposed; Node performs read-only validation.' >&2
else
  [[ -S /var/run/docker.sock ]] || { printf '%s\n' 'A local /var/run/docker.sock is required.' >&2; exit 1; }
  DOCKER_ARGS+=(--network host --pid host -e NVIDIA_DRIVER_CAPABILITIES=utility
    --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock
    --mount "type=bind,source=$PROJECT_ROOT,target=$PROJECT_ROOT")
  if [[ "$GPU_MODE" == cdi ]]; then
    DOCKER_ARGS+=(--device nvidia.com/gpu=all)
  else
    DOCKER_ARGS+=(--gpus all)
  fi
fi
DOCKER_ARGS+=(--workdir "$PROJECT_ROOT" --entrypoint node "$RUNNER_IMAGE_ID"
  load_test_v2/scripts/cloud/run_http_exploration.js "${NODE_ARGS[@]}")
exec docker "${DOCKER_ARGS[@]}"
