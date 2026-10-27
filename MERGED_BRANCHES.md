# 브랜치 통합 안내

2026-10-27 기준 원격 브랜치 17개의 이력을 `main`에 통합했습니다.

현재 공통 엔진과 입력·출력 가드 테스트는 기존 경로를 사용합니다. 폴더 개편 이전의 독립 실험 세 개는 `historical_tests/`에 전체 원본을 보관했습니다. 다른 파일을 덮어쓰지 않고 당시 코드·입력·응답·채점 결과를 함께 볼 수 있습니다.

이번 통합은 저장된 코드와 결과를 병합한 작업입니다. 모델 호출이나 외부 Judge 재실행으로 결과를 새로 만든 것은 아닙니다.

| 브랜치 | 통합 기준 커밋 | 자료 위치 |
|---|---|---|
| `codex-model-test` | [`fe60c61`](https://github.com/ureca-UBot/UBot-LLMTest/commit/fe60c613576199a40c2ee19d30a26c854e1e5a24) | [historical_tests/codex-model-test/](historical_tests/codex-model-test/) |
| `data/faq-evaluation-sets` | [`4a6df6f`](https://github.com/ureca-UBot/UBot-LLMTest/commit/4a6df6f71082bd606dce8dfa5a262557e2ab0056) | [data/raw/faq-evaluation-sets/](data/raw/faq-evaluation-sets/) |
| `docs/refact` | [`314e6cd`](https://github.com/ureca-UBot/UBot-LLMTest/commit/314e6cd88aca7c8a13c2249d4814c55983f52d1a) | [README.md](README.md) |
| `huge-model-test` | [`6b139a9`](https://github.com/ureca-UBot/UBot-LLMTest/commit/6b139a9f34abbe9a8eb81e89b0d05dd2e2c5c6cc) | [historical_tests/huge-model-test/](historical_tests/huge-model-test/) |
| `llm-model-test` | [`e6a47d8`](https://github.com/ureca-UBot/UBot-LLMTest/commit/e6a47d857f47ec6c2a94d239a59ea5806fff2b09) | [model_test_v2/](model_test_v2/) |
| `prompt-test` | [`3b144b1`](https://github.com/ureca-UBot/UBot-LLMTest/commit/3b144b185644cafa2a1e4a827637d26c3e2970d0) | [historical_tests/prompttest-judge/](historical_tests/prompttest-judge/) |
| `prompttest-judge` | [`dc98685`](https://github.com/ureca-UBot/UBot-LLMTest/commit/dc98685135613bfcfb02430c828a42e510e92dcd) | [historical_tests/prompttest-judge/](historical_tests/prompttest-judge/) |
| `results/faq-380-test` | [`2a4149d`](https://github.com/ureca-UBot/UBot-LLMTest/commit/2a4149d95e7b78b2b365d4c6b06ff13fb51588c6) | [model_test_v2/](model_test_v2/) |
| `results/test3` | [`fa7d7e4`](https://github.com/ureca-UBot/UBot-LLMTest/commit/fa7d7e45d28938bb28c0cc4bd0f520aa66e6f9b1) | [model_test_v1/](model_test_v1/) |
| `serving` | [`d745356`](https://github.com/ureca-UBot/UBot-LLMTest/commit/d74535691b50aba668034aed3e810fd7854c5c3c) | [servingtest/](servingtest/) |
| `test/ai-guard-input` | [`1f6a102`](https://github.com/ureca-UBot/UBot-LLMTest/commit/1f6a102b633a13c77d1a6f6422a0a6960f2ca4b9) | [model_test_v7/README.md](model_test_v7/README.md) |
| `test/faq-guard` | [`337bcc3`](https://github.com/ureca-UBot/UBot-LLMTest/commit/337bcc3c40cfb2124bf5571b9f52c5d0d6ccc6cc) | [model_test_v6/README.md](model_test_v6/README.md) |
| `test4/llm-judge-eval` | [`4b95705`](https://github.com/ureca-UBot/UBot-LLMTest/commit/4b95705ebbb353ab41c6b99fef9250e97c760a7b) | [tset_4_llm_test/README.md](tset_4_llm_test/README.md) |
| `test4/prompt-tuning` | [`a36e55d`](https://github.com/ureca-UBot/UBot-LLMTest/commit/a36e55d4eafec51ab70da47ec36323736f698f17) | [prompts_test_v3/SETUP.md](prompts_test_v3/SETUP.md) |
| `test4/script` | [`a7841e6`](https://github.com/ureca-UBot/UBot-LLMTest/commit/a7841e6107d1bacc123f6664d346ac19ed49f390) | [model_test_v4/SETUP.md](model_test_v4/SETUP.md) |
| `test5/prompts_tuning` | [`0c13877`](https://github.com/ureca-UBot/UBot-LLMTest/commit/0c138777eb71f915c758058fa4d12b221d25a261) | [prompts_test_v9/SETUP.md](prompts_test_v9/SETUP.md) |
| `test5/script` | [`15d6029`](https://github.com/ureca-UBot/UBot-LLMTest/commit/15d60299e1804c32bd1333687cf97f006e2221ed) | [model_test_v5/SETUP.md](model_test_v5/SETUP.md) |

## 이전 실험의 경로와 원본 보존

- [과거 실험 안내](historical_tests/README.md)
- [파일별 원래 경로·통합 후 경로·원본 Git blob 해시](historical_tests/PATH_MAP.csv)

`prompt-test`의 변경은 후속 `prompttest-judge` 이력에, `test5/script`의 변경은 후속 `test5/prompts_tuning` 이력에 포함됩니다. 기존에 병합된 브랜치를 포함해 모든 기준 커밋의 도달 가능성을 확인합니다.
