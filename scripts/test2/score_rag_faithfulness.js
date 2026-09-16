'use strict';
// Stage 2d (항목2 RAG 충실도/환각): 규칙 기반 숫자·고유명사 검증(메인) +
// KLUE-NLI 함의 판정(FAQ/SYN 블록 단위로 분해, 보조) + CF유형 시행일/대상
// 해소 규칙. 설계 근거는 CLAUDE.md의 calibration 메모 참고.
//
// status가 ABSTAIN/CLARIFY/OUT_OF_SCOPE인 답변은 "사실 주장"이 없는 메타
// 발화라 근거 대조 자체가 의미 없으므로 건너뛰고 status_based_skip=true로
// 표시한다 (예: "확인할 수 없습니다"는 그 자체로 컨텍스트에 함의되지 않는
// 게 당연하며, 이걸 환각으로 잡으면 안 된다).
//
//   results/scored/test2/<run_id>/rag_faithfulness.jsonl
//
// Usage: node scripts/score_rag_faithfulness.js <run_id>

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { readAll, makeAppender } = require('./lib/jsonl');
const { splitContextBlocks, findBlocksByIds } = require('./lib/context_blocks');
const { splitFactUnits } = require('./lib/fact_units');
const { verifyGrounded, verifyScopedToEvidence, classifyScopeConflict } = require('./lib/regex_checks');
const { scoreNliBatch } = require('./lib/nli');
const { isPrimaryRound } = require('./lib/rounds');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');
const NO_CLAIM_STATUSES = new Set(['ABSTAIN', 'CLARIFY', 'OUT_OF_SCOPE']);

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/score_rag_faithfulness.js <run_id>');
    process.exit(1);
  }
  const cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  const casesById = Object.fromEntries(cases.map((c) => [c['ID'], c]));

  const genPath = path.join(ROOT, 'results', 'raw', 'test2', runId, 'generation.jsonl');
  const rows = readAll(genPath).filter((r) => r.parsed && typeof r.parsed.answer === 'string');

  // --- Pass 1: build every case's decomposition + regex check, and collect
  //     every (fact unit x context block) pair for a single batched NLI call.
  const prepared = [];
  const nliPairs = [];
  for (const r of rows) {
    const c = casesById[r.id];
    if (!c) continue;
    const status = r.parsed.status;
    const answer = r.parsed.answer;

    if (NO_CLAIM_STATUSES.has(status)) {
      prepared.push({ r, c, statusBasedSkip: true, blocks: [], units: [], pairKeys: [] });
      continue;
    }

    const blocks = splitContextBlocks(c['제공 Context']);
    const units = splitFactUnits(answer);
    const sourceText = [c['제공 Context'], c['사용자 정보 / API 결과']].join('\n');
    const regexResult = verifyGrounded(answer, sourceText);

    // "숫자는 진짜인데 출처가 틀림" 탐지 (2026-09-17 추가) — 모델이 실제로
    // 인용한(evidence_ids) 블록에는 없고 다른 블록에만 있는 숫자를 썼는지.
    // evidence_ids가 비어있으면(약한 모델) 판단 보류.
    const citedIds = Array.isArray(r.parsed.evidence_ids) ? r.parsed.evidence_ids : [];
    const citedBlocks = findBlocksByIds(blocks, citedIds);
    const scopedResult = verifyScopedToEvidence(answer, citedBlocks, blocks);

    const pairKeys = [];
    units.forEach((unit, uIdx) => {
      blocks.forEach((block, bIdx) => {
        const key = `${r.id}::u${uIdx}::b${bIdx}`;
        pairKeys.push({ key, uIdx, bIdx });
        nliPairs.push({ id: key, premise: block.raw, hypothesis: unit });
      });
    });

    // CF(FAQ 충돌·시행일): classify pairwise block scoping (informational,
    // consumed by score_escalation.js's CF-specific rule). 버그 수정: 진짜
    // 충돌 쌍을 blocks[0]/[1] 위치가 아니라 `정답/관련 FAQ` 컬럼의 ID로
    // 정확히 찾음 (Medium/Hard는 무관 FAQ가 섞여 블록이 5~10개까지 늘어남).
    let conflictScoping = null;
    if (c['유형'] === 'FAQ 충돌·시행일') {
      const expectedIds = (c['정답/관련 FAQ'] || '').split(',').map((s) => s.trim()).filter(Boolean);
      const conflictBlocks = findBlocksByIds(blocks, expectedIds);
      if (conflictBlocks.length >= 2) {
        conflictScoping = classifyScopeConflict(conflictBlocks[0].raw, conflictBlocks[1].raw);
      }
    }

    prepared.push({ r, c, statusBasedSkip: false, blocks, units, pairKeys, regexResult, scopedResult, conflictScoping });
  }

  console.log(`NLI 대상: ${prepared.filter((p) => !p.statusBasedSkip).length}건 (사실주장 없는 status ${prepared.filter((p) => p.statusBasedSkip).length}건 제외)`);
  console.log(`NLI 쌍 총 ${nliPairs.length}개 (컨텍스트 블록 단위로 분해됨) — 배치로 한 번에 채점합니다...`);

  const nliResultsByKey = {};
  if (nliPairs.length > 0) {
    const CHUNK = 500; // keep each python subprocess invocation's I/O manageable
    for (let i = 0; i < nliPairs.length; i += CHUNK) {
      const chunk = nliPairs.slice(i, i + CHUNK);
      console.log(`  NLI 배치 ${i + 1}-${i + chunk.length}/${nliPairs.length}`);
      const results = scoreNliBatch(chunk);
      for (const res of results) nliResultsByKey[res.id] = res;
    }
  }

  // --- Pass 2: aggregate per case (best supporting block per fact unit).
  const outPath = path.join(ROOT, 'results', 'scored', 'test2', runId, 'rag_faithfulness.jsonl');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, '');
  const appender = makeAppender(outPath);

  let faithfulCount = 0, skippedCount = 0, primaryScoredCount = 0;
  for (const p of prepared) {
    if (isPrimaryRound(p.c) && !p.statusBasedSkip) primaryScoredCount++;
    if (p.statusBasedSkip) {
      skippedCount++;
      appender.append({
        id: p.r.id, run_id: runId, model_tag: p.r.model_tag, env: p.r.env,
        status_based_skip: true, status: p.r.parsed.status,
        faithful: null, regex_pass: null, nli_grounded: null,
      });
      continue;
    }

    const unitResults = p.units.map((unit, uIdx) => {
      const candidates = p.blocks.map((block, bIdx) => {
        const key = `${p.r.id}::u${uIdx}::b${bIdx}`;
        return { blockId: block.id, ...nliResultsByKey[key] };
      });
      // best-supporting block = highest ENTAILMENT probability
      const best = candidates.reduce((a, b) => {
        const pa = a && a.probs ? a.probs.ENTAILMENT : -1;
        const pb = b && b.probs ? b.probs.ENTAILMENT : -1;
        return pb > pa ? b : a;
      }, candidates[0] || null);
      return { fact: unit, best_block_id: best ? best.blockId : null, predicted: best ? best.predicted : null, probs: best ? best.probs : null };
    });

    const nliGrounded = p.blocks.length === 0
      ? null // no context to check against (e.g. 무관FAQ/빈컨텍스트 cases that still got an ANSWER-shaped reply — itself informative)
      : unitResults.every((u) => u.predicted === 'ENTAILMENT');

    // 버그 수정: answer가 빈 문자열이면 units=[]가 되고 [].every(...)가
    // 공허하게 true를 반환해서 "아무 말도 안 했는데 근거 있음"으로 잘못
    // 통과하던 문제. status가 사실 주장을 하는 상태(ABSTAIN 등이 아님)인데
    // 답변 내용이 비어있으면 명시적으로 실패 처리.
    const isEmptyAnswer = p.units.length === 0;
    // "숫자는 진짜인데 출처가 틀림" — evidence_ids가 있는데 인용 안 한
    // 블록의 숫자를 썼으면, verifyGrounded는 못 잡아도 이건 명확한 근거불일치
    // 이므로 faithful 판정에 직접 반영(단순 escalation 신호로만 두지 않음 —
    // 오탐 위험이 낮고 이미 실측으로 확인된 구멍이라 주 판정에 포함).
    const hasWrongSourceNumber = p.scopedResult.scoped && p.scopedResult.numbersFromWrongSource.length > 0;
    const faithful = !isEmptyAnswer && p.regexResult.pass && !hasWrongSourceNumber && (nliGrounded !== false);
    if (faithful && isPrimaryRound(p.c)) faithfulCount++;

    appender.append({
      id: p.r.id, run_id: runId, model_tag: p.r.model_tag, env: p.r.env,
      status_based_skip: false,
      faithful,
      regex_pass: p.regexResult.pass,
      unverified_numbers: p.regexResult.unverifiedNumbers,
      unverified_proper_nouns: p.regexResult.unverifiedNouns,
      numbers_from_wrong_source: p.scopedResult.numbersFromWrongSource,
      nli_grounded: nliGrounded,
      is_empty_answer: isEmptyAnswer,
      fact_units: unitResults,
      conflict_scoping: p.conflictScoping,
    });
  }
  appender.close();

  const scored = prepared.length - skippedCount;
  console.log(`항목2(RAG충실도): 전체 ${scored}건 채점(스킵 ${skippedCount}), 고유문항(회차1) 기준 faithful ${faithfulCount}/${primaryScoredCount} (${((faithfulCount / (primaryScoredCount || 1)) * 100).toFixed(1)}%) -> ${outPath}`);
}

main();
