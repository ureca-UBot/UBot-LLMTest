'use strict';
// 응답 경로표: 응답 하나를 판단 → 근거 → 내용 순서로 따라가 경로 하나(P0~P7)를 붙인다.
// 경로는 요약용이고, 경로를 만든 다섯 가지 표시(판단 방향·근거 적합·누락·오적용·환각)는
// 행마다 전부 기록한다 — 경로만 남기면 앞 단계에 가려 부차 원인이 사라지기 때문이다.
//
// 입력은 출처와 무관하다. judge_report.js는 Judge의 본문 판정(content_stance·content_sources·
// 누락·모순·환각)을 넣고, 결정론 버전은 라벨(status·evidence_ids)과 규칙 기반 값을 넣을 수 있다.
//
//   P1 과대 판단     본문이 기대보다 더 확정(답이 없는데 답함 등)
//   P2 과소 판단     본문이 기대보다 덜 확정(답할 수 있는데 보류 등)
//   P3 교차          같은 확정 수준의 다른 상태(ABSTAIN↔OUT_OF_SCOPE↔CONFLICT 등)
//   P4 근거 선택 오류 판단은 맞았는데 본문 내용이 정답 문서가 아닌 곳에서 옴
//   P6 오적용        판단·근거는 맞았는데 사실을 틀리게 적용(수치·대상·기간·조건)
//   P5 누락          판단·근거는 맞았는데 필수 사실이 빠짐
//   P7 정답+환각     핵심은 맞았는데 근거 없는 내용을 덧붙임
//   P0 정상
//   PF 판정 불가     본문 행동을 알 수 없음(생성 실패·라벨 없음)
// 환각은 모든 경로에 붙는 표시다(P7만이 환각 경로가 아니다).

const { direction } = require('./status_direction');

const PATHS = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'PF'];
const PATH_NAMES = {
  P0: '정상', P1: '과대 판단', P2: '과소 판단', P3: '교차', P4: '근거 선택 오류',
  P5: '누락', P6: '오적용', P7: '정답+환각', PF: '판정 불가',
};

// sourceOk: true(정답 문서 사용) / false(정답 문서 아님) / null(근거 판정 대상 외)
function responseFlags({ expected, stance, sourceOk, missing, misapplied, hallucinated }) {
  return {
    direction: direction(expected, stance),
    source_ok: sourceOk,
    missing: !!missing,
    misapplied: !!misapplied,
    hallucinated: !!hallucinated,
  };
}

function pathOf(f) {
  if (f.direction === 'NONE') return 'PF';
  if (f.direction === 'OVER') return 'P1';
  if (f.direction === 'UNDER') return 'P2';
  if (f.direction === 'CROSS') return 'P3';
  if (f.source_ok === false) return 'P4';
  if (f.misapplied) return 'P6';
  if (f.missing) return 'P5';
  if (f.hallucinated) return 'P7';
  return 'P0';
}

// 경로별 {total, hallucinated} 와 표시별 비율
function pathStats(rows) {
  const paths = Object.fromEntries(PATHS.map((p) => [p, { total: 0, hallucinated: 0 }]));
  for (const r of rows) {
    paths[r.path].total++;
    if (r.flags.hallucinated) paths[r.path].hallucinated++;
  }
  const n = rows.length;
  const srcRows = rows.filter((r) => r.flags.source_ok !== null);
  const share = (k) => (n ? k / n : null);
  return {
    n,
    paths,
    flags: {
      direction: Object.fromEntries(['MATCH', 'OVER', 'UNDER', 'CROSS', 'NONE'].map((d) => [d, rows.filter((r) => r.flags.direction === d).length])),
      source_applicable: srcRows.length,
      source_wrong_rate: srcRows.length ? srcRows.filter((r) => r.flags.source_ok === false).length / srcRows.length : null,
      missing_rate: share(rows.filter((r) => r.flags.missing).length),
      misapplied_rate: share(rows.filter((r) => r.flags.misapplied).length),
      hallucinated_rate: share(rows.filter((r) => r.flags.hallucinated).length),
    },
  };
}

module.exports = { PATHS, PATH_NAMES, responseFlags, pathOf, pathStats };
