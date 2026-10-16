# v8 try2 — 출력 가드 최종 답변 평가

정상 FAQ 1,000건의 저장된 최종 답변을 기존 팀 Judge로 전수 평가했습니다. **정답 614건·오답 386건·근거 이탈 161건**입니다. 이전 가드 없는 원판정과 같은 기준으로 비교했습니다.

1. [평가 보고서](evaluation_report.md): 기준·결과·전후 비교·오차단 해석·한계.
2. [질문·최종 답변·실제 FAQ 1,000건](cases/README.md): 40건씩 읽기.
3. [선정 80건의 FAQ 대조 의견](selected_review.md): 원판정과 분리된 Codex 의견.
4. [전체 CSV](case_results.csv) · [문항별 전후 비교](paired_comparison.csv) · [집계 JSON](metrics.json).
5. [평가 입력·기준 manifest](inputs/manifest.json) · [실행 검증](evaluation_verification.json).

`accuracy.jsonl`은 원판정이며 `assistant_review.jsonl`은 선정 사례 의견입니다. `inputs/`는 실제 평가 자료·루브릭·스키마이고 `runs/calls/accuracy.calls.jsonl`은 원래 호출 로그입니다. 원본 답변·기존 try1·평가 엔진을 고치지 않았습니다.
