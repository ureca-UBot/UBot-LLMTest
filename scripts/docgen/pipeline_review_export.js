'use strict';
// pipeline_test_v1 사람 검토용 답변 문서. 케이스마다 세 안(single·sub·subp)의 실제 답변·status·Judge 판정을 나란히 보여 준다.
//
//   입력: pipeline_test_v1/<try>/results/raw/<run_id>/results.jsonl, raw/scored/<run_id>/case_scores.jsonl,
//         llm_judge/<batch>/<run_id>.judgments.jsonl(여러 배치면 뒤 배치가 같은 케이스를 덮음 — 채점과 같음)
//   출력: pipeline_test_v1/<try>/results/review/index.md + <유형>.md
//
// Usage: node scripts/docgen/pipeline_review_export.js [--try try1] [--judge-batch pv1-try1,pv1-try1-store]
//          [--runs single=<run_id>,sub=<run_id>,subp=<run_id>]

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('../lib/csv');

const ROOT = path.join(__dirname, '..', '..');
const TEST_DIR = path.join(ROOT, 'pipeline_test_v1');
const DEFAULT_RUNS = {
  single: 'local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020',
  sub: 'local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020',
  subp: 'local-win_qwen3-4b-instruct_t0_pv1_subp_n390_20261021',
};
const TYPE_ORDER = ['SA', 'SB', 'UD', 'MA', 'MP', 'MN', 'OS', 'IN', 'CQ', 'MT', 'ST'];
const TYPE_NAMES = {
  SA: '단일 · FAQ로 답할 수 있음', SB: '단일 · 주제 FAQ는 있지만 묻는 값이 없음', UD: '사용자 정보',
  MA: '복합 · 모두 답할 수 있음', MP: '복합 · 답할 수 있음 + 없음', MN: '복합 · 모두 답할 수 없음',
  OS: '범위 밖', IN: '하위 질문 하나 안에 답할 수 있는 부분과 없는 부분', CQ: '모호한 질문', MT: '멀티턴', ST: '매장',
};
const OUTCOME_SHORT = {
  CORRECT_ANSWER: '정답', CORRECT_DECLINE: '올바른 보류', WRONG_ANSWER: '오답', MISSING_ANSWER: '누락', UNSUPPORTED_ANSWER: '근거 없는 답',
};

function parseArgs(argv) {
  const args = { tryName: 'try1', judgeBatches: ['pv1-try1', 'pv1-try1-store'], runs: { ...DEFAULT_RUNS } };
  for (let i = 0; i < argv.length; i++) {
    const value = () => argv[++i];
    switch (argv[i]) {
      case '--try': args.tryName = value(); break;
      case '--judge-batch': args.judgeBatches = value().split(','); break;
      case '--runs':
        args.runs = Object.fromEntries(value().split(',').map((pair) => pair.split('=')));
        break;
      default: throw new Error(`알 수 없는 인자: ${argv[i]}`);
    }
  }
  return args;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}

const quote = (text) => String(text).split(/\r?\n/).map((line) => `> ${line}`).join('\n');
const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function loadRun(resultsDir, runId, judgeBatches) {
  const results = new Map(readJsonl(path.join(resultsDir, 'raw', runId, 'results.jsonl')).map((r) => [r.id, r]));
  const scores = new Map(readJsonl(path.join(resultsDir, 'raw', 'scored', runId, 'case_scores.jsonl')).map((s) => [s.id, s]));
  const judgments = new Map();
  for (const batch of judgeBatches) {
    for (const row of readJsonl(path.join(resultsDir, 'llm_judge', batch, `${runId}.judgments.jsonl`))) {
      if (!row.error) judgments.set(row.id, row);
    }
  }
  if (!results.size || !scores.size) throw new Error(`결과 또는 채점이 없습니다: ${runId}`);
  return { runId, results, scores, judgments };
}

function passedFaqIds(trace) {
  if (!trace) return [];
  return [...new Set([...(trace.search_first?.passed_faq_ids || []), ...(trace.sub_questions || []).flatMap((s) => s.passed_faq_ids || [])])];
}

function judgeLabel(score) {
  if (!score.judge) return '—';
  return score.judge.accuracy === 'CORRECT' ? '정답' : '오답';
}

function renderCase(caseResult, runs, faqs) {
  const lines = [];
  const expected = caseResult.expected;
  lines.push(`### ${caseResult.id}`);
  lines.push('');
  lines.push(quote(caseResult.question));
  lines.push('');
  if (caseResult.location) lines.push(`- 위치: ${JSON.stringify(caseResult.location)}`);
  lines.push(`- 기대 최종 status: ${expected.final_status}${expected.final_status_strict !== expected.final_status ? ` (엄격 ${expected.final_status_strict})` : ''}`
    + `${expected.path === 'ANY' ? ' · 검색 단계 보류도 정답' : ''}`);
  for (const sub of expected.sub_questions) {
    const partial = sub.status !== sub.status_strict ? ' · 부분 답변' : '';
    const gold = sub.gold_faq_ids.map((id) => `${id}(${faqs.get(String(id))?.question ?? '?'})`).join(', ') || '없음';
    lines.push(`  - 하위 ${sub.index} 「${sub.user_text}」 → ${sub.status}${partial} · 근거 FAQ ${gold}`);
  }
  if (caseResult.note) lines.push(`- 메모: ${caseResult.note}`);
  lines.push('');

  lines.push('| 안 | 경로 | 최종 status | 하위 statuses | status 일치 | Judge | 하위 판정 | 환각 | 누출 | 통과 | 실패 원인 |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const [mode, run] of runs) {
    const s = run.scores.get(caseResult.id);
    const statuses = s.sub_status ? `${(s.sub_status.statuses || []).join(' · ') || '(빈 배열)'}${s.sub_status.valid === false ? ' ⚠잘못됨' : ''}` : '—';
    const outcomes = s.judge ? s.judge.sub_outcomes.map((o) => OUTCOME_SHORT[o] || o).join(' · ') : '—';
    const leak = s.leak ? (s.leak.any ? `있음${s.leak.ask_back ? '(되묻기)' : ''}` : '없음') : '—';
    lines.push(`| ${mode} | ${s.path} | ${s.final_actual ?? '—'} | ${cell(statuses)} | ${s.status_match ? 'O' : 'X'} | ${judgeLabel(s)} | ${cell(outcomes)} `
      + `| ${s.judge ? (s.judge.is_grounded ? '없음' : `있음(${s.judge.grounding_score})`) : '—'} | ${leak} | ${s.passed ? 'O' : 'X'} | ${s.failure_cause ?? ''} |`);
  }
  lines.push('');

  for (const [mode, run] of runs) {
    const r = run.results.get(caseResult.id);
    const s = run.scores.get(caseResult.id);
    const j = run.judgments.get(caseResult.id);
    const llm = r.trace?.answer_llm;
    lines.push(`**${mode}**`);
    lines.push('');
    const turns = r.response?.turns || [];
    turns.forEach((turn, i) => {
      lines.push(`- 이전 턴 ${i + 1}: 「${turn.question}」`);
      lines.push(quote(turn.answer ?? `(답변 실패: ${turn.error_code ?? '알 수 없음'})`).replace(/^/gm, '  '));
    });
    const finalAnswer = r.response?.final?.answer;
    if (!llm) {
      lines.push(`- 답변 LLM까지 가지 않음: ${r.response?.final?.error_code ?? s.path}${finalAnswer ? '' : ' (답변 없음)'}`);
      if (finalAnswer) lines.push(quote(finalAnswer));
    } else {
      const notice = llm.code_notice;
      if (notice) {
        lines.push('- 모델 본문:');
        lines.push(llm.answer && llm.answer.trim() ? quote(llm.answer) : '> (빈 문자열)');
        lines.push(`- 코드 안내: ${notice}`);
      } else {
        lines.push('- 답변:');
        lines.push(llm.answer && llm.answer.trim() ? quote(llm.answer) : '> (빈 문자열)');
        if (!finalAnswer) lines.push(`- 사용자에게 나간 답변 없음: ${r.response?.final?.error_code ?? ''}`);
      }
    }
    const passed = passedFaqIds(r.trace);
    const tools = (r.trace?.store_tool_calls || []).map((c) => `매장 도구(place=${c.place ?? '없음'})`);
    lines.push(`- 통과 FAQ: ${passed.join(', ') || '없음'}${tools.length ? ` · ${tools.join(', ')}` : ''}`
      + `${llm?.evidence_ids?.length ? ` · 모델 evidence ${llm.evidence_ids.join(', ')}` : ''}`);
    if (s.leak?.any) lines.push(`- 누출 문장: ${[...s.leak.notice_sentences, ...s.leak.ask_sentences].join(' / ')}`);
    if (j) {
      for (const sub of j.sub_results) lines.push(`- Judge 하위 ${sub.index} ${OUTCOME_SHORT[sub.outcome] || sub.outcome}: ${sub.note}`);
      if (j.hallucinated_claims?.length) {
        lines.push(`- 환각: ${j.hallucinated_claims.map((c) => `[${c.type}] ${c.claim}`).join(' / ')}`);
      }
    }
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const resultsDir = path.join(TEST_DIR, args.tryName, 'results');
  const faqs = new Map(parseCsvObjects(fs.readFileSync(path.join(TEST_DIR, 'cases', 'faq_snapshot.csv'), 'utf8'))
    .map((row) => [String(row.faqId), row]));
  const runs = Object.entries(args.runs).map(([mode, runId]) => [mode, loadRun(resultsDir, runId, args.judgeBatches)]);
  const base = runs[0][1];
  const outDir = path.join(resultsDir, 'review');
  fs.mkdirSync(outDir, { recursive: true });

  const byType = new Map();
  for (const result of base.results.values()) {
    if (!byType.has(result.type)) byType.set(result.type, []);
    byType.get(result.type).push(result);
  }
  const types = [...TYPE_ORDER.filter((t) => byType.has(t)), ...[...byType.keys()].filter((t) => !TYPE_ORDER.includes(t))];

  const header = (title) => [
    `# ${title}`,
    '',
    `생성: ${new Date().toISOString()} · \`scripts/docgen/pipeline_review_export.js\` · Judge 배치 ${args.judgeBatches.map((b) => `\`${b}\``).join(' → ')}(뒤 배치가 덮음)`,
    '',
    ...runs.map(([mode, run]) => `- ${mode}: \`${run.runId}\``),
    '',
  ];
  const index = header('pipeline_test_v1 답변 검토 — 유형별');
  index.push('표: Judge 정답 / 판정 수 · 통과 / 케이스 수. 각 유형 문서는 케이스마다 기대값, 세 안 요약 표, 실제 답변(sub·subp는 모델 본문과 코드 안내를 나눠 표시), Judge 하위 판정을 보여 준다.');
  index.push('');
  index.push(`| 유형 | 내용 | 케이스 | ${runs.map(([m]) => `${m} 정답`).join(' | ')} | ${runs.map(([m]) => `${m} 통과`).join(' | ')} | 문서 |`);
  index.push(`|---|---|---|${runs.map(() => '---').join('|')}|${runs.map(() => '---').join('|')}|---|`);

  for (const type of types) {
    const cases = byType.get(type).sort((a, b) => a.id.localeCompare(b.id));
    const stats = runs.map(([, run]) => {
      const scores = cases.map((c) => run.scores.get(c.id));
      const judged = scores.filter((s) => s.judge);
      return { correct: judged.filter((s) => s.judge.accuracy === 'CORRECT').length, judged: judged.length,
        passed: scores.filter((s) => s.passed).length };
    });
    const doc = header(`${type} — ${TYPE_NAMES[type] ?? type} (${cases.length}건)`);
    doc.push(`| ${runs.map(([m]) => m).join(' | ')} |`);
    doc.push(`|${runs.map(() => '---').join('|')}|`);
    doc.push(`| ${stats.map((s) => `정답 ${s.correct}/${s.judged} · 통과 ${s.passed}/${cases.length}`).join(' | ')} |`);
    doc.push('');
    doc.push('케이스: ' + cases.map((c) => `[${c.id}](#${c.id.toLowerCase()})`).join(' · '));
    doc.push('');
    for (const c of cases) doc.push(renderCase(c, runs, faqs));
    fs.writeFileSync(path.join(outDir, `${type}.md`), doc.join('\n'));
    index.push(`| ${type} | ${TYPE_NAMES[type] ?? ''} | ${cases.length} | ${stats.map((s) => `${s.correct}/${s.judged}`).join(' | ')} `
      + `| ${stats.map((s) => s.passed).join(' | ')} | [${type}.md](${type}.md) |`);
  }
  fs.writeFileSync(path.join(outDir, 'index.md'), index.join('\n') + '\n');
  console.log(`검토 문서 ${types.length}개 → ${path.relative(ROOT, outDir)}`);
}

if (require.main === module) main();
