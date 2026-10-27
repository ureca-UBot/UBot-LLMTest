# LLM_Test — FAQ 챗봇용 로컬 LLM 선정 테스트

## 1. 프로젝트 개요

이 레포는 **FAQ 챗봇 시스템에 실제로 탑재할 로컬 LLM을 고르기 위한 기술 검증(기술 선정) 테스트 하네스**입니다.

우리 서비스는 사용자의 질문에 대해 적절한 FAQ를 찾아, 그 내용을 상황에 맞는 자연어로 답변해주는 챗봇입니다. 이 레포는 그중 **LLM이 담당하는 부분만** 떼어내어, 여러 후보 로컬 모델 중 어떤 모델이 실제 서비스에 적합한지 정량적으로 비교하는 것을 목적으로 합니다.

## 2. 테스트 범위와 원칙

- **임베딩 모델은 평가 대상이 아닙니다.** 벡터 검색(FAQ 매칭)은 이미 검증된 별도 축으로 보고, 이 레포는 매칭된 FAQ를 받아 LLM이 무엇을 하는지만 평가합니다.
- **테스트 대상(후보) 모델은 로컬 전용입니다.** 벡터DB·임베딩DB·외부 API를 전혀 사용하지 않고, Ollama로 구동되는 무료/오픈소스 로컬 모델만 후보로 둡니다.
- **채점(Judge)에는 외부 API 사용이 허용됩니다.** "외부 API를 쓰지 않는다"는 원칙은 서비스 품질을 결정하는 요소(=후보 LLM)에 한정되며, 서비스 품질을 판단만 하는 도구(=채점자)는 예외입니다. 이 레포에서는 Claude Code를 헤드리스로 호출해 Judge로 사용하며, 이는 별도 API 결제 없이 기존 Claude Pro 사용량 안에서 처리합니다 (평가 데이터 규모가 작아 충분함).

## 3. 왜 이 테스트가 필요한가

로컬 오픈소스 모델은 크기·학습 데이터 구성에 따라 다음이 크게 갈립니다.

- FAQ 원문을 자연스러운 한국어 상담 답변으로 재구성하는 능력
- 주어진 근거 없이 정보를 지어내는(환각) 경향
- 사용자 의도를 정확히 분류하는 능력
- 지정된 출력 포맷을 안정적으로 지키는 능력
- 실제 챗봇에 쓸 수 있을 만큼의 응답 속도

이 중 어떤 것도 이론적 스펙(파라미터 수)만으로는 판단할 수 없기 때문에, 동일한 데이터·동일한 기준으로 직접 돌려보고 비교합니다.

## 4. 테스트 대상 모델

가장 낮은 파라미터부터 최대 8B까지, 3개 모델 패밀리 총 9개 모델을 비교합니다.

| 패밀리 | 크기 | Ollama 태그 |
|---|---|---|
| Qwen3 | 0.6B | `qwen3:0.6b` |
| Qwen3 | 1.7B | `qwen3:1.7b` |
| Qwen3 | 4B | `qwen3:4b` |
| Qwen3 | 8B | `qwen3:8b` |
| EXAONE 3.5 | 2.4B | `exaone3.5:2.4b` |
| EXAONE 3.5 | 7.8B | `exaone3.5:7.8b` |
| Gemma3 | 270M | `gemma3:270m` |
| Gemma3 | 1B | `gemma3:1b` |
| Gemma3 | 4B | `gemma3:4b` |

> Gemma3 270M은 "가장 낮은 파라미터부터"라는 조건에 맞춰 포함했습니다. 범위를 8개로 줄이고 싶다면 이 모델을 제외하면 됩니다.

## 5. 평가 프레임워크 (9개 영역)

| # | 평가 영역 | 핵심 질문 | 측정 방법 | 채점 방식 |
|---|---|---|---|---|
| 1 | 답변 정확도 | FAQ 내용을 정확히 이해하고 답하는가? | LLM Judge + 키워드 커버리지 + ROUGE-L, 수동평가 | Judge + 결정론적 보조지표 |
| 2 | RAG 충실도 | 주어진 FAQ만 근거로 답하는가? | Faithfulness(Judge), Hallucination Rate, 숫자/고유명사 검증 | Judge + 결정론적 보조지표 |
| 3 | FAQ 부재 판단 | FAQ에 없는 질문에 억지로 답하지 않는가? | Precision / Recall / F1 | 결정론적 |
| 4 | 의도 분류 | 사용자 질문의 의도(`FAQ_RAG`/`MAP_API`/`UNREGISTERED`)를 정확히 분류하는가? | Accuracy, Macro-F1 | 결정론적 |
| 5 | 표현 품질 | 자연스러운 한국어 상담 답변인가? | 자연스러움, 명확성, 친절성 | Judge 필요 |
| 6 | 명령 수행 능력 | 지정 형식으로 안정적으로 출력하는가? | Format Success Rate | 결정론적 |
| 7 | 성능 | 실제 채팅 서비스에 충분히 빠른가? | TTFT, TPS, 전체 Latency | 결정론적 (계측) |
| 8 | 리소스 요구량 | 서비스 규모에서 감당 가능한가? | VRAM/RAM 사용량, 모델 크기·양자화 | 결정론적 (계측) |
| 9 | 클러스터 라벨링 | FAQ 부재 질문 묶음에 적절한 라벨/요약을 붙이는가? | 라벨 정확도(Judge), 라벨 환각 여부, 문자열 유사도 기반 라벨 구분력 | Judge + 결정론적 보조지표 |

클러스터링(그룹 나누기) 자체는 임베딩이 담당하고, LLM은 이미 만들어진 그룹에 라벨/요약만 붙이는 역할로 한정합니다.

> 항목 4의 의도 카테고리는 `data/intent_guide.csv` 기준입니다: `FAQ_RAG`(등록 FAQ로 답변), `MAP_API`(위치·지도 데이터 필요), `UNREGISTERED`(FAQ 근거 부족, 답변 보류), `UNREGISTERED_CLUSTERING`(미등록 질의 중 클러스터링 대상으로 수집). 분류 채점 시 `UNREGISTERED_CLUSTERING`은 `UNREGISTERED`와 같은 클래스로 취급합니다(3-way 분류: FAQ_RAG/MAP_API/UNREGISTERED). `_CLUSTERING` 접미사는 해당 건이 항목 9(클러스터 라벨링) 데이터로도 쓰인다는 태그일 뿐입니다.

## 6. 진행 순서

전체 9개 항목을 한 번에 다 보지 않고, 아래 순서로 나눠서 진행합니다.

1. **1차: FAQ 답변 생성 라운드** — 항목 1·2·5·6·7 (답변 정확도 / RAG 충실도 / 표현 품질 / 명령 수행 / 성능)
   - Easy/Medium/Hard: **실행 완료** (9개 모델 × 9케이스씩)
   - RAG 안정성(Small/Medium/Large): 컨텍스트 개수(3/5/10개)별로 문서 3개 분리 (7-2절 참고) — **전부 실행 완료**
2. **2차: 의도 판단 라운드 (데이터 준비 완료, 미실행)** — 항목 3·4 (FAQ 부재 판단 / 의도 분류). `data/eval_sets/intent_classification.csv`로 진행
3. **3차: 클러스터 라벨링 라운드 (데이터 준비 완료, 미실행)** — 항목 9. `data/eval_sets/cluster_labeling.csv`로 진행

항목 8(리소스 요구량)은 모델별 고정 속성이라 별도 라운드 없이 모델 프로필 표에 기록합니다.

## 7. 평가 데이터

원본은 `data/raw/EmbeddingTestFAQ.xlsx` (임베딩 검색 테스트용으로 먼저 만들어졌던 파일을 재사용). 이 중 이번 LLM 테스트에 맞게 정리한 파일은 다음과 같습니다.

| 파일 | 원본 시트 | 용도 |
|---|---|---|
| `data/faq.csv` | FAQ | 마스터 FAQ 지식베이스 (100건: ID/카테고리/질문/답변/권장 처리 의도/세부 의도) |
| `data/intent_guide.csv` | Intent 가이드 | 의도 카테고리 4종 정의 및 판정 기준 (테스트 데이터 아님, 참고용) |
| `data/eval_sets/faq_easy.csv` | Retrieval Easy | 1차 라운드 - Easy 테스트 케이스 10건 (FAQ_RAG 9 + MAP_API 1) |
| `data/eval_sets/faq_medium.csv` | Retrieval Medium | 1차 라운드 - Medium 테스트 케이스 10건 (FAQ_RAG 9 + MAP_API 1) |
| `data/eval_sets/faq_hard.csv` | Retrieval Hard | 1차 라운드 - Hard 테스트 케이스 10건 (FAQ_RAG 9 + MAP_API 1) |
| `data/eval_sets/rag_stability_small.csv` | RAG 안정성 63건 (Small) | 항목 2(RAG 충실도) 전용 시나리오 21건 — 컨텍스트 2~3개 (7유형×3건) |
| `data/eval_sets/rag_stability_medium.csv` | RAG 안정성 63건 (Medium) | 항목 2(RAG 충실도) 전용 시나리오 21건 — 컨텍스트 3~5개 (7유형×3건) |
| `data/eval_sets/rag_stability_large.csv` | RAG 안정성 63건 (Large) | 항목 2(RAG 충실도) 전용 시나리오 21건 — 컨텍스트 10개 (7유형×3건) |
| `data/eval_sets/cluster_labeling.csv` | 미등록 클러스터링 | 항목 9(클러스터 라벨링) 전용 — 미등록 질의 20건 + 정답 클러스터(4개 그룹) |
| `data/eval_sets/intent_classification.csv` | (통합) | 항목 3·4용 통합 데이터셋 — 위 7개 파일에서 처리 의도가 라벨된 113건을 하나로 모음 |

### 7-1. RAG 안정성 테스트를 컨텍스트 개수별로 3개 파일로 나눈 이유

처음엔 유형당 3건(21건)으로 시작했는데, 표본이 너무 적어서(유형당 증거 3개뿐) 신뢰하기 어렵다는 문제가 있었습니다 (자세한 논의는 커밋 이력 참고). 그래서 유형당 9건(63건)으로 늘리면서, 동시에 **"실제 서비스에서는 벡터 검색 top-k가 3개일 수도 10개일 수도 있다"**는 점을 반영해 컨텍스트(후보 FAQ) 개수를 3단계(Small=2~3개, Medium=3~5개, Large=10개)로 다양화했습니다. 9개 모델 × 63건이면 한 번에 돌리기엔 부담이 커서, 난이도 단계별로 파일 자체를 3개(`rag_stability_small/medium/large.csv`)로 분리했습니다 — 실행도 독립적으로 가능하고, 결과 문서(`faq_rag_stability_{small,medium,large}_results.md`)도 각각 따로 봅니다.

Easy/Medium/Hard(답변 생성 난이도)와 RAG 안정성 Small/Medium/Large(컨텍스트 개수 난이도)는 **서로 다른 축**입니다 — 헷갈리지 않도록 구분해서 봐야 합니다.

### 7-2. Easy/Medium/Hard를 임베딩 시트에서 재활용해도 되는 이유

Easy/Medium/Hard 시트는 원래 **임베딩 검색 랭킹(Top-1 정답률) 검증용**으로 설계됐습니다. `Acceptable FAQ`, `Hard Negative FAQ` 컬럼이 그 증거이고, 이 컬럼들은 랭킹 문제라 이번 LLM 단독 평가에서는 **사용하지 않습니다**.

이 레포에서는 "임베딩이 정답 FAQ를 이미 올바르게 찾아줬다"고 가정하고, **User Query + Ground Truth FAQ 원문만 LLM에 제공한 뒤 생성한 답변의 품질만 평가**하는 방식으로 재활용합니다. 원래 설계 목적(임베딩이 헷갈려하는 정도)은 안 쓰지만, 난이도가 올라가면서 같이 딸려오는 두 가지 특성이 우연히 **LLM 생성 난이도**로도 그대로 유효합니다.

- **표현 방식**: Easy는 FAQ 문구와 거의 겹치는 직접 표현, Medium/Hard는 구어체·상황 묘사·동의어로 에둘러 말함 → LLM이 간접적인 질문 의도를 얼마나 잘 이해하는지 테스트 (순수 LLM 능력)
- **경쟁 FAQ(주의分산 요소)**: Hard로 갈수록 한 질문 안에 여러 연관 개념(분실+회선정지, 번호이동+기기변경, 로밍+Wi-Fi 등)이 섞여 있어 비슷한 FAQ로 오답할 여지가 큼 → 실제로 물어본 것에 정확히 대응하는 FAQ 하나에 집중해서 답하는 능력을 테스트 (RAG 검색과 무관한 순수 생성 능력)

즉 "임베딩이 어려워하는 이유"와 "LLM이 어려워하는 이유"는 다르지만, 난이도 라벨(Easy/Medium/Hard) 자체는 두 목적 모두에 우연히 들어맞아서 그대로 재사용합니다.

## 8. Judge (채점자) 구성

- 채점자: Claude Code 헤드리스 호출 (Pro 사용량 내)
- 후보 모델이 스스로를 채점하지 않도록, 모든 모델에 **동일한 고정 Judge**를 적용
- 절대 점수보다 **정답(Ground Truth FAQ 원문) 대조 채점**을 우선
- 환각 여부는 점수에 섞지 않고 **환각률(%)로 별도 집계** — 특정 임계치를 넘으면 다른 점수와 무관하게 "부적합" 표시

### 8-1. 결정론적 보조 지표 (무료, 규칙 기반)

LLM Judge 하나에만 판단을 맡기지 않고, 비용 없이 재현 가능한 규칙 기반 지표를 **같이** 계산해서 나란히 표기합니다. 임베딩·API가 필요 없는 것만 채택했습니다.

| 지표 | 적용 항목 | 계산 방식 |
|---|---|---|
| 키워드/사실 커버리지 (%) | 답변 정확도 | 정답 FAQ 답변에서 핵심 명사·숫자·조건을 미리 추출해두고, 생성 답변에 몇 %가 포함됐는지 문자열 매칭으로 계산 |
| n-gram 중복도 (ROUGE-L) | 답변 정확도 | 정답 답변과 생성 답변의 최장 공통 부분열 기반 재현율/정밀도 |
| 숫자/고유명사 존재 검증 | RAG 충실도 | 생성 답변에 등장하는 모든 숫자·금액·고유명사가 제공된 FAQ/컨텍스트 원문에 실제로 있는지 정규식 대조. 없으면 환각 후보로 플래그 |
| 문자열 중복/유사도 체크 | 클러스터 라벨 구분력 | 모델이 생성한 클러스터 라벨들끼리 Jaccard 유사도·편집 거리를 계산해, 서로 다른 클러스터에 지나치게 비슷한 라벨이 붙었는지 확인 |

이 지표들은 패러프레이즈(같은 뜻, 다른 표현)를 놓칠 수 있다는 한계가 있어 **LLM Judge/사람 평가를 대체하지 않고 보조 신호로만 사용**합니다. 임베딩 기반 의미 유사도는 원래 "임베딩 제외" 원칙과 결이 달라 이번엔 채택하지 않았습니다.

### 8-2. 사람(운영자) 평가 병행

LLM Judge가 채점하는 항목(1·2·5·9)은 **사람이 개별 건마다 별도로 직접 판단**합니다. 이건 소량 calibration set으로 Judge를 검증하는 것과는 별개로, **모든 테스트 케이스 하나하나에 대해** 결과 문서에 사람 의견을 남길 수 있는 칸을 둡니다.

- 결과 문서의 모델별 표에는 `사람 평가(의견)` 컬럼이 있고, 테스트 케이스마다 자유 텍스트로 의견을 남깁니다 (Judge 판정에 동의/이견 모두 기록)
- 모델별 결과 하단에는 해당 모델 전체에 대한 사람 총평 칸도 별도로 둡니다
- Judge와 사람 판단이 다를 경우, **최종 판단은 사람 의견을 우선**합니다. 이 차이가 누적되면 Judge 프롬프트/기준을 보정하는 데 사용합니다

## 9. 프롬프트 템플릿

세 라운드 모두 시스템 프롬프트 + 사용자 턴으로 구성하고, 출력은 JSON 고정 포맷으로 받습니다(항목 6 포맷 성공률 채점 기준과 직결). 모든 후보 모델에 **동일한 프롬프트**를 사용합니다.

### 9-1. FAQ 답변 생성 (1차 라운드: Easy/Medium/Hard/RAG 안정성 공통)

**시스템 프롬프트**
```
당신은 통신사 고객센터 챗봇입니다. 아래 제공된 FAQ 내용만 근거로 사용자 질문에 친절하고 자연스러운 한국어 존댓말로 답변하세요.

규칙:
1. 제공된 FAQ에 없는 내용(금액, 기간, 절차 등)을 추가하거나 추측하지 마세요.
2. 제공된 FAQ가 없거나, 질문과 무관하거나, 서로 모순되는 경우 솔직하게 답변할 수 없다고 안내하세요.
3. 여러 FAQ가 제공된 경우 실제로 질문과 관련된 FAQ만 사용하고, 관련 없는 FAQ는 무시하세요.
4. 답변은 아래 JSON 형식으로만 출력하세요. 다른 텍스트를 앞뒤에 추가하지 마세요.

출력 형식:
{
  "answer": "사용자에게 보여줄 답변 텍스트",
  "grounded": true | false,
  "used_faq_ids": ["FAQ-028"]
}

- answer: 실제 답변 문장
- grounded: 제공된 FAQ만으로 충분히 답할 수 있었는가 (모르겠다고 답했다면 false)
- used_faq_ids: 답변에 실제로 사용한 FAQ ID 목록 (없으면 빈 배열)
```

**사용자 턴**
```
[사용자 질문]
{user_query}

[참고 FAQ]
{context_block}
```
`context_block`은 케이스별로 채웁니다: FAQ 1개면 `FAQ-028: 카테고리 - Q: ... A: ...` 한 줄, 여러 개면 줄바꿈 나열, 빈 컨텍스트면 `(제공된 FAQ 없음)`, 모순 FAQ는 `A: ... / B: ...` 그대로.

`answer`는 항목 1·5(정답률/표현품질) 채점 대상, JSON 형식 자체가 항목 6(포맷 성공률) 채점 기준입니다. `grounded`/`used_faq_ids`는 항목 2(RAG 충실도) 채점의 보조 신호로 사용합니다.

### 9-2. 의도 분류 (2차 라운드)

FAQ 컨텍스트 없이 사용자 질문만 주고 3-way로 분류합니다.

**시스템 프롬프트**
```
당신은 통신사 챗봇의 의도 분류기입니다. 사용자 질문을 보고 아래 세 가지 중 하나로 분류하세요.

- FAQ_RAG: 등록된 FAQ를 검색해서 답변할 수 있는 일반적인 서비스/이용 관련 질문
- MAP_API: 현재 위치, 가까운 매장, 영업 여부 등 지도·위치 데이터가 필요한 질문
- UNREGISTERED: 위 두 경우에 해당하지 않거나, 기존 FAQ로 답변하기에 정보가 부족한 질문

주의사항:
1. 질문에 "위치", "가까운", "지금 있는 곳" 같은 표현이 있어도, 실제로 필요한 정보가 FAQ로 커버되는 주제(예: 로밍 요금 자체)라면 FAQ_RAG로 분류하세요. 지도·거리 계산이 실제로 필요한 경우만 MAP_API입니다.
2. 판단이 애매한 질문은 UNREGISTERED로 분류하세요. FAQ_RAG나 MAP_API로 억지로 끼워 맞추지 마세요.

출력은 아래 JSON 형식으로만 답하세요.
{
  "intent": "FAQ_RAG" | "MAP_API" | "UNREGISTERED",
  "reason": "분류 이유 한 문장"
}
```

**사용자 턴**
```
{user_query}
```

`intent` 필드가 `intent_classification_results.md`의 Confusion Matrix에 바로 들어가는 예측값입니다. `reason`은 오답 사례를 사람이 검토할 때 참고용으로만 씁니다.

### 9-3. 클러스터 라벨링 (3차 라운드)

이미 같은 그룹으로 묶인 질문 목록을 주고, 그룹 전체를 대표하는 라벨과 요약을 받습니다. 4개 그룹 각각에 대해 1회씩 호출합니다.

**시스템 프롬프트**
```
당신은 고객센터 관리자 대시보드에 쓰일 미등록 질의 클러스터 라벨링 도우미입니다. 아래는 기존 FAQ로 답변하지 못했던 사용자 질문들을 이미 같은 주제로 묶어놓은 그룹입니다. 이 그룹 전체를 대표하는 짧은 라벨과 한 줄 요약을 작성하세요.

규칙:
1. 라벨은 2~6단어 내외의 명사구로, 그룹 내 질문들의 공통 주제를 정확히 나타내야 합니다.
2. 그룹에 없는 내용을 요약에 추가하지 마세요 (질문에 실제로 나온 내용만 반영).
3. 그룹 내에 다소 다른 뉘앙스의 질문이 섞여 있다면, 가장 많은 질문을 포괄하는 라벨을 선택하세요.
4. 출력은 아래 JSON 형식으로만 답하세요.

{
  "label": "그룹을 대표하는 짧은 라벨",
  "summary": "그룹 내용을 요약하는 한 문장"
}
```

**사용자 턴**
```
다음은 같은 그룹으로 묶인 질문들입니다.
1. {question_1}
2. {question_2}
...
```

`label`/`summary`가 `cluster_labeling_results.md`의 "생성 라벨"/"생성 요약" 컬럼에 들어가고, 같은 모델이 생성한 4개 `label`을 서로 비교해 라벨 구분력(문자열 유사도)을 계산합니다.

## 10. 실행 파이프라인 (스크립트)

`scripts/`에 있는 자동화 스크립트는 4단계 파이프라인을 각각 독립된 스크립트로 나눠서 구현했습니다. **한 스크립트로 합치지 않고 단계를 쪼갠 이유**: 각 단계 소요 시간·실패 가능성이 달라서(모델 호출은 몇 분~수십 분, Judge는 비교적 빠름), 한 단계가 실패하거나 기준이 바뀌었을 때 **앞 단계를 다시 안 돌리고 그 단계부터만 재실행**할 수 있어야 하기 때문입니다. 실제로 오늘 Judge 프롬프트를 고친 뒤 `judge_round.js`만 재실행하고 `run_round.js`(모델 호출)는 다시 안 돌렸습니다.

```
scripts/
├── lib/
│   ├── csv.js          # CSV 파서
│   ├── ollama.js        # Ollama REST API 클라이언트
│   ├── metrics.js        # 결정론적 보조 지표 4종
│   ├── judge.js          # 헤드리스 Claude Judge 호출 (FAQ 라운드용 + RAG 안정성용)
│   └── prompts.js        # 모델 목록 + 답변생성 시스템 프롬프트 (공통, README 9-1절)
├── run_round.js               # FAQ 라운드 1단계: 모델 호출 → results/raw/faq_<round>.jsonl
├── score_deterministic.js     # FAQ 라운드 2단계: 보조지표 계산 → *.scored.jsonl
├── judge_round.js             # FAQ 라운드 3단계: Judge 채점 → *.judged.jsonl
├── aggregate_faq_round.js     # FAQ 라운드 4단계: results/faq_<round>_results.md 표 갱신
├── run_rag_stability_round.js       # RAG 안정성 1단계: 모델 호출 → results/raw/rag_stability_<tier>.jsonl
├── score_rag_stability.js           # RAG 안정성 2단계: 숫자/고유명사 검증 → *.scored.jsonl
├── judge_rag_stability_round.js     # RAG 안정성 3단계: Pass/Fail Judge 채점 → *.judged.jsonl
└── aggregate_rag_stability_round.js # RAG 안정성 4단계: results/faq_rag_stability_<tier>_results.md 표 갱신
```

FAQ 라운드(Easy/Medium/Hard)와 RAG 안정성 라운드(Small/Medium/Large)는 스크립트를 공유하지 않고 **평행한 4단계 파이프라인을 각각 따로** 둡니다 — 이유는 10-5절 참고.

### 10-1. 각 모듈을 이렇게 만든 기준

| 모듈 | 선택 | 이유 |
|---|---|---|
| `lib/csv.js` | 라이브러리 대신 직접 구현 (RFC4180 유사 파서) + BOM 스트립 | 무료·로컬·제로 디펜던시 원칙(2절). 따옴표 안에 콤마 포함된 필드(예: `"FAQ-052, FAQ-054"`)가 실제 데이터에 있어 단순 `split(',')`로는 깨짐. **BOM 스트립은 실행 중 발견한 버그 수정** — PowerShell이 CSV를 `Encoding.UTF8`로 저장하면 파일 앞에 BOM이 붙어서 첫 컬럼명(`ID`, `FAQ ID`)이 안 읽히는 문제가 있었음 (Easy 라운드 1차 실행이 이 버그로 전부 무효였음) |
| `lib/ollama.js` | `ollama run` CLI 대신 REST API(`/api/chat`)를 직접 호출 | API 응답에 `total_duration`/`load_duration`/`eval_count`/`eval_duration`이 구조화되어 와서 항목7(성능) 지표 계산에 필요. CLI stdout은 이 수치를 안 줌. `format:"json"` 옵션으로 출력을 JSON으로 강제해서 항목6(포맷 성공률) 측정과 직결시킴 |
| `lib/metrics.js` | 4개 지표 모두 외부 라이브러리 없이 직접 구현 | README 8-1절 원칙(무료·로컬) 그대로 코드화. 키워드 매칭은 정확한 형태소 분석 대신 **부분 문자열(`includes`) 매칭**을 씀 — 한국어 조사 처리를 위해 형태소 분석기(Mecab 등)를 쓰려면 Java/바이너리 설치가 필요해 이번 프로젝트 취지에 안 맞다고 판단. ROUGE-L은 단어 단위 대신 **문자 단위 LCS**로 구현 — 한국어는 띄어쓰기 기준 단어 분리가 신뢰도가 낮아서(조사 결합), 문자 단위가 더 안정적 |
| `lib/judge.js` | `claude -p`를 헤드리스로 호출, 프롬프트는 **stdin으로 전달** (커맨드라인 인자 아님) | 8절에서 정한 "Judge=Claude Code 헤드리스, Pro 사용량" 그대로 구현. 인자 대신 stdin을 쓴 이유는 한국어·특수문자·긴 텍스트가 섞인 프롬프트를 셸 인자로 넘기면 이스케이프 문제가 생기기 쉬워서. Windows에서 `claude.cmd`(npm 전역 설치 시 생기는 실행 래퍼)를 Node가 직접 실행 못 해서 `shell:true`가 필요했음(Windows Node.js의 알려진 제약) |
| `lib/prompts.js` | 모델 목록·시스템 프롬프트를 `run_round.js`/`run_rag_stability_round.js`가 공유하는 모듈로 분리 | 원래 `run_round.js` 안에 인라인으로 있던 걸 RAG 안정성 러너를 추가하면서 뽑아냄 — 두 러너가 같은 상수를 각자 복붙하면 나중에 프롬프트를 고칠 때 한쪽만 고치고 잊어버리는 사고가 나기 쉬워서 |

### 10-2. 실행 중 발견해서 고친 것 (참고용)

- **CSV BOM 문제**: 위 표 참고. `parseCsv()`가 이제 파일 시작의 BOM을 자동으로 제거합니다.
- **Judge 응답 파싱 실패 (2가지 패턴)**: (1) 가끔 응답을 \`\`\`json 코드블록으로 감싸서 반환 → `stripCodeFence()`로 방어. (2) 모델이 출력 스키마를 그대로 복사한 것 같은 완전히 망가진 답변(예: `"answer": "사용자에게 보여줄 답변 텍스트"` 그대로 출력)을 채점시키면 Judge가 채점을 거부하고 설명 텍스트를 냄 → 프롬프트에 "실패작이어도 낮은 점수로 반드시 JSON만 출력" 지시를 명시해서 해결.

### 10-3. 집계 스크립트의 판단 기준

`aggregate_faq_round.js`가 표를 채울 때 정한 규칙:

- **정답률(%)**: Judge의 `answer_accuracy`(1~5점) 중 **4점 이상을 "정답"으로 간주**해 비율을 냅니다. 이 임계값은 제가 임의로 정한 것이라 조정 가능합니다 — 더 엄격하게 하려면 5점만 정답으로 칠 수도 있습니다.
- **환각률(%)**: Judge의 `faithful`이 `false`인 비율.
- 결측/포맷실패 케이스는 요약 통계 계산에서 제외하고 표에는 "포맷실패"로 표시해 눈에 띄게 남깁니다.
- 이 스크립트는 `## 모델별 결과` 마커 아래쪽만 다시 씁니다 — 개요/테스트 케이스/채점 기준 설명은 손대지 않고 그대로 둡니다. **표를 손으로 고치면 다음 실행 때 덮어써지니, 표 내용을 바꾸고 싶으면 스크립트나 원본 데이터를 고치세요** (단, `사람평가`/`사람 총평` 칸은 스크립트가 항상 빈 칸으로 두므로 자유롭게 손으로 채워도 덮어써지지 않습니다).

### 10-4. 실행 방법 — FAQ 라운드 (Easy/Medium/Hard)

```
node scripts/run_round.js easy              # 1. 모델 호출
node scripts/score_deterministic.js easy    # 2. 보조지표 계산
node scripts/judge_round.js easy            # 3. Judge 채점
node scripts/aggregate_faq_round.js easy    # 4. 결과 문서 갱신
```
`easy`를 `medium`/`hard`로 바꾸면 해당 라운드로 동일하게 실행됩니다.

### 10-5. RAG 안정성 전용 파이프라인 (Small/Medium/Large)

FAQ 라운드 스크립트를 그대로 재사용하지 못하고 **별도 스크립트 세트를 만든 이유**는 데이터 구조와 채점 기준이 근본적으로 다르기 때문입니다.

| 구분 | FAQ 라운드 (Easy/Medium/Hard) | RAG 안정성 (Small/Medium/Large) |
|---|---|---|
| 컨텍스트 생성 | `Primary GT` FAQ ID로 `data/faq.csv`를 조회해서 원문 조립 | `rag_stability_*.csv`의 `제공 Context` 컬럼을 **그대로 사용** (이미 완성된 텍스트 — 무관 FAQ 설명, `EMPTY`, `A:.../B:...` 모순 등 형식이 케이스마다 다름) |
| 정답 판정 | 정답 FAQ 원문과 **대조**해서 1~5점 채점 (`answer_accuracy`) | 케이스마다 다른 **"기대 행동"/"실패 조건"**을 지켰는지 **Pass/Fail** 채점 (정답 텍스트 자체가 없음) |
| 결정론적 보조지표 | 키워드 커버리지 + ROUGE-L + 숫자검증 3종 (정답 텍스트와 비교) | 숫자/고유명사 검증만 (비교할 정답 텍스트가 없어서 키워드·ROUGE는 적용 불가) |
| Judge 프롬프트 | `buildJudgePrompt` — 고정 루브릭(정확도/충실도/표현품질) | `buildRagStabilityJudgePrompt` — **케이스별 가변 루브릭** (그 케이스의 기대 행동·실패 조건을 프롬프트에 그대로 삽입) |

실행 방법은 FAQ 라운드와 동일한 4단계 패턴입니다.

```
node scripts/run_rag_stability_round.js small              # 1. 모델 호출
node scripts/score_rag_stability.js small                  # 2. 숫자/고유명사 검증
node scripts/judge_rag_stability_round.js small             # 3. Pass/Fail Judge 채점
node scripts/aggregate_rag_stability_round.js small          # 4. 결과 문서 갱신
```
`small`을 `medium`/`large`로 바꾸면 해당 난이도로 동일하게 실행됩니다. 세 티어는 서로 완전히 독립된 데이터/결과 파일이라 순서 상관없이, 원하는 것만 골라 돌려도 됩니다.

**검증**: `gemma3:270m`으로 EC-01(빈 컨텍스트) 1건을 실제로 돌려 파이프라인 전체(모델 호출 → Judge 채점)를 확인했습니다. 모델이 출력 스키마를 그대로 복사한 망가진 답변을 냈는데, Judge가 이를 정확히 `pass:false`로 판정하고 이유까지 명확히 설명했습니다.

## 11. 결과 문서

| 문서 | 내용 | 상태 |
|---|---|---|
| [`results/summary_results.md`](results/summary_results.md) | **전체 6개 라운드 종합 요약** (FAQ Easy/Medium/Hard + RAG 안정성 Small/Medium/Large, 유형별 상세 포함) — `scripts/generate_summary.js`로 자동 생성 | ✅ 실행 완료 |
| [`results/faq_easy_results.md`](results/faq_easy_results.md) | Easy 난이도 모델별 결과 | ✅ 실행 완료 |
| [`results/faq_medium_results.md`](results/faq_medium_results.md) | Medium 난이도 모델별 결과 | ✅ 실행 완료 |
| [`results/faq_hard_results.md`](results/faq_hard_results.md) | Hard 난이도 모델별 결과 | ✅ 실행 완료 |
| [`results/faq_rag_stability_small_results.md`](results/faq_rag_stability_small_results.md) | RAG 안정성(컨텍스트 2~3개) 모델별 결과 | ✅ 실행 완료 |
| [`results/faq_rag_stability_medium_results.md`](results/faq_rag_stability_medium_results.md) | RAG 안정성(컨텍스트 3~5개) 모델별 결과 | ✅ 실행 완료 |
| [`results/faq_rag_stability_large_results.md`](results/faq_rag_stability_large_results.md) | RAG 안정성(컨텍스트 10개) 모델별 결과 | ✅ 실행 완료 |
| [`results/intent_classification_results.md`](results/intent_classification_results.md) | 의도 분류(항목 3·4) 모델별 결과 | 미실행 |
| [`results/cluster_labeling_results.md`](results/cluster_labeling_results.md) | 클러스터 라벨링(항목 9) 모델별 결과 | 미실행 |

## 12. 리포지토리 구조

```
LLM_Test/
├── README.md
├── data/
│   ├── raw/
│   │   ├── EmbeddingTestFAQ.xlsx               # 원본 엑셀 (FAQ/Easy/Medium/Hard/클러스터링/Intent가이드)
│   │   └── faq_rag_stability_expanded_63.xlsx  # RAG 안정성 63건 원본 엑셀
│   ├── faq.csv                          # 마스터 FAQ (100건)
│   ├── intent_guide.csv                 # 의도 카테고리 정의 (참고용)
│   └── eval_sets/
│       ├── faq_easy.csv
│       ├── faq_medium.csv
│       ├── faq_hard.csv
│       ├── rag_stability_small.csv      # 컨텍스트 2~3개, 7유형×3건
│       ├── rag_stability_medium.csv     # 컨텍스트 3~5개, 7유형×3건
│       ├── rag_stability_large.csv      # 컨텍스트 10개, 7유형×3건
│       ├── cluster_labeling.csv
│       └── intent_classification.csv    # 위 7개 파일 통합 (113건)
├── scripts/
│   ├── lib/
│   │   ├── csv.js
│   │   ├── ollama.js
│   │   ├── metrics.js
│   │   ├── judge.js
│   │   └── prompts.js
│   ├── run_round.js
│   ├── score_deterministic.js
│   ├── judge_round.js
│   ├── aggregate_faq_round.js
│   ├── run_rag_stability_round.js
│   ├── score_rag_stability.js
│   ├── judge_rag_stability_round.js
│   ├── aggregate_rag_stability_round.js
│   └── generate_summary.js              # 전체 라운드 종합 요약 생성 (results/summary_results.md)
└── results/
    ├── raw/                              # 스크립트 중간 산출물 (jsonl), 사람이 직접 편집하지 않음
    │   ├── faq_easy.jsonl
    │   ├── faq_easy.scored.jsonl
    │   └── faq_easy.judged.jsonl
    ├── summary_results.md               # 전체 6개 라운드 종합 요약 (유형별 상세 포함)
    ├── faq_easy_results.md
    ├── faq_medium_results.md
    ├── faq_hard_results.md
    ├── faq_rag_stability_small_results.md
    ├── faq_rag_stability_medium_results.md
    ├── faq_rag_stability_large_results.md
    ├── intent_classification_results.md
    └── cluster_labeling_results.md
```

## 13. TODO

- [x] Ollama에 9개 후보 모델 설치 (`gemma3:12b`는 계획에 없던 추가 설치, 이번 테스트 대상에서는 제외)
- [x] 프롬프트 템플릿 확정 (답변 생성/의도 분류/클러스터 라벨링 — 9절 참고)
- [x] 결정론적 보조 지표 계산 스크립트 작성 (10절 참고)
- [x] Easy → Medium → Hard 9개 모델 실행 및 결과 문서 채우기
- [x] RAG 안정성 케이스 유형당 3건→9건(63건)으로 확대, 컨텍스트 개수(3/5/10) 난이도 분리 — 데이터만 준비, 미실행
- [x] RAG 안정성 전용 4단계 파이프라인 작성 (`run_rag_stability_round.js` 등 4종 — 10-5절 참고), 1건 스모크 테스트로 동작 확인
- [x] RAG 안정성 Small → Medium → Large 순으로 9개 모델 실행 및 결과 문서 채우기
- [ ] 사람 채점 calibration set 소량 확보 후 Judge 신뢰도 검증 추가
- [ ] 의도 판단 라운드(항목 3·4) 9개 모델 실행 및 결과 문서 채우기
- [ ] 클러스터 라벨링 라운드(항목 9) 9개 모델 실행 및 결과 문서 채우기
- [ ] Easy/Medium/Hard `사람평가`/`사람 총평` 칸 검토 및 채우기
