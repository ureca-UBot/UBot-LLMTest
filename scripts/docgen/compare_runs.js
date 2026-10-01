'use strict';
// try 안의 run들을 나란히 비교 -> summary/run_comparison.md · run_comparison.csv
// LLM Judge 지표(배치가 있으면)를 먼저, 결과론적 지표를 그다음에 둔다. 합산 종합 점수는
// 만들지 않는다(README 4-5절). 모델 호출 없음.
//
// Usage:
//   node scripts/docgen/compare_runs.js [--condition C] [--size N] [--runs id1,id2] [--batch <judge batch>]
//     [--test v4] [--try try1]
//   기본: 이 try의 run 중 항목 제한이 없는 run 전부(조건·규모별로 묶어 표를 나눈다).

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { listRuns, loadRunSummary } = require('../lib/run_summary');
const { itemName } = require('../lib/dataset');
const { groupBy, pct, num } = require('../lib/stats');
const { toCsv } = require('../lib/csv');

const s100 = (v) => (v === null || v === undefined ? 'N/A' : num(v * 100, 1));
// 같은 모델의 run이 여럿일 때(항목 제한 run 등) 구분되도록 선택 조건을 붙인다.
const runLabel = (r) => {
  const sel = r.run_info.selection || {};
  const extra = [sel.items && sel.items.join(','), sel.difficulty, sel.limit && `limit ${sel.limit}`].filter(Boolean);
  return r.run_info.model_tag + (extra.length ? ` [${extra.join(' · ')}]` : '');
};

function main() {
  const { opts } = parseRunArgs(argv);
  const { paths, config, repoRel, label } = profile.load();
  let runs = (opts.runs || listRuns()).map(loadRunSummary).filter((r) => r.run_info);
  if (!opts.runs) runs = runs.filter((r) => !r.run_info.selection.items && !r.run_info.selection.limit && !r.run_info.selection.difficulty);
  if (opts.condition) runs = runs.filter((r) => r.run_info.condition === opts.condition);
  if (opts.size) runs = runs.filter((r) => r.run_info.selection.size === opts.size);
  if (!runs.length) throw new Error('비교할 run이 없습니다(항목 제한 없는 run만 기본 대상).');

  // Judge 배치는 명시적으로 고른다. 배치가 하나뿐이면 그것을 쓰고, 여럿이면 --batch 없이는 멈춘다
  // (이름순 마지막이 최신이라는 보장이 없어서 엉뚱한 배치를 섞어 비교할 수 있다).
  const allBatches = [...new Set(runs.flatMap((r) => Object.keys(r.judge)))].sort();
  if (opts.batch && !allBatches.includes(opts.batch)) throw new Error(`이 run들에 없는 Judge 배치: ${opts.batch} (있는 배치: ${allBatches.join(', ') || '없음'})`);
  if (!opts.batch && allBatches.length > 1) throw new Error(`Judge 배치가 여러 개입니다. --batch로 하나를 고르세요: ${allBatches.join(', ')}`);
  const batchId = opts.batch || allBatches[0] || null;
  const judgeOf = (r) => (batchId ? r.judge[batchId] || null : null);

  const L = [];
  const csvRows = [];
  L.push(`# run 비교 — ${label}`, '');
  L.push('> 자동 생성(`scripts/docgen/compare_runs.js`) — 손으로 고치지 마세요. 전체 지표는 독립 표본(반복 항목 제외) 기준, 반복 항목은 별도 열.');
  L.push(`> 생성 ${new Date().toISOString()} · LLM Judge 배치: ${batchId || '없음'}`, '');

  const groups = groupBy(runs, (r) => `${r.run_info.condition} · ${r.run_info.context_mode} · 항목당 ${r.run_info.selection.size}건 · ${r.run_info.prompt_variant}`);
  for (const [key, rs] of groups) {
    L.push(`## ${key}`, '');
    L.push('### LLM Judge', '');
    if (rs.some(judgeOf)) {
      L.push('대표 지표(정의는 Judge 보고서 1절). 정확도는 본문만 본 판정, 과대·과소·교차는 본문 기준.', '');
      L.push('| 모델 | 정답률(답변 문장) | 정답+상태 | 정답+근거 | 정답+근거+상태 | 환각률 | 과대 | 과소 | 교차 | 근거 선택 오류 | 활용 오류 | status-본문 일치 | 근거-본문 일치 | 표현 /5 | 안전성 SAFE율 | 페르소나 준수 |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
      for (const r of rs) {
        const j = judgeOf(r); const a = j?.accuracy?.independent, h = a?.headline, c = a?.consistency;
        const x = a?.result;
        L.push(`| ${runLabel(r)} | ${pct(a?.correct_rate)} | ${pct(x?.correct_status_rate)} | ${pct(x?.correct_evidence_rate)} | ${pct(x?.correct_evidence_status_rate)} | ${pct(a?.hallucination_rate)} | ${pct(h?.over_rate)} | ${pct(h?.under_rate)} | ${pct(h?.cross_rate)} | ${pct(h?.source_wrong_rate)} | ${pct(h?.use_error_rate)} | ${pct(c?.status_body?.agree_rate)} | ${pct(c?.evidence_body?.agree_rate)} | ${num(a?.expression_avg, 2)} | ${pct(j?.safety?.safe_rate_applicable)} | ${pct(j?.persona?.adhered_rate)} |`);
      }
    } else L.push('아직 채점하지 않았다.');
    L.push('', '### 결과론적 지표 · 계측', '');
    L.push('| 모델 | 기대 상태 일치 | 부재 F1 | 근거 채택률 | 근거 정밀도 | 정답 유사도 | 키워드 | NLI 지지율* | 표현 규칙 | 포맷 | 반복 일관성 | 타임아웃 | 평균 지연 | P95 |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of rs) {
      const st = r.status?.independent, sm = r.similarity?.independent, gr = r.grounding?.independent;
      const ex = r.expression?.independent, fp = r.format?.all_rows, rp = r.repeat, ev = r.evidence?.independent;
      L.push(`| ${runLabel(r)} | ${pct(st?.status_match_rate)} | ${num(st?.abstain_detection?.f1, 3)} | ${pct(ev?.adoption_rate)} | ${pct(ev?.precision_avg)} | ${s100(sm?.similarity?.mean)} | ${pct(sm?.keyword_coverage_avg)} | ${pct(gr?.nli_support_rate_avg)} | ${num(ex?.score_avg, 1)} | ${pct(fp?.format_success_rate)} | ${pct(rp?.fact_consistency_rate)} | ${fp ? fp.timeout_count : 'N/A'} | ${fp ? num(fp.latency_ms.avg / 1000, 2) + 's' : 'N/A'} | ${fp ? num(fp.latency_ms.p95 / 1000, 2) + 's' : 'N/A'} |`);
    }
    L.push('', '\\* NLI 지지율은 참고값이다. 환각 판단은 LLM Judge 환각률을 쓴다.', '');

    L.push('### 항목별 — 기대 상태 일치 / 정답 유사도 (Judge가 있으면 내용 정확도 추가)', '');
    L.push(`| 항목 | ${rs.map(runLabel).join(' | ')} |`, `|---|${rs.map(() => '---').join('|')}|`);
    for (const code of config.items.map((i) => i.code)) {
      if (!rs.some((r) => r.status?.by_item?.[code])) continue;
      L.push(`| ${code} ${itemName(code)} | ${rs.map((r) => {
        const st = r.status?.by_item?.[code], sm = r.similarity?.by_item?.[code], ja = judgeOf(r)?.accuracy?.by_item?.[code];
        const parts = [pct(st?.status_match_rate), s100(sm?.similarity?.mean)];
        if (ja) parts.unshift(`J ${pct(ja.correct_rate)}`);
        return parts.join(' / ');
      }).join(' | ')} |`);
      for (const r of rs) {
        const st = r.status?.by_item?.[code], sm = r.similarity?.by_item?.[code], ex = r.expression?.by_item?.[code];
        const fp = r.format?.by_item?.[code], ja = judgeOf(r)?.accuracy?.by_item?.[code], ev = r.evidence?.by_item?.[code];
        csvRows.push({
          group: key, model: r.run_info.model_tag, run_id: r.run_id, item: code,
          judge_correct_rate: ja?.correct_rate ?? '', judge_hallucination_rate: ja?.hallucination_rate ?? '',
          status_match_rate: st?.status_match_rate ?? '',
          evidence_adoption_rate: ev?.adoption_rate ?? '', evidence_precision_avg: ev?.precision_avg ?? '',
          similarity_mean: sm?.similarity?.mean ?? '',
          keyword_coverage_avg: sm?.keyword_coverage_avg ?? '', expression_score_avg: ex?.score_avg ?? '',
          format_success_rate: fp?.format_success_rate ?? '', latency_avg_ms: fp?.latency_ms?.avg ?? '', latency_p95_ms: fp?.latency_ms?.p95 ?? '', timeout_count: fp?.timeout_count ?? '',
        });
      }
    }
    L.push('', '### 세부 보고서', '');
    for (const r of rs) L.push(`- [${runLabel(r)}](../report/${r.run_id}_summary.md)`);
    L.push('');
  }

  fs.mkdirSync(paths.summaryDir, { recursive: true });
  const md = path.join(paths.summaryDir, 'run_comparison.md');
  const csv = path.join(paths.summaryDir, 'run_comparison.csv');
  fs.writeFileSync(md, L.join('\n') + '\n', 'utf8');
  fs.writeFileSync(csv, '﻿' + toCsv(csvRows, Object.keys(csvRows[0] || { group: '' })), 'utf8');
  console.log(`run 비교 -> ${repoRel(md)} · ${repoRel(csv)} (${runs.length}개 run)`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
