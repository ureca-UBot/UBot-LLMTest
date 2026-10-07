'use strict';
// 동시성(부하) 테스트 설정 — 팀 합의안(2026-09-30)에 2026-10-01 출력 상한을 추가.
// 값을 바꾸면 결과 비교가 깨지므로, 바꿀 때는 SETUP.md의 변경 기록에도 남긴다.
//
// 프로파일
//   full  : 실제 EC2 측정용 (기본)
//   quick : 스크립트 동작 확인용. 시간을 크게 줄인 값이라 결과를 판단에 쓰면 안 된다.

const models = [
  // think: undefined → 요청 body에 think를 아예 넣지 않는다 (gemma3는 추론 모드가 없고,
  //        보내면 Ollama가 400을 낸다).
  // think: false     → Qwen3 추론 OFF.
  { tag: 'gemma3:4b', think: undefined, cond: 't0_ctx4096_out512_sample300_load', baselineP50Sec: 1.5 },
  { tag: 'qwen3:4b', think: false, cond: 't0_nothink_ctx4096_out512_sample300_load', baselineP50Sec: 1.6 },
  { tag: 'qwen3:8b', think: false, cond: 't0_nothink_ctx4096_out512_sample300_load', baselineP50Sec: 2.6 },
  { tag: 'qwen3:14b', think: false, cond: 't0_nothink_ctx4096_out512_sample300_load', baselineP50Sec: 5.0 },
];

const full = {
  profile: 'full',

  // 모든 요청에 똑같이 보내는 생성 설정. num_ctx가 요청마다 다르면 Ollama가 모델을
  // 다시 불러오므로 절대 섞지 않는다.
  generation: {
    temperature: 0,
    num_ctx: 4096,
    num_predict: 512, // 출력 토큰 상한. 먼저 EOS가 나오면 512개보다 적게 생성한다.
    format: 'json',
    keepAlive: -1, // 요청 단위 keep_alive (모델 상주)
  },

  // Ollama 서버 환경변수. 바꿀 때마다 서버 재시작이 필요하다(스크립트가 처리).
  server: {
    maxQueue: 512, // Ollama 기본값. 대기열 초과(503)가 나는지도 기록한다.
    maxLoadedModels: 1, // 한 번에 한 모델만 GPU에
    flashAttention: '0', // 이번 테스트는 OFF로 고정 (최종 튜닝 때 따로 비교)
    kvCacheType: 'f16', // 이번 테스트는 기본값 고정
    keepAlive: '24h',
  },

  // ① 단계적 증가
  ladder: {
    parallels: [2, 4, 8, 16], // OLLAMA_NUM_PARALLEL
    users: [1, 2, 4, 8, 16, 32, 64], // 동시 사용자(가짜 사용자) 수
    measureMs: 60_000, // 워밍업 후 측정 시간
    minRequests: 40, // 단계마다 최소 측정 요청 수
    maxStepMs: 240_000, // 한 단계 최대 시간 (느린 모델이 무한히 붙잡지 않게)
  },

  // 단계 멈춤 조건 — 하나라도 걸리면 그 라운드(동시 처리 수)를 끝낸다.
  stop: {
    p95E2eMs: 10_000, // 전체 응답 P95 10초 초과
    failRate: 0.05, // 실패율 5% 초과
    minGain: 0.10, // 사용자를 2배로 늘려도 처리량 증가 10% 미만
    maxUsers: 64,
  },

  // 동시 처리 수를 2배로 올려도 최대 처리량이 10% 미만 늘면 그 위는 재지 않는다.
  parallelMinGain: 0.10,

  // 판단 기준(상담 실용선). 최적 설정 선택과 보고서 표시에 쓴다.
  slo: { e2eP95Ms: 5_000, e2eP95SoftMs: 3_000, failRate: 0.05 },

  // 클라이언트 타임아웃. 이 시간 안에 답이 끝나지 않으면 실패로 센다.
  requestTimeoutMs: 30_000,

  // ② 스파이크 — 최적 설정에서 모델당 1회
  spike: { users: 100 },

  // ③ 도착률 테스트 — 최적 설정의 최대 처리량(capacity)에 배수를 곱한 속도로 보낸다.
  arrival: {
    factors: [0.25, 0.5, 0.75, 1.0, 1.25],
    durationMs: 60_000,
    abortFailRate: 0.5, // 한 단계 실패율이 50%를 넘으면 더 빠른 단계는 생략
    maxInFlight: 256,
  },

  // ④ 반복 측정 — 최적 설정의 단계적 증가를 추가로 2번 (1회차 포함 총 3회)
  repeats: { extra: 2 },

  // 전체 계획 시간. 초과는 경고만 남기며 모델·반복 측정을 시간 때문에 생략하지 않는다.
  budgetMs: 3.5 * 3600 * 1000,

  // 서버 재시작·모델 로딩에 걸리는 대략적인 시간 (예산 계산용)
  restartOverheadMs: 60_000,

  seed: 20261001, // 질문 무작위 순서 (네 모델이 같은 순서를 받는다)
  monitorIntervalMs: 1000,
};

const quick = {
  ...full,
  profile: 'quick',
  ladder: { parallels: [2, 4, 8, 16], users: [1, 2, 4, 8, 16], measureMs: 4_000, minRequests: 6, maxStepMs: 15_000 },
  stop: { ...full.stop, maxUsers: 16 },
  requestTimeoutMs: 8_000,
  spike: { users: 30 },
  arrival: { ...full.arrival, durationMs: 3_000 },
  budgetMs: 30 * 60 * 1000,
  restartOverheadMs: 5_000,
};

function loadConfig(profile = 'full') {
  const base = profile === 'quick' ? quick : profile === 'full' ? full : null;
  if (!base) throw new Error(`알 수 없는 프로파일: ${profile} (full | quick)`);
  return JSON.parse(JSON.stringify({ ...base, models }));
}

module.exports = { loadConfig, models };
