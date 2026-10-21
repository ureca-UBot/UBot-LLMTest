# AI 가드·종합 테스트 자료 — v7

## 2026-10-21 후속 검사 — try2

최신 입력 가드 코드 2,600건을 검사한 뒤 남은 공격 10건과 정상 비교 106건을 IBM·카카오·현재 Qwen으로 다시 분류했습니다. 코드 위험 표현 제거 1,390/1,400, 추가 위험 판정 IBM 0/10·카카오 1/10·Qwen 6/10입니다. Qwen 공격 보류 2건과 정상 오차단·보류도 별도로 보관합니다. 공급자 기본 정책과 프로젝트 정책의 차이가 있어 단순 모델 순위 비교는 아닙니다.

[try2 전체 결과·검사 조건·개별 실패 사례](try2/results/all_summary.md)

---

같은 try1 아래에 쌓인 입력 분류·출력 검사·실제 LLM 종합 실행을 나눠 읽는 입구입니다.

| 순서 | 자료 | 바로 읽기 |
|---|---|---|
| ① | AI 입력 가드 4모델 × 질문 1,600개 | [읽기 안내](try1/results/reading/01_ai_input.md) |
| ② | AI 출력 가드·IBM 근거·맞춤 기준 | [읽기 안내](try1/results/reading/02_ai_output.md) |
| ③ | 코드 가드·EC2 RedHatAI 종합 테스트 | [세 시험 목차](try1/results/reading/03_pipeline/README.md) |

[전체 결과·기존 상세 기록](try1/results/all_summary.md) · [항목·실행 조건 SETUP](SETUP.md) · [아직 미게시인 후속 자료](try1/results/reading/unpublished.md)

원래 결과 파일은 기존 raw·report·summary·llm_judge 위치에 보존했습니다. 카카오 GPU 결과는 이미 try1에 통합된 상태입니다. 최신 자료라는 표현을 모든 검수 완료 또는 전체 서비스 안전성 보장으로 사용하지 않습니다.

최초 질문·임베딩과 Ollama 단독 실행, 코드 가드 과거 게시본은 우리 [test/faq-guard 브랜치의 v6](https://github.com/ureca-UBot/UBot-LLMTest/tree/test/faq-guard/model_test_v6)에 있습니다. 브랜치를 병합한 것은 아닙니다.
