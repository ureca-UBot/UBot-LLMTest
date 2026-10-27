'use strict';
// pipeline_test_v6 케이스셋. pipeline_test_v1 cases.jsonl을 그대로 복사하고, UD만 seed/eval_runner_lines.sql 기준으로 다시 라벨링한다.
// v1 라벨은 회선 없는 평가 계정 기준이라 회선·사용량·청구·약정 질문이 ABSTAIN이었다. 회선을 넣었으므로 자료로 답할 수 있는 칸은 ANSWER다.
// UNAVAILABLE_NOTICE 항목(포인트·멤버십, 할인반환금, 로밍 차단, 소액결제)과 쉐어링 서브 회선은 여전히 ABSTAIN이다.
// Usage: node pipeline_test_v6/build_cases.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'pipeline_test_v1', 'cases', 'cases.jsonl');
const OUT_DIR = path.join(__dirname, 'cases');

// 하위 질문 순서대로 새 status. 값이 없는 케이스는 v1 라벨을 유지한다. note는 seed 기준 기대 값(사람이 읽는 용도).
const RELABEL = {
  'UD-001': { note: '회원 가입일 2024-03-15 → 2년 7개월(기준일 2026-10-23)' },
  'UD-002': { note: '가입일 2024-03-15 + 가입 다음 달 1일 규칙 → 2024-04-01' },
  'UD-004': { note: '회원 가입일 2024-03-15' },
  'UD-006': { note: '가입일 2024-03-15 → 1년 넘음' },
  'UD-007': { statuses: ['ANSWER'], note: '2026-10 사용량(10-22까지 집계) 41,230MB 사용, 잔여 57,770MB(약 56.4GB)' },
  'UD-008': { statuses: ['ANSWER'], note: '2026년 10월 청구서(9월 사용분) 52,540원, 납부 완료' },
  'UD-009': { statuses: ['ANSWER'], note: '미납 없음(최근 6개월 청구 기준)' },
  'UD-010': { statuses: ['ANSWER'], note: 'Ubot 밸런스 59 75GB업' },
  'UD-011': { statuses: ['ANSWER'], note: '선택약정 2025-03-15~2027-03-14' },
  'UD-012': { statuses: ['ANSWER'], note: '24개월 중 19개월 납부 → 5개월, 잔여 240,625원' },
  'UD-016': { statuses: ['ANSWER'], note: '이용 중인 결합 없음' },
  'UD-019': { statuses: ['ANSWER'], note: '컬러링 월 990원, 부재중 알림 월 550원' },
  'UD-020': { statuses: ['ANSWER'], note: '최근 청구서 납부 기한 2026-10-21, 같은 날 자동이체 납부' },
  'UD-021': { statuses: ['ANSWER'], note: '2026-10 음성 154분 사용(10-22까지 집계, 미확정)' },
  'UD-023': { statuses: ['ANSWER', 'ANSWER'], note: '약정 만료 2027-03-14 + 재약정 FAQ' },
  'UD-025': { statuses: ['ANSWER', 'ANSWER'], note: '미납 없음 + 2개월 미납 시 FAQ' },
  'UD-026': { statuses: ['ANSWER', 'ANSWER'], note: '요금제 데이터 99,000MB(약 96.7GB) + 쉐어링 FAQ' },
  'UD-027': { statuses: ['ANSWER', 'ANSWER'], note: '문자 무제한, 10월 청구서 기타 0원 → 추가 요금 없음 + LTE 세이브 FAQ' },
  'UD-028': { statuses: ['ANSWER', 'ANSWER'], note: '가입일 2024-03-15 + 2026-10 데이터 41,230MB 사용' },
  'UD-029': { statuses: ['ANSWER', 'ANSWER'], note: '할부 잔여 240,625원(5개월) + 중도 완납 FAQ' },
  'UD-030': { statuses: ['ANSWER', 'ANSWER'], note: '서울특별시 마포구 + 2026년 10월 청구서 52,540원' },
};

// 백엔드 SubQuestionStatuses.combine과 같은 규칙.
function combine(statuses) {
  if (statuses.every((s) => s === 'ANSWER')) return 'ANSWER';
  if (statuses.includes('ANSWER')) return 'PARTIAL';
  if (statuses.every((s) => s === statuses[0])) return statuses[0];
  for (const s of ['CONFLICT', 'ABSTAIN', 'OUT_OF_SCOPE']) if (statuses.includes(s)) return s;
  return statuses[0];
}

const rows = fs.readFileSync(SOURCE, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
const changed = [];
for (const row of rows) {
  const relabel = RELABEL[row.id];
  if (!relabel) continue;
  if (relabel.statuses) {
    if (relabel.statuses.length !== row.expected.sub_questions.length) throw new Error(`${row.id}: 하위 질문 수 불일치`);
    const before = row.expected.final_status;
    row.expected.sub_questions.forEach((sub, i) => { sub.status = relabel.statuses[i]; sub.status_strict = relabel.statuses[i]; });
    row.expected.final_status = combine(relabel.statuses);
    row.expected.final_status_strict = row.expected.final_status;
    changed.push({ id: row.id, from: before, to: row.expected.final_status });
  }
  row.note = relabel.note;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const text = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
fs.writeFileSync(path.join(OUT_DIR, 'cases.jsonl'), text, 'utf8');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
fs.writeFileSync(path.join(OUT_DIR, 'dataset_manifest.json'), JSON.stringify({
  source: 'pipeline_test_v1/cases/cases.jsonl', source_sha256: sha(fs.readFileSync(SOURCE)),
  cases_sha256: sha(Buffer.from(text, 'utf8')), cases: rows.length,
  account_seed: 'pipeline_test_v6/seed/eval_runner_lines.sql', relabeled: changed,
}, null, 2) + '\n', 'utf8');
console.log(`cases ${rows.length}, 라벨 변경 ${changed.length}`);
for (const c of changed) console.log(`  ${c.id}: ${c.from} → ${c.to}`);
