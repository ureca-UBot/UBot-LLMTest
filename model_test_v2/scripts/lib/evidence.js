'use strict';
// summary/ 문서 끝에 붙이는 "근거 문서" 절.
//
// 규칙(README 4-6절): summary 폴더의 각 요약 문서는 근거가 된 report/ 세부 문서
// 링크를 반드시 포함한다. report/에 실제로 있는 run별 요약(<run_id>_summary.md)을
// 스캔해 표로 만들고, 같은 run의 LLM Judge 문항별 판정 문서가 있으면 함께 건다.
//
//   evidenceSection({ resultsDir, conds: ['t0_think'], pairedOnly: false })
//     conds      : 포함할 조건(run_id 조건 세그먼트). 조건이 없는 run_id(v2)는 conds를 비워 둔다.
//     pairedOnly : true면 conds 전부에 report가 있는 모델만 (예: 추론 ON/OFF 짝)

const fs = require('fs');
const path = require('path');

const COND_RE = /_(t0_think|t0_nothink|t08_think)_/;
const COND_LABEL = { t0_think: '본측정 (temp 0, 추론 ON)', t0_nothink: '추론 OFF', t08_think: '대조군 (temp 0.8)' };

function parseRun(file) {
  const runId = file.replace(/_summary\.md$/, '');
  const env = runId.split('_')[0];
  const cm = runId.match(COND_RE);
  const cond = cm ? cm[1] : '';
  const rest = runId.slice(env.length + 1);
  const model = cm ? rest.slice(0, rest.indexOf('_' + cond + '_')) : rest.replace(/_\d{8}.*$/, '');
  return { runId, model, cond };
}

function judgeDoc(resultsDir, run) {
  const cands = run.cond
    ? [path.join('llm_judge', run.cond, run.runId + '.md')]
    : [path.join('llm_judge', run.model + '_V2.md')];
  return cands.find((rel) => fs.existsSync(path.join(resultsDir, rel))) || null;
}

function evidenceSection({ resultsDir, conds = [], pairedOnly = false }) {
  const reportDir = path.join(resultsDir, 'report');
  if (!fs.existsSync(reportDir)) return [];
  let runs = fs.readdirSync(reportDir).filter((f) => f.endsWith('_summary.md')).map((f) => ({ file: f, ...parseRun(f) }));
  if (conds.length) runs = runs.filter((r) => conds.includes(r.cond));
  if (pairedOnly && conds.length > 1) {
    const has = (m, c) => runs.some((r) => r.model === m && r.cond === c);
    runs = runs.filter((r) => conds.every((c) => has(r.model, c)));
  }
  if (!runs.length) return [];
  runs.sort((a, b) => (conds.indexOf(a.cond) - conds.indexOf(b.cond)) || a.model.localeCompare(b.model));
  const withCond = runs.some((r) => r.cond);
  const head = ['모델', ...(withCond ? ['조건'] : []), '세부 결과 (report)', 'LLM Judge 문항별 판정'];
  const rows = runs.map((r) => {
    const j = judgeDoc(resultsDir, r);
    return [r.model, ...(withCond ? [COND_LABEL[r.cond] || r.cond] : []), `[${r.file}](../report/${r.file})`,
      j ? `[${path.basename(j)}](../${j.split(path.sep).join('/')})` : '-'];
  });
  return ['', '## 근거 문서', '',
    '이 문서의 수치와 사례는 아래 run별 세부 결과에서 나왔다.', '',
    `| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`), ''];
}

module.exports = { evidenceSection, parseRun };
