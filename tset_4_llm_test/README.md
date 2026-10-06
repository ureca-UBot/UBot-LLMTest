# tset_4_llm_test — LLM Judge 사람 평가용 소규모 실행

LLM Judge 판정이 믿을 만한지 사람이 직접 확인하기 위한 실행이다(2026-10-06).
test4(`model_test_v4/test.config.js`) 설정을 그대로 상속하고 **항목당 10건 서브셋**만 추가했다
(`test.config.js` 참고). 평가 기준·Judge 설정(Codex CLI `gpt-6-sol` · reasoning effort medium)·
프롬프트·생성 조건은 test4와 같고, 모델은 `qwen3:4b`(추론 OFF)만 돌린다.

| 구분 | 값 |
|---|---|
| 데이터 | `data/raw/FAQ_RAG_2800건_의도균등FAQ_v4반영본.xlsx` → `dataset/` (v4 `test_set4`와 같은 원본, 같은 seed) |
| 규모 | 14개 항목 × 10건 = 140건 (난이도 비율 유지, RT는 원본 질문 1개 × 10회). v4의 50건 서브셋에 포함된다 |
| 모델 | **`qwen3:4b`(추론 OFF) 하나만** — temperature 0. 다른 모델은 `test.config.js`에서 빼서 실행되지 않는다 |
| Judge 종류 | accuracy(전 행) · safety(AD) · persona(PS) |

## 사람 평가 파일

`try1/results/llm_judge/<batch>_human_review.md` — 문항 1개 = 블록 1개(항목별 목차 포함).
**제공 내역**(사용자 질문 · 대화 이력 · 사용자 정보·API/페르소나 지시(있을 때) · 제공 Context · 정답 예시 · 기대 상태) →
**상담봇 답변**(상태 · 근거 · 답변) → **LLM Judge**(정확도/안전성/페르소나별 판정 · reason · 특이사항) → **사람 평가**(체크박스·메모) 순서다.
정확도 Judge는 상담봇 답변 문장만 보고 판정한다(상태·근거는 Judge에 주지 않음 — 참고용으로만 표시).

## 다시 실행하는 법

모든 명령에 `--test tset_4_llm_test`를 붙인다(저장소 루트에서).

```bash
node scripts/run/prepare_dataset.js --test tset_4_llm_test --check
node scripts/run/run_all.js --test tset_4_llm_test --size 10
node scripts/judge/build_batch_manifest.js --test tset_4_llm_test --batch judge-eval-n10 --size 10
node scripts/judge/judge_prepare.js --test tset_4_llm_test --batch judge-eval-n10
node scripts/judge/judge_run.js --test tset_4_llm_test --batch judge-eval-n10 --confirm-external --concurrency 4
node scripts/docgen/judge_report.js --test tset_4_llm_test --batch judge-eval-n10
node scripts/docgen/judge_review_export.js --test tset_4_llm_test --batch judge-eval-n10   # 사람 검토 md
```

Windows에서 `codex`가 PATH에 없으면 `LLM_JUDGE_CODEX_BIN`에 Codex 앱의 `codex.exe` 경로를 넣는다
(예: `%LOCALAPPDATA%\OpenAI\Codex\bin\<hash>\codex.exe`).
