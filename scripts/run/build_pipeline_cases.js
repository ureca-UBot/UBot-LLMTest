'use strict';
// pipeline_test_v1 케이스셋을 만든다. 손으로 쓴 parts/*.jsonl(짧은 키)을 검사해 cases.jsonl(긴 키)과 매니페스트로 펼친다.
//
//   - 정답 근거 FAQ ID가 백엔드 FAQ 스냅숏(faq_snapshot.csv)에 모두 있는지 확인한다.
//   - 최종 status는 손으로 적지 않고 하위 status에서 백엔드와 같은 규칙으로 조합한다(combineStatuses).
//   - IN 유형처럼 하위 질문 안에 답할 수 있는 부분과 없는 부분이 섞인 경우 strict 라벨을 따로 두고 최종값도 따로 낸다.
//
// parts 한 줄: {"id","q","subs":[{"t"?,"s","g":[faqId...],"strict"?}],"turns"?,"loc"?,"path"?,"note"?}
//   t가 없으면 질문 전체(q)를 하위 질문 하나로 본다. path가 ANY면 검색 단계 실패(CHAT-012/013)도 정답으로 본다.
//
// Usage: node scripts/run/build_pipeline_cases.js [--faq <BackEnd/tools/faq-db/seed/baseline-faqs.csv>] [--check]
//   --faq를 주면 그 파일을 cases/faq_snapshot.csv로 복사한 뒤 검사한다. 없으면 기존 스냅숏을 쓴다.
//   --check는 파일을 쓰지 않고 검사만 한다.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseCsvObjects } = require('../lib/csv');

const ROOT = path.join(__dirname, '..', '..');
const CASES_DIR = path.join(ROOT, 'pipeline_test_v1', 'cases');
const PARTS_DIR = path.join(CASES_DIR, 'parts');
const SNAPSHOT = path.join(CASES_DIR, 'faq_snapshot.csv');

const MODEL_STATUSES = ['ANSWER', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'];
const PATHS = ['LLM', 'ANY'];
const TYPES = {
  SA: '단일 · FAQ로 답할 수 있음',
  SB: '단일 · 주제 FAQ는 있으나 묻는 값이 없음',
  UD: '사용자 정보(USER_DATA) 질문',
  MA: '복합 · 모두 답할 수 있음',
  MP: '복합 · 답할 수 있음 + 답할 수 없음',
  MN: '복합 · 모두 답할 수 없음',
  OS: '범위 밖 단독 · 범위 밖 + 정상 질문',
  IN: '하위 질문 하나 안에 답할 수 있는 부분과 없는 부분이 섞임(분리 표지 없음)',
  CQ: '조건이 모호해 되묻기 쉬운 질문',
  MT: '멀티턴(같은 대화에서 이전 질문을 먼저 실행)',
  ST: '매장 질문(좌표·장소명·도구)',
};
// useMyLocation=true로 보낼 좌표. 매장 DB(V5 임시 데이터)에 주변 매장이 있는 곳으로 골랐다.
const LOCATIONS = {
  gangnam: { label: '강남역', latitude: 37.4979, longitude: 127.0276 },
  hongdae: { label: '홍대입구역', latitude: 37.5572, longitude: 126.9245 },
  seomyeon: { label: '부산 서면역', latitude: 35.1577, longitude: 129.0596 },
};

/** 백엔드가 쓸 최종 status 조합 규칙과 같다. 바꾸면 백엔드 코드도 함께 바꾼다. */
function combineStatuses(statuses) {
  if (statuses.every((s) => s === 'ANSWER')) return 'ANSWER';
  if (statuses.includes('ANSWER')) return 'PARTIAL';
  if (new Set(statuses).size === 1) return statuses[0];
  for (const s of ['CONFLICT', 'ABSTAIN', 'OUT_OF_SCOPE']) {
    if (statuses.includes(s)) return s;
  }
  throw new Error(`조합할 수 없는 status: ${statuses}`);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parseArgs(argv) {
  const args = { faq: null, check: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--faq') args.faq = argv[++i];
    else if (argv[i] === '--check') args.check = true;
    else throw new Error(`알 수 없는 인자: ${argv[i]}`);
  }
  return args;
}

function loadFaqIds(file) {
  const rows = parseCsvObjects(fs.readFileSync(file, 'utf8'));
  return new Map(rows.map((row) => [Number(row.faqId), row]));
}

function readParts() {
  const lines = [];
  for (const file of fs.readdirSync(PARTS_DIR).filter((f) => f.endsWith('.jsonl')).sort()) {
    fs.readFileSync(path.join(PARTS_DIR, file), 'utf8').split(/\r?\n/).forEach((line, index) => {
      if (line.trim()) lines.push({ file, line: index + 1, raw: line });
    });
  }
  return lines;
}

function expand(entry, faqs, errors) {
  const where = `${entry.file}:${entry.line}`;
  let part;
  try {
    part = JSON.parse(entry.raw);
  } catch (error) {
    errors.push(`${where} JSON 오류: ${error.message}`);
    return null;
  }
  const type = String(part.id || '').split('-')[0];
  if (!TYPES[type] || !entry.file.startsWith(type)) errors.push(`${where} ${part.id}: 유형 접두어가 파일과 다름`);
  if (!part.q || !Array.isArray(part.subs) || part.subs.length === 0) errors.push(`${where} ${part.id}: q·subs 필요`);
  const pathValue = part.path || 'LLM';
  if (!PATHS.includes(pathValue)) errors.push(`${where} ${part.id}: path는 ${PATHS}`);
  if (part.loc && !LOCATIONS[part.loc]) errors.push(`${where} ${part.id}: 모르는 loc ${part.loc}`);
  if (part.subs.length > 1 && part.subs.some((sub) => !sub.t)) errors.push(`${where} ${part.id}: 하위 질문이 둘 이상이면 t 필요`);

  const subs = part.subs.map((sub, index) => {
    for (const label of [sub.s, sub.strict].filter(Boolean)) {
      if (!MODEL_STATUSES.includes(label)) errors.push(`${where} ${part.id}: 하위 status ${label}`);
    }
    if (sub.t && !part.q.includes(sub.t.replace(/[.?]$/, ''))) {
      errors.push(`${where} ${part.id}: 하위 질문 조각이 원문에 없음 "${sub.t}"`);
    }
    for (const id of sub.g || []) {
      if (!faqs.has(id)) errors.push(`${where} ${part.id}: FAQ ${id}가 스냅숏에 없음`);
    }
    if (sub.s !== 'OUT_OF_SCOPE' && (!sub.g || sub.g.length === 0)) errors.push(`${where} ${part.id}: 근거 FAQ 없음`);
    return {
      index: index + 1,
      user_text: sub.t || part.q,
      status: sub.s,
      status_strict: sub.strict || sub.s,
      gold_faq_ids: (sub.g || []).map(String),
    };
  });
  const statuses = subs.map((sub) => sub.status);
  const strictStatuses = subs.map((sub) => sub.status_strict);
  return {
    id: part.id,
    type,
    question: part.q,
    turns: part.turns || [],
    location: part.loc ? { key: part.loc, ...LOCATIONS[part.loc] } : null,
    account: 'member',
    expected: {
      path: pathValue,
      final_status: combineStatuses(statuses),
      final_status_strict: combineStatuses(strictStatuses),
      sub_questions: subs,
    },
    note: part.note || null,
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = key(item);
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.faq && !args.check) fs.copyFileSync(args.faq, SNAPSHOT);
  const faqFile = args.check && args.faq ? args.faq : SNAPSHOT;
  if (!fs.existsSync(faqFile)) throw new Error(`FAQ 스냅숏이 없습니다. --faq로 백엔드 시드 CSV를 주세요: ${faqFile}`);
  const faqs = loadFaqIds(faqFile);

  const errors = [];
  const cases = readParts().map((entry) => expand(entry, faqs, errors)).filter(Boolean);
  const ids = countBy(cases, (c) => c.id);
  Object.entries(ids).filter(([, n]) => n > 1).forEach(([id]) => errors.push(`중복 ID ${id}`));
  if (errors.length) {
    errors.forEach((e) => console.error(e));
    process.exit(1);
  }

  const casesText = cases.map((c) => JSON.stringify(c)).join('\n') + '\n';
  const manifest = {
    dataset: 'pipeline_test_v1',
    built_by: 'scripts/run/build_pipeline_cases.js',
    rows: cases.length,
    cases_path: 'pipeline_test_v1/cases/cases.jsonl',
    cases_sha256: sha256(Buffer.from(casesText, 'utf8')),
    faq_snapshot_path: 'pipeline_test_v1/cases/faq_snapshot.csv',
    faq_snapshot_sha256: sha256(fs.readFileSync(faqFile)),
    faq_snapshot_rows: faqs.size,
    final_status_rule: '모두 ANSWER → ANSWER · ANSWER 1개 이상 + 나머지 → PARTIAL · ANSWER 없음·모두 같음 → 그 값 · ANSWER 없음·섞임 → CONFLICT > ABSTAIN > OUT_OF_SCOPE',
    in_label_policy: 'status = 느슨(핵심 값을 확정하면 ANSWER), status_strict = 엄격(일부라도 못 정하면 ABSTAIN). 채점은 둘 다 낸다',
    path_policy: 'LLM = 답변 LLM까지 가야 정답 · ANY = 검색 단계 실패(CHAT-012/013)도 정답',
    account: 'member — 평가용 회원 하나(이름·거주 지역·가입일만 사용자 정보로 들어감). 케이스마다 새 대화',
    locations: LOCATIONS,
    types: TYPES,
    counts_by_type: countBy(cases, (c) => c.type),
    counts_by_final_status: countBy(cases, (c) => c.expected.final_status),
    counts_by_final_status_strict: countBy(cases, (c) => c.expected.final_status_strict),
    counts_by_path: countBy(cases, (c) => c.expected.path),
    counts_by_sub_question_count: countBy(cases, (c) => c.expected.sub_questions.length),
    multi_turn_cases: cases.filter((c) => c.turns.length).length,
    location_cases: cases.filter((c) => c.location).length,
  };

  console.log(JSON.stringify({
    rows: manifest.rows,
    counts_by_type: manifest.counts_by_type,
    counts_by_final_status: manifest.counts_by_final_status,
    counts_by_final_status_strict: manifest.counts_by_final_status_strict,
    counts_by_path: manifest.counts_by_path,
  }, null, 2));
  if (args.check) return;
  fs.writeFileSync(path.join(CASES_DIR, 'cases.jsonl'), casesText, 'utf8');
  fs.writeFileSync(path.join(CASES_DIR, 'dataset_manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

if (require.main === module) {
  main();
}

module.exports = { combineStatuses };
