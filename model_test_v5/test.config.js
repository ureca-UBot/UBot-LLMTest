'use strict';
// model_test_v5 테스트 설정 — 공통 엔진(저장소 루트 scripts/)이 읽는 유일한 버전별 파일.
// v4(model_test_v4/test.config.js)를 복사해 바뀌는 값만 고쳤다. 필드 설명은 scripts/README.md 참고.
//
// v4 대비 바뀐 것(2026-10-07):
//   - 생성 환경: v4와 같은 EC2 Tesla T4 · Ollama · 한 건씩 순차 생성. (L4로 하려 했으나 인스턴스 시작 권한이 없어 T4로 바꿈)
//   - 모델: Qwen3-4B-Instruct-2507 Q4_K_M(v4에서 생성한 결과를 가져옴) · Q8_0, Gemma3 4B IT QAT(Q4_0)
//   - 규모: 항목당 200 → 100건(defaultSize). 100 서브셋은 v4 200건에 포함된다(50 ⊂ 100 ⊂ 150 ⊂ 200)
// 평가 기준·항목·데이터셋·프롬프트·Judge는 v4와 같다. 동시성·VRAM·속도는 별도 테스트(vLLM)에서 본다.

module.exports = {
  version: 'v5',
  title: 'test5 — 4B 양자화별 기준선 (T4 · LLM 단독 · Context 고정)',
  defaultTry: 'try1',

  // 컨텍스트 공급 방식. 'fixed' = 데이터셋의 제공 Context를 그대로 넣는다(LLM 단독).
  contextMode: 'fixed',

  // 데이터셋은 v4와 같다(test_set4). subset.seed도 같아야 v4와 같은 100건이 뽑힌다 — 바꾸지 말 것.
  dataset: {
    name: 'test_set4',
    source: 'data/raw/FAQ_RAG_2800건_의도균등FAQ_v4반영본.xlsx',
    sheet: '테스트 3000건',
    faqSheet: 'FAQ 원문',
    casesPath: 'data/eval_sets/test_set4/cases_fixed.csv',
    faqPath: 'data/eval_sets/test_set4/faq_master.csv',
    resultColumns: {
      prefixes: ['LLM ', 'Judge ', 'Persona ', 'Safety '],
      names: [
        '생성 상태', '근거 채택 분류', '근거 채택 (1/0)', '정답 근거 전부 인용 (1/0)', 'Context 밖 인용 ID (JSON)',
        '문서 외 인용 꼬리표 (JSON)', '본문 근거 오류 (1/0)', '출력 status·본문 불일치 (1/0)', '인용·본문 출처 불일치 (1/0)',
        '오답 주원인 (자동)', '상태 엄격 판정 (자동)', '상태 완화 판정 (자동)', '허용 교차 유형 (자동)',
        '생성 시간 (ms)', '실행·평가 메모',
      ],
    },
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
      subsetMin: '포함 최소 규모',
    },
    subset: { sizes: [50, 100, 150, 200], full: 200, seed: 'test_set4-v1', strata: ['difficulty', 'personaSub'] },
    // v5는 항목당 100건(14 × 100 = 1,400건). 프롬프트 튜닝 테스트(prompts_test_v1~v3)와 같은 규모다.
    // RT 100건 = 원본 질문 10개 × 10회 — 반복 일관성은 질문 10개로만 본다(기대 OUT_OF_SCOPE 원본은 이 규모에 없음).
    defaultSize: 100,
  },

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
  repeatItem: 'RT',
  safetyItems: ['AD'],

  evidence: {
    excludeItems: ['AR'],
    expectedStatuses: ['ANSWER', 'PARTIAL', 'CONFLICT'],
  },

  prompt: { variant: 'v4_base' },
  output: { keyOrder: ['evidence_ids', 'status', 'answer'] },

  // 셋 다 추론 모드가 없는 모델이라 thinkCapable=false(think 옵션을 보내지 않음).
  // digest는 2026-10-07 ollama.com 기준 — 서버에서 `ollama list`의 ID가 다르면 다른 가중치이므로 멈추고 확인한다.
  // gemma3:4b-it-q8_0(2376388dec16)은 2026-10-07에 뺐다 — 필요하면 추가한다.
  models: [
    // Qwen3-4B-Instruct-2507 Q4_K_M, 2.5GB (digest 0edcdef34593 = qwen3:4b-instruct-2507-q4_K_M).
    // 다시 생성하지 않는다 — v4 try1에서 같은 T4·같은 조건으로 만든 n200 run을 scripts/run/import_run_subset.js로
    // 100 서브셋만 가져온다(SETUP 4절). 가져온 run의 model_tag가 이 이름이라 v4와 같은 태그를 쓴다.
    { tag: 'qwen3:4b-instruct', thinkCapable: false, runByDefault: false },
    // Qwen3-4B-Instruct-2507 Q8_0, 4.3GB (digest aa7252f68dda). FP8의 정확도 대리 — 8bit 가중치 전용 양자화
    { tag: 'qwen3:4b-instruct-2507-q8_0', thinkCapable: false, runByDefault: true },
    // Gemma 3 4B IT QAT, 4.0GB (digest d01ad0579247). 트랜스포머 블록 전부 Q4_0, 토큰 임베딩(= 출력층 공유)·비전은 F16
    { tag: 'gemma3:4b-it-qat', thinkCapable: false, runByDefault: true },
  ],

  conditions: {
    t0_nothink: { temperature: 0, think: false },
  },
  defaultCondition: 't0_nothink',

  generation: {
    format: 'schema',
    timeoutMs: 60000,
    retries: 2,
  },

  embeddingModel: 'bge-m3:latest',

  pipeline: { skip: [] },

  // Judge는 v4와 같다 — 루브릭 v4-judge-12. 배치 준비 때 매니페스트에 고정된다.
  judge: {
    provider: 'codex',
    model: 'gpt-6-sol',
    reasoningEffort: 'medium',
    temperature: null,
    seed: null,
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    cli: 'codex',
    maxRetries: 4,
    timeoutMs: 180000,
    kinds: ['accuracy', 'safety', 'persona'],
    includeRepeats: true,
  },
};
