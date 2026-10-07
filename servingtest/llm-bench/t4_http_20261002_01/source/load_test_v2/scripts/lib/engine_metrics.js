'use strict';
// 버전에서 제공하지 않는 gauge는 null. 5초 표본의 최대값이며 순간 peak 보장은 아니다.
const names = {
  'llama.cpp': ['llamacpp:requests_processing', 'llamacpp:requests_deferred'],
  vllm: ['vllm:num_requests_running', 'vllm:num_requests_waiting'],
  sglang: ['sglang:num_running_reqs', 'sglang:num_queue_reqs'],
};
function parseMetrics(engine, text) {
  const gauge = (name) => {
    const values = text.split('\n').filter((line) => line.startsWith(name + ' ') || line.startsWith(name + '{'))
      .map((line) => Number(line.replace(/^[^{\s]+(?:\{.*\})?\s+/, '').split(/\s+/)[0])).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  };
  const [running, queued] = names[engine];
  return { raw: text, running: gauge(running), queued: gauge(queued) };
}
module.exports = { parseMetrics };
