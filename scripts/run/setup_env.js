'use strict';
// 실행 환경 준비(멱등): NLI용 Python venv, Ollama 모델, 데이터셋 CSV.
//   1. .venv_nli 생성 + scripts/python_nli/requirements.txt 설치 (없을 때만)
//   2. Ollama 확인 + test.config.js의 모델·임베딩 모델 pull (없을 때만)
//   3. 데이터셋 CSV가 없으면 prepare_dataset.js 실행
//
// Usage: node scripts/run/setup_env.js [--skip-models] [--skip-nli] [--test v4]

const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { IS_WINDOWS, VENV_DIR, VENV_PYTHON } = require('../lib/platform');

function ok(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

function main() {
  const { config, paths, label } = profile.load();
  console.log(`환경 준비 [${label}]`);

  if (!argv.includes('--skip-nli')) {
    console.log('\n=== 1. Python venv (.venv_nli) ===');
    if (fs.existsSync(VENV_PYTHON)) console.log(`이미 있음: ${VENV_PYTHON}`);
    else {
      const py = IS_WINDOWS ? 'python' : 'python3';
      if (!ok(py, ['--version'])) throw new Error(`${py}가 없습니다. Python 3.10+ 설치 후 다시 실행하세요.`);
      execFileSync(py, ['-m', 'venv', VENV_DIR], { stdio: 'inherit' });
      execFileSync(VENV_PYTHON, ['-m', 'pip', 'install', '-r', path.join(__dirname, '..', 'python_nli', 'requirements.txt')], { stdio: 'inherit' });
    }
  }

  if (!argv.includes('--skip-models')) {
    console.log('\n=== 2. Ollama 모델 ===');
    const list = ok('ollama', ['list']);
    if (!list) throw new Error('ollama가 없거나 서버가 꺼져 있습니다. https://ollama.com 설치 후 `ollama serve`.');
    const installed = list.split('\n').slice(1).map((l) => l.trim().split(/\s+/)[0]).filter(Boolean);
    for (const tag of [...config.models.map((m) => m.tag), config.embeddingModel]) {
      if (installed.includes(tag) || installed.includes(`${tag}:latest`)) console.log(`  있음 ${tag}`);
      else { console.log(`  pull ${tag}`); execFileSync('ollama', ['pull', tag], { stdio: 'inherit' }); }
    }
  }

  console.log('\n=== 3. 데이터셋 ===');
  if (fs.existsSync(paths.casesPath)) console.log(`이미 있음: ${profile.load().repoRel(paths.casesPath)} (다시 만들려면 node scripts/run/prepare_dataset.js)`);
  else execFileSync(process.execPath, [path.join(__dirname, 'prepare_dataset.js')], { stdio: 'inherit' });

  console.log('\n준비 완료. 사전 점검: node scripts/run/run_all.js --dry-run');
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
