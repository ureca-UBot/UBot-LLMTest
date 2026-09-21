'use strict';
// 원커맨드 실행 (체크리스트 2번): 모델 하나에 대해 전체 평가 항목을 순서대로
// 전부 돌리는 단일 진입점. 각 단계는 기존 개별 스크립트를 그대로
// 서브프로세스로 호출함(로직 중복 없음, 개별 스크립트도 따로 그대로 쓸 수
// 있음 — 체크리스트 5번의 "개별 실행 스크립트"에 해당).
//
// Usage:
//   node scripts/run_pipeline.js <run_id> <model_tag> [--limit N] [--type T]
//     [--difficulty D] [--skip-repeat]
//
// run_id 컨벤션: <env>_<model>_<날짜> (예: local-win_gemma3-4b_20260917).
// 정해진 게 없으면 run_all_models.js가 자동으로 만들어줌.

const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
const { envTag } = require('./lib/platform');
const suitePaths = require('./lib/suite');

const SCRIPTS_DIR = __dirname;

function run(scriptName, args, label) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, scriptName), ...args], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`\n[run_pipeline] "${label}" 단계 실패 (${scriptName}, exit ${result.status}) — 여기서 중단합니다.`);
    console.error(`[run_pipeline] 원인 해결 후 같은 명령으로 다시 실행하면 run_generation.js는 이미 끝난 케이스는 건너뛰고 이어서 진행합니다.`);
    process.exit(result.status || 1);
  }
}

function parseArgs(argv) {
  const positional = [];
  const passthrough = [];
  let skipRepeat = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skip-repeat') { skipRepeat = true; continue; }
    if (['--limit', '--type', '--difficulty', '--run-id', '--temperature', '--seed', '--think'].includes(a)) {
      passthrough.push(a, argv[++i]);
    } else if (a === '--repeat-only') {
      // 값 없는 플래그 — run_generation.js로만 전달된다(채점 단계는 인자를 안 받음).
      passthrough.push(a);
    } else {
      positional.push(a);
    }
  }
  return { positional, passthrough, skipRepeat };
}

function main() {
  const { positional, passthrough, skipRepeat } = parseArgs(process.argv.slice(2));
  const [runId, modelTag] = positional;
  if (!runId || !modelTag) {
    console.error('usage: node scripts/run_pipeline.js <run_id> <model_tag> [--limit N] [--type T] [--difficulty D]\n  [--skip-repeat] [--repeat-only] [--temperature N] [--seed N] [--think true|false]');
    process.exit(1);
  }

  const startedAt = Date.now();
  console.log(`파이프라인 시작: run_id=${runId} model=${modelTag} env=${envTag()} suite=${suitePaths.suiteTag()}`);

  run('run_generation.js', [runId, modelTag, ...passthrough], '1/9 모델 생성 (항목6·7 원자료 포함)');
  run('score_format_performance.js', [runId], '2/9 항목6·7 채점 (포맷·성능)');
  run('score_answer_accuracy.js', [runId], '3/9 항목1 채점 (답변정확도)');
  run('score_rag_faithfulness.js', [runId], '4/9 항목2 채점 (RAG충실도)');
  run('score_absence_detection.js', [runId], '5/9 항목3 채점 (FAQ부재판단)');
  run('score_expression_quality.js', [runId], '6/9 항목5 채점 (표현품질)');
  if (!skipRepeat) {
    run('score_repeat_consistency.js', [runId], '7/9 반복 일관성 채점');
  } else {
    console.log('\n=== 7/9 반복 일관성 채점 (--skip-repeat로 건너뜀) ===');
  }
  run('score_escalation.js', [runId], '8/9 LLM 재판단 필요 여부 판정');
  run('build_review_export.js', [runId], '9/9 사람이 읽을 통합 결과 파일 생성');
  run('aggregate_report.js', [runId], '종합 리포트 생성');

  const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\n파이프라인 완료 (${elapsedMin}분). 결과:`);
  const suite = suitePaths.suiteTag();
  console.log(`  - 사람이 읽을 통합 파일: results/scored/${suite}/${runId}/review.csv`);
  console.log(`  - 종합 리포트: results/reports/${suite}/${runId}_summary.md`);
}

main();
