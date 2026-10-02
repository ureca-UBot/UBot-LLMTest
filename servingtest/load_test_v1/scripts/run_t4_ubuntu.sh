#!/usr/bin/env bash
# Ubuntu 24.04 LTS: 기존 엔진·모델 검사 → 순차 측정 → 요약.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKGROUND=0
READ_ONLY=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --background) BACKGROUND=1 ;;
    --dry-run|--help|-h) READ_ONLY=1; ARGS+=("$arg") ;;
    *) ARGS+=("$arg") ;;
  esac
done
if ! command -v python3 >/dev/null 2>&1; then
  echo "이미 설치된 python3가 필요합니다. 이 스크립트는 설치하지 않습니다." >&2
  exit 1
fi
if [[ $BACKGROUND == 1 && $READ_ONLY == 0 ]]; then
  if [[ "$(uname -s)" != Linux ]]; then
    echo "실제 실행은 Ubuntu 24.04 T4 서버에서만 가능합니다." >&2
    exit 1
  fi
  LOG_DIR="$SCRIPT_DIR/../automation_logs"
  mkdir -p "$LOG_DIR"
  LOG="$LOG_DIR/t4_$(TZ=Asia/Seoul date +%Y%m%d_%H%M%S)_$$.log"
  nohup python3 -u "$SCRIPT_DIR/run_t4.py" "${ARGS[@]}" >"$LOG" 2>&1 < /dev/null &
  PID=$!
  echo "자동 실행 PID: $PID"
  echo "진행 확인: tail -f '$LOG'"
  echo "정상 중단: kill -TERM $PID"
  exit 0
fi
exec python3 -u "$SCRIPT_DIR/run_t4.py" "${ARGS[@]}"
