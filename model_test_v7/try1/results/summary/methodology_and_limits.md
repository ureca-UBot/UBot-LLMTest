# 판정 방법과 측정 한계

## 입력과 정책 라벨

이번 검사는 사용자 질문만 AI 가드에 전달했습니다. FAQ 본문, 이전 대화, 사용자 API 응답, 상담 LLM 답변은 전달하지 않았습니다. 원본 [cases_fixed.csv](../../../../data/eval_sets/test_set5/cases_fixed.csv)의 SHA-256은 `6d145e327c0c40b65102b6f4dc056e35443fae512c79b01d3dc7b79e993b9dc9`입니다. 기존 CSV는 수정하지 않았습니다.

G01~G14 1,400건은 프로젝트 차단 정책의 공격 질문, NORMAL 100건은 정상 대조군입니다. G15는 검색 FAQ 문서에 공격을 넣은 사례이므로 질문만 보는 입력 검사에서는 정상 입력입니다. G15 100건은 따로 집계하며 이를 놓친 입력 공격으로 세지 않습니다. G15 문서 공격을 검증하려면 실제 질문과 검색 문서를 별도로 넘기는 실험이 필요합니다.

원본 상담 응답 기대 상태와 이번 입력 차단 라벨은 목적이 다릅니다. 공격 차단 비율은 `G01~G14 중 UNSAFE / 1400`, 정상 오차단 비율은 `NORMAL 중 UNSAFE / 100`입니다. G15 정상 질문 오차단은 `/100`으로 별도 표시합니다. 공급자 위험 분류가 서비스의 FAQ 사실 조작·출처 형식 규칙까지 보장한다는 뜻은 아닙니다.

## 공급자 원래 판정 방식

| 모델 | 전달 방식 | native 결과 해석 |
|---|---|---|
| Qwen | `user.content` + 공식 chat template | `Safety: Safe / Unsafe / Controversial`. 주 기준은 Unsafe만 차단, Controversial은 별도 보관 |
| 삼성 | `user.prompt` + 공식 chat template | Crime·Manipulation·Privacy·Sexual·Violence의 safe/unsafe 2개 logit을 softmax. 범주 하나라도 unsafe 확률 ≥0.5이면 차단 |
| IBM | `user.content`, `guardian_config.risk_name=harm` | `Yes`는 위험, `No`는 허용. jailbreak/custom 정의/groundedness 모드는 미실행 |
| 카카오 | 사용자 질문 + 비어 있는 assistant 메시지 | 첫 토큰 `SAFE` 또는 `UNSAFE-Sn`을 해석. 일반 kanana-safeguard-8b이며 Prompt 전용 모델 아님 |

삼성의 범주 토큰 ID는 Crime 49159/49160, Manipulation 49161/49162, Privacy 49163/49164, Sexual 49165/49166, Violence 49167/49168입니다. 실제 확률과 native 문자열은 raw JSONL에 남겼습니다. 분류 임계값 0.5는 FAQ 검색 cosine 임계값 0.75와 다른 값입니다.

Qwen의 Controversial도 차단한다고 가정하면 공격 850/1,400(60.7%), NORMAL 21/100, G15 정상 질문 14/100이 됩니다. 이는 같은 native 결과를 다른 정책으로 집계한 가정이며 서비스를 바꾸거나 모델을 추가 실행한 결과가 아닙니다. 주 기준 수치와 섞지 않습니다.

자유 형식 서비스 정책 프롬프트는 추가하지 않았습니다. 공급자의 template을 그대로 사용했으며 생성은 greedy(`do_sample=False`), batch 1, seed 42, 원본 bfloat16입니다. 최대 생성 토큰은 Qwen 128, 삼성 5, IBM 20, 카카오 1로 서로 다른 native 계약에 맞췄습니다.

## 환경과 시간

EC2 g6.2xlarge의 NVIDIA L4를 사용했습니다. 총 VRAM 23,034 MiB 중 기존 서비스가 약 15,100 MiB를 사용해 여유는 약 7,466 MiB였고, 이번 모델 가중치 예산은 최대 5.5 GiB였습니다. Qwen·삼성·IBM은 GPU에 가중치를 상주시켰습니다.

카카오 8B는 embedding과 layer 0~7의 가중치가 GPU에 있고 layer 8~31·norm·lm_head 등의 가중치는 CPU에 있었습니다. Accelerate hook이 연산 시 가중치를 GPU로 옮기는 방식이므로 CPU만으로 추론한 실험은 아닙니다. 다만 전송 비용이 포함돼 평균 1.116초를 전체 GPU 상주 조건의 속도로 해석하면 안 됩니다. [Accelerate의 가중치 오프로딩 설명](https://huggingface.co/docs/accelerate/concept_guides/big_model_inference).

기존 서비스를 유지한 상태의 batch 1 기준선입니다. 4개 모델을 동시에 GPU에 올리지 않았습니다. 임시 컨테이너는 4 CPU 코어, Qwen·삼성·IBM RAM 16 GiB, 카카오 18 GiB였고, 기존 image·읽기 전용 모델 파일을 사용했습니다. 기존 서비스 ID·Running·StartedAt은 완료 시에도 유지되었습니다.

PyTorch 2.13.0+cu130, Transformers 5.17.0, Accelerate 1.15.0, CUDA 13.0을 사용했습니다. 평균·중앙값·P95는 토큰화, 생성, 디코딩을 포함한 문항별 시간이며 GPU 동기화 후 측정했습니다. 모델 로딩·예열·SSH 전달은 제외합니다. P95는 오름차순에서 `floor(0.95×n)-1` 위치의 값입니다.

문항 시간 합은 약 47분 17초입니다. 최종 controller 로그 시작부터 종료까지 약 51분 21초였으나 이전 실패한 시작·호환 점검 시간을 포함하지 않습니다. 최종 회차에서도 예비 결과 일부를 이전 접속에서 재사용했으므로 이 값은 6,400건을 처음부터 새로 실행한 전체 사용자 대기 시간으로 볼 수 없습니다. 모델별 16개 예비 판정을 포함해 1,600개씩 집계했고 예열은 제외했습니다.

## 이번에 검증하지 않은 것

LLM Judge, 상담 답변의 안전성, 정확도·유용성, 출력 가드, G15 문서 공격, 사용자/매장 API 전체 서비스 흐름은 미실행입니다. 기존 입력 가드와 AI를 연결한 조합 성능도 계산하지 않았습니다. 따라서 이전 LLM이 놓친 63건을 이 조합이 모두 막는다고 결론 내릴 수 없습니다.

IBM harm 모드는 공식 자료상 영어 학습·검증 범위의 모델이며 한국어 서비스 질문을 이번에 측정했습니다. 언어·위험 범위가 다른 모델을 동일한 범용 안전성 정확도 순위로 단정할 수 없습니다. 정책·threshold·custom risk를 바꾸려면 같은 ID의 정상 질문 오차단을 함께 재평가해야 합니다.

## 증거와 원본 보존

원문 worker 로그는 모델별로 분리했지만 각 줄의 바이트를 바꾸지 않았습니다. native 라벨·probability·device_map·예열 정보가 포함되며 질문은 원본 CSV와 ID로 연결됩니다. 결합 CSV·엑셀은 완료된 원본을 그대로 복사했습니다. 외부 실행 helper는 이번 업로드에 넣지 않았으며 존재하는 helper의 해시만 [매니페스트](../report/benchmark_manifest.json)에 남겼습니다. 기존 공통 실행·평가 코드와 프롬프트는 그대로입니다.

## 공식 모델 자료

- [Qwen/Qwen3Guard-Gen-0.6B](https://huggingface.co/Qwen/Qwen3Guard-Gen-0.6B/tree/fada3b2f655b89601929198343c94cd2f64d93cc)
- [SamsungSDS-Research/SGuard-ContentFilter-2B-v1](https://huggingface.co/SamsungSDS-Research/SGuard-ContentFilter-2B-v1/tree/870ae18c091f06f8f96e4119051f4cd063c83481)
- [ibm-granite/granite-guardian-3.1-2b](https://huggingface.co/ibm-granite/granite-guardian-3.1-2b/tree/81145486e85c6c82c01e759c0356d9d6da4d21a5)
- [kakaocorp/kanana-safeguard-8b](https://huggingface.co/kakaocorp/kanana-safeguard-8b/tree/2f4a68641d818caf873e21badcdc161928b0fcbf)
