# 스크립트 환경 재현 검증 (2026-10-03)

**TAR·기존 모델 캐시 없이 소스만 복사한 폴더에서 `prepare --engine all`이 실제로 성공했다.** Docker 이미지 빌드는 실행하지 않았다. 실제 모델 추론과 Linux 엔진 종료 후 GPU 메모리 해제는 검증하지 않았다.

## 실행 환경과 방법

- Windows, Python 3.12.14, Docker Desktop의 Linux amd64 엔진 29.7.2, RTX 3060 / 드라이버 595.95.
- 검증 폴더: `.repro-state/validation/20261003_script_only/workspace`.
- 과거 고정 소스 47개와 새 재현 파일 10개만 복사했다. 시작 시 모델 폴더·TAR는 없었다.
- `plan --engine all`, `doctor`, `prepare --engine all`을 순서대로 실제 실행했다.
- 기존 Docker 이미지 레이어는 재사용됐다. 네 공개 digest의 레지스트리 조회와 `pull`은 성공했지만 모든 레이어를 빈 Docker 저장소에 새로 다운로드하는 검증은 아니다.

## 결과

| 확인 항목 | 결과 |
|---|---|
| Compose 기본 / GPU runtime / CDI 구성 해석 | 모두 성공. 준비 서비스는 GPU를 요청하지 않음 |
| 네 엔진 고정 공개 이미지 pull | 모두 성공, linux/amd64 identity 기록 |
| GGUF + AWQ 모델 다운로드 | 8개 파일, 5,179,190,143바이트(약 4.82GiB), 모두 크기·SHA-256 통과 |
| AWQ 설정·토크나이저·템플릿 확인 | 성공 |
| SGLang 새 Python 볼륨 설치 | 성공. 기존 완성 SGLang 이미지/TAR 사용하지 않음 |
| SGLang 핵심 7개 패키지 + Torch CUDA 12.4 | 기존 기준과 일치 |
| Ollama / llama.cpp 실행 파일 | 0.34.0 / build 11312 확인 |
| SGLang 읽기 전용 Python 볼륨 + 서버 `--help` | 성공 |
| vLLM / SGLang GPU 연결 + 서버 `--help` | 모두 성공. 모델은 로드하지 않음 |
| `prepare --engine sglang` 재실행 | 재설치 없이 검증·재사용. 준비 시각 유지, 이미지 4개·모델 2개 기록 유지 |
| 내려받은 AWQ 파일 손상 시 거부 | 실제 파일 변조를 거부한 뒤 원본 복원·전체 해시 재검증 성공 |
| 모의 검증 | 8개 통과 |
| 과거 고정 소스 | 47개 SHA 변경 없음 |
| 검증 컨테이너·활성 상태·작업 잠금 | 남은 컨테이너 없음, active.json/operation.lock 없음 |

vLLM은 GPU 없이 `--help`를 실행하면 장치 종류 추론에 실패했다. GPU overlay를 연결한 동일 명령은 성공했다. GPU 없는 준비 단계의 실패로 분류하지 않았다. CDI는 구성 해석까지만 확인했고 실제 GPU 연결에는 `gpus` overlay를 사용했다.

## 과거 SGLang 환경과의 차이

핵심 패키지는 동일하다: SGLang 0.4.6.post5, vLLM 0.8.4, Torch 2.6.0+cu124, sgl-kernel 0.1.4, FlashInfer 0.2.5+cu124torch2.6, Transformers 4.51.1, Triton 3.2.0.

| 패키지 | 과거 기록 | 이번 준비 |
|---|---|---|
| cuda-pathfinder | 1.8.2 | 1.8.3 |
| pip | 22.0.2 | 25.1.1 |
| ray | 2.58.0 | 2.59.0 |
| setuptools | 59.6.0 | 80.8.0 |
| six | 1.16.0 | 1.17.0 |
| torchaudio | 2.6.0 | 2.6.0+cu124 |
| wheel | 0.37.1 | 0.45.1 |

따라서 이 결과는 환경 준비 경로의 실제 성공을 확인한다. 과거 환경 전체가 완전히 동일하거나 같은 RPS를 낸다는 증거는 아니다. 실제 전체 패키지 버전과 pip freeze는 준비 영수증에 기록했다.

## 아직 확인하지 않은 범위

Windows에서 `start --engine ollama --hardware local`은 Linux에서 실행하라는 오류로 시작 전에 거부됐고 서버 활성 상태를 만들지 않았다. 현재 로컬 GPU는 다른 Windows 프로그램이 사용 중이며 0MiB 기준도 만족하지 않는다. Linux 호스트에서 실제 모델 로드·HTTP 응답·순차 시작/종료·동일 GPU UUID의 0MiB 및 compute PID 없음 3회 연속 확인은 후속 검증이 필요하다. 드라이버·NVIDIA Container Toolkit·Docker·Python이 없는 서버에 이 시스템 의존성까지 자동 설치한다는 뜻은 아니다.

## 증거 파일

경로는 모두 `servingtest` 기준이다. 런타임 파일은 `.gitignore`로 제외되고 기존 결과·TAR는 보존했다. 커밋·스테이징은 하지 않았다.

- `.repro-state/validation/20261003_script_only/verification.json`: 최종 검사 결과·이미지 identity.
- 같은 폴더의 `initial.json`, `plan.log`, `doctor.log`, `prepare.log`, `prepare-reuse.log`.
- 같은 폴더의 `compose-checks.json`, `model-integrity-checks.json`, `mock-tests.log`, `gpu-help-checks.json`.
- `workspace/.repro-state/ready.json`: 실제 준비 완료 영수증.
- `workspace/.repro-state/sglang-environment.json`: 실제 패키지 전체 버전·pip freeze·과거 환경과의 차이.
- `workspace/model_assets/portable`: 실제로 새로 내려받아 검증한 GGUF·AWQ 파일과 준비 영수증.

## 검증 이후 자산 정리 (2026-10-03)

사용자 요청으로 이미지·모델 TAR와 캐시의 가중치, 검증용 다운로드 사본을 삭제했다. 이 문서의 성공 결과는 삭제 전 검증 시점의 기록이며 검증 로그·패키지 inventory·SHA 영수증은 유지했다. 다운로드 모델의 설정·토크나이저·준비 영수증 사본은 `.repro-state/validation/20261003_script_only/model-metadata-after-cleanup`에 남겼다. 실제 가중치는 다시 `prepare --engine all`로 받아야 한다. 과거 완성 SGLang TAR도 삭제했으므로 부가 패키지 차이가 기록된 새 재현 환경을 사용한다.
