# 의도 분류 테스트 결과 (항목 3·4)

> 상태: **미실행 (템플릿)** — 모델 실행 후 표를 채워 넣습니다.
> 평가 방법론 전체는 [`README.md`](../README.md) 참고. 이 문서는 항목 3(FAQ 부재 판단)과 항목 4(의도 분류)를 함께 다룹니다. 둘 다 **결정론적** 채점(정답 라벨과 정확히 일치하는지)이라 LLM Judge나 사람 평가가 필요 없습니다.

## 개요

- 데이터: `data/eval_sets/intent_classification.csv` (71건 — `faq_easy`/`faq_medium`/`faq_hard`/`rag_faithfulness`/`cluster_labeling` 5개 소스에서 처리 의도가 라벨된 건을 통합)
- 분류 대상(3-way): `FAQ_RAG` / `MAP_API` / `UNREGISTERED` (원본의 `UNREGISTERED_CLUSTERING`은 `UNREGISTERED`로 통합 — README 5절 각주 참고)
- 클래스 분포: FAQ_RAG 37건 · MAP_API 4건 · UNREGISTERED 30건(원 UNREGISTERED 10 + UNREGISTERED_CLUSTERING 20)
- 입력: 사용자 질문만 LLM에 제공 (FAQ 컨텍스트 없음 — 순수 라우팅 판단 테스트)

## 채점 방법

| 지표 | 의미 |
|---|---|
| Accuracy | 71건 중 정답 라벨과 일치한 비율 |
| Macro-F1 | 3개 클래스 F1의 단순 평균 (클래스 불균형 보정) |
| UNREGISTERED Precision/Recall/F1 | **항목 3(FAQ 부재 판단)의 지표와 동일.** UNREGISTERED를 양성 클래스로 본 이진 분류 성능 |
| Confusion Matrix | 실제 라벨 × 예측 라벨 3×3 |

## 모델별 결과

각 모델마다 Confusion Matrix + 지표를 채우고, **오답인 케이스만** 별도 표에 나열합니다 (71건 전체를 나열하지 않음 — 원본 데이터는 `data/eval_sets/intent_classification.csv` 참고).

### 1. Qwen3 0.6B (`qwen3:0.6b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 2. Qwen3 1.7B (`qwen3:1.7b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 3. Qwen3 4B (`qwen3:4b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 4. Qwen3 8B (`qwen3:8b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 5. EXAONE 3.5 2.4B (`exaone3.5:2.4b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 6. EXAONE 3.5 7.8B (`exaone3.5:7.8b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 7. Gemma3 270M (`gemma3:270m`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 8. Gemma3 1B (`gemma3:1b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

---

### 9. Gemma3 4B (`gemma3:4b`)

**Confusion Matrix** (행=실제, 열=예측)

| 실제 \ 예측 | FAQ_RAG | MAP_API | UNREGISTERED |
|---|---|---|---|
| FAQ_RAG (37) | | | |
| MAP_API (4) | | | |
| UNREGISTERED (30) | | | |

**지표**: Accuracy _% · Macro-F1 _ · FAQ_RAG P/R/F1 _/_/_ · MAP_API P/R/F1 _/_/_ · **UNREGISTERED(항목3) P/R/F1 _/_/_ **· 평균 Latency _ms

**오답 사례**

| source | ID | Query | 정답 | 예측 | 비고 |
|---|---|---|---|---|---|
| | | | | | |

**사람 메모**: _(오답 패턴에 대한 의견, 예: 특정 유형에서만 실수하는지)_

## 종합 비교

| 모델 | Accuracy | Macro-F1 | UNREGISTERED F1 (항목3) | MAP_API Recall | 평균 Latency(ms) |
|---|---|---|---|---|---|
| Qwen3 0.6B | | | | | |
| Qwen3 1.7B | | | | | |
| Qwen3 4B | | | | | |
| Qwen3 8B | | | | | |
| EXAONE 3.5 2.4B | | | | | |
| EXAONE 3.5 7.8B | | | | | |
| Gemma3 270M | | | | | |
| Gemma3 1B | | | | | |
| Gemma3 4B | | | | | |

## 관전 포인트

- FAQ_RAG와 UNREGISTERED를 헷갈리는 모델이 있는가 (특히 `rag_faithfulness.csv`의 PI/SR 유형처럼 FAQ와 유사하지만 답 없는 케이스)
- MAP_API(4건뿐인 소수 클래스)를 아예 못 잡아내는 모델이 있는가 — Recall 위주로 확인
- `cluster_labeling.csv`의 20건(모두 UNREGISTERED 정답)에서 애매성("애매성" 컬럼: 낮음/중간/높음)이 높을수록 오답률이 올라가는가
