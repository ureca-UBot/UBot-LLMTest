'use strict';
// Stage 0 (one-off / re-runnable): exports the new 1000-case dataset and the
// FAQ+synthetic-policy knowledge base out of the source .xlsx into plain CSV
// under data/eval_sets/test_set2/. Read-only against the .xlsx; re-run any
// time the source file changes to regenerate the CSVs.
//
// Usage: node scripts/prepare_test_set2.js

const fs = require('fs');
const path = require('path');
const { readWorkbook, sheetToObjects } = require('./lib/xlsx');
const { toCsv } = require('./lib/csv');

const ROOT = path.join(__dirname, '..', '..');
// 2026-09-16 380문항 파일로 교체 (원본 1000문항 파일은 참고용으로 보존,
// data/raw/에서 지우지 않음 — 아래 old 파일 폴백은 없음, 이제 이 파일이
// 유일한 소스).
const XLSX_PATH = path.join(ROOT, 'data', 'raw', 'FAQ_RAG_300문항_반복40개_총380회 (1).xlsx');
const OUT_DIR = path.join(ROOT, 'data', 'eval_sets', 'test_set2');
const EXPECTED_ROWS = 380;
const MAIN_SHEET = 'RAG 실행 목록 380건';

const CASES_HEADER = [
  'ID', '유형', '난이도', 'User Question', '제공 Context', 'Context 개수',
  '정답/관련 FAQ', '기대 행동', '실패 조건', '처리 의도', '테스트 포인트',
  '대화 이력', '사용자 정보 / API 결과', '필수 포함 사실', '정답 예시',
  '기대 응답 상태', '시나리오 그룹', '출처 / 작성 방식', '추가 입력 설명',
  // 380문항 파일에서 새로 추가된 반복테스트 관련 컬럼:
  '원본 ID', '실행 회차', '반복 평가 대상', '반복 선정 이유',
];
const FAQ_HEADER = ['FAQ ID', '카테고리', 'FAQ 질문', 'FAQ 답변', '자료 구분', '출처'];

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`소스 xlsx를 찾을 수 없습니다: ${XLSX_PATH}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { sheets } = readWorkbook(XLSX_PATH, [MAIN_SHEET, 'FAQ 원문']);

  const cases = sheetToObjects(sheets[MAIN_SHEET]);
  const faqMaster = sheetToObjects(sheets['FAQ 원문']);

  if (cases.length !== EXPECTED_ROWS) {
    console.warn(`경고: 케이스 수가 ${EXPECTED_ROWS}이 아닙니다 (${cases.length}건) — 원본 xlsx가 바뀌었을 수 있습니다.`);
  }
  const primaryCount = cases.filter((c) => c['실행 회차'] === '1').length;
  const repeatTargets = new Set(cases.filter((c) => c['반복 평가 대상'] === 'Y').map((c) => c['원본 ID'])).size;
  console.log(`고유 문항(실행회차=1): ${primaryCount}건, 반복평가 대상 문항: ${repeatTargets}건`);

  fs.writeFileSync(path.join(OUT_DIR, 'cases.csv'), toCsv(cases, CASES_HEADER), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'faq_master.csv'), toCsv(faqMaster, FAQ_HEADER), 'utf8');

  console.log(`cases.csv: ${cases.length}건 -> ${path.join(OUT_DIR, 'cases.csv')}`);
  console.log(`faq_master.csv: ${faqMaster.length}건 -> ${path.join(OUT_DIR, 'faq_master.csv')}`);
}

main();
