'use strict';
// 판정 호출 provider 선택. test.config.js judge.provider로 고른다(기본 openai).
// 모든 provider는 같은 형식을 따른다:
//   checkReady(judgeCfg)  — 호출 전 설정·키 확인(없으면 throw)
//   invoke({ job, kind, systemPrompt, schema, attempt, outDir, judgeCfg, root })
//     -> { text, latency_ms, usage, call_log, response_model? }

const PROVIDERS = {
  openai: () => require('./openai'),
  codex: () => require('./codex'),
};

function getProvider(name = 'openai') {
  const load = PROVIDERS[name];
  if (!load) throw new Error(`알 수 없는 Judge provider: ${name} (가능: ${Object.keys(PROVIDERS).join(', ')})`);
  return load();
}

// 판정 JSON 파싱(코드 블록으로 감싸 온 경우 대비)
function parseAnswer(text) {
  return JSON.parse(String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
}

// 배치 매니페스트에 고정하는 판정 설정(바뀌면 새 배치가 필요하다). API 키는 넣지 않는다.
function judgeSettings(judgeCfg) {
  return {
    provider: judgeCfg.provider || 'openai',
    model: judgeCfg.model || null,
    reasoning_effort: judgeCfg.reasoningEffort ?? null,
    temperature: judgeCfg.temperature ?? null,
    seed: judgeCfg.seed ?? null,
  };
}

module.exports = { getProvider, parseAnswer, judgeSettings };
