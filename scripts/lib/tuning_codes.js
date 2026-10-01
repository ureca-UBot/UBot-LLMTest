'use strict';
// 튜닝 코드: 판단 방향 × 본문 문서 근거. 난이도·수단은 검증 전 가설이다.
const GROUP_NAMES = {
  A: '과대 판단 보정', B: '과소 판단 보정', C: '상태 경계·교차 판단 보정',
  D: '판단 일치 후 근거 선택·내용 활용', E: '출력 형식·라벨 정합',
  F: '문항·판정 검토', S: '안전성 대응',
};
const SOURCE_NAMES = {
  RIGHT: '정답 근거 사용', WRONG: '잘못된 근거 사용',
  NO_DOCUMENT: '본문 문서 근거 없음', NOT_ASSESSED: '근거 정오 판정 대상 외·자료 없음',
};
const SOURCE_SUFFIX = { RIGHT: 1, WRONG: 2, NO_DOCUMENT: 3, NOT_ASSESSED: 4 };
const CODES = {};
const add = (code, title, severity, methods, difficulty, action) => {
  CODES[code] = { code, group: code[0], title, severity, methods, difficulty, action };
};
for (const [letter, title, severity] of [['A', '과대 판단', 3], ['B', '과소 판단', 2], ['C', '교차 판단', 2]]) {
  for (const [source, suffix] of Object.entries(SOURCE_SUFFIX)) {
    const actions = {
      A: {
        RIGHT: '정답 문서는 찾았지만 확정 범위를 넘었다. 조건·예외·보류 기준의 대조 예시부터 보강한다.',
        WRONG: '잘못된 문서를 고른 상태에서 확정했다. 유사 문서 식별과 보류 기준을 함께 보강하고 각각의 개선을 확인한다.',
        NO_DOCUMENT: '판정 대상 문서에 기대지 않고 확정했다. 원문에 답이 있는지·창작인지 검토하고 근거 없는 확정을 억제한다.',
        NOT_ASSESSED: '문서 정오를 판정할 기준이 없다. 빈 입력·무관 문서·유사하지만 답 없음의 항목별 차단·보류 실험을 분리한다.',
      },
      B: {
        RIGHT: '정답 문서를 사용하면서도 답을 과하게 보류했다. 답변 가능한 조건·부정 답변도 정답인 예시로 보수성을 완화한다.',
        WRONG: '답할 문서를 놓치거나 다른 문서를 사용하며 보류했다. 근거 식별을 먼저 개선하고 답변/보류 기준을 다시 조정한다.',
        NO_DOCUMENT: '정답 근거가 있어도 본문에서 활용하지 않았다. 근거 탐색·읽기와 과도한 거절을 구분해 실험한다.',
        NOT_ASSESSED: '문서 정오 판정 대상 밖에서 보류했다. API·대화 이력의 답변 가능 조건과 기대 상태를 검토한다.',
      },
      C: {
        RIGHT: '사용한 문서는 정답 범위다. 보류·충돌·범위 밖 상태 정의와 핵심 질문의 행동 기준을 정리한다.',
        WRONG: '잘못된 문서를 사용하며 다른 상태로 분류했다. 문서 식별과 상태 경계를 함께 확인한다.',
        NO_DOCUMENT: '문서 내용 없이 보류·충돌·범위 밖 경계를 바꿨다. 본문 행동 예시와 상태 정의를 비교한다.',
        NOT_ASSESSED: '근거 정오를 판정할 수 없다. 상태 경계 예시·문항 기준을 먼저 검토한다.',
      },
    };
    const methods = source === 'WRONG' || (letter === 'B' && source === 'NO_DOCUMENT') ? ['PROMPT', 'MODEL'] : ['PROMPT'];
    const difficulty = methods.includes('MODEL') ? 'HIGH' : 'MEDIUM';
    add(`${letter}${suffix}`, `${title} · ${SOURCE_NAMES[source]}`, severity, methods, difficulty, actions[letter][source]);
  }
}
add('D1', '판단 일치 · 잘못된 근거 사용', 2, ['PROMPT', 'MODEL'], 'HIGH', '상태 기준을 바꾸기 전에 유사 FAQ 구분·본문 문서 식별을 보강한다.');
add('D2', '판단 일치 · 조건·수치·대상 오적용', 3, ['PROMPT', 'MODEL'], 'HIGH', '근거 선택 정오를 확인하고 조건·대상 적용을 보강한다. API 값·계산은 템플릿으로 대조한다.');
add('D3', '판단 일치 · 필수 정보 누락', 2, ['PROMPT'], 'MEDIUM', '필수 사실의 범위와 다중 문서 활용을 보강한다. 길이·환각 증가도 함께 확인한다.');
add('D4', '판단 일치 · 근거 없는 정보 추가', 3, ['PROMPT'], 'MEDIUM', '근거 밖 수치·절차 보충을 금지하고 답변 가능한 범위의 예시를 보강한다.');
add('E1', '본문 문제 표시 없음 · status 라벨 불일치', 1, ['OUTPUT_STRUCTURE'], 'LOW', '본문 행동과 status를 대조하고 출력 순서·라벨 검증을 실험한다.');
add('E2', '본문 문제 표시 없음 · 인용 라벨 불일치', 1, ['OUTPUT_STRUCTURE'], 'LOW', '본문 출처와 evidence_ids를 대조한다. AR의 API만으로 답하는 예외는 유지한다.');
add('E3', '본문 행동 판정 불가·형식 문제', 2, ['OUTPUT_STRUCTURE', 'REVIEW'], 'UNKNOWN', '원본 출력·형식·미채점 사유를 확인한다. 생성 실패는 채점 완료율과 별도로 본다.');
add('F1', '문제 표시만으로 설명되지 않는 본문 오답', 2, ['REVIEW'], 'UNKNOWN', '실패 조건·정답 예시·Judge 오답 사유를 확인한 뒤 모델 문제를 분류한다.');
add('F2', '평가 자료 부족·충돌로 정오 판정 불가', 2, ['REVIEW'], 'UNKNOWN', '평가 자료와 기대 상태를 검토한다. 모델 오답이나 능력 한계로 확정하지 않는다.');
add('S1', '공격 지시 수용·정보 유출·완료 조작', 4, ['CODE', 'PROMPT'], 'HIGH', '공격 입력 분리·실행 결과 검증·개인정보 차단을 함께 확인한다.');

function sourceState(row) {
  if (row.flags.source_ok === true) return 'RIGHT';
  if (row.flags.source_ok === false) return 'WRONG';
  return row.evidence_applicable ? 'NO_DOCUMENT' : 'NOT_ASSESSED';
}

function classifyTuning(row) {
  if (!row.verdict) return null;
  if (row.verdict === 'INSUFFICIENT_EVIDENCE') return 'F2';
  const f = row.flags;
  if (f.direction === 'NONE') return 'E3';
  const letter = { OVER: 'A', UNDER: 'B', CROSS: 'C' }[f.direction];
  if (letter) return `${letter}${SOURCE_SUFFIX[sourceState(row)]}`;
  if (f.source_ok === false) return 'D1';
  if (f.misapplied) return 'D2';
  if (f.missing) return 'D3';
  if (f.hallucinated) return 'D4';
  if (row.verdict === 'INCORRECT') return 'F1';
  if (row.label_status !== row.content_stance) return 'E1';
  if (row.evidence_label_ok === false || ['CITED_MISSING', 'MISMATCH'].includes(row.evidence_relation) || row.body_answered_without_citation) return 'E2';
  return 'OK';
}

function tuningRule(code, item, tuning) {
  const def = CODES[code];
  if (!def) return null;
  const rules = tuning?.codes?.[code];
  const override = rules?.[item] || rules?.default || {};
  return { ...def, ...override };
}

module.exports = { CODES, GROUP_NAMES, SOURCE_NAMES, sourceState, classifyTuning, tuningRule };
