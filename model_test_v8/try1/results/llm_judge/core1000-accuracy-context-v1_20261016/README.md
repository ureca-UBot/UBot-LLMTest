# v8 try1 — 내용 평가 결과 읽는 순서

저장된 FAQ 코어 1,000건을 팀 Judge로 평가하고 문제 판정 390건·대조군 10건을 FAQ와 재검토했습니다. 원판정과 Codex 의견을 분리했습니다.

1. [평가 보고서](evaluation_report.md): 전체 수치, 조회 유형별 한계, 실제 문제와 우선순위.
2. [문제·대조 사례 400건](review/README.md): 질문·실제 답변·제공 FAQ·원판정·재검토 의견을 40건씩 읽기.
3. [전체 1,000건 판정 CSV](case_results.csv), [변경 사례 CSV](review_changes.csv): 정렬·필터용. `assistant_rechecked=false`인 600건은 원판정을 유지했을 뿐 추가 검수한 것이 아닙니다.
4. [원판정 1,000건 JSONL](accuracy.jsonl), [재검토 400건 JSONL](assistant_review.jsonl), [집계 JSON](metrics.json).
5. [고정한 평가 조건](inputs/manifest.json), [기본 루브릭](inputs/base_accuracy_rubric.txt), [실행 조건 부칙](inputs/cohort_addendum.txt), [실제 적용 프롬프트](inputs/accuracy_system_prompt.txt), [실제 입력](inputs/accuracy_jobs.jsonl), [호출 로그](runs/calls/accuracy.calls.jsonl).
6. [FAQ 번호 표시 보조 관찰](format_observations.json), [형식 사례 CSV](format_findings.csv), [검증 결과](evaluation_verification.json), [파일 해시](artifact_manifest.json).

자동 평가 원판정 정답 **633/1,000**, 근거 이탈 **256/1,000**. 재검토 반영 의견 정답 **702/1,000**, 근거 이탈 **303/1,000**. 재검토는 사람의 정답 라벨이 아닙니다. 정확도와 근거는 서로 다른 축입니다.

이번에는 저장 답변을 채점했으며, 모델을 다시 생성하거나 가드를 실행하지 않았습니다. 기존 질문·FAQ·모델 답변·실행 원자료는 그대로 보관됩니다. 기존 원자료 속 '평가 전' 표시는 최초 실행 당시 기록이며 이번 결과는 이 별도 폴더에서 읽습니다.
