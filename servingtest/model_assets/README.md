# 로컬 실험 모델 저장소

2026-10-03 대용량 자산 정리: 모델 가중치와 이미지 전달 TAR는 삭제했다. 측정 결과·코드·모델/이미지 버전·해시·매니페스트는 보존했다. 이후 준비는 `load_test_v2/docker/reproduce/reproduce.py prepare --engine all`을 사용한다. 아래 이전 경로·용량 설명은 당시 보관 상태의 기록이다.

모델 가중치와 캐시를 측정 결과에서 분리한 폴더다. 2026-10-02에 기존 저장소 세 개를 같은 드라이브 안에서 이동했다. 모델 파일의 중복 사본은 삭제하지 않았다.

| 위치 | 내용 | 이동 시 용량 |
|---|---|---:|
| `huggingface/` | Qwen3-4B 원본 BF16, 공식 AWQ, 공식 GGUF와 tokenizer·template·Hub 캐시 | 12.321 GiB |
| `ollama/thinking_2507/` | 이전 `qwen3:4b` Thinking-2507 Ollama 저장소 | 2.326 GiB |
| `ollama/qwen3_4b_classic/` | Qwen3-4B classic GGUF를 등록했던 Ollama 실험 저장소 | 2.326 GiB |

Qwen3-4B classic과 Thinking-2507은 다른 체크포인트이므로 같은 성능 비교에 섞지 않는다. BF16·AWQ·GGUF는 캐시의 원래 하위 구조를 보존했다. Hugging Face의 `snapshots`와 저장소별 `blobs`에는 WSL 링크가 있으며 Windows에서 0바이트로 표시될 수 있다. 실제 데이터는 `huggingface/hub/blobs` 아래에 있다. 링크만 따로 옮기지 말고 캐시 전체를 유지해야 한다.

실행 경로는 `load_test_v2/scripts/dev/model_assets.js`에서 관리한다. 후보의 host mount 원본만 새 경로로 바꿨으며 `/hf`, `/root/.cache/huggingface`, `/models` 같은 컨테이너 내부 경로는 기존 정의를 사용한다. HTTP 탐색의 임시 Ollama 모델은 계속 소유 컨테이너 내부에 생성한다.

이동 전후 경로와 파일별 크기·수정 시각·속성은 `relocation_manifest.json`에 기록했다. Linux에서 한 링크·가중치 검사 결과는 `link_verification.json`이다. 과거 측정 결과와 보고서는 당시 경로·SHA-256을 유지하며 현재 파일 위치를 찾을 때 이 이동 기록을 사용한다. 이 폴더의 Ollama 저장소에는 서버 식별 키가 포함돼 있으므로 소스 코드 공유용 파일 묶음에 포함하지 않는다.
