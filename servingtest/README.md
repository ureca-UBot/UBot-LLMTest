# LLM 서빙 엔진 실험

로컬 RTX 3060, NVIDIA T4, NVIDIA L4에서 수행한 서빙 엔진 비교 자료다.

| 폴더 | 용도 |
|---|---|
| [local](local/README.md) | 로컬 실험·모의 검증 결과 |
| [t4](t4/README.md) | T4 결과지·원시 로그·전달 자료 |
| [l4](l4/README.md) | L4 기본 비교·상한 확대·질문 다양화 |
| [tools](tools/README.md) | 분석·클라우드 준비·유지보수 도구 |
| [docs](docs/README.md) | 실험 결론과 설계 문서 |
| [load_test_v1](load_test_v1/ENGINES.md) | 보존한 기존 실행기 |
| [load_test_v2](load_test_v2/README.md) | 공통 조건과 메모리 정리를 적용한 실행기 |
| [model_assets](model_assets/README.md) | 모델 버전·캐시 메타데이터·정리 기록 |
| [archive](archive/README.md) | 복구용 사본·저장소 백업·이전 정리 기록 |

## 바로 확인할 자료

- [전체 실험 결론](docs/CONCLUSIONS.md)
- [최근 L4 상한 확대·질문 다양화 결과](l4/reports/L4_EXPANSION_RESULTS_20261003.md)
- [L4 기본 비교 결과](l4/reports/L4_SERVING_RESULTS_20261003.md)
- [T4 기본 비교 결과](t4/reports/T4_SERVING_RESULTS_20261002.md)

원시 측정 파일과 고정 소스는 보존했다. 과거 `docker_artifacts`·`results` 경로는 `.compat`의 연결·동일 파일 링크로 유지한다. 실제 자료의 정식 위치는 위 환경별 폴더다. 호환 경로는 VS Code에서 중복 표시하지 않도록 숨겼으며 데이터 사본을 추가한 것이 아니다.

이동·문서·도구 경로 수정 기록은 `archive/layout_history/cleanup_20261003`에 있다. Git 커밋·push와 원격 서버 변경은 수행하지 않았다.

## 클라우드에서 환경 재현

[서빙 환경 재현 안내](load_test_v2/docker/reproduce/README.md)에 공개 이미지 다운로드, 모델 준비, SGLang 의존성 설치와 네 엔진의 Compose 설정이 있다. Docker 이미지 빌드·TAR 없이 준비하고 한 엔진씩 실행·종료하며 GPU 메모리 해제를 확인한다.

[스크립트 실제 검증 결과](docs/SCRIPT_REPRODUCTION_VERIFICATION_20261003.md)에서 TAR·기존 모델 캐시 없는 준비 성공, 실제 의존성 버전 차이와 미검증 GPU 추론 범위를 확인할 수 있다.

2026-10-03에 이미지·모델 TAR와 가중치·검증용 다운로드 사본을 삭제했다. 코드·설정·측정 결과·버전·해시·검증 기록은 보존했다. 재실행 전 `prepare --engine all`로 필요한 이미지를 받고 모델을 다시 준비한다. [자산 삭제 내역](docs/ASSET_CLEANUP_20261003.json)과 [최종 보존 확인](docs/ASSET_CLEANUP_VERIFICATION_FINAL_20261003.json)에 파일별 기록이 있다.
