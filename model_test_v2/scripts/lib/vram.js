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

// --- 모델별 VRAM (Ollama /api/ps) --------------------------------------
// nvidia-smi는 GPU '전체' 사용량이라 다른 프로세스가 섞이고 "이 모델이 얼마나
// 쓰는가"를 못 준다. Ollama의 /api/ps는 현재 로드된 모델마다 size_vram(바이트)을
// 돌려주므로 모델별 실측(항목8)에는 이쪽이 맞다. 둘 다 기록해서 교차 확인한다.
// nvidia-smi와 마찬가지로 실패 시 절대 throw하지 않고 null을 반환한다.

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
let psWarned = false;

async function sampleLoadedModels() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/ps`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`/api/ps ${res.status}`);
    const data = await res.json();
    return (data.models || []).map((m) => ({
      name: m.name,
      size_bytes: m.size ?? null,
      size_vram_bytes: m.size_vram ?? null,
      // size_vram이 size보다 작으면 일부가 CPU로 내려간 것 — 지연 해석에 중요하다.
      fully_on_gpu: m.size != null && m.size_vram != null ? m.size_vram >= m.size : null,
      expires_at: m.expires_at ?? null,
    }));
  } catch (e) {
    if (!psWarned) {
      console.warn(`  [vram] Ollama /api/ps 조회 실패 — 모델별 VRAM을 건너뜁니다 (${e.message})`);
      psWarned = true;
    }
    return null;
  }
}

// 특정 모델 태그 하나의 VRAM만 뽑아온다. 로드돼 있지 않으면 null.
async function sampleModelVram(modelTag) {
  const loaded = await sampleLoadedModels();
  if (!loaded) return null;
  // Ollama는 'qwen3:4b'를 그대로 돌려주지만, latest 생략 등 표기가 달라질 수
  // 있어 접두 일치까지 허용한다.
  const base = String(modelTag).split(':')[0];
  return loaded.find((m) => m.name === modelTag)
    || loaded.find((m) => m.name.startsWith(base + ':'))
    || null;
}

// GPU 모델명 — 보고서에 "어느 하드웨어에서 잰 값인지" 남기기 위한 것.
function gpuName() {
  let res;
  try {
    res = spawnSync('nvidia-smi', ['--query-gpu=name', '--format=csv,noheader'], {
      encoding: 'utf8',
      timeout: 5000,
    });
  } catch (e) {
    return null;
  }
  if (!res || res.error || res.status !== 0) return null;
  const names = res.stdout.trim().split('\n').map((s) => s.trim()).filter(Boolean);
  return names.length ? names.join(' + ') : null;
}

module.exports = { sampleVramMiB, sampleLoadedModels, sampleModelVram, gpuName };
