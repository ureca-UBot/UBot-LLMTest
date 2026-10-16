# FAQ 코어 1,000건 기준점 설정 — v8

## 1. 개요와 회차

| 회차 | 날짜·환경 | 내용 | 결과 |
|---|---|---|---|
| try1 | 2026-10-16 · EC2 g6.2xlarge · NVIDIA L4 | 실제 임베딩 → FAQ 검색 → RedHatAI LLM, 가드 미적용 | [전체 요약](try1/results/all_summary.md) |

이 버전은 완료한 독립 실행의 **결과 보관본**입니다. 기존 공통 실행·평가 엔진의 코드를 변경하거나 복사하지 않았으며, 공통 엔진용 실행 profile로 등록한 버전이 아닙니다. 아래 설정 파일은 당시 값의 증거이며 실행 명령이 아닙니다.

## 2. 목표와 이전 버전 대비 변경점

이번 기준점은 정상 FAQ 질문에 가드를 적용하기 전의 검색·답변을 보관해 이후 동일 조건 비교에 사용합니다. 기존 v7의 공격 포함 1,600문항·고정 Context·구 프롬프트 결과와 단순 정답률 차이를 계산하지 않습니다.

| 구분 | 이번 기준점 |
|---|---|
| 질문 | FAQ 원본 ID 1~1,000의 질문 1,000개, 반복 없음 |
| 검색 자료 | FAQ 1,034개와 원본·유사 질문 5,170개 |
| 프롬프트 출처 | UBot-BE develop `797c68eb85d2729ed8526b6022c3a8ad73bd0c22` |
| 출처 변경 | FAQ 답변 프롬프트 튜닝 7차(v5_i4b), PR #213 |
| 가드 | 입력·출력 모두 미실행 |
| 평가 | 후속 내용 Judge 1,000건 완료. 원판정과 Codex 근거 재검토 의견을 분리해 보관 |

## 3. 모델과 검색 설정

- LLM: `RedHatAI/Qwen3-4B-Instruct-2507-quantized.w4a16`.
- 가중치 revision: `5d4fde88f26ef2577a3e660db6304eaa6cbe99a1`, [파일 해시](try1/results/report/model_verification.json).
- 임베딩: `BAAI/bge-m3`, 서비스 별칭 `ubot-embedding`, 1,024차원, batch 16.
- 검색: `QUESTION`, 정확 코사인 유사도, FAQ별 최고 유사 질문 1개, top-k 3, 임계값 **0.75 이상**, rerank 비활성.
- 검색 자료 5,170개와 시험 질문 1,000개 모두 이번에 실제 EC2 서비스로 임베딩했습니다. seed에 저장되어 있던 구 벡터를 쓰지 않았습니다.
- LLM: temperature 0, vLLM, GPU 가중치 상주, CPU offload 0, max-model-len 4096, max-num-seqs 1, GPU-memory-utilization 0.25, enforce-eager.
- 팀의 JSON schema와 프롬프트를 그대로 전달했습니다. 프롬프트의 키 순서 안내와 schema의 키 순서 차이도 수정하지 않았습니다.
- 개인·매장 API/매장 도구 결과 없음, 추가 Context `(없음)`.

## 4. 테스트 항목과 평가 기준

17개 FAQ 분류의 정상 원문 질문 1,000개입니다. 분류 수를 인위적으로 균등화하지 않았습니다. GENERAL 334개, STORE_DATA 333개, USER_DATA 333개라는 seed intent는 API 호출 성공이나 실제 조회 데이터 제공을 뜻하지 않습니다.

내용 정확성, 근거 없는 추가, 질문 충족·누락, 정보 부족 대응을 실제 제공 FAQ와 비교했습니다. [평가 결과](try1/results/llm_judge/core1000-accuracy-context-v1_20261016/evaluation_report.md). status·evidence_ids와 형식 위반은 분리합니다. [상세 평가 기준](try1/results/summary/evaluation_criteria.md).

## 5. 실제 실행 순서와 보관 범위

1. EC2 GPU·기존 서비스와 지정 가중치 파일 해시 확인.
2. 검색 자료 5,170개·시험 질문 1,000개를 BGE-m3로 새로 임베딩.
3. 제공 FAQ를 top-k·임계값 조건으로 구성.
4. 별도 임시 vLLM에 지정 RedHatAI 모델을 실행하고, 고정 프롬프트·스키마로 1,000번 요청.
5. 응답·요청·벡터·시간을 보관하고 기존 서비스 상태 및 임시 컨테이너 제거 확인.
6. 완료한 실행 자료를 로컬에 수집·검증해 최초 게시.
7. 저장된 답변 1,000건에 기존 팀 Judge를 적용하고, 실행 조건 부칙과 원판정·Codex 근거 재검토 의견을 별도 보관. 가드 비교는 아직 미실행.

프로젝트 소스, 기존 실행·평가 스크립트, 가드, DB, 서버 설정을 게시하거나 수정한 회차가 아닙니다. 기존 서비스의 컨테이너 ID·실행 여부·시작 시각은 전후 동일했습니다. 재실행으로 기존 원자료를 덮어쓰면 안 됩니다.

## 6. 파일 위치

```text
model_test_v8/
  inputs/                         # 질문·FAQ·유사 질문, 실제 프롬프트·schema 스냅샷
  try1/results/
    all_summary.md                # 읽기 시작점
    summary/                      # 전체 답변, CSV, 평가 기준
    report/                       # 실행 설명·설정·원본 검증·게시 해시
    raw/ec2-linux_redhat-qwen3-4b-instruct-2507-w4a16_t0_question-retrieval_core1000_20261016/
      results.jsonl               # 실제 응답 원본
      llm_requests.jsonl          # 실제 요청 원본
      embedding/                  # 새 벡터 ZIP·메타데이터
    llm_judge/README.md            # 평가 입구
    llm_judge/core1000-accuracy-context-v1_20261016/ # 원판정·재검토·보고서·해시
```

## 7. 알려진 한계

원본 질문이 검색 자료에도 있으므로 원본 FAQ 1위 1,000건은 자체 일치 확인입니다. 표현 변형·실사용 검색 성능을 입증하지 않습니다. 파일 기반 정확 코사인 검색은 팀 SQL의 정렬·FAQ별 선택 규칙을 따르지만 실제 Spring·PostgreSQL 경로를 실행하지 않았습니다. 개인·매장 조회 기능, 다중 턴, 공격 방어 및 가드 성능은 이 기준점의 검사 대상이 아닙니다. [상세 실행 보고서](try1/results/report/execution_report.md).
