'use strict';
// Node-side bridge to the Python KLUE-NLI batch scorer. One subprocess call
// per pipeline run (not per case) — writes all {id, premise, hypothesis}
// pairs to a temp file, invokes python once (model loads once), reads the
// results back. This is the only place in the pipeline that shells out to
// Python; every other stage is pure Node so local(Windows)/EC2(Linux) share
// the same code (platform.js resolves the interpreter path).

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolvePython } = require('./platform');

const SCRIPT_PATH = path.join(__dirname, '..', 'python_nli', 'run_nli_batch.py');

function sleepSync(ms) {
  // spawnSync 경로라 async/await를 못 쓰므로, Atomics.wait로 동기 대기
  // (외부 의존성 없이 Node 표준 기능만 사용).
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function scoreNliBatchOnce(pairs) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nli-batch-'));
  const inPath = path.join(tmpDir, 'in.json');
  const outPath = path.join(tmpDir, 'out.json');
  fs.writeFileSync(inPath, JSON.stringify(pairs), 'utf8');

  try {
    const python = resolvePython();
    const result = spawnSync(python, [SCRIPT_PATH, inPath, outPath], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 256,
    });
    if (result.error) {
      throw new Error(
        `Python NLI 서브프로세스 실행 실패 (${python}): ${result.error.message}\n` +
        `.venv_nli가 준비됐는지 확인하세요 (SETUP.md 참고).`
      );
    }
    if (result.status !== 0) {
      throw new Error(`Python NLI 서브프로세스가 code ${result.status}로 종료:\n${result.stderr}`);
    }
    if (!fs.existsSync(outPath)) {
      throw new Error(`NLI 결과 파일이 생성되지 않음. stderr:\n${result.stderr}`);
    }
    return JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// pairs: [{ id, premise, hypothesis }]
// returns: [{ id, predicted: 'ENTAILMENT'|'NEUTRAL'|'CONTRADICTION', probs: {...} }]
// 2026-09-17 추가: 재시도 없이 한 번 실패하면(메모리 부족 등 일시적 문제
// 포함) 스테이지 전체가 죽던 문제 — 최대 2회 재시도.
function scoreNliBatch(pairs, { retries = 2 } = {}) {
  if (pairs.length === 0) return [];
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return scoreNliBatchOnce(pairs);
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        const delay = 2000 * 2 ** attempt;
        console.warn(`  [재시도 ${attempt + 1}/${retries}] NLI 배치(${pairs.length}쌍) 실패, ${delay}ms 후 재시도: ${e.message}`);
        sleepSync(delay);
      }
    }
  }
  throw lastErr;
}

module.exports = { scoreNliBatch };
