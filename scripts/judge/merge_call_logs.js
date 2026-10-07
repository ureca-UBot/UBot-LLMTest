'use strict';
// 옛 형식의 Codex 호출 로그(호출마다 calls/<call_id>.events.jsonl + .stderr.log 두 파일)를 판정 종류별
// 파일 하나(calls/<kind>.calls.jsonl, providers/codex.js의 현재 형식)로 합친다. 외부 호출 없음.
//
// - call_id는 옛 파일 이름 그대로라서, 이미 기록된 판정 결과의 call_log(옛 파일 경로)로도 해당 줄을 찾을 수 있다.
// - 옛 로그에는 소요 시간·종료 코드가 없어 null로 두고 legacy: true를 붙인다(started_at은 파일 이름의 시각).
// - 이미 합친 call_id는 건너뛴다(다시 실행해도 안전). 모두 합친 것을 확인한 뒤에만 옛 파일을 지운다.
// - 같은 배치의 judge_run.js가 돌고 있으면(잠금 파일) 멈춘다.
//
// Usage: node scripts/judge/merge_call_logs.js --batch <id> [--dry-run] [--test v4] [--try try1]

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');

// <kind>-<run_id>-<case id>-<epoch ms>-<pid>-<attempt>
const NAME_RE = /^([a-z]+)-(.+)-([A-Z]{2}-\d{4}(?:-R\d+)?)-(\d{13})-(\d+)-(\d+)$/;

function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch) throw new Error('--batch <id>가 필요합니다.');
  const { paths, repoRel } = profile.load();
  const runsDir = paths.judgeRunsDir(opts.batch);
  const callsDir = path.join(runsDir, 'calls');
  if (!fs.existsSync(callsDir)) { console.log(`호출 로그 폴더가 없습니다: ${repoRel(callsDir)}`); return; }
  const locks = fs.readdirSync(runsDir).filter((f) => f.endsWith('.lock'));
  if (locks.length) throw new Error(`judge_run.js가 실행 중입니다(잠금: ${locks.join(', ')}). 끝난 뒤 다시 실행하세요.`);

  const legacy = fs.readdirSync(callsDir).filter((f) => f.endsWith('.events.jsonl'))
    .map((f) => {
      const callId = f.slice(0, -'.events.jsonl'.length);
      const m = callId.match(NAME_RE);
      if (!m) throw new Error(`이름 형식을 알 수 없는 로그: ${f}`);
      return { file: f, callId, kind: m[1], runId: m[2], id: m[3], ms: Number(m[4]), attempt: Number(m[6]) };
    })
    .sort((a, b) => a.ms - b.ms || a.callId.localeCompare(b.callId));
  if (!legacy.length) { console.log('합칠 옛 형식 로그가 없습니다.'); return; }

  const byKind = new Map();
  for (const l of legacy) {
    if (!byKind.has(l.kind)) byKind.set(l.kind, []);
    byKind.get(l.kind).push(l);
  }

  const toDelete = [];
  for (const [kind, list] of byKind) {
    const target = path.join(callsDir, `${kind}.calls.jsonl`);
    const existing = new Set(fs.existsSync(target)
      ? fs.readFileSync(target, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).call_id) : []);
    const lines = [];
    for (const l of list) {
      if (existing.has(l.callId)) continue;
      const stdout = fs.readFileSync(path.join(callsDir, l.file), 'utf8');
      const errFile = path.join(callsDir, `${l.callId}.stderr.log`);
      lines.push(JSON.stringify({
        call_id: l.callId, kind, run_id: l.runId, id: l.id, attempt: l.attempt,
        started_at: new Date(l.ms).toISOString(), latency_ms: null, timed_out: null, exit_code: null, error: null,
        legacy: true,
        events: stdout.split(/\r?\n/).filter(Boolean).map((x) => { try { return JSON.parse(x); } catch { return { unparsed: x }; } }),
        stderr: fs.existsSync(errFile) ? fs.readFileSync(errFile, 'utf8') : '',
      }));
    }
    console.log(`${kind}: 옛 로그 ${list.length}개 (이미 합침 ${list.length - lines.length}, 이번 ${lines.length}) -> ${repoRel(target)}`);
    if (opts.dryRun) continue;
    // 기존 파일(새 형식으로 이미 쓰인 줄)이 있으면 그 앞에 옛 로그를 둔다 — 시간 순서를 유지한다.
    if (lines.length) {
      const prev = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      const tmp = target + '.tmp';
      fs.writeFileSync(tmp, lines.join('\n') + '\n' + prev, 'utf8');
      fs.renameSync(tmp, target);
    }
    // 검증: 옛 로그의 call_id가 모두 들어갔는지
    const merged = new Set(fs.readFileSync(target, 'utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x).call_id));
    const missing = list.filter((l) => !merged.has(l.callId));
    if (missing.length) throw new Error(`${kind}: ${missing.length}개가 합쳐지지 않았습니다. 옛 파일은 지우지 않았습니다.`);
    for (const l of list) toDelete.push(l.file, `${l.callId}.stderr.log`);
  }

  if (opts.dryRun) { console.log('[--dry-run] 파일을 쓰거나 지우지 않았습니다.'); return; }
  let removed = 0;
  for (const f of toDelete) {
    const p = path.join(callsDir, f);
    if (fs.existsSync(p)) { fs.unlinkSync(p); removed++; }
  }
  console.log(`옛 로그 파일 ${removed}개를 지웠습니다.`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
