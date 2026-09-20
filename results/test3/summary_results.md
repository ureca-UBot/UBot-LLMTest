# test3 (EC2 라운드) 종합 결과

생성 시각: 2026-09-20T02:36:28.558Z

## 측정 조건

- 대상: **7개 모델** (test2에서 1차 선별한 5개 + 로컬 VRAM 부족으로 제외됐던 EC2 전용 2개)
- 평가 데이터셋: `data/eval_sets/test_set2/cases.csv` 380행 (고유 300 + 반복 40문항×3회차) — test2와 동일
- **temperature = 0** (운영 설정), 추론(thinking) 모드 켬
- seed 미고정 — temperature=0은 greedy decoding이라 seed를 쓰지 않는다

## temperature 설정의 근거

> Ollama 기본값(temperature 0.8)에서 측정한 결과, 상위 모델조차 반복 일관성이 45~52%였다. 같은 질문에 절반은 다르게 답한다는 뜻이다. FAQ 상담봇에 부적합하다고 판단해 운영 설정을 temperature=0으로 확정했고, EC2 테스트는 그 조건에서 측정했다.

## 모델별 결과

| 모델 | 구분 | 내용 정확도(AI) | 근거율(AI) | 기대 상태 일치 | 부재판단 F1 | 포맷 성공률 | 반복 일관성 | 평균 지연 | P95 |
|---|---|---|---|---|---|---|---|---|---|
| gemma3:4b | 선별 5 | - | - | - | - | - | - | - | - |
| qwen3:1.7b | 선별 5 | - | - | - | - | - | - | - | - |
| qwen3:4b | 선별 5 | - | - | - | - | - | - | - | - |
| qwen3:8b | 선별 5 | - | - | - | - | - | - | - | - |
| exaone3.5:7.8b | 선별 5 | - | - | - | - | - | - | - | - |
| gemma3:12b | EC2 전용 | - | - | - | - | - | - | - | - |
| qwen3:14b | EC2 전용 | - | - | - | - | - | - | - | - |

- 내용 정확도·근거율은 LLM Judge(`accuracy_hallucination_llm_summary.json`) 값이다.
  아직 채점하지 않았으면 `-`로 표시된다.
- **결정론 채점기의 RAG 충실도(`rag_faithfulness.jsonl`)는 이 표에 넣지 않았다.**
  `scripts/test2/score_rag_faithfulness.js`의 premise 누락이 고쳐지지 않아 모델 순위가 역전되기 때문이다.
  자세한 내용은 [methodology.md](methodology.md) 참고.

## 함께 볼 문서

- [측정 방법과 한계](methodology.md)
- [추론 모드 on/off 트레이드오프](think_ablation_results.md)
- [temperature 0 vs 0.8 대조](temperature_comparison.md)
- [모델별 VRAM 실측](vram_results.md)
