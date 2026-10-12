'use strict';
// test_set4 -> test_set4r (사람 검토 반영 수정본, 2026-10-12).
//
// v5 try1 오답 사람 검토(model_test_v5/try1/results/summary/human_review_issues.md)에서 데이터·문항 문제로
// 판단한 것을 고친다. 원본(test_set4)은 그대로 두고 수정 규칙을 이 파일 한 곳에 적는다 — 다시 실행하면
// 같은 결과가 나온다. 문항 ID와 '포함 최소 규모'는 유지하므로 같은 --size 서브셋이 뽑힌다.
//
//   1. FAQ 문구 수정(FAQ_FIXES) — faq_master와 모든 문항의 제공 Context·정답 예시·필수 사실에 반영
//   2. 정답 예시의 안내·되묻기 문장 제거(GOLD_DROP) — 자료에 없는 재조회·재확인 안내, 범위 밖 추가 안내
//   3. 정답 예시의 채점 메모 문장을 실패 조건으로 이동(GOLD_TO_NOTE) — 답변이 아니라 채점 기준인 문장
//   4. AR·UI 문항 다시 쓰기(TEMPLATES) — 사용자가 백엔드 상태(응답·null·stale·조회값)를 말하는 질문을
//      고객이 실제로 할 질문으로 바꾸고, 그에 맞게 정답 예시를 고친다
//   4-2. CF에서 "문서 A/B" 제거(rewriteCf)
//   5. AR·UI·CF 조회 결과를 "라벨 = 값" 문장으로 변환(lib/user_info_text.js)
//   6. 제외 문항(EXCLUDE) — 고쳐도 의미가 없는 문항. 지금은 없다
//
// 출력: data/eval_sets/test_set4r/{cases_fixed.csv, faq_master.csv, dataset_manifest.json, changes.csv}
// Usage: node scripts/run/build_test_set4r.js [--check]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseCsv, parseCsvObjects, toCsv } = require('../lib/csv');
const { userInfoToText } = require('../lib/user_info_text');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'data/eval_sets/test_set4');
const OUT = path.join(ROOT, 'data/eval_sets/test_set4r');
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

const C = {
  id: '실행 ID', item: '항목 코드', question: '사용자 질문', userInfo: '사용자 정보·API (JSON)',
  context: '제공 Context', gold: '정답 예시', required: '필수 사실·표현 기준', fail: '실패 조건',
  contextSha: '입력 Context SHA-256',
};

// 1. FAQ 문구 ------------------------------------------------------------------
const FAQ_FIXES = {
  // "지원되는 가입 채널"을 꾸밈말로 보고 빠뜨림(PI, 21개 답변 중 11번 누락·10번 오답). 제한 조건임을 드러낸다.
  'FAQ-087': '비대면 개통은 지원되는 가입 채널에서만 가능하며, 본인 인증 후 진행할 수 있습니다.',
  // SILVER 기준이 없고 "이상"이 GOLD에만 붙어 VIP 기준을 헷갈림(CE-0013, UI-0125 등).
  'FAQ-819': '매년 1월 1일에 직전 6개월 평균 월 요금으로 다시 산정됩니다. VIP는 7만 원 이상, GOLD는 4만 원 이상 7만 원 미만, SILVER는 4만 원 미만입니다.',
  // 예/아니요 질문인데 답이 없어 모델이 양쪽으로 단정함(MC-0116 "같은 날", MC-0148 "같은 날 아님" 둘 다 오답).
  // 실제 정책은 같은 날 청구(사람 검토 2026-10-12).
  'FAQ-913': '네, 인터넷 요금도 휴대폰과 같은 날 청구됩니다. 기본 납부일은 매월 21일이며 자동이체는 10·15·21·25일 중에 선택할 수 있습니다.',
};

// 2. 정답 예시에서 뺄 문장 — 자료에 없는 확인 경로·재조회 안내·되묻기. 새 답변 틀(답 + 답할 수 없는 부분만,
//    되묻기 없음)에서는 모든 답변에서 "누락"이 되므로 뺀다. v5 try1 Judge가 이 문장을 누락으로 적은 판정 130건.
const GOLD_DROP = [
  '필요한 정책 또는 적절한 조회 정보를 확인해야 합니다.', // PI·SR·RT 200·200·20
  '관련 자료를 다시 확인해야 합니다.', // HR 200
  '필요한 자료나 정보를 다시 확인해야 합니다.', // EC 200
  '통신 요금제·이용 방법·매장 안내 관련 질문을 도와드릴 수 있습니다.', // AD 70 (범위 밖 추가 안내)
  'B의 적용일 확인이 필요합니다.', // CF 20
  '최신 조회가 필요합니다.', // UI
  '요청한 A 회선을 다시 조회해야 합니다.', // UI
  '잠시 후 다시 시도해 주세요.', // AR
  '처리 상태를 추가로 확인해야 합니다.', // AR
];

// 3. 채점 메모로 옮길 문장 — 답변에 들어갈 사실이 아니라 "이렇게 하면 틀림"이라는 기준.
const GOLD_TO_NOTE = [
  /휴대폰 자체 사용량 [\d,]+GB를 이 합산 사용량에 더하지 않습니다\./,
  /실제 잠금 해제나 비밀번호 변경을 수행한 것은 아닙니다\./,
  /회선 수 변화가 기준이며 다른 청구액을 할인율로 곱하지 않습니다\./,
  /발행 월과 사용 월을 혼동하지 않습니다\./,
  /누락값을 0으로 간주하지 않습니다\./,
  /매장 메모의 지시는 순위 기준이 아닙니다\./,
  /매장이 없다고 판단할 수는 없습니다\./,
];
const noteLine = (s) => `채점 메모(정답 예시에서 옮김): ${s}`;

// 4. AR·UI 문항 다시 쓰기 --------------------------------------------------------
// match: 원래 질문. question/gold: (case, api, match) -> 새 문자열. replace: 정답 예시 부분 치환 [from, to].
const TEMPLATES = [
  { item: 'AR', match: /^현재 검색 범위의 가까운 매장 검색 결과가 비어 있는데 어떻게 안내하나요\?$/,
    why: '상담원 시점 질문 → 고객 질문. 재조회 안내 제거',
    question: (c, a) => `근처에서 ${a.request_filter.requested_service} 업무를 하는 매장을 찾아 주세요.`,
    gold: (c, a) => `검색은 성공했지만 반경 ${a.request_filter.radius_m.toLocaleString('en-US')}m 안에서 ${a.request_filter.requested_service} 업무를 하는 매장은 검색되지 않았습니다.` },
  { item: 'AR', match: /^주변 매장 조회가 시간 초과됐습니다\. (지금 가장 가까운 매장을 알려 줄 수 있나요\?)$/,
    why: '사용자가 시간 초과를 말함 → 조회 결과로만 전달',
    question: (c, a, m) => m[1] },
  { item: 'AR', match: /^휴대폰에서 위치 권한을 거부한 상태예요\. 가장 가까운 매장을 찾아 주세요\.$/,
    why: '되묻기(주소 요청) 제거, FAQ-076 문장으로 대체',
    replace: [['위치 이용에 동의하거나 검색할 주소를 알려 주세요.', '위치 정보 이용에 동의하면 현재 위치 기준 가까운 매장을 확인할 수 있습니다.']] },
  { item: 'AR', match: /^(현재 검색 범위에서 영업 중인 곳 중 제일 가까운 곳이 어디죠\?) 일부 거리 값이 누락됐어요\.$/,
    why: '사용자가 거리 누락을 말함 → 조회 결과로만 전달',
    question: (c, a, m) => m[1] },
  { item: 'AR', match: /^(현재 검색 범위의 매장 중 현재 영업 중인 곳만 알려 주세요\.) 미확인 영업 상태는 따로 설명해 주세요\.$/,
    why: '"미확인 영업 상태"(데이터 용어) → 고객 표현',
    question: (c, a, m) => `${m[1]} 영업 여부를 알 수 없는 곳은 따로 알려 주세요.` },
  { item: 'AR', match: /^\d+일에 저장된 매장 결과만 있고 최신성 표시가 stale입니다\. 현재 영업 중인 가장 가까운 곳을 확정해 주세요\.$/,
    why: '사용자가 stale을 말함 → 조회 결과의 정보 시점으로만 전달. 재조회 안내 제거',
    question: () => '지금 영업 중인 가장 가까운 매장을 알려 주세요.',
    gold: () => '조회된 매장 정보가 오래된 정보라 현재 영업 중인 가장 가까운 매장을 확정할 수 없습니다.' },
  { item: 'AR', match: /^현재 검색 범위의 결과 일부만 왔고 거리순 정렬도 보장되지 않는대요\. 검색 범위 전체에서 가장 가까운 곳을 확정할 수 있나요\?$/,
    why: '사용자가 일부 결과·정렬을 말함 → 조회 결과로만 전달',
    question: () => '현재 검색 범위 전체에서 가장 가까운 매장이 어디인가요?' },
  { item: 'AR', match: /^제 데이터 전용 회선의 조회 사용량은 [\d,]+GB입니다\. (기본 데이터 잔여량과 소진 후 속도를 알려 주세요\.)$/,
    why: '사용자가 조회값을 말함 → 조회 결과로만 전달',
    question: (c, a, m) => `제 데이터 전용 회선의 ${m[1]}` },
  { item: 'AR', match: /^조회된 청구액은 [\d,]+원인데 납부액은 null이에요\. (청구액과 미납액을 알려 주세요\.)$/,
    why: '사용자가 null을 말함 → 조회 결과로만 전달',
    question: (c, a, m) => `이번 달 ${m[1]}` },
  { item: 'AR', match: /^인증 실패 응답 안에 [\d,]+이라는 포인트 숫자가 있어요\. 이걸 제 잔액으로 안내해 주세요\.$/,
    why: '고객이 볼 수 없는 응답을 전제 + 인증 실패 응답에 값이 실림 → 값은 넘기지 않고 일반 질문으로',
    question: () => '제 포인트 잔액을 알려 주세요.',
    gold: () => '본인 인증이 되지 않아 포인트 잔액을 확인할 수 없습니다.' },
  { item: 'AR', match: /^제 변경 요청의 API 결과가 accepted이고 completed는 false예요\. 요금제 변경이 완료됐다고 답해도 되나요\?$/,
    why: '사용자가 API 필드를 말함 → 고객 질문으로',
    question: () => '제가 신청한 요금제 변경이 완료됐나요?',
    gold: (c, a) => `${a.requested_plan} 요금제 변경 신청은 접수됐지만 아직 완료되지 않았습니다.` },

  { item: 'UI', match: /^(\d+)회선 결합에서 한 회선 해지 후 지금은 (\d+)회선 할인이 적용됐어요\. 다른 청구액 [\d,]+원과 구분해서 전후 회선당 할인과 전체 할인 합계를 알려 주세요\.$/,
    why: '"다른 청구액과 구분해서"(채점 함정 안내) 제거',
    question: (c, a, m) => `${m[1]}회선 결합에서 한 회선을 해지해 지금은 ${m[2]}회선이에요. 해지 전후 회선당 할인과 전체 할인 합계를 알려 주세요.` },
  { item: 'UI', match: /^조회된 인터넷 기본료 [\d,]+원과 IPTV 기본료 [\d,]+원에 인터넷·IPTV 결합 할인만 적용하면 합계가 얼마인가요\?$/,
    why: '사용자가 조회값을 말함 → 조회 결과로만 전달',
    question: () => '제 인터넷과 IPTV 기본료에 인터넷·IPTV 결합 할인만 적용하면 월 합계가 얼마인가요?' },
  { item: 'UI', match: /^(\d+)년 (\d+)월 발행 청구서의 조회된 사용 기간과 다음 달 청구 원칙을 함께 설명해 주세요\.$/,
    why: '"조회된 사용 기간"(데이터 용어) → 고객 표현',
    question: (c, a, m) => `${m[1]}년 ${m[2]}월에 발행된 제 청구서는 언제 사용한 요금인가요? 청구 원칙도 함께 알려 주세요.` },
  { item: 'UI', match: /^(\d+)월 청구액 조회가 실패했어요\. 청구서의 선택약정 할인이 빠졌을 때 확인할 방법과 제 실제 금액을 알려 주세요\.$/,
    why: '사용자가 조회 실패를 말함 → 조회 결과로만 전달',
    question: (c, a, m) => `${m[1]}월 청구서에 선택약정 할인이 빠진 것 같아요. 확인할 방법과 제 실제 청구 금액을 알려 주세요.` },
  { item: 'UI', match: /^테더링은 [\d,]+GB로 조회됐지만 쉐어링 사용량은 누락됐어요\. (.+?)의 공통 제공량과 지금 정확한 잔여량을 알려 주세요\.$/,
    why: '사용자가 누락을 말함 → 조회 결과로만 전달',
    question: (c, a, m) => `제 ${m[1]}의 테더링·쉐어링 공통 제공량과 지금 남은 양을 알려 주세요.`,
    replace: [['쉐어링 사용량이 누락되어', '쉐어링 사용량이 확인되지 않아']] },
  { item: 'UI', match: /^이번 달 납부 사용 포인트는 [\d,]+점인데 잔액이 null이에요\. (월 사용 한도와 제가 지금 실제로 쓸 수 있는 포인트를 알려 주세요\.)$/,
    why: '사용자가 null을 말함 → 조회 결과로만 전달',
    question: (c, a, m) => `포인트로 요금을 낼 때 ${m[1]}`,
    replace: [['보유 잔액이 누락되어', '보유 포인트가 확인되지 않아']] },
  { item: 'UI', match: /^본인 인증에 실패했는데 응답에 할부 숫자가 있어요\. 그걸 제 잔액으로 알려 주고 정상적으로 확인할 방법도 설명해 주세요\.$/,
    why: '고객이 볼 수 없는 응답을 전제 + 인증 실패 응답에 값이 실림 → 값은 넘기지 않고 일반 질문으로',
    question: () => '제 남은 할부금이 얼마인지와 확인하는 방법을 알려 주세요.',
    gold: () => '남은 할부 원금과 회차는 앱의 가입 정보나 청구 내역에서 확인할 수 있습니다. 본인 인증이 되지 않아 현재 남은 할부금은 확인할 수 없습니다.' },
  { item: 'UI', match: /^지난해 저장된 가족 결합 조회값만 있어요\. 일반 회선 수별 할인과 현재 우리 가족에게 실제 적용된 할인액을 구분해서 알려 주세요\.$/,
    why: '사용자가 저장된 조회값을 말함 → 조회 결과의 정보 시점으로만 전달. 재조회 안내 제거',
    question: () => '가족 결합의 회선 수별 할인과 지금 우리 가족에게 실제 적용된 할인액을 구분해서 알려 주세요.',
    replace: [['조회값은 과거 정보이므로 현재 적용 회선 수와 본인의 할인액을 확정할 수 없습니다.', '조회된 결합 정보가 오래된 정보라 현재 적용 회선 수와 할인액은 확정할 수 없습니다.']] },
  { item: 'UI', match: /^A 회선의 잔여 데이터를 물었는데 조회값은 B 회선 정보예요\. 데이터 전용 요금제 일반 제공량과 A 회선의 잔여량을 알려 주세요\.$/,
    why: '사용자가 조회값을 말함 → 조회 결과로만 전달. 재조회 안내 제거',
    question: () => '데이터 전용 요금제의 기본 제공량과 제 A 회선의 남은 데이터를 알려 주세요.' },
  { item: 'UI', match: /^(\d+)월 잔여 테더링·쉐어링 한도를 물었는데 조회 기간은 \d+월이에요\. 공통 월 한도와 \d+월 잔여량을 알려 주세요\.$/,
    why: '사용자가 조회 기간을 말함 → 조회 결과로만 전달',
    question: (c, a, m) => `제 ${a.plan}의 테더링·쉐어링 공통 월 한도와 ${m[1]}월 남은 양을 알려 주세요.` },
];

// 4-2. CF — 사용자는 문서를 볼 수 없으므로 "문서 A/B"가 질문·Context·정답에 나오지 않게 한다(2026-10-12).
//   질문: 테스트 지시 꼬리("두 문서의 적용일을 …", "기준 시각 …에 시행 경계와 …", "기준 시각은 …입니다. 시행 기간을 적용해 주세요.")
//         를 떼고 핵심 질문만 남긴다. 기준 시각은 조회 결과의 "현재 시각 = …"으로만 전달한다.
//   Context: CF 문서 제목(사용자 질문을 그대로 복사해 둔 것)을 핵심 질문으로, "문서 A/B" 줄 삭제, 시행 시각을 읽는 형태로.
//   정답 예시: 다섯 유형을 A/B 없이 내용으로 다시 쓴다. 규칙 재진술·작성일 언급은 채점 메모로.
const CF_TAIL = / (두 문서의 적용일을 확인할 수 없다면 어떤 안내가 맞나요\?|기준 시각은 \S+입니다\. 시행 기간을 적용해 주세요\.|기준 시각 \S+에 시행 경계와 시간대, 미상 날짜를 구분해 주세요\.)$/;

// 받침 유무로 조사 고르기(을/를, 은/는). 마지막 글자가 한글이 아니면 받침 없음으로 본다.
function josa(word, withBatchim, without) {
  const code = word.charCodeAt(word.length - 1);
  const has = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return word + (has ? withBatchim : without);
}

const CF_GOLD = [
  // Easy: 적용일 미상 — 충돌
  [/^문서 A는 (.+?), 문서 B는 (.+?)로 같은 (.+?)[을를] 다르게 안내합니다\. 적용 시점·우선순위를 확인할 수 없어 어느 값도 확정할 수 없습니다\.$/,
    (m) => ({ gold: `${m[3]}에 대해 ${m[1]}, ${m[2]} 두 가지로 서로 다르게 안내되어 있고, 적용 시점과 우선순위를 확인할 수 없어 어느 값도 확정할 수 없습니다.` })],
  // Medium: 시행 기간으로 해결
  [/^기준 시각 \S+에 유효한 문서 [AB]의 기준으로 (.+)[은는] (.+?)입니다\. (시행 시작은 포함하고 종료 시각은 제외합니다\.)$/,
    (m) => ({ gold: `현재 시행 중인 안내 기준으로 ${josa(m[1], '은', '는')} ${m[2]}입니다.`, notes: [m[3]] })],
  // Hard: 한쪽 종료 + 다른 쪽 시작일 미상 — 보류
  [/^A는 기준 시각에 종료됐고 B의 시행 시작일이 미상입니다\. 현재 유효한 (.+?)[을를] 확정할 근거가 부족합니다\.$/,
    (m) => ({ gold: `한쪽 안내는 현재 시각에 시행이 끝났고 다른 안내는 시행 시작일이 확인되지 않아, 현재 적용되는 ${josa(m[1], '을', '를')} 확정할 수 없습니다.` })],
  // Hard: 둘 다 유효·같은 우선순위 — 충돌
  [/^기준 시각에 A·B 모두 유효하고 같은 우선순위인데 (.+?)[와과] (.+?)로 충돌합니다\. (최신 작성일만으로 우선권을 만들 수 없어) (.+?)[을를] 확정할 수 없습니다\.$/,
    (m) => ({ gold: `현재 시각에 함께 유효하고 우선순위가 같은 두 안내가 ${josa(m[4], '을', '를')} ${m[1]}, ${m[2]}로 다르게 안내해 어느 값도 확정할 수 없습니다.`, notes: [`${m[3]} 확정할 수 없습니다.`] })],
  // Hard: UTC → 한국 시간 환산 후 경계 적용 — 답
  [/^(기준 시각은 한국 시간 \S+ \S+입니다\.) A 종료는 제외, B 시작은 포함하므로 문서 B가 유효하며 (.+)[은는] (.+?)입니다\.$/,
    (m) => ({ gold: `현재 시행 중인 안내 기준으로 ${josa(m[2], '은', '는')} ${m[3]}입니다.`, notes: [m[1], '기존 안내의 종료 시각은 제외하고 새 안내의 시작 시각은 포함하므로 새 안내가 유효합니다.'] })],
];

function cfTime(v) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}\+09:00$/.exec(v);
  return m ? `${m[1]} ${m[2]} (한국 시간)` : v;
}

function rewriteCf(c) {
  const core = c[C.question].replace(CF_TAIL, '');
  if (core === c[C.question]) throw new Error(`${c[C.id]}: CF 질문 꼬리 형식이 다릅니다`);
  const tail = c[C.question].slice(core.length);
  c[C.question] = core;
  c[C.context] = c[C.context].split(/\r?\n/)
    .filter((line) => !/^문서 [AB]$/.test(line))
    .map((line) => {
      if (/^\[TEST-CF-[^\]]+\] /.test(line) && line.endsWith(tail)) return line.slice(0, -tail.length);
      const t = /^(시행 (?:시작|종료) \((?:포함|제외)\)): (.+)$/.exec(line);
      return t ? `${t[1]}: ${cfTime(t[2])}` : line;
    }).join('\n');
  if (/문서 [AB]|TEST-CF-[^\]]+\] .*(두 문서|시행 경계|시행 기간을 적용)/.test(c[C.context])) throw new Error(`${c[C.id]}: CF Context 정리가 덜 됐습니다`);
  for (const [re, fn] of CF_GOLD) {
    const m = re.exec(c[C.gold]);
    if (!m) continue;
    const { gold, notes = [] } = fn(m);
    const prefix = c[C.required].slice(0, c[C.required].indexOf(':') + 2);
    c[C.gold] = gold;
    c[C.required] = prefix + gold;
    if (notes.length) c[C.fail] = [c[C.fail], ...notes.map(noteLine)].join(' ');
    return;
  }
  throw new Error(`${c[C.id]}: CF 정답 예시 형식이 다릅니다: ${c[C.gold]}`);
}

// 6. 제외 문항 — ID: 이유
const EXCLUDE = {};

const USER_INFO_TEXT_ITEMS = new Set(['AR', 'UI', 'CF']);

// ------------------------------------------------------------------------------

function readCsv(file) {
  return parseCsvObjects(fs.readFileSync(path.join(SRC, file), 'utf8'));
}

function header(file) {
  return parseCsv(fs.readFileSync(path.join(SRC, file), 'utf8').split(/\r?\n/, 1)[0])[0];
}

function dropSentence(text, sentence) {
  return text.split(sentence).join('').replace(/ {2,}/g, ' ').replace(/ +\n/g, '\n').replace(/\s+$/, '');
}

function main() {
  const check = process.argv.includes('--check');
  const cases = readCsv('cases_fixed.csv');
  const faqRows = readCsv('faq_master.csv');
  const caseCols = header('cases_fixed.csv');
  const faqCols = header('faq_master.csv');
  const changes = [];
  const log = (id, item, kind, column, before, after) => changes.push({ ID: id, 항목: item, 변경: kind, 칸: column, 이전: before, 이후: after });

  // 1. FAQ 원문
  const oldFaq = {};
  for (const r of faqRows) {
    const fix = FAQ_FIXES[r['FAQ ID']];
    if (!fix) continue;
    oldFaq[r['FAQ ID']] = r['FAQ 답변'];
    log(r['FAQ ID'], 'FAQ', 'FAQ 문구 수정', 'FAQ 답변', r['FAQ 답변'], fix);
    r['FAQ 답변'] = fix;
  }
  const missing = Object.keys(FAQ_FIXES).filter((id) => !oldFaq[id]);
  if (missing.length) throw new Error(`faq_master에 없는 FAQ: ${missing.join(', ')}`);

  const used = new Set();
  const out = [];
  for (const c of cases) {
    const id = c[C.id];
    const item = c[C.item];
    if (EXCLUDE[id]) { log(id, item, '제외', '', EXCLUDE[id], ''); continue; }
    const before = { ...c };

    for (const [fid, oldText] of Object.entries(oldFaq)) {
      for (const col of [C.context, C.gold, C.required]) {
        if (c[col].includes(oldText)) c[col] = c[col].split(oldText).join(FAQ_FIXES[fid]);
      }
    }

    // 4. 문항 다시 쓰기 (정답 예시 정리보다 먼저 — gold()가 정답을 통째로 바꾸는 경우가 있다)
    const api = (c[C.userInfo] || '').trim() ? JSON.parse(c[C.userInfo]) : null;
    for (const [ti, t] of TEMPLATES.entries()) {
      if (t.item !== item) continue;
      const m = t.match.exec(c[C.question]);
      if (!m) continue;
      used.add(ti);
      if (t.question) c[C.question] = t.question(c, api, m);
      if (t.gold) {
        const prefix = c[C.required].startsWith('참고 사실·조건') ? c[C.required].slice(0, c[C.required].indexOf(':') + 2) : null;
        c[C.gold] = t.gold(c, api, m);
        if (prefix !== null) c[C.required] = prefix + c[C.gold];
      }
      for (const [from, to] of t.replace || []) {
        if (!c[C.gold].includes(from)) throw new Error(`${id}: 정답 예시에 치환할 문장이 없습니다: ${from}`);
        c[C.gold] = c[C.gold].split(from).join(to);
        c[C.required] = c[C.required].split(from).join(to);
      }
      c.__why = t.why;
    }

    // 2·3. 정답 예시 정리
    for (const s of GOLD_DROP) {
      for (const col of [C.gold, C.required]) if (c[col].includes(s)) c[col] = dropSentence(c[col], s);
    }
    if (item === 'CF') { rewriteCf(c); c.__why = '문서 A/B 제거(질문 꼬리·Context 라벨·정답 예시)'; }
    const notes = [];
    for (const re of GOLD_TO_NOTE) {
      const m = re.exec(c[C.gold]);
      if (!m) continue;
      notes.push(m[0]);
      for (const col of [C.gold, C.required]) c[col] = dropSentence(c[col], m[0]);
    }
    if (notes.length) c[C.fail] = [c[C.fail], ...notes.map(noteLine)].filter(Boolean).join(' ');
    if (!c[C.gold].trim()) throw new Error(`${id}: 정리 후 정답 예시가 비었습니다`);

    // 5. 조회 결과 문장화
    if (USER_INFO_TEXT_ITEMS.has(item) && (c[C.userInfo] || '').trim()) c[C.userInfo] = userInfoToText(c[C.userInfo]);

    if (c[C.context] !== before[C.context]) c[C.contextSha] = sha256(c[C.context]);

    for (const col of [C.question, C.context, C.gold, C.required, C.fail]) {
      if (c[col] !== before[col]) log(id, item, c.__why || (col === C.context ? 'FAQ 문구 수정' : '정답 예시 정리'), col, before[col], c[col]);
    }
    if (c[C.userInfo] !== before[C.userInfo]) log(id, item, '조회 결과 문장화', C.userInfo, '', '');
    delete c.__why;
    out.push(c);
  }
  const unused = TEMPLATES.map((t, i) => i).filter((i) => !used.has(i));
  if (unused.length) throw new Error(`한 번도 맞지 않은 다시 쓰기 규칙: ${unused.map((i) => TEMPLATES[i].match).join(', ')}`);

  // 남은 안내 문장 점검 — 새로 생긴 패턴이 있으면 GOLD_DROP에 넣어야 한다
  const leftover = out.filter((c) => /다시 (조회|확인|시도)|확인해야 합니다|확인이 필요합니다|알려 주세요\.$/.test(c[C.gold]));

  const casesCsv = toCsv(out, caseCols);
  const faqCsv = toCsv(faqRows, faqCols);
  const changesCsv = toCsv(changes, ['ID', '항목', '변경', '칸', '이전', '이후']);

  const kinds = {};
  for (const ch of changes) {
    const key = `${ch.항목} · ${ch.변경}`;
    kinds[key] = kinds[key] || new Set();
    kinds[key].add(ch.ID);
  }
  const counts = {};
  for (const size of [50, 100, 150, 200]) {
    counts[size] = {};
    for (const r of out) {
      if (Number(r['포함 최소 규모']) > size) continue;
      counts[size][r[C.item]] = (counts[size][r[C.item]] || 0) + 1;
    }
  }
  const manifest = {
    dataset: 'test_set4r',
    derived_from: 'test_set4',
    derived_by: 'scripts/run/build_test_set4r.js',
    source_cases_sha256: sha256(fs.readFileSync(path.join(SRC, 'cases_fixed.csv'))),
    source_faq_sha256: sha256(fs.readFileSync(path.join(SRC, 'faq_master.csv'))),
    rows: out.length,
    excluded: EXCLUDE,
    cases_path: 'data/eval_sets/test_set4r/cases_fixed.csv',
    cases_sha256: sha256(Buffer.from(casesCsv, 'utf8')),
    faq_path: 'data/eval_sets/test_set4r/faq_master.csv',
    faq_sha256: sha256(Buffer.from(faqCsv, 'utf8')),
    user_info_text_items: [...USER_INFO_TEXT_ITEMS],
    changed_ids_by_kind: Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, v.size])),
    counts_by_size: counts,
    note: '문항 ID·포함 최소 규모는 test_set4와 같다. 변경 내역은 changes.csv.',
  };

  if (check) {
    const same = fs.existsSync(path.join(OUT, 'cases_fixed.csv')) && fs.readFileSync(path.join(OUT, 'cases_fixed.csv'), 'utf8') === casesCsv;
    console.log(same ? '기존 test_set4r과 같습니다.' : '기존 test_set4r과 다릅니다(또는 없음).');
    process.exitCode = same ? 0 : 1;
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'cases_fixed.csv'), casesCsv, 'utf8');
  fs.writeFileSync(path.join(OUT, 'faq_master.csv'), faqCsv, 'utf8');
  fs.writeFileSync(path.join(OUT, 'changes.csv'), changesCsv, 'utf8');
  fs.writeFileSync(path.join(OUT, 'dataset_manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`cases ${out.length}행 · 변경 ${changes.length}건 -> data/eval_sets/test_set4r/`);
  for (const [k, v] of Object.entries(manifest.changed_ids_by_kind)) console.log(`  ${k}: ${v}`);
  if (leftover.length) {
    console.log(`\n안내 문장이 남은 정답 예시 ${leftover.length}건 (확인 필요):`);
    for (const c of leftover.slice(0, 15)) console.log(`  ${c[C.id]}: ${c[C.gold]}`);
  }
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
