'use strict';
// 부하 테스트 결과 요약. 모델 호출 없이 raw/<run_id>/steps.jsonl만 읽는다.
//
// 출력 (tryM/results/ 아래)
//   summary/load_test_summary_<date>.md   모델별 상세 표 (단계적 증가·스파이크·도착률·반복)
//   summary/load_steps_<date>.csv          모든 단계 요약을 한 표로
//   summary/charts/<model>_<date>_*.svg    동시 사용자 수 vs 처리량 / P95 / TTFT
//   all_summary.md                         회차 요약 (시작점)
//
// Usage: node load_test_v1/scripts/summarize.js --run-date YYYYMMDD [--profile quick]

const fs = require('fs');
const path = require('path');
const suite = require('./lib/suite');
const { readAll } = require('./lib/jsonl');
const { mean, stdev, round } = require('./lib/stats');
const { toCsv } = require('./lib/csv');

function parseArgs(argv) {
  const o = { runDate: null, profile: 'full' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--run-date') o.runDate = argv[++i];
    else if (argv[i] === '--profile') o.profile = argv[++i];
    else throw new Error(`알 수 없는 옵션: ${argv[i]}`);
  }
  return o;
}

const sec = (ms) => (typeof ms === 'number' ? (ms / 1000).toFixed(2) : '-');
const pct = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '-');
const num = (v, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '-');
const gb = (mib) => (typeof mib === 'number' ? (mib / 1024).toFixed(1) : '-');
const runLabel = (run) => `${run.meta && run.meta.engine || 'ollama'} / ${run.model}`;
const STOP_KO = {
  no_data: '측정 데이터 없음', fail_rate: '실패율 초과', p95_over: 'P95 10초 초과',
  throughput_plateau: '처리량 정체', max_users: '최대 사용자',
};

function loadRuns(date, profile) {
  const rawRoot = path.join(suite.resultsDir(), 'raw');
  if (!fs.existsSync(rawRoot)) throw new Error(`결과 폴더가 없습니다: ${suite.repoRel(rawRoot)}`);
  const suffix = profile === 'quick' ? `_${date}_quick` : `_${date}`;
  const dirs = fs.readdirSync(rawRoot).filter((d) => d.endsWith(suffix) && d.includes('_load_'));
  const runs = [];
  for (const d of dirs) {
    const dir = path.join(rawRoot, d);
    let meta = {};
    try { meta = JSON.parse(fs.readFileSync(path.join(dir, 'run_meta.json'), 'utf8')); } catch { /* */ }
    const recs = new Map();
    for (const r of readAll(path.join(dir, 'steps.jsonl'))) if (r.key) recs.set(r.key, r); // 마지막 기록이 우선
    runs.push({ runId: d, dir, meta, recs: [...recs.values()], model: meta.model || d });
  }
  // config의 모델 순서대로
  const order = ['gemma3:4b', 'qwen3:4b', 'qwen3:8b', 'qwen3:14b'];
  runs.sort((a, b) => order.indexOf(a.model) - order.indexOf(b.model));
  return runs;
}

// ---------------------------------------------------------------- SVG

const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#8a5cd1'];
const FONT = "-apple-system, 'Segoe UI', 'Noto Sans KR', 'Malgun Gothic', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function lineChart({ title, subtitle, yLabel, series, refLines = [], yFmt = (v) => v }) {
  const W = 720; const H = 420;
  const m = { l: 64, r: 150, t: 64, b: 52 };
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const ys = series.flatMap((s) => s.points.map((p) => p[1])).concat(refLines.map((r) => r.y));
  if (xs.length === 0 || ys.length === 0) return null;
  const x0 = Math.log2(xs[0]); const x1 = Math.log2(xs[xs.length - 1]) || 1;
  const yMax = Math.max(...ys) * 1.1 || 1;
  const X = (x) => m.l + ((Math.log2(x) - x0) / Math.max(1e-9, x1 - x0)) * (W - m.l - m.r);
  const Y = (y) => H - m.b - (y / yMax) * (H - m.t - m.b);
  const out = [];
  out.push(`<rect width="${W}" height="${H}" fill="#fcfcfb"/>`);
  out.push(`<text x="${m.l}" y="26" font-size="16" font-weight="700" fill="#0b0b0b">${esc(title)}</text>`);
  if (subtitle) out.push(`<text x="${m.l}" y="46" font-size="12" fill="#52514e">${esc(subtitle)}</text>`);
  for (let i = 0; i <= 4; i++) {
    const v = (yMax / 4) * i;
    out.push(`<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e1e0d9"/>`);
    out.push(`<text x="${m.l - 8}" y="${Y(v) + 4}" font-size="11" fill="#898781" text-anchor="end">${esc(yFmt(v))}</text>`);
  }
  for (const x of xs) {
    out.push(`<text x="${X(x)}" y="${H - m.b + 18}" font-size="11" fill="#898781" text-anchor="middle">${x}</text>`);
  }
  out.push(`<text x="${(m.l + W - m.r) / 2}" y="${H - 12}" font-size="12" fill="#52514e" text-anchor="middle">동시 사용자 수 (명)</text>`);
  out.push(`<text x="16" y="${(m.t + H - m.b) / 2}" font-size="12" fill="#52514e" transform="rotate(-90 16 ${(m.t + H - m.b) / 2})" text-anchor="middle">${esc(yLabel)}</text>`);
  for (const r of refLines) {
    out.push(`<line x1="${m.l}" x2="${W - m.r}" y1="${Y(r.y)}" y2="${Y(r.y)}" stroke="#c0392b" stroke-dasharray="5 4"/>`);
    out.push(`<text x="${W - m.r + 6}" y="${Y(r.y) + 4}" font-size="11" fill="#c0392b">${esc(r.label)}</text>`);
  }
  series.forEach((s, i) => {
    const c = PALETTE[i % PALETTE.length];
    const pts = s.points.slice().sort((a, b) => a[0] - b[0]);
    out.push(`<polyline fill="none" stroke="${c}" stroke-width="2.2" points="${pts.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')}"/>`);
    for (const p of pts) out.push(`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.5" fill="${c}"/>`);
    const ly = m.t + 10 + i * 20;
    out.push(`<line x1="${W - m.r + 12}" x2="${W - m.r + 32}" y1="${ly}" y2="${ly}" stroke="${c}" stroke-width="2.2"/>`);
    out.push(`<text x="${W - m.r + 38}" y="${ly + 4}" font-size="12" fill="#0b0b0b">${esc(s.name)}</text>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">${out.join('')}</svg>`;
}

// ---------------------------------------------------------------- 집계

function analyze(run, cfg) {
  const byKind = (k) => run.recs.filter((r) => r.kind === k);
  const steps = byKind('step');
  const rounds = byKind('round');
  const optimal = run.recs.find((r) => r.kind === 'optimal');
  const spike = run.recs.find((r) => r.kind === 'spike');
  const arrivals = byKind('arrival').sort((a, b) => a.factor - b.factor);
  const servers = byKind('server');
  const ladderA = steps.filter((s) => s.phase === 'A').sort((a, b) => a.parallel - b.parallel || a.users - b.users);
  const sloMs = cfg.slo.e2eP95Ms; const softMs = cfg.slo.e2eP95SoftMs;
  const ok = (s, lim) => s.summary.n_ok > 0 && s.summary.fail_rate <= cfg.slo.failRate && s.summary.e2e_p95_ms <= lim;

  const perParallel = {};
  for (const s of ladderA) (perParallel[s.parallel] ||= []).push(s);
  const parallelRows = Object.entries(perParallel).map(([p, ss]) => ({
    parallel: Number(p),
    maxUsersSlo: Math.max(0, ...ss.filter((s) => ok(s, sloMs)).map((s) => s.users)),
    maxUsersSoft: Math.max(0, ...ss.filter((s) => ok(s, softMs)).map((s) => s.users)),
    peakRps: Math.max(...ss.map((s) => s.summary.rps || 0)),
    peakTok: ss.some((s) => typeof s.summary.tok_s === 'number')
      ? Math.max(...ss.map((s) => s.summary.tok_s ?? -Infinity)) : null,
    vramMax: Math.max(0, ...ss.map((s) => s.server.vram_max_mib || 0)) || null,
    // Ollama가 보고한 "모델 + KV 캐시" 적재 크기 (/api/ps size_vram)
    loadedBytes: (servers.filter((v) => v.parallel === Number(p) && v.fit && v.fit.size_vram_bytes).pop() || { fit: {} }).fit.size_vram_bytes || null,
  }));
  const skipped = rounds.filter((r) => r.status !== 'done');

  // 반복 편차 — 최적 설정의 1회차(A) + 반복(C)
  let repeats = [];
  if (optimal) {
    const same = steps.filter((s) => s.parallel === optimal.parallel && (s.phase === 'A' || s.phase === 'C'));
    const users = [...new Set(same.map((s) => s.users))].sort((a, b) => a - b);
    repeats = users.map((u) => {
      const ss = same.filter((s) => s.users === u);
      const p95 = ss.map((s) => s.summary.e2e_p95_ms);
      const rps = ss.map((s) => s.summary.rps);
      return {
        users: u, reps: ss.map((s) => s.rep).sort().join(','), n: ss.length,
        p95Mean: mean(p95), p95Sd: stdev(p95), rpsMean: mean(rps), rpsSd: stdev(rps),
      };
    });
  }
  const repeatSkips = byKind('repeat_skip').filter((s) => !rounds.some((r) => r.phase === 'C'
    && r.rep === s.rep && r.status === 'done'));

  const allSteps = steps.concat(spike ? [spike] : [], arrivals);
  const loadgenMax = Math.max(0, ...allSteps.map((s) => (s.server && s.server.loadgen_cpu_max) || 0));
  const cpuMax = Math.max(0, ...allSteps.map((s) => (s.server && s.server.cpu_max) || 0));
  const tempMax = Math.max(0, ...allSteps.map((s) => (s.server && s.server.gpu_temp_max) || 0)) || null;
  const clockMin = Math.min(...allSteps.map((s) => (s.server && s.server.sm_clock_min) || Infinity));
  const u1 = ladderA.find((s) => s.users === 1 && optimal && s.parallel === optimal.parallel) || ladderA.find((s) => s.users === 1);

  return {
    steps, ladderA, rounds, optimal, spike, arrivals, servers, parallelRows, skipped, repeats, repeatSkips,
    loadgenMax, cpuMax, tempMax, clockMin: Number.isFinite(clockMin) ? clockMin : null, u1,
    ollamaVersion: (servers.find((s) => s.ollama_version) || {}).ollama_version || null,
  };
}

// ---------------------------------------------------------------- 문서

function writeCharts(run, a, date, chartDir) {
  const out = [];
  const tag = `${run.model}_${run.meta && run.meta.engine || 'ollama'}_${(run.runId || '').match(/_([a-f0-9]{12})_load/)?.[1] || 'legacy'}`.replace(/[:.]/g, '-');
  const perP = {};
  for (const s of a.ladderA) (perP[s.parallel] ||= []).push(s);
  const series = (fn) => Object.entries(perP).map(([p, ss]) => ({
    name: `동시 처리 ${p}`, points: ss.filter((s) => typeof fn(s) === 'number').map((s) => [s.users, fn(s)]),
  })).filter((s) => s.points.length);
  const charts = [
    ['throughput', lineChart({ title: `${runLabel(run)} — 처리량`, subtitle: '측정 구간 안에 끝난 성공 요청 수 / 초', yLabel: 'req/s', series: series((s) => s.summary.rps), yFmt: (v) => v.toFixed(1) })],
    ['e2e_p95', lineChart({
      title: `${runLabel(run)} — 전체 응답 P95`, subtitle: '점선: 판단 기준 3초·5초', yLabel: '초', series: series((s) => s.summary.e2e_p95_ms / 1000),
      refLines: [{ y: 3, label: '3초' }, { y: 5, label: '5초' }], yFmt: (v) => v.toFixed(1),
    })],
    ['ttft_p95', lineChart({ title: `${runLabel(run)} — 첫 토큰 P95 (TTFT)`, subtitle: '스트리밍에서 답이 보이기 시작하는 시간', yLabel: '초', series: series((s) => s.summary.ttft_p95_ms / 1000), yFmt: (v) => v.toFixed(1) })],
  ];
  fs.mkdirSync(chartDir, { recursive: true });
  for (const [name, svg] of charts) {
    if (!svg) continue;
    const file = path.join(chartDir, `${tag}_${date}_${name}.svg`);
    fs.writeFileSync(file, svg);
    out.push({ name, file });
  }
  return out;
}

function detailMd(runs, analyses, cfg, date, chartsByRun, summaryDir) {
  const L = [];
  const meta0 = runs[0] ? runs[0].meta : {};
  const host = meta0.host || {};
  L.push(`# LLM 동시성(부하) 테스트 상세 결과 — ${date}`);
  L.push('');
  L.push('## 1. 조건');
  L.push('');
  L.push('| 항목 | 값 |');
  L.push('|---|---|');
  L.push(`| 환경 | ${host.instance_type || '?'} · ${host.gpu || 'GPU 정보 없음'} · vCPU ${host.cpus || '?'} · 메모리 ${host.mem_gib || '?'}GiB |`);
  L.push('| 엔진 | 조합별 서버 준비 기록의 engine_version·실행 설정 참조 |');
  L.push(`| 생성 설정 | temperature ${cfg.generation.temperature} · num_ctx ${cfg.generation.num_ctx} · num_predict ${cfg.generation.num_predict ?? '미설정'} · format ${cfg.generation.format} · stream true · qwen3 think=false · gemma3 think 미전송 |`);
  L.push(`| 서버 설정 | FLASH_ATTENTION=${cfg.server.flashAttention} · KV_CACHE_TYPE=${cfg.server.kvCacheType} · MAX_QUEUE=${cfg.server.maxQueue} · MAX_LOADED_MODELS=${cfg.server.maxLoadedModels} |`);
  L.push(`| 요청 | 부하 문항 고유 ${meta0.prompt_pool ? meta0.prompt_pool.unique_cases : '미기록'}건 · 시드 ${cfg.seed} 고정 순서 (모든 모델 동일) |`);
  if (meta0.prompt_pool && meta0.prompt_pool.categories) {
    L.push(`| 문항 구성 | ${Object.entries(meta0.prompt_pool.categories).map(([type, count]) => `${type} ${count}건`).join(' · ')} |`);
    L.push(`| 문항 파일 SHA-256 | ${meta0.prompt_pool.sha256 || '미기록'} |`);
  }
  L.push(`| 단계 | 워밍업 후 ${cfg.ladder.measureMs / 1000}초 · 최소 ${cfg.ladder.minRequests}건 · 최대 ${cfg.ladder.maxStepMs / 1000}초 · 타임아웃 ${cfg.requestTimeoutMs / 1000}초 |`);
  L.push(`| 멈춤 조건 | P95>${cfg.stop.p95E2eMs / 1000}초 · 실패율>${pct(cfg.stop.failRate)} · 처리량 증가<${pct(cfg.stop.minGain)} · VRAM 부족 · 최대 ${cfg.stop.maxUsers}명 |`);
  L.push(`| 판단 기준 | 전체 응답 P95 ${cfg.slo.e2eP95SoftMs / 1000}~${cfg.slo.e2eP95Ms / 1000}초, 실패율 ${pct(cfg.slo.failRate)} 이하 |`);
  L.push(`| 코드 | git ${host.git_commit || '?'} · Node ${host.node || '?'} |`);
  L.push('');
  L.push('> 지연 통계는 성공 요청 기준이다. 실패(타임아웃)를 끊길 때까지 기다린 시간으로 넣은 값은 "체감 P95(실패 포함)" 열에 따로 적었다.');
  L.push('> 처리량(req/s)은 단계적 증가에서는 측정 구간 안에 끝난 성공 요청 수 ÷ 구간 길이, 도착률·스파이크에서는 성공 요청 수 ÷ 모든 요청이 끝날 때까지 걸린 시간이다.');
  L.push('');

  runs.forEach((run, i) => {
    const a = analyses[i];
    L.push(`## ${i + 2}. ${runLabel(run)}`);
    L.push('');
    L.push(`run_id: \`${run.runId}\``);
    if (run.meta && run.meta.deployment) L.push(`모델 형식 ${run.meta.deployment.weight_format} · 양자화 ${run.meta.deployment.quantization} · 리비전 ${run.meta.deployment.revision}`);
    L.push('');
    L.push('### 모델 로딩과 워밍업');
    L.push('');
    L.push('| 설정 준비 | 동시 처리 | 모델 로딩 (초) | 모델 워밍업 (초) | 워밍업 성공 / 요청 | 결과 |');
    L.push('|---|---|---|---|---|---|');
    for (const v of a.servers) {
      const w = v.warmup;
      L.push(`| ${v.label} | ${v.parallel} | ${sec(v.load_ms)} | ${w ? sec(w.duration_ms) : '미기록'} | ${w ? `${w.n_ok} / ${w.n_requests}` : '-'} | ${w ? (w.ready ? '완료' : '실패') : '미확인'} |`);
    }
    L.push('');
    if (a.optimal) L.push(`**최적 병렬 처리 한도: ${a.optimal.parallel}** — ${a.optimal.reason}`);
    L.push('');
    L.push('### 단계적 증가 (1회차)');
    L.push('');
    L.push('| 동시 처리 | 사용자 | n | 실패 | TTFT p50/p95 (초) | 응답 p50/p95/p99 (초) | 체감 P95(실패 포함) | 토큰 간격 p50 (ms) | 대기 추정 p95 (초) | req/s | tok/s | 출력 토큰 평균 | GPU% | VRAM(GB) | CPU% (스크립트) | 멈춤 |');
    L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const s of a.ladderA) {
      const m = s.summary; const v = s.server || {};
      L.push(`| ${s.parallel} | ${s.users} | ${m.n_total} | ${pct(m.fail_rate)} | ${sec(m.ttft_p50_ms)} / ${sec(m.ttft_p95_ms)} | ${sec(m.e2e_p50_ms)} / ${sec(m.e2e_p95_ms)} / ${sec(m.e2e_p99_ms)} | ${sec(m.e2e_p95_all_ms)} | ${num(m.itl_mean_p50_ms, 1)} | ${sec(m.wait_est_p95_ms)} | ${num(m.rps, 2)} | ${num(m.tok_s, 0)} | ${num(m.out_tokens_avg, 0)} | ${v.gpu_util_avg ?? '-'} | ${gb(v.vram_max_mib)} | ${v.cpu_avg ?? '-'} (${v.loadgen_cpu_avg ?? '-'}) | ${s.stop_reason ? STOP_KO[s.stop_reason] || s.stop_reason : ''}${s.capped ? ' ⚠시간상한' : ''} |`);
    }
    L.push('');
    L.push('### 생성 속도와 자원');
    L.push('');
    L.push('| 단계 | 병렬 / 사용자 | TPOT p95 (ms) | 사용자 tok/s 평균 | TTFT 이후 tok/s | 토큰 usage 성공 요청 | 전력 평균 / 최대 (W) | 시스템 RAM 최대 (GB) | 엔진 CPU 평균 (%) | running / queued 최대 |');
    L.push('|---|---|---|---|---|---|---|---|---|---|');
    for (const step of a.steps.concat(a.spike ? [a.spike] : [], a.arrivals)) {
      const m = step.summary, v = step.server || {};
      L.push(`| ${step.kind} ${step.phase || 'B'} rep${step.rep || 1} | ${step.parallel} / ${step.users || '-'} | ${num(m.tpot_p95_ms)} | ${num(m.user_tok_s_avg)} | ${num(m.post_ttft_tok_s_avg)} | ${m.token_usage_requests ?? '-'} / ${m.n_ok} | ${num(v.gpu_power_avg_w)} / ${num(v.gpu_power_max_w)} | ${gb(v.system_ram_max_mib)} | ${num(v.engine_cpu_avg)} | ${num(v.running_requests_max, 0)} / ${num(v.queued_requests_max, 0)} |`);
    }
    L.push('');
    L.push('미지원 지표는 -로 표시한다. running/queued는 5초 표본이며 순간 peak와 구분한다.');
    L.push('');
    L.push('동시 처리 수별 요약');
    L.push('');
    L.push('| 동시 처리 | P95 5초 이내 최대 사용자 | P95 3초 이내 최대 사용자 | 최대 처리량 (req/s) | 최대 tok/s | 모델+KV 적재 (GB, Ollama 보고) | GPU 메모리 최대 (GB, nvidia-smi) |');
    L.push('|---|---|---|---|---|---|---|');
    for (const r of a.parallelRows) {
      L.push(`| ${r.parallel} | ${r.maxUsersSlo || '없음'} | ${r.maxUsersSoft || '없음'} | ${num(r.peakRps, 2)} | ${num(r.peakTok, 0)} | ${r.loadedBytes ? (r.loadedBytes / 1024 ** 3).toFixed(1) : '-'} | ${gb(r.vramMax)} |`);
    }
    for (const r of a.skipped) {
      const need = r.fit && r.fit.size_bytes ? `${(r.fit.size_bytes / 1024 ** 3).toFixed(1)} 필요 (GPU에 ${((r.fit.size_vram_bytes || 0) / 1024 ** 3).toFixed(1)}만 적재)` : '-';
      const reason = r.status === 'skipped_vram' ? 'VRAM 부족(모델 일부가 CPU로 밀림)'
        : r.status === 'skipped_warmup_error' ? `워밍업 실패: ${(r.fit && r.fit.warmup_error) || '?'}`
          : `로딩 실패: ${(r.fit && r.fit.load_error) || '?'}`;
      L.push(`| ${r.parallel} | 측정 안 함 — ${reason} | | | | ${need} | |`);
    }
    L.push('');
    const charts = chartsByRun[i];
    if (charts.length) {
      L.push('그래프: ' + charts.map((c) => `[${c.name}](${path.relative(summaryDir, c.file).split(path.sep).join('/')})`).join(' · '));
      L.push('');
    }
    if (a.spike) {
      const m = a.spike.summary;
      L.push(`### 스파이크 (${a.spike.users}명 동시, 동시 처리 ${a.spike.parallel})`);
      L.push('');
      L.push('| 성공 | 실패 | 실패 유형 | TTFT p95 | 응답 p50 / p95 / 최대 | 모두 끝날 때까지 |');
      L.push('|---|---|---|---|---|---|');
      L.push(`| ${m.n_ok} | ${m.n_fail} (${pct(m.fail_rate)}) | ${Object.entries(m.fail_types).map(([k, v]) => `${k} ${v}`).join(', ') || '-'} | ${sec(m.ttft_p95_ms)}초 | ${sec(m.e2e_p50_ms)} / ${sec(m.e2e_p95_ms)} / ${sec(m.e2e_max_ms)}초 | ${sec(a.spike.drain_ms)}초 |`);
      L.push('');
    }
    if (a.arrivals.length) {
      L.push('### 도착률 (서버가 느려져도 사용자는 계속 들어오는 상황)');
      L.push('');
      L.push('| 배수 | 보낸 속도 (req/s) | 처리한 속도 (req/s) | n | 실패 | TTFT p95 | 응답 p50 / p95 (초) | 최대 미완료 요청 (처리·대기) |');
      L.push('|---|---|---|---|---|---|---|---|');
      for (const r of a.arrivals) {
        const m = r.summary;
        L.push(`| ×${r.factor} | ${num(r.offered_rps, 2)} | ${num(m.rps, 2)} | ${m.n_total} | ${pct(m.fail_rate)} | ${sec(m.ttft_p95_ms)} | ${sec(m.e2e_p50_ms)} / ${sec(m.e2e_p95_ms)} | ${r.max_in_flight} |`);
      }
      L.push('');
    }
    if (a.repeats.length) {
      L.push(`### 반복 측정 (동시 처리 ${a.optimal.parallel}, 회차별 편차)`);
      L.push('');
      L.push('| 사용자 | 회차 | 응답 P95 평균 ± 표준편차 (초) | req/s 평균 ± 표준편차 |');
      L.push('|---|---|---|---|');
      for (const r of a.repeats) {
        L.push(`| ${r.users} | ${r.reps} | ${sec(r.p95Mean)} ± ${r.p95Sd !== null ? sec(r.p95Sd) : '-'} | ${num(r.rpsMean, 2)} ± ${r.rpsSd !== null ? num(r.rpsSd, 2) : '-'} |`);
      }
      for (const s of a.repeatSkips) L.push(`\n> 반복 ${s.rep}회차 생략: ${s.reason}`);
      L.push('');
    }
    L.push('### 측정 신뢰도 확인');
    L.push('');
    L.push('사용자별 워밍업은 모든 사용자가 첫 요청을 성공한 뒤 종료되며, 본 측정 구간과 분리한다.');
    L.push('');
    L.push('| 단계 | 사용자 | 사용자 워밍업 (초) | 워밍업 성공 / 요청 | 본 측정 구간 (초) |');
    L.push('|---|---|---|---|---|');
    for (const s of a.steps) {
      const w = s.warmup_summary;
      L.push(`| ${s.phase}·P${s.parallel}·rep${s.rep} | ${s.users} | ${sec(s.warmup_ms)} | ${w ? `${w.n_ok} / ${w.n_requests}` : '미기록'} | ${num(s.summary.window_sec)} |`);
    }
    L.push('');
    L.push(`- 부하 스크립트 CPU 최대 ${a.loadgenMax}% · 전체 CPU 최대 ${a.cpuMax}%${a.loadgenMax > 10 ? ' — ⚠ 스크립트가 CPU를 많이 써서 측정에 영향을 줬을 수 있음' : ''}`);
    if (a.tempMax) L.push(`- GPU 온도 최대 ${a.tempMax}°C · SM 클럭 최저 ${a.clockMin ?? '-'}MHz (클럭이 크게 떨어졌다면 발열로 성능이 제한된 것)`);
    const capped = a.steps.filter((s) => s.capped || !s.min_requests_met);
    if (capped.length) L.push(`- 최소 요청 수를 못 채운 단계 ${capped.length}개: ${capped.map((s) => `P${s.parallel}·U${s.users}·rep${s.rep}`).join(', ')}`);
    L.push('');
  });
  return L.join('\n');
}

function allSummaryMd(runs, analyses, cfg, date, detailRel) {
  const L = [];
  L.push(`# load_test_v1 / ${suite.tryTag()} — LLM 동시성(부하) 테스트 요약`);
  L.push('');
  L.push(`측정일 ${date} · 품질 채점 없음(속도·처리량만) · 상세: [${path.basename(detailRel)}](${detailRel})`);
  L.push('');
  L.push('## 1. 모델별 핵심 결과');
  L.push('');
  L.push(`판단 기준: 전체 응답 P95 ${cfg.slo.e2eP95SoftMs / 1000}~${cfg.slo.e2eP95Ms / 1000}초 · 실패율 ${pct(cfg.slo.failRate)} 이하`);
  L.push('');
  L.push(`| 모델 | 최적 동시 처리 | P95 5초 이내 최대 동시 사용자 | P95 3초 이내 | 최대 처리량 (req/s) | 1명일 때 P95 (초) | 스파이크 ${cfg.spike.users}명 실패율 | 측정 못 한 동시 처리 (VRAM) |`);
  L.push('|---|---|---|---|---|---|---|---|');
  runs.forEach((run, i) => {
    const a = analyses[i];
    const best = a.optimal ? a.parallelRows.find((r) => r.parallel === a.optimal.parallel) : null;
    const peak = Math.max(0, ...a.parallelRows.map((r) => r.peakRps));
    L.push(`| ${runLabel(run)} | ${a.optimal ? a.optimal.parallel : '-'} | ${best ? best.maxUsersSlo || '없음' : '-'} | ${best ? best.maxUsersSoft || '없음' : '-'} | ${num(peak, 2)} | ${a.u1 ? sec(a.u1.summary.e2e_p95_ms) : '-'} | ${a.spike ? pct(a.spike.summary.fail_rate) : '-'} | ${a.skipped.filter((r) => r.status === 'skipped_vram').map((r) => r.parallel).join(', ') || '없음'} |`);
  });
  L.push('');
  L.push('## 2. 읽는 법');
  L.push('');
  L.push('- **최적 동시 처리**: `OLLAMA_NUM_PARALLEL` 후보 중 판단 기준을 지키며 가장 많은 동시 사용자를 버틴 값. 운영 설정 후보다.');
  L.push('- **P95 5초 이내 최대 동시 사용자**: 그 설정에서 사람이 이만큼 동시에 몰려도 95%가 5초 안에 답을 받는다는 뜻. 2배 간격으로 쟀으므로 실제 한계는 이 값과 다음 단계 사이에 있다.');
  L.push('- **1명일 때 P95**: 혼자 쓸 때의 기준선. v3 순차 측정(stream 없음, num_ctx 미지정)과 조건이 달라 이 값을 정식 기준선으로 쓴다.');
  L.push('- 도착률 표에서 "처리한 속도"가 "보낸 속도"를 못 따라가기 시작하는 지점이 실제 트래픽 기준 한계다.');
  L.push('');
  L.push('## 3. 알려진 한계');
  L.push('');
  L.push('- LLM만 측정했다. 임베딩 검색·Spring 백엔드·네트워크 구간은 포함하지 않는다.');
  L.push('- Ollama의 대기 추정은 "전체 시간 − 입력 처리 − 답변 생성"이다. 다른 엔진의 요청별 queue time·서버 decode 시간이 없으면 미지원으로 표시하며 0으로 대체하지 않는다.');
  L.push('- 공유 시스템 프롬프트의 캐시 효과가 포함된다. 엔진별 실제 캐시 설정은 실행 인자·엔진 로그에 기록한다.');
  L.push('- 문항은 부하 입력으로만 사용하며 정답 데이터 연결과 답변 품질 채점은 하지 않았다. 생성된 답변은 `raw/<run_id>/requests.jsonl`의 `content`에 기록한다.');
  L.push('');
  return L.join('\n');
}

function stepsCsv(runs) {
  const rows = [];
  for (const run of runs) {
    for (const r of run.recs) {
      if (!['step', 'spike', 'arrival'].includes(r.kind)) continue;
      const m = r.summary || {}; const v = r.server || {};
      rows.push({
        engine: run.meta && run.meta.engine || 'ollama', model: run.model, run_id: run.runId, kind: r.kind, phase: r.phase || 'B', rep: r.rep ?? '', parallel: r.parallel,
        users: r.users ?? '', factor: r.factor ?? '', offered_rps: r.offered_rps ?? '',
        n: m.n_total, fail_rate: m.fail_rate, ttft_p50_ms: m.ttft_p50_ms, ttft_p95_ms: m.ttft_p95_ms,
        e2e_p50_ms: m.e2e_p50_ms, e2e_p95_ms: m.e2e_p95_ms, e2e_p99_ms: m.e2e_p99_ms, e2e_p95_all_ms: m.e2e_p95_all_ms,
        itl_mean_p50_ms: m.itl_mean_p50_ms, wait_est_p95_ms: m.wait_est_p95_ms, rps: m.rps, tok_s: m.tok_s,
        tpot_p50_ms: m.tpot_p50_ms, tpot_p95_ms: m.tpot_p95_ms,
        user_tok_s_avg: m.user_tok_s_avg, post_ttft_tok_s_avg: m.post_ttft_tok_s_avg,
        token_usage_requests: m.token_usage_requests,
        in_tokens_avg: m.in_tokens_avg, out_tokens_avg: m.out_tokens_avg,
        gpu_util_avg: v.gpu_util_avg, vram_max_mib: v.vram_max_mib, cpu_avg: v.cpu_avg, loadgen_cpu_avg: v.loadgen_cpu_avg,
        engine_cpu_avg: v.engine_cpu_avg, system_ram_max_mib: v.system_ram_max_mib,
        gpu_power_avg_w: v.gpu_power_avg_w, gpu_power_max_w: v.gpu_power_max_w, gpu_power_limit_w: v.gpu_power_limit_w,
        running_requests_max: v.running_requests_max, queued_requests_max: v.queued_requests_max,
        warmup_ms: r.warmup_ms ?? '', warmup_requests: r.warmup_summary ? r.warmup_summary.n_requests : '',
        warmup_failures: r.warmup_summary ? r.warmup_summary.n_fail : '', window_sec: m.window_sec,
        stop_reason: r.stop_reason || '', capped: r.capped ?? '',
      });
    }
  }
  return rows;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { loadConfig } = require('./config/load_config');
  const cfg = loadConfig(opts.profile);
  if (!opts.runDate) throw new Error('--run-date YYYYMMDD 가 필요합니다');
  const runs = loadRuns(opts.runDate, opts.profile);
  if (runs.length === 0) throw new Error(`${opts.runDate} 날짜의 결과가 없습니다 (profile=${opts.profile})`);
  const runCfg = (runs[0].meta && runs[0].meta.config) || cfg; // 실제로 돌린 설정을 우선
  const analyses = runs.map((r) => analyze(r, r.meta && r.meta.config || cfg));

  const summaryDir = suite.summaryDir();
  const chartDir = path.join(summaryDir, 'charts');
  fs.mkdirSync(summaryDir, { recursive: true });
  const tag = opts.profile === 'quick' ? `${opts.runDate}_quick` : opts.runDate;
  const chartsByRun = runs.map((r, i) => writeCharts(r, analyses[i], tag, chartDir));

  const detailPath = path.join(summaryDir, `load_test_summary_${tag}.md`);
  fs.writeFileSync(detailPath, detailMd(runs, analyses, runCfg, tag, chartsByRun, summaryDir));
  const csvPath = path.join(summaryDir, `load_steps_${tag}.csv`);
  const rows = stepsCsv(runs);
  fs.writeFileSync(csvPath, rows.length ? toCsv(rows, Object.keys(rows[0])) : '');
  const allPath = suite.allSummaryPath();
  fs.writeFileSync(allPath, allSummaryMd(runs, analyses, runCfg, tag, path.relative(path.dirname(allPath), detailPath).split(path.sep).join('/')));

  console.log(`엔진·모델 ${runs.length}개 조합 요약 완료`);
  for (const p of [allPath, detailPath, csvPath]) console.log(`  ${suite.repoRel(p)}`);
  console.log(`  ${suite.repoRel(chartDir)}/ (그래프 ${chartsByRun.flat().length}개)`);
}

try {
  main();
} catch (e) {
  console.error(`실패: ${e.message}`);
  process.exit(1);
}
