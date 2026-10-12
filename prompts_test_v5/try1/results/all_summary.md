# prompts_test_v5 try1 — 사용자 요청으로 취소

2026-10-12에 `v5_i2` 본 테스트를 시작했으나, 수정사항 발견에 따른 사용자 요청으로 생성 단계에서 중단했다. 관련 실행 프로세스의 종료를 확인했다. Judge는 실행하지 않았다.

- 대상: `qwen3:4b-instruct` Q4_K_M, temperature 0, 로컬 Ollama 0.40.2.
- 데이터: `test_set4r`, 프롬프트: `base_i2.md` + `status_rules_i2.md` + `output_order.md`.
- 계획: NC·MC·UI·CE·PI·SR·HR·CF·MT·AD·AR 각 100건, 총 1,100건. EC·RT·PS 제외.
- 저장된 응답: **1,051건**, 생성 오류 0건. 나머지 49건은 미생성.
- 결정론 채점·Judge·비교 보고서: 미실행. 미완료 실행이므로 품질 결론을 내리지 않는다.
- 원본 응답: [generation.jsonl](raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/generation.jsonl).
- 실행 설정: [run_info.json](raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/run_info.json).

기존 응답과 설정은 보존했다. 수정된 프롬프트·데이터로 다시 실행할 때는 별도 run 또는 try를 사용해 이 미완료 응답과 섞지 않는다.
