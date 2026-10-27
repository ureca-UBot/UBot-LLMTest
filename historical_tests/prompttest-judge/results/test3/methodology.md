# test3 측정 방법과 한계

## 왜 EC2에서 다시 측정하는가

1. **로컬에서 못 돌린 대형 모델 측정** — `gemma3:12b`·`qwen3:14b`는 로컬 GPU(12GB) 부족으로
   test2 대상에서 아예 빠져 있었다. 이번 라운드의 실질적 1순위 목적이다.
2. **동일 하드웨어 기준선** — 선별 5개를 같은 GPU에 올려야 12B/14B와의 속도 차이가
   모델 차이인지 하드웨어 차이인지 구분된다.
3. **운영 파라미터 확정** — temperature 설정의 타당성 실측.
4. **추론 모드 트레이드오프** — test1·test2 모두 추론을 켠 채로만 돌렸다.

## temperature

> Ollama 기본값(temperature 0.8)에서 측정한 결과, 상위 모델조차 반복 일관성이 45~52%였다. 같은 질문에 절반은 다르게 답한다는 뜻이다. FAQ 상담봇에 부적합하다고 판단해 운영 설정을 temperature=0으로 확정했고, EC2 테스트는 그 조건에서 측정했다.

**주의:** temperature=0에서 반복 일관성이 100%에 가깝게 나오는 것은 모델이 좋아진 결과가
아니라 샘플링을 끈 당연한 결과다. 실제 개선 여부를 보려면 같은 EC2 하드웨어 위에서 돌린
대조군(temperature 0.8, 반복 40문항)과 비교해야 한다 →
[temperature_comparison.md](temperature_comparison.md)

## seed

seed는 **고정하지 않았다.** temperature=0은 greedy decoding(argmax)이라 난수를 쓰지 않으므로
본 측정에는 영향이 없다. 대신 어떤 파라미터로 돌렸는지를 생성 레코드의 `gen_params` 필드에
남겨 사후 확인이 가능하게 했다.

전역으로 seed를 고정하지 않은 이유도 함께 기록한다 — 반복 40문항은 ID만 다르고 프롬프트가
동일하므로, 전역 시드를 박으면 세 회차가 글자 단위로 같은 답을 내고 반복 일관성이 자동으로
100%가 된다. 이는 지표의 개선이 아니라 측정 대상의 소멸이다.

## 알려진 한계

- test2는 local-win(RTX 4070 Ti, temperature 0.8 = Ollama 기본값), test3은 ec2-linux(temperature 0)이다.
- 하드웨어가 함께 바뀌었으므로 두 라운드 간 속도(지연/TPS) 비교는 하지 않는다.
- temperature 효과만 보려면 같은 EC2 위의 대조군(t08_think, 반복 40문항)과 비교한다.
- gemma3:12b / qwen3:14b는 test2에 데이터가 없어 test3 단독 값만 싣는다.
- temp=0에서 반복 일관성이 100%에 가까운 것은 개선이 아니라 샘플링을 끈 결과다.
- **RAG 충실도(결정론 채점기)의 premise 누락은 이번에도 고치지 않았다.** `score_rag_faithfulness.js:56`이
  NLI premise에 `제공 Context`만 넣고 `사용자 정보 / API 결과`·`대화 이력`을 빼고 있어,
  해당 입력을 쓰는 유형에서 구조적으로 실패한다. 절대값은 실제 근거율보다 낮다.
  다만 편향이 모델에 고루 걸린다는 것을 확인해(`verify_rag_rule_ranking.js`) summary 표에는
  신뢰구간과 함께 다시 실었다. 구간이 겹치지 않는 쌍끼리만 비교하고, 환각 판단의 기준은
  여전히 LLM Judge다.

## 실행 순서

자세한 명령은 [../../scripts/test3/SETUP.md](../../scripts/test3/SETUP.md) 참고.
