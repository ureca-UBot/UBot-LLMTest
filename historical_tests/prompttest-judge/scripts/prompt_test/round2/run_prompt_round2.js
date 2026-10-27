'use strict';
// 프롬프트 2차 테스트 생성 실행기. 설계: scripts/prompt_test/round2/PROMPT_ROUND2_PLAN.md
// 사용법 전체: scripts/prompt_test/round2/PROMPT_ROUND2_RUN.md
//
// 모델은 qwen3:14b 하나, 조건은 1차와 같다(temperature 0 · 추론 끔 · seed 미고정).
// 생성만 한다 — 채점은 judge_round2.js(LLM Judge), 판정은 report_round2.js.
// 1차처럼 run_pipeline.js의 결정론 채점(NLI·임베딩 등)은 돌리지 않는다. 2차 판정
// 기준(§2.1)은 Judge 결과와 생성 레코드(status·포맷·지연)만으로 계산한다.
//
//   node scripts/prompt_test/round2/run_prompt_round2.js smoke-sets [--write]   # 스모크 문항 목록 확인/고정
//   node scripts/prompt_test/round2/run_prompt_round2.js baseline                 # Phase 0: v2 재생성 2문항 + 기준선 합성
//   node scripts/prompt_test/round2/run_prompt_round2.js smoke [--variants v4_account_match,...]   # Phase 1
//   node scripts/prompt_test/round2/run_prompt_round2.js combo --blocks v4,v6     # Phase 2 (300 + 신규 50)
//   node scripts/prompt_test/round2/run_prompt_round2.js latency-check            # 조건부: P95 환경 확인
//
// 공통 옵션: --date YYYYMMDD (기본 오늘) · --dry-run · --skip-model-check
// 도중에 멈추면 같은 명령을 다시 실행한다. 끝난 문항은 건너뛴다.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const R = require('./lib/round2');
const { todayStamp, checkModelsAvailable } = require('../../test3/lib/runner');
const { comboVariantName, resolveSystemPrompt, ROUND2_BLOCK_ORDER } = require('../../test2/lib/prompts');

const GENERATION = path.join(R.ROOT, 'scripts', 'test2', 'run_generation.js');

function parseArgs(argv) {
  const opts = { command: argv[0], date: todayStamp(), dryRun: false, skipModelCheck: false, variants: null, blocks: null, write: false, only: null };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--date') opts.date = argv[++i];
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--skip-model-check') opts.skipModelCheck = true;
    else if (a === '--variants') opts.variants = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--blocks') opts.blocks = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--write') opts.write = true;
    else if (a === '--main-only') opts.only = 'main';
    else if (a === '--new-only') opts.only = 'new';
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  return opts;
}

// ---------------------------------------------------------------- 스모크 문항 목록
// 계획서 §5.3의 정의를 데이터에서 계산한다. 결과는 config/round2_smoke.json에 고정해
// 커밋하고, 실행 때마다 같은 정의로 다시 계산해 파일과 같은지 확인한다(정의가 바뀌면 멈춘다).
function computeSmokeSets() {
  const cases = R.loadCases(R.CASES_R2);
  const primary = R.primaryCases(cases);
  const ofType = (...types) => primary.filter((c) => types.includes(c['유형'])).map((c) => c.ID);
  // v6 표적: 1차 v2에서 실질적 환각(is_grounded=false) 판정을 받은 문항.
  const v2Acc = R.loadJudgments(R.ROUND1.suite, R.ROUND1.v2RunId, 'accuracy');
  if (v2Acc.size !== 300) throw new Error(`1차 v2 판정이 300건이 아닙니다(${v2Acc.size}건).`);
  const hallucinated = primary.filter((c) => !R.isGrounded(v2Acc.get(c.ID))).map((c) => c.ID);
  const missing = R.CANARY_IDS.filter((id) => !cases.has(id));
  if (missing.length) throw new Error(`감시 문항이 정정본에 없습니다: ${missing.join(', ')}`);
  const sets = {
    v4_account_match: { target_rule: `유형 = ${R.TYPES.userInfo} 또는 ${R.TYPES.api}`, targets: ofType(R.TYPES.userInfo, R.TYPES.api) },
    v5_doc_isolation: { target_rule: `유형 = ${R.TYPES.adversarial}`, targets: ofType(R.TYPES.adversarial) },
    v6_hold_template: { target_rule: '1차 v2 판정에서 is_grounded=false', targets: hallucinated },
    v7_dialogue_state: { target_rule: `유형 = ${R.TYPES.multiturn}`, targets: ofType(R.TYPES.multiturn) },
  };
  for (const s of Object.values(sets)) {
    const ids = new Set([...s.targets, ...R.CANARY_IDS]);
    s.run_ids = primary.map((c) => c.ID).filter((id) => ids.has(id)); // 문항 파일 순서
  }
  return {
    description: '프롬프트 2차 스모크 문항 목록 (계획서 §5.3). run_prompt_round2.js smoke-sets --write로 다시 만든다.',
    cases_file: R.CASES_R2,
    canary: R.CANARY_IDS,
    variants: sets,
  };
}

function loadSmokeSets() {
  const computed = computeSmokeSets();
  if (!fs.existsSync(R.SMOKE_SETS_PATH)) {
    throw new Error(`${R.rel(R.SMOKE_SETS_PATH)}이 없습니다. 먼저 smoke-sets --write를 실행하세요.`);
  }
  const saved = R.readJson(R.SMOKE_SETS_PATH);
  if (JSON.stringify(saved) !== JSON.stringify(computed)) {
    throw new Error(`${R.rel(R.SMOKE_SETS_PATH)}이 현재 데이터로 계산한 목록과 다릅니다. 정의를 바꾼 게 맞다면 smoke-sets --write로 다시 고정하세요.`);
  }
  return saved;
}

function cmdSmokeSets(opts) {
  const computed = computeSmokeSets();
  for (const [v, s] of Object.entries(computed.variants)) {
    console.log(`${v}: 표적 ${s.targets.length} + 감시 ${computed.canary.length} -> 생성 ${s.run_ids.length}건  (${s.target_rule})`);
  }
  console.log(`합계 ${Object.values(computed.variants).reduce((n, s) => n + s.run_ids.length, 0)}건`);
  if (opts.write) {
    fs.mkdirSync(path.dirname(R.SMOKE_SETS_PATH), { recursive: true });
    fs.writeFileSync(R.SMOKE_SETS_PATH, JSON.stringify(computed, null, 2) + '\n');
    console.log(`저장: ${R.rel(R.SMOKE_SETS_PATH)}`);
  } else if (fs.existsSync(R.SMOKE_SETS_PATH)) {
    loadSmokeSets();
    console.log(`${R.rel(R.SMOKE_SETS_PATH)}와 일치합니다.`);
  }
}

// ---------------------------------------------------------------- 생성 호출
function writeMeta(runIdValue, meta) {
  const file = R.runMetaPath(runIdValue);
  const body = { run_id: runIdValue, suite: R.SUITE, model: R.MODEL, condition: R.CONDITION, ...meta };
  if (fs.existsSync(file)) {
    const prev = R.readJson(file);
    const same = ['variant', 'system_prompt_sha256', 'cases_file', 'purpose', 'ids_sha256'].every((k) => JSON.stringify(prev[k]) === JSON.stringify(body[k]));
    if (!same) throw new Error(`${R.rel(file)}에 다른 설정이 기록돼 있습니다. --date를 바꿔 새 run으로 돌리세요.`);
    return prev;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  body.created_at = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(body, null, 2) + '\n');
  return body;
}

// 한 run을 생성한다. ids가 있으면 그 문항만, primaryOnly면 고유 문항(회차 1)만.
function generate({ runIdValue, variant, casesFile, purpose, ids = null, primaryOnly = false, opts }) {
  if (!resolveSystemPrompt(variant)) throw new Error(`알 수 없는 안: ${variant}`);
  const cases = R.loadCases(casesFile);
  if (!cases) throw new Error(`문항 파일이 없습니다: ${casesFile}`);
  const idsText = ids ? ids.join('\n') + '\n' : null;
  const expected = ids ? ids.length : (primaryOnly ? R.primaryCases(cases).length : cases.size);
  console.log(`\n--- ${purpose}: ${variant} -> ${runIdValue}`);
  console.log(`    문항 ${expected}건 · ${casesFile}${ids ? ' · ID 지정' : primaryOnly ? ' · 고유 문항만' : ''}`);
  if (opts.dryRun) return { ok: true, runId: runIdValue, dryRun: true };

  writeMeta(runIdValue, { variant, system_prompt_sha256: R.sha256(resolveSystemPrompt(variant)), cases_file: casesFile, purpose,
    ids_sha256: idsText ? R.sha256(idsText) : null, expected_records: expected });
  const args = [GENERATION, runIdValue, R.MODEL, '--prompt', variant, ...R.GEN_ARGS];
  if (primaryOnly) args.push('--primary-only');
  if (ids) {
    const idsFile = path.join(R.rawDir(R.SUITE, runIdValue), 'ids.txt');
    fs.writeFileSync(idsFile, idsText);
    args.push('--ids', idsFile);
  }
  const res = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env, LLM_TEST_SUITE: R.SUITE, LLM_TEST_CASES: casesFile },
  });
  const records = R.readJsonl(R.generationPath(R.SUITE, runIdValue));
  const errors = records.filter((r) => r.error).length;
  const ok = res.status === 0 && records.length === expected;
  console.log(`    ${ok ? '완료' : '미완료'}: 레코드 ${records.length}/${expected}건, 생성 오류 ${errors}건`);
  return { ok, runId: runIdValue, records: records.length, expected, errors };
}

function modelCheck(opts) {
  if (opts.dryRun || opts.skipModelCheck) return;
  const check = checkModelsAvailable([{ tag: R.MODEL }], R.MODEL);
  if (!check.ok) {
    console.error(`[사전확인] Ollama에 ${R.MODEL}이 없습니다. ollama pull ${R.MODEL} 후 다시 실행하세요.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------- Phase 0: 기준선
// 1) 대화 이력을 고친 MT-0109·MT-0111만 v2로 다시 생성한다(정정본 cases_r2.csv).
// 2) 1차 v2 답변 298건 + 재생성 2건을 합쳐 정정본 기준 v2 run(r2base)을 만든다.
//    1차 레코드는 한 글자도 바꾸지 않고 옮긴다 — 같은 Judge 입력이면 1차 판정을 재사용한다.
function composeBaseline(regenRunId) {
  const baseId = R.baselineRunId();
  const round1 = R.readJsonl(R.generationPath(R.ROUND1.suite, R.ROUND1.v2RunId));
  const round1Lines = fs.readFileSync(R.generationPath(R.ROUND1.suite, R.ROUND1.v2RunId), 'utf8').split(/\r?\n/).filter((s) => s.trim());
  if (round1.length !== 300) throw new Error(`1차 v2 생성 레코드가 300건이 아닙니다(${round1.length}건).`);
  const regen = R.loadGenerations(R.SUITE, regenRunId);
  const missing = R.REGEN_IDS.filter((id) => !regen.has(id) || regen.get(id).error);
  if (missing.length) throw new Error(`재생성이 끝나지 않은 문항: ${missing.join(', ')} — baseline을 다시 실행하세요.`);
  const regenLines = new Map(fs.readFileSync(R.generationPath(R.SUITE, regenRunId), 'utf8').split(/\r?\n/)
    .filter((s) => s.trim()).map((s) => [JSON.parse(s).id, s]));
  const lines = round1Lines.map((line, i) => (R.REGEN_IDS.includes(round1[i].id) ? regenLines.get(round1[i].id) : line));
  const content = lines.join('\n') + '\n';

  console.log(`\n--- 기준선 합성: 1차 v2 ${300 - R.REGEN_IDS.length}건 + 재생성 ${R.REGEN_IDS.length}건 -> ${baseId}`);
  const out = R.generationPath(R.SUITE, baseId);
  if (fs.existsSync(out)) {
    if (fs.readFileSync(out, 'utf8') !== content) throw new Error(`${R.rel(out)}이 이미 있고 내용이 다릅니다. 지우고 다시 합성할지 확인하세요.`);
    console.log('    이미 같은 내용으로 합성돼 있습니다.');
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, content);
  }
  writeMeta(baseId, {
    variant: 'v2_value_guard', system_prompt_sha256: R.sha256(resolveSystemPrompt('v2_value_guard')),
    cases_file: R.CASES_R2, purpose: 'baseline', ids_sha256: null, expected_records: 300,
    composed_from: [
      { suite: R.ROUND1.suite, run_id: R.ROUND1.v2RunId, records: 300 - R.REGEN_IDS.length,
        sha256: R.sha256(fs.readFileSync(R.generationPath(R.ROUND1.suite, R.ROUND1.v2RunId))) },
      { suite: R.SUITE, run_id: regenRunId, records: R.REGEN_IDS.length, ids: R.REGEN_IDS },
    ],
    note: '레코드의 run_id 필드는 원래 run 값을 그대로 둔다(출처 보존).',
  });
  console.log(`    저장: ${R.rel(out)}`);
  return baseId;
}

function cmdBaseline(opts) {
  modelCheck(opts);
  const regenId = R.runId('v2_value_guard', opts.date, 'regen');
  const r = generate({ runIdValue: regenId, variant: 'v2_value_guard', casesFile: R.CASES_R2, purpose: 'regen', ids: R.REGEN_IDS, opts });
  if (!r.ok) { console.error('\n재생성이 끝나지 않았습니다. 같은 명령을 다시 실행하세요.'); process.exit(1); }
  if (opts.dryRun) {
    console.log(`\n--- 기준선 합성(예정): 1차 v2 ${300 - R.REGEN_IDS.length}건 + 재생성 ${R.REGEN_IDS.length}건 -> ${R.baselineRunId()}`);
    console.log('\n[--dry-run] 모델 호출 없이 끝났습니다.');
    return;
  }
  const baseId = composeBaseline(regenId);
  console.log(`\n다음: Phase 1 스모크 생성 후 한 배치로 채점한다.`);
  console.log(`  node scripts/prompt_test/round2/run_prompt_round2.js smoke --date ${opts.date}`);
  console.log(`  기준선 run: ${baseId}`);
}

// ---------------------------------------------------------------- Phase 1: 스모크
function cmdSmoke(opts) {
  const sets = loadSmokeSets();
  const variants = opts.variants || Object.keys(R.SMOKE_VARIANTS);
  const unknown = variants.filter((v) => !R.SMOKE_VARIANTS[v]);
  if (unknown.length) throw new Error(`스모크 안이 아닙니다: ${unknown.join(', ')} (가능: ${Object.keys(R.SMOKE_VARIANTS).join(', ')})`);
  modelCheck(opts);
  const results = variants.map((v) => generate({
    runIdValue: R.runId(v, opts.date), variant: v, casesFile: R.CASES_R2, purpose: 'smoke', ids: sets.variants[v].run_ids, opts,
  }));
  summarize(results, opts);
  if (!opts.dryRun) {
    const runs = [R.baselineRunId(), ...results.map((r) => r.runId)];
    console.log('\n다음: 기준선 재처리 4문항과 스모크를 한 배치로 채점 준비');
    console.log(`  node scripts/prompt_test/round2/judge_round2.js prepare smoke-${opts.date} --runs ${runs.join(',')}`);
  }
}

// ---------------------------------------------------------------- Phase 2: 조합안
function cmdCombo(opts) {
  if (!opts.blocks || !opts.blocks.length) throw new Error(`--blocks가 필요합니다 (예: --blocks v4,v6). 가능: ${ROUND2_BLOCK_ORDER.join(', ')}`);
  const variant = comboVariantName(opts.blocks);
  console.log(`조합안: ${variant} (v2 + ${opts.blocks.join(' + ')})`);
  modelCheck(opts);
  const results = [];
  if (opts.only !== 'new') {
    results.push(generate({ runIdValue: R.runId(variant, opts.date), variant, casesFile: R.CASES_R2, purpose: 'combo', primaryOnly: true, opts }));
  }
  if (opts.only !== 'main') {
    if (!fs.existsSync(path.join(R.ROOT, R.NEW_R2))) {
      console.warn(`\n[경고] 신규 문항 파일이 없습니다: ${R.NEW_R2} — 신규 50문항 run은 건너뜁니다(계획서 §6.2).`);
    } else {
      results.push(generate({ runIdValue: R.runId(variant, opts.date, 'new'), variant, casesFile: R.NEW_R2, purpose: 'combo_new', opts }));
    }
  }
  summarize(results, opts);
  if (!opts.dryRun) {
    console.log('\n다음: 채점 준비');
    console.log(`  node scripts/prompt_test/round2/judge_round2.js prepare combo-${opts.date} --runs ${results.map((r) => r.runId).join(',')}`);
  }
}

// ---------------------------------------------------------------- 조건부: 지연 확인
// 조합안 P95가 7.2초를 넘으면 같은 세션에서 v2를 반복 대상 40문항만 다시 돌려
// 환경 차이인지 본다(계획서 §4.1).
function cmdLatency(opts) {
  const cases = R.loadCases(R.CASES_R2);
  const ids = R.primaryCases(cases).filter((c) => c['반복 평가 대상'] === 'Y').map((c) => c.ID);
  modelCheck(opts);
  const r = generate({ runIdValue: R.runId('v2_value_guard', opts.date, 'latency'), variant: 'v2_value_guard', casesFile: R.CASES_R2, purpose: 'latency', ids, opts });
  summarize([r], opts);
}

function summarize(results, opts) {
  if (opts.dryRun) { console.log('\n[--dry-run] 모델 호출 없이 끝났습니다.'); return; }
  const failed = results.filter((r) => !r.ok);
  console.log('\n========== 생성 요약 ==========');
  for (const r of results) console.log(`  ${r.ok ? 'OK  ' : 'FAIL'} ${r.runId} (${r.records}/${r.expected}, 오류 ${r.errors})`);
  if (failed.length) {
    console.error('\n끝나지 않은 run이 있습니다. 같은 명령을 다시 실행하면 이어서 진행합니다.');
    process.exit(1);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const commands = { 'smoke-sets': cmdSmokeSets, baseline: cmdBaseline, smoke: cmdSmoke, combo: cmdCombo, 'latency-check': cmdLatency };
  if (!commands[opts.command]) {
    console.error('usage: node scripts/prompt_test/round2/run_prompt_round2.js <smoke-sets|baseline|smoke|combo|latency-check> [옵션]');
    console.error('       자세한 사용법: scripts/prompt_test/round2/PROMPT_ROUND2_RUN.md');
    process.exit(1);
  }
  commands[opts.command](opts);
}

try { main(); } catch (e) { console.error(`[중단] ${e.message}`); process.exit(1); }
