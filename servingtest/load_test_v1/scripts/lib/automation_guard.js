'use strict';
const fs = require('fs');
const path = require('path');

// 자동 실행 중 수동 Ollama 재시작이나 별도 엔진 측정이 끼어드는 것을 막는다.
function assertAutomationLease() {
  const file = path.join(__dirname, '..', '..', '.t4-automation.lock');
  if (!fs.existsSync(file)) return;
  let owner;
  try { owner = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error(`자동 실행 잠금 읽기 실패: ${file}`); }
  let alive = false;
  try { process.kill(owner.pid, 0); alive = true; }
  catch (e) { if (e.code === 'EPERM') alive = true; }
  if (alive && owner.token && process.env.LLM_T4_LEASE === owner.token) return;
  throw new Error(`자동 실행 잠금이 있습니다: ${file}. PID ${owner.pid}와 GPU 상태를 확인하세요.`);
}

module.exports = { assertAutomationLease };
