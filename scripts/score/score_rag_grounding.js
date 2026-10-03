'use strict';
// 결과론적 근거 지표(참고용): 답변의 숫자·고유명사가 입력에 있는지(규칙)와, 답변 문장이
// 입력 문서 블록에 함의되는 비율(KLUE-NLI). 환각 판단은 LLM Judge 환각률을 쓰고 이 값은
// 참고 측정값이다. 통과/실패 없이 원래 값으로 기록한다.
//
// v2·v3 대비 바뀐 점: premise에 제공 Context 블록뿐 아니라 사용자 정보·API 결과와 대화
// 이력도 블록으로 넣는다(v3 알려진 한계 — premise 누락으로 UI·AR·MT가 불리했던 문제).
// ABSTAIN·CLARIFY·OUT_OF_SCOPE 응답은 사실 주장이 없는 메타 발화로 보고 건너뛴다.
//
//   raw/scored/<run_id>/rag_grounding.jsonl
//   raw/scored/<run_id>/rag_grounding_summary.json
//
// 준비: 저장소 루트 .venv_nli (scripts/run/setup_env.js). 없으면 config.pipeline.skip에
// 'score_rag_grounding'을 넣어 이 단계를 건너뛴다.
//
// Usage: node scripts/score/score_rag_grounding.js <run_id> [--test v4] [--try try1]

const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, summarizeScopes, headlineScope, writeJson, writeJsonl, runIdArg } = require('../lib/run_data');
const { splitContextBlocks } = require('../lib/context_blocks');
const { splitFactUnits } = require('../lib/fact_units');
const { verifyGrounded } = require('../lib/regex_checks');
const { parseHistoryTurns } = require('../lib/prompts');
const { scoreNliBatch } = require('../lib/nli');
const { avg, rate, pct } = require('../lib/stats');

const NO_CLAIM_STATUSES = new Set(['ABSTAIN', 'CLARIFY', 'OUT_OF_SCOPE']);
const NLI_CHUNK = 500;

function premiseBlocks(c) {
  const blocks = splitContextBlocks(c.context).map((b) => ({ id: b.id, raw: b.raw }));
  if ((c.userInfo || '').trim()) blocks.push({ id: 'USER_INFO_API', raw: c.userInfo });
  const turns = parseHistoryTurns(c.history);
  if (turns.length) {
    blocks.push({ id: 'HISTORY', raw: turns.map((t) => `${t.role === 'user' ? '사용자' : '상담봇'}: ${t.content}`).join('\n') });
  }
  return blocks;
}

function main() {
  const runId = runIdArg(argv);
  const { rows, scoredDir } = loadRun(runId);

  const prepared = [];
  const pairs = [];
  for (const { g, c } of rows) {
    const answer = g.parsed && typeof g.parsed.answer === 'string' ? g.parsed.answer : null;
    if (!answer || !answer.trim()) { prepared.push({ g, c, skip: 'NO_ANSWER' }); continue; }
    if (NO_CLAIM_STATUSES.has(g.parsed.status)) { prepared.push({ g, c, skip: 'NO_CLAIM_STATUS' }); continue; }
    const blocks = premiseBlocks(c);
    const units = splitFactUnits(answer);
    const regex = verifyGrounded(answer, [c.context, c.userInfo, c.history, c.question].join('\n'));
    units.forEach((unit, u) => blocks.forEach((block, b) => {
      pairs.push({ id: `${g.id}::${u}::${b}`, premise: block.raw, hypothesis: unit });
    }));
    prepared.push({ g, c, blocks, units, regex });
  }

  console.log(`NLI 대상 ${prepared.filter((p) => !p.skip).length}건, 쌍 ${pairs.length}개`);
  const nli = {};
  for (let i = 0; i < pairs.length; i += NLI_CHUNK) {
    const chunk = pairs.slice(i, i + NLI_CHUNK);
    console.log(`  NLI ${i + 1}-${i + chunk.length}/${pairs.length}`);
    for (const r of scoreNliBatch(chunk)) nli[r.id] = r;
  }

  const scored = prepared.map((p) => {
    const base = { id: p.g.id, run_id: runId, model_tag: p.g.model_tag, status: p.g.parsed?.status ?? null };
    if (p.skip) return { ...base, skipped: p.skip };
    const units = p.units.map((unit, u) => {
      let best = null;
      p.blocks.forEach((block, b) => {
        const r = nli[`${p.g.id}::${u}::${b}`];
        if (r && (!best || r.probs.ENTAILMENT > best.probs.ENTAILMENT)) best = { ...r, block_id: block.id };
      });
      return { fact: unit, best_block_id: best?.block_id ?? null, predicted: best?.predicted ?? null, entailment: best?.probs.ENTAILMENT ?? null };
    });
    const supported = units.filter((u) => u.predicted === 'ENTAILMENT').length;
    return {
      ...base,
      skipped: null,
      n_blocks: p.blocks.length,
      n_units: units.length,
      nli_support_rate: p.blocks.length ? rate(supported, units.length) : null,
      unverified_numbers: p.regex.unverifiedNumbers,
      unverified_proper_nouns: p.regex.unverifiedNouns,
      fact_units: units,
    };
  });

  const byId = new Map(rows.map(({ c }) => [c.id, c]));
  const caseOf = (r) => byId.get(r.id);
  const fn = (rs) => {
    const measured = rs.filter((r) => !r.skipped);
    return {
      n: rs.length,
      n_measured: measured.length,
      n_skipped_no_claim: rs.filter((r) => r.skipped === 'NO_CLAIM_STATUS').length,
      nli_support_rate_avg: avg(measured.map((r) => r.nli_support_rate)),
      unverified_number_case_rate: rate(measured.filter((r) => r.unverified_numbers.length).length, measured.length),
      unverified_noun_case_rate: rate(measured.filter((r) => r.unverified_proper_nouns.length).length, measured.length),
    };
  };
  const summary = { run_id: runId, premise: 'context blocks + user info/API + history', ...summarizeScopes(scored, caseOf, fn) };
  writeJsonl(path.join(scoredDir, 'rag_grounding.jsonl'), scored);
  writeJson(path.join(scoredDir, 'rag_grounding_summary.json'), summary);
  const { label, s } = headlineScope(summary);
  console.log(`NLI 지지율 평균 ${pct(s.nli_support_rate_avg)} · 미확인 숫자 포함 ${pct(s.unverified_number_case_rate)} (${label} 측정 ${s.n_measured}행)`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
