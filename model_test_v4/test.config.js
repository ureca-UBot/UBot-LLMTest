'use strict';
// model_test_v4 테스트 설정 — 공통 엔진(저장소 루트 scripts/)이 읽는 유일한 버전별 파일.
// 새 버전을 만들 때는 이 파일을 복사해 바뀌는 값만 고친다. 스크립트는 복사하지 않는다.
// 필드 설명은 scripts/README.md 참고.

module.exports = {
  version: 'v4',
  title: 'test4 — 저급 모델 튜닝 기준선 (LLM 단독 · Context 고정)',
  defaultTry: 'try1',

  // 컨텍스트 공급 방식. 'fixed' = 데이터셋의 제공 Context를 그대로 넣는다(LLM 단독).
  // 임베딩 검색 적용 테스트('retrieval')는 아직 구현하지 않았다.
  contextMode: 'fixed',

  dataset: {
    name: 'test_set3',
    source: 'data/raw/FAQ_RAG_15개항목_각200건_총3000건_피드백수정본.xlsx',
    sheet: '테스트 3000건',
    faqSheet: 'FAQ 원문',
    casesPath: 'data/eval_sets/test_set3/cases_fixed.csv',
    faqPath: 'data/eval_sets/test_set3/faq_master.csv',
    // 엔진이 쓰는 필드 이름 -> 데이터셋 컬럼 이름. 데이터 형식이 바뀌면 여기만 고친다.
    columns: {
      id: '실행 ID',
      item: '항목 코드',
      itemName: '테스트 항목',
      difficulty: '난이도',
      question: '사용자 질문',
      context: '제공 Context',
      history: '대화 이력 (JSON)',
      userInfo: '사용자 정보·API (JSON)',
      persona: '추가 페르소나 지시',
      expectedStatus: '기대 상태',
      referenceAnswer: '정답 예시',
      requiredFacts: '필수 사실·표현 기준',
      failCondition: '실패 조건',
      sourceFaqIds: '근거 원문 FAQ ID (추적용)',
      originalId: '원본 질문 ID',
      round: '실행 회차',
      repeatTotal: '총 반복 횟수',
      personaSub: '페르소나 하위 항목',
      scenarioGroup: '시나리오 그룹',
      independentUnit: '독립 집계 단위',
      expectedRoute: '기대 처리 경로',
      subsetMin: '포함 최소 규모', // prepare_dataset.js가 추가하는 컬럼
    },
    // 간이 테스트용 서브셋(항목당 건수). 작은 서브셋은 큰 서브셋에 항상 포함된다
    // (50 ⊂ 100 ⊂ 150 ⊂ 200). 난이도(+페르소나 하위 항목) 비율을 유지하고, 반복 항목은
    // 원본 질문 단위로 뽑아 10회 반복을 통째로 넣는다.
    subset: { sizes: [50, 100, 150, 200], full: 200, seed: 'test_set3-v1', strata: ['difficulty', 'personaSub'] },
    defaultSize: 200,
  },

  // 15개 항목. 순서가 보고서의 항목 순서다.
  items: [
    { code: 'SF', name: '단일 FAQ 답변' },
    { code: 'NC', name: '유사 FAQ 구분·노이즈' },
    { code: 'MC', name: '다중 FAQ 조합' },
    { code: 'UI', name: '사용자 정보 + FAQ' },
    { code: 'CE', name: '조건·예외·경계값' },
    { code: 'PI', name: '부분 정보' },
    { code: 'SR', name: '유사하지만 답 없음' },
    { code: 'HR', name: '무관 FAQ' },
    { code: 'EC', name: '빈 컨텍스트' },
    { code: 'CF', name: 'FAQ 충돌·시행일' },
    { code: 'MT', name: '멀티턴 대화' },
    { code: 'AD', name: '적대적 입력·범위 밖' },
    { code: 'AR', name: 'API 결과 답변' },
    { code: 'PS', name: '페르소나' },
    { code: 'RT', name: '반복 테스트' },
  ],
  // 반복 항목 — 전체 집계(독립 표본)에서 빼고 항목별 표와 반복 일관성에서 따로 본다.
  repeatItem: 'RT',
  // 안전성 Judge 대상 항목.
  safetyItems: ['AD'],

  // 근거 채택(score_evidence.js) 판정 범위.
  evidence: {
    // AR은 API 결과만으로 답하면 evidence_ids가 빈 배열이어도 정상이라(프롬프트 허용) 제외한다.
    excludeItems: ['AR'],
    // 보류 응답은 인용이 선택 사항이므로(프롬프트 허용) 답을 내야 하는 기대 상태만 판정한다.
    expectedStatuses: ['ANSWER', 'PARTIAL', 'CONFLICT'],
  },

  // 오답 행의 대응 수단 분류(가설 — 튜닝 실험 결과로 고친다). judge_report.js가 행마다
  // (경로, 항목)으로 수단을 붙인다. MODEL 몫은 식별·추론 보강 후보 비중이며, 실제 튜닝
  // 한계가 아니다. 같은 문항에서 보강 실험·회귀·속도를 확인한 뒤 상위 모델과 비교한다.
  //   OUTPUT_STRUCTURE 본문은 맞는데 라벨(status·evidence_ids)만 틀림 → 출력 순서·형식
  //   PROMPT           규칙·정의·예시로 고칠 수 있음
  //   CODE             모델 앞뒤 코드로 막을 수 있음(빈 Context 차단, 임베딩 임계값 등)
  //   MODEL            판단·식별 보강 실험 후보(프롬프트·코드로 개선 불가라는 판정 아님)
  // 경로 값은 문자열(전 항목 공통) 또는 { default, <항목 코드>: ... }.
  tuning: {
    labelOnly: 'OUTPUT_STRUCTURE',
    // A/B/C는 판단 방향 × 본문 근거 상태. 수단·난이도는 실험 전 가설이다.
    // A4를 하나의 보류 문제로 합치면 빈 Context·무관 FAQ·유사 문서의 난이도 차이가 가려진다.
    codes: {
      A4: {
        EC: { methods: ['CODE'], difficulty: 'LOW', action: '빈 Context임을 코드로 확인하고 확정 답변을 차단한다.' },
        HR: { methods: ['CODE', 'PROMPT'], difficulty: 'HIGH', action: '무관성을 정답 라벨 없이 탐지할 수 있는 검색 신호를 별도로 검증한 뒤 차단·보류 규칙을 실험한다.' },
        SR: { methods: ['PROMPT', 'MODEL'], difficulty: 'HIGH', action: '관련은 있지만 질문의 답은 없는 문서의 대조 예시와 답변 가능성 판단을 보강한다.' },
      },
      D2: {
        AR: { methods: ['CODE'], difficulty: 'LOW', action: 'API의 조회 상태·대상·수치에 맞는 코드 템플릿으로 답변을 만들고 실제 값과 대조한다.' },
      },
    },
    // P 경로 기반 배타 집계는 과거 자료 추적용. 사용자용 집계는 위 codes와 공통 코드 정의를 사용한다.
    paths: {
      P1: { default: 'PROMPT', EC: 'CODE', HR: 'CODE', SR: 'MODEL' }, // 과대: 유사하지만 답 없는 문서(SR)에서의 오판은 능력 문제. NC는 기대가 전부 ANSWER라 P1이 없다
      P2: 'PROMPT',            // 과소: 상태 정의·부정 답변 예외
      P3: 'PROMPT',            // 교차: 상태 정의 경계
      P4: 'MODEL',             // 근거 선택: 비슷한 문서 식별(재순위화는 이 테스트 범위 밖)
      P5: 'PROMPT',            // 누락: 원문 인용·필수 항목 규칙
      P6: { default: 'MODEL', AR: 'CODE' }, // 오적용: 조건·계산 추론. AR은 API 값 템플릿
      P7: 'PROMPT',            // 정답+환각: 근거 밖 보충 금지
      PF: 'OUTPUT_STRUCTURE',  // 본문 행동을 알 수 없음(형식·생성 실패)
    },
  },

  // 상담봇 시스템 프롬프트 — prompts/chatbot/variants.json의 안 이름.
  // v4_base = prompts/chatbot/variants.json 참고(공통 문단 + 판정 기준 + 출력 순서).
  prompt: { variant: 'v4_base' },
  // 출력 키 순서 기대값 — 생성 단계가 실제 순서를 기록하고 포맷 채점이 준수율을 낸다.
  // 순서가 지켜지지 않은 응답은 "근거를 먼저 고른다"는 전제가 성립하지 않으므로 반드시 함께 본다.
  output: { keyOrder: ['evidence_ids', 'status', 'answer'] },

  // runByDefault=false인 모델은 run_all.js가 건너뛴다(run_model/run_item으로는 실행 가능).
  // 4b 두 개를 먼저 튜닝하고, 튜닝 한계·트레이드오프가 확인되면 qwen3:8b로 넘어간다.
  models: [
    { tag: 'qwen3:4b', thinkCapable: true, runByDefault: true },
    { tag: 'gemma3:4b', thinkCapable: false, runByDefault: true },
    { tag: 'qwen3:8b', thinkCapable: true, runByDefault: false },
  ],

  // 생성 조건. think는 추론 모드가 있는 모델에만 전달된다.
  conditions: {
    t0_nothink: { temperature: 0, think: false },
  },
  defaultCondition: 't0_nothink',

  generation: {
    // 'schema' = Ollama 구조화 출력으로 output.keyOrder 순서·status enum을 강제한다. 프롬프트 지시만으로는
    // gemma3:4b가 순서를 거의 지키지 않았다(스모크: 지시만 2/20, 스키마 12/12). 대가로 포맷 준수율은
    // 지시 이행 능력을 재지 못한다(구조가 강제되므로). 'json'이면 JSON 모드만 켠다.
    format: 'schema',
    // 응답 시간 상한. 넘으면 재시도 없이 생성 오류(TIMEOUT)로 기록한다 — 상담봇에서 60초를
    // 넘는 응답은 실패로 본다(운영 백엔드 LLM_READ_TIMEOUT 120s보다 엄격한 테스트 기준).
    timeoutMs: 60000,
    retries: 2, // 연결 오류 등 일시적 실패만 재시도(타임아웃은 재시도하지 않음)
  },

  // 정답 유사도·반복 표현 유사도에 쓰는 임베딩 모델(v2·v3와 같음).
  embeddingModel: 'bge-m3:latest',

  // run_pipeline.js가 건너뛸 단계. 예) ['score_rag_grounding'] — NLI venv가 없는 환경.
  pipeline: { skip: [] },

  // LLM Judge(판정 단계). provider·model·reasoningEffort·temperature·seed는 배치 준비 때 매니페스트에
  // 고정된다 — 바꾸면 새 배치 ID로 다시 준비해야 한다.
  judge: {
    provider: 'openai',       // 'openai'(OpenAI API) | 'codex'(v3 방식 Codex CLI)
    model: null,              // 미정 — 판정 모델 테스트 후 정한다. null이면 judge_run.js가 멈춘다
    reasoningEffort: null,    // 추론 모델이면 'low'|'medium'|'high', 아니면 null
    temperature: null,        // null이면 보내지 않음(추론 모델은 지원 안 함)
    seed: null,
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    maxRetries: 4,            // 429·5xx·타임아웃 재시도(retry-after 존중)
    timeoutMs: 180000,
    // accuracy = 정확도·근거·표현(전 행), safety = safetyItems, persona = 페르소나 지시가 있는 행
    kinds: ['accuracy', 'safety', 'persona'],
    // 반복 항목의 2~10회차도 채점한다(반복 간 정확도 편차를 보기 위해).
    includeRepeats: true,
  },
};
