# 실행 상세 — 정상 FAQ 1,000건 기준점

## 확인한 결과

원본 질문 1,000개에 대해 임베딩·검색·LLM 응답을 저장했습니다. LLM 생성 1,000건, 실행 오류 0건, finish_reason `stop` 1,000건입니다. **내용 정답·환각 여부는 평가 전입니다.**

| 계측 | 값 | 해석 |
|---|---|---|
| 원본 FAQ top1 / top3 | 1,000 / 1,000 | 원본 질문 자체가 검색 자료에 포함된 조건 |
| 검색 자료 임베딩 | 5,170개 | 새 EC2 BGE-m3 호출 |
| 질문 임베딩 | 1,000개 | 새 EC2 BGE-m3 호출 |
| 임베딩 단계 시간 | 13.009초 | 요청 분할과 검색 자료·질문 임베딩 단계 포함 |
| LLM 평균 / 중앙값 / P95 | 2.697 / 2.520 / 4.383초 | 순차 생성, 모델 로딩 제외 |
| LLM 단계 경과 | 2701.402초, 약 45.0분 | 임베딩과 모델 기동 시간을 더한 총 작업 시간은 아님 |
| 모델 자체 status | ANSWER 672 / PARTIAL 320 / ABSTAIN 8 | 정확도·거절 적절성 판정이 아님 |
| 내부 FAQ 표시 | 78건 | 형식 문제 관찰, 내용 오답 수가 아님 |

가중치·출처·프롬프트·요청·벡터·검색·서비스 보존 등 [원본 실행 검증](execution_verification.json)의 23개 검사에 이상이 없었습니다. 23개는 실행 자료의 일관성 검사이며 1,000답변의 의미 평가를 대신하지 않습니다.

## 실제 제공 자료와 질문별 답변

[100건씩 읽는 목차](../summary/answers/README.md), [원본 전체 Markdown](../summary/answers.md)과 [CSV](../summary/answers.csv)에 질문, 검색 FAQ, 모델 답변이 있습니다. Markdown의 ‘실제 제공 FAQ’는 각 요청에 들어간 근거입니다. JSONL의 `parsed.answer`는 LLM 답변이며 가드 처리를 거친 최종 서비스 응답이 아닙니다. 최상위 `answer`는 원본 FAQ의 참조 답변이므로 모델 응답과 혼동하면 안 됩니다.

원자료는 [results.jsonl](../raw/ec2-linux_redhat-qwen3-4b-instruct-2507-w4a16_t0_question-retrieval_core1000_20261016/results.jsonl), 실제 요청은 [llm_requests.jsonl](../raw/ec2-linux_redhat-qwen3-4b-instruct-2507-w4a16_t0_question-retrieval_core1000_20261016/llm_requests.jsonl)입니다. [내부 FAQ 번호 표시 78건](internal_faq_markers.csv)은 원문을 보존한 관찰 목록입니다.

## 조건을 고정할 때 사용할 자료

[실행 설정](test_config.json), [원본 출처·seed 해시](source_manifest.json), [가중치 해시](model_verification.json), [원본 프롬프트·질문·자료](../../../inputs/dataset.json), [system 프롬프트](../../../inputs/faq-system.txt), [user 템플릿](../../../inputs/faq-user.txt), [schema](../../../inputs/schema.json), [게시 파일 해시](artifact_manifest.json)를 함께 보관합니다.

원본 설정의 `session` 문자열에 r3가 남아 있는 것은 실행 준비 때의 라벨입니다. 실제 수집 완료 세션은 `faq_core1000_baseline_20261016_r5/attempt-001`이며 [세션 완료 기록](session_result.json)이 이를 구분합니다. 기존 기록의 바이트와 해시 보존을 위해 이 문자열을 고쳐 쓰지 않았습니다.

## 제외한 경로

입력 가드, 출력 가드, 실제 PostgreSQL 검색, Spring 서비스 전체 경로, 개인 조회 API, 매장 조회 API와 도구를 호출하지 않았습니다. FAQ 검색은 파일에 고정한 자료에 대해 팀 코드의 QUESTION 벡터·FAQ별 최고 점수·정렬·top-k·임계값 규칙을 적용한 독립 어댑터입니다. 실제 DB 연동 검사 결과로 사용하면 안 됩니다.

가드 없음, API 없음이라는 조건을 고려하지 않고 ‘모두 통과’·‘100% 정답’으로 해석하지 않습니다. [평가 기준](../summary/evaluation_criteria.md)과 [회차 요약](../all_summary.md)을 참고하세요.
