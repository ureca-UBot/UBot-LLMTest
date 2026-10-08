# model_test_v5 — 테스트 항목 · 대상 모델 · 실행 순서

v5는 v4와 **같은 평가 기준·항목·데이터셋·프롬프트·Judge**로 Qwen3-4B-Instruct-2507과 Gemma3 4B를 **양자화 방식별로** 잰다. 생성 서버는 v4와 같은 EC2 Tesla T4다(L4로 하려 했으나 인스턴스 시작 권한이 없어 2026-10-07 T4로 바꿨다). 바뀌는 값은 [`test.config.js`](test.config.js) 한 파일에만 있고 스크립트는 루트 `scripts/`(공통 엔진, [`scripts/README.md`](../scripts/README.md))를 그대로 쓴다. 평가 기준 표와 알려진 한계는 [v4 SETUP](../model_test_v4/SETUP.md) 3·7절과 같다.

| try | 내용 | 결과 요약 |
|---|---|---|
| try1 | 2026-10-07 EC2 T4 · Ollama 0.34.2 순차 생성 · LLM 단독 · Context 고정 · 모델 3개 × 14개 항목 × 100건 = 4,200응답 (그중 Q4_K_M 1,400건은 v4 try1에서 가져옴) · 오류 0 · Judge `v5-try1-n100` 4,799/4,800 (2026-10-08) | 정답률 Instruct Q8_0 78.8% · Q4_K_M 77.5%(차이 유의하지 않음) · Gemma QAT 67.0%. Instruct는 스키마 키 순서를 따르지 않음. [all_summary](try1/results/all_summary.md) · [판단](try1/results/summary/quantization_decision.md) |

## 1. 목표와 v4 대비 변경점

- 4B 모델을 양자화 방식별로 비교한다. 운영에서 vLLM으로 FP8을 쓸 가능성을 보고 있어, 8bit(Q8_0)를 FP8의 정확도 대리로 함께 잰다. Q8_0과 FP8 W8A8은 둘 다 BF16에 가까운 손실로 알려져 있어 정확도 차이는 작다고 본다(Ollama에는 FP8 텐서 형식이 없어 FP8 자체는 잴 수 없다).
- **동시성·VRAM·속도는 이 테스트에서 결론 내지 않는다.** 순차 생성의 지연·TPS·VRAM은 계측으로 기록만 하고, 동시성 비교는 별도 테스트(vLLM)에서 한다.

| 구분 | v4 try1 | v5 |
|---|---|---|
| 생성 서버·엔진 | EC2 Tesla T4 · Ollama · 순차 1건씩 · 구조화 출력(JSON 스키마) | 같음 |
| 모델 | `qwen3:4b`(Thinking-2507) OFF · `gemma3:4b`(Q4_K_M) · (추가) `qwen3:4b-instruct` | **`qwen3:4b-instruct`(Q4_K_M, v4 결과 재사용) · `qwen3:4b-instruct-2507-q8_0` · `gemma3:4b-it-qat`** |
| 규모 | 항목당 200 = 2,800건 | **항목당 100 = 1,400건** (프롬프트 튜닝 테스트와 같은 규모) |
| 데이터·프롬프트·Judge | test_set4 · `v4_base` · Codex `gpt-6-sol` medium · `v4-judge-12` | 같음 |

100 서브셋은 v4 200건 안에 포함돼 있다(50 ⊂ 100 ⊂ 150 ⊂ 200). 그래서 v4에서 같은 서버·조건으로 생성한 `qwen3:4b-instruct` n200 run에서 100 서브셋만 가져오면 다시 생성할 필요가 없다. v4의 `qwen3:4b`·`gemma3:4b`를 같은 1,400건으로 다시 집계하는 것은 나중에 따로 한다.

## 2. 대상 모델

digest는 2026-10-07 ollama.com 기준이다. 서버에서 `ollama list`의 ID가 다르면 다른 가중치이므로 멈추고 확인한다.

| 모델 (Ollama 태그) | 실제 모델 | 형식 (GGUF 텐서 확인) | 크기 | digest | 생성 |
|---|---|---|---:|---|---|
| `qwen3:4b-instruct` | Qwen3-4B-Instruct-2507 | Q4_K_M | 2.5 GB | `0edcdef34593` (= `qwen3:4b-instruct-2507-q4_K_M`) | **v4 try1 run에서 가져옴** (`runByDefault: false`) |
| `qwen3:4b-instruct-2507-q8_0` | Qwen3-4B-Instruct-2507 | Q8_0 | 4.3 GB | `aa7252f68dda` | v5에서 생성 |
| `gemma3:4b-it-qat` | Gemma 3 4B IT QAT | 트랜스포머 블록 전부 **Q4_0**(3,209M) · 토큰 임베딩(= 출력층 공유, 671M) **F16** · 비전 F16 | 4.0 GB | `d01ad0579247` | v5에서 생성 |

- 셋 다 추론 모드가 없어 `think` 옵션을 보내지 않는다(`thinkCapable: false`).
- Gemma QAT는 출력층이 F16이라 토큰마다 읽는 가중치가 Q4_K_M(`gemma3:4b`)보다 크다(약 3.1 GB 대 2.5 GB). 같은 "4bit"라도 순차 지연이 더 길 수 있다.
- `gemma3:4b-it-q8_0`(`2376388dec16`)은 뺐다(2026-10-07). 필요하면 `models`에 추가한다.

## 3. 테스트 항목 (항목당 100건)

항목·기대 상태 정의는 v4 SETUP 3절과 같다. 100 서브셋 구성(`포함 최소 규모` ≤ 100, 2026-10-07 확인):

| 구분 | 구성 |
|---|---|
| 난이도 | 모든 항목 Easy 30 · Medium 40 · Hard 30 (200건과 같은 비율, 층화 대상) |
| PS 하위 항목 | 역할·말투 유지 50 · 사용자 특성 맞춤 50 (층화 대상) |
| 기대 상태 (층화 대상 아님) | UI ANSWER 60 · PARTIAL 40 / CF CONFLICT 46 · ANSWER 42 · ABSTAIN 12 / AD ANSWER 63 · OUT_OF_SCOPE 37 / AR ANSWER 53 · ABSTAIN 26 · PARTIAL 21 — 200건 비율과 ±3%p 이내 |
| FAQ 카테고리 | 항목별 200건의 카테고리 대부분 포함(MC 17종 중 16, AD 18종 중 17), 비율 편차 최대 6%p |
| **RT** | 원본 질문 **10개** × 10회. 기대 상태 ANSWER 5 · ABSTAIN 3 · PARTIAL 1 · CONFLICT 1 — **OUT_OF_SCOPE 원본은 없다**(200건에는 1개). 반복 일관성은 질문 10개 기준이라 오차가 크다 |
| PI 처리 경로 | 사용자 정보+FAQ 3건(200건에는 10건) |

## 4. 실행 순서

모든 명령은 **저장소 루트**에서 실행한다. **v5가 가장 높은 버전이라 `--test`를 생략하면 v5가 잡힌다**(v4를 돌릴 때는 `--test v4`를 붙인다).

### 4-1. EC2 T4 — 생성 (Q8_0 · QAT, 2,800건)

```bash
# 0. 디스크 확보 — v4 모델 삭제 (bge-m3는 채점에 필요하므로 지우지 않는다)
df -h /
ollama list
ollama rm qwen3:4b gemma3:4b qwen3:4b-instruct      # 있는 것만. qwen3:8b 등 다른 모델도 안 쓰면 지운다
df -h /

# 1. 환경
git fetch && git checkout test5/script && git pull
ollama pull qwen3:4b-instruct-2507-q8_0
ollama pull gemma3:4b-it-qat
ollama list                                           # ID가 2절 digest와 같은지 확인, bge-m3 있는지 확인
node scripts/run/setup_env.js --skip-models
node scripts/run/prepare_dataset.js --test v5 --check # 데이터셋이 v4와 같은지(SHA) 확인

# 2. 사전 점검 — 스모크 3건 후 삭제
node scripts/run/run_all.js --test v5 --dry-run       # q8_0 · qat 두 모델만 잡혀야 한다
node scripts/run/run_item.js gemma3:4b-it-qat NC --test v5 --limit 3 --try smoke && rm -rf model_test_v5/smoke

# 3. 생성 (T4 추정: q8_0 약 1.5시간 + qat 약 1시간). 끊기면 같은 명령으로 이어서 한다
mkdir -p model_test_v5/try1/results/raw/logs
nohup node scripts/run/run_all.js --test v5 \
  > model_test_v5/try1/results/raw/logs/round_$(date +%Y%m%d_%H%M).log 2>&1 &

# 4. 결과를 저장소로 (results/는 .gitignore 예외 — 로그 *.log는 제외)
git add model_test_v5/try1/results && git commit -m "[Test] v5 try1 q8_0·qat 생성 결과" && git push
```

### 4-2. Q4_K_M 결과 가져오기 (v4 → v5, 생성 없음)

v4 try1의 `qwen3:4b-instruct` n200 run(test4 브랜치에 push)을 v5 브랜치에 합친 뒤 100 서브셋만 가져온다. 모델·생성 파라미터·프롬프트·데이터셋 SHA가 v5 config와 같아야 가져오고, 원본 경로·SHA-256은 새 `run_info.json`의 `imported_from`에 남는다. 원본 n200 run은 v4에 그대로 둔다.

```bash
SRC=$(ls model_test_v4/try1/results/raw | grep '^ec2-linux_qwen3-4b-instruct_t0_nothink_fixed_n200_')
node scripts/run/import_run_subset.js $SRC --from-test v4 --test v5 --dry-run
node scripts/run/import_run_subset.js $SRC --from-test v4 --test v5
# 출력된 다음 명령으로 결정론 채점·보고서 (생성 단계는 끝난 케이스라 건너뜀)
node scripts/run/run_pipeline.js <새 run_id> qwen3:4b-instruct --test v5 --size 100
```

### 4-3. LLM Judge · 집계 (100건 × 3모델)

Judge를 돌리는 PC에서 실행한다(외부 전송 — 사용자 승인 필요). 배치는 v5의 n100 run 세 개(가져온 것 포함)를 한 번에 잡는다.

```bash
node scripts/judge/build_batch_manifest.js --test v5 --batch v5-try1-n100 --size 100
node scripts/judge/judge_prepare.js --test v5 --batch v5-try1-n100
node scripts/judge/judge_run.js --test v5 --batch v5-try1-n100 --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --test v5 --batch v5-try1-n100
node scripts/docgen/build_run_report.js --test v5 <run_id>     # 모델마다
node scripts/docgen/compare_runs.js --test v5 --size 100 --batch v5-try1-n100
# 이후 try1/results/all_summary.md 작성 (CLAUDE.md 규칙)
```

## 5. 결과 위치

v4 SETUP 6절과 같은 구조다(`model_test_v5/try1/results/...`). run_id 예: `ec2-linux_qwen3-4b-instruct-2507-q8_0_t0_nothink_fixed_n100_<날짜>`, 가져온 run은 `ec2-linux_qwen3-4b-instruct_t0_nothink_fixed_n100_<v4 생성 날짜>`.

## 6. v5에서 추가로 알아 둘 한계

- Q4_K_M은 v4 때, Q8_0·QAT는 v5 때 생성했다. 같은 T4·같은 조건이지만 Ollama 버전이 바뀌었을 수 있다 — 각 run의 `run_info.runtime.ollama_version`으로 확인한다.
- Q8_0은 FP8(W8A8)의 정확도 대리다. 가중치만 8bit(32개 블록 단위 스케일)이고 활성값은 FP16이라 FP8보다 원본에 더 가까울 수 있다. 운영 형식(vLLM FP8·AWQ)에서의 정확도는 동시성 테스트 때 서브셋으로 따로 확인한다.
- 지연·TPS·VRAM은 T4 순차 단일 요청 기준의 계측값이다. 동시성 판단에 쓰지 않는다.
