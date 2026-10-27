'use strict';
// pipeline_test_v1 채점. run 폴더의 results.jsonl(케이스 + 응답 + 백엔드 trace)과, 있으면 Judge 판정을 합쳐 지표를 낸다.
// 정의는 pipeline_test_v1/SETUP.md 1절. 결정론 지표(경로·status·검색·누출)는 여기서 계산하고, 정답·환각은 Judge 결과를 읽는다.
//
//   출력: pipeline_test_v1/<try>/results/raw/scored/<run_id>/{case_scores.jsonl, summary.json}
//
// 실패 원인(한 케이스에 하나, 앞 단계 우선): EXEC_ERROR → QUERY_VARIANT_MISS → RETRIEVAL_MISS → STATUS_MISMATCH → ANSWER_INCORRECT
//   - 케이스가 성공(status 일치 + Judge CORRECT, Judge가 없으면 status 일치)이면 원인 없음.
//   - 검색 지표는 성공 여부와 별개로도 따로 센다(retrieval).
//
// 매장 검색 적중(2026-10-21): 정답 FAQ가 모두 STORE_DATA인 하위 질문은 통과 목록에 STORE_DATA FAQ가 하나라도 있으면 HIT.
//   STORE_DATA FAQ는 대부분 지명만 다른 같은 질문이고, 어느 것이 걸려도 같은 매장 조회 도구 경로로 간다.
// Judge 배치를 여러 개 주면(--judge-batch a,b) 뒤 배치의 판정이 같은 케이스의 앞 배치 판정을 덮는다.
//
// Usage: node scripts/score/score_pipeline.js --runs <run_id>[,<run_id>] [--test pipeline_test_v1] [--try try1] [--judge-batch <batch>[,<batch>]]

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('../lib/csv');

const ROOT = path.join(__dirname, '..', '..');
// 케이스셋·FAQ 스냅샷은 pipeline_test_v1/cases를 모든 회차가 같이 쓴다. run·판정·채점은 --test 폴더(기본 pipeline_test_v1).
const CASES_DIR = path.join(ROOT, 'pipeline_test_v1', 'cases');
const SYSTEM_ABSTAIN_CODES = new Set(['CHAT-012', 'CHAT-013']);
// 하위 질문별 status를 받고 최종 status를 코드가 조합하는 모드. subp는 하위 질문 status에 PARTIAL을 허용한다.
// slot은 하위 질문별 칸(answer → status)이고, trace의 answer는 ANSWER 칸의 answer만 이은 것이다.
const SUB_MODES = new Set(['sub', 'subp', 'slot']);

// 모델 본문의 "답하지 못함" 안내. 코드 고지(sub 모드의 code_notice)는 모델 본문이 아니라 여기 들어오지 않는다.
const NOTICE_PATTERNS = [
  /확인할\s?수\s?없/, /확인이\s?(어렵|불가)/, /확인해\s?드리기\s?어렵/, /안내(해)?\s?드리기\s?어렵/,
  /답변(을)?\s?(드리기|해\s?드리기)\s?어렵/, /(답할|답변할|답변드릴|안내할|안내드릴)\s?수\s?없/, /제공(되지|하지)\s?않/,
  /(자료|정보|안내|FAQ)(에|에는|에서|에서는)\s?(없|포함되어\s?있지\s?않|나와\s?있지\s?않)/, /포함되어\s?있지\s?않/,
  /알\s?수\s?없/, /확정(할|하기)\s?(수\s?없|어렵)/, /정보가\s?없/, /범위\s?밖/, /명시되어\s?있지\s?않/, /언급되어\s?있지\s?않/,
];
// 사용자에게 되묻기. 물음표로 끝나는 문장과 정보를 달라는 요청.
const ASK_PATTERNS = [/[?？]\s*$/, /알려\s?주시면/, /말씀해\s?주시면/, /알려\s?주세요/, /말씀해\s?주세요/, /입력해\s?주시면/];
// 문의처 안내(누출로 세지 않고 따로 센다).
const REFER_PATTERNS = [/고객센터.{0,10}(문의|연락|확인)/, /문의해\s?주세요/, /문의하시/];

function parseArgs(argv) {
  const args = { runs: [], testName: 'pipeline_test_v1', tryName: 'try1', judgeBatch: null };
  for (let i = 0; i < argv.length; i++) {
    const value = () => argv[++i];
    switch (argv[i]) {
      case '--runs': args.runs = value().split(','); break;
      case '--test': args.testName = value(); break;
      case '--try': args.tryName = value(); break;
      case '--judge-batch': args.judgeBatch = value(); break;
      default: throw new Error(`알 수 없는 인자: ${argv[i]}`);
    }
  }
  if (!args.runs.length) throw new Error('--runs가 필요합니다.');
  return args;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}

const norm = (text) => String(text || '').replace(/\s+/g, '');
const rate = (n, d) => (d ? Math.round((n / d) * 10000) / 100 : null);
const union = (...lists) => [...new Set(lists.flat().filter(Boolean).map(String))];

// 부분 답변 라벨: 느슨·엄격 라벨이 갈리는 하위 질문(IN 전부·ST-017·020·021·UD-001 — 일부만 답할 수 있음)은 PARTIAL로 본다.
const partialLabel = (sub) => (sub.status !== sub.status_strict ? 'PARTIAL' : sub.status);
// 백엔드 SubQuestionStatuses.combine과 같은 규칙(하위 PARTIAL 포함).
function combineStatuses(statuses) {
  if (statuses.every((s) => s === 'ANSWER')) return 'ANSWER';
  if (statuses.some((s) => s === 'ANSWER' || s === 'PARTIAL')) return 'PARTIAL';
  if (new Set(statuses).size === 1) return statuses[0];
  return ['CONFLICT', 'ABSTAIN', 'OUT_OF_SCOPE'].find((s) => statuses.includes(s)) ?? null;
}

function sentences(text) {
  return String(text || '').split(/(?<=[.!?？。])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

/** 패턴에 걸린 문장 중, 근거 FAQ 원문에 같은 표현이 있는 문장(FAQ 인용)은 따로 뺀다. */
function findSentences(text, patterns, faqTexts) {
  const hits = [];
  const quotes = [];
  for (const sentence of sentences(text)) {
    const match = patterns.map((p) => sentence.match(p)).find(Boolean);
    if (!match) continue;
    const at = match.index ?? 0;
    const snippet = norm(sentence.slice(Math.max(0, at - 6), at + match[0].length + 6));
    (faqTexts.some((faq) => faq.includes(snippet)) ? quotes : hits).push(sentence);
  }
  return { hits, quotes };
}

function actualPath(result) {
  const final = result.response?.final;
  if (result.response?.error || !final) return 'RUNNER_ERROR';
  if (final.timed_out) return 'TIMEOUT';
  if (final.http_status && final.http_status !== 202) return `HTTP_${final.http_status}`;
  if (final.status === 'SUCCEEDED') return result.trace?.answer_llm ? 'LLM' : 'SUCCEEDED_NO_LLM';
  return final.error_code || 'FAILED';
}

const isStoreFaq = (faqs, id) => faqs.get(String(id))?.intent === 'STORE_DATA';

function scoreCase(result, mode, faqs, judgment) {
  const trace = result.trace || {};
  const llm = trace.answer_llm || null;
  const expected = result.expected;
  const pathActual = actualPath(result);
  const systemAbstain = SYSTEM_ABSTAIN_CODES.has(pathActual);
  const execError = !(pathActual === 'LLM' || systemAbstain || pathActual === 'SUCCEEDED_NO_LLM');

  // 최종 status: single은 모델이 낸 status, sub는 코드가 조합한 status. 검색 단계에서 끝나면 SYSTEM_ABSTAIN.
  let finalActual = null;
  if (systemAbstain) finalActual = 'SYSTEM_ABSTAIN';
  else if (llm) finalActual = SUB_MODES.has(mode) ? llm.combined_status ?? null : llm.status ?? null;
  const matches = (expectedStatus) => {
    if (expected.path === 'ANY') return systemAbstain || finalActual === expectedStatus;
    if (systemAbstain) return expectedStatus === 'ABSTAIN';
    return finalActual === expectedStatus;
  };
  const statusMatch = matches(expected.final_status);
  const statusMatchStrict = matches(expected.final_status_strict);
  const expectedFinalPartial = combineStatuses(expected.sub_questions.map(partialLabel));
  const statusMatchPartial = matches(expectedFinalPartial);
  const statusMatchLlmOnly = !systemAbstain && finalActual === expected.final_status;

  // 하위 질문별 status(sub 모드): 기대 하위 질문 수와 모델 칸 수가 같을 때만 자리별로 비교한다.
  let subStatus = null;
  if (SUB_MODES.has(mode) && llm) {
    const actualStatuses = llm.statuses || [];
    const aligned = actualStatuses.length === expected.sub_questions.length;
    subStatus = {
      slots: llm.status_slots ?? null, statuses: actualStatuses, valid: llm.statuses_valid ?? null, aligned,
      matches: aligned ? expected.sub_questions.map((sub, i) => actualStatuses[i] === sub.status) : null,
      matches_strict: aligned ? expected.sub_questions.map((sub, i) => actualStatuses[i] === sub.status_strict) : null,
      matches_partial: aligned ? expected.sub_questions.map((sub, i) => actualStatuses[i] === partialLabel(sub)) : null,
    };
  }

  // 검색: 기대 하위 질문마다 근거 FAQ가 실제 검색(통과) 결과에 있었는지. 없으면 원문 조각 재검색(shadow)에는 있었는지.
  const subs = trace.sub_questions || [];
  const retrieved = union(trace.search_first?.passed_faq_ids || [], ...subs.map((s) => s.passed_faq_ids || []));
  const shadow = union(retrieved, ...subs.map((s) => s.shadow?.passed_faq_ids || []));
  const retrieval = expected.sub_questions.filter((sub) => sub.gold_faq_ids.length).map((sub) => {
    const storeGold = sub.gold_faq_ids.every((id) => isStoreFaq(faqs, id));
    const matchIn = (list) => sub.gold_faq_ids.some((id) => list.includes(id)) || (storeGold && list.some((id) => isStoreFaq(faqs, id)));
    const hit = matchIn(retrieved);
    const shadowHit = matchIn(shadow);
    return { index: sub.index, expected_status: sub.status, hit,
      verdict: hit ? 'HIT' : shadowHit ? 'QUERY_VARIANT_MISS' : 'RETRIEVAL_MISS' };
  });

  // 누출: 모델 본문(코드 안내를 붙이기 전)에서 센다.
  const modelAnswer = llm ? llm.answer ?? '' : null;
  const faqTexts = union(llm?.prompt_faq_ids || [], retrieved, ...expected.sub_questions.map((s) => s.gold_faq_ids))
    .map((id) => norm(faqs.get(id)?.answer));
  const notice = modelAnswer == null ? null : findSentences(modelAnswer, NOTICE_PATTERNS, faqTexts);
  const ask = modelAnswer == null ? null : findSentences(modelAnswer, ASK_PATTERNS, faqTexts);
  const refer = modelAnswer == null ? null : findSentences(modelAnswer, REFER_PATTERNS, faqTexts);

  const judgeOk = judgment ? judgment.accuracy === 'CORRECT' : null;
  const passed = !execError && statusMatch && (judgment ? judgeOk : true);
  let cause = null;
  if (execError) cause = 'EXEC_ERROR';
  else if (!passed) {
    const missed = retrieval.filter((r) => r.verdict !== 'HIT');
    if (missed.some((r) => r.verdict === 'QUERY_VARIANT_MISS')) cause = 'QUERY_VARIANT_MISS';
    else if (missed.some((r) => r.expected_status === 'ANSWER')) cause = 'RETRIEVAL_MISS';
    else if (!statusMatch) cause = 'STATUS_MISMATCH';
    else cause = 'ANSWER_INCORRECT';
  }

  return {
    id: result.id, type: result.type, mode,
    path: pathActual, exec_error: execError, system_abstain: systemAbstain,
    expected_path: expected.path, expected_final: expected.final_status, expected_final_strict: expected.final_status_strict,
    expected_final_partial: expectedFinalPartial,
    final_actual: finalActual, status_match: statusMatch, status_match_strict: statusMatchStrict,
    status_match_partial: statusMatchPartial, status_match_llm_only: statusMatchLlmOnly,
    sub_status: subStatus,
    planner: trace.planner ? { judge_called: !!trace.planner.judge_called, source: trace.planner.source ?? null,
      sub_question_count: trace.planner.sub_question_count ?? null, expected_sub_question_count: expected.sub_questions.length } : null,
    retrieval,
    model_answer_empty: modelAnswer == null ? null : !modelAnswer.trim(),
    leak: modelAnswer == null ? null : {
      notice: notice.hits.length > 0, ask_back: ask.hits.length > 0, any: notice.hits.length + ask.hits.length > 0,
      refer: refer.hits.length > 0, notice_sentences: notice.hits, ask_sentences: ask.hits, faq_quotes: [...notice.quotes, ...ask.quotes],
    },
    code_notice: llm?.code_notice ?? null,
    judge: judgment ? {
      accuracy: judgment.accuracy, sub_outcomes: judgment.sub_results.map((s) => s.outcome), is_grounded: judgment.is_grounded,
      grounding_score: judgment.grounding_score, claim_types: judgment.hallucinated_claims.map((c) => c.type),
      decline_notice: judgment.decline_notice, asks_user: judgment.asks_user, query_rewrite: judgment.query_rewrite,
    } : null,
    passed, failure_cause: cause,
    latency_ms: result.response?.final?.elapsed_ms ?? null,
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const k = key(item);
    if (k !== undefined) acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function summarize(scores) {
  const n = scores.length;
  const llm = scores.filter((s) => s.path === 'LLM');
  const judged = scores.filter((s) => s.judge);
  const leakBase = llm;
  const subScores = scores.filter((s) => s.sub_status);
  const subAligned = subScores.filter((s) => s.sub_status.aligned);
  const subPairs = subAligned.flatMap((s) => s.sub_status.matches);
  const subPairsStrict = subAligned.flatMap((s) => s.sub_status.matches_strict);
  const subPairsPartial = subAligned.flatMap((s) => s.sub_status.matches_partial);
  const retrievalItems = scores.flatMap((s) => s.retrieval);
  const expectEmpty = llm.filter((s) => ['ABSTAIN', 'OUT_OF_SCOPE'].includes(s.expected_final));
  const subOutcomes = judged.flatMap((s) => s.judge.sub_outcomes);
  return {
    cases: n,
    paths: countBy(scores, (s) => s.path),
    exec_error: { count: scores.filter((s) => s.exec_error).length },
    status: {
      match: scores.filter((s) => s.status_match).length, match_rate: rate(scores.filter((s) => s.status_match).length, n),
      match_strict: scores.filter((s) => s.status_match_strict).length,
      match_strict_rate: rate(scores.filter((s) => s.status_match_strict).length, n),
      match_partial: scores.filter((s) => s.status_match_partial).length,
      match_partial_rate: rate(scores.filter((s) => s.status_match_partial).length, n),
      match_llm_only_among_llm: llm.filter((s) => s.status_match_llm_only).length, llm_cases: llm.length,
      confusion: countBy(scores, (s) => `${s.expected_final} -> ${s.final_actual}`),
    },
    sub_status: subScores.length ? {
      cases: subScores.length, aligned_cases: subAligned.length, valid_cases: subScores.filter((s) => s.sub_status.valid).length,
      pair_match: subPairs.filter(Boolean).length, pairs: subPairs.length, pair_match_rate: rate(subPairs.filter(Boolean).length, subPairs.length),
      pair_match_strict_rate: rate(subPairsStrict.filter(Boolean).length, subPairsStrict.length),
      pair_match_partial_rate: rate(subPairsPartial.filter(Boolean).length, subPairsPartial.length),
    } : null,
    retrieval: { sub_questions: retrievalItems.length, verdicts: countBy(retrievalItems, (r) => r.verdict),
      hit_rate: rate(retrievalItems.filter((r) => r.hit).length, retrievalItems.length) },
    planner: { judge_called: scores.filter((s) => s.planner?.judge_called).length,
      sub_count_match: scores.filter((s) => s.planner && s.planner.sub_question_count === s.planner.expected_sub_question_count).length },
    leak: {
      base_llm_cases: leakBase.length,
      any: leakBase.filter((s) => s.leak.any).length, any_rate: rate(leakBase.filter((s) => s.leak.any).length, leakBase.length),
      notice: leakBase.filter((s) => s.leak.notice).length, ask_back: leakBase.filter((s) => s.leak.ask_back).length,
      refer: leakBase.filter((s) => s.leak.refer).length,
      judge_decline_notice: judged.filter((s) => s.judge.decline_notice).length,
      judge_asks_user: judged.filter((s) => s.judge.asks_user).length, judged: judged.length,
    },
    empty_answer_when_expected_decline: { cases: expectEmpty.length, empty: expectEmpty.filter((s) => s.model_answer_empty).length },
    judge: judged.length ? {
      judged: judged.length, correct: judged.filter((s) => s.judge.accuracy === 'CORRECT').length,
      correct_rate: rate(judged.filter((s) => s.judge.accuracy === 'CORRECT').length, judged.length),
      grounded: judged.filter((s) => s.judge.is_grounded).length,
      hallucination_rate: rate(judged.filter((s) => !s.judge.is_grounded).length, judged.length),
      claim_types: countBy(judged.flatMap((s) => s.judge.claim_types), (t) => t),
      sub_outcomes: countBy(subOutcomes, (o) => o),
      query_rewrite: countBy(judged, (s) => s.judge.query_rewrite),
    } : null,
    passed: scores.filter((s) => s.passed).length, passed_rate: rate(scores.filter((s) => s.passed).length, n),
    failure_causes: countBy(scores.filter((s) => s.failure_cause), (s) => s.failure_cause),
    latency_ms_avg: Math.round(scores.reduce((a, s) => a + (s.latency_ms || 0), 0) / Math.max(1, n)),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const faqs = new Map(parseCsvObjects(fs.readFileSync(path.join(CASES_DIR, 'faq_snapshot.csv'), 'utf8'))
    .map((row) => [String(row.faqId), row]));
  const tryDir = path.join(ROOT, args.testName, args.tryName);
  for (const runId of args.runs) {
    const runDir = path.join(tryDir, 'results', 'raw', runId);
    const runInfo = JSON.parse(fs.readFileSync(path.join(runDir, 'run_info.json'), 'utf8'));
    const mode = runInfo.status_mode;
    const results = readJsonl(path.join(runDir, 'results.jsonl'));
    const judgments = new Map();
    for (const batch of args.judgeBatch ? args.judgeBatch.split(',') : []) {
      const file = path.join(tryDir, 'results', 'llm_judge', batch, `${runId}.judgments.jsonl`);
      for (const row of readJsonl(file)) if (!row.error) judgments.set(row.id, row);
    }
    const scores = results.map((r) => scoreCase(r, mode, faqs, judgments.get(r.id)));
    const byType = {};
    for (const type of [...new Set(scores.map((s) => s.type))]) byType[type] = summarize(scores.filter((s) => s.type === type));
    const summary = { run_id: runId, status_mode: mode, judge_batch: args.judgeBatch, scored_at: new Date().toISOString(),
      overall: summarize(scores), by_type: byType };
    const outDir = path.join(tryDir, 'results', 'raw', 'scored', runId);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'case_scores.jsonl'), scores.map((s) => JSON.stringify(s)).join('\n') + '\n');
    fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    const o = summary.overall;
    console.log(`${runId} [${mode}] cases=${o.cases} status=${o.status.match_rate}% leak=${o.leak.any_rate}% `
      + `retrieval_hit=${o.retrieval.hit_rate}% judge_correct=${o.judge?.correct_rate ?? '-'}% passed=${o.passed_rate}%`);
  }
}

if (require.main === module) main();

module.exports = { scoreCase, summarize };
