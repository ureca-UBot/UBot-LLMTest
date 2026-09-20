'use strict';
// Stage 2c (항목1 답변정확도): BGE-M3(Ollama) 임베딩 코사인 유사도 + 키워드
// 커버리지. 둘 다 결정론적(생성 없음, 순수 계산) — README 8-1절 원칙 그대로.
// 집계(통과율)는 고유 문항(실행 회차=1)만 기준으로 함 — 반복 대상 40문항이
// 3배로 잡혀서 집계가 편향되지 않도록.
//
//   results/scored/test2/<run_id>/answer_accuracy.jsonl
//
// Usage: node scripts/score_answer_accuracy.js <run_id>

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { readAll, readExistingIds, makeAppender } = require('./lib/jsonl');
const { keywordCoverage } = require('./lib/metrics');
const { cosineSimilarity } = require('./lib/vectors');
const { isPrimaryRound } = require('./lib/rounds');
const ollama = require('./lib/ollama');
const models = require('./config/models');
const thresholds = require('./config/thresholds');
const suitePaths = require('./lib/suite');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');
const EMBED_CHUNK_SIZE = 32;

async function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/score_answer_accuracy.js <run_id>');
    process.exit(1);
  }
  const cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  const casesById = Object.fromEntries(cases.map((c) => [c['ID'], c]));

  const genPath = suitePaths.generationPath(runId);
  const rows = readAll(genPath).filter((r) => r.parsed && typeof r.parsed.answer === 'string');

  const outPath = path.join(suitePaths.scoredDir(runId), 'answer_accuracy.jsonl');
  const alreadyDone = readExistingIds(outPath, 'id');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const appender = makeAppender(outPath); // append mode — resumable

  const usable = [];
  for (const r of rows) {
    if (alreadyDone.has(r.id)) continue;
    const c = casesById[r.id];
    const reference = c && c['정답 예시'];
    if (!c || !reference) continue;
    usable.push({ r, c });
  }
  console.log(`대상 ${usable.length}건 (이미 완료 ${alreadyDone.size}건 스킵)`);

  let passCount = 0, primaryCount = 0;
  for (let i = 0; i < usable.length; i += EMBED_CHUNK_SIZE) {
    const chunk = usable.slice(i, i + EMBED_CHUNK_SIZE);
    const texts = chunk.flatMap(({ r, c }) => [r.parsed.answer, c['정답 예시']]);
    const vectors = await ollama.withRetry(
      () => ollama.embed(models.embeddingModel, texts),
      { label: `bge-m3 embed (chunk ${i}-${i + chunk.length})` }
    );

    chunk.forEach(({ r, c }, j) => {
      const answerVec = vectors[j * 2];
      const refVec = vectors[j * 2 + 1];
      const similarity = cosineSimilarity(answerVec, refVec);
      const kw = keywordCoverage(c['필수 포함 사실'], r.parsed.answer);
      const similarityPass = similarity !== null && similarity >= thresholds.bgeM3SimilarityPass;
      // 2026-09-17 수정: BGE-M3 유사도만으로 통과시키면 "필수 사실 하나가
      // 통째로 빠졌는데 나머지 문장이 비슷해서 유사도는 높은" 누락형 오류를
      // 놓침(사용자 지적) — 커버리지 계산이 이미 있었는데 판정에 안 쓰이고
      // 있었음. 이제 둘 다 통과해야 함(커버리지를 계산 못 하는 케이스는
      // 유사도만으로 판단).
      const coveragePass = kw.coverage === null || kw.coverage >= thresholds.keywordCoveragePass;
      const pass = similarityPass && coveragePass;
      const primary = isPrimaryRound(c);
      if (primary) { primaryCount++; if (pass) passCount++; }

      appender.append({
        id: r.id, run_id: runId, model_tag: r.model_tag, env: r.env,
        bge_m3_similarity: similarity,
        similarity_pass: similarityPass,
        keyword_coverage: kw.coverage,
        keyword_coverage_pass: coveragePass,
        keyword_missed: kw.missed,
        pass,
      });
    });
    console.log(`  ${Math.min(i + EMBED_CHUNK_SIZE, usable.length)}/${usable.length}`);
  }
  appender.close();

  console.log(`항목1(답변정확도): 고유문항(회차1) 기준 유사도 통과 ${passCount}/${primaryCount} (${((passCount / (primaryCount || 1)) * 100).toFixed(1)}%) -> ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
