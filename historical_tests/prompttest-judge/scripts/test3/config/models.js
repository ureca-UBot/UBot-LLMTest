'use strict';
// test3(EC2 라운드) 대상 모델 7개.
//
// - selected: test2(로컬 9개, 2026-09-17/18)에서 1차 통과한 5개. EC2에서 다시
//   돌리는 이유는 품질 재측정이 아니라 **동일 하드웨어 기준선** 확보다. 이게
//   없으면 12B/14B와의 속도 차이가 모델 차이인지 하드웨어 차이인지 못 가른다.
// - ec2Only: 로컬 VRAM(12GB) 부족으로 test2에서 아예 제외됐던 대형 2개.
//   test3의 실질적 1순위 목적이다.
//
// thinkCapable: Qwen3 계열만 추론(thinking) 모드를 갖는다. gemma3·exaone3.5는
// 해당 없으므로 추론 on/off 비교(run_think_ablation.js) 대상에서 자동 제외된다.

const selected = [
  { tag: 'gemma3:4b', tier: 'selected', thinkCapable: false },
  { tag: 'qwen3:1.7b', tier: 'selected', thinkCapable: true },
  { tag: 'qwen3:4b', tier: 'selected', thinkCapable: true },
  { tag: 'qwen3:8b', tier: 'selected', thinkCapable: true },
  { tag: 'exaone3.5:7.8b', tier: 'selected', thinkCapable: false },
];

const ec2Only = [
  { tag: 'gemma3:12b', tier: 'ec2_only', thinkCapable: false },
  { tag: 'qwen3:14b', tier: 'ec2_only', thinkCapable: true },
];

module.exports = {
  suite: 'test3',
  selected,
  ec2Only,
  all: [...selected, ...ec2Only],
  thinkCapable: [...selected, ...ec2Only].filter((m) => m.thinkCapable),
  // 채점 단계가 쓰는 임베딩 모델 — test2와 동일해야 점수가 비교 가능하다.
  embeddingModel: 'bge-m3:latest',
  // 운영 설정으로 확정한 값. 근거는 results/test3/methodology.md 참고.
  operatingTemperature: 0,
  // test2가 돌아간 조건(Ollama 기본값). 대조군 라운드에서 이 값을 쓴다.
  baselineTemperature: 0.8,
};
