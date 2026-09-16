'use strict';
// 테스트 환경 자동 설치 (체크리스트 1번). 멱등(idempotent) — 이미 되어있는
// 단계는 건너뜀. Windows(로컬)/Linux(EC2) 공통 스크립트, 분기는
// lib/platform.js에만 있음.
//
// 하는 일:
//   1. Python venv(.venv_nli) 생성 + KLUE-NLI 의존성 설치
//   2. Ollama 설치 여부 확인 (자동 설치는 안 함 — OS별 설치 방식이 달라
//      권한 문제가 크므로, 없으면 안내만 하고 중단)
//   3. bge-m3 + config/models.js에 정의된 모델(현재 OS 티어) pull
//   4. data/eval_sets/test_set2/*.csv 생성 (prepare_test_set2.js)
//
// Usage: node scripts/setup_env.js [--tier local|ec2|all] [--skip-models]

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ROOT, IS_WINDOWS, VENV_DIR, VENV_PYTHON, envTag } = require('./lib/platform');
const models = require('./config/models');

function parseArgs(argv) {
  let tier = IS_WINDOWS ? 'local' : 'ec2';
  let skipModels = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tier') tier = argv[++i];
    if (argv[i] === '--skip-models') skipModels = true;
  }
  return { tier, skipModels };
}

function step(label, fn) {
  console.log(`\n=== ${label} ===`);
  fn();
}

function checkCommand(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return r.status === 0;
}

function main() {
  const { tier, skipModels } = parseArgs(process.argv.slice(2));
  console.log(`환경 설치 시작 (env=${envTag()}, tier=${tier})`);

  step('1. Python venv (.venv_nli) 확인/생성', () => {
    if (fs.existsSync(VENV_PYTHON)) {
      console.log(`이미 있음: ${VENV_PYTHON}`);
    } else {
      const pythonCmd = IS_WINDOWS ? 'python' : 'python3';
      if (!checkCommand(pythonCmd, ['--version'])) {
        console.error(`${pythonCmd}를 찾을 수 없습니다. Python 3.10+ 먼저 설치해주세요.`);
        console.error(IS_WINDOWS
          ? '  Windows: https://www.python.org/downloads/ 에서 설치 (Add to PATH 체크)'
          : '  Linux: sudo apt install python3 python3-venv');
        process.exit(1);
      }
      console.log(`venv 생성 중: ${VENV_DIR}`);
      execFileSync(pythonCmd, ['-m', 'venv', VENV_DIR], { stdio: 'inherit' });
    }

    const pipExe = IS_WINDOWS ? path.join(VENV_DIR, 'Scripts', 'pip.exe') : path.join(VENV_DIR, 'bin', 'pip');
    const requirementsPath = path.join(ROOT, 'scripts', 'test2', 'python_nli', 'requirements.txt');

    // torch가 이미 깔려있는지 확인(재설치 스킵용 — pip install -r은 이미
    // 만족된 패키지는 알아서 스킵하긴 하지만, 첫 설치 시 CPU 전용 인덱스가
    // 필요한 torch만 먼저 깐 뒤 나머지를 설치함).
    const torchCheck = spawnSync(VENV_PYTHON, ['-c', 'import torch'], { encoding: 'utf8' });
    if (torchCheck.status !== 0) {
      console.log('torch 설치 중 (CPU 버전)...');
      if (IS_WINDOWS) {
        execFileSync(pipExe, ['install', 'torch', '--index-url', 'https://download.pytorch.org/whl/cpu'], { stdio: 'inherit' });
      } else {
        execFileSync(pipExe, ['install', 'torch'], { stdio: 'inherit' });
      }
    } else {
      console.log('torch 이미 설치됨.');
    }
    console.log('나머지 requirements.txt 설치 중...');
    execFileSync(pipExe, ['install', '-r', requirementsPath], { stdio: 'inherit' });
  });

  step('2. Ollama 설치 확인', () => {
    if (!checkCommand('ollama', ['--version'])) {
      console.error('Ollama가 설치돼 있지 않습니다. https://ollama.com/download 에서 설치 후 다시 실행하세요.');
      process.exit(1);
    }
    console.log('Ollama 확인됨.');
  });

  if (!skipModels) {
    step('3. Ollama 모델 pull', () => {
      const modelTags = [models.embeddingModel];
      const tierModels = tier === 'all' ? [...models.local, ...models.ec2] : (models[tier] || []);
      modelTags.push(...tierModels.map((m) => m.tag));

      for (const tag of modelTags) {
        console.log(`pull: ${tag}`);
        const r = spawnSync('ollama', ['pull', tag], { stdio: 'inherit' });
        if (r.status !== 0) {
          console.error(`  ${tag} pull 실패 — 수동으로 "ollama pull ${tag}" 다시 시도해주세요.`);
        }
      }
    });
  } else {
    console.log('\n=== 3. Ollama 모델 pull (--skip-models로 건너뜀) ===');
  }

  step('4. 평가 데이터 CSV 생성', () => {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'test2', 'prepare_test_set2.js')], { stdio: 'inherit' });
  });

  console.log('\n환경 설치 완료. 이제 다음으로 실행할 수 있습니다:');
  console.log('  node scripts/run_pipeline.js <run_id> <model_tag>      # 모델 하나');
  console.log('  node scripts/run_all_models.js                         # config/models.js의 전체 모델');
}

main();
