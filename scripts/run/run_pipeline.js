'use strict';
// run 하나(모델 1개 × 선택된 케이스)의 전체 단계: 생성 -> 결정론 채점 -> 통합 CSV -> 보고서.
// 각 단계는 독립 스크립트이고 여기서는 순서대로 호출만 한다. 기준이 바뀌면 그 단계
// 스크립트만 다시 돌리면 된다. LLM Judge는 외부 전송 승인이 필요해 여기 넣지 않는다.
//
// Usage:
//   node scripts/run/run_pipeline.js <run_id> <model_tag> [--condition C] [--size N]
//     [--items A,B] [--difficulty D] [--limit N] [--test v4] [--try try1]
// 보통은 run_all.js / run_model.js / run_item.js가 run_id를 만들어 이걸 호출한다.

const path = require('path');
const { spawnSync } = require('child_process');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs, toArgs } = require('../lib/args');

// [scripts/ 아래 경로, 이름] — 생성(run/) → 결정론 채점(score/) → 문서 생성(docgen/)
const STEPS = [
  ['run/run_generation.js', '생성'],
  ['score/score_format_performance.js', '포맷·성능'],
  ['score/score_status.js', '기대 상태 판단'],
  ['score/score_evidence.js', '근거 채택(evidence_ids vs 정답 문서)'],
  ['score/score_answer_similarity.js', '정답 유사도·키워드'],
  ['score/score_rag_grounding.js', '근거(NLI·숫자) — 참고'],
  ['score/score_expression_rules.js', '표현 규칙'],
  ['score/score_repeat_consistency.js', '반복 일관성'],
  ['docgen/build_review_export.js', '통합 CSV'],
  ['docgen/build_run_report.js', 'run 보고서'],
];
const SCRIPTS_ROOT = path.join(__dirname, '..');
const stepName = (file) => path.basename(file, '.js'); // config.pipeline.skip은 파일 이름(확장자 없이)으로 지정

function main() {
  const { positional, opts } = parseRunArgs(argv);
  const [runId, modelTag] = positional;
  if (!runId || !modelTag) {
    console.error('usage: node scripts/run/run_pipeline.js <run_id> <model_tag> [--condition C] [--size N] [--items A,B] [--difficulty D] [--limit N]');
    process.exit(1);
  }
  const { config, label } = profile.load();
  const skip = new Set((config.pipeline && config.pipeline.skip) || []);
  const env = { ...process.env, LLM_TEST: profile.load().versionDirName, LLM_TEST_TRY: profile.load().tryTag };
  const started = Date.now();
  console.log(`파이프라인 [${label}] run_id=${runId} model=${modelTag}`);

  const steps = STEPS.filter(([file]) => !skip.has(stepName(file)));
  steps.forEach(([file, name], idx) => {
    console.log(`\n=== ${idx + 1}/${steps.length} ${name} (${file}) ===`);
    const args = stepName(file) === 'run_generation'
      ? [runId, modelTag, ...toArgs(opts, ['condition', 'size', 'items', 'difficulty', 'limit'])]
      : [runId];
    const res = spawnSync(process.execPath, [path.join(SCRIPTS_ROOT, file), ...args], { stdio: 'inherit', env });
    if (res.status !== 0) {
      console.error(`\n[run_pipeline] "${name}" 단계 실패(exit ${res.status}). 원인을 고친 뒤 같은 명령을 다시 실행하면 생성은 끝난 케이스를 건너뛴다.`);
      process.exit(res.status || 1);
    }
  });
  if (skip.size) console.log(`\n건너뛴 단계: ${[...skip].join(', ')}`);
  console.log(`\n파이프라인 완료 (${((Date.now() - started) / 60000).toFixed(1)}분)`);
}

main();
