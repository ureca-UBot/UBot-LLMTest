#!/usr/bin/env bash
# 부하 테스트 전체 실행: 측정 → 요약. 화면 출력은 로그 파일에도 그대로 남긴다.
#
# Usage (저장소 루트에서, SSH가 끊겨도 계속 돌도록 tmux 안에서 실행 권장):
#   bash load_test_v1/scripts/run_all.sh                 # 정식 측정
#   bash load_test_v1/scripts/run_all.sh --dry-run       # 계획·예상 시간만 출력
#   RUN_DATE=20261001 bash load_test_v1/scripts/run_all.sh   # 끊긴 측정을 이어서 (같은 날짜 지정)
#
# 추가 인자는 run_load_test.js에 그대로 전달된다.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TRY="${LLM_TEST_TRY:-try1}"
DATE="${RUN_DATE:-$(date +%Y%m%d)}"
LOG_DIR="$ROOT/load_test_v1/$TRY/results/raw/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/load_${DATE}_$(date +%H%M%S).log"

PROFILE_ARGS=()
for a in "$@"; do
  if [[ "$a" == "quick" ]]; then PROFILE_ARGS=(--profile quick); fi
done

echo "로그: $LOG"
cd "$ROOT"

node "$SCRIPT_DIR/run_load_test.js" --run-date "$DATE" "$@" 2>&1 | tee -a "$LOG"
STATUS=${PIPESTATUS[0]}

for a in "$@"; do
  if [[ "$a" == "--dry-run" || "$a" == "--restore-ollama" ]]; then exit "$STATUS"; fi
done

# 측정이 중간에 실패해도 그때까지의 결과는 요약한다.
node "$SCRIPT_DIR/summarize.js" --run-date "$DATE" "${PROFILE_ARGS[@]}" 2>&1 | tee -a "$LOG"

if [[ $STATUS -ne 0 ]]; then
  echo "⚠ 측정이 끝까지 가지 못했습니다 (exit $STATUS). 같은 날짜로 다시 실행하면 이어서 진행합니다:"
  echo "   RUN_DATE=$DATE bash load_test_v1/scripts/run_all.sh $*"
fi
exit "$STATUS"
