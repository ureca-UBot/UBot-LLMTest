# 모델별 VRAM 실측 (항목8)

측정 환경: ec2-linux · GPU: Tesla T4
측정 시각: 2026-09-21T02:46:57.515Z

## 측정 방법

모델을 하나씩만 올려놓고 잰다. 이전 모델을 언로드 → 유휴 기준선 측정 → 워밍업 1건으로
로드 → `/api/ps`의 모델별 `size_vram`과 `nvidia-smi` 전체값을 동시에 기록 → 기준선 차감.

## 결과

| 모델 | 구분 | size_vram | 모델 크기 | 순증분(nvidia-smi) | GPU 전량 적재 | 로드 시간 |
|---|---|---|---|---|---|---|
| gemma3:4b | 선별 5 | 2742 MiB | 2742 MiB | 3759 MiB | O | 29.2s |
| qwen3:1.7b | 선별 5 | 1624 MiB | 1624 MiB | 1767 MiB | O | 13.5s |
| qwen3:4b | 선별 5 | 3031 MiB | 3031 MiB | 3159 MiB | O | 30.3s |
| qwen3:8b | 선별 5 | 5320 MiB | 5320 MiB | 5463 MiB | O | 45.7s |
| exaone3.5:7.8b | 선별 5 | 4945 MiB | 4945 MiB | 5071 MiB | O | 38.9s |
| gemma3:12b | EC2 전용 | 7672 MiB | 7672 MiB | 8875 MiB | O | 71.5s |
| qwen3:14b | EC2 전용 | 9199 MiB | 9199 MiB | 9345 MiB | O | 80.5s |

- **`size_vram`** — Ollama가 보고하는 그 모델의 VRAM 점유량. "모델별 값"은 이쪽이다.
- **순증분** — `nvidia-smi` 전체값에서 유휴 기준선을 뺀 값. `size_vram`과 크게 다르면
  GPU를 쓰는 다른 프로세스가 있다는 뜻이다.
- **GPU 전량 적재 = X** — 모델 일부가 CPU로 내려갔다는 뜻이며, 그 모델은 지연이 크게
  나빠진다. 대형 모델이 느릴 때 원인을 가르는 핵심 신호다.

> size_vram_mib는 Ollama /api/ps의 모델별 값, delta_mib는 nvidia-smi 전체값에서 유휴 기준선을 뺀 순증분이다. 둘이 크게 다르면 GPU를 쓰는 다른 프로세스가 있다는 뜻이다.

## 근거 문서

이 문서의 수치와 사례는 아래 run별 세부 결과에서 나왔다.

| 모델 | 조건 | 세부 결과 (report) | LLM Judge 문항별 판정 |
|---|---|---|---|
| exaone3-5-7-8b | 본측정 (temp 0, 추론 ON) | [ec2-linux_exaone3-5-7-8b_t0_think_20260920_summary.md](../report/ec2-linux_exaone3-5-7-8b_t0_think_20260920_summary.md) | [ec2-linux_exaone3-5-7-8b_t0_think_20260920.md](../llm_judge/t0_think/ec2-linux_exaone3-5-7-8b_t0_think_20260920.md) |
| gemma3-12b | 본측정 (temp 0, 추론 ON) | [ec2-linux_gemma3-12b_t0_think_20260920_summary.md](../report/ec2-linux_gemma3-12b_t0_think_20260920_summary.md) | [ec2-linux_gemma3-12b_t0_think_20260920.md](../llm_judge/t0_think/ec2-linux_gemma3-12b_t0_think_20260920.md) |
| gemma3-4b | 본측정 (temp 0, 추론 ON) | [ec2-linux_gemma3-4b_t0_think_20260920_summary.md](../report/ec2-linux_gemma3-4b_t0_think_20260920_summary.md) | [ec2-linux_gemma3-4b_t0_think_20260920.md](../llm_judge/t0_think/ec2-linux_gemma3-4b_t0_think_20260920.md) |
| qwen3-1-7b | 본측정 (temp 0, 추론 ON) | [ec2-linux_qwen3-1-7b_t0_think_20260920_summary.md](../report/ec2-linux_qwen3-1-7b_t0_think_20260920_summary.md) | [ec2-linux_qwen3-1-7b_t0_think_20260920.md](../llm_judge/t0_think/ec2-linux_qwen3-1-7b_t0_think_20260920.md) |
| qwen3-14b | 본측정 (temp 0, 추론 ON) | [ec2-linux_qwen3-14b_t0_think_20260920_summary.md](../report/ec2-linux_qwen3-14b_t0_think_20260920_summary.md) | [ec2-linux_qwen3-14b_t0_think_20260920.md](../llm_judge/t0_think/ec2-linux_qwen3-14b_t0_think_20260920.md) |
| qwen3-4b | 본측정 (temp 0, 추론 ON) | [ec2-linux_qwen3-4b_t0_think_20260920_summary.md](../report/ec2-linux_qwen3-4b_t0_think_20260920_summary.md) | [ec2-linux_qwen3-4b_t0_think_20260920.md](../llm_judge/t0_think/ec2-linux_qwen3-4b_t0_think_20260920.md) |
| qwen3-8b | 본측정 (temp 0, 추론 ON) | [ec2-linux_qwen3-8b_t0_think_20260920_summary.md](../report/ec2-linux_qwen3-8b_t0_think_20260920_summary.md) | [ec2-linux_qwen3-8b_t0_think_20260920.md](../llm_judge/t0_think/ec2-linux_qwen3-8b_t0_think_20260920.md) |

