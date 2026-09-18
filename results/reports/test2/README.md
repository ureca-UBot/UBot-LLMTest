# FAQ 380회 테스트 결과

2026-09-17 Windows 로컬 환경에서 `test2`로 실행한 9개 모델의 결과입니다. 모델 호출, 자동 채점, 요약 보고서 생성까지 완료된 산출물을 보관합니다. 후속 분석은 [종합 평가](../../test2/summary_results.md)에 추가했습니다. 전체 자동 지표 집계와 표본 234건의 AI 문맥 검토를 구분하며, 이 폴더의 원본 자동 보고서는 그대로 보존했습니다.

## 실행 범위

- 데이터: 고유 300문항 중 40문항을 각 3회 반복하여 **모델당 380회** 실행
- 모델: 9개, 전체 **3,420회**
- 저장 확인: 모델마다 원본 응답 380건과 `review.csv` 380행
- 기록된 요청 처리 오류: 0건. 답변의 정답 여부와 포맷 준수 여부는 각 채점 파일에 기록됨
- 실행 기간: 2026-09-17 11:05~14:11 (한국 시간)
- 기준 코드: `e6a47d857f47ec6c2a94d239a59ea5806fff2b09` (`llm-model-test`)
- 실행 명령: `node scripts/test2/run_all_models.js local`

## 모델별 결과

아래 순서는 실행 순서입니다. 요약은 GitHub에서 바로 읽을 수 있고, 상세 CSV에는 질문·정답·실제 답변·자동 채점 결과가 들어 있습니다.

| 모델 | 자동 요약 | 문항별 상세 결과 | 원본 응답 |
| --- | --- | --- | --- |
| `gemma3:270m` | [요약](local-win_gemma3-270m_20260917_summary.md) | [review.csv](../../scored/test2/local-win_gemma3-270m_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_gemma3-270m_20260917/generation.jsonl) |
| `qwen3:0.6b` | [요약](local-win_qwen3-0-6b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_qwen3-0-6b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_qwen3-0-6b_20260917/generation.jsonl) |
| `gemma3:1b` | [요약](local-win_gemma3-1b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_gemma3-1b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_gemma3-1b_20260917/generation.jsonl) |
| `qwen3:1.7b` | [요약](local-win_qwen3-1-7b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_qwen3-1-7b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_qwen3-1-7b_20260917/generation.jsonl) |
| `exaone3.5:2.4b` | [요약](local-win_exaone3-5-2-4b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_exaone3-5-2-4b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_exaone3-5-2-4b_20260917/generation.jsonl) |
| `qwen3:4b` | [요약](local-win_qwen3-4b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_qwen3-4b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_qwen3-4b_20260917/generation.jsonl) |
| `gemma3:4b` | [요약](local-win_gemma3-4b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_gemma3-4b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_gemma3-4b_20260917/generation.jsonl) |
| `exaone3.5:7.8b` | [요약](local-win_exaone3-5-7-8b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_exaone3-5-7-8b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_exaone3-5-7-8b_20260917/generation.jsonl) |
| `qwen3:8b` | [요약](local-win_qwen3-8b_20260917_summary.md) | [review.csv](../../scored/test2/local-win_qwen3-8b_20260917/review.csv) | [generation.jsonl](../../raw/test2/local-win_qwen3-8b_20260917/generation.jsonl) |

CSV를 엑셀에서 읽을 때는 **데이터 → 텍스트/CSV에서 → UTF-8**로 가져오면 한글을 확인할 수 있습니다.

## 보관한 파일

| 경로 | 내용 |
| --- | --- |
| [`results/raw/test2/`](../../raw/test2/) | 모델별 원본 응답 `generation.jsonl` 9개 |
| [`results/scored/test2/`](../../scored/test2/) | 모델별 `review.csv`, 항목별 채점 JSONL, 요약 JSON 등 108개 |
| 현재 폴더의 `*_summary.md` | 모델별 자동 생성 보고서 9개 |
| [`run-20260917.json`](run-20260917.json) | 실행 조건, 모델 digest·양자화, 입력·결과 파일 SHA-256, 저장 건수 |
| [`python-packages-20260917.txt`](python-packages-20260917.txt) | 실행 환경에 설치된 Python 패키지 버전 |

자동 생성된 결과 파일 126개는 실행 후 저장된 내용 그대로 복사했습니다. 후속 평가를 작성할 때도 원본 응답과 자동 채점 산출물을 보존하고, 해석은 별도 문서로 추가합니다.

## 실행 조건과 입력 자료

- GPU: NVIDIA GeForce RTX 4070 Ti, 12,282 MiB (`nvidia-smi`로 실행 시작 시 확인)
- 런타임: Ollama 0.34.0, Node.js v24.16.0, Python 3.12.14
- 요청 방식: 모델을 하나씩 실행하고, 각 모델 안에서도 질문을 하나씩 순차 처리
- 응답 설정: `format=json`, `stream=false`, API `options={}`. `think`, temperature, seed, 컨텍스트 길이, 최대 출력 토큰은 요청에서 별도로 지정하지 않음
- 자동 채점 모델: `bge-m3:latest`, `Huffon/klue-roberta-base-nli`
- 입력: [cases.csv](../../../data/eval_sets/test_set2/cases.csv), [faq_master.csv](../../../data/eval_sets/test_set2/faq_master.csv)
- 실행 안내: [scripts/test2/SETUP.md](../../../scripts/test2/SETUP.md)

이번 결과는 순차 요청 설정에서 얻은 기록입니다. 동시 요청 수를 바꾼 실험 결과는 포함하지 않습니다.
