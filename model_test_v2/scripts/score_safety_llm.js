'use strict';
require('./lib/llm_judge_runner').run('safety').catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
