'use strict';
// 반복 일관성 (항목: "반복 사실 일관성"): 380문항 파일부터는 반복테스트가
// 데이터셋 자체에 내장돼 있음 — 40개 문항이 실행 회차 1/2/3으로 3번씩
// 들어있고(ID: `SF-0001`/`SF-0001-R2`/`SF-0001-R3`, 전부 같은 `원본 ID`),
// 나머지 260문항은 회차 1만 있음. 그래서 이 스크립트는 (예전처럼) 여러
// run_id를 따로 받을 필요 없이, **단일 run_id** 안에서 원본 ID로 묶어
// 회차끼리 비교한다 — 한 번 생성(run_generation.js)하면 반복 데이터도
// 같이 나옴.
//
// 표현(패러프레이즈) 차이는 무시하고, 사실(status/숫자/evidence_ids)이
// 흔들리는지만 판정 (표현 차이는 실패 아님 — 일관된 오답만 실패로 침).
//
//   results/scored/test2/<run_id>/repeat_consistency.jsonl
//   results/scored/test2/<run_id>/repeat_consistency_summary.json
//
// Usage: node scripts/score_repeat_consistency.js <run_id>

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { readAll, readExistingIds, makeAppender } = require('./lib/jsonl');
const { extractNumbers } = require('./lib/regex_checks');
const { cosineSimilarity } = require('./lib/vectors');
const ollama = require('./lib/ollama');
const models = require('./config/models');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');
const EMBED_CHUNK_SIZE = 32;

function setEquals(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

async function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/score_repeat_consistency.js <run_id>');
    process.exit(1);
  }

  const cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  const casesById = Object.fromEntries(cases.map((c) => [c['ID'], c]));

  const genPath = path.join(ROOT, 'results', 'raw', 'test2', runId, 'generation.jsonl');
  const generation = readAll(genPath);
  const genById = Object.fromEntries(generation.map((r) => [r.id, r]));

  // 원본 ID로 그룹핑, 2회차 이상 있는 것만 반복 대상.
  const groups = {};
  for (const c of cases) {
    const origId = c['원본 ID'] || c['ID'];
    (groups[origId] = groups[origId] || []).push(c);
  }
  const allRepeatGroups = Object.entries(groups).filter(([, members]) => members.length > 1);
  console.log(`반복 대상 문항: ${allRepeatGroups.length}건 (각 ${allRepeatGroups[0]?.[1].length ?? 0}회차)`);

  if (allRepeatGroups.length === 0) {
    console.warn('반복 평가 대상(원본 ID가 2번 이상 나오는 케이스)이 없습니다 — cases.csv를 확인하세요.');
  }

  // 2026-09-17 추가: 체크포인트 — 이미 채점된 원본ID는 건너뛰어서(임베딩
  // 호출도 다시 안 함) 크래시 후 재실행 시 처음부터 다시 안 해도 되게 함.
  const outDir = path.join(ROOT, 'results', 'scored', 'test2', runId);
  const outPath = path.join(outDir, 'repeat_consistency.jsonl');
  const alreadyDone = readExistingIds(outPath, 'original_id');
  const repeatGroups = allRepeatGroups.filter(([origId]) => !alreadyDone.has(origId));
  console.log(`이미 완료 ${alreadyDone.size}건, 이번에 처리할 건수 ${repeatGroups.length}건`);

  // 임베딩 대상(패러프레이즈 유사도, 참고용 정보 지표) 모으기.
  const embedTargets = [];
  for (const [, members] of repeatGroups) {
    for (const m of members) {
      const g = genById[m['ID']];
      const answer = g && g.parsed && typeof g.parsed.answer === 'string' ? g.parsed.answer : null;
      if (answer) embedTargets.push({ origId: m['원본 ID'], caseId: m['ID'], text: answer });
    }
  }
  console.log(`임베딩 대상 ${embedTargets.length}건 (반복 일관성 유사도 계산용)`);
  let vectors = [];
  if (embedTargets.length > 0) {
    for (let i = 0; i < embedTargets.length; i += EMBED_CHUNK_SIZE) {
      const chunk = embedTargets.slice(i, i + EMBED_CHUNK_SIZE);
      const vecs = await ollama.withRetry(
        () => ollama.embed(models.embeddingModel, chunk.map((t) => t.text)),
        { label: `bge-m3 embed (repeat consistency chunk ${i})` }
      );
      vectors.push(...vecs);
      process.stdout.write(`\r  임베딩 ${Math.min(i + EMBED_CHUNK_SIZE, embedTargets.length)}/${embedTargets.length}`);
    }
    if (embedTargets.length > 0) process.stdout.write('\n');
  }
  const vecByCaseId = {};
  embedTargets.forEach((t, idx) => { vecByCaseId[t.caseId] = vectors[idx]; });

  fs.mkdirSync(outDir, { recursive: true });
  const appender = makeAppender(outPath); // append 모드 — 체크포인트 보존

  let statusConsistentN = 0, numbersConsistentN = 0, evidenceConsistentN = 0, overallConsistentN = 0, scoredGroups = 0;
  const allPairwiseSims = [];

  for (const [origId, members] of repeatGroups) {
    // 실행 회차 순으로 정렬(1, 2, 3 ...).
    const sorted = [...members].sort((a, b) => Number(a['실행 회차']) - Number(b['실행 회차']));
    const perRun = sorted.map((m) => {
      const g = genById[m['ID']];
      const parsed = g && g.parsed;
      return {
        case_id: m['ID'],
        round: m['실행 회차'],
        status: parsed ? parsed.status : null,
        answer: parsed && typeof parsed.answer === 'string' ? parsed.answer : null,
        numbers: parsed && typeof parsed.answer === 'string' ? new Set(extractNumbers(parsed.answer)) : new Set(),
        evidenceIds: parsed && Array.isArray(parsed.evidence_ids) ? new Set(parsed.evidence_ids) : new Set(),
      };
    });

    if (perRun.some((r) => !genById[r.case_id])) {
      // 아직 전체 회차가 다 생성되지 않음 — 이번엔 스킵(run_generation.js를
      // 마저 돌리면 다음 실행 때 채점됨).
      continue;
    }
    scoredGroups++;

    const statuses = perRun.map((r) => r.status);
    const statusConsistent = statuses.every((s) => s === statuses[0]);
    const numberSets = perRun.map((r) => r.numbers);
    const numbersConsistent = numberSets.every((s) => setEquals(s, numberSets[0]));
    const evidenceSets = perRun.map((r) => r.evidenceIds);
    const evidenceConsistent = evidenceSets.every((s) => setEquals(s, evidenceSets[0]));

    // 표현(패러프레이즈) 차이 참고용 — 일관성 판정에는 안 씀, 정보성 지표.
    const vecs = perRun.map((r) => vecByCaseId[r.case_id]);
    const pairwiseSims = [];
    for (let i = 0; i < vecs.length; i++) {
      for (let j = i + 1; j < vecs.length; j++) {
        if (vecs[i] && vecs[j]) pairwiseSims.push(cosineSimilarity(vecs[i], vecs[j]));
      }
    }
    const avgSim = pairwiseSims.length ? pairwiseSims.reduce((a, b) => a + b, 0) / pairwiseSims.length : null;
    if (avgSim !== null) allPairwiseSims.push(avgSim);

    // 최종 일관성 = 사실(상태+숫자)이 흔들리지 않았는가. 표현 차이는 무관.
    const overallConsistent = statusConsistent && numbersConsistent;
    if (statusConsistent) statusConsistentN++;
    if (numbersConsistent) numbersConsistentN++;
    if (evidenceConsistent) evidenceConsistentN++;
    if (overallConsistent) overallConsistentN++;

    appender.append({
      original_id: origId, run_id: runId,
      status_consistent: statusConsistent,
      numbers_consistent: numbersConsistent,
      evidence_consistent: evidenceConsistent,
      overall_consistent: overallConsistent,
      avg_paraphrase_similarity: avgSim,
      per_run: perRun.map((r) => ({ case_id: r.case_id, round: r.round, status: r.status, numbers: [...r.numbers], evidence_ids: [...r.evidenceIds] })),
    });
  }
  appender.close();

  // 요약은 이번 실행분뿐 아니라 파일 전체(이전에 체크포인트로 저장된 것
  // 포함)를 다시 읽어서 계산 — 재개 실행 시에도 정확한 전체 집계가 나오게.
  const allRows = readAll(outPath);
  const total = allRows.length || 1;
  const summary = {
    run_id: runId, n: allRows.length, expected: allRepeatGroups.length,
    status_consistency_rate: allRows.filter((r) => r.status_consistent).length / total,
    numbers_consistency_rate: allRows.filter((r) => r.numbers_consistent).length / total,
    evidence_consistency_rate: allRows.filter((r) => r.evidence_consistent).length / total,
    overall_consistency_rate: allRows.filter((r) => r.overall_consistent).length / total,
    avg_paraphrase_similarity: (() => {
      const sims = allRows.map((r) => r.avg_paraphrase_similarity).filter((s) => s !== null && s !== undefined);
      return sims.length ? sims.reduce((a, b) => a + b, 0) / sims.length : null;
    })(),
  };
  fs.writeFileSync(path.join(outDir, 'repeat_consistency_summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`반복 일관성(사실 기준, 전체 ${allRows.length}건): ${allRows.filter((r) => r.overall_consistent).length}/${allRows.length} (${(summary.overall_consistency_rate * 100).toFixed(1)}%)`);
  console.log(`  status 일치 ${(summary.status_consistency_rate * 100).toFixed(1)}% / 숫자 일치 ${(summary.numbers_consistency_rate * 100).toFixed(1)}% / evidence_ids 일치 ${(summary.evidence_consistency_rate * 100).toFixed(1)}%`);
  console.log(`결과 -> ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
