# test3 (EC2 라운드) 종합 결과

생성 시각: 2026-09-22T06:42:57.499Z

## 측정 조건

- 대상: **7개 모델** (test2에서 1차 선별한 5개 + 로컬 VRAM 부족으로 제외됐던 EC2 전용 2개)
- 평가 데이터셋: `data/eval_sets/test_set2/cases.csv` 380행 (고유 300 + 반복 40문항×3회차) — test2와 동일
- **temperature = 0** (운영 설정), 추론(thinking) 모드 켬
- seed 미고정 — temperature=0은 greedy decoding이라 seed를 쓰지 않는다

## temperature 설정의 근거

> Ollama 기본값(temperature 0.8)에서 측정한 결과, 상위 모델조차 반복 일관성이 45~52%였다. 같은 질문에 절반은 다르게 답한다는 뜻이다. FAQ 상담봇에 부적합하다고 판단해 운영 설정을 temperature=0으로 확정했고, EC2 테스트는 그 조건에서 측정했다.

## 한눈에 보기

![지연 대비 정확도 파레토 프론티어](charts/pareto.svg)

선 위의 설정은 "더 빠르면서 더 정확한 대안이 없는" 설정이다. 빈 원은 그런 대안이 있어 탈락한 설정이다.

![프론티어 구간별 한계 효율](charts/marginal_efficiency.svg)

![test3 본측정 핵심 지표](charts/core_metrics.svg)

## 모델별 결과

| 모델 | 구분 | 내용 정확도(AI) | 근거율(AI) | 기대 상태 일치 | 부재판단 F1 | 포맷 성공률 | 반복 일관성 | 평균 지연 | P95 |
|---|---|---|---|---|---|---|---|---|---|
| gemma3:4b | 선별 5 | 31.3% | 49.7% | 43.0% | 0.187 | 99.7% | 87.5% | 1.83s | 2.78s |
| qwen3:1.7b | 선별 5 | 39.0% | 57.0% | 58.3% | 0.257 | 100.0% | 57.5% | 3.16s | 5.04s |
| qwen3:4b | 선별 5 | 72.3% | 86.3% | 82.3% | 0.764 | 99.3% | 60.0% | 18.78s | 47.62s |
| qwen3:8b | 선별 5 | 59.7% | 73.2% | 64.3% | 0.204 | 99.3% | 62.5% | 11.59s | 18.33s |
| exaone3.5:7.8b | 선별 5 | 37.3% | 46.7% | 47.7% | 0.000 | 100.0% | 90.0% | 3.31s | 5.65s |
| gemma3:12b | EC2 전용 | 64.0% | 78.7% | 71.7% | 0.746 | 100.0% | 95.0% | 4.45s | 7.28s |
| qwen3:14b | EC2 전용 | 75.6% | 75.3% | 79.7% | 0.652 | 99.7% | 77.5% | 18.24s | 28.49s |

- 내용 정확도·근거율은 LLM Judge 전수 채점 결과다([llm_judge_review/metrics.json](llm_judge_review/metrics.json), 해석은 [interpretation.md](llm_judge_review/interpretation.md)).
  내용 정확도는 CORRECT 판정 비율, 근거율은 실질적 환각(근거 1~3점)이 없는 답변의 비율(= 1 − 환각률)이다.
  분모는 채점에 성공한 답변 수다 — qwen3:8b 298문항, qwen3:14b 299문항이고 나머지는 300문항이다.
- exaone3.5:7.8b의 부재판단 F1 `0.000`은 기대 ABSTAIN 문항 중 0문항을 맞혀(TP=0)
  정밀도·재현율이 모두 0인 결과다. 채점기는 0/0 나눗셈을 `null`로 내보내지만 관례상 F1은 0이다.
- **결정론 채점기의 RAG 충실도(`rag_faithfulness.jsonl`)는 이 표에 넣지 않았다.**
  `scripts/test2/score_rag_faithfulness.js`의 premise 누락이 고쳐지지 않아 모델 순위가 역전되기 때문이다.
  자세한 내용은 [methodology.md](methodology.md) 참고.

## 함께 볼 문서

- [측정 방법과 한계](methodology.md)
- [추론 모드 on/off 트레이드오프](think_ablation_results.md)
- [temperature 0 vs 0.8 대조](temperature_comparison.md)
- [모델별 VRAM 실측](vram_results.md)
