# 프롬프트 3안 Judge 입력

- 상태: 입력 준비 완료. Judge 호출 및 답변 재생성 없음.
- 대상: qwen3:14b / v1_status_rules, v2_value_guard, v3_decision_tree / 20260922 / temperature 0 / think false.
- 내용 평가: 300문항 × 3안 = 900건. 정확도·환각/근거·한국어 표현을 독립 판정.
- 안전성 평가: 각 안의 적대적 입력·범위 밖 15문항, 총 45건. 내용 평가와 중복되는 별도 평가 항목.
- 기존 v0, smoke, 반복 2·3회차는 입력에서 제외. 세 안 모두 동일한 고유 300문항을 사용.

## 파일

- accuracy_jobs.jsonl / safety_jobs.jsonl: 문항별 입력. Judge에는 각 행의 user_text만 전달한다.
- accuracy_system_prompt.txt / safety_system_prompt.txt: 기존 test3 평가와 같은 test3-saved-v1 채점 기준.
- manifest.json: run_id, 출처, 모델 설정, 스키마 참조, 건수, 파일/레코드/입력 SHA-256 및 검증 결과.

## 입력 기준

기존 results/test3/llm_judge_review/evaluator/judge_prompts.js의 buildSavedResponseInput을 그대로 사용했다. 질문·대화 이력·Context·사용자/API 정보와 원본 parsed/raw_content/포맷 상태를 보존한다. 정확도 입력에는 정답 비교 자료를 별도 영역으로 넣고, 안전성 입력에는 각 prompt_variant의 SYSTEM_PROMPTS 값을 넣었다.

생성 JSONL에는 시스템 프롬프트 전체가 없으므로 scripts/test2/lib/prompts.js의 해당 variant에서 복원했다. 매니페스트에 코드·프롬프트의 출처와 해시를 기록했다. 모델명·variant·속도·기존 점수 등 실행 메타데이터는 user_text 밖에 둔다.

## 이후 채점 시 연결할 사항

Judge 설정은 기존 v0와 동일한 gpt-6-astra / medium이다. 출력 스키마와 의미 검증은 manifest.schema_source의 accuracy/safety 및 validateJudgment를 사용한다. 기존 실행 스크립트는 수정하지 않았으며, 보존된 test3 runner는 test3_prompt 전용 진입점이 아니다. 입력 생성 완료를 채점 완료로 해석하지 않는다.

실행 환경에서 파일 해시를 확인한다. 바이트 SHA-256과 LF 정규화 SHA-256을 함께 기록했으며, 입력 JSON 객체 배열의 해시도 보존했다. 기존 스크립트·원본 응답·평가 결과·보고서는 변경하지 않았다.
