# prompts/docgen — 결과 문서 생성·정리용 프롬프트

지금은 비어 있다. 결과 문서(`judge_report`·`build_run_report`·`compare_runs`)는 LLM 없이 코드로 만든다.

LLM으로 문서를 쓰거나 정리하게 되면(예: all_summary 해석 초안, 오답 사례 요약) 프롬프트를 이 폴더에 두고 `scripts/docgen/`에 별도 스크립트를 만든다. 판정 루브릭(`prompts/judge/`)을 재사용하거나 판정 스크립트(`scripts/judge/`)에 끼워 넣지 않는다.
