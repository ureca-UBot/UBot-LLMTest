'use strict';
// 체크리스트 3·4번: "결과(점수+실제 질문+정답+LLM답변)가 한 파일에" +
// "재확인 필요 문항도 같은 파일에". 항목별 jsonl은 원래 설계대로 그대로
// 유지(기계가 읽기 좋은 소스), 이 스크립트는 그걸 다 조인해서 **사람이
// 엑셀로 바로 열어볼 수 있는 단일 CSV**를 만든다 — 실제 질문/정답 예시/
// LLM 답변/항목별 점수/재확인필요여부가 한 행에 다 들어감.
//
//   results/scored/test2/<run_id>/review.csv
//
// Usage: node scripts/build_review_export.js <run_id>

const fs = require('fs');
const path = require('path');
const { parseCsvObjects, toCsv } = require('./lib/csv');
const { readAll } = require('./lib/jsonl');
const suitePaths = require('./lib/suite');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

const HEADER = [
  'ID', '원본ID', '실행회차', '반복평가대상', '유형', '난이도',
  'User_Question', '정답_예시', '필수_포함_사실',
  'LLM_답변', 'LLM_상태', '기대_응답_상태', 'status_일치',
  '항목1_BGE유사도', '항목1_유사도통과', '항목1_키워드커버리지', '항목1_커버리지통과', '항목1_최종통과',
  '항목2_faithful', '항목2_규칙검증통과', '항목2_미검증숫자', '항목2_미검증고유명사', '항목2_출처오매칭숫자',
  '항목3_ABSTAIN기대', '항목3_ABSTAIN예측', '항목3_정답여부',
  '항목5_표현점수', '항목5_실격여부', '항목5_실격사유', '항목5_감점내역',
  '항목6_포맷성공', '항목6_실패사유',
  '항목7_Latency_ms', '항목7_TPS',
  '재확인_필요', '재확인_사유',
  '오류',
];

function byId(rows) { return Object.fromEntries(rows.map((r) => [r.id, r])); }

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/build_review_export.js <run_id>');
    process.exit(1);
  }
  const scoredDir = suitePaths.scoredDir(runId);
  const cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  const casesById = Object.fromEntries(cases.map((c) => [c['ID'], c]));

  const generation = byId(readAll(suitePaths.generationPath(runId)));
  const format = byId(readAll(path.join(scoredDir, 'format_success.jsonl')));
  const perf = byId(readAll(path.join(scoredDir, 'performance.jsonl')));
  const answerAcc = byId(readAll(path.join(scoredDir, 'answer_accuracy.jsonl')));
  const faithfulness = byId(readAll(path.join(scoredDir, 'rag_faithfulness.jsonl')));
  const absence = byId(readAll(path.join(scoredDir, 'absence_detection.jsonl')));
  const expression = byId(readAll(path.join(scoredDir, 'expression_quality.jsonl')));
  const escalation = byId(readAll(path.join(scoredDir, 'escalation.jsonl')));

  const rows = [];
  for (const c of cases) {
    const id = c['ID'];
    const g = generation[id];
    if (!g) continue; // 아직 생성 안 된 케이스는 건너뜀 (부분 실행 중일 수 있음)

    const fmt = format[id];
    const pf = perf[id];
    const acc = answerAcc[id];
    const faith = faithfulness[id];
    const abs = absence[id];
    const expr = expression[id];
    const esc = escalation[id];

    rows.push({
      'ID': id,
      '원본ID': c['원본 ID'] || id,
      '실행회차': c['실행 회차'] || '1',
      '반복평가대상': c['반복 평가 대상'] || 'N',
      '유형': c['유형'],
      '난이도': c['난이도'],
      'User_Question': c['User Question'],
      '정답_예시': c['정답 예시'],
      '필수_포함_사실': c['필수 포함 사실'],
      'LLM_답변': g.parsed ? g.parsed.answer : g.raw_content,
      'LLM_상태': g.parsed ? g.parsed.status : '',
      '기대_응답_상태': c['기대 응답 상태'],
      'status_일치': esc ? esc.signals.statusMatch : '',
      '항목1_BGE유사도': acc ? round3(acc.bge_m3_similarity) : '',
      '항목1_유사도통과': acc ? acc.similarity_pass : '',
      '항목1_키워드커버리지': acc ? round3(acc.keyword_coverage) : '',
      '항목1_커버리지통과': acc ? acc.keyword_coverage_pass : '',
      '항목1_최종통과': acc ? acc.pass : '',
      '항목2_faithful': faith ? faith.faithful : '',
      '항목2_규칙검증통과': faith ? faith.regex_pass : '',
      '항목2_미검증숫자': faith && faith.unverified_numbers ? faith.unverified_numbers.join('; ') : '',
      '항목2_미검증고유명사': faith && faith.unverified_proper_nouns ? faith.unverified_proper_nouns.join('; ') : '',
      '항목2_출처오매칭숫자': faith && faith.numbers_from_wrong_source ? faith.numbers_from_wrong_source.join('; ') : '',
      '항목3_ABSTAIN기대': abs ? abs.expected_abstain : '',
      '항목3_ABSTAIN예측': abs ? abs.predicted_abstain : '',
      '항목3_정답여부': abs ? abs.correct_abstain_call : '',
      '항목5_표현점수': expr ? expr.score : '',
      '항목5_실격여부': expr ? expr.disqualified : '',
      '항목5_실격사유': expr ? expr.disqualifyReason || '' : '',
      '항목5_감점내역': expr && expr.deductions ? expr.deductions.map((d) => `${d.type}(-${d.points})`).join('; ') : '',
      '항목6_포맷성공': fmt ? fmt.pass : '',
      '항목6_실패사유': fmt ? fmt.reason || '' : '',
      '항목7_Latency_ms': pf ? pf.latency_ms : '',
      '항목7_TPS': pf ? round1(pf.tps) : '',
      '재확인_필요': esc ? esc.needs_review : '',
      '재확인_사유': esc && esc.reasons ? esc.reasons.join(' / ') : '',
      '오류': g.error || '',
    });
  }

  const outPath = path.join(scoredDir, 'review.csv');
  fs.writeFileSync(outPath, toCsv(rows, HEADER), 'utf8');

  const needsReviewN = rows.filter((r) => r['재확인_필요'] === true).length;
  console.log(`통합 리뷰 파일: ${rows.length}행 (재확인 필요 ${needsReviewN}건) -> ${outPath}`);
}

function round3(n) { return typeof n === 'number' ? Number(n.toFixed(3)) : n; }
function round1(n) { return typeof n === 'number' ? Number(n.toFixed(1)) : n; }

main();
