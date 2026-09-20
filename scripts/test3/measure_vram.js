'use strict';
// 항목8 — 모델별 VRAM 실측 (독립 실행).
//
// run_generation.js도 케이스마다 VRAM을 샘플링하지만(lib/vram.js), 그건 생성
// 도중의 GPU '전체' 사용량이라 다른 프로세스가 섞이고 "이 모델이 얼마나
// 쓰는가"를 주지 못한다. 여기서는 깨끗한 조건에서 모델을 하나씩만 올려놓고
// 잰다:
//
//   1) 이전 모델 언로드 후 유휴 상태 기준선(nvidia-smi)
//   2) 워밍업 1건 호출로 모델 로드
//   3) Ollama /api/ps의 size_vram(모델별) + nvidia-smi 전체값 동시 기록
//   4) 기준선을 뺀 순증분 계산
//
// size_vram < size 이면 일부가 CPU로 내려간 것이고, 그 모델은 지연이 크게
// 나빠진다 — 14B가 느릴 때 원인을 가르는 핵심 신호라 함께 남긴다.
//
// Usage:
//   node scripts/test3/measure_vram.js [--dry-run] [--models a,b,c]

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const models = require('./config/models');
const ollama = require('../test2/lib/ollama');
const { sampleVramMiB, sampleModelVram, gpuName } = require('../test2/lib/vram');
const { ROOT, envTag } = require('./lib/runner');

const OUT_PATH = path.join(ROOT, 'results', 'scored', models.suite, 'vram_profile.json');
const MIB = 1024 * 1024;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function unloadAll() {
  // `ollama stop`은 버전에 따라 없을 수 있다 — 실패해도 진행한다(다음 모델
  // 로드 시 Ollama가 알아서 밀어낸다. 다만 기준선이 부정확해질 수 있어 경고).
  for (const m of models.all) {
    const r = spawnSync('ollama', ['stop', m.tag], { encoding: 'utf8' });
    if (r.error) return false;
  }
  return true;
}

async function measureOne(model) {
  console.log(`\n--- ${model.tag} ---`);
  unloadAll();
  await sleep(3000);
  const baselineMib = sampleVramMiB();
  console.log(`  기준선(유휴): ${baselineMib === null ? '측정 불가' : baselineMib + ' MiB'}`);

  // 워밍업: 짧은 프롬프트 1건으로 모델을 GPU에 올린다.
  let warmupError = null;
  const started = Date.now();
  try {
    await ollama.chat(model.tag, [{ role: 'user', content: '안녕하세요' }], { format: undefined });
  } catch (e) {
    warmupError = String(e.message || e);
    console.error(`  워밍업 실패: ${warmupError}`);
  }
  const loadMs = Date.now() - started;
  await sleep(1000);

  const totalMib = sampleVramMiB();
  const ps = await sampleModelVram(model.tag);
  const sizeVramMib = ps && ps.size_vram_bytes != null ? Math.round(ps.size_vram_bytes / MIB) : null;
  const sizeMib = ps && ps.size_bytes != null ? Math.round(ps.size_bytes / MIB) : null;
  const deltaMib = totalMib !== null && baselineMib !== null ? totalMib - baselineMib : null;

  console.log(`  /api/ps size_vram: ${sizeVramMib === null ? '측정 불가' : sizeVramMib + ' MiB'}`
    + (sizeMib !== null ? ` (모델 전체 ${sizeMib} MiB)` : ''));
  console.log(`  nvidia-smi 전체: ${totalMib === null ? '측정 불가' : totalMib + ' MiB'}`
    + (deltaMib !== null ? ` (순증분 ${deltaMib} MiB)` : ''));
  if (ps && ps.fully_on_gpu === false) {
    console.warn('  ⚠ 모델 일부가 GPU에 안 올라갔습니다(size_vram < size) — 지연이 크게 나빠집니다.');
  }

  return {
    model_tag: model.tag,
    tier: model.tier,
    baseline_total_mib: baselineMib,
    loaded_total_mib: totalMib,
    delta_mib: deltaMib,
    size_vram_mib: sizeVramMib,
    model_size_mib: sizeMib,
    fully_on_gpu: ps ? ps.fully_on_gpu : null,
    warmup_load_ms: loadMs,
    warmup_error: warmupError,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const pick = argv.includes('--models') ? argv[argv.indexOf('--models') + 1].split(',') : null;
  const targets = pick ? models.all.filter((m) => pick.includes(m.tag)) : models.all;

  const gpu = gpuName();
  console.log(`VRAM 실측 — env=${envTag()} GPU=${gpu || '(nvidia-smi 없음)'}`);
  console.log(`대상 ${targets.length}개: ${targets.map((m) => m.tag).join(', ')}`);

  if (dryRun) {
    console.log(`\n[--dry-run] 접근 확인만 수행합니다.`);
    console.log(`  nvidia-smi: ${sampleVramMiB() === null ? '사용 불가' : '사용 가능'}`);
    const ps = await sampleModelVram(targets[0].tag);
    console.log(`  Ollama /api/ps: ${ps === null ? '사용 불가(또는 해당 모델 미로드)' : '사용 가능'}`);
    console.log(`  출력 예정 경로: ${path.relative(ROOT, OUT_PATH)}`);
    return;
  }

  const measurements = [];
  for (const model of targets) measurements.push(await measureOne(model));
  unloadAll();

  const profile = {
    suite: models.suite,
    env: envTag(),
    gpu_name: gpu,
    measured_at: new Date().toISOString(),
    note: 'size_vram_mib는 Ollama /api/ps의 모델별 값, delta_mib는 nvidia-smi 전체값에서 '
      + '유휴 기준선을 뺀 순증분이다. 둘이 크게 다르면 GPU를 쓰는 다른 프로세스가 있다는 뜻이다.',
    measurements,
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(profile, null, 2) + '\n', 'utf8');

  console.log(`\n========== VRAM 실측 요약 ==========`);
  console.log(`${'모델'.padEnd(18)}${'size_vram'.padStart(12)}${'순증분'.padStart(10)}${'GPU 전량'.padStart(10)}`);
  for (const m of measurements) {
    console.log(`${m.model_tag.padEnd(18)}`
      + `${(m.size_vram_mib === null ? '-' : m.size_vram_mib + 'MiB').padStart(12)}`
      + `${(m.delta_mib === null ? '-' : m.delta_mib + 'MiB').padStart(10)}`
      + `${(m.fully_on_gpu === null ? '-' : m.fully_on_gpu ? 'O' : 'X').padStart(10)}`);
  }
  console.log(`\n-> ${path.relative(ROOT, OUT_PATH)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
