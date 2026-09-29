# model_test_v1 · try1 — 전체 요약 (all_summary)

> **test1 1차 라운드** · 2026-09-10~11 · 로컬 Windows · **9개 모델** · FAQ 답변 생성 + RAG 안정성 · **Claude Code 헤드리스 Judge 전수 채점**.
> 첫 버전이라 이전 버전 비교는 없다. 다음 버전: [model_test_v2 · try1](../../../model_test_v2/try1/results/all_summary.md) (13개 항목·380건으로 데이터셋 재설계).

[실행 가이드(SETUP)](../../SETUP.md) · [종합 결과 요약](summary/summary_results.md) · [방법론·설계 이유(README)](../../../README.md)

## 목차

0. [테스트 개요 — 항목·건수·평가 기준](#0-테스트-개요)
1. [전체 결과 요약 (LLM Judge 우선)](#1-전체-결과-요약-llm-judge-우선)
2. [이전 버전 대비 변화](#2-이전-버전-대비-변화)
3. [항목별 성능 요약](#3-항목별-성능-요약)
4. [summary 폴더 문서 요약](#4-summary-폴더-문서-요약)
5. [세부 결과 경로](#5-세부-결과-경로)

## 0. 테스트 개요

### 0-1. 테스트 항목과 건수

**6개 라운드 실행(모델당 90건) + 2개 라운드 미실행** · 9개 모델 × 90건 = **810건**

| # | 라운드 | 항목 | 건수(모델당) | 무엇을 보는가 | 데이터 | 상태 |
|---|---|---|---|---|---|---|
| 1 | FAQ 답변 생성 | Easy (직접 표현) | 9 | 정답 FAQ 1개를 자연어 답변으로 재구성 | `data/eval_sets/test_set1/faq_easy.csv` | ✅ |
| 2 | FAQ 답변 생성 | Medium (구어체·간접 표현) | 9 | 〃 | `faq_medium.csv` | ✅ |
| 3 | FAQ 답변 생성 | Hard (장문·경쟁 FAQ) | 9 | 〃 | `faq_hard.csv` | ✅ |
| 4 | RAG 안정성 | Small (컨텍스트 2~3개) | 21 = 7유형 × 3건 | 무관/빈/모순/부분/유사오답/노이즈/다중조합 컨텍스트에 흔들리지 않는가 | `rag_stability_small.csv` | ✅ |
| 5 | RAG 안정성 | Medium (컨텍스트 3~5개) | 21 = 7유형 × 3건 | 〃 | `rag_stability_medium.csv` | ✅ |
| 6 | RAG 안정성 | Large (컨텍스트 10개) | 21 = 7유형 × 3건 | 〃 | `rag_stability_large.csv` | ✅ |
| 7 | 의도 분류 | FAQ_RAG / MAP_API / UNREGISTERED 3-way | 113 | 질문 의도 분류 (Confusion Matrix) | `intent_classification.csv` | 미실행 |
| 8 | 클러스터 라벨링 | 20건 → 4그룹 | 4그룹 | FAQ 부재 질문 묶음 라벨·요약 | `cluster_labeling.csv` | 미실행 |
|  | **합계(실행분)** |  | **90** (FAQ 27 + RAG 63) |  |  |  |

**RAG 안정성 7유형** (각 티어 3건씩, 3티어 합계 9건): HR=무관 FAQ · EC=빈 컨텍스트 · CF=모순 FAQ · PI=부분 정보 · SR=유사하지만 답 없음 · NC=정답+노이즈 · MC=다중 FAQ 조합. 이 7유형은 v2의 13개 항목 중 같은 이름의 항목으로 이어졌다.

### 0-2. 테스트 평가 기준

| 구분 | 평가 기준 | 정의 | 적용 라운드 |
|---|---|---|---|
| **LLM Judge (Claude)** | 답변 정확도 → 정답률 | 정답 FAQ와 대조한 1~5점, **4점 이상을 정답**으로 집계 | FAQ |
| **LLM Judge (Claude)** | 충실도 → 환각률 | `faithful=false`(근거 밖 내용) 비율 | FAQ |
| **LLM Judge (Claude)** | RAG 적절 대응률 | 케이스별 "기대 행동/실패 조건"을 지켰는지 Pass/Fail | RAG 안정성 |
| **LLM Judge (Claude)** | 표현 품질 | 자연스러움·명확성·친절성 1~5점 | FAQ·RAG |
| 결과론적(결정론) | 키워드 커버리지 | 정답 FAQ 핵심 키워드 포함률 | FAQ |
| 결과론적(결정론) | ROUGE-L | 정답 FAQ와 문자 단위 LCS F1 | FAQ |
| 결과론적(결정론) | 숫자 검증 | 답변 숫자가 컨텍스트에 있는지 | FAQ·RAG (Judge 입력 보조) |
| 결과론적(결정론) | 포맷 성공률 | `answer`·`grounded`·`used_faq_ids` JSON 준수 | FAQ·RAG |
| 계측 | Latency · TPS | 평균 응답 시간 · 초당 토큰 | FAQ·RAG |

Judge는 Claude Code를 헤드리스(`claude -p`)로 호출했다. 정답률 임계값(4점)은 임의로 정한 값이다. 합산 종합 점수는 만들지 않는다.

### 0-3. 실행 조건

| 항목 | 값 |
|---|---|
| 환경 | 로컬 Windows · Ollama REST API(`/api/chat`, `format:"json"`) · 순차 요청 |
| 생성 파라미터 | Ollama 모델 기본값 (temperature 등 미지정) |
| Judge | Claude Code 헤드리스 — FAQ: 고정 루브릭(정확도/충실도/표현), RAG: 케이스별 가변 루브릭(기대 행동·실패 조건 삽입) |

## 1. 전체 결과 요약 (LLM Judge 우선)

### 1-1. LLM Judge (Claude)

| 모델 | FAQ 정답률 (27) | FAQ 환각률 | FAQ 표현 /5 | RAG 적절 대응 (63) | Small | Medium | Large |
|---|---|---|---|---|---|---|---|
| qwen3:0.6b | **77.8% (21/27)** | 18.5% | 3.44 | **17.7% (11/62)** | 14.3% | 25.0% | 14.3% |
| qwen3:1.7b | **88.9% (24/27)** | 33.3% | 4.30 | **52.4% (33/63)** | 71.4% | 42.9% | 42.9% |
| qwen3:4b | **100.0% (27/27)** | 0.0% | 4.93 | **69.8% (44/63)** | 71.4% | 76.2% | 61.9% |
| qwen3:8b | **96.3% (26/27)** | 14.8% | 4.89 | **74.6% (47/63)** | 85.7% | 81.0% | 57.1% |
| exaone3.5:2.4b | **66.7% (18/27)** | 55.6% | 4.48 | **34.9% (22/63)** | 47.6% | 23.8% | 33.3% |
| exaone3.5:7.8b | **88.9% (24/27)** | 48.1% | 4.78 | **62.7% (37/59)** | 78.9% | 57.1% | 52.6% |
| gemma3:270m | **29.6% (8/27)** | 33.3% | 1.67 | **3.9% (2/51)** | 10.0% | 0.0% | 0.0% |
| gemma3:1b | **40.7% (11/27)** | 40.7% | 3.22 | **17.5% (11/63)** | 33.3% | 9.5% | 9.5% |
| gemma3:4b | **100.0% (27/27)** | 18.5% | 4.93 | **68.3% (43/63)** | 76.2% | 71.4% | 57.1% |

RAG 분모는 Judge가 채점에 성공한 건수(포맷 실패 등으로 일부 모델은 63건 미만).

### 1-2. 결과론적(결정론) 지표 · 계측

| 모델 | FAQ 키워드 커버리지 | FAQ ROUGE-L | 포맷 성공률 (90) | FAQ 평균 Latency | RAG 평균 Latency | FAQ 평균 TPS |
|---|---|---|---|---|---|---|
| qwen3:0.6b | 85.6% | 0.622 | 100.0% | 0.86s | 0.95s | 314.3 |
| qwen3:1.7b | 82.3% | 0.532 | 100.0% | 1.77s | 2.14s | 168.6 |
| qwen3:4b | 89.1% | 0.753 | 100.0% | 12.69s | 22.98s | 85.9 |
| qwen3:8b | 90.2% | 0.596 | 100.0% | 6.67s | 7.75s | 49.7 |
| exaone3.5:2.4b | 60.7% | 0.267 | 100.0% | 0.90s | 1.07s | 142.7 |
| exaone3.5:7.8b | 67.0% | 0.345 | 95.6% | 1.96s | 2.29s | 54.6 |
| gemma3:270m | 42.4% | 0.343 | 96.7% | 0.29s | 0.28s | 294.9 |
| gemma3:1b | 46.2% | 0.389 | 100.0% | 0.52s | 0.53s | 202.5 |
| gemma3:4b | 86.5% | 0.571 | 100.0% | 1.09s | 1.16s | 86.4 |

### 1-3. 핵심 요약

- **Qwen3 4B만 Easy/Medium/Hard 전부 정답률 100%·환각률 0%**를 유지했다. 대신 FAQ 평균 12~14초로 가장 느리다.
- **Gemma3 4B는 정확도-속도 균형 1순위 후보**였다(FAQ 27/27 정답, 평균 약 1.1초). 다만 Hard 환각률 33.3%.
- **RAG 안정성(최종 선정의 핵심 기준으로 합의)**은 Qwen3 8B 74.6% · Qwen3 4B 69.8% · Gemma3 4B 68.3% 순. **컨텍스트가 10개(Large)로 늘면 Qwen3 8B(85.7→57.1%)도 무너지고 Qwen3 4B(61.9%)가 1위로 역전**된다.
- **반전**: FAQ 라운드 Easy 100%였던 Qwen3 0.6B는 RAG 안정성 전 티어 14~25%로 하위권 — "단순 재진술"과 "무관·모순 컨텍스트 저항"은 다른 능력이다.
- **EXAONE 3.5는 난이도가 오를수록 환각률이 악화**(7.8B Hard 66.7%), Gemma3 270M/1B는 Hard 정답률 22.2%로 실사용이 어렵다.
- 모든 모델이 CF(모순 FAQ)에서 약했다(최고 33%) — v2에서 "충돌 고지(CONFLICT)" 상태를 따로 두게 된 배경이다.

## 2. 이전 버전 대비 변화

**첫 버전이라 비교 대상이 없다.** 이 결과를 바탕으로 v2에서 데이터셋을 13개 항목·380건으로 재설계하고, 응답에 기대 상태(status) 판단을 추가했다. v1 → v2 참고 비교는 [v2 try1 all_summary 2절](../../../model_test_v2/try1/results/all_summary.md#2-이전-버전v1-대비-변화)에 있다.

## 3. 항목별 성능 요약

### 3-1~3-3. FAQ 답변 생성 (Easy · Medium · Hard, 각 9건)

| 모델 | easy 정답률 | easy 환각률 | medium 정답률 | medium 환각률 | hard 정답률 | hard 환각률 | Easy→Hard 정답률 변화 |
|---|---|---|---|---|---|---|---|
| qwen3:0.6b | 100.0% | 0.0% | 77.8% | 22.2% | 55.6% | 33.3% | −44.4%p |
| qwen3:1.7b | 88.9% | 22.2% | 100.0% | 33.3% | 77.8% | 44.4% | −11.1%p |
| qwen3:4b | 100.0% | 0.0% | 100.0% | 0.0% | 100.0% | 0.0% | +0.0%p |
| qwen3:8b | 100.0% | 22.2% | 100.0% | 0.0% | 88.9% | 22.2% | −11.1%p |
| exaone3.5:2.4b | 77.8% | 44.4% | 77.8% | 55.6% | 44.4% | 66.7% | −33.3%p |
| exaone3.5:7.8b | 88.9% | 66.7% | 100.0% | 11.1% | 77.8% | 66.7% | −11.1%p |
| gemma3:270m | 33.3% | 11.1% | 33.3% | 44.4% | 22.2% | 44.4% | −11.1%p |
| gemma3:1b | 66.7% | 33.3% | 33.3% | 44.4% | 22.2% | 44.4% | −44.4%p |
| gemma3:4b | 100.0% | 11.1% | 100.0% | 11.1% | 100.0% | 33.3% | +0.0%p |

라운드별 키워드·ROUGE-L·표현·Latency·TPS는 [summary_results 1절](summary/summary_results.md)과 각 라운드 문서([Easy](report/faq_easy_results.md) · [Medium](report/faq_medium_results.md) · [Hard](report/faq_hard_results.md))에 있다.

### 3-4~3-6. RAG 안정성 — 7유형별 적절 대응률 (Small·Medium·Large 합산, 유형당 최대 9건)

| 유형 (v2 대응 항목) | qwen3:0.6b | qwen3:1.7b | qwen3:4b | qwen3:8b | exaone3.5:2.4b | exaone3.5:7.8b | gemma3:270m | gemma3:1b | gemma3:4b |
|---|---|---|---|---|---|---|---|---|---|
| HR 무관 FAQ → 무관 FAQ(HR) | 11% (1/9) | 67% (6/9) | 100% (9/9) | 78% (7/9) | 44% (4/9) | 56% (5/9) | 0% (0/8) | 22% (2/9) | 89% (8/9) |
| EC 빈 컨텍스트 → 빈 컨텍스트(EC) | 44% (4/9) | 78% (7/9) | 100% (9/9) | 100% (9/9) | 56% (5/9) | 75% (6/8) | 0% (0/6) | 44% (4/9) | 100% (9/9) |
| CF 모순 FAQ → FAQ 충돌·시행일(CF) | 0% (0/8) | 33% (3/9) | 11% (1/9) | 22% (2/9) | 33% (3/9) | 13% (1/8) | 0% (0/8) | 22% (2/9) | 33% (3/9) |
| PI 부분 정보 → 부분 정보(PI) | 0% (0/9) | 22% (2/9) | 78% (7/9) | 78% (7/9) | 33% (3/9) | 71% (5/7) | 25% (2/8) | 11% (1/9) | 67% (6/9) |
| SR 유사하지만 답 없음 → 유사하지만 답 없음(SR) | 22% (2/9) | 78% (7/9) | 78% (7/9) | 100% (9/9) | 0% (0/9) | 67% (6/9) | 0% (0/5) | 0% (0/9) | 78% (7/9) |
| NC 정답+노이즈 → 유사 FAQ 구분·노이즈(NC) | 44% (4/9) | 44% (4/9) | 78% (7/9) | 78% (7/9) | 56% (5/9) | 78% (7/9) | 0% (0/8) | 11% (1/9) | 67% (6/9) |
| MC 다중 FAQ 조합 → 다중 FAQ 조합(MC) | 0% (0/9) | 44% (4/9) | 44% (4/9) | 67% (6/9) | 22% (2/9) | 78% (7/9) | 0% (0/8) | 11% (1/9) | 44% (4/9) |
| **전체** | **17.7%** | **52.4%** | **69.8%** | **74.6%** | **34.9%** | **62.7%** | **3.9%** | **17.5%** | **68.3%** |

**티어별(컨텍스트 개수별) 적절 대응률**

| 모델 | Small (2~3개) | Medium (3~5개) | Large (10개) | Small→Large |
|---|---|---|---|---|
| qwen3:0.6b | 14.3% | 25.0% | 14.3% | +0.0%p |
| qwen3:1.7b | 71.4% | 42.9% | 42.9% | −28.6%p |
| qwen3:4b | 71.4% | 76.2% | 61.9% | −9.5%p |
| qwen3:8b | 85.7% | 81.0% | 57.1% | −28.6%p |
| exaone3.5:2.4b | 47.6% | 23.8% | 33.3% | −14.3%p |
| exaone3.5:7.8b | 78.9% | 57.1% | 52.6% | −26.3%p |
| gemma3:270m | 10.0% | 0.0% | 0.0% | −10.0%p |
| gemma3:1b | 33.3% | 9.5% | 9.5% | −23.8%p |
| gemma3:4b | 76.2% | 71.4% | 57.1% | −19.0%p |

티어×유형 상세 표와 표현·속도는 [summary_results 2~3절](summary/summary_results.md), 케이스별 답변은 [Small](report/faq_rag_stability_small_results.md) · [Medium](report/faq_rag_stability_medium_results.md) · [Large](report/faq_rag_stability_large_results.md) 문서에 있다.

### 3-7~3-8. 의도 분류 · 클러스터 라벨링

데이터(`intent_classification.csv` 113건, `cluster_labeling.csv` 20건→4그룹)는 준비됐지만 **실행하지 않았다.** 결과 문서는 틀만 있다 → [intent_classification_results.md](report/intent_classification_results.md) · [cluster_labeling_results.md](report/cluster_labeling_results.md). v2 이후에도 이 두 항목은 범위에서 제외됐다.

## 4. summary 폴더 문서 요약

| 문서 | 요약 |
|---|---|
| [summary_results.md](summary/summary_results.md) | 6개 라운드 종합 요약(자동 생성). FAQ Easy/Medium/Hard 모델별 정답률·키워드·ROUGE-L·환각률·표현·포맷·Latency·TPS, RAG 안정성 티어별 적절 대응률과 7유형×티어 상세, 표현·속도. "RAG 안정성이 최종 선정 기준의 핵심"이라는 관전 포인트. |

## 5. 세부 결과 경로

| 경로 | 내용 |
|---|---|
| [report/faq_easy_results.md](report/faq_easy_results.md) · [medium](report/faq_medium_results.md) · [hard](report/faq_hard_results.md) | FAQ 라운드별 케이스·답변·점수 (세부 테스트) |
| [report/faq_rag_stability_small_results.md](report/faq_rag_stability_small_results.md) · [medium](report/faq_rag_stability_medium_results.md) · [large](report/faq_rag_stability_large_results.md) | RAG 안정성 티어별 케이스·답변·Pass/Fail (세부 테스트) |
| [report/intent_classification_results.md](report/intent_classification_results.md) · [cluster_labeling_results.md](report/cluster_labeling_results.md) | 미실행 라운드 문서 틀 |
| [llm_judge/](llm_judge/) | Claude Judge 채점 결과 `*.judged.jsonl` 6개 |
| [raw/](raw/) | 모델 응답 `*.jsonl`, 결정론 채점 `*.scored.jsonl` |
| [../../SETUP.md](../../SETUP.md) · [../../scripts/](../../scripts/) | 실행 가이드 · v1 스크립트 |

---

이 문서의 표는 `llm_judge/*.judged.jsonl`에서 다시 집계했다. 모델·Judge를 새로 호출하지 않았다.
