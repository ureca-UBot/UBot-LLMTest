# 선택 모델 5종 성능 테스트

이 문서는 기존 팀원 테스트의 측정 항목과 평가 절차를 그대로 사용하되, 아래 5개 Ollama 모델만 실행하기 위한 안내서입니다.

| 모델 | Ollama 태그 |
|---|---|
| Qwen3 4B | `qwen3:4b` |
| Qwen3 8B | `qwen3:8b` |
| Qwen3 14B | `qwen3:14b` |
| Gemma3 4B | `gemma3:4b` |
| Gemma3 12B | `gemma3:12b` |

Gemma는 요청에 따라 3 버전을 사용합니다. 실제 로컬 태그가 다르면 `scripts/run_selected_models.js`의 `MODELS` 배열만 수정하면 됩니다.

## 테스트 범위

기존 저장소에 구현되어 있는 6개 라운드를 모두 실행합니다.

1. FAQ 답변 생성: Easy, Medium, Hard
2. RAG 안정성: Small, Medium, Large

각 라운드는 기존과 동일하게 다음 4단계로 진행됩니다.

1. Ollama 모델 호출 및 원시 결과 저장
2. 결정론적 보조 지표 계산: 키워드 커버리지, ROUGE-L, 숫자 검증 등
3. 동일한 OpenAI Judge 평가
4. 모델별 결과 Markdown 생성

기존 평가 데이터, 프롬프트, Judge 기준, 결과 형식은 변경하지 않습니다. 모델 수만 기존 9개에서 5개로 제한합니다.

## 실행 방법

먼저 Ollama가 실행 중이고 위 5개 태그가 설치되어 있는지 확인합니다.

```powershell
ollama list
```

깨끗한 결과로 전체 테스트를 시작하려면:

```powershell
node scripts/run_selected_models.js --reset --skip-judge
```

`--skip-judge`를 사용하면 Judge 평가 없이 모델 응답과 결정론적 보조 지표만 계산합니다. 이 경우 결과 문서의 Judge 기반 항목은 `-`로 표시됩니다.

`--reset`을 생략하면 기존 `results/raw` 중간 결과 뒤에 추가됩니다. 중단 후 이어서 실행하거나 일부 라운드를 재실행할 때 사용할 수 있지만, 동일 케이스가 중복 기록될 수 있으므로 전체 재측정에는 `--reset`을 권장합니다.

## 결과 파일

완료 후 기존 결과 파일이 선택 모델 5종 기준으로 갱신됩니다.

- `results/faq_easy_results.md`
- `results/faq_medium_results.md`
- `results/faq_hard_results.md`
- `results/faq_rag_stability_small_results.md`
- `results/faq_rag_stability_medium_results.md`
- `results/faq_rag_stability_large_results.md`

중간 JSONL 파일은 `results/raw/`에 저장됩니다.

## 주의 사항

- 모델 태그가 설치되어 있지 않으면 해당 호출이 실패하므로, 실행 전 `ollama pull <태그>`로 준비해야 합니다.
- Judge를 포함하려면 OpenAI Responses API를 사용합니다. 기본 Judge 모델은 `gpt-5`이며 `OPENAI_JUDGE_MODEL` 환경변수로 변경할 수 있습니다.
- 이번처럼 Judge를 제외할 때는 `--skip-judge`를 사용하므로 API 키가 필요하지 않습니다.
- 현재 저장소에 실행 스크립트가 구현된 항목만 포함했습니다. 즉, 아직 미구현 상태인 Intent 분류와 Cluster 라벨링은 이번 통합 실행 대상에 포함하지 않았습니다.
