'use strict';
// run 하나의 자동 요약 보고서 -> report/<run_id>_summary.md
// LLM Judge 결과가 있으면 먼저, 결과론적 지표는 그다음(README 4-5절 순서). 통과율 없음.
// 자동 생성 문서라 손으로 고치지 않는다(재실행 시 덮어씀).
//
// Usage: node scripts/docgen/build_run_report.js <run_id> [--test v4] [--try try1]

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { runIdArg } = require('../lib/run_data');
const { loadRunSummary } = require('../lib/run_summary');
const { itemName } = require('../lib/dataset');
const { pct, num } = require('../lib/stats');

const sim100 = (d) => (d && d.mean !== null && d.mean !== undefined ? num(d.mean * 100, 1) : 'N/A');

function main() {
  const runId = runIdArg(argv);
  const { paths, config, label } = profile.load();
  const s = loadRunSummary(runId);
  const info = s.run_info || {};
  const L = [];
  L.push(`# run 요약 — ${runId}`, '');
  L.push('> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.');
  L.push(`> 생성 ${new Date().toISOString()} · ${label}`, '');
  L.push('| 항목 | 값 |', '|---|---|');
  L.push(`| 모델 | \`${info.model_tag}\` |`);
  L.push(`| 조건 | ${info.condition} ${JSON.stringify(info.gen_params)} |`);
  L.push(`| 컨텍스트 방식 | ${info.context_mode} |`);
  L.push(`| 프롬프트 | ${info.prompt_variant} |`);
  L.push(`| 데이터 | ${info.dataset} · 항목당 ${info.selection?.size}건${info.selection?.items ? ' · 항목 ' + info.selection.items.join(',') : ''} · ${info.case_ids?.length}행 |`);
  L.push(`| 환경 | ${info.env} |`, '');

  const judgeBatches = Object.keys(s.judge);
  L.push('## 1. LLM Judge', '');
  if (!judgeBatches.length) {
    L.push('아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.', '');
  } else {
    for (const batch of judgeBatches) {
      const j = s.judge[batch];
      const a = j.accuracy?.independent;
      L.push(`### 배치 \`${batch}\``, '');
      if (a) {
        L.push('| 범위 | 채점 | 내용 정확도 | 환각률 | 근거 /5 | 표현 /5 |', '|---|---|---|---|---|---|');
        L.push(`| 독립 표본 | ${a.n_scored}/${a.n_expected} | ${pct(a.correct_rate)} | ${pct(a.hallucination_rate)} | ${num(a.grounding_score_avg, 2)} | ${num(a.expression_avg, 2)} |`);
        for (const [code, v] of Object.entries(j.accuracy.by_item || {})) {
          L.push(`| ${code} ${itemName(code)} | ${v.n_scored}/${v.n_expected} | ${pct(v.correct_rate)} | ${pct(v.hallucination_rate)} | ${num(v.grounding_score_avg, 2)} | ${num(v.expression_avg, 2)} |`);
        }
        L.push('');
      }
      if (j.safety?.n_expected) L.push(`안전성(${config.safetyItems.join(',')}): ${Object.entries(j.safety.verdict_counts || {}).map(([k, v]) => `${k} ${v}`).join(' · ')}`, '');
      if (j.persona?.n_expected) L.push(`페르소나: 준수 ${pct(j.persona.adhered_rate)} · 역할·말투 ${num(j.persona.role_tone_avg, 2)} · 사용자 맞춤 ${num(j.persona.user_fit_avg, 2)} (${j.persona.n_scored}건)`, '');
    }
  }

  L.push('## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)', '');
  const st = s.status?.independent, sm = s.similarity?.independent, gr = s.grounding?.independent;
  const ex = s.expression?.independent, fp = s.format?.all_rows;
  L.push('| 지표 | 값 |', '|---|---|');
  if (st) {
    L.push(`| 기대 상태 일치 | ${pct(st.status_match_rate)} (${st.n}행) |`);
    L.push(`| FAQ 부재 판단 P / R / F1 | ${num(st.abstain_detection.precision, 3)} / ${num(st.abstain_detection.recall, 3)} / ${num(st.abstain_detection.f1, 3)} |`);
  }
  const ev = s.evidence?.independent;
  if (ev) {
    const cc = ev.category_counts;
    L.push(`| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | ${pct(ev.adoption_rate)} · ${pct(ev.adoption_strict_rate)} · ${pct(ev.exact_rate)} (대상 ${ev.n_applicable}행) |`);
    L.push(`| 근거 인용 정밀도 · 정답 문서 재현율 | ${pct(ev.precision_avg)} · ${pct(ev.gold_recall_avg)} |`);
    L.push(`| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | ${cc.EXACT} / ${cc.WITH_EXTRA} / ${cc.PARTIAL} / ${cc.WRONG} / ${cc.NONE} |`);
    L.push(`| Context에 없는 ID 인용 비율 | ${pct(ev.invalid_citation_rate)} |`);
    L.push(`| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | ${ev.non_doc_label_rows ?? 0}건 (${pct(ev.non_doc_label_rate)}) |`);
    L.push(`| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, ${(config.evidence?.excludeItems || []).join(',') || '제외 없음'} 제외) | ${ev.answered_without_citation}건 (${pct(ev.answered_without_citation_rate)}) |`);
  }
  if (sm) L.push(`| 정답 유사도 평균(×100) · 중앙값 | ${sim100(sm.similarity)} · ${sm.similarity.median !== null ? num(sm.similarity.median * 100, 1) : 'N/A'} |`, `| 키워드 포함률 평균 | ${pct(sm.keyword_coverage_avg)} |`);
  if (gr) L.push(`| NLI 지지율 평균(참고) | ${pct(gr.nli_support_rate_avg)} (측정 ${gr.n_measured}행) |`, `| 미확인 숫자 포함 비율(참고) | ${pct(gr.unverified_number_case_rate)} |`);
  if (ex) L.push(`| 표현 규칙 점수 · 실격 비율 | ${num(ex.score_avg, 1)} · ${pct(ex.disqualified_rate)} |`);
  if (fp) L.push(`| 포맷 준수 | ${pct(fp.format_success_rate)} (생성 오류 ${fp.generation_error_count}건) |`,
    `| 키 순서 준수(${(fp.key_order_expected || []).join(' → ')}) | ${pct(fp.key_order_rate)} · ${Object.entries(fp.key_order_counts || {}).map(([k, v]) => `${k} ${v}`).join(', ')} |`, `| 타임아웃(${config.generation.timeoutMs / 1000}s 초과 = 오류) | ${fp.timeout_count}건 (${pct(fp.timeout_rate)}) |`, `| 지연 평균 / P50 / P95 (응답 받은 행) | ${num(fp.latency_ms.avg / 1000, 2)}s / ${num(fp.latency_ms.p50 / 1000, 2)}s / ${num(fp.latency_ms.p95 / 1000, 2)}s |`, `| TPS 평균 | ${num(fp.tps_avg, 1)} |`);
  if (s.repeat && s.repeat.n_groups) {
    const r = s.repeat;
    L.push(`| 반복 일관성(상태+숫자) | ${pct(r.fact_consistency_rate)} (원본 질문 ${r.n_complete_groups}개) |`);
    L.push(`| 반복: 상태 일치 / 숫자 일치 / 근거 ID 일치 | ${pct(r.status_consistency_rate)} / ${pct(r.numbers_consistency_rate)} / ${pct(r.evidence_consistency_rate)} |`);
    L.push(`| 반복: 기대 상태 비율 평균 · 일관된 오답 질문 수 | ${pct(r.expected_status_share_avg)} · ${r.consistent_but_wrong_groups} |`);
  }
  L.push('');

  L.push('## 3. 항목별 결과론적 지표', '');
  L.push('| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |', '|---|---|---|---|---|---|---|---|---|---|---|');
  for (const code of config.items.map((i) => i.code)) {
    const a = s.status?.by_item?.[code];
    if (!a) continue;
    const b = s.similarity?.by_item?.[code], c = s.grounding?.by_item?.[code];
    const d = s.expression?.by_item?.[code], e = s.format?.by_item?.[code], f = s.evidence?.by_item?.[code];
    L.push(`| ${code} ${itemName(code)} | ${a.n} | ${pct(a.status_match_rate)} | ${f && f.n_applicable ? pct(f.adoption_rate) : '대상 없음'} | ${sim100(b?.similarity)} | ${pct(b?.keyword_coverage_avg)} | ${pct(c?.nli_support_rate_avg)} | ${num(d?.score_avg, 1)} | ${pct(e?.format_success_rate)} | ${e ? num(e.latency_ms.avg / 1000, 2) + 's' : 'N/A'} | ${e ? num(e.latency_ms.p95 / 1000, 2) + 's' : 'N/A'} |`);
  }
  L.push('');

  if (st) {
    L.push('## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)', '');
    const cols = [...new Set(Object.values(st.confusion).flatMap((r) => Object.keys(r)))].sort();
    L.push(`| 기대 \\ 응답 | ${cols.join(' | ')} | 재현율 |`, `|---|${cols.map(() => '---').join('|')}|---|`);
    for (const [e, row] of Object.entries(st.confusion)) {
      L.push(`| ${e} | ${cols.map((c) => row[c] || 0).join(' | ')} | ${pct(st.recall_by_expected[e].rate)} |`);
    }
    L.push('');
  }

  L.push('## 5. 파일', '');
  L.push(`- 원본 응답: \`${profile.load().repoRel(paths.generationPath(runId))}\``);
  L.push(`- 채점 결과·통합 CSV: \`${profile.load().repoRel(paths.scoredDir(runId))}/\` (review.csv)`);

  const outPath = path.join(paths.reportDir, `${runId}_summary.md`);
  fs.mkdirSync(paths.reportDir, { recursive: true });
  fs.writeFileSync(outPath, L.join('\n') + '\n', 'utf8');
  console.log(`보고서 -> ${profile.load().repoRel(outPath)}`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
