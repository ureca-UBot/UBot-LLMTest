'use strict';
// 항목8(모델별 실측 리소스) 보조: nvidia-smi로 VRAM 사용량을 샘플링한다.
// GPU/드라이버가 없는 환경(예: GPU 없는 EC2 티어)에서는 조용히 null을
// 반환하고 최초 1회만 경고를 남긴다 — run_generation.js가 이 값 없이도
// 정상 동작해야 하므로 여기서 절대 throw하지 않는다.

const { spawnSync } = require('child_process');

let warned = false;

// 여러 GPU가 있으면 각 GPU의 memory.used(MiB)를 합산해서 반환한다.
// 이 프로젝트는 단일 GPU(RTX 4070 Ti) 환경을 전제하지만, 다중 GPU에서도
// 죽지 않게 방어적으로 처리한다.
function sampleVramMiB() {
  let res;
  try {
    res = spawnSync('nvidia-smi', ['--query-gpu=memory.used', '--format=csv,noheader,nounits'], {
      encoding: 'utf8',
      timeout: 5000,
    });
  } catch (e) {
    res = { error: e };
  }
  if (!res || res.error || res.status !== 0) {
    if (!warned) {
      const reason = res && res.error ? res.error.message : `exit ${res ? res.status : 'unknown'}`;
      console.warn(`  [vram] nvidia-smi 호출 실패 — 이번 실행에서는 VRAM 측정을 건너뜁니다 (${reason})`);
      warned = true;
    }
    return null;
  }
  const values = res.stdout
    .trim()
    .split('\n')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0);
}

module.exports = { sampleVramMiB };
