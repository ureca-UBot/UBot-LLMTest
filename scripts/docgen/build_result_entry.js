'use strict';
// result.html 데이터셋 항목 생성: 한 try의 LLM Judge 배치 + run별 채점 요약 -> <script id="datasets"> 항목 하나.
// 수치는 저장된 원본(llm_judge/<batch>_metrics.json, raw/scored/<run_id>/*_summary.json)에서만 가져온다.
// 모델·Judge 재호출 없음.
//
// 지표 키는 모두 v4_ 접두사를 쓴다(README 4-7절 "정의가 같은 지표만 같은 키"). v4는 데이터셋(test_set4)과
// 정확도 정의(답변 문장만 판정)가 v1~v3와 달라, 같은 키를 쓰면 의미 없는 차이(Δ)가 표시된다. 같은 공통 엔진을
// 쓰는 v4의 다른 try끼리는 키가 같아 차이가 정상으로 나온다. 응답 시간(latency·p95)만 버전 간 공통이다.
//
// Usage: node scripts/docgen/build_result_entry.js --batch <id> [--write] [--test v4] [--try try1]
//   --write 없으면 항목 JSON을 출력만 한다. --write면 result.html에서 같은 id 항목을 바꾸거나(없으면 끝에 추가)
//   JSON.parse로 다시 검증한다.

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { itemOrder, itemName } = require('../lib/dataset');

// 실행 환경 표시. 이 프로젝트에서 쓴 하드웨어 기준(README 3절).
const ENV_LABEL = { 'ec2-linux': 'EC2 · Tesla T4', 'local-win': '로컬 Windows · RTX 4070 Ti' };
// 항목이 확인하려는 것(문항 구성 표). v3 result.html의 설명을 잇고 v4에서 늘어난 항목을 더했다.
const PURPOSE = {
  NC: '비슷한 FAQ들 사이에서 실제로 관련된 것만 골라내는지',
  MC: '여러 FAQ를 결합해야 나오는 답',
  UI: '사용자 정보/API 조회 결과와 FAQ를 결합',
  CE: '조건문·예외 규칙·경계값 계산',
  PI: '일부만 답 가능하고 나머지는 확인 불가한 상황',
  SR: '비슷해 보이지만 실제로는 답이 없는 FAQ만 주어짐',
  HR: '질문과 무관한 FAQ만 주어짐',
  EC: '컨텍스트가 비어 있음',
  CF: 'FAQ끼리 충돌하거나 시행일로 가려야 하는 경우',
  MT: '이전 대화 맥락을 이어받아 답하기',
  AD: '공격적 입력, 상담 범위 밖 요청',
  AR: 'API 조회 결과만으로 답해야 하는 경우',
  PS: '페르소나 지시(역할·말투 유지, 사용자 맞춤 설명)를 지키며 답하기',
  RT: '같은 질문을 10회 반복했을 때 답이 흔들리는지',
};
const PALETTE = { v4: '#c2410c', v5: '#4d7c0f', v6: '#1d4ed8' };

const pct = (x) => (x == null ? null : Math.round(x * 100000) / 1000);
const num = (x, d = 3) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);
const int = (n) => n.toLocaleString('en-US');

function modelView(tag, genParams, config) {
  const entry = config.models.find((m) => m.tag === tag) || {};
  const off = entry.thinkCapable && genParams.think === false;
  const [family, size] = tag.split(':');
  const fam = { qwen3: 'Qwen3', gemma3: 'Gemma3', 'exaone3.5': 'EXAONE 3.5' }[family] || family;
  return { tag: off ? `${tag} OFF` : tag, label: `${fam} ${size.toUpperCase()}${off ? ' (추론 OFF)' : ''}` };
}

function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch) throw new Error('--batch <id>가 필요합니다.');
  const { config, paths, repoRel, tryTag, versionDirName } = profile.load();
  const rel = (p) => repoRel(p);
  const batch = JSON.parse(fs.readFileSync(paths.batchManifestPath(opts.batch), 'utf8'));
  const metrics = JSON.parse(fs.readFileSync(path.join(paths.llmJudgeDir, `${opts.batch}_metrics.json`), 'utf8'));
  const summary = (runId, name) => JSON.parse(fs.readFileSync(path.join(paths.scoredDir(runId), `${name}_summary.json`), 'utf8'));
  const order = itemOrder();
  const sizeN = batch.size;

  const runs = batch.runs.map((r) => {
    const info = JSON.parse(fs.readFileSync(paths.runInfoPath(r.run_id), 'utf8'));
    const m = metrics.runs.find((x) => x.run_id === r.run_id);
    return {
      run: r, info, m, view: modelView(r.model, info.gen_params, config),
      status: summary(r.run_id, 'status'), evidence: summary(r.run_id, 'evidence'),
      sim: summary(r.run_id, 'answer_similarity'), rag: summary(r.run_id, 'rag_grounding'),
      expr: summary(r.run_id, 'expression_rules'), perf: summary(r.run_id, 'format_performance'),
      rep: summary(r.run_id, 'repeat_consistency'),
    };
  });
  const env = runs[0].info.env;

  const METRICS = [
    ['v4_judge_acc', 'LLM Judge 정답률 (답변 문장)', '%', 100, 1, 'judge', 'Judge가 상담봇 답변 문장만 보고 CORRECT로 판정한 비율입니다(status·evidence_ids는 Judge에 주지 않음). 분모는 채점된 독립 표본(RT 제외). v3 내용 정확도(상태 적절성 포함)와 정의가 다릅니다.'],
    ['v4_acc_status', '정답 + 상태', '%', 100, 1, 'judge', '정답이면서 상담봇이 출력한 status가 기대 상태와 같은 비율입니다.'],
    ['v4_acc_evidence', '정답 + 근거', '%', 100, 1, 'judge', '정답이면서 evidence_ids가 정답 근거 문서만 인용한 비율입니다. 분모는 근거 판정 대상 행입니다.'],
    ['v4_acc_ev_status', '정답 + 근거 + 상태', '%', 100, 1, 'judge', '정답·근거·상태를 모두 맞춘 비율입니다. 분모는 근거 판정 대상 행입니다.'],
    ['v4_hallu', 'LLM Judge 환각률', '%', 100, 1, 'judge', '근거 점수 1~3점(입력으로 뒷받침되지 않는 실질적 주장이 있음)인 답변 비율입니다.', true],
    ['v4_grounding', 'LLM Judge 근거 점수', '점', 5, 2, 'judge', '답변이 입력 자료에 근거한 정도(1~5) 평균입니다.'],
    ['v4_source_wrong', '근거 선택 오류', '%', 100, 1, 'judge', '본문이 실제로 쓴 출처(Judge content_sources)가 정답 문서 밖인 비율(근거 판정 대상 행)입니다.', true],
    ['v4_no_cite', '답했는데 근거 미기재', '%', 100, 1, 'judge', '본문이 답·부분 답·충돌 고지를 했는데 evidence_ids가 빈 비율입니다.', true],
    ['v4_status_body', 'status-본문 일치', '%', 100, 1, 'judge', '출력 status와 Judge가 본 본문 행동(content_stance)이 같은 비율입니다.'],
    ['v4_cite_body', '근거-본문 일치', '%', 100, 1, 'judge', '본문에 쓴 문서를 evidence_ids에 모두 인용한 비율입니다(추가 인용 허용).'],
    ['v4_safe', '안전성 SAFE 비율', '%', 100, 1, 'judge', 'AD 항목 중 해당(NOT_APPLICABLE 제외) 판정에서 SAFE 비율입니다. OVER_REFUSAL은 SAFE가 아닙니다.'],
    ['v4_persona', '페르소나 준수율', '%', 100, 1, 'judge', '페르소나 지시가 있는 PS 문항에서 Judge가 ADHERED로 판정한 비율입니다.'],
    ['v4_status', '기대 상태 일치율', '%', 100, 1, 'det', '출력 status가 기대 상태와 같은 비율입니다(독립 표본).'],
    ['v4_f1', 'FAQ 부재 판단 F1', '', 1, 3, 'det', '기대 ABSTAIN을 ABSTAIN으로 판단하는 능력의 F1입니다.'],
    ['v4_adoption', '근거 채택률', '%', 100, 1, 'det', 'evidence_ids가 하나 이상이고 모두 정답 근거 문서인 비율입니다(근거 판정 대상 행, AR 제외).'],
    ['v4_precision', '근거 인용 정밀도', '%', 100, 1, 'det', '인용한 문서 중 정답 근거 문서의 비율 평균입니다.'],
    ['v4_similarity', '정답 예시와의 유사도', '점', 100, 1, 'det', 'BGE-M3 임베딩 코사인 유사도 평균(×100)입니다. 통과/실패 기준은 없습니다.'],
    ['v4_keyword', '키워드 포함률', '%', 100, 1, 'det', '필수 사실의 토큰이 답변에 그대로 들어 있는 비율 평균입니다(참고값).'],
    ['v4_nli', 'NLI 근거 지지율 (참고)', '%', 100, 1, 'det', '답변 문장이 입력 블록에 함의되는 비율(KLUE-NLI)입니다. 환각 판단은 Judge 환각률을 씁니다.'],
    ['v4_expr_rule', '규칙 기반 표현 점수', '점', 100, 1, 'det', '표현 규칙(반복·비한국어·마크다운·길이·띄어쓰기) 감점 후 점수 평균입니다.'],
    ['v4_format', '포맷 성공률', '%', 100, 1, 'det', 'JSON 출력 계약을 지킨 비율입니다. 구조화 출력으로 강제되어 사실상 생성 실패만 잡힙니다.'],
    ['v4_repeat', '반복 일관성 (10회 상태+숫자)', '%', 100, 1, 'det', 'RT 원본 질문 20개 중 10회 모두 status·숫자가 같은 비율입니다(정답률 아님).'],
    ['v4_vram_used', 'GPU 메모리 사용량 (nvidia-smi)', 'GB', 'auto', 1, 'measure', '생성 중 nvidia-smi memory.used 평균입니다. GPU 전체 사용량이라 v3의 Ollama size_vram과 정의가 다릅니다.', true],
    ['v4_tps', '생성 속도 (TPS)', 'tok/s', 'auto', 1, 'measure', '출력 토큰/초 평균입니다.'],
  ].map(([key, name, unit, max, digits, group, note, lower]) => ({ key, name, unit, max, digits, group, note, ...(lower ? { lower: true } : {}) }));

  const models = runs.map((x, i) => {
    const acc = x.m.accuracy.independent, res = acc.result, cons = acc.consistency;
    const st = x.status.independent, ev = x.evidence.independent, perf = x.perf.all_rows; // 계측은 run 보고서처럼 전체 행
    const nTotal = Object.values(x.m.safety.verdict_counts).reduce((a, b) => a + b, 0);
    const naSafety = x.m.safety.verdict_counts.NOT_APPLICABLE || 0;
    const hall = Math.round(acc.hallucination_rate * acc.n_scored);
    return {
      tag: x.view.tag, label: x.view.label, idx: i + 1,
      latency: num(perf.latency_ms.avg / 1000), p95: num(perf.latency_ms.p95 / 1000),
      vals: {
        v4_judge_acc: pct(acc.correct_rate), v4_acc_status: pct(res.correct_status_rate),
        v4_acc_evidence: pct(res.correct_evidence_rate), v4_acc_ev_status: pct(res.correct_evidence_status_rate),
        v4_hallu: pct(acc.hallucination_rate), v4_grounding: num(acc.grounding_score_avg, 2),
        v4_source_wrong: pct(acc.headline.source_wrong_rate), v4_no_cite: pct(acc.body_answered_without_citation_rate),
        v4_status_body: pct(cons.status_body.agree_rate), v4_cite_body: pct(cons.evidence_body.agree_rate),
        v4_safe: pct(x.m.safety.safe_rate_applicable), v4_persona: pct(x.m.persona.adhered_rate),
        v4_status: pct(st.status_match_rate), v4_f1: num(st.abstain_detection.f1),
        v4_adoption: pct(ev.adoption_rate), v4_precision: pct(ev.precision_avg),
        v4_similarity: num(x.sim.independent.similarity.mean * 100, 1), v4_keyword: pct(x.sim.independent.keyword_coverage_avg),
        v4_nli: pct(x.rag.independent.nli_support_rate_avg), v4_expr_rule: num(x.expr.independent.score_avg, 1),
        v4_format: pct(perf.format_success_rate), v4_repeat: pct(x.rep.fact_consistency_rate),
        v4_vram_used: perf.vram_mib?.avg ? num(perf.vram_mib.avg / 1024, 2) : null, v4_tps: num(perf.tps_avg, 1),
      },
      subs: {
        v4_judge_acc: `${int(acc.verdict_counts.CORRECT)}/${int(acc.n_scored)}건 CORRECT`,
        v4_acc_evidence: `근거 대상 ${int(res.n_evidence_applicable)}행`,
        v4_acc_ev_status: `근거 대상 ${int(res.n_evidence_applicable)}행`,
        v4_hallu: `환각 ${int(hall)}/${int(acc.n_scored)}건`,
        v4_safe: `SAFE ${x.m.safety.verdict_counts.SAFE} · UNSAFE ${x.m.safety.verdict_counts.UNSAFE} · OVER ${x.m.safety.verdict_counts.OVER_REFUSAL} / ${nTotal - naSafety}`,
        v4_persona: `${Math.round(x.m.persona.adhered_rate * x.m.persona.n_scored)}/${x.m.persona.n_scored}건`,
        v4_status: `${Math.round(st.status_match_rate * st.n)}/${int(st.n)}건 일치`,
        v4_adoption: `대상 ${int(ev.n_applicable)}행`,
        v4_nli: `측정 ${int(x.rag.independent.n_measured)}행`,
        v4_repeat: `${Math.round(x.rep.fact_consistency_rate * x.rep.n_groups)}/${x.rep.n_groups}문항`,
      },
    };
  });

  // 항목별(14개 항목 × 지표) — 세트 id를 v4_types로 둬 v3의 13개 항목 세트와 섞이지 않게 한다.
  const rows = order.map((code) => ({ key: code, label: `${code} ${itemName(code)}`, n: sizeN }));
  const itemData = {};
  const put = (key, fn) => {
    itemData[key] = {};
    for (const x of runs) {
      itemData[key][x.view.tag] = {};
      for (const code of order) { const t = fn(x, code); if (t) itemData[key][x.view.tag][code] = t; }
    }
  };
  const byItem = (x, code) => x.m.accuracy.by_item[code];
  put('v4_judge_acc', (x, c) => { const a = byItem(x, c); return a && { v: pct(a.correct_rate), sub: `${a.verdict_counts.CORRECT}/${a.n_scored}` }; });
  put('v4_hallu', (x, c) => { const a = byItem(x, c); return a && { v: pct(a.hallucination_rate), sub: `${Math.round(a.hallucination_rate * a.n_scored)}/${a.n_scored}` }; });
  put('v4_grounding', (x, c) => { const a = byItem(x, c); return a && { v: num(a.grounding_score_avg, 2) }; });
  put('v4_acc_status', (x, c) => { const a = byItem(x, c); return a && { v: pct(a.result.correct_status_rate) }; });
  put('v4_acc_ev_status', (x, c) => { const a = byItem(x, c); return a?.result.n_evidence_applicable ? { v: pct(a.result.correct_evidence_status_rate), sub: `대상 ${a.result.n_evidence_applicable}` } : null; });
  put('v4_status', (x, c) => { const s = x.status.by_item[c]; return s && { v: pct(s.status_match_rate), sub: `${Math.round(s.status_match_rate * s.n)}/${s.n}` }; });
  put('v4_adoption', (x, c) => { const e = x.evidence.by_item[c]; return e?.n_applicable ? { v: pct(e.adoption_rate), sub: `대상 ${e.n_applicable}` } : null; });
  put('v4_similarity', (x, c) => { const s = x.sim.by_item[c]; return s && { v: num(s.similarity.mean * 100, 1) }; });
  put('v4_keyword', (x, c) => { const s = x.sim.by_item[c]; return s && { v: pct(s.keyword_coverage_avg) }; });
  put('v4_nli', (x, c) => { const r = x.rag.by_item[c]; return r?.n_measured ? { v: pct(r.nli_support_rate_avg), sub: `측정 ${r.n_measured}` } : null; });
  put('v4_expr_rule', (x, c) => { const e = x.expr.by_item[c]; return e && { v: num(e.score_avg, 1) }; });
  put('latency', (x, c) => { const p = x.perf.by_item[c]; return p && { v: num(p.latency_ms.avg / 1000, 2) }; });
  put('v4_p95', (x, c) => { const p = x.perf.by_item[c]; return p && { v: num(p.latency_ms.p95 / 1000, 2) }; });

  const itemMetrics = [
    { key: 'latency', name: '평균 응답 시간', unit: '초', max: 'auto', digits: 2, group: 'measure', note: '항목별 평균 응답 시간입니다.', lower: true },
    { key: 'v4_p95', name: '응답 시간 P95', unit: '초', max: 'auto', digits: 2, group: 'measure', note: '항목별 응답 시간 95백분위입니다.', lower: true },
  ];

  const repData = {};
  for (const x of runs) {
    const n = x.rep.n_groups;
    const cell = (rate) => ({ pct: pct(rate), count: Math.round(rate * n) });
    repData[x.view.tag] = {
      v4_rep_overall: cell(x.rep.fact_consistency_rate), v4_rep_status: cell(x.rep.status_consistency_rate),
      v4_rep_numbers: cell(x.rep.numbers_consistency_rate), v4_rep_evidence: cell(x.rep.evidence_consistency_rate),
    };
  }
  const nGroups = runs[0].rep.n_groups;
  const repeatTotal = Math.max(...runs.map((x) => x.m.accuracy.by_item[config.repeatItem]?.n_expected || 0)) / nGroups;

  const totalRows = runs.reduce((s, x) => s + x.info.case_ids.length, 0);
  const judgeOk = runs.reduce((s, x) => s + x.m.accuracy.independent.n_scored + (x.m.accuracy.by_item[config.repeatItem]?.n_scored || 0) + x.m.safety.n_scored + x.m.persona.n_scored, 0);
  const judgePlanned = runs.reduce((s, x) => s + x.m.accuracy.independent.n_expected + (x.m.accuracy.by_item[config.repeatItem]?.n_expected || 0) + x.m.safety.n_expected + x.m.persona.n_expected, 0);
  const resultsRel = rel(paths.resultsDir);
  const date = runs[0].info.created_at ? runs[0].info.created_at.slice(0, 10) : '';
  const id = `${config.version}-${tryTag}`;
  const short = `${config.version} ${tryTag}`;
  const judgeLabel = `${metrics.judge.model} · ${metrics.rubric_version}`;
  const modelNames = models.map((m) => m.label).join(' · ');
  const allSummary = `${resultsRel}/all_summary.md`;
  const link = (label, file) => ({ label, href: `${resultsRel}/${file}` });
  const exists = (file) => fs.existsSync(path.join(paths.resultsDir, file));
  const links = [
    link('all_summary.md', 'all_summary.md'),
    ...(exists('summary/brief_report.md') ? [link('기준선 평가 요약', 'summary/brief_report.md')] : []),
    link('run 비교', 'summary/run_comparison.md'),
    link('LLM Judge 보고서', `llm_judge/${opts.batch}_report.md`),
    ...(exists(`llm_judge/review/${opts.batch}/index.md`) ? [link('Judge 검토 문서(모델 × 항목)', `llm_judge/review/${opts.batch}/index.md`)] : []),
    { label: 'SETUP', href: `${versionDirName}/SETUP.md` },
  ];

  const entry = {
    id, short, color: PALETTE[config.version] || '#c2410c',
    env: ENV_LABEL[env] || env, judge: judgeLabel,
    cond: `${config.defaultCondition.replace('t0_', 'temp 0 · ').replace('nothink', '추론 OFF')} · ${config.contextMode === 'fixed' ? 'Context 고정' : config.contextMode}`,
    label: `${config.version} · ${tryTag} — test4 · ${date} · ${ENV_LABEL[env] || env} · ${models.length}개 모델`,
    pill: `${short} · ${date.replace(/-/g, '.')} 실행`,
    title: `${config.version} · ${tryTag} — 저급 모델 튜닝 기준선 (${config.dataset.name})`,
    sub: `${config.items.length}개 항목 × ${sizeN}건 = 모델당 ${int(runs[0].info.case_ids.length)}건 · ${modelNames} · temperature 0 · Context 고정 · LLM Judge 전수(${metrics.judge.model} ${metrics.judge.reasoning_effort}). 데이터셋·정확도 정의가 v3와 달라 지표는 v4 안에서만 비교합니다.`,
    provenance: [
      `<code>${versionDirName}/${tryTag}</code>`, ENV_LABEL[env] || env,
      ...(exists('summary/brief_report.md') ? [`<a href="${resultsRel}/summary/brief_report.md">기준선 평가 요약</a>`] : []),
      `<a href="${allSummary}">all_summary.md</a>`,
    ],
    cards: [
      { label: '비교 모델', value: String(models.length), unit: '개', sub: modelNames },
      { label: '테스트 문항', value: int(runs[0].info.case_ids.length), unit: '건', sub: `${config.items.length}개 항목 × ${sizeN} (RT ${nGroups}문항 × ${repeatTotal}회 포함)` },
      { label: '전체 응답', value: int(totalRows), unit: '회', sub: `생성 오류 ${runs.reduce((s, x) => s + x.perf.all_rows.generation_error_count, 0)}건` },
      { label: 'LLM Judge', value: int(judgeOk), unit: `/ ${int(judgePlanned)}`, sub: `정확도·안전성(AD)·페르소나(PS) 판정 성공` },
    ],
    models,
    metrics: METRICS,
    speedNote: `${ENV_LABEL[env] || env} 순차 요청 기준 평균·P95입니다(RT 포함 전체 응답, 60초 초과 = 오류). 프롬프트·데이터셋이 v3와 달라 응답 시간 차이에는 입력 길이 차이도 섞여 있습니다.`,
    repeat: {
      note: `RT 항목: 원본 질문 ${nGroups}개를 각각 ${repeatTotal}회 반복했습니다(temperature 0). <strong>일관성 ≠ 정답률</strong> — 10회 모두 같게 틀린 질문도 일관성에 포함됩니다.`,
      ministats: [[`${nGroups}문항`, '반복 대상 / 모델'], [`${repeatTotal}회`, '동일 입력 반복'], ['temp 0', '추론 OFF']],
      metrics: { v4_rep_overall: `${repeatTotal}회 완전 일치 (상태 + 숫자)`, v4_rep_status: 'status 일치', v4_rep_numbers: '숫자 일치', v4_rep_evidence: '근거 ID 일치' },
      den: { v4_rep_overall: nGroups, v4_rep_status: nGroups, v4_rep_numbers: nGroups, v4_rep_evidence: nGroups },
      unit: { v4_rep_overall: '문항', v4_rep_status: '문항', v4_rep_numbers: '문항', v4_rep_evidence: '문항' },
      data: repData,
      footer: `일관된 오답 질문 수: ${runs.map((x) => `${x.view.label} ${x.rep.consistent_but_wrong_groups}`).join(' · ')}`,
    },
    itemMetrics,
    itemSets: [{ id: 'v4_types', name: `${config.items.length}개 항목 (${config.dataset.name})`, rowHead: '항목', rows, data: itemData }],
    types: order.map((code) => ({
      code, label: itemName(code), unique_n: code === config.repeatItem ? nGroups : sizeN, runs: sizeN, purpose: PURPOSE[code] || '',
    })),
    links,
    notes: [
      ['Judge', `${metrics.judge.provider} · ${metrics.judge.model} / reasoning ${metrics.judge.reasoning_effort} · 루브릭 ${metrics.rubric_version}. 정확도는 답변 문장만 보고 판정합니다.`],
      ['분모', runs.map((x) => `${x.view.label} 정확도 ${int(x.m.accuracy.independent.n_scored)}/${int(x.m.accuracy.independent.n_expected)}`).join(', ') + ' (독립 표본 = RT 제외). 미채점은 오답으로 세지 않았습니다.'],
      ['비교', 'v3까지와 데이터셋(test_set2 → test_set4)·정확도 정의가 달라 지표 키를 따로 둡니다. 다른 테스트와 함께 고르면 응답 시간만 차이가 계산됩니다.'],
      ['재집계', `저장된 raw/scored와 llm_judge/${opts.batch}_metrics.json에서 집계했습니다(scripts/docgen/build_result_entry.js). 모델·Judge 재호출 없음.`],
    ],
  };

  if (!opts.write) { console.log(JSON.stringify(entry, null, 2)); return; }
  const htmlPath = path.join(paths.root, 'result.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const re = /(<script id="datasets" type="application\/json">)([\s\S]*?)(<\/script>)/;
  const m = html.match(re);
  if (!m) throw new Error('result.html에서 datasets 스크립트를 찾지 못했습니다.');
  const list = JSON.parse(m[2]);
  const at = list.findIndex((d) => d.id === id);
  if (at >= 0) list[at] = entry; else list.push(entry);
  // 기존 파일과 같은 형식: 한 줄 JSON, "<"는 <로 이스케이프해 </script> 조기 종료를 막는다.
  const json = JSON.stringify(list).replace(/</g, '\\u003c');
  const out = html.replace(re, (_, a, __, c) => a + json + c);
  JSON.parse(out.match(re)[2]);
  fs.writeFileSync(htmlPath, out, 'utf8');
  console.log(`result.html ${at >= 0 ? '갱신' : '추가'}: ${id} (데이터셋 ${list.length}개)`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
