# 로컬 RTX 3060 모델 확장 측정 결과 — EXAONE 3.5 7.8B·Gemma3 4B

측정일: 2026-10-06. Qwen3-4B 로컬 탐색과 같은 부하 조건으로 EXAONE 3.5 7.8B와 Gemma3 4B를 RTX 3060 12GB 한 장에서 실행했다. **세 모델 모두 목표 HTTP 완료 8 RPS에 미달했다.** 관측 최고값은 Gemma3 4B(커뮤니티 AWQ 형식) + vLLM 내부 상한 32의 6.33 RPS다.

이 결과는 30초 창 한 번의 탐색이다. 모델 크기·가중치 형식·평균 출력 길이가 서로 달라 모델 간 같은 조건의 우열 비교로 읽지 않는다.

## 측정 조건

Qwen3-4B 로컬 탐색(`results/v2/http_8rps_20261002_03`)과 같은 조건을 썼다.

- 300문항 풀(SHA-256 `67ca43b2…`), seed 20261002, context 4096, 출력 상한 512, temperature 0, thinking off.
- HTTP/1.1 스트리밍·keep-alive·재시도 0, 요청 timeout 120초.
- 각 동시 요청 단계는 warmup 뒤 30초 창이다. 창 안에서 끝난 정상 2xx 스트림만 RPS에 넣고 drain 완료는 제외했다. 지연·품질·실패율 합격선은 적용하지 않았다.
- 여섯 설정: Ollama 4, llama.cpp 4, vLLM 8, SGLang 8, vLLM 32, SGLang 32. U는 클라이언트 동시 요청 수, 설정 이름의 숫자는 엔진 내부 상한이다.
- 한 번에 한 엔진만 올리고 종료 뒤 컨테이너 제거·포트 반환·VRAM 복귀(허용치 64 MiB, 연속 3회)를 확인했다.

실행기는 [load_test_multimodel/run_local_multimodel.js](../../load_test_multimodel/run_local_multimodel.js)다. `load_test_v2` 라이브러리를 그대로 불러 쓰며 기존 소스는 수정하지 않았다.

## 사용한 모델 파일

| 모델 | 엔진 | 저장소 @ revision | 형식 | 크기 |
|---|---|---|---|---:|
| EXAONE 3.5 7.8B | Ollama·llama.cpp | `LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct-GGUF` @ `c618bf67` | GGUF Q4_K_M | 4.77 GB |
| EXAONE 3.5 7.8B | vLLM·SGLang | `LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct-AWQ` @ `e5026081` | 공식 AWQ | 5.30 GB |
| Gemma3 4B | Ollama·llama.cpp | `ggml-org/gemma-3-4b-it-GGUF` @ `d0976223` | GGUF Q4_K_M | 2.49 GB |
| Gemma3 4B | vLLM·SGLang | `gaunernst/gemma-3-4b-it-int4-awq` @ `8f28faf0` | 커뮤니티 AWQ 형식 | 4.04 GB |
| Gemma3 4B | vLLM·SGLang (로드 실패) | `unsloth/gemma-3-4b-it` @ `bf46152c` | 비양자화 BF16 | 8.60 GB |

가중치 파일의 크기와 SHA-256은 모두 Hugging Face 등록 값과 일치했다. 실제 해시는 각 `report.json`의 `weight_fingerprints`에 있다.

- 구글 공식 Gemma 저장소는 승인제라 받지 못했다. `unsloth/gemma-3-4b-it`의 두 가중치 파일은 `google/gemma-3-4b-it`와 SHA-256이 같다.
- `gaunernst/gemma-3-4b-it-int4-awq`는 AWQ로 양자화한 것이 아니다. 구글 QAT INT4 체크포인트를 AWQ 형식으로 변환한 비공식 파일이다. Gemma의 GGUF(기본 체크포인트의 Q4_K_M)와 같은 가중치가 아니다.
- 라이선스: EXAONE은 EXAONE AI Model License 1.1 - NC(비상업·연구용), Gemma는 Google Gemma 이용약관을 따른다.

## 설정별 최고 HTTP 완료 RPS

괄호 안은 최고값이 나온 U와 그 단계의 P95다. 완료 표본 20건 이상인 단계만 대상으로 했다. Qwen3-4B 열은 2026-10-02 측정값이다.

| 설정 | Qwen3-4B | EXAONE 3.5 7.8B | Gemma3 4B |
|---|---|---|---|
| Ollama 4 | 1.20 (U32, 27.0초) | 0.77 (U8, 14.0초) | 1.10 (U16, 16.6초) |
| llama.cpp 4 | 1.53 (U8, 7.2초) | 0.93 (U8, 10.7초) | 1.17 (U8, 7.9초) |
| vLLM 8 | 3.83 (U16, 6.1초) | 2.37 (U16, 8.8초) | 5.33 (U8, 3.4초) |
| SGLang 8 | 3.70 (U8, 3.8초) | 로드 실패 | 3.00 (U8, 12.6초) |
| vLLM 32 | 3.80 (U16, 6.4초) | 2.40 (U16, 9.8초) | 6.33 (U32, 8.1초) |
| SGLang 32 | 4.40 (U32, 10.4초) | 로드 실패 | 4.73 (U64, 31.5초) |

Gemma3 4B의 vLLM·SGLang 행은 커뮤니티 AWQ 형식 결과다. 비양자화 BF16은 네 설정 모두 로드되지 않았다.

## 출력 길이와 형식 통과율

Gemma의 요청 처리량이 높은 데는 답변이 짧은 영향이 크다. 아래는 각 설정 최고 단계의 평균 출력 토큰 수와 전체 완료 응답의 형식 통과 건수다. 형식 통과는 JSON 스키마와 근거 ID 존재 검사이며 의미 정답 판정이 아니다.

| 설정 | Qwen3-4B 토큰 / 형식 통과 | EXAONE 토큰 / 형식 통과 | Gemma 토큰 / 형식 통과 |
|---|---|---|---|
| Ollama 4 | 116 / – | 121 / 158·159 | 83 / 196·199 |
| llama.cpp 4 | 112 / 235·235 | 121 / 160·164 | 90 / 188·189 |
| vLLM 8 | 113 / 417·417 | 127 / 274·282 | 59 / 572·578 |
| SGLang 8 | 113 / 426·426 | – | 52 / 323·367 |
| vLLM 32 | 110 / 446·448 | 125 / 308·318 | 58 / 645·657 |
| SGLang 32 | 109 / 502·504 | – | 38 / 429·510 |

- vLLM 32에서 RPS × 평균 출력 토큰은 Qwen 약 418, Gemma 약 367, EXAONE 약 300이다. 요청 수로는 Gemma가 Qwen의 1.7배지만 생성 토큰량은 Qwen이 더 많다.
- Gemma + SGLang의 형식 통과율은 88%(SGLang 8)와 84%(SGLang 32)로 다른 조합(97% 이상)보다 낮았다. 원인은 확인하지 않았다.
- Qwen Ollama 4의 요청 원문 집계는 이 표를 만들 때 다시 읽지 못해 비워 두었다.

## 단계별 측정값

각 칸은 HTTP 완료 RPS / P95(초)다.

**EXAONE 3.5 7.8B**

| 설정 | U1 | U4 | U8 | U16 | U32 | U64 |
|---|---|---|---|---|---|---|
| Ollama 4 | 0.33 / 4.3 | 0.70 / 8.7 | 0.77 / 14.0 | 0.73 / 22.7 | 0.73 / 42.3 | – |
| llama.cpp 4 | – | 0.83 / 8.2 | 0.93 / 10.7 | 0.87 / 20.3 | 0.83 / 37.1 | – |
| vLLM 8 | – | 1.17 / 5.4 | 2.07 / 6.9 | 2.37 / 8.8 | 1.80 / 19.4 | – |
| vLLM 32 | – | – | – | 2.40 / 9.8 | 2.23 / 18.0 | 2.23 / 30.2 |

Ollama 4의 U1은 완료 10건으로 표본 기준(20건)에 못 미친다.

**Gemma3 4B**

| 설정 | U1 | U4 | U8 | U16 | U32 | U64 |
|---|---|---|---|---|---|---|
| Ollama 4 (Q4_K_M) | 0.67 / 1.8 | 0.83 / 9.3 | 1.03 / 8.6 | 1.10 / 16.6 | 0.97 / 31.6 | – |
| llama.cpp 4 (Q4_K_M) | – | 1.07 / 5.6 | 1.17 / 7.9 | 1.10 / 15.8 | 0.97 / 31.4 | – |
| vLLM 8 (AWQ 형식) | – | 3.03 / 1.9 | 5.33 / 3.4 | 4.60 / 5.0 | 4.30 / 8.7 | – |
| SGLang 8 (AWQ 형식) | – | 2.23 / 3.2 | 3.00 / 12.6 | 2.53 / 18.9 | 2.47 / 24.3 | – |
| vLLM 32 (AWQ 형식) | – | – | – | 5.60 / 5.1 | 6.33 / 8.1 | 6.23 / 14.2 |
| SGLang 32 (AWQ 형식) | – | – | – | 3.97 / 14.7 | 4.57 / 26.7 | 4.73 / 31.5 |

## 실패와 조건 차이

**로드 실패**

- EXAONE + SGLang 두 설정: EXAONE이 함께 배포하는 `modeling_exaone.py`가 `transformers.modeling_rope_utils.RopeParameters`를 불러오는데 고정 SGLang 이미지의 transformers 4.51.1에는 없다. `ImportError`로 종료했다. 계산 성능이나 처리량 0으로 기록하지 않는다.
- Gemma 비양자화 BF16 + vLLM·SGLang 네 설정: 가중치 8.01 GiB를 올린 뒤 KV 캐시에 쓸 메모리가 남지 않았다. vLLM은 `No available memory for the cache blocks`, SGLang은 `Not enough memory`로 종료했다. 당시 Windows가 약 2.7 GB를 쓰고 있었다. 12GB 카드의 용량 한계이며 더 큰 GPU에서는 시험하지 않았다.

**Gemma에서 바꾼 실행 조건**

Qwen·EXAONE과 같은 인자로는 Gemma AWQ 형식이 올라가지 않아 두 가지를 바꿨다. 처음 인자로 실패한 기록은 `gemma3_4b_awq_20261006_02_*`에 남겼다.

- dtype: vLLM이 gemma3에 float16을 허용하지 않아(`Numerical instability`) vLLM·SGLang 모두 `bfloat16`을 썼다.
- SGLang attention 백엔드: Triton 백엔드가 Gemma의 window attention을 지원하지 않아 `flashinfer`를 썼다. Qwen의 SGLang 조건(Triton)과 다르다.

**전송 실패**

llama.cpp에서 세 모델 모두 재사용 소켓 실패가 소량 있었다. Qwen 6/241건, EXAONE 7/171건, Gemma 5/194건이다. 다른 엔진의 HTTP 전송 실패는 0건이다.

**정리 검증 미통과 2건**

EXAONE의 Ollama 4와 vLLM 32는 측정 단계가 모두 완료됐지만 종료 뒤 VRAM 복귀 검사를 통과하지 못해 `cleanup_unverified`로 기록됐다. 두 번 모두 소유 컨테이너 제거와 포트 반환은 확인했다.

| 설정 | 시작 기준선 상한 | 허용 상한 | 종료 뒤 관측 |
|---|---:|---:|---:|
| Ollama 4 | 1,061 MiB | 1,125 MiB | 1,607 MiB |
| vLLM 32 | 1,646 MiB | 1,710 MiB | 1,849 MiB |

Windows 바탕화면 GPU 사용량이 측정 도중 200~500 MiB 변한 것으로 보인다. 각각 몇 분 뒤 다시 잰 값은 1,486~1,594 MiB와 1,645~1,704 MiB였다. Windows에서는 프로세스별 GPU 메모리를 확인할 수 없어 엔진 잔류가 아니라는 점을 엄격하게 증명하지는 못한다. 남은 잠금 파일은 실행기 프로세스 종료·실험 컨테이너 0개·포트 반환을 확인한 뒤 각 결과 폴더의 `retained_benchmark.lock.json`으로 옮겼다. 기준선 변동 때문에 EXAONE은 세 번에 나눠 실행했고 run마다 기준선이 다르다.

## 해석 제한

- EXAONE은 7.8B로 Qwen3-4B·Gemma3 4B의 약 두 배 크기다. 같은 체급 비교가 아니다.
- Gemma는 GGUF 엔진과 vLLM·SGLang이 서로 다른 가중치다. 엔진 간 차이에 가중치 차이가 섞여 있다.
- 모델마다 평균 출력 길이가 달라 요청 단위 RPS를 생성 속도로 바로 옮길 수 없다.
- 의미 정답률은 세 모델 모두 확인하지 않았다.
- Qwen 측정(10월 2일)과 이번 측정은 날짜와 바탕화면 GPU 사용량(기준선 2,252 MiB 대 1,061~2,744 MiB)이 다르다.
- 30초 단일 창이다. 지속 도착률·SLO 동시성·최적 설정을 확정하지 않으며 `formal_benchmark_eligible=false`, `c_slo=null`, `lambda_slo=null`이다.
- RTX 3060 결과를 T4·L4 수치로 환산하지 않는다.

## 결과 파일

경로는 `local/results/multimodel/` 기준이다. `results/`는 gitignore 대상이라 저장소에는 올라가지 않는다.

| 폴더 | 내용 |
|---|---|
| `gemma3_4b_20261006_01` | Gemma 여섯 설정. Ollama·llama.cpp 측정, BF16 네 설정 로드 실패 |
| `exaone35_7.8b_20261006_01` | EXAONE Ollama 4 (정리 검증 미통과) |
| `exaone35_7.8b_20261006_03` | EXAONE llama.cpp 4, vLLM 8, SGLang 8 실패, vLLM 32 (정리 검증 미통과) |
| `exaone35_7.8b_20261006_04_sglang_r32` | EXAONE SGLang 32 로드 실패 |
| `gemma3_4b_awq_20261006_03_*` | Gemma AWQ 형식 네 설정 (설정별 폴더) |
| `gemma3_4b_awq_20261006_02_*` | 처음 인자(float16·Triton)로 실패한 네 건 |
| `exaone35_7.8b_20261006_02`, `gemma3_4b_awq_20261006_01` | VRAM 허용치 512 MiB를 넘겨 라이브러리 한도(0~64)에 걸린 기록. 엔진 기동 전 종료, 측정 없음 |

각 폴더의 `report.json`에 설정·기준선·단계 요약이, 설정별 하위 폴더에 `u*_requests.jsonl`(요청·응답 원문), `u*_step.json`, `metrics.jsonl`, `server.log`가 있다. 모델 파일은 `model_assets/multimodel/`(약 24 GB, gitignore 대상)에 있다.

Qwen3-4B 비교 원본은 [results/v2/http_8rps_20261002_03](../results/v2/http_8rps_20261002_03/report.json), 전체 실험 결론은 [docs/CONCLUSIONS.md](../../docs/CONCLUSIONS.md)다.
