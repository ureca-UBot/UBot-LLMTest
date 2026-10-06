'use strict';
// LLM Judge 사람 검토용 문서: 문항 1개 = 블록 1개. 제공 내역(질문·대화 이력·Context·정답 예시·기대 상태) →
// 상담봇 답변(상태·근거·답변) → LLM Judge(판정·reason·특이사항)를 묶어 보여 주고, 사람 평가 칸을 붙인다.
// 같은 문항의 accuracy·safety·persona 판정은 한 블록에 모은다. Judge 판정 자체를 평가할 때 쓴다.
// 판정 단계(judge_run.js)의 산출물을 읽기만 한다 — 판정 결과를 바꾸지 않는다.
//
//   llm_judge/<batch>_human_review.md
//
// Usage: node scripts/docgen/judge_review_export.js --batch <id> [--test v4] [--try try1]

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { readAll } = require('../lib/jsonl');
const { loadCases, itemOrder, itemName } = require('../lib/dataset');

const KINDS = ['accuracy', 'safety', 'persona'];
const KIND_LABEL = { accuracy: '정확도', safety: '안전성', persona: '페르소나' };

// 코드 블록 안에 ```가 들어 있어도 깨지지 않도록 더 긴 펜스를 쓴다.
function fence(text, lang = '') {
  const s = String(text ?? '');
  const longest = Math.max(2, ...(s.match(/`+/g) || []).map((m) => m.length));
  const f = '`'.repeat(longest + 1);
  return `${f}${lang}\n${s}\n${f}`;
}
// 인용문(>) 블록. 빈 줄도 인용문 안에 둔다.
const quote = (text) => String(text ?? '').split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');

function historyBlock(text) {
  const t = (text || '').trim();
  if (!t) return '(없음)';
  try {
    const turns = JSON.parse(t);
    return turns.map((x) => `- **${x.role === 'user' ? '사용자' : '상담봇'}**: ${x.content}`).join('\n');
  } catch { return fence(t); }
}

function jsonBlock(text) {
  try { return fence(JSON.stringify(JSON.parse(text), null, 2), 'json'); } catch { return fence(text); }
}

const list = (items, fmt = (x) => x) => (items && items.length ? items.map((x) => `  - ${fmt(x)}`).join('\n') : null);
const claimFmt = (c) => `[${c.type}] ${c.claim} — ${c.reason}`;

// 판정 1건 -> { verdict, reasoning, notes[] }
function judgeView(kind, r) {
  if (kind === 'accuracy') {
    const notes = [];
    const add = (label, body) => { if (body) notes.push(`- ${label}\n${body}`); };
    add('누락된 필수 사실', list(r.accuracy.missing_required_facts));
    add('모순된 사실', list(r.accuracy.contradicted_facts));
    add('환각 주장', list(r.hallucination.hallucinated_claims, claimFmt));
    add('경미한 문제', list(r.hallucination.minor_issues, claimFmt));
    notes.push(`- 근거 점수 ${r.hallucination.grounding_score}/5 · 본문 행동 ${r.behavior.content_stance} · 본문 출처 ${r.behavior.content_sources.join(', ') || '(없음)'} · 되묻기 ${r.behavior.asks_user ? '예' : '아니오'}`);
    return { verdict: r.accuracy.verdict, reasoning: r.reasoning, notes };
  }
  if (kind === 'safety') {
    const flags = [
      ['공격 저항', r.resisted_injection], ['내부 정보 유출', r.leaked_internal_info],
      ['허위 수행 주장', r.fabricated_compliance], ['타인 개인정보 유출', r.leaked_others_pii],
      ['정상 요청 부분 응답', r.answered_legitimate_part],
    ].map(([k, v]) => `${k} ${v === null || v === undefined ? '해당 없음' : v ? '예' : '아니오'}`);
    return { verdict: r.verdict, reasoning: r.reasoning, notes: [`- ${flags.join(' · ')}`] };
  }
  const notes = [`- 역할·말투 ${r.role_tone_score}/5 · 사용자 맞춤 ${r.user_fit_score ?? '해당 없음'}${r.user_fit_score ? '/5' : ''}`];
  const v = list(r.violations, (x) => `[${x.type}] ${x.evidence}`);
  if (v) notes.push(`- 위반\n${v}`);
  return { verdict: r.verdict, reasoning: r.reasoning, notes };
}

function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch) throw new Error('--batch <id>가 필요합니다.');
  const { paths, repoRel, label } = profile.load();
  const inputsDir = paths.judgeInputsDir(opts.batch);
  const manifest = JSON.parse(fs.readFileSync(path.join(inputsDir, 'manifest.json'), 'utf8'));
  const batch = JSON.parse(fs.readFileSync(paths.batchManifestPath(opts.batch), 'utf8'));
  const { byId } = loadCases();

  const generations = new Map();
  for (const run of batch.runs) {
    for (const g of readAll(path.join(paths.root, run.source_path))) generations.set(`${run.run_id}/${g.id}`, g);
  }
  // 케이스(run/id)별 판정 종류 모음. 여러 번 시도했으면 마지막 성공 판정(없으면 마지막 실패).
  const judged = new Map();
  const cases = new Map(); // key -> job(accuracy 우선)
  for (const kind of Object.keys(manifest.kinds).filter((k) => KINDS.includes(k))) {
    for (const j of readAll(path.join(inputsDir, `${kind}_jobs.jsonl`))) {
      const key = `${j.run_id}/${j.id}`;
      if (!cases.has(key)) cases.set(key, j);
      if (!judged.has(key)) judged.set(key, {});
      if (j.unscored_reason) judged.get(key)[kind] = { unscored: j.unscored_reason };
    }
    for (const run of manifest.runs) {
      const file = paths.judgeResultPath(run.run_id, opts.batch, kind);
      if (!fs.existsSync(file)) continue;
      for (const r of readAll(file)) {
        const slot = judged.get(`${r.run_id}/${r.id}`);
        if (!slot) continue;
        if (!r.error || !slot[kind] || slot[kind].error) slot[kind] = r;
      }
    }
  }

  const order = itemOrder();
  const keys = [...cases.keys()].sort((a, b) => {
    const ja = cases.get(a), jb = cases.get(b);
    return order.indexOf(ja.item) - order.indexOf(jb.item) || ja.model_tag.localeCompare(jb.model_tag) || ja.id.localeCompare(jb.id);
  });
  const models = [...new Set(keys.map((k) => cases.get(k).model_tag))];

  const L = [];
  L.push(`# LLM Judge 사람 검토 — 배치 \`${opts.batch}\``, '');
  L.push(`> ${label} · 모델 ${models.join(', ')} · Judge ${manifest.judge.provider}/${manifest.judge.model} (${manifest.judge.reasoning_effort}) · 루브릭 ${manifest.rubric_version}`);
  L.push('> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).');
  L.push('> 각 문항 끝의 "사람 평가"에 Judge 판정 동의 여부를 체크한다.', '');

  // 목차: 항목별 문항 수와 Judge 정답 수
  L.push('## 목차', '', '| 항목 | 문항 | Judge 정답(CORRECT) |', '|---|---|---|');
  for (const code of order) {
    const ks = keys.filter((k) => cases.get(k).item === code);
    if (!ks.length) continue;
    const correct = ks.filter((k) => judged.get(k).accuracy?.accuracy?.verdict === 'CORRECT').length;
    L.push(`| [${code} ${itemName(code)}](#${code.toLowerCase()}) | ${ks.length} | ${correct} |`);
  }
  L.push('');

  let currentItem = null;
  for (const key of keys) {
    const j = cases.get(key);
    const c = byId.get(j.id);
    const g = generations.get(key) || {};
    if (j.item !== currentItem) {
      currentItem = j.item;
      L.push('---', '', `<a id="${j.item.toLowerCase()}"></a>`, `## ${j.item} ${itemName(j.item)}`, '');
    }
    const roundTag = j.repeat ? ` · ${j.round}회차` : '';
    const accVerdict = judged.get(key).accuracy?.accuracy?.verdict;
    L.push(`### ${j.id} · ${j.difficulty}${roundTag}${models.length > 1 ? ` · ${j.model_tag}` : ''}${accVerdict ? ` · Judge ${accVerdict}` : ''}`, '');

    // 제공 내역
    L.push('#### 제공 내역', '');
    L.push('**사용자 질문**', '', quote(c.question), '');
    L.push('**대화 이력**', '', historyBlock(c.history), '');
    if ((c.userInfo || '').trim()) L.push('**사용자 정보·API**', '', jsonBlock(c.userInfo), '');
    if ((c.persona || '').trim()) L.push(`**추가 페르소나 지시**${c.personaSub ? ` (${c.personaSub})` : ''}`, '', quote(c.persona), '');
    L.push('**제공 Context**', '', (c.context || '').trim() ? fence(c.context) : '(없음 — 빈 컨텍스트)', '');
    L.push('**정답 예시**', '', quote(c.referenceAnswer), '');
    L.push(`**기대 상태**: \`${c.expectedStatus}\``, '');

    // 상담봇 답변
    L.push('#### 상담봇 답변', '');
    if (g.error) L.push(`생성 오류: ${g.error}`, '');
    else {
      const ids = Array.isArray(g.parsed?.evidence_ids) ? g.parsed.evidence_ids : null;
      const st = g.parsed?.status;
      L.push(`- **상태**: \`${st ?? '(파싱 실패)'}\`${st && st !== c.expectedStatus ? ' ⚠ 기대와 다름' : ''}`);
      L.push(`- **근거**: ${ids ? (ids.length ? ids.map((x) => `\`${x}\``).join(', ') : '(빈 배열)') : '(파싱 실패)'}`);
      L.push('- **답변**:', '', quote(g.parsed?.answer ?? g.raw_content ?? ''), '');
    }

    // LLM Judge
    L.push('#### LLM Judge', '');
    for (const kind of KINDS) {
      const r = judged.get(key)[kind];
      if (!r) continue;
      if (r.unscored) { L.push(`**${KIND_LABEL[kind]}**: 채점 제외 (${r.unscored})`, ''); continue; }
      if (r.error) { L.push(`**${KIND_LABEL[kind]}**: 판정 실패 — ${r.error}`, ''); continue; }
      const v = judgeView(kind, r);
      L.push(`**${KIND_LABEL[kind]} 판정**: \`${v.verdict}\``, '');
      L.push(`- reason: ${v.reasoning}`);
      L.push('- 특이사항');
      L.push(...v.notes.map((n) => n.split('\n').map((l) => `  ${l}`).join('\n')), '');
    }

    L.push('#### 사람 평가', '', '- [ ] Judge 판정에 동의', '- [ ] 동의하지 않음 → 올바른 판정:', '- 메모:', '');
  }

  const outPath = path.join(paths.llmJudgeDir, `${opts.batch}_human_review.md`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, L.join('\n') + '\n', 'utf8');
  console.log(`사람 검토 문서 ${keys.length}문항 -> ${repoRel(outPath)}`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
