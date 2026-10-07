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
    // 2026-10-06: 테스트 FAQ를 의도 균등 FAQ v4 반영본(14항목 × 200 = 2,800건, FAQ 원문 1,000건)으로 교체했다.
    // 평가 기준·방법은 그대로다. 이전 데이터셋(test_set3, 15항목·3,000건)은 data/eval_sets/test_set3에 남겨 둔다.
    // 시트 이름은 원본 파일에서 바뀌지 않아 '테스트 3000건' 그대로다(실제 행은 2,800).
    name: 'test_set4',
    source: 'data/raw/FAQ_RAG_2800건_의도균등FAQ_v4반영본.xlsx',
    sheet: '테스트 3000건',
    faqSheet: 'FAQ 원문',
    casesPath: 'data/eval_sets/test_set4/cases_fixed.csv',
    faqPath: 'data/eval_sets/test_set4/faq_master.csv',
    // 원본 테스트 시트에 같이 들어 있는 결과 기록용 빈 칸(LLM 출력·Judge·자동 판정 칸). 엔진은 결과를
    // results/ 아래에 따로 쓰므로 cases CSV에는 넣지 않는다. prepare_dataset.js가 모두 비어 있는지 확인하고
    // 값이 있으면 멈춘다(입력 데이터를 잘못 버리지 않도록).
    resultColumns: {
      prefixes: ['LLM ', 'Judge ', 'Persona ', 'Safety '],
      names: [
        '생성 상태', '근거 채택 분류', '근거 채택 (1/0)', '정답 근거 전부 인용 (1/0)', 'Context 밖 인용 ID (JSON)',
        '문서 외 인용 꼬리표 (JSON)', '본문 근거 오류 (1/0)', '출력 status·본문 불일치 (1/0)', '인용·본문 출처 불일치 (1/0)',
        '오답 주원인 (자동)', '상태 엄격 판정 (자동)', '상태 완화 판정 (자동)', '허용 교차 유형 (자동)',
        '생성 시간 (ms)', '실행·평가 메모',
      ],
    },
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
    subset: { sizes: [50, 100, 150, 200], full: 200, seed: 'test_set4-v1', strata: ['difficulty', 'personaSub'] },
    defaultSize: 200,
  },

  // 14개 항목. 순서가 보고서의 항목 순서다.
  // SF(단일 FAQ 답변)는 뺐다(2026-10-02) — top-k를 3으로 고정해서 상담봇에 항상 FAQ 3개가 주어지므로
  // "FAQ 1개만 주어짐" 상황 자체가 더 이상 발생하지 않는다. test_set4는 원본부터 SF가 없다.
  items: [
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
    // CONFLICT는 모순되는 두 문서를 지목해야 하므로 포함한다(2026-10-02, 같은 날 재결정).
    expectedStatuses: ['ANSWER', 'PARTIAL', 'CONFLICT'],
  },

  // 2026-10-02: 경로(P0~P7) 기반 자동 튜닝 코드 체계(A/B/C/D/E/F/S)는 폐기했다 — 상태(본문 행동)
  // 불일치를 최우선 문제로 보는 전제가, 상태를 아예 안 보는 정확도 판정·정답+상태 완화 결정과
  // 맞지 않았다. 대응 수단은 judge_report.js의 "오답 이유"(근거 오류→필수 사실 누락→사실
  // 오적용/모순→기타)와 항목 코드를 보고 사람이 판단한다. scripts/lib/response_paths.js·
  // tuning_codes.js·tuning_report.js는 삭제했다.

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
    // codex = Codex CLI(ChatGPT 구독 인증, API 토큰 과금 아님). OpenAI API(provider: 'openai')는 안 쓴다(2026-10-02).
    provider: 'codex',
    // v2·v3가 쓰던 gpt-6-astra와 같은 코드네임 라인업의 다음 모델(2026-10-02). codex --help로 실제
    // 가능한 식별자인지 확인 전이면 judge_prepare.js 실행 시 바로 확인한다(틀리면 codex CLI가 에러를 냄).
    model: 'gpt-6-sol',
    reasoningEffort: 'medium', // v2·v3(gpt-6-astra)와 같은 reasoning effort
    temperature: null,        // codex provider는 안 씀(추론 모델은 temperature 미지원)
    seed: null,
    apiKeyEnv: 'OPENAI_API_KEY',   // openai provider 전용(지금 provider=codex라 안 씀)
    baseUrl: 'https://api.openai.com/v1', // openai provider 전용(지금 provider=codex라 안 씀)
    cli: 'codex',             // PATH의 codex 실행 파일. LLM_JUDGE_CODEX_BIN 환경변수로 덮어쓸 수 있음
    maxRetries: 4,            // openai provider 전용 — codex는 judge_run.js의 공통 재시도(시도 2회)만 적용
    timeoutMs: 180000,
    // accuracy = 정확도·근거·표현(전 행), safety = safetyItems, persona = 페르소나 지시가 있는 행
    kinds: ['accuracy', 'safety', 'persona'],
    // 반복 항목의 2~10회차도 채점한다(반복 간 정확도 편차를 보기 위해).
    includeRepeats: true,
  },
};
