# V2 — 2026-09-18 재실행 결과와 AI 채점

**[최종 상세 비교 보고서](summary_results_V2.md)** · [전체 통합 CSV](review_all_models_V2.csv) · [AI 채점 보고서](llm_judge/README.md) · [검수 기록](review_notes_V2.md)

상세 보고서는 20개 절로 구성되며 유형별·난이도별 비교, 점수 분포, 상태 혼동표, 응답 시간 분포, 반복 40문항, 안전성 15문항, 실제 답변 비교를 포함한다. [상세 표 CSV 11개](tables/)와 [상세 지표 JSON](detailed_metrics_V2.json)을 함께 제공한다.

V2는 9월 18일 재실행한 5개 모델의 결과다. 기존 9월 17일 결과와 summary_results.md 등 V1 파일을 덮어쓰지 않았다. 원점수 집계는 완료됐으며 표본 검수 중 발견한 판정 경계·일관성 문제는 팀 확인 대상으로 보존했다. 최종 모델은 선정하지 않았다.

## 경로 및 버전 규칙

- 팀에서 읽는 보고서·CSV·지표 파일은 V2 폴더 또는 _V2 파일명으로 구분한다.
- 원본 응답과 AI JSONL은 작업 지시서의 results/raw/test2/<run_id>/ 및 results/scored/test2/<run_id>/ 경로와 파일명을 유지한다. 새 run_id의 20260918_rerun-1328이 V2 원본을 식별한다. ID나 응답 내용을 바꾸지 않았다.
- 모델별 review_automatic_V2.csv는 기존 규칙 평가 CSV의 원본 복사본이고 review_V2.csv는 질문·근거·기존 점수·AI 판정·검수 메모를 합친 380행 파일이다.
- 통합 review_all_models_V2.csv는 1,900행이다. 반복 2·3회차 400행에는 AI 점수를 복제하지 않고 대상 아님을 표시했다. AI 내용 평가 CSV는 고유 1,500행이며 안전성은 그중 75행이다.
- AI 원본 결과 5×(300+15), 모델별 요약, 실제 사용한 프롬프트와 입력 해시, 실행기 소스를 함께 제공한다. 원본 결과의 call_log는 로컬 디버그 추적 경로이며 CLI 원시 이벤트·오류 로그는 업로드 대상에서 제외했다.

| 모델 | V2 원본 run_id | 모델 응답 | 점수+답변 CSV | AI 채점 원본 |
|---|---|---|---|---|
| qwen3:4b | local-win_qwen3-4b_20260918_rerun-1328 | [응답](../../raw/test2/local-win_qwen3-4b_20260918_rerun-1328/generation.jsonl) | [통합 CSV](../../scored/test2/local-win_qwen3-4b_20260918_rerun-1328/review_V2.csv) | [내용 AI](../../scored/test2/local-win_qwen3-4b_20260918_rerun-1328/accuracy_hallucination_llm.jsonl) · [안전성 AI](../../scored/test2/local-win_qwen3-4b_20260918_rerun-1328/safety_llm.jsonl) |
| qwen3:8b | local-win_qwen3-8b_20260918_rerun-1328 | [응답](../../raw/test2/local-win_qwen3-8b_20260918_rerun-1328/generation.jsonl) | [통합 CSV](../../scored/test2/local-win_qwen3-8b_20260918_rerun-1328/review_V2.csv) | [내용 AI](../../scored/test2/local-win_qwen3-8b_20260918_rerun-1328/accuracy_hallucination_llm.jsonl) · [안전성 AI](../../scored/test2/local-win_qwen3-8b_20260918_rerun-1328/safety_llm.jsonl) |
| exaone3.5:7.8b | local-win_exaone3-5-7-8b_20260918_rerun-1328 | [응답](../../raw/test2/local-win_exaone3-5-7-8b_20260918_rerun-1328/generation.jsonl) | [통합 CSV](../../scored/test2/local-win_exaone3-5-7-8b_20260918_rerun-1328/review_V2.csv) | [내용 AI](../../scored/test2/local-win_exaone3-5-7-8b_20260918_rerun-1328/accuracy_hallucination_llm.jsonl) · [안전성 AI](../../scored/test2/local-win_exaone3-5-7-8b_20260918_rerun-1328/safety_llm.jsonl) |
| qwen3:1.7b | local-win_qwen3-1-7b_20260918_rerun-1328 | [응답](../../raw/test2/local-win_qwen3-1-7b_20260918_rerun-1328/generation.jsonl) | [통합 CSV](../../scored/test2/local-win_qwen3-1-7b_20260918_rerun-1328/review_V2.csv) | [내용 AI](../../scored/test2/local-win_qwen3-1-7b_20260918_rerun-1328/accuracy_hallucination_llm.jsonl) · [안전성 AI](../../scored/test2/local-win_qwen3-1-7b_20260918_rerun-1328/safety_llm.jsonl) |
| gemma3:4b | local-win_gemma3-4b_20260918_rerun-1328 | [응답](../../raw/test2/local-win_gemma3-4b_20260918_rerun-1328/generation.jsonl) | [통합 CSV](../../scored/test2/local-win_gemma3-4b_20260918_rerun-1328/review_V2.csv) | [내용 AI](../../scored/test2/local-win_gemma3-4b_20260918_rerun-1328/accuracy_hallucination_llm.jsonl) · [안전성 AI](../../scored/test2/local-win_gemma3-4b_20260918_rerun-1328/safety_llm.jsonl) |

## 재집계만 실행

아래 명령은 저장된 결과를 읽어 V2 표와 CSV만 생성한다. 모델·Ollama·외부 Judge를 호출하지 않는다.

```powershell
node scripts/test2/build_llm_judge_report.js
node scripts/test2/build_results_V2.js
```

AI 실행기는 scripts/test2/run_saved_llm_judge.js이며 이번 고정 배치 전용이다. 일반 모델 생성 파이프라인에 자동 연결하지 않았다. 완료한 문항은 해시·설정 일치 시 건너뛴다. 이번 결과 검토를 위해 실행할 필요는 없다.

## 평가 자료

[AI 채점 입력·프롬프트](../../judge_inputs/test2/rerun-20260918-1328/) · [생성 당시 실행 기록](../../reports/test2/rerun-20260918-1328.json) · [정합성 검증](validation_V2.json)
