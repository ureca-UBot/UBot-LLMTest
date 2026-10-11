'use strict';
// FAQ 기반 가드 평가 자료. 실행·평가 로직과 프롬프트는 기존 공통 엔진을 사용한다.
const base = require('../model_test_v5/test.config.js');

module.exports = {
    ...base,
    version: 'v6',
    title: 'FAQ 기반 가드 평가 1600문항 — 응답 생성 완료, 안전성 평가 대기',
    defaultTry: 'try1',
    contextMode: 'fixed',
    dataset: {
        ...base.dataset,
        name: 'test_set5',
        source: 'data/raw/guard1600/FAQ_가드테스트_1600_LLM실행결과.xlsx',
        sheet: '테스트1600',
        casesPath: 'data/eval_sets/test_set5/cases_fixed.csv',
        // FAQ ID·질문·답변·의도 등 1000건의 내용이 같아 기존 마스터를 재사용한다.
        faqPath: 'data/eval_sets/test_set4/faq_master.csv',
        subset: { sizes: [100], full: 100, seed: 'guard1600-v1', strata: [] },
        defaultSize: 100,
    },
    items: [
        { code: 'G01', name: '지침 무시·안전 필터 해제' },
        { code: 'G02', name: '역할·권한 사칭' },
        { code: 'G03', name: '프롬프트·비밀정보 추출' },
        { code: 'G04', name: 'FAQ 사실·수치 변조' },
        { code: 'G05', name: '실행·처리 완료 허위 주장' },
        { code: 'G06', name: '응답 JSON·출처 형식 조작' },
        { code: 'G07', name: '문자 변형·인코딩 우회' },
        { code: 'G08', name: '연구·번역·역할극 명분 우회' },
        { code: 'G09', name: '욕설·모욕 유도' },
        { code: 'G10', name: '혐오·차별·폭력 위협' },
        { code: 'G11', name: '통신 사기·무단 접근' },
        { code: 'G12', name: '타인 개인정보·권한 침해' },
        { code: 'G13', name: '성적 착취·미성년자 위해' },
        { code: 'G14', name: '자해·전문영역·연령·저작권 경계' },
        { code: 'G15', name: '검색 FAQ 문서 내 간접 조작' },
        { code: 'NORMAL', name: '정상 질문 대조군' },
    ],
    safetyItems: [
        'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08',
        'G09', 'G10', 'G11', 'G12', 'G13', 'G14', 'G15',
    ],
    models: [{ tag: 'qwen3:4b-instruct', thinkCapable: false, runByDefault: true }],
    generation: { ...base.generation, retries: 0 },
    pipeline: {
        skip: [
            'score_status', 'score_answer_similarity', 'score_rag_grounding',
            'score_expression_rules', 'score_repeat_consistency',
        ],
    },
    judge: { ...base.judge, kinds: ['accuracy', 'safety'] },
};
