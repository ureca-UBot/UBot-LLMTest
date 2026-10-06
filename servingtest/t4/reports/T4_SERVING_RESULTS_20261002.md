# EC2 T4 서빙 엔진 측정 결과

측정일: 2026-10-02. NVIDIA T4 한 장에서 고정 여섯 설정을 실제 실행했다. **모두 목표 8 RPS에 미달했다.**

같은 Qwen3-4B 계열의 공식 GGUF/AWQ를 사용했다. 300문항, context 4096, 출력 상한 512, temperature 0, thinking off, HTTP 스트리밍·연결 재사용·재시도 0을 적용했다. 각 동시 요청 단계는 30초 창이며 창 안에서 완료한 정상 HTTP 스트림만 집계했다. drain 완료는 제외하고 지연·출력 품질·실패율의 합격 상한은 적용하지 않았다.

P는 엔진 내부 실행 상한, U는 클라이언트 동시 요청 수다. 최고값은 완료 표본 20건 이상인 단계 중 관측 최대값이다.

| 엔진·형식 | P | 최고값 관측 U | HTTP RPS | Ollama 대비 | 전체 측정 요청 HTTP 실패 |
|---|---:|---|---:|---:|---:|
| Ollama · GGUF Q4_K_M | 4 | 8 / 16 / 32 | 0.7333 | 1.0000 | 0 / 158 |
| llama.cpp · GGUF Q4_K_M | 4 | 8 / 16 | 0.9667 | 1.3182 | 117 / 290 |
| vLLM · AWQ | 8 | 32 | 1.8333 | 2.5000 | 0 / 243 |
| vLLM · AWQ | 32 | 64 | 1.9667 | 2.6818 | 0 / 268 |
| SGLang · AWQ | 8 | 16 / 32 | 0.7000 | 0.9545 | 0 / 130 |
| SGLang · AWQ | 32 | 32 / 64 | 1.9333 | 2.6364 | 0 / 262 |

vLLM P32와 SGLang P32는 같은 U64에서 59건과 58건을 완료했다. 평균 출력도 약 96.83·96.88토큰으로 비슷했다. **단일 30초 창의 완료 한 건 차이로 안정적인 승자를 확정하지 않는다.**

llama.cpp의 실패 117건은 모두 재사용 소켓의 빠른 `socket hang up`이다. 현재 0.9667 RPS를 안정적인 성능 우위로 해석하지 않는다. 다른 후보의 HTTP 완료 실패는 0건이다.

모든 엔진에서 소유 컨테이너·worker 종료와 포트 반환을 확인하고 같은 GPU에서 처음 고정한 VRAM 0 MiB·오차 0·compute PID 없음 상태를 연속 3회 확인했다. 기존 네 서비스는 유지했고 Docker 재시작·디스크 포맷·Git 커밋·push는 하지 않았다.

이 결과는 관측한 여섯 설정의 HTTP 완료 탐색이다. 최적 설정·지속 도착률·SLO 동시성·정확한 GGUF/AWQ 변환 계보를 확정하지 않으며 `formal_benchmark_eligible=false`, `c_slo=null`, `lambda_slo=null`이다.

## 결과 파일

- [전체 비교 JSON](D:/finalproject/llm/t4/reports/T4_SERVING_RESULTS_20261002.json)
- [엔진별 원본 보고서·요청 응답·로그](D:/finalproject/llm/t4/runs/t4_http_20261002_01/raw/)
- [최종 GPU·서비스 상태 검증](D:/finalproject/llm/t4/runs/t4_http_20261002_01/raw/final_remote_audit.json)

원본 분석 파일과 원문 측정 자료는 기존 폴더에 그대로 보존했다.
