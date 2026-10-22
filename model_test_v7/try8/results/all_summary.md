# v7 try8 — 출력 가드 세 구성·저장 답변 363건

2026-10-22~23 / EC2 지정 RedHatAI 모델의 저장 결과. [이전 try7](../../try7/results/all_summary.md) · [다음 입력 비교 try9](../../try9/results/all_summary.md) · [v7 설정](../../SETUP.md).

## 0. 검사 항목·건수·기준

- 부모 실행은 원문 3,000건에서 시작했고, 파싱된 답변 2,902건·답변 없음98건입니다. 출력 가드 세 방식의 완료 비교는 그중 항목별로 뽑은 **동일 저장 답변363건**이며 전체3,000건의 가드 검증 완료를 뜻하지 않습니다.
- 코드 출력 가드 / 코드＋LLM / LLM 단독, 답변 전체 ALLOW·BLOCK·REVIEW 판정입니다. 문장을 부분 삭제하는 방식으로 되돌리지 않았습니다. 기존 코드의 표기 정규화10건은 기록에 남아 있습니다.
- 모델: `RedHatAI/Qwen3-4B-Instruct-2507-quantized.w4a16`. 원래 비교 프롬프트를 아래에 보관했습니다.
- 외부 LLM Judge는 실행하지 않았습니다. 차단 건수는 정확도나 공격 성공 수가 아닙니다. 확정32건 내용·근거 검토와 보류·품질28건을 별도 보관했습니다.

## 1. 전체 결과 — 시점별 구분

### 최초 저장 비교: 당시 고정 코드

| 구성 | ALLOW | BLOCK | REVIEW | 판정 실패 |
|---|---|---|---|---|
| 코드 출력 가드 | 306 | 57 | 0 | 0 |
| 코드＋LLM 가드 | 268 | 94 | 0 | 1 |
| LLM 가드 단독 | 312 | 50 | 0 | 1 |


### 코드 보완 이후: 동일 본문에 저장된 LLM 판정 재사용

| 구성 | ALLOW | BLOCK | REVIEW | 판정 실패 |
|---|---|---|---|---|
| 코드 출력 가드 | 298 | 65 | 0 | 0 |
| 코드＋LLM 가드 | 260 | 102 | 0 | 1 |
| LLM 가드 단독 | 312 | 50 | 0 | 1 |


두 번째 표는 코드 보완 결과를 저장 LLM 판정과 오프라인으로 연결한 것입니다. 코드 통과 본문이 기존 통과 본문과 바이트 수준으로 같은 경우에만 해당 **후단** LLM 결과를 재사용했습니다. 추가 모델·임베딩·답변 생성 호출은 0회이며 서비스 전체를 다시 실행한 결과가 아닙니다.

확정 문제32건에서 최신 코드18건 차단·14건 미탐, 코드＋LLM20건 차단·12건 미탐입니다. 코드 보완으로 새로 차단한 확정 오류8건, 기존 차단57건 유지, 추가 정상 경계30건 검사를 포함한 관련 단위81건 성공 기록을 보관했습니다. 이 기록을 이번 게시 중 다시 실행하지 않았습니다.

## 2. 이전 회차와 차이·프롬프트 결정

try7은 문장 선택 실험이었고, 이번 비교는 전체 답변 판정입니다. 이후 문제12건＋정상대조12건으로 새 출력 프롬프트를 시험했으나 유효 문제 차단0건·정상 오차단1건·판정 실패2건이라 개선으로 채택하지 않았습니다. 기존 프롬프트 유지 결정과 결과를 함께 보관합니다.

## 3. 항목·문제 유형

[항목별 처리 집계](report/category_results.md) · [32건 검토·12건 미해결·6＋6과5＋7의 차이](report/output_reviewed_findings.md).

## 4. 요약 문서·원본 증거

- [summary/baseline363/category-comparison.json](summary/baseline363/category-comparison.json)
- [summary/baseline363/comparison-summary.json](summary/baseline363/comparison-summary.json)
- [summary/baseline363/guard-protocol.json](summary/baseline363/guard-protocol.json)
- [summary/baseline363/model-cleanup.json](summary/baseline363/model-cleanup.json)
- [summary/baseline363/model-metadata.json](summary/baseline363/model-metadata.json)
- [summary/baseline363/payload-verification.json](summary/baseline363/payload-verification.json)
- [summary/baseline363/schema.json](summary/baseline363/schema.json)
- [summary/baseline363/selection-verification.json](summary/baseline363/selection-verification.json)
- [summary/baseline363/selection.json](summary/baseline363/selection.json)
- [summary/baseline363/verification.json](summary/baseline363/verification.json)
- [summary/code_replay363/scope.json](summary/code_replay363/scope.json)
- [summary/code_replay363/unit-test-results.json](summary/code_replay363/unit-test-results.json)
- [summary/code_replay363/verification.json](summary/code_replay363/verification.json)
- [summary/latest_code_with_saved_llm363.json](summary/latest_code_with_saved_llm363.json)
- [summary/parent_generation3000_manifest.json](summary/parent_generation3000_manifest.json)
- [summary/prompt24/after-summary.json](summary/prompt24/after-summary.json)
- [summary/prompt24/final-verification.json](summary/prompt24/final-verification.json)
- [summary/prompt24/model-cleanup.json](summary/prompt24/model-cleanup.json)
- [summary/prompt24/model-verification.json](summary/prompt24/model-verification.json)
- [summary/prompt24/preparation.json](summary/prompt24/preparation.json)
- [summary/prompt24/schema.json](summary/prompt24/schema.json)
- [summary/prompt24/verification.json](summary/prompt24/verification.json)

## 5. 상세 결과·프롬프트

- [최초363건 비교 HTML](report/output_threeway363.html) · [코드 보완 결과 HTML](report/output_code_replay363.html)
- [최신 코드＋저장LLM 세 방식 HTML](report/output_latest_threeway363.html) · [CSV](report/output_latest_threeway363.csv)
- [미채택24건 프롬프트 실험 HTML](report/output_prompt24_not_adopted.html)
- [사용한 전체 판정 프롬프트](../../../prompts/output_guard/redhat4b_whole_answer_20261022.txt)
- [미채택 보완 프롬프트](../../../prompts/output_guard/redhat4b_grounding24_20261022_not_adopted.txt)
- [선택363건의 질문·원문 답변·실제 FAQ](raw/baseline363/guard-inputs.jsonl) · [세 방식 원래 판정](raw/baseline363/comparison.jsonl)
- [전체 부모3000건 질문](raw/parent_questions3000.jsonl) · [답변 없음98건](raw/parent_no_answer98.json)

결과·증거·프롬프트 스냅샷만 게시했습니다. 서비스 코드·JSON 파서·실행기·인증·SSH·컨테이너 제어·환경 설정 파일은 포함하지 않았으며 새 LLM/Judge/임베딩 호출은 없습니다.

[모든 원본 요청·응답·검토 기록](report/raw_records.md)

[게시 파일·원본 SHA-256 매니페스트](summary/publish_manifest.json)
