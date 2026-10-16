# try2 실행 상세와 보관 범위

[전체 요약](../all_summary.md) · [고정 설정](test_config.json) · [가중치 검증](model_verification.json)

## 실행 환경

- 일시: 2026-10-16, EC2 g6.2xlarge / NVIDIA L4.
- LLM: `RedHatAI/Qwen3-4B-Instruct-2507-quantized.w4a16`, revision `5d4fde88f26ef2577a3e660db6304eaa6cbe99a1`. 공식 가중치·tokenizer·config SHA-256를 확인했습니다. 기존 서비스의 `Qwen/Qwen3-4B-AWQ`로 대신 실행하지 않았습니다.
- vLLM GPU 가중치 상주, CPU offload 0, max-model-len 4096, max-num-seqs 1, gpu-memory-utilization 0.25, enforce-eager. 기존 서버 모델을 변경하지 않고 자체 테스트 컨테이너를 사용했습니다.
- 임베딩: 실행 중인 `BAAI/bge-m3`, 1,024차원, batch 16. 검색 자료 5,170개·입력 가드 후 질문 1,000개를 새로 계산했습니다.
- 데이터·프롬프트·schema는 기존 [v8 inputs](../../../inputs/dataset.json)를 그대로 사용했습니다. 임시 프롬프트 사본만 LF로 정규화해 기준점의 실제 요청 내용과 맞췄고 STS 파일은 수정하지 않았습니다.

## 기존 기능 재사용과 경로

실행 시작 시점의 STS Java 소스 465개와 의존 라이브러리를 프로젝트 밖 임시 폴더로 복사해 EC2에서 실행했습니다. 현재 입력 가드의 질문 준비·금칙어·조작 검사와 현재 AiService·PromptService·vLLM 클라이언트·기존 파서·출력 가드를 호출했습니다. 가드 규칙을 테스트용으로 새로 구현하거나 본문을 별도 정답으로 바꾸지 않았습니다.

현재 ACTIVE 금칙어 38개는 기존 DB에서 읽기 전용 트랜잭션으로 조회한 사본을 사용했습니다. 실행 중 저장소 대체 객체는 그 사본만 반환하며 실제 DB에 접속하지 않습니다. [금칙어 데이터 사본](active_words_snapshot.json).

검색은 파일의 QUESTION 벡터를 NumPy float64 정확 코사인으로 비교하고 FAQ별 최고 유사 질문을 고른 후 점수 내림차순·FAQ ID 오름차순으로 top3를 선택했습니다. 임계값은 0.75 이상입니다. 리랭커·FAQ 직접 반환 캐시는 비활성입니다.

## 제외한 경로

Spring 애플리케이션·실제 PostgreSQL 검색·프론트·개인/매장 조회 도구는 실행하지 않았습니다. 개인·매장 API 자료와 추가 Context는 `(없음)`입니다. 이는 try1과 동일한 조건이며 실제 배포 서비스의 모든 경로에 대한 종합 성공률을 뜻하지 않습니다. AI 분류 가드 4모델을 다시 실행한 테스트도 아닙니다.

## 결과 무결성

- 질문·응답 1,000건의 ID와 중복을 확인했습니다. 실제 LLM 요청은 1,000회이고 새 최종 답변의 내용 Judge는 미실행입니다.
- 가드·프롬프트를 포함한 STS 파일 467개가 시작 시점 해시와 일치합니다. [소스 해시](source_manifest.json) · [종료 후 확인](integrity_verification.json).
- 기존 서비스의 컨테이너 ID·실행 여부·시작 시각은 [실행 전](existing_services_before.json)과 [실행 후](existing_services_after.json)가 동일합니다. 이번 테스트 컨테이너는 모두 종료했습니다. [실행 상태](session_result.json).
- 실제 요청·응답·재검사·벡터·설정·해시만 게시합니다. 프로젝트 구현 코드, 외부 실행기, 라이브러리, SSH 키·인증 파일·토큰·터미널 로그는 게시하지 않습니다.
- [실행 집계](run_summary.json) · [추가 검증](execution_verification.json) · [게시 파일 해시](publication_manifest.json).

## 시간 수치 해석

2.746초 평균·4.434초 P95는 EC2 실행기에 요청해 새 LLM 본문을 생성하고 현재 파서·출력 가드 처리를 마친 요청 시간입니다. 입력·임베딩은 앞선 일괄 단계였고 순차 생성·출력 검사 전체는 2750.7초입니다. 실제 서비스 동시 부하 지연이나 가드만의 순수 추가 지연으로 해석하지 않습니다.
