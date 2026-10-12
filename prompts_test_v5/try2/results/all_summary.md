# prompts_test_v5 try2 — 사용자 요청으로 취소

2026-10-12에 일반 지식·추측 보충 금지와 상태 규칙 주의 1·3을 보완한 `v5_i2`로 본 테스트를 시작했으나, 출력 순서 문구 변경에 따른 사용자 요청으로 생성 단계에서 중단했다. 실행 중인 Node 프로세스가 없음을 확인했다. Judge는 실행하지 않았다.

- 대상: `qwen3:4b-instruct` Q4_K_M, temperature 0, 로컬 Ollama 0.40.2.
- 데이터: `test_set4r`, 이 실행의 프롬프트: `base_i2.md` + `status_rules_i2.md` + **`output_order.md`**.
- 계획: NC·MC·UI·CE·PI·SR·HR·CF·MT·AD·AR 각 100건, 총 1,100건. EC·RT·PS 제외.
- 저장된 응답: **200건**, 생성 오류 0건. 나머지 900건은 미생성.
- 결정론 채점·Judge·비교 보고서: 미실행. 미완료 실행이므로 품질 결론을 내리지 않는다.
- 원본 응답: [generation.jsonl](raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/generation.jsonl).
- 실행 설정: [run_info.json](raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/run_info.json).
- 모델에 전달한 실제 프롬프트: [system_prompt.md](summary/system_prompt.md), SHA-256 `bf33ed7ae3d852b62132acbe431e5eb7125ea33cf44d2a6e9e1205b60ede233d`.

취소 후 현재 `v5_i2` 조합은 `output_order_t1b.md`로 변경됐다. 이 문서는 취소된 실행의 기록이며 실제 프롬프트 스냅샷과 응답은 보존한다. 새 조합의 본 테스트는 `try3`에서 진행할 예정이며 아직 실행하지 않았다.
