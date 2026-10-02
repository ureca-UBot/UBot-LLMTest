# model_test_v4 — 테스트 항목 · 라운드별 스크립트 · 실행 순서

v4는 **저급 모델 튜닝 전 기준선(레거시)**을 만드는 테스트다. 이후의 동시성·프롬프트·top-k 테스트는 이 결과와 비교한다. v4부터 스크립트는 저장소 루트 `scripts/`(공통 엔진)를 쓰고, 이 버전에서 바뀌는 값은 [`test.config.js`](test.config.js) 한 파일에만 있다. 엔진 사용법은 [`scripts/README.md`](../scripts/README.md)에 있다.

| try | 내용 | 결과 요약 |
|---|---|---|
| try1 | (예정) LLM 단독 · Context 고정 · `qwen3:4b` OFF · `gemma3:4b` · 항목당 200건 | `try1/results/all_summary.md` (실행 후 작성) |

## 1. 테스트 목표와 이전 버전 대비 변경점

**목표**

- v3에서 1차 MVP로 고른 `qwen3:14b` OFF는 동시성·비용이 부담된다. 그래서 가능성이 높은 저급 모델을 튜닝해 대체할 수 있는지 본다. 이 버전은 튜닝 전 기준선을 만든다.
- 4b 모델(`qwen3:4b` OFF, `gemma3:4b`)부터 진행한다. 튜닝으로 더 좋아지지 않거나 트레이드오프 때문에 포기하게 되면 `qwen3:8b` OFF를 고려한다.

**v3 try1 대비 변경점**

| 구분 | v3 try1 | v4 |
|---|---|---|
| 데이터셋 | `test_set2` 13개 항목 · 고유 300 + 반복 80 = 380건 | **`test_set3` 14개 항목 × 200건 = 2,800건** (실제 백엔드 FAQ 1,024건 기반). 간이용 50/100/150건 서브셋. 현재 `cases_fixed.csv`는 아직 SF 포함 15항목·3,000행 구조이고, 데이터셋을 다시 만들 때 14항목·2,800행으로 맞춘다 |
| 항목 | 13개 + 반복(평가 지표) | 13개 + **페르소나(PS)** + **반복 테스트(RT)를 독립 항목으로** − **SF(단일 FAQ 답변) 제외**(top-k 3 고정으로 "FAQ 1개만 주어짐" 상황 자체가 없어짐, 2026-10-02) |
| 반복 | 40문항 × 3회차 | RT: 원본 질문 20개 × 10회 |
| 기대 상태·출력 status | 6종(CLARIFY 포함) | **5종(ANSWER·PARTIAL·ABSTAIN·CONFLICT·OUT_OF_SCOPE)** — CLARIFY를 출력 계약에서도 뺌(되묻기는 ABSTAIN/PARTIAL 안에서, Judge가 건수만 따로 집계 `asks_user`). CONFLICT는 한 번 뺐다가 같은 날(2026-10-02) 다시 넣음 — test3에서 모델이 CONFLICT를 출력한 55건의 정밀도 47%·재현율 51%를 확인했지만, "FAQ끼리 모순"과 "자료 없음"(ABSTAIN)을 구분할 실익이 있다고 판단. 정의는 버전·시행일·우선순위로 해결되는 차이를 뺀 좁은 의미로 한정. 데이터 정리(판정 아님): 기대 ANSWER↔PARTIAL 교차, 기대 OUT_OF_SCOPE·CONFLICT인데 ABSTAIN으로 덜 확정한 경우(반대 방향 제외)는 정답+상태 집계에서 정답으로도 보되 교차 건수는 조합별로 따로 집계 |
| 입력 | 대화 이력 텍스트 | 대화 이력·사용자 정보/API가 JSON, 페르소나 지시는 시스템 영역 |
| 프롬프트 | v0(`SYSTEM_PROMPT`) | **`v4_base`** (`prompts/chatbot/`) = 공통 문단(v0 + test_set3 데이터셋 공통 프롬프트 통합: 존댓말·명령은 데이터·수치 보존·누락값 0 금지·시행일 규칙·조회 상태 조건·페르소나 적용 원칙) + status 판정 기준(v1 수정본을 **고른 근거 기준**으로 다시 씀, status-answer 일치 규칙 추가) + 출력 순서 지시. 보류 시 evidence_ids는 빈 배열 |
| 출력 순서·형식 | `status → answer → evidence_ids` · JSON 모드 | **`evidence_ids → status → answer`** · Ollama 구조화 출력(JSON 스키마)으로 순서와 status enum을 강제 |
| 대상 모델 | 7개 + 추론 OFF 4개 | `qwen3:4b` OFF · `gemma3:4b` (다음 단계 `qwen3:8b` OFF) |
| 생성 조건 | t0_think · t0_nothink · t08_think | `t0_nothink` (temperature 0, 추론 가능 모델은 OFF) |
| 평가 방식 | 결과론적 통과/실패 + AI 재판단 | README 4-9절: **통과율 없이 원래 값**, 재판단 없음, LLM Judge 전수(별도 단계) |
| LLM Judge | Codex CLI `gpt-6-astra` · 정확도(상태 적절성 포함)·근거·표현 + 안전성 | **Codex CLI**(ChatGPT 구독 인증 — OpenAI API 토큰 과금 아님) · 모델 **`gpt-6-sol`**(v2·v3 `gpt-6-astra`와 같은 라인업의 후속, 2026-10-02 — `codex --help`로 실제 식별자 재확인 전) · 추론 강도 **medium**(v2·v3와 동일) · 정답률은 답변 문장만 보고 판정(상태·라벨 무관) · 정확도는 [정답 예시] 전체와 의미 비교(체크리스트 대조 아님, 2026-10-02 — [필수 사실·표현 기준]을 accuracy 입력에서 뺌) · 환각은 5종으로 분류(FABRICATION·FALSE_COMPLETION·MISATTRIBUTION·UNSUPPORTED_GENERALIZATION·SILENT_CONFLICT_PICK) · + **페르소나** 채점 · 반복 회차도 채점 · 판정 단계와 문서 생성 단계의 스크립트·프롬프트 분리 |
| RAG 근거(참고) | premise = 제공 Context만 | premise에 사용자 정보·API와 대화 이력 포함 |
| 스크립트 | 버전 폴더에 복사 | **루트 `scripts/` 공통 엔진** + `test.config.js` |
| 컨텍스트 방식 | 고정 Context | 고정 Context(`fixed`). 임베딩 검색 적용 테스트는 이후 추가 |

## 2. 대상 모델

| 모델 | 추론 | 기본 실행(`run_all.js`) |
|---|---|---|
| `qwen3:4b` | OFF | ✅ |
| `gemma3:4b` | 없음 | ✅ |
| `qwen3:8b` | OFF | ⬜ (4b 튜닝 한계 확인 후 `run_model.js`로) |

## 3. 테스트 항목

원본은 `data/raw/FAQ_RAG_15개항목_각200건_총3000건_피드백수정본.xlsx`('테스트 3000건' 시트)이고, 준비된 파일은 `data/eval_sets/test_set3/cases_fixed.csv`이다. 모든 항목은 난이도 Easy 60 · Medium 80 · Hard 60이다.

**SF(단일 FAQ 답변)는 제외한다(2026-10-02).** top-k를 3으로 고정해서 상담봇에 항상 FAQ 3개가 주어지므로 "FAQ 1개만 주어짐"이라는 SF의 전제 상황 자체가 발생하지 않는다. `test.config.js`의 `items`에서 이미 뺐다. 아래 표·건수는 **데이터셋을 다시 만들 때 반영할 목표 구성**이며, 현재 `cases_fixed.csv`는 아직 SF 200행을 포함한 15항목·3,000행이다. RT(반복 테스트)의 `RT-0001`은 대표 질문을 SF-0001에서 가져오는데, 이 매핑도 데이터셋을 다시 만들 때 다른 항목의 질문으로 교체한다(기존 데이터셋 자체의 문제라 지금 당장 고치지 않는다).

| # | 코드 | 항목 | 건수 | 기대 상태 구성 |
|---|---|---|---|---|
| 1 | NC | 유사 FAQ 구분·노이즈 | 200 | ANSWER 200 |
| 2 | MC | 다중 FAQ 조합 | 200 | ANSWER 198 · PARTIAL 2 |
| 3 | UI | 사용자 정보 + FAQ | 200 | ANSWER 160 · PARTIAL 40 |
| 4 | CE | 조건·예외·경계값 | 200 | ANSWER 200 |
| 5 | PI | 부분 정보 | 200 | PARTIAL 200 |
| 6 | SR | 유사하지만 답 없음 | 200 | ABSTAIN 200 |
| 7 | HR | 무관 FAQ | 200 | ABSTAIN 200 |
| 8 | EC | 빈 컨텍스트 | 200 | ABSTAIN 200 |
| 9 | CF | FAQ 충돌·시행일 | 200 | CONFLICT 80 · ANSWER 100 · ABSTAIN 20 |
| 10 | MT | 멀티턴 대화 | 200 | ANSWER 199 · ABSTAIN 1 |
| 11 | AD | 적대적 입력·범위 밖 | 200 | ANSWER 140 · OUT_OF_SCOPE 60 |
| 12 | AR | API 결과 답변 | 200 | ANSWER 110 · ABSTAIN 50 · PARTIAL 40 |
| 13 | PS | 페르소나 (역할·말투 유지 100 · 사용자 특성 맞춤 100) | 200 | ANSWER 192 · PARTIAL 6 · ABSTAIN 2 |
| 14 | RT | 반복 테스트 (원본 20개 × 10회) | 200 | ANSWER 130 · ABSTAIN 40 · PARTIAL·CONFLICT·OUT_OF_SCOPE 각 10 |
| | | **합계** | **2,800** (독립 표본 2,600 + 반복 200) | |

**서브셋 규칙**(`--size`):

- 항목마다 원본 질문 단위로 난이도(PS는 하위 항목까지) 비율을 유지해 뽑는다.
- 순서는 `sha256(seed + ID)`로 고정되어 있어, 50 ⊂ 100 ⊂ 150 ⊂ 200 관계가 항상 성립한다.
- RT는 원본 질문 5/10/15/20개를 뽑고, 각 질문의 10회를 모두 넣는다.
- 배분 결과는 `data/eval_sets/test_set3/dataset_manifest.json`에 기록된다.

**평가 기준**

| 구분 | 지표 | 분모 |
|---|---|---|
| LLM Judge | 내용 정확도(CORRECT 비율 — **Judge가 답변 본문만 보고 판정**, status·evidence_ids는 Judge에 주지 않음). [정답 예시] 전체와 의미를 비교하며 문장을 쪼개 체크리스트로 대조하지 않는다(2026-10-02 — [필수 사실·표현 기준]을 입력에서 뺌. 비PS 2,600행에서 이 필드가 정답 예시에 번호만 붙인 것과 동일해 중복이었고, 번호 매김이 "항목 하나하나 다 있어야 CORRECT"로 유도하는 경향이 있었다) | 채점 성공 행 (전체 요약은 독립 표본) |
| LLM Judge | 환각률(근거 점수 1~3 = 입력으로 뒷받침되지 않는 실질적 주장이 있는 비율) · 근거 점수/5 · **환각 종류**(claim마다 type, 2026-10-02): FABRICATION 순수 창작 / FALSE_COMPLETION 완료 조작(실행 안 된 작업을 했다고 말함, 전 행 대상 — 이전엔 페르소나 지시 있는 PS 200행에서만 봄) / MISATTRIBUTION 대상·시점 오귀속(다른 상품·회선·매장·과거 시점 사실을 지금인 것처럼) / UNSUPPORTED_GENERALIZATION 근거 없는 일반화("보통"류) / SILENT_CONFLICT_PICK 조용한 충돌 해소(기존 별도 불리언을 흡수). 수치·계산 자체의 오류(입력 값은 맞는데 비교·연산이 틀림)는 환각이 아니라 정확도의 사실 오적용/모순으로 본다 | 채점 성공 행 (전체 요약은 독립 표본) |
| LLM Judge | 안전성 SAFE/UNSAFE/OVER_REFUSAL/NOT_APPLICABLE | AD 200행 |
| LLM Judge | 페르소나 준수 · 역할·말투/5 · 사용자 맞춤/5 · 위반 유형(FALSE_COMPLETION은 2026-10-02부터 여기서 뺌 — 환각 축에서 전 행 대상으로 봄) | 페르소나 지시가 있는 행 |
| 결과론적 | 기대 상태 일치 · 상태별 재현율/정밀도 · 부재 판단 P/R/F1 | 독립 표본 |
| 결과론적 | 근거 채택률(evidence_ids가 하나 이상이고 모두 정답 근거 문서 — 틀린 문서 없음) · 엄격 채택률(정답 근거 문서 전부 인용) · 정확 인용 · 인용 정밀도 · 채택 분류(EXACT/WITH_EXTRA/PARTIAL/WRONG/NONE) · Context에 없는 ID 인용 | 기대 상태 ANSWER·PARTIAL·CONFLICT이고 정답 근거 문서가 있는 행, **AR 제외**(API만으로 답하면 빈 인용이 정상) — 전체 2,800행 기준 대상 행 수는 데이터셋을 다시 만든 뒤 갱신(SF 제외 전 3,000행 중 2,067행이었음) |
| 교차 | 근거 채택 × 환각(Judge) 2×2 | 위 대상 중 Judge 채점 행 |
| 오답 이유 (코드 아님) | **근거 오류**(본문 출처 `content_sources` vs 정답 문서 — 코드 판단) → **필수 사실 누락**(Judge) → **사실 오적용/모순**(Judge) → **기타**. 배타 분류(위에서부터 처음 걸린 것 하나), 환각 동반은 칸마다 별도 표시. 상태(본문 행동) 불일치는 섞지 않는다 — 2026-10-02에 과대/과소/교차를 최우선으로 보던 경로표(P0~P7)·튜닝 코드(A/B/C/D/E/F/S) 체계를 폐기했다 | 독립 표본 |
| 정합 (코드) | status-본문 일치, 방향 일치(라벨 기준 vs 본문 기준 — 상태가 다르게 표기된 경우는 여기서만 본다), 라벨만 틀림, 근거-본문 일치(느슨 = 본문에 쓴 문서를 모두 인용 / 엄격 = 같음), 채택 일치(인용 기준 vs 내용 기준), **답했는데 근거 미기재**(라벨 기준은 결정론 `score_evidence`, 본문 기준은 Judge) | 독립 표본 |
| 결과 | **정답 · 정답+상태(+완화) · 정답+근거 · 정답+근거+상태(+완화)** — 정답은 답변 문장만 본 Judge 판정, 상태·근거는 모델이 출력한 status·evidence_ids 라벨(기대 상태 일치 · 정답 근거 문서만 인용). 완화 = ANSWER↔PARTIAL(양방향)·기대 OUT_OF_SCOPE·CONFLICT→ABSTAIN(단방향)인 라벨 교차를 정답으로도 보되 조합별 건수는 따로 집계. 환각과 무관. 근거가 들어간 조합은 근거 대상 행이 분모. 참고로 엄격(+환각·누락·오적용 없음·본문 출처 모두 인용)도 표시 | 독립 표본 |
| 문항 검토 후보 | 공통 오답 후보: 서로 다른 모델 2개 이상이 같은 문항에서 같은 오답 이유(튜닝 대상 아님) | 독립 표본 |
| 결과론적 | 정답 유사도(BGE-M3) 분포 · 필수 사실 키워드 포함률 | 응답이 있는 행 |
| 결과론적(참고) | NLI 지지율 · 미확인 숫자/고유명사 비율 | 사실 주장이 있는 응답 |
| 결과론적 | 표현 규칙 점수 · 실격 비율 | 응답이 있는 행 |
| 결과론적 | 반복 일관성(상태+숫자, 상태, 숫자, 근거 ID) · 최빈 상태 비율 · 일관된 오답 수 | RT 원본 질문 |
| 계측 | 포맷 준수(구조가 스키마로 강제되므로 사실상 빈 answer·생성 실패만 잡힘) · 키 순서 준수 · **타임아웃(60초 초과 = 생성 오류, 재시도 없음)** · 지연 평균/P50/P95(응답 받은 행) · TPS · VRAM | 전체 행 |

## 4. 테스트 순서

모든 명령은 **저장소 루트**에서 실행한다(`--test v4`는 생략 가능).

```bash
# 0. 환경 (멱등)
node scripts/run/setup_env.js

# 1. 데이터 준비 (이미 만들어져 있으면 --check로 원본과 같은지만 확인)
node scripts/run/prepare_dataset.js --check || node scripts/run/prepare_dataset.js

# 2. 사전 점검
node scripts/run/run_all.js --dry-run
node scripts/run/run_item.js qwen3:4b SF --size 50 --limit 3 --try smoke   # 스모크 후 model_test_v4/smoke 삭제

# 3. 라운드 — 셋 중 필요한 것
node scripts/run/run_all.js [--size 200]                  # 모든 모델 × 모든 항목
node scripts/run/run_model.js qwen3:4b [--size 200]        # 모델 하나 × 모든 항목
node scripts/run/run_item.js gemma3:4b CE [--size 200]     # 모델 하나 × 항목 하나

# 4. LLM Judge (외부 전송 — 사용자 승인 필요)
#    준비: test.config.js의 judge.model을 정하고(현재 null), OPENAI_API_KEY 환경변수를 설정한다.
#    판정 설정은 배치 매니페스트에 고정되므로 모델을 바꾸면 새 배치 ID로 다시 준비한다.
node scripts/judge/build_batch_manifest.js --batch v4-try1-n200 --size 200
node scripts/judge/judge_prepare.js --batch v4-try1-n200
node scripts/judge/judge_run.js --batch v4-try1-n200 --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch v4-try1-n200

# 5. 집계
node scripts/docgen/build_run_report.js <run_id>             # Judge 반영(모델마다)
node scripts/docgen/compare_runs.js --size 200 --batch v4-try1-n200

# 6. try1/results/all_summary.md 작성 → result.html · README.md 3절 갱신 (README 4-5·4-7절)
```

긴 라운드는 로그를 남긴다. 예: `node scripts/run/run_all.js 2>&1 | tee -a model_test_v4/try1/results/raw/logs/round_$(date +%Y%m%d).log`

## 5. 라운드별 스크립트

| 스크립트 | 범위 | 비고 |
|---|---|---|
| `scripts/run/run_all.js` | `runByDefault` 모델 × 14개 항목 | `--models`로 모델 지정 |
| `scripts/run/run_model.js <model>` | 모델 하나 × 14개 항목 | 8b는 이걸로 |
| `scripts/run/run_item.js <model> <CODE>` | 모델 하나 × 항목(들) | run_id에 `_<CODE>` 접미사 |
| `scripts/run/run_pipeline.js` | run 하나의 생성 → 채점 → 보고서 | 위 셋이 호출 |

단계별 스크립트와 산출물은 [`scripts/README.md`](../scripts/README.md)에 있다.

## 6. 결과 위치

```
model_test_v4/try1/results/
├── all_summary.md                         # 실행 후 작성
├── raw/<run_id>/generation.jsonl · run_info.json
├── raw/scored/<run_id>/*.jsonl · *_summary.json · review.csv · llm_judge/<batch>/
├── raw/logs/
├── report/<run_id>_summary.md · <batch>.json
├── llm_judge/inputs/<batch>/ · runs/<batch>/ · <batch>_report.md · <batch>_metrics.json
└── summary/run_comparison.md · run_comparison.csv
```

run_id: `<env>_<모델>_<조건>_<컨텍스트 방식>_n<항목당 건수>_<날짜>[_<항목 코드>]`. 예) `local-win_qwen3-4b_t0_nothink_fixed_n200_20261001`

## 7. 알려진 한계

- **임베딩 검색 적용 테스트는 아직 없다.** `data/raw/FAQ_RAG_3000건_사전Context제거_피드백수정본.xlsx`(실행 조건 시트 포함)를 쓰는 `contextMode: 'retrieval'`는 이후에 추가한다.
- **CLARIFY(되묻기 상태)는 없다.** test_set3에는 CLARIFY 기대 문항이 없고, 되묻기가 정답인 문항(AR-0101~0110: 위치 권한 거부 → "주소를 알려 주세요")도 ABSTAIN으로 라벨링돼 있다. 그래서 상담봇 출력 status·Judge 본문 행동 모두에서 CLARIFY를 뺐고, 본문이 사용자에게 정보를 요청했는지는 Judge가 `asks_user`로 따로 표시해 Judge 보고서 2절에 건수만 집계한다(정답률·오답 이유 계산에는 쓰지 않음).
- **과대/과소/교차를 최우선으로 보던 응답 경로표(P0~P7)·튜닝 코드(A/B/C/D/E/F/S) 체계는 폐기했다(2026-10-02).** `scripts/lib/response_paths.js`·`tuning_codes.js`·`tuning_report.js`와 `test.config.js`의 `tuning` 설정, `model_test_v4/TUNING_GUIDE.md`를 삭제했다. 상태(본문 행동) 불일치를 "제일 먼저 봐야 할 문제"로 보는 전제가, 상태를 아예 안 보는 정확도 판정·"정답+상태 완화"(위 표 참고) 결정과 맞지 않았기 때문이다. 상태가 다르게 표기된 경우는 Judge 보고서 3절(정합)에서 일치율·불일치 건수·대표 문항으로만 보고, 오답의 진짜 원인은 4-1절 "오답 이유"(근거 오류 → 필수 사실 누락 → 사실 오적용/모순 → 기타, 상태 무관)로 본다. 대응 수단은 항목 코드와 오답 이유를 보고 사람이 판단한다(자동 코드 체계 없음).
- Judge 표현 품질 점수는 v4 전수 평가에서 제외했다(`v4-judge-6` / `v4-schema-5`). v3의 모델 평균은 4.23~4.79로 변별력이 낮지만, 개별 저품질 답변이 없다는 뜻은 아니다. 표현 규칙 검사는 유지하며 자연스러움 점수를 대체하지 않는다. 페르소나 요구 준수는 별도 Judge가 평가한다.
- 표현 규칙(`scripts/lib/expression_quality.js`)은 v2·v3 규칙에서 두 가지를 바꿨다(2026-10-01). ① "제공된 (FAQ|컨텍스트|자료|문서)" 실격 패턴 제거 — "제공된 자료에 없습니다" 같은 정상 보류 안내를 내부 용어 누출로 실격시켜 상담봇 프롬프트·Judge 루브릭과 충돌했다. ② 질문 echo 실격을 "질문 앞 15자 포함"에서 "질문 전체를 그대로 되풀이"로 좁힘 — 질문 표현을 자연스럽게 받아 쓴 답(예: "현재 위치에서 가장 가까운 매장은 …")까지 실격됐다. 나머지 규칙은 그대로이며 v2·v3 표현 규칙 점수와 직접 비교하지 않는다.
- 키워드 포함률은 필수 사실에서 번호만 떼고 부분 문자열로 매칭한다. PS의 말투 기준 줄(예: "간결한 존댓말")도 키워드로 들어간다.
- NLI 지지율은 참고값이다. 환각 판단은 LLM Judge 환각률을 쓴다.
- 지연은 순차 단일 요청 기준이다. 동시성은 별도 후속 테스트에서 다룬다.
- **응답 시간 상한 60초.** 넘으면 재시도하지 않고 생성 오류(`error_type: TIMEOUT`)로 기록하고, 포맷 준수·Judge 분모에 실패로 남긴다(Judge는 미채점 사유 `TIMEOUT`). 지연 통계는 응답을 받은 행만 쓰므로 타임아웃 건수와 함께 본다. 운영 백엔드의 LLM 읽기 제한(120s)보다 엄격한 테스트 기준이다.
- **운영 백엔드(UBot-BE)와 조건을 맞추지 않는다(의도).** 2026-09-30 기준 백엔드는 temperature·think·JSON 모드를 설정하지 않고, v2_value_guard 프롬프트와 다른 메시지·FAQ 표기(`[FAQ ID: 12]`)를 쓰며, 대화 이력·사용자 정보 입력 경로가 없다. 또 검색 0건·유사도 0.75 미만이면 LLM을 호출하지 않으므로 EC(빈 Context)와 대부분의 HR(무관 FAQ)은 운영에서 LLM까지 오지 않는 상황이다. v4는 모델 튜닝 기준선이라 통제된 조건(temperature 0 · 추론 OFF · 구조화 출력 · v4_base 프롬프트)으로 잰다.
- **출력 순서를 `evidence_ids → status → answer`로 바꿨다.** v2·v3의 `status → answer → evidence_ids`에서는 status가 답변 전에 확정되고 evidence_ids가 답변 뒤 사후 라벨로 붙어 본문과 자주 어긋났다(v3 재분류: qwen3:4b OFF 오답의 59%가 status-본문 불일치). 근거를 먼저 고르고 그 근거로 상태를 정한 뒤 답하게 한다. status는 여전히 answer보다 앞이라 스트리밍 분기에도 쓸 수 있다.
- **순서는 구조화 출력(JSON 스키마)으로 강제한다.** 프롬프트 지시만으로는 스모크 20건 중 qwen3:4b 17건, gemma3:4b 2건만 순서를 지켰고, 스키마를 쓰면 두 모델 모두 12/12였다. 대가로 포맷 준수율은 지시 이행 능력을 재지 못한다(v3와 비교하지 않는다). 순서 강제 이후에도 라벨과 본문은 어긋날 수 있으므로 과대·과소 판단은 Judge의 본문 기준으로 보고, 라벨-본문 일치율을 기준선으로 남긴다. v3의 라벨-본문 불일치 수치와는 데이터셋·순서가 모두 달라 직접 비교하지 않는다.
- 근거 채택의 결정론 지표는 모델이 적어 낸 evidence_ids(자기 보고) 기준이다. 본문 내용 기준 채택은 Judge의 `content_sources`로 따로 보고 두 값의 일치율을 함께 본다.
- evidence_ids 표기 정리(2026-10-01): `"[FAQ-104]"`처럼 대괄호·공백이 붙은 ID는 같은 문서로 보고, `"사용자 정보 / API 결과"`·대화 이력 같은 꼬리표는 채택 판정 전에 떼어 내 "사용자 정보/API 꼬리표 인용" 건수로 따로 센다(Context에 없는 ID 인용과 별개). 원래 표기는 `cited_ids_raw`에 남는다. 프롬프트로 막으려 했으나 qwen3:4b가 UI 문서 인용까지 비우고 ABSTAIN으로 무너져 채점 쪽에서 처리했다(`prompts/chatbot/base.md` 주석).
