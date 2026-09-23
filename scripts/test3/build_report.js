'use strict';
// test3 결과 문서 생성. compare_rounds.js가 만든 round_comparison.json을 읽어
// results/test3/ 아래 5개 문서를 쓴다. 모델을 호출하지 않는다.
//
// Usage: node scripts/test3/build_report.js

const fs = require('fs');
const path = require('path');
const models = require('./config/models');
const { ROOT } = require('./lib/runner');
const { readJson } = require('./lib/collect');
const charts = require('./lib/charts');

const SUITE = models.suite;
const COMPARISON = path.join(ROOT, 'results', 'scored', SUITE, 'round_comparison.json');
const VRAM = path.join(ROOT, 'results', 'scored', SUITE, 'vram_profile.json');
const DOCS = path.join(ROOT, 'results', SUITE);

// 발표·보고서에 그대로 쓰는 temperature 설정 근거. 문구를 코드에 고정해
// 문서를 다시 생성해도 흔들리지 않게 한다.
const TEMPERATURE_RATIONALE =
  'Ollama 기본값(temperature 0.8)에서 측정한 결과, 상위 모델조차 반복 일관성이 45~52%였다. '
  + '같은 질문에 절반은 다르게 답한다는 뜻이다. FAQ 상담봇에 부적합하다고 판단해 운영 설정을 '
  + 'temperature=0으로 확정했고, EC2 테스트는 그 조건에서 측정했다.';

const pct = (v, d = 1) => v === null || v === undefined ? '-' : (v * 100).toFixed(d) + '%';
const num = (v, d = 0, unit = '') => v === null || v === undefined ? '-' : v.toFixed(d) + unit;
const table = (header, rows) =>
  [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

function write(name, lines) {
  const p = path.join(DOCS, name);
  fs.mkdirSync(DOCS, { recursive: true });
  fs.writeFileSync(p, lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n', 'utf8');
  console.log(`  -> ${path.relative(ROOT, p)}`);
}

// 분모 설명을 값에서 만든다 — 다음 라운드에서 건수가 바뀌어도 맞아야 한다.
function denominatorNote(cmp) {
  const scored = cmp.models
    .map((m) => [m.model_tag, m.test3_think && m.test3_think.llm_judge && m.test3_think.llm_judge.n_scored])
    .filter(([, n]) => n != null);
  if (!scored.length) return '분모는 채점에 성공한 답변 수다.';
  const counts = scored.map(([, n]) => n);
  const mode = counts.sort((a, b) =>
    counts.filter((v) => v === a).length - counts.filter((v) => v === b).length).pop();
  const odd = scored.filter(([, n]) => n !== mode).map(([tag, n]) => `${tag} ${n}문항`);
  return odd.length
    ? `분모는 채점에 성공한 답변 수다 — ${odd.join(', ')}이고 나머지는 ${mode}문항이다.`
    : `분모는 채점에 성공한 답변 수다 — 전 모델 ${mode}문항이다.`;
}

// F1이 0인 모델이 있으면 왜 0인지 각주를 단다(빈 칸과 0을 구분하기 위해).
function absenceZeroNote(cmp) {
  const zero = cmp.models.filter((m) => m.test3_think && m.test3_think.absence_f1 === 0);
  if (!zero.length) return [];
  return zero.map((m) => [
    `- ${m.model_tag}의 부재판단 F1 \`0.000\`은 기대 ABSTAIN 문항 중 0문항을 맞혀(TP=0)`,
    '  정밀도·재현율이 모두 0인 결과다. 채점기는 0/0 나눗셈을 `null`로 내보내지만 관례상 F1은 0이다.',
  ].join('\n'));
}

function summaryDoc(cmp) {
  const rows = cmp.models.map((m) => {
    const t = m.test3_think;
    return [
      m.model_tag, m.tier === 'selected' ? '선별 5' : 'EC2 전용',
      t ? pct(t.llm_judge && t.llm_judge.correct_rate) : '-',
      t ? pct(t.llm_judge && t.llm_judge.is_grounded_rate) : '-',
      t ? pct(t.status_match) : '-',
      t ? num(t.absence_f1, 3) : '-',
      t ? pct(t.format_success_rate) : '-',
      t ? pct(t.repeat && t.repeat.overall) : '-',
      t ? num(t.latency_avg_ms / 1000, 2, 's') : '-',
      t ? num(t.latency_p95_ms / 1000, 2, 's') : '-',
    ];
  });
  return [
    '# test3 (EC2 라운드) 종합 결과', '',
    `생성 시각: ${cmp.generated_at}`, '',
    '## 측정 조건', '',
    `- 대상: **7개 모델** (test2에서 1차 선별한 5개 + 로컬 VRAM 부족으로 제외됐던 EC2 전용 2개)`,
    '- 평가 데이터셋: `data/eval_sets/test_set2/cases.csv` 380행 (고유 300 + 반복 40문항×3회차) — test2와 동일',
    `- **temperature = ${models.operatingTemperature}** (운영 설정), 추론(thinking) 모드 켬`,
    '- seed 미고정 — temperature=0은 greedy decoding이라 seed를 쓰지 않는다',
    '', '## temperature 설정의 근거', '',
    `> ${TEMPERATURE_RATIONALE}`, '',
    '## 한눈에 보기', '',
    '![속도 대비 정답률 기준선](charts/speed_quality.svg)', '',
    '파란 선은 응답 시간(P95)이 그 시간 이내인 설정 중 가장 높은 정답률이다. 기준선 왼쪽은 기다린 만큼 정답률이 오르고, 오른쪽은 기다려도 거의 오르지 않는다. 빈 원은 더 빠르면서 더 정확한 대안이 있는 설정이다.', '',
    '![프론티어 구간별 한계 효율](charts/marginal_efficiency.svg)', '',
    '![test3 본측정 핵심 지표](charts/core_metrics.svg)', '',
    '## 모델별 결과', '',
    table(['모델', '구분', '내용 정확도(AI)', '근거율(AI)', '기대 상태 일치', '부재판단 F1',
      '포맷 성공률', '반복 일관성', '평균 지연', 'P95'], rows),
    '',
    '- 내용 정확도·근거율은 LLM Judge 전수 채점 결과다([llm_judge_review/metrics.json](llm_judge_review/metrics.json), 해석은 [interpretation.md](llm_judge_review/interpretation.md)).',
    '  내용 정확도는 CORRECT 판정 비율, 근거율은 실질적 환각(근거 1~3점)이 없는 답변의 비율(= 1 − 환각률)이다.',
    '  ' + denominatorNote(cmp),
    ...absenceZeroNote(cmp),
    '- **결정론 채점기의 RAG 충실도(`rag_faithfulness.jsonl`)는 이 표에 넣지 않았다.**',
    '  `scripts/test2/score_rag_faithfulness.js`의 premise 누락이 고쳐지지 않아 모델 순위가 역전되기 때문이다.',
    '  자세한 내용은 [methodology.md](methodology.md) 참고.',
    '', '## 함께 볼 문서', '',
    '- [**운영 모델 선별 과정과 근거**](model_selection.md)',
    '- [측정 방법과 한계](methodology.md)',
    '- [추론 모드 on/off 트레이드오프](think_ablation_results.md)',
    '- [temperature 0 vs 0.8 대조](temperature_comparison.md)',
    '- [모델별 VRAM 실측](vram_results.md)',
  ];
}

function methodologyDoc(cmp) {
  return [
    '# test3 측정 방법과 한계', '',
    '## 왜 EC2에서 다시 측정하는가', '',
    '1. **로컬에서 못 돌린 대형 모델 측정** — `gemma3:12b`·`qwen3:14b`는 로컬 GPU(12GB) 부족으로',
    '   test2 대상에서 아예 빠져 있었다. 이번 라운드의 실질적 1순위 목적이다.',
    '2. **동일 하드웨어 기준선** — 선별 5개를 같은 GPU에 올려야 12B/14B와의 속도 차이가',
    '   모델 차이인지 하드웨어 차이인지 구분된다.',
    '3. **운영 파라미터 확정** — temperature 설정의 타당성 실측.',
    '4. **추론 모드 트레이드오프** — test1·test2 모두 추론을 켠 채로만 돌렸다.',
    '', '## temperature', '',
    `> ${TEMPERATURE_RATIONALE}`, '',
    '**주의:** temperature=0에서 반복 일관성이 100%에 가깝게 나오는 것은 모델이 좋아진 결과가',
    '아니라 샘플링을 끈 당연한 결과다. 실제 개선 여부를 보려면 같은 EC2 하드웨어 위에서 돌린',
    '대조군(temperature 0.8, 반복 40문항)과 비교해야 한다 →',
    '[temperature_comparison.md](temperature_comparison.md)',
    '', '## seed', '',
    'seed는 **고정하지 않았다.** temperature=0은 greedy decoding(argmax)이라 난수를 쓰지 않으므로',
    '본 측정에는 영향이 없다. 대신 어떤 파라미터로 돌렸는지를 생성 레코드의 `gen_params` 필드에',
    '남겨 사후 확인이 가능하게 했다.',
    '',
    '전역으로 seed를 고정하지 않은 이유도 함께 기록한다 — 반복 40문항은 ID만 다르고 프롬프트가',
    '동일하므로, 전역 시드를 박으면 세 회차가 글자 단위로 같은 답을 내고 반복 일관성이 자동으로',
    '100%가 된다. 이는 지표의 개선이 아니라 측정 대상의 소멸이다.',
    '', '## 알려진 한계', '',
    ...cmp.comparison_notes.map((n) => `- ${n}`),
    '- **RAG 충실도(결정론 채점기)는 이번에도 고치지 않았다.** `score_rag_faithfulness.js:56`이',
    '  NLI premise에 `제공 Context`만 넣고 `사용자 정보 / API 결과`·`대화 이력`을 빼고 있어,',
    '  해당 입력을 쓰는 유형에서 구조적으로 실패한다. test3의 `rag_faithfulness.jsonl`도 같은',
    '  한계를 그대로 갖는다. 환각 판단은 LLM Judge 결과를 쓴다.',
    '', '## 실행 순서', '', '자세한 명령은 [../../scripts/test3/SETUP.md](../../scripts/test3/SETUP.md) 참고.',
  ];
}

// 짝 건수 설명도 값에서 만든다.
function pairedNote(cmp) {
  const pairs = cmp.paired_thinking || [];
  if (!pairs.length) return '짝 건수는 조건별 채점 결과에 따른다.';
  const counts = pairs.map((p) => p.n_paired);
  const mode = counts.slice().sort((a, b) =>
    counts.filter((v) => v === a).length - counts.filter((v) => v === b).length).pop();
  const odd = pairs.filter((p) => p.n_paired !== mode).map((p) => `\`${p.model_tag}\` ${p.n_paired}쌍`);
  return odd.length
    ? `${odd.join(', ')}, 나머지는 ${mode}쌍이다.`
    : `전 모델 ${mode}쌍이다.`;
}

function thinkDoc(cmp) {
  const targets = cmp.models.filter((m) => m.think_capable);
  const rows = targets.map((m) => {
    const on = m.test3_think, off = m.test3_nothink;
    // 정확도만 짝지은 값을 쓴다 — 두 조건 모두 채점된 동일 문항이 분모라
    // 전체 run 값과 다르다. 토큰·지연은 각 실행의 전체 집계값 그대로다.
    const pair = (cmp.paired_thinking || []).find((p) => p.model_tag === m.model_tag);
    // 음수는 U+2212(−)를 쓴다 — ASCII 하이픈은 "값 없음(-)"과 헷갈린다.
    const d = (a, b) => (a == null || b == null) ? '-'
      : ((b - a) >= 0 ? '+' : '−') + Math.abs(b - a).toFixed(1) + '%p';
    return [
      m.model_tag,
      on ? num(on.avg_eval_count) : '-', off ? num(off.avg_eval_count) : '-',
      on ? num(on.latency_avg_ms / 1000, 2, 's') : '-', off ? num(off.latency_avg_ms / 1000, 2, 's') : '-',
      on ? num(on.latency_p95_ms / 1000, 2, 's') : '-', off ? num(off.latency_p95_ms / 1000, 2, 's') : '-',
      pair ? pct(pair.on && pair.on.correct_rate) : '-',
      pair ? pct(pair.off && pair.off.correct_rate) : '-',
      d(pair && pair.on && pair.on.correct_rate * 100, pair && pair.off && pair.off.correct_rate * 100),
    ];
  });
  const excluded = cmp.models.filter((m) => !m.think_capable).map((m) => m.model_tag);
  return [
    '# 추론(thinking) 모드 on/off 트레이드오프', '',
    '## 배경', '',
    'test2에서 `qwen3:4b`는 평균 1,171토큰 / 9.52초, P95 21.67초였다(`gemma3:4b`는 77토큰 / 1.84초).',
    '실시간 채팅에 쓰기 어려운 수치인데, test1·test2 모두 추론을 켠 채로만 돌려서 끈 조건은',
    '한 번도 측정된 적이 없다.',
    '',
    '그렇다고 그냥 끌 수도 없다. `qwen3:4b`가 내용 정확도 1위(test2 기준 72.0%)인 것이 추론',
    '덕분일 수 있어서, 확인 없이 끄면 모델 선정 근거 자체가 무너진다. 그래서 두 조건을 모두 잰다.',
    '', '## 측정 결과', '',
    '두 조건 모두 temperature=0으로 고정했다 — 추론 변수만 남기기 위해서다.', '',
    '![추론 on/off 기울기 비교](charts/think_slope.svg)', '',
    table(['모델', 'on 토큰', 'off 토큰', 'on 평균', 'off 평균', 'on P95', 'off P95',
      'on 정확도', 'off 정확도', '정확도 변화'], rows),
    '',
    '정확도는 LLM Judge 전수 채점 결과이며, 두 조건 모두 채점된 **동일 문항만 짝지어** 비교했다 —',
    pairedNote(cmp) + ' 토큰·지연은 각 실행의 전체 집계값이다.',
    '출처: [llm_judge_review/README.md](llm_judge_review/README.md), [interpretation.md](llm_judge_review/interpretation.md).',
    '',
    `**대상 제외:** ${excluded.join(', ')} — 추론 모드가 없는 모델이라 비교 대상이 아니다.`,
    '', '## 해석 기준', '',
    '- 지연이 줄어도 **정확도 하락폭이 크면 못 쓴다.** 두 값을 함께 봐야 한다.',
    '- 상담봇의 실용 한계선은 통상 완료 3~5초다. P95를 기준으로 판단한다.',
  ];
}

function tempDoc(cmp) {
  const rows = cmp.models.map((m) => {
    const ctrl = m.test3_temp_control, t0 = m.test3_think, t2 = m.test2;
    const r = (x) => x && x.repeat ? x.repeat : null;
    return [
      m.model_tag,
      t2 && r(t2) ? pct(r(t2).overall) : '-',
      ctrl && r(ctrl) ? pct(r(ctrl).overall) : '-',
      t0 && r(t0) ? pct(r(t0).overall) : '-',
      ctrl && r(ctrl) ? pct(r(ctrl).status) : '-',
      t0 && r(t0) ? pct(r(t0).status) : '-',
      ctrl && r(ctrl) ? pct(r(ctrl).numbers) : '-',
      t0 && r(t0) ? pct(r(t0).numbers) : '-',
    ];
  });
  return [
    '# temperature 0 vs 0.8 대조', '',
    '## 왜 대조군이 필요한가', '',
    'test2는 `local-win`(RTX 4070 Ti, temperature 0.8), test3는 `ec2-linux`(temperature 0)다.',
    '**하드웨어가 같이 바뀌었기 때문에** 두 라운드의 차이를 temperature 효과로만 귀속할 수 없다.',
    '그래서 같은 EC2 위에서 temperature 0.8로 반복 40문항만 한 번 더 돌려 교란 요인을 제거했다.',
    '', '## 설정 근거', '',
    `> ${TEMPERATURE_RATIONALE}`, '',
    '## 반복 일관성 비교', '',
    table(['모델', 'test2 (local, 0.8)', 'EC2 대조군 (0.8)', 'EC2 본측정 (0)',
      '대조군 상태', '본측정 상태', '대조군 숫자', '본측정 숫자'], rows),
    '',
    '- **test2 ↔ EC2 대조군**: 같은 temperature, 다른 하드웨어 → 하드웨어 영향을 본다.',
    '- **EC2 대조군 ↔ EC2 본측정**: 같은 하드웨어, 다른 temperature → **temperature 효과만** 본다.',
    '',
    '**주의:** 본측정(temp=0)의 반복 일관성이 100%에 가까운 것은 개선이 아니라 샘플링을 끈',
    '결과다. 이 표의 의미는 "얼마나 올랐나"가 아니라 "운영 설정을 0으로 바꾸면 응답이',
    '결정론적으로 안정된다"를 보이는 데 있다.',
  ];
}

function selectionDoc(cmp) {
  const screening = require('./lib/screening');
  const cands = screening.candidates(cmp);
  if (!cands.length) return null;
  const six = screening.survival(cands, 'six');
  const nine = screening.survival(cands, 'nine');
  const A = 'gemma3:12b', B = 'qwen3:14b OFF';
  const h = screening.headToHead(cmp, A, B);
  if (!h) return null;

  const find = (tag) => {
    for (const m of cmp.models) {
      for (const [k, suf] of [['test3_think', m.think_capable ? ' ON' : ''], ['test3_nothink', ' OFF']]) {
        if (m.model_tag + suf === tag) return m[k];
      }
    }
    return null;
  };
  const ra = find(A), rb = find(B);
  const srt = (o) => Object.entries(o).sort((x, y) => y[1] - x[1]);
  const dead = srt(six.rate).filter(([, v]) => v < 0.05).map(([t]) => t);
  const nineTop = srt(nine.rate);

  const survTable = (res, keep) => table(['설정', '생존율', '비고'],
    srt(res.rate).map(([t, v]) => [
      keep.includes(t) ? `**${t}**` : t,
      (keep.includes(t) ? '**' : '') + v.toFixed(1) + '%' + (keep.includes(t) ? '**' : ''),
      v < 0.05 ? '어떤 순서에서도 탈락' : '',
    ]));

  const h2hTable = table(['유형', '문항', A, B, '차이'],
    h.pairs.map((p) => {
      const d = (p.b - p.a) * 100;
      const mark = Math.abs(d) >= 25 ? ' ←' : '';
      return [p.key, String(p.n),
        `${p.aC}/${p.n} ${(p.a * 100).toFixed(0)}%`,
        `${p.bC}/${p.n} ${(p.b * 100).toFixed(0)}%`,
        (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(0) + 'p' + mark];
    }));

  const diffTable = table(['난이도', `${A} 정답`, `${B} 정답`, '차이'],
    (h.difficulty.a || []).map((d) => {
      const b = (h.difficulty.b || []).find((x) => x.key === d.key);
      if (!b) return [d.key, `${d.correct}/${d.n}`, '-', '-'];
      return [d.key, `${d.correct}/${d.n}`, `${b.correct}/${b.n}`,
        (b.correct - d.correct >= 0 ? '+' : '−') + Math.abs(b.correct - d.correct) + '건'];
    }));

  return [
    '# test3 — 운영 모델 선별 과정과 근거', '',
    `생성 시각: ${cmp.generated_at}`, '',
    '## 결론', '',
    `**1차 MVP 모델로 \`qwen3:14b\`(추론 OFF, temperature=0)를 선정한다.**`, '',
    '- 11개 설정을 2단계로 좁혔다. 1단계는 **하자 걸러내기**, 2단계는 **남은 둘의 서열**이다.',
    `- 1단계에서 ${dead.length}개 설정이 **지표 순서 ${six.orders}가지 전부에서** 탈락했다.`,
    `- 2단계에서 \`${B}\`가 \`${A}\`를 유형 ${h.winsB}승 ${h.winsA}패 ${h.ties}무로 앞섰다.`, '',
    '> **이 선정은 1차 MVP를 위한 것이며, 최종 산출물의 모델로 확정된 것이 아니다.**',
    '> 최적화·양자화·프롬프트 개선을 거치지 않은 상태의 비교 결과이고,',
    '> 운영 트래픽에서의 동시 처리 성능은 이번 측정 범위 밖이다.', '',
    '## 1. 왜 "하자 걸러내기"부터인가', '',
    '상담 챗봇의 LLM은 **어느 하나가 아무리 특출나도 어디 하나가 고장나 있으면 안 된다.**',
    '사용자는 평균적인 상담을 경험하지 않는다. 자기 질문 하나를 경험한다.',
    '그 하나가 47초 걸리거나, 자료에 없는 금액을 지어내면 다른 지표의 1위는 위로가 되지 않는다.',
    '', '이 주장은 우리 측정값 안에서 직접 확인된다.', '',
    '### 근거 ① 품질 3관왕이 응답 시간 하나로 무너진다 — `qwen3:4b` ON', '',
    '`qwen3:4b` ON은 11개 설정 중 **근거율 1위(86.3%) · 기대 상태 일치 1위(82.3%) · 부재판단 F1 1위(0.764)**다.',
    '세 지표에서 최고이고, 환각률도 13.7%로 전체 최저다. 품질만 보면 압도적이다.',
    '', '그런데 고유 300문항의 응답 시간 분포는 이렇다.', '',
    table(['구간', '값'], [
      ['P50 (중앙값)', '15.1초'], ['P75', '22.1초'], ['P90', '31.7초'],
      ['P95', '47.6초'], ['P99', '68.5초'],
      ['**5초 초과**', '**300/300 (100.0%)**'],
      ['10초 초과', '230/300 (76.7%)'],
      ['30초 초과', '36/300 (12.0%)'],
    ]),
    '', '**단 한 건도 5초 안에 답하지 못했다.** 중앙값이 15초다.',
    '품질 지표 세 개가 1위여도 이 설정은 상담봇으로 쓸 수 없다.',
    '평균이나 종합 점수로 묶으면 이 모델이 상위권으로 올라온다 — 그래서 묶지 않았다.', '',
    '### 근거 ② 상위권 모델의 한 축이 0이 된다 — `exaone3.5:7.8b`', '',
    '`exaone3.5:7.8b`는 **포맷 성공률 100.0%(공동 1위) · 반복 일관성 90.0%(3위)**로 두 지표에서 상위권이다.',
    '그런데 FAQ 부재 판단에서 **기대 ABSTAIN 88문항 중 0문항을 맞혔다(TP=0, F1 0.000)**.',
    '', '"자료에 없습니다"라고 말해야 할 88번 모두 다른 답을 했다는 뜻이다.',
    'FAQ 챗봇에서 이건 기능 하나가 없는 것과 같고, 포맷·일관성 상위권이 이를 상쇄하지 못한다.', '',
    '### 근거 ③ 평균은 구멍을 가린다', '',
    table(['설정', '전체 정답률', '최악 유형'], [
      ['qwen3:4b OFF', '43.7%', '조건·예외·경계값 **4%** (1/24)'],
      ['qwen3:8b OFF', '43.7%', '유사하지만 답 없음 **3%** (1/35)'],
    ]),
    '', '두 설정은 전체 정답률이 같다. 그런데 무너지는 자리가 서로 다르고, 그 자리에서는 거의 0에 가깝다.',
    '통신 FAQ는 임계값 규칙(할인 기준 금액, 데이터 한도, 약정 기간)이 많아',
    '`조건·예외·경계값` 4%는 그 상담 유형을 통째로 못 한다는 뜻이다.',
    '**평균 하나로는 이 사실이 보이지 않는다.**', '',
    '### 그래서 최소값 논리를 택했다', '',
    '매 라운드 **최하위 1개**를 떨어뜨린다. 한 지표에서 꼴찌면 다른 지표의 1위가 그것을 구제하지 못한다.',
    '이것이 "하자 있는 모델을 걸러낸다"의 조작적 정의다.',
    '', '이 방식이 이번 데이터에 특히 맞는 이유가 하나 더 있다.',
    '**최적화하지 않은 테스트라 절대 수치는 신뢰하기 어렵지만, "꼴찌"는 상대 비교라 오차에 강하다.**',
    '어떤 설정의 정답률이 23.0%가 아니라 28%였더라도 1위(75.6%)가 되지는 않는다.', '',
    '## 2. 측정 조건과 지표 선택', '',
    `- 대상: **11개 설정** (7개 모델 × 추론 ON/OFF 조합). 평가 문항은 \`cases.csv\` 고유 300문항.`,
    '- 탈락 라운드에 쓴 지표 6개:', '',
    table(['지표', '출처', '방향'], [
      ['내용 정확도', 'LLM Judge (`gpt-6-astra`) 전수 채점', '높을수록 좋음'],
      ['근거율 (1 − 환각률)', 'LLM Judge', '높을수록'],
      ['기대 상태 일치', '코드 (결정론)', '높을수록'],
      ['부재판단 F1', '코드 (결정론)', '높을수록'],
      ['반복 일관성', '코드 (결정론)', '높을수록'],
      ['P95 지연', '실측', '**낮을수록**'],
    ]),
    '', '**제외한 지표와 사유**', '',
    table(['지표', '제외 사유'], [
      ['포맷 성공률', '11개 설정이 99.3~100.0%. 값의 폭이 1%라 0.7%p로 모델을 죽이면 사실상 동전 던지기'],
      ['표현 품질', '88.4~94.4%, 폭 6%. 변별력이 없다'],
      ['평균 지연', 'P95와 중복. 같은 축을 두 번 세면 속도에 가중치가 두 배로 들어간다'],
    ]),
    '', '**VRAM은 순위 지표가 아니라 전제다.** 후보군을 보고 EC2 사양을 정했고,',
    '11개 설정 전부가 Tesla T4 16GB에 적재된다(최대 `qwen3:14b` ON 9.88GB, 여유 6.12GB).',
    '전원 통과하는 값을 순위에 넣으면 0.45GB 차이로 모델이 탈락하는 왜곡이 생긴다.', '',
    '## 3. 1단계 선별 — 하자 걸러내기 (6라운드)', '',
    '![1차 선별 생존율](charts/screening_6r.svg)', '',
    '지표 6개를 **한 번씩** 쓴다. 매 라운드 최하위 1개가 탈락해 11개 → 5개가 남는다.',
    `지표를 어떤 순서로 배치하느냐에 결과가 달라지므로, **순서를 고르지 않고 ${six.orders}가지 전순열을 전수로** 돌렸다.`,
    '각 지표가 정확히 한 번씩만 쓰이므로 **가중치는 완전히 균등하다.**', '',
    survTable(six, [A, B]),
    '', `**${dead.length}개 설정이 ${six.orders}가지 전부에서 탈락했다.** 확률이 아니라 예외가 없다.`,
    `다만 상위 4개(\`${B}\`·\`${A}\`·\`qwen3:14b ON\`·\`qwen3:8b ON\`)는 서로 큰 차이가 없어,`,
    '이 단계만으로는 2개까지 좁힐 수 없다.', '',
    '## 4. 변별 — 2개까지 좁히기 (9라운드)', '',
    '![2개까지 좁히기](charts/screening_9r.svg)', '',
    '11개를 2개로 줄이려면 9번 탈락시켜야 하는데 지표는 6개다. **3개 지표가 한 번 더 쓰인다.**',
    '앞자리 지표를 그대로 재사용하면 순서의 앞쪽에 가중치가 두 배로 붙는다.',
    `그래서 **어느 3개를 재사용할지까지 독립적으로 훑었다** — 앞 6라운드 순열(720) × 재사용 3개 선택(P(6,3)=120) = **${nine.orders.toLocaleString()}가지**.`,
    '', survTable(nine, [A, B]),
    '', `**\`${nineTop[0][0]}\` ${nineTop[0][1].toFixed(1)}% · \`${nineTop[1][0]}\` ${nineTop[1][1].toFixed(1)}%.**`,
    `3위(\`${nineTop[2][0]}\` ${nineTop[2][1].toFixed(1)}%)와 압도적으로 벌어지고, 순위도 \`${nineTop[0][0]}\`가 1위다.`,
    '', '> 참고: 재사용 지표를 독립으로 훑기 전(720가지)에는 97.0%가 아니라 98.9%였다.',
    '> **차이가 1.9%p에 불과해, 가중 편향이 결과를 만든 것이 아님이 실측으로 확인된다.**', '',
    '## 5. 2단계 서열 — `' + A + '` vs `' + B + '`', '',
    '1단계는 "하자가 없다"까지만 증명한다. 남은 둘의 우열은 다른 기준이 필요하다.',
    '**상담봇은 평균이 아니라 최저치가 품질을 정하므로, 유형별 커버리지로 판단했다.**', '',
    '![유형별 맞대결](charts/head_to_head.svg)', '',
    '### 5-1. 유형별 정답률 (LLM Judge 전수 채점)', '',
    h2hTable,
    '', `**${B} ${h.winsB}승 · ${A} ${h.winsA}승 · 무 ${h.ties}.**`,
    `정답률 50% 미만 유형은 **${A} ${h.belowA}개, ${B} ${h.belowB}개**다.`, '',
    `\`${A}\`는 조건·예외·경계값에서 29%(7/24)다. 요금제 할인 기준·데이터 한도 같은`,
    '임계값 상담이 통신 FAQ의 큰 축인데, 이 유형을 사실상 처리하지 못한다.',
    `\`${B}\`는 같은 유형에서 79%(19/24)다.`, '',
    '### 5-2. 난이도별 내용 정확도', '',
    diffTable,
    '', '기대 상태 일치(`ai_analysis.md` §13.3)로 봐도 같은 방향이다.', '',
    table(['난이도', `${A} 상태 일치`, `${B} 상태 일치`], [
      ['Easy / 81', '67', '**73**'], ['Medium / 112', '81', '**86**'], ['Hard / 107', '67', '**79**'],
    ]),
    '', '**서로 다른 두 지표(Judge 내용 정확도, 코드 기반 상태 일치)가 전 난이도에서 같은 결론을 낸다.**', '',
    '### 5-3. 전체 지표', '',
    table(['지표', A, B], [
      ['**내용 정확도 (AI)**', pct(ra.llm_judge.correct_rate), '**' + pct(rb.llm_judge.correct_rate) + '**'],
      ['근거율 (AI)', '**' + pct(ra.llm_judge.is_grounded_rate) + '**', pct(rb.llm_judge.is_grounded_rate)],
      ['기대 상태 일치', pct(ra.status_match), '**' + pct(rb.status_match) + '**'],
      ['부재판단 F1', '**' + num(ra.absence_f1, 3) + '**', num(rb.absence_f1, 3)],
      ['반복 일관성', '**' + pct(ra.repeat.overall) + '**', pct(rb.repeat.overall)],
      ['평균 지연', '**' + num(ra.latency_avg_ms / 1000, 2, 's') + '**', num(rb.latency_avg_ms / 1000, 2, 's')],
      ['P95 지연', '**' + num(ra.latency_p95_ms / 1000, 2, 's') + '**', num(rb.latency_p95_ms / 1000, 2, 's')],
      ['VRAM (최대, 낮을수록 좋음)', num(ra.vram_mib.max / 1024, 2, 'GB'), '**' + num(rb.vram_mib.max / 1024, 2, 'GB') + '**'],
    ]),
    '', '### 5-4. 반대 근거도 같이 본다', '',
    `\`${A}\`가 이기는 지표가 분명히 있다. 숨기지 않는다.`, '',
    `- **근거율·부재판단 F1·반복 일관성 세 지표에서 \`${A}\`가 앞선다.** 6개 지표 평균 순위로는 \`${A}\`가 우위다.`,
    `- 유형별로도 \`${A}\`가 3개에서 이긴다 — 유사하지만 답 없음(+23p), 빈 컨텍스트(+17p), 부분 정보(+6p).`,
    '  **셋 다 "근거가 없을 때 모른다고 말하는" 유형**이고, 이는 추론을 끈 설정의 알려진 약점이다.',
    `- 속도는 \`${A}\`가 낫다 — 평균 ${num(ra.latency_avg_ms / 1000, 2, 's')} vs ${num(rb.latency_avg_ms / 1000, 2, 's')}, P95 ${num(ra.latency_p95_ms / 1000, 2, 's')} vs ${num(rb.latency_p95_ms / 1000, 2, 's')}.`,
    `  다만 VRAM은 \`${B}\`가 오히려 적다(${num(rb.vram_mib.max / 1024, 2, 'GB')} vs ${num(ra.vram_mib.max / 1024, 2, 'GB')}).`,
    '', `그럼에도 \`${B}\`를 택한 이유는, **이기는 유형의 수(${h.winsB}:${h.winsA})와 격차의 크기가 모두 크기 때문**이다.`,
    '`조건·예외·경계값` +50p, `FAQ 충돌·시행일` +33p, `다중 FAQ 조합` +20p 대',
    '`유사하지만 답 없음` −23p, `빈 컨텍스트` −17p.',
    `그리고 50% 미만으로 떨어지는 유형이 ${h.belowA}개 대 ${h.belowB}개다.`, '',
    `\`${B}\`의 약점(부재 인정)은 **검색 근거가 빈약할 때 LLM을 거치지 않고 상담사로 넘기는 게이트**로`,
    '보완할 수 있는 성격이다. 반대로 조건·경계값 판단은 외부 게이트로 대체하기 어렵다.', '',
    '## 6. 한계', '',
    '- **1차 MVP 선정이다.** 최적화·양자화·프롬프트 튜닝 이전 상태의 비교이며 최종 모델 확정이 아니다.',
    '- **내용 정확도·근거율은 단일 LLM Judge(`gpt-6-astra`) 판정**이고 사람 검수를 거치지 않았다.',
    '  다만 코드 기반 결정론 지표(기대 상태 일치)와 모델 순위 상관이 Spearman +0.96으로 높다.',
    '- **유형별 표본이 작다.** `API 결과 답변`은 5문항이라 한 문항이 20%p다. 확정적으로 읽지 않는다.',
    '- **지연은 단일 요청 순차 측정**이다. 동시 처리량이 아니며, 실제 트래픽에서는 더 나빠진다.',
    `  \`${B}\`의 P95 ${num(rb.latency_p95_ms / 1000, 2, 's')}는 상담봇 통상 기준(3~5초)을 넘는다.`,
    '- **2단계 서열은 판단이다.** 1단계(전순열 전수)는 순서·가중치에 의존하지 않는 결과지만,',
    '  "유형별 커버리지로 서열을 정한다"는 기준 선택은 우리가 내린 결정이다. 평균 순위로 보면 결론이 달라진다.', '',
    '## 함께 볼 문서', '',
    '- [종합 결과](summary_results.md) · [측정 방법과 한계](methodology.md)',
    '- [추론 on/off 트레이드오프](think_ablation_results.md) · [LLM Judge 상세](llm_judge_review/README.md)',
  ];
}

function vramDoc(profile) {
  if (!profile) {
    return ['# 모델별 VRAM 실측', '', '아직 측정하지 않았다. 다음 명령으로 측정한다:', '',
      '```bash', 'node scripts/test3/measure_vram.js', '```'];
  }
  const rows = profile.measurements.map((m) => [
    m.model_tag, m.tier === 'selected' ? '선별 5' : 'EC2 전용',
    m.size_vram_mib === null ? '-' : `${m.size_vram_mib} MiB`,
    m.model_size_mib === null ? '-' : `${m.model_size_mib} MiB`,
    m.delta_mib === null ? '-' : `${m.delta_mib} MiB`,
    m.fully_on_gpu === null ? '-' : (m.fully_on_gpu ? 'O' : '**X**'),
    m.warmup_load_ms === null ? '-' : `${(m.warmup_load_ms / 1000).toFixed(1)}s`,
  ]);
  return [
    '# 모델별 VRAM 실측 (항목8)', '',
    `측정 환경: ${profile.env} · GPU: ${profile.gpu_name || '(nvidia-smi 없음)'}`,
    `측정 시각: ${profile.measured_at}`, '',
    '## 측정 방법', '',
    '모델을 하나씩만 올려놓고 잰다. 이전 모델을 언로드 → 유휴 기준선 측정 → 워밍업 1건으로',
    '로드 → `/api/ps`의 모델별 `size_vram`과 `nvidia-smi` 전체값을 동시에 기록 → 기준선 차감.',
    '', '## 결과', '',
    table(['모델', '구분', 'size_vram', '모델 크기', '순증분(nvidia-smi)', 'GPU 전량 적재', '로드 시간'], rows),
    '',
    '- **`size_vram`** — Ollama가 보고하는 그 모델의 VRAM 점유량. "모델별 값"은 이쪽이다.',
    '- **순증분** — `nvidia-smi` 전체값에서 유휴 기준선을 뺀 값. `size_vram`과 크게 다르면',
    '  GPU를 쓰는 다른 프로세스가 있다는 뜻이다.',
    '- **GPU 전량 적재 = X** — 모델 일부가 CPU로 내려갔다는 뜻이며, 그 모델은 지연이 크게',
    '  나빠진다. 대형 모델이 느릴 때 원인을 가르는 핵심 신호다.',
    '', `> ${profile.note}`,
  ];
}

// 발표용 한 장 — SVG를 인라인해 외부 요청이 0이다. 브라우저에서 열어 그대로 캡처한다.
function writeDashboard(cmp, svgs) {
  // 선별 → 서열 → 보조 순. 발표 흐름과 같은 순서로 싣는다.
  const order = ['screening_6r.svg', 'screening_9r.svg', 'head_to_head.svg', 'speed_quality.svg',
    'marginal_efficiency.svg', 'core_metrics.svg', 'think_slope.svg'];
  const figs = order.filter((k) => svgs[k]).map((k) =>
    `<figure>${svgs[k].replace(/ width="\d+" height="\d+"/, ' width="100%" height="auto"')}</figure>`);
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>test3 결과 대시보드</title>
<style>
  :root { color-scheme: light dark; --page:#f9f9f7; --card:#fcfcfb; --ink:#0b0b0b; --ink2:#52514e; --line:#e1e0d9; }
  @media (prefers-color-scheme: dark) {
    :root { --page:#0d0d0d; --card:#1a1a19; --ink:#ffffff; --ink2:#c3c2b7; --line:#2c2c2a; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 16px 56px; background:var(--page); color:var(--ink);
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR','Malgun Gothic',sans-serif; }
  .wrap { max-width:1060px; margin:0 auto; }
  h1 { font-size:24px; margin:0 0 6px; }
  .meta { color:var(--ink2); font-size:13px; margin:0 0 28px; }
  figure { margin:0 0 22px; padding:10px; background:var(--card);
           border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  figure svg { display:block; width:100%; height:auto; }
  footer { color:var(--ink2); font-size:12px; margin-top:28px; line-height:1.7; }
  code { font-size:11.5px; }
</style></head>
<body><div class="wrap">
<h1>test3 (EC2 라운드) — 운영 모델 선별</h1>
<p class="meta">생성 시각 ${cmp.generated_at} · 출처 <code>results/scored/${SUITE}/round_comparison.json</code><br>
1차 MVP 모델 선정 결과이며 최종 확정이 아니다. 근거 전문은 <code>results/${SUITE}/model_selection.md</code>.</p>
${figs.join('\n')}
<footer>
내용 정확도·근거율은 LLM Judge(<code>gpt-6-astra</code>) 전수 채점 결과, 기대 상태 일치·반복 일관성·포맷 성공률은 코드 기반 결정론 지표다.<br>
지연·VRAM은 EC2(Tesla T4)에서 단일 요청을 순차 측정한 값이며 동시 처리량이 아니다. test2와는 하드웨어가 달라 속도를 비교하지 않는다.
</footer>
</div></body></html>
`;
  fs.writeFileSync(path.join(DOCS, 'dashboard.html'), html, 'utf8');
  console.log(`  -> results/${SUITE}/dashboard.html`);
}

function main() {
  const cmp = readJson(COMPARISON);
  if (!cmp) {
    console.error(`먼저 비교 집계를 만드세요: node scripts/test3/compare_rounds.js`);
    process.exit(1);
  }
  console.log('test3 문서 생성:');
  const made = charts.writeAll(cmp, path.join(DOCS, 'charts'));
  made.made.forEach((f) => console.log(`  -> results/${SUITE}/charts/${f}`));
  writeDashboard(cmp, made.charts);

  const sel = selectionDoc(cmp);
  if (sel) write('model_selection.md', sel);
  write('summary_results.md', summaryDoc(cmp));
  write('methodology.md', methodologyDoc(cmp));
  write('think_ablation_results.md', thinkDoc(cmp));
  write('temperature_comparison.md', tempDoc(cmp));
  write('vram_results.md', vramDoc(readJson(VRAM)));
  if (cmp.missing_rounds.length) {
    console.log(`\n[주의] 아직 안 돌린 라운드가 ${cmp.missing_rounds.length}건 있어 표에 '-'로 남습니다.`);
  }
}

main();
