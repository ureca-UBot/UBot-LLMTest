'use strict';
// test3 결과 문서 생성. compare_rounds.js가 만든 round_comparison.json을 읽어
// results/test3/ 아래 5개 문서를 쓴다. 모델을 호출하지 않는다.
//
// Usage: node scripts/test3/build_report.js [--only summary_results.md,methodology.md]
//
// --only: 지정한 문서만 다시 쓴다. 일부 문서(think_ablation_results.md 등)는
// 이 스크립트가 만들지 못하는 수치(조건 간 짝 비교)를 손으로 채워 넣은 상태라,
// 전체 재생성으로 그 값을 날리지 않게 하려면 이 옵션으로 범위를 좁힌다.

const fs = require('fs');
const path = require('path');
const models = require('./config/models');
const { ROOT } = require('./lib/runner');
const { readJson } = require('./lib/collect');

const SUITE = models.suite;
const COMPARISON = path.join(ROOT, 'results', 'scored', SUITE, 'round_comparison.json');
// 결정론 RAG 근거율을 표에 실을 수 있는지 판정한 결과.
// scripts/test3/verify_rag_rule_ranking.js가 만든다. 없으면 그 컬럼을 뺀다.
const RAG_CHECK = path.join(ROOT, 'results', 'scored', SUITE, 'rag_rule_ranking_check.json');
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

// 결정론 RAG 근거율 셀: 비율 + 95% 신뢰구간. 신뢰구간을 같이 적는 이유는
// 검증 결과가 "구간이 겹치지 않는 쌍만 비교 가능"이었기 때문이다.
function ragCell(t, check) {
  if (!t || !t.rag_rule || t.rag_rule.rate === null) return '-';
  const r = t.rag_rule;
  const found = check && check.models.find((x) => x.run_id === t.run_id);
  const ci = found && found.ci95 ? ` [${(100 * found.ci95[0]).toFixed(1)}~${(100 * found.ci95[1]).toFixed(1)}]` : '';
  return `${pct(r.rate)}${ci} (n=${r.n_scored})`;
}

function summaryDoc(cmp, ragCheck) {
  const rows = cmp.models.map((m) => {
    const t = m.test3_think;
    return [
      m.model_tag, m.tier === 'selected' ? '선별 5' : 'EC2 전용',
      t ? pct(t.llm_judge && t.llm_judge.correct_rate) : '-',
      t ? pct(t.llm_judge && t.llm_judge.is_grounded_rate) : '-',
      ragCell(t, ragCheck),
      t ? pct(t.status_match) : '-',
      t ? (t.absence_f1 === null ? '0.000' : num(t.absence_f1, 3)) : '-',
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
    '## 모델별 결과', '',
    table(['모델', '구분', '내용 정확도(AI)', '근거율(AI)', 'RAG 근거율(결정론) [95% CI]', '기대 상태 일치', '부재판단 F1',
      '포맷 성공률', '반복 일관성', '평균 지연', 'P95'], rows),
    '',
    '- 내용 정확도·근거율은 LLM Judge 전수 채점 결과다([llm_judge_review/metrics.json](llm_judge_review/metrics.json), 해석은 [interpretation.md](llm_judge_review/interpretation.md)).',
    '  내용 정확도는 CORRECT 판정 비율, 근거율은 실질적 환각(근거 1~3점)이 없는 답변의 비율(= 1 − 환각률)이다.',
    '  분모는 채점에 성공한 답변 수다 — qwen3:8b 298문항, qwen3:14b 299문항이고 나머지는 300문항이다.',
    '- exaone3.5:7.8b의 부재판단 F1 `0.000`은 기대 ABSTAIN 88문항 중 0문항을 맞혀(TP=0)',
    '  정밀도·재현율이 모두 0인 결과다. 채점기는 0/0 나눗셈을 `null`로 내보내지만 관례상 F1은 0이다.',
    ...ragColumnNotes(ragCheck),
    '', '## 함께 볼 문서', '',
    '- [측정 방법과 한계](methodology.md)',
    '- [추론 모드 on/off 트레이드오프](think_ablation_results.md)',
    '- [temperature 0 vs 0.8 대조](temperature_comparison.md)',
    '- [모델별 VRAM 실측](vram_results.md)',
  ];
}

// 결정론 RAG 근거율 컬럼에 붙이는 주석. 검증 결과 파일이 있으면 실제 수치를
// 인용하고, 없으면 컬럼을 신뢰할 수 없다는 사실만 적는다.
function ragColumnNotes(check) {
  if (!check) {
    return ['- **RAG 근거율(결정론)**: 검증 파일이 없어 해석 근거가 없다.',
      '  `node scripts/test3/verify_rag_rule_ranking.js`를 먼저 실행할 것.'];
  }
  return [
    '- **RAG 근거율(결정론)은 절대값으로 읽지 말 것.** `score_rag_faithfulness.js`가 NLI premise에',
    '  `제공 Context`만 넣고 `사용자 정보 / API 결과`·`대화 이력`을 빼므로 실제보다 낮게 나온다.',
    `  이 컬럼을 되살린 근거는 [rag_rule_ranking_check.json](../scored/${SUITE}/rag_rule_ranking_check.json)이다 —`,
    `  편향이 모델에 고루 걸려 전체 순위와 premise 정상 문항만의 순위가 거의 같고(Spearman rho ${check.rho_all_vs_premise_complete}),`,
    `  신뢰구간이 겹치지 않는 ${check.pairs_separable}쌍은 문항을 절반씩 나눠도 순서가 유지된다(${check.pairs_separable_and_consistent}/${check.pairs_separable}쌍).`,
    `  반면 7개 모델 전체 줄세우기는 재현되지 않았다(split-half rho ${check.rho_split_half}).`,
    '  **신뢰구간이 겹치는 모델끼리는 순서를 주장하지 말 것.**',
    '- `n`은 채점된 문항 수다. 보류(ABSTAIN/CLARIFY/OUT_OF_SCOPE)로 답한 문항은 근거 대조 대상이 아니라',
    '  분모에서 빠지므로, 보류가 많은 모델일수록 `n`이 작다.',
    '- 환각 판단의 기준은 여전히 LLM Judge다. 이 컬럼은 보조 지표다.',
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
    '- **RAG 충실도(결정론 채점기)의 premise 누락은 이번에도 고치지 않았다.** `score_rag_faithfulness.js:56`이',
    '  NLI premise에 `제공 Context`만 넣고 `사용자 정보 / API 결과`·`대화 이력`을 빼고 있어,',
    '  해당 입력을 쓰는 유형에서 구조적으로 실패한다. 절대값은 실제 근거율보다 낮다.',
    '  다만 편향이 모델에 고루 걸린다는 것을 확인해(`verify_rag_rule_ranking.js`) summary 표에는',
    '  신뢰구간과 함께 다시 실었다. 구간이 겹치지 않는 쌍끼리만 비교하고, 환각 판단의 기준은',
    '  여전히 LLM Judge다.',
    '', '## 실행 순서', '', '자세한 명령은 [../../scripts/test3/SETUP.md](../../scripts/test3/SETUP.md) 참고.',
  ];
}

function thinkDoc(cmp) {
  const targets = cmp.models.filter((m) => m.think_capable);
  const rows = targets.map((m) => {
    const on = m.test3_think, off = m.test3_nothink;
    const d = (a, b) => (a == null || b == null) ? '-' : ((b - a) >= 0 ? '+' : '') + (b - a).toFixed(1) + '%p';
    return [
      m.model_tag,
      on ? num(on.avg_eval_count) : '-', off ? num(off.avg_eval_count) : '-',
      on ? num(on.latency_avg_ms / 1000, 2, 's') : '-', off ? num(off.latency_avg_ms / 1000, 2, 's') : '-',
      on ? num(on.latency_p95_ms / 1000, 2, 's') : '-', off ? num(off.latency_p95_ms / 1000, 2, 's') : '-',
      on ? pct(on.llm_judge && on.llm_judge.correct_rate) : '-',
      off ? pct(off.llm_judge && off.llm_judge.correct_rate) : '-',
      d(on && on.llm_judge && on.llm_judge.correct_rate * 100, off && off.llm_judge && off.llm_judge.correct_rate * 100),
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
    table(['모델', 'on 토큰', 'off 토큰', 'on 평균', 'off 평균', 'on P95', 'off P95',
      'on 정확도', 'off 정확도', '정확도 변화'], rows),
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

function main() {
  const onlyArg = process.argv.indexOf('--only');
  const only = onlyArg >= 0 ? new Set(process.argv[onlyArg + 1].split(',').map((s) => s.trim())) : null;
  const wanted = (name) => !only || only.has(name);
  const cmp = readJson(COMPARISON);
  const ragCheck = readJson(RAG_CHECK);
  if (!cmp) {
    console.error(`먼저 비교 집계를 만드세요: node scripts/test3/compare_rounds.js`);
    process.exit(1);
  }
  console.log('test3 문서 생성:');
  if (wanted('summary_results.md')) write('summary_results.md', summaryDoc(cmp, ragCheck));
  if (wanted('methodology.md')) write('methodology.md', methodologyDoc(cmp));
  if (wanted('think_ablation_results.md')) write('think_ablation_results.md', thinkDoc(cmp));
  if (wanted('temperature_comparison.md')) write('temperature_comparison.md', tempDoc(cmp));
  if (wanted('vram_results.md')) write('vram_results.md', vramDoc(readJson(VRAM)));
  if (cmp.missing_rounds.length) {
    console.log(`\n[주의] 아직 안 돌린 라운드가 ${cmp.missing_rounds.length}건 있어 표에 '-'로 남습니다.`);
  }
}

main();
