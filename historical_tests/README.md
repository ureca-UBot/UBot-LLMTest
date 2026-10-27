# 폴더 개편 이전 실험 원본

공통 엔진 개편 이전 브랜치의 전체 파일을 독립된 폴더에 보관합니다. 각 폴더 안의 파일은 해당 기준 커밋의 Git blob과 같은 바이트를 사용하며, 원본 응답·채점 결과·매니페스트를 재작성하지 않았습니다.

| 원본 브랜치 | 원본 커밋 | 전체 파일 수 | 보관 폴더 |
|---|---|---:|---|
| `codex-model-test` | `fe60c613576199a40c2ee19d30a26c854e1e5a24` | 41 | [codex-model-test/](codex-model-test/) |
| `huge-model-test` | `6b139a9f34abbe9a8eb81e89b0d05dd2e2c5c6cc` | 72 | [huge-model-test/](huge-model-test/) |
| `prompttest-judge` | `dc98685135613bfcfb02430c828a42e510e92dcd` | 5125 | [prompttest-judge/](prompttest-judge/) |

과거 문서에 적힌 실행 명령·경로·모델 선정은 당시 실험을 설명합니다. 현재 테스트는 [루트 README](../README.md)와 각 테스트의 `SETUP.md`를 따릅니다.

[PATH_MAP.csv](PATH_MAP.csv)에 파일별 원본 경로와 보관 경로, blob 해시를 기록했습니다.
