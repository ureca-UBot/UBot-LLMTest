'use strict';
// Standalone evaluation entry point. NEVER invokes run_pipeline/run_generation.
const { run } = require('./lib/llm_judge_runner');
async function main() {
    await run('accuracy');
    await run('safety');
}
main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
