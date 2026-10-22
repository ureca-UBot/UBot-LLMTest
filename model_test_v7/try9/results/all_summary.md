# v7 try9 — 입력 AI 가드 최초363건＋새300건

2026-10-23 / 동일 RedHatAI 모델·고정 코드 복사본·고정 프롬프트. [직전 출력 비교 try8](../../try8/results/all_summary.md) · [v7 설정](../../SETUP.md).

## 0. 검사 항목·건수·판정 기준

- 최초363건: 코드 입력 가드 기준 / 코드＋안전·분류 통합AI / 코드＋별도안전AI＋기존분류 / 코드 차단검사 제외＋안전AI＋기존분류.
- 추가300건: 기존363건과 중복 없는 공격150·정상150을 두 코드＋AI 구성으로 비교. 모델·프롬프트·코드는 수정하지 않았습니다.
- 모델은 `RedHatAI/Qwen3-4B-Instruct-2507-quantized.w4a16`. 서비스 수정·실제DB·임베딩·상담 답변 생성·출력 가드·외부 Judge 실행은 없습니다. 기존 조건부 질문 분류까지만 검사했습니다.
- 기대 판정은 원문과 실제 저장 문맥으로 모델 호출 전에 수동 검토했습니다. FAQ 문서에만 공격이 있는 원문은 입력 정상으로 봅니다. 사례 ID·정답 라벨은 모델 입력에 추가하지 않았고, 기존 금칙어38개는 고정 목록으로 제공했습니다. 전체 질문 차단 정책을 유지했습니다.
- REVIEW나 응답 형식 실패는 차단 성공이 아닙니다. 정상 질문의 보류는 정상 보존에도 포함하지 않습니다. 저장 대화 이력은 모두 비어 있어 실제 멀티턴 품질은 평가하지 못했습니다.

## 1. 전체 결과

외부 LLM Judge 지표는 없습니다. 아래는 사전 수동 기대값 대비 입력 안전 분류의 건수이며 답변 정확도·전체 서비스 안전성 점수가 아닙니다.

### 최초363건 — 차단205·보존158

| 구성 | 위험 차단 /205 | 미탐 | 정상 보존 /158 | 정상 오차단 | 보류 | 판정 실패 |
|---|---|---|---|---|---|---|
| 코드 가드 기준 | 172 | 33 | 158 | 0 | 0 | 0 |
| 코드＋분류 통합 AI | 203 | 2 | 151 | 5 | 2 | 0 |
| 코드＋별도 AI | 203 | 2 | 153 | 3 | 2 | 0 |
| 코드 검사 제외＋AI | 153 | 51 | 153 | 3 | 3 | 0 |


### 새300건 — 차단150·보존150

| 구성 | 위험 차단 /150 | 미탐 | 정상 보존 /150 | 정상 오차단 | 보류 | 판정 실패 |
|---|---|---|---|---|---|---|
| 코드＋분류 통합 AI | 146 | 4 | 134 | 9 | 7 | 0 |
| 코드＋별도 AI | 147 | 3 | 133 | 14 | 3 | 0 |


### 합산663건 — 차단355·보존308

| 구성 | 위험 차단 /355 | 미탐 | 정상 보존 /308 | 정상 오차단 | 보류 | 판정 실패 |
|---|---|---|---|---|---|---|
| 코드＋분류 통합 AI | 349 | 6 | 285 | 14 | 9 | 0 |
| 코드＋별도 AI | 350 | 5 | 286 | 17 | 5 | 0 |


새300건에서는 통합형의 정상 오차단이 적었지만 정상 보류가 더 많았습니다. 정상 질문이 통과하지 못한 수는 통합형16건·별도형17건입니다. 위험 질문은 별도형이 한 건 더 막았습니다. 따라서 최초363건에서 별도형이 항상 더 안정적이라고 일반화할 수 없고, 통합형이 언제나 더 낫다고 확정할 수도 없습니다.

## 2. 이전 표본과 차이·12건 원문의 의미

출력 가드에서 모두 놓쳤던 답변12건의 원문 중 직접 조작 요구는5건·정상 문의는7건입니다. 이는 출력 오류가12→5로 줄었다는 뜻이 아닙니다. 정상 질문7건의 잘못된 답변은 출력 단계 문제로 남습니다.

그5개 공격·7개 정상 원문에서 코드 기준은4차단/7보존, 통합형은5차단/6보존(정상오차단1), 별도형은5차단/7보존, 코드 검사 제외AI는4차단/7보존이었습니다. [12건의 개별 원문과 판정](summary/initial363/focus12-results.json).

## 3. 항목별·분류·처리시간

[항목별 구성과 결과](report/category_results.md) · [분류 변화·시간 비교](report/classification_and_timing.md). 추가300건의 공통 미탐은 자해 실행 요구·규칙 무력화·초성 모욕 요구3건이고, 통합형은 영문 자해 조장 요구1건을 추가로 놓쳤습니다. 신고·보호·안전한 인용의 오차단·보류도 남습니다.

같이 통과한 정상 분류46건의 평균 시간은 통합형2.441초·별도형2.558초입니다. 통합형은 논리 호출51회를 줄였지만 전체표본 시간 합계에서는 더 빠르지 않았습니다. 실제 서비스 지연 감소를 보장하지 않습니다.

## 4. 요약 문서·원본 증거

- [summary/holdout300/category-results.json](summary/holdout300/category-results.json)
- [summary/holdout300/classification-changes.json](summary/holdout300/classification-changes.json)
- [summary/holdout300/final-analysis.json](summary/holdout300/final-analysis.json)
- [summary/holdout300/guard-schema.json](summary/holdout300/guard-schema.json)
- [summary/holdout300/joint-schema.json](summary/holdout300/joint-schema.json)
- [summary/holdout300/manual-classification-review.json](summary/holdout300/manual-classification-review.json)
- [summary/holdout300/model-cleanup.json](summary/holdout300/model-cleanup.json)
- [summary/holdout300/model-verification.json](summary/holdout300/model-verification.json)
- [summary/holdout300/protocol.json](summary/holdout300/protocol.json)
- [summary/holdout300/safety-disagreements.json](summary/holdout300/safety-disagreements.json)
- [summary/holdout300/selection-audit.json](summary/holdout300/selection-audit.json)
- [summary/holdout300/summary.json](summary/holdout300/summary.json)
- [summary/holdout300/timing-comparison.json](summary/holdout300/timing-comparison.json)
- [summary/holdout300/verification.json](summary/holdout300/verification.json)
- [summary/initial363/classification-changes.json](summary/initial363/classification-changes.json)
- [summary/initial363/final-analysis.json](summary/initial363/final-analysis.json)
- [summary/initial363/focus12-results.json](summary/initial363/focus12-results.json)
- [summary/initial363/guard-schema.json](summary/initial363/guard-schema.json)
- [summary/initial363/joint-schema.json](summary/initial363/joint-schema.json)
- [summary/initial363/manual-classification-review.json](summary/initial363/manual-classification-review.json)
- [summary/initial363/model-cleanup.json](summary/initial363/model-cleanup.json)
- [summary/initial363/model-verification.json](summary/initial363/model-verification.json)
- [summary/initial363/payload-preflight.json](summary/initial363/payload-preflight.json)
- [summary/initial363/protocol.json](summary/initial363/protocol.json)
- [summary/initial363/scope.json](summary/initial363/scope.json)
- [summary/initial363/summary.json](summary/initial363/summary.json)

## 5. 상세 결과·프롬프트

- [최초363건 안전·분류·12건·프롬프트 HTML](report/input_initial363.html) · [새300건 및 합산663건 HTML](report/input_holdout300.html)
- [363건 CSV](report/input_initial363.csv) · [300건 CSV](report/input_holdout300.csv)
- [별도 안전 프롬프트](../../../prompts/input_guard/redhat4b_input_safety_20261023.txt) · [안전＋분류 통합 프롬프트](../../../prompts/input_guard/redhat4b_input_safety_planning_20261023.txt)
- [공통 안전 기준](../../../prompts/input_guard/redhat4b_input_shared_criteria_20261023.txt) · [기존 질문 정리 프롬프트 스냅샷](../../../prompts/input_guard/question_planner_baseline_snapshot_20261023.txt)
- [363건 사전 기대값·원문](raw/initial363/cases-and-gold.jsonl) · [300건 사전 기대값·원문](raw/holdout300/cases-and-gold.jsonl)

원문·판정·실제 요청/응답·시간·검증 자료를 보관했습니다. 독립 운영 데이터나 실제 멀티턴 전수 시험이 아니며, 서비스 코드·실행기·SSH 인증·서버 설정은 게시하지 않았습니다. 기존 서비스 상태 유지와 임시 모델 종료를 확인했습니다.

[모든 원본 요청·응답·검토 기록](report/raw_records.md)

[게시 파일·원본 SHA-256 매니페스트](summary/publish_manifest.json)
