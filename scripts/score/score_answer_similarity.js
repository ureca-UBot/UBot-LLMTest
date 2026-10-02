'use strict';
// 결과론적 정확도: 정답 예시와의 의미 유사도(BGE-M3 코사인)와 필수 사실 키워드 포함률.
// 통과/실패 임계값 없이 값 자체와 분포로 보고한다(README 4-9절). 의미 정답 여부는
// LLM Judge가 판단한다.
//
//   raw/scored/<run_id>/answer_similarity.jsonl          (재개 가능 — 이미 계산한 ID는 건너뜀)
//   raw/scored/<run_id>/answer_similarity_summary.json
//
// Usage: node scripts/score/score_answer_similarity.js <run_id> [--test v4] [--try try1]

const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, summarizeScopes, headlineScope, writeJson, runIdArg } = require('../lib/run_data');
const { readAll, readExistingIds, makeAppender } = require('../lib/jsonl');
const { keywordCoverage } = require('../lib/metrics');
const { cosineSimilarity } = require('../lib/vectors');
const { distribution, avg, pct, num } = require('../lib/stats');
const ollama = require('../lib/ollama');

const CHUNK = 32;

async function main() {
  const runId = runIdArg(argv);
  const { config } = profile.load();
  const { rows, scoredDir } = loadRun(runId);
  const outPath = path.join(scoredDir, 'answer_similarity.jsonl');
  const done = readExistingIds(outPath, 'id');

  const todo = rows.filter(({ g, c }) => !done.has(g.id) && c.referenceAnswer
    && g.parsed && typeof g.parsed.answer === 'string' && g.parsed.answer.trim());
  console.log(`유사도 대상 ${todo.length}건 (이미 완료 ${done.size}건)`);

  const appender = makeAppender(outPath);
  for (let i = 0; i < todo.length; i += CHUNK) {
    const chunk = todo.slice(i, i + CHUNK);
    const vectors = await ollama.withRetry(
      () => ollama.embed(config.embeddingModel, chunk.flatMap(({ g, c }) => [g.parsed.answer, c.referenceAnswer])),
      { label: `embed ${i}-${i + chunk.length}` }
    );
    chunk.forEach(({ g, c }, j) => {
      const kw = keywordCoverage(c.requiredFacts, g.parsed.answer);
      appender.append({
        id: g.id, run_id: runId, model_tag: g.model_tag,
        similarity: cosineSimilarity(vectors[j * 2], vectors[j * 2 + 1]),
        keyword_coverage: kw.coverage,
        keyword_missed: kw.missed,
        answer_chars: g.parsed.answer.length,
        reference_chars: c.referenceAnswer.length,
      });
    });
    console.log(`  ${Math.min(i + CHUNK, todo.length)}/${todo.length}`);
  }
  appender.close();

  // 응답이 없는 행(생성 실패·포맷 실패)은 유사도 분모에서 빠지므로 건수를 따로 남긴다.
  const scored = readAll(outPath);
  const byId = new Map(rows.map(({ c }) => [c.id, c]));
  const caseOf = (r) => byId.get(r.id);
  const fn = (rs) => ({
    n_scored: rs.length,
    similarity: distribution(rs.map((r) => r.similarity)),
    keyword_coverage_avg: avg(rs.map((r) => r.keyword_coverage)),
    length_ratio_avg: avg(rs.map((r) => (r.reference_chars ? r.answer_chars / r.reference_chars : null))),
  });
  const summary = {
    run_id: runId,
    embedding_model: config.embeddingModel,
    n_rows: rows.length,
    n_without_answer: rows.length - scored.length,
    ...summarizeScopes(scored, caseOf, fn),
  };
  writeJson(path.join(scoredDir, 'answer_similarity_summary.json'), summary);
  const { label, s } = headlineScope(summary, 'n_scored');
  console.log(`정답 유사도 평균 ${s.similarity.mean === null ? 'N/A' : num(s.similarity.mean * 100, 1)} · 키워드 포함률 ${pct(s.keyword_coverage_avg)} (${label} ${s.n_scored}행)`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
