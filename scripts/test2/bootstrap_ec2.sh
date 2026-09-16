#!/usr/bin/env bash
# EC2 맨 인스턴스 부트스트랩 — Node.js조차 없는 상태에서 이 저장소를 clone한
# 직후 한 번 실행하면 setup_env.js(Node 스크립트)를 돌릴 수 있는 상태까지
# 만들어줌. 그 이후 단계(Python venv, Ollama 모델 pull 등)는 setup_env.js가
# 이어받음 — 이 스크립트는 "Node를 실행할 수 있게 만드는" 딱 그 앞단계만
# 담당(역할 분리, setup_env.js와 로직 중복 없음).
#
# Usage: bash scripts/bootstrap_ec2.sh [--tier ec2|local|all]
#
# 지원: Ubuntu/Debian(apt) · Amazon Linux 2/2023(yum/dnf) — EC2에서 흔한
# 두 계열. 그 외 배포판은 Node/Ollama 설치 부분만 수동으로 하고 나머지는
# 그대로 재사용 가능.

set -euo pipefail

TIER="ec2"
for arg in "$@"; do
  case "$arg" in
    --tier) shift_next=1 ;;
    ec2|local|all) TIER="$arg" ;;
  esac
done
# (간단한 파서: `--tier ec2` 형태로 오면 뒤 토큰을 그대로 씀)
if [[ "${1:-}" == "--tier" && -n "${2:-}" ]]; then
  TIER="$2"
fi

echo "=== EC2 부트스트랩 시작 (tier=$TIER) ==="

REQUIRED_NODE_MAJOR=20

node_version_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local major
  major=$(node -e 'console.log(process.versions.node.split(".")[0])')
  [[ "$major" -ge "$REQUIRED_NODE_MAJOR" ]]
}

echo "--- 1. Node.js 확인/설치 ---"
if node_version_ok; then
  echo "Node.js 이미 설치됨: $(node --version)"
else
  if command -v apt-get >/dev/null 2>&1; then
    echo "Ubuntu/Debian 계열 감지 — NodeSource로 Node ${REQUIRED_NODE_MAJOR}.x 설치"
    curl -fsSL "https://deb.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    echo "Amazon Linux 2023 / Fedora 계열 감지 — NodeSource로 Node ${REQUIRED_NODE_MAJOR}.x 설치"
    curl -fsSL "https://rpm.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x" | sudo -E bash -
    sudo dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    echo "Amazon Linux 2 감지 — NodeSource로 Node ${REQUIRED_NODE_MAJOR}.x 설치"
    curl -fsSL "https://rpm.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x" | sudo -E bash -
    sudo yum install -y nodejs
  else
    echo "지원하지 않는 패키지 매니저입니다. Node.js ${REQUIRED_NODE_MAJOR}+ 를 수동 설치한 뒤 다시 실행하세요." >&2
    exit 1
  fi
  echo "Node.js 설치 완료: $(node --version)"
fi

echo "--- 2. Python3 + venv 모듈 확인/설치 ---"
if command -v python3 >/dev/null 2>&1; then
  echo "python3 이미 설치됨: $(python3 --version)"
else
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y python3 python3-venv python3-pip
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y python3 python3-pip
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y python3 python3-pip
  fi
fi
# venv 모듈이 따로 빠져있는 배포판 대응 (Ubuntu는 python3-venv가 별도 패키지)
python3 -c "import venv" 2>/dev/null || {
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get install -y python3-venv
  fi
}

echo "--- 3. Ollama 설치 확인/설치 ---"
if command -v ollama >/dev/null 2>&1; then
  echo "Ollama 이미 설치됨: $(ollama --version)"
else
  echo "Ollama 공식 설치 스크립트 실행 중..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

# Ollama가 systemd 서비스로 안 올라와 있으면 수동으로 백그라운드 기동
if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama 서버가 응답하지 않아 백그라운드로 기동합니다..."
  nohup ollama serve > /tmp/ollama_serve.log 2>&1 &
  sleep 3
fi

echo "--- 4. 이후 단계는 setup_env.js(Node)가 이어받음 ---"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/setup_env.js" --tier "$TIER"

echo ""
echo "=== EC2 부트스트랩 완료 ==="
echo "다음으로 실행: node scripts/run_all_models.js $TIER"
