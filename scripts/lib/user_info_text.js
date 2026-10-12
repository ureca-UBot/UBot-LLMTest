'use strict';
// 사용자 정보/API 결과(JSON) -> "라벨 = 값" 줄 목록.
//
// test_set4의 AR·UI는 조회 결과를 필드 이름 그대로(is_open, freshness, *_krw …) 모델에 줬다. 모델이
// 필드 뜻을 잘못 읽거나(is_open false를 "영업 중"·"미확인"으로 읽음 — v5 try1 Q4 AR 오답 48건 중 23건)
// 필드 이름을 답변에 그대로 썼다(API 문항 380건 중 Q4 19건). 그래서 백엔드가 모델에 넘길 때처럼
// 사람이 읽는 말로 바꾸고, 애매하던 기준(영업 여부 null, 오래된 정보, 인증 실패, 일부 결과)은 값에 뜻을 적는다.
// (2026-10-12, 사람 검토 정리 — model_test_v5/try1/results/summary/human_review_issues.md)
//
// 규칙
//   - 모르는 필드는 멈춘다(조용히 빼거나 이름 그대로 내보내지 않는다).
//   - 본인 인증 실패(unauthorized) 응답의 개인 값은 넘기지 않는다 — 실제 백엔드라면 인증 실패 응답에
//     값이 실려 오지 않는다. 조회 상태·시각·회선만 남긴다.
//   - 실패한 조회(시간 초과·인증 실패·위치 미동의)에는 정보 시점·기준 시각을 넣지 않는다.
//   - 사용량 라벨에 "이번 달"을 붙이지 않는다 — 조회 기간이 따로 있는 문항(UI-0191~)이 있다.
//   - fixture(시험용 표시)는 뺀다.

const KRW = (v) => `${Number(v).toLocaleString('en-US')}원`;
const NUM = (unit) => (v) => `${Number(v).toLocaleString('en-US')}${unit}`;
const YES_NO = (yes, no) => (v) => (v ? yes : no);
const UNKNOWN = '확인 안 됨';

function time(v) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?([+-]\d{2}:\d{2}|Z)$/.exec(v);
  if (!m) return v;
  const zone = m[3] === '+09:00' ? '한국 시간' : m[3] === 'Z' || m[3] === '+00:00' ? 'UTC' : `UTC${m[3]}`;
  return `${m[1]} ${m[2]} (${zone})`;
}

function month(v) {
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  return m ? `${m[1]}년 ${Number(m[2])}월` : v;
}

const lineName = (v) => (/^TEST-LINE-([A-Z])$/.exec(v) || [])[1] ? `${v.slice(-1)} 회선` : v;

const KIND = {
  MAP_API: '주변 매장 검색',
  USER_INFO: '고객 정보 조회',
  USER_INFO_API: '고객 정보 조회',
  PLAN_CHANGE_API: '요금제 변경 신청 조회',
  TEST_CLOCK: null, // CF 기준 시각 — 조회 종류 줄 없이 "현재 시각"만 쓴다
};

const STATUS = {
  success: '성공',
  partial: '일부만 받음(빠진 결과가 있을 수 있음)',
  timeout: '시간 초과로 실패(결과를 받지 못함)',
  unauthorized: '본인 인증 실패로 조회되지 않음',
  location_permission_denied: '위치 정보 이용 미동의로 현재 위치를 확인하지 못함',
  accepted: '신청 접수됨',
};

// 필드 -> [라벨, 값 변환]. 값이 null이면 변환 대신 "확인 안 됨".
const FIELDS = {
  // 조회 공통
  evaluation_at: ['현재 시각', time],
  authenticated: ['본인 인증', YES_NO('완료', '안 됨')],
  freshness: ['정보 시점', (v) => ({ current: '최신 정보', stale: '오래된 정보(현재 상태로 확정할 수 없음)' }[v] || v)],
  as_of: ['정보 기준 시각', time],
  request_at: ['조회 요청 시각', time],
  requested_line_id: ['요청한 회선', lineName],
  // 매장 검색
  has_more: ['받지 못한 매장 결과', YES_NO('더 있음', '없음')],
  sorted_by_distance: ['거리순 정렬', YES_NO('됨', '보장 안 됨')],
  // 요금제 변경 신청
  request_id: ['신청 번호', String],
  requested_plan: ['변경 신청한 요금제', String],
  completed: ['변경 완료', YES_NO('완료됨', '아직 완료 안 됨')],
  // 고객 정보
  plan: ['요금제', String],
  sms_sent_count: ['보낸 문자 수', NUM('건')],
  used_gb: ['이번 달 기본 데이터에서 차감된 사용량', NUM('GB')],
  domestic_data_used_gb: ['국내 데이터 사용량', NUM('GB')],
  phone_data_used_gb: ['휴대폰 자체 데이터 사용량', NUM('GB')],
  tether_used_gb: ['테더링 사용량', NUM('GB')],
  sharing_used_gb: ['쉐어링 사용량', NUM('GB')],
  usage_period: ['조회된 사용량의 기간', month],
  requested_usage_period: ['요청한 사용량의 기간', month],
  roaming_data_used_gb: ['로밍 데이터 사용량', NUM('GB')],
  domestic_recharge_gb: ['국내 데이터 추가 충전량', NUM('GB')],
  roaming_pass_active: ['로밍 패스', YES_NO('가입 중', '가입 안 됨')],
  billed_total_krw: ['청구 금액 합계', KRW],
  billed_amount_krw: ['청구 금액', KRW],
  paid_krw: ['납부한 금액', KRW],
  payment_status: ['납부 상태', (v) => ({ unknown: UNKNOWN, paid: '납부 완료', unpaid: '미납' }[v] || v)],
  bill_due_krw: ['이번 달 납부할 요금', KRW],
  billing_month: ['청구서 발행 월', month],
  usage_period_start: ['청구서의 사용 기간 시작일', String],
  usage_period_end_inclusive: ['청구서의 사용 기간 마지막 날(이날 포함)', String],
  points_available: ['보유 포인트', NUM('점')],
  points_used_for_bill_this_month: ['이번 달 요금 납부에 이미 쓴 포인트', NUM('점')],
  active_family_bundle_lines: ['가족 결합 휴대폰 회선 수', NUM('회선')],
  previous_family_bundle_lines: ['해지 전 가족 결합 휴대폰 회선 수', NUM('회선')],
  current_family_bundle_lines: ['현재 가족 결합 휴대폰 회선 수', NUM('회선')],
  change_effective: ['결합 회선 수 변경', YES_NO('반영됨', '반영 안 됨')],
  discount_already_active: ['가족 결합 할인', YES_NO('적용 중', '적용 안 됨')],
  each_line_base_fee_krw: ['회선별 월 기본료(할인 전)', KRW],
  other_charges_krw: ['그 밖의 요금', KRW],
  other_charge_krw: ['그 밖의 청구 금액', KRW],
  internet_base_monthly_krw: ['인터넷 월 기본료(할인 전)', KRW],
  iptv_base_monthly_krw: ['IPTV 월 기본료(할인 전)', KRW],
  internet_iptv_bundle_active: ['인터넷·IPTV 결합', YES_NO('가입 중', '가입 안 됨')],
  selection_contract_active: ['선택약정', YES_NO('가입 중', '가입 안 됨')],
  device_installment_krw: ['월 단말 할부금', KRW],
  remaining_installment_principal_krw: ['남은 단말 할부 원금', KRW],
  consecutive_password_failures: ['앱 비밀번호 연속 오류 횟수', NUM('회')],
  elapsed_since_last_failure_minutes: ['마지막 비밀번호 오류 후 지난 시간', NUM('분')],
  previous_six_month_bills_krw: ['직전 6개월 월 요금', (v) => v.map(KRW).join(', ')],
  evaluation_date: ['멤버십 등급 산정일', String],
  membership_evaluation_amount_basis: ['등급 산정에 쓰는 금액', (v) => (v === 'FAQ와 동일한 월 요금 기준' ? '안내된 등급 기준과 같은 월 요금' : v)],
};

// 줄 순서: 조회 종류·상태를 먼저, 나머지는 원래 순서.
const HEAD = ['kind', 'status', 'lookup_status', 'authenticated', 'freshness', 'as_of', 'request_at', 'requested_line_id', 'line_id'];
// 인증 실패 응답에서도 남기는 필드
const META = new Set([...HEAD, 'fixture', 'field_definitions', 'request_filter', 'stores']);
// 따로 처리하는 필드
const SPECIAL = new Set(['kind', 'fixture', 'status', 'lookup_status', 'line_id', 'stores', 'request_filter', 'field_definitions']);

const fmt = (label, value) => `${label} = ${value}`;

function storeLines(stores) {
  if (stores === null) return [fmt('검색된 매장', '결과를 받지 못함')];
  const out = [fmt('검색된 매장 수', `${stores.length}곳`)];
  for (const s of stores) {
    const known = new Set(['name', 'distance_m', 'is_open', 'services', 'parking', 'address', 'note']);
    const unknown = Object.keys(s).filter((k) => !known.has(k));
    if (unknown.length) throw new Error(`매장 결과에 모르는 필드: ${unknown.join(', ')}`);
    const n = s.name;
    if ('address' in s) out.push(fmt(`${n} 주소`, s.address ?? UNKNOWN));
    if ('distance_m' in s) out.push(fmt(`${n} 거리`, s.distance_m === null ? '정보 없음' : `${Number(s.distance_m).toLocaleString('en-US')}m`));
    if ('is_open' in s) out.push(fmt(`${n} 현재 영업 여부`, s.is_open === null ? '영업 여부 확인 안 됨' : s.is_open ? '영업 중' : '영업 중 아님'));
    if ('services' in s) out.push(fmt(`${n} 취급 업무`, s.services.join(', ')));
    if ('parking' in s) out.push(fmt(`${n} 주차`, s.parking === null ? UNKNOWN : s.parking ? '가능' : '불가'));
    if ('note' in s) out.push(fmt(`${n} 매장 메모`, s.note));
  }
  return out;
}

// raw: 데이터셋의 "사용자 정보·API (JSON)" 문자열. 비어 있으면 그대로 돌려준다.
function userInfoToText(raw) {
  const s = (raw || '').trim();
  if (!s) return raw;
  const d = JSON.parse(s);
  const unknown = Object.keys(d).filter((k) => !SPECIAL.has(k) && !FIELDS[k]);
  if (unknown.length) throw new Error(`user_info_text: 모르는 필드 ${unknown.join(', ')}`);

  const status = d.status ?? d.lookup_status;
  const unauthorized = status === 'unauthorized';
  // 실패한 조회에는 정보 시점·기준 시각이 의미가 없다("최신 정보"로 읽히지 않게 뺀다).
  const failed = ['timeout', 'unauthorized', 'location_permission_denied'].includes(status);
  const keys = [...HEAD.filter((k) => k in d), ...Object.keys(d).filter((k) => !HEAD.includes(k))]
    .filter((k) => !unauthorized || META.has(k))
    .filter((k) => !failed || (k !== 'freshness' && k !== 'as_of'));

  const out = [];
  for (const k of keys) {
    const v = d[k];
    if (k === 'fixture' || k === 'field_definitions' || k === 'stores' || k === 'request_filter') continue;
    if (k === 'kind') { if (KIND[v] !== null) out.push(fmt('조회 종류', KIND[v] || v)); continue; }
    if (k === 'status' || k === 'lookup_status') {
      out.push(fmt(d.kind === 'PLAN_CHANGE_API' ? '신청 상태' : '조회 결과', STATUS[v] || v));
      // 매장 검색이 성공(또는 일부 성공)했다면 위치는 확인된 것이다 — 빈 결과를 "위치 미동의"로 읽지 않게 적는다.
      if (d.kind === 'MAP_API' && (v === 'success' || v === 'partial')) out.push(fmt('현재 위치 확인', '됨'));
      continue;
    }
    if (k === 'line_id') {
      const same = !d.requested_line_id || d.requested_line_id === v;
      out.push(fmt('조회된 회선', lineName(v) + (same ? '' : '(요청한 회선과 다름)')));
      continue;
    }
    const [label, conv] = FIELDS[k];
    out.push(fmt(label, v === null ? UNKNOWN : conv(v)));
  }
  if (d.request_filter) {
    const f = d.request_filter;
    const extra = Object.keys(f).filter((k) => !['radius_m', 'requested_service'].includes(k));
    if (extra.length) throw new Error(`검색 조건에 모르는 필드: ${extra.join(', ')}`);
    if ('radius_m' in f) out.push(fmt('검색 반경', `${Number(f.radius_m).toLocaleString('en-US')}m`));
    if ('requested_service' in f) out.push(fmt('검색 조건', `${f.requested_service} 업무를 하는 매장`));
  }
  if ('stores' in d) out.push(...storeLines(d.stores));
  return out.join('\n');
}

module.exports = { userInfoToText };
