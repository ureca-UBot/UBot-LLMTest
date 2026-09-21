'use strict';
// Detailed report from immutable saved responses and judgments. No inference.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { parseCsvObjects, toCsv } = require('./csv');
const { isPrimaryRound } = require('./rounds');
const { expectedStatusEnum } = require('./status_map');
const suitePaths = require('./suite');

module.exports = function writeDetailedReport({ root, out, manifest, models, reviewed }) {
    const read = file => fs.readFileSync(path.join(root, file), 'utf8');
    const json = file => JSON.parse(read(file));
    const lines = file => read(file).trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
    const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    const quantile = (values, p) => {
        if (!values.length) return null;
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
    };
    const number = (value, places = 2) => value == null ? '미측정' : Number(value).toFixed(places);
    const percent = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '해당 없음';
    const ratio = (n, d) => `${n}/${d} (${percent(n, d)})`;
    const sec = ms => ms == null ? '미측정' : (ms / 1000).toFixed(2);
    const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/\r?\n/g, '<br>');
    const statuses = ['ANSWER', 'PARTIAL', 'CLARIFY', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'];
    const cases = parseCsvObjects(read('data/eval_sets/test_set2/cases.csv'));
    const primaryCases = cases.filter(isPrimaryRound);
    const byCase = new Map(cases.map(c => [c.ID, c]));
    const types = [...new Set(primaryCases.map(c => c['유형']))];
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const suite = suitePaths.suiteTag();
    const batchId = suitePaths.judgeBatch();
    const batch = json(`results/reports/${suite}/${batchId}.json`);
    const tableFiles = path.join(out, 'tables');
    fs.mkdirSync(tableFiles, { recursive: true });
    const savedTables = [];
    function csv(name, rows) {
        assert.ok(rows.length);
        const headers = Object.keys(rows[0]);
        const text = '\ufeff' + toCsv(rows, headers) + '\r\n';
        const parsed = parseCsvObjects(text);
        assert.equal(parsed.length, rows.length);
        for (let i = 0; i < rows.length; i++) for (const h of headers) assert.equal(parsed[i][h], String(rows[i][h] ?? ''));
        const file = name + '_V2.csv';
        fs.writeFileSync(path.join(tableFiles, file), text);
        savedTables.push({ file, rows: rows.length });
    }
    const data = models.map(model => {
        const dir = `results/scored/${suite}/` + model.run_id;
        const raw = lines(`results/raw/${suite}/` + model.run_id + '/generation.jsonl');
        const a = lines(dir + '/accuracy_hallucination_llm.jsonl');
        const s = lines(dir + '/safety_llm.jsonl');
        const aMap = new Map(a.map(r => [r.id, r]));
        const sMap = new Map(s.map(r => [r.id, r]));
        const entries = raw.filter(r => isPrimaryRound(byCase.get(r.id))).map(r => ({
            raw: r, a: aMap.get(r.id), s: sMap.get(r.id), c: byCase.get(r.id), id: r.id,
            expected: expectedStatusEnum(byCase.get(r.id)['기대 응답 상태']), predicted: statuses.includes(r.parsed?.status) ? r.parsed.status : 'INVALID',
        }));
        assert.equal(entries.length, 300); assert.ok(entries.every(e => e.a));
        return { ...model, raw, a, s, entries, repeated: lines(dir + '/repeat_consistency.jsonl'),
            rawById: new Map(raw.map(r => [r.id, r])), aMap, sMap };
    });
    function stats(entries) {
        const n = entries.length;
        const lat = entries.map(e => e.raw.timing?.wall_ms).filter(v => Number.isFinite(v));
        const correct = entries.filter(e => e.a.accuracy.verdict === 'CORRECT').length;
        const hallucinated = entries.filter(e => !e.a.hallucination.is_grounded).length;
        return { n, correct, incorrect: entries.filter(e => e.a.accuracy.verdict === 'INCORRECT').length,
            insufficient: entries.filter(e => e.a.accuracy.verdict === 'INSUFFICIENT_EVIDENCE').length,
            correct_rate: n ? correct / n : null, hallucinated, hallucinated_rate: n ? hallucinated / n : null,
            claims: entries.reduce((sum, e) => sum + e.a.hallucination.hallucinated_claims.length, 0),
            grounding: average(entries.map(e => e.a.hallucination.grounding_score)), expression: average(entries.map(e => e.a.expression_quality)),
            expression_low: entries.filter(e => e.a.expression_quality <= 3).length,
            invalid_evidence: entries.filter(e => !e.a.hallucination.evidence_ids_valid).length,
            status_match: entries.filter(e => e.expected === e.predicted).length,
            format_pass: entries.filter(e => e.raw.format_pass).length,
            latency_n: lat.length, latency_avg_ms: average(lat), latency_p50_ms: quantile(lat, 0.5), latency_p95_ms: quantile(lat, 0.95) };
    }
    const typeRows = [], difficultyRows = [], scoreRows = [], crossRows = [], timingRows = [], statusRows = [], safetyRows = [], repeatRows = [], formatRows = [], errorRows = [];
    for (const m of data) {
        for (const type of types) typeRows.push({ model: m.model, type, ...stats(m.entries.filter(e => e.c['유형'] === type)) });
        for (const difficulty of difficulties) difficultyRows.push({ model: m.model, difficulty, ...stats(m.entries.filter(e => e.c['난이도'] === difficulty)) });
        for (const axis of ['grounding', 'expression']) for (let score = 1; score <= 5; score++) scoreRows.push({ model: m.model, axis, score,
            count: m.a.filter(a => (axis === 'grounding' ? a.hallucination.grounding_score : a.expression_quality) === score).length, denominator: 300 });
        for (const accuracy of ['CORRECT', 'INCORRECT', 'INSUFFICIENT_EVIDENCE']) for (const grounded of [true, false]) crossRows.push({ model: m.model, accuracy, grounded,
            count: m.a.filter(a => a.accuracy.verdict === accuracy && a.hallucination.is_grounded === grounded).length });
        const latency = m.entries.map(e => e.raw.timing.wall_ms);
        const tokens = m.entries.map(e => e.raw.timing.eval_count).filter(Number.isFinite);
        const promptTokens = m.entries.map(e => e.raw.timing.prompt_eval_count).filter(Number.isFinite);
        const loads = m.entries.map(e => e.raw.timing.load_duration_ns / 1e6).filter(Number.isFinite);
        const evals = m.entries.map(e => e.raw.timing.eval_duration_ns / 1e6).filter(Number.isFinite);
        const total = m.entries.map(e => e.raw.timing.total_duration_ns / 1e6).filter(Number.isFinite);
        const chars = m.entries.map(e => typeof e.raw.parsed?.answer === 'string' ? [...e.raw.parsed.answer].length : null).filter(Number.isFinite);
        assert.ok(latency.every(Number.isFinite));
        const timing = { model: m.model, n: latency.length, min_ms: Math.min(...latency), average_ms: average(latency), median_ms: quantile(latency, 0.5),
            p90_ms: quantile(latency, 0.9), p95_ms: quantile(latency, 0.95), p99_ms: quantile(latency, 0.99), max_ms: Math.max(...latency),
            within_2s: latency.filter(v => v <= 2000).length, within_5s: latency.filter(v => v <= 5000).length,
            within_10s: latency.filter(v => v <= 10000).length, within_20s: latency.filter(v => v <= 20000).length,
            prompt_tokens_n: promptTokens.length, output_tokens_n: tokens.length, output_chars_n: chars.length,
            load_n: loads.length, eval_n: evals.length, server_total_n: total.length,
            prompt_tokens_avg: average(promptTokens), output_tokens_avg: average(tokens), output_tokens_p95: quantile(tokens, 0.95),
            output_chars_avg: average(chars), load_avg_ms: average(loads), load_p95_ms: quantile(loads, 0.95),
            eval_avg_ms: average(evals), server_total_avg_ms: average(total), tps_avg: m.generation_tps_avg,
            vram_n: m.vram_mib.n, vram_avg_mib: m.vram_mib.avg, vram_min_mib: m.vram_mib.min, vram_max_mib: m.vram_mib.max };
        assert.ok(Math.abs(timing.average_ms - m.generation_latency_ms_avg) < 1e-8); assert.equal(timing.p95_ms, m.generation_latency_ms_p95);
        timingRows.push(timing);
        for (const expected of statuses) for (const predicted of [...statuses, 'INVALID']) statusRows.push({ model: m.model, expected, predicted,
            count: m.entries.filter(e => e.expected === expected && e.predicted === predicted).length });
        for (const s of m.s) safetyRows.push({ model: m.model, id: s.id, question: byCase.get(s.id)['User Question'], verdict: s.verdict,
            resisted_injection: s.resisted_injection, leaked_internal_info: s.leaked_internal_info, fabricated_compliance: s.fabricated_compliance,
            leaked_others_pii: s.leaked_others_pii, answered_legitimate_part: s.answered_legitimate_part, reasoning: s.reasoning });
        for (const r of m.repeated) repeatRows.push({ model: m.model, id: r.original_id, type: byCase.get(r.original_id)['유형'],
            status_consistent: r.status_consistent, numbers_consistent: r.numbers_consistent, evidence_consistent: r.evidence_consistent,
            overall_consistent: r.overall_consistent, avg_paraphrase_similarity: r.avg_paraphrase_similarity,
            per_run: JSON.stringify(r.per_run) });
        for (const r of m.raw.filter(r => !r.format_pass)) formatRows.push({ model: m.model, id: r.id,
            primary: isPrimaryRound(byCase.get(r.id)), reason: r.format_fail_reason || r.error || '이유 미기록',
            raw_response: r.raw_content, accuracy: m.aMap.get(r.id)?.accuracy.verdict ?? '반복 회차: AI 대상 아님' });
        for (const e of m.entries) errorRows.push({ model: m.model, id: e.id, type: e.c['유형'], difficulty: e.c['난이도'],
            accuracy: e.a.accuracy.verdict, missing_required_fact_count: e.a.accuracy.missing_required_facts.length,
            contradicted_fact_count: e.a.accuracy.contradicted_facts.length, status_appropriate: e.a.accuracy.status_appropriate,
            status_content_consistent: e.a.accuracy.status_content_consistent, expected_status: e.expected, predicted_status: e.predicted,
            is_grounded: e.a.hallucination.is_grounded, hallucinated_claim_count: e.a.hallucination.hallucinated_claims.length,
            grounding_score: e.a.hallucination.grounding_score, expression_quality: e.a.expression_quality,
            evidence_ids_valid: e.a.hallucination.evidence_ids_valid, silent_conflict_pick: e.a.hallucination.silent_conflict_pick });
        const grouped = typeRows.filter(r => r.model === m.model);
        assert.equal(grouped.reduce((n, r) => n + r.n, 0), 300);
        assert.equal(grouped.reduce((n, r) => n + r.correct, 0), m.accuracy_counts.CORRECT);
        assert.equal(grouped.reduce((n, r) => n + r.hallucinated, 0), m.hallucinated_cases);
        assert.equal(statusRows.filter(r => r.model === m.model).reduce((n, r) => n + r.count, 0), 300);
        assert.equal(repeatRows.filter(r => r.model === m.model).length, 40);
    }
    const pairRows = [];
    for (let i = 0; i < data.length; i++) for (let j = i + 1; j < data.length; j++) {
        const a = data[i], b = data[j]; const pair = { model_a: a.model, model_b: b.model, both_correct: 0, a_only_correct: 0, b_only_correct: 0, neither_correct: 0 };
        for (const c of primaryCases) { const ac = a.aMap.get(c.ID).accuracy.verdict === 'CORRECT', bc = b.aMap.get(c.ID).accuracy.verdict === 'CORRECT';
            pair[ac ? (bc ? 'both_correct' : 'a_only_correct') : (bc ? 'b_only_correct' : 'neither_correct')]++; }
        assert.equal(pair.both_correct + pair.a_only_correct + pair.b_only_correct + pair.neither_correct, 300); pairRows.push(pair);
    }
    csv('by_type', typeRows); csv('by_difficulty', difficultyRows); csv('score_distribution', scoreRows); csv('accuracy_grounding_cross', crossRows);
    csv('performance_distribution', timingRows); csv('status_confusion', statusRows); csv('safety_all_cases', safetyRows);
    csv('repeat_all_cases', repeatRows); csv('format_failures', formatRows); csv('error_flags_all_cases', errorRows); csv('paired_model_results', pairRows);
    const md = [];
    let tableCount = 0;
    const text = (...values) => md.push(...values, '');
    const h = (level, title, anchor) => { if (anchor) md.push(`<a id="${anchor}"></a>`, ''); md.push('#'.repeat(level) + ' ' + title, ''); };
    const table = (headers, rows) => { tableCount++; md.push('| ' + headers.map(esc).join(' | ') + ' |', '| ' + headers.map(() => '---').join(' | ') + ' |', ...rows.map(row => '| ' + row.map(esc).join(' | ') + ' |'), ''); };
    const modelHeaders = data.map(m => m.model);
    const typeStat = (model, type) => typeRows.find(r => r.model === model && r.type === type);
    const code = value => { const s = String(value); const marks = '`'.repeat(Math.max(3, ...(s.match(/`+/g) || []).map(x => x.length + 1))); text(marks + 'text', s, marks); };
    const toc = [
        ['scope', '1. 평가 범위와 실행 환경'], ['dataset', '2. 데이터 구성과 분모'], ['definitions', '3. 지표 정의와 읽는 방법'],
        ['overall', '4. 전체 정확도·근거·표현 비교'], ['types', '5. 13개 유형별 비교'], ['difficulty', '6. 난이도별 비교'],
        ['grounding', '7. 환각 심각도·근거 ID·경미한 이슈'], ['expression', '8. 표현 품질 분포'], ['status', '9. 상태 코드와 오류 구성'],
        ['absence', '10. FAQ 부재 판단'], ['format', '11. JSON 형식 실패 상세'], ['performance', '12. 응답 시간·토큰·GPU 점유'],
        ['repeat', '13. 반복 평가 40문항'], ['safety', '14. 안전성 15문항'], ['pairs', '15. 모델 간 동일 문항 비교'],
        ['examples', '16. 같은 질문의 실제 답변 비교'], ['profiles', '17. 모델별 세부 성적표'], ['review', '18. 검수 결과와 팀 확인 항목'],
        ['rules', '19. 기존 규칙 평가와 AI 판정 비교'], ['sources', '20. 파일·재집계·검증 기록'],
    ];
    h(1, 'V2 최종 상세 비교 보고서 — 5개 모델 / 고유 300문항');
    text('**저장된 V2 결과의 상세 재집계본이다. 원본 응답과 AI 판정은 변경하지 않았으며, 모델 선정은 팀에서 결정한다.**',
        '전체 평균뿐 아니라 13개 유형, 3개 난이도, 점수 분포, 상태 혼동, 반복 안정성, 안전성의 개별 문항과 실제 답변을 함께 비교한다. 표의 정답·환각 값은 기존 AI 원판정이고, 해석이 엇갈리는 사례는 검수 항목에 따로 표시했다.');
    text('## 목차', '', ...toc.map(([id, title]) => `- [${title}](#${id})`));

    h(2, toc[0][1], 'scope');
    table(['항목', '이번 V2에서 확인된 내용'], [
        ['실행 배치', manifest.batch_id],
        // 날짜는 배치 매니페스트의 started_at에서 뽑는다(예전엔 문자열 상수였다).
        ['평가 날짜', (batch.started_at ? new Date(batch.started_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }) : '미기록') + ' / Asia/Seoul'],
        ['모델 수', String(models.length)],
        ['모델별 원본 응답', '380 = 고유 300 + 반복 추가 80'], ['전체 원본 응답', '1,900'], ['내용 AI 채점', '300 × 5 = 1,500'],
        ['안전성 AI 채점', '고유 문항 중 15 × 5 = 75'], ['의미 표본 검수', '모델별 내용 6 + 안전성 4 = 50개 판정'],
        ['환경', 'Windows 로컬 / ' + batch.gpu], ['Node / Ollama', batch.node + ' / ' + batch.ollama.version],
        ['생성 요청 방식', 'client_concurrency=1, stream=false, format=json'], ['AI Judge', 'gpt-6-astra / reasoning effort=medium'],
        ['이번 상세 보고서 작업', '저장 파일 재집계만 수행. 모델 생성 및 외부 AI 채점 호출 0회'],
    ]);
    table(['모델 태그', '메타데이터 파라미터 크기', '양자화', '생성 시작 KST', '생성+자동평가 종료 KST'], data.map(m => {
        const info = batch.models.find(v => v.name === m.model), r = batch.runs.find(v => v.run_id === m.run_id);
        const kst = iso => new Date(new Date(iso).getTime() + 9 * 3600000).toISOString().slice(11, 19);
        return [m.model, info?.details.parameter_size ?? '미기록', info?.details.quantization_level ?? '미기록', kst(r.started_at), kst(r.finished_at)];
    }));
    text('위 시작·종료 구간에는 생성 외 자동 평가 작업이 섞여 있으므로 순수 추론 시간이나 처리량으로 계산하지 않는다. 모델 태그의 숫자와 Ollama가 보고한 파라미터 수는 다를 수 있어 그대로 병기했다.',
        '생성 코드에는 temperature·seed·num_ctx·think를 명시하는 별도 옵션이 없다. 모델별 기본값이 같다고 가정하거나 추론 모드가 통제된 비교라고 주장하지 않는다. 이 보고서는 저장된 당시 실행 조건에서의 관측 결과다.',
        'FAQ와 API 결과는 테스트 데이터에서 미리 주어진다. 따라서 실제 Vector DB 검색의 정확도나 매장 API 호출 성공률까지 포함한 서비스 전체 평가가 아니라, 제공 자료를 읽고 답하는 생성 모델 평가다.');

    h(2, toc[1][1], 'dataset');
    const typePurpose = {
        '단일 FAQ 답변': '한 FAQ에서 필수 사실을 전달하는 기본 응답', '유사 FAQ 구분·노이즈': '여러 원문 가운데 질문에 맞는 근거 선택',
        '다중 FAQ 조합': '둘 이상의 FAQ에 흩어진 필수 사실 결합', '사용자 정보+FAQ': '조회·사용량 정보와 요금 정책을 연결해 개인 조건 계산',
        '조건·예외·경계값': '이상·이하·미만 조건과 체납 등 예외 적용', '부분 정보': '답할 수 있는 부분과 확인 불가한 부분 구분',
        '유사하지만 답 없음': '관련 있어 보이는 FAQ에 요청 사실이 없는 경우의 보류', '무관 FAQ': '질문과 무관한 근거만 주어진 경우의 대응',
        '빈 컨텍스트': '자료가 없는 상태에서 정보 생성 억제', 'FAQ 충돌·시행일': '자료 충돌·버전·시행일·대상 조건 비교',
        '멀티턴 대화': '이전 발화·사용자 정정·대상 지칭 반영', '적대적 입력·범위 밖': '공격 지시 거부·정상 부분 응답·범위 안내',
        'API 결과 답변': '이미 조회된 매장 결과의 설명·시점·지원 범위 구분',
    };
    table(['유형', '코드', '고유 n', '전체 중 비중', '주요 확인 항목'], types.map(type => {
        const group = primaryCases.filter(c => c['유형'] === type), c = group[0];
        return [type, c.ID.split('-')[0], group.length, percent(group.length, 300), typePurpose[type]];
    }));
    table(['난이도', '고유 n', '비중', '반복 대상 질문 수'], difficulties.map(d => [d, primaryCases.filter(c => c['난이도'] === d).length,
        percent(primaryCases.filter(c => c['난이도'] === d).length, 300), primaryCases.filter(c => c['난이도'] === d && c['반복 평가 대상'] === 'Y').length]));
    table(['기대 상태', '고유 문항 수', '뜻'], statuses.map((s, i) => [s, primaryCases.filter(c => expectedStatusEnum(c['기대 응답 상태']) === s).length,
        ['답할 수 있는 질문에 답변', '확인 가능한 부분만 답변', '필요한 조건을 추가 질문', '근거가 없어 답변 보류', '해결되지 않는 자료 충돌 고지', '통신 상담 범위 밖임을 안내'][i]]));
    table(['집계 대상', '모델별 분모', '중복 처리'], [['정확도·환각·표현·형식·일반 성능', '300', '각 고유 질문의 1회차만 사용'],
        ['안전성', '15', '적대적 입력·범위 밖 유형의 1회차'], ['반복 일관성', '40개 질문', '각 질문의 1·2·3회차 120응답을 비교'],
        ['CSV 원자료', '380행', '반복 2·3회차도 보존하되 AI 점수를 복제하지 않음'], ['의미 표본 검수', '10개 판정', '의도적으로 경계 사례를 골랐으며 무작위 표본 아님']] );
    text('API 결과 답변 유형은 5문항으로 한 문항 차이가 20%p다. 유형별 비율은 반드시 분자·분모와 함께 읽는다. 전체 정답률은 유형 크기에 비례하는 300문항 평균이며, 유형별 비율을 단순 평균한 값과 다르다.');

    h(2, toc[2][1], 'definitions');
    table(['지표', '계산/판정', '좋은 방향·주의점'], [
        ['AI 정답 판정률', 'CORRECT / 300', '높을수록 좋음. 상태 적절성도 평가에 포함되며 사람 확정 정답률은 아님'],
        ['환각 답변 비율', 'grounding_score ≤ 3인 답변 수 / 300', '낮을수록 좋음. 일반 사실의 참·거짓보다 제공 자료에 근거했는지 평가'],
        ['환각 항목 수', 'hallucinated_claims 배열 길이의 합', '한 답변에 여러 항목이 있을 수 있음'], ['근거 점수', '1~5점 평균', '4점은 minor_issues 기록, 환각 집계에서는 제외'],
        ['표현 품질', '한국어 상담 문체 1~5점', '내용 정확도와 독립. 오답도 자연스러우면 높은 점수 가능'],
        ['근거 ID 오류', 'evidence_ids_valid=false인 답변 수', '본문이 맞아도 인용 ID가 잘못될 수 있음'],
        ['상태 완전 일치', '예측 status와 데이터셋 기대 status 일치 / 300', 'Judge가 판단한 합리적 대체 상태 허용 여부와 다른 지표'],
        ['FAQ 부재 P/R/F1', '기대·예측 ABSTAIN 이진 분류', 'CLARIFY·PARTIAL로 보류 의미를 표현해도 ABSTAIN 예측으로 세지 않음'],
        ['JSON 형식 성공', '기존 스키마 검사 통과 / 300', '내용의 정답이나 근거 ID 존재까지 보증하지 않음'],
        ['평균·P50·P95 응답', '기존 wall_ms의 평균·분위수', '낮을수록 빠름. TTFT와 다름'],
        ['TPS', 'eval_count / eval_duration', '토큰 생성률. 출력 토큰 수가 다르면 완료 시간 순위와 달라짐'],
        ['GPU 점유', '응답 후 장치 VRAM 샘플', '모델 단독 필요 메모리나 동시 처리 한도가 아님'],
        ['반복 상태+숫자 일치', '3회 모두 상태·추출 숫자가 같은 질문 / 40', '정답률·전체 의미 일치와 별개'],
        ['표본 검수', '질문·근거·답변·Judge 이유의 대조', 'AI 재검토이며 원점수 보정이나 사람 확정 판정은 아님'],
    ]);

    h(2, toc[3][1], 'overall');
    table(['모델', 'CORRECT', 'INCORRECT', '근거 부족 판정', '정답 판정률', '정답+근거충실'], data.map(m => [m.model,
        m.accuracy_counts.CORRECT, m.accuracy_counts.INCORRECT, m.accuracy_counts.INSUFFICIENT_EVIDENCE,
        percent(m.accuracy_counts.CORRECT, 300), ratio(m.a.filter(r => r.accuracy.verdict === 'CORRECT' && r.hallucination.is_grounded).length, 300)]));
    table(['모델', '환각 답변', '환각 항목 수', '근거 평균 / 5', '표현 평균 / 5', '표현 3점 이하'], data.map(m => [m.model,
        ratio(m.hallucinated_cases, 300), m.hallucinated_claims, number(m.grounding_score_avg), number(m.expression_quality_avg), ratio(m.a.filter(r => r.expression_quality <= 3).length, 300)]));
    h(3, '4-1. 정확도와 근거 충실성의 교차 분포');
    table(['모델', '정답·근거충실', '정답·환각 있음', '오답·근거충실', '오답·환각 있음', '판정 근거 부족'], data.map(m => {
        const count = (v, g) => m.a.filter(r => r.accuracy.verdict === v && r.hallucination.is_grounded === g).length;
        return [m.model, count('CORRECT', true), count('CORRECT', false), count('INCORRECT', true), count('INCORRECT', false), m.accuracy_counts.INSUFFICIENT_EVIDENCE];
    }));
    text('예를 들어 핵심 조건과 결론은 맞지만 추가 절차를 지어내면 정답·환각 동시 판정이 가능하다. 반대로 근거 있는 문장만 썼더라도 필요한 사실을 누락하거나 상태가 부적절하면 오답·근거충실로 나타난다.');

    h(2, toc[4][1], 'types');
    h(3, '5-1. 유형별 정답 수 / 문항 수 (정답 판정률)');
    table(['유형', ...modelHeaders], types.map(t => [t, ...data.map(m => { const r = typeStat(m.model, t); return ratio(r.correct, r.n); })]));
    h(3, '5-2. 유형별 환각 답변 수 / 문항 수 (환각 비율)');
    table(['유형', ...modelHeaders], types.map(t => [t, ...data.map(m => { const r = typeStat(m.model, t); return ratio(r.hallucinated, r.n); })]));
    h(3, '5-3. 유형별 한국어 표현 평균 / 5');
    table(['유형', '유형 n', ...modelHeaders], types.map(t => [t, typeStat(data[0].model, t).n, ...data.map(m => number(typeStat(m.model, t).expression))]));
    h(3, '5-4. 유형별 평균 응답 시간 / 초');
    table(['유형', '유형 n', ...modelHeaders], types.map(t => [t, typeStat(data[0].model, t).n, ...data.map(m => sec(typeStat(m.model, t).latency_avg_ms))]));
    text('이 유형 표는 같은 문항 묶음 안에서 모델을 비교한 결과다. 유형 자체의 문항 길이·난도·출력 길이가 다르므로 유형 사이의 속도 차이를 모델 실행 능력만의 차이로 해석하지 않는다.');

    h(2, toc[5][1], 'difficulty');
    for (const d of difficulties) {
        h(3, `6-${difficulties.indexOf(d) + 1}. ${d} (${primaryCases.filter(c => c['난이도'] === d).length}문항)`);
        table(['모델', '정답', '환각 답변', '근거 평균', '표현 평균', '평균 응답 초', 'P95 초'], difficultyRows.filter(r => r.difficulty === d).map(r => [
            r.model, ratio(r.correct, r.n), ratio(r.hallucinated, r.n), number(r.grounding), number(r.expression), sec(r.latency_avg_ms), sec(r.latency_p95_ms)]));
    }
    text('난이도는 평가 데이터에 이미 부여된 라벨이다. 이번 보고서에서 결과를 보고 난이도를 다시 정하거나 문항을 이동하지 않았다.');

    h(2, toc[6][1], 'grounding');
    table(['모델', '5점', '4점·경미', '3점', '2점', '1점', '환각 답변 합계'], data.map(m => [m.model,
        ...[5, 4, 3, 2, 1].map(score => m.a.filter(r => r.hallucination.grounding_score === score).length), m.hallucinated_cases]));
    table(['모델', '환각 항목 / 환각 답변', '환각 답변당 항목 평균', '근거 ID 오류', '충돌 조용히 선택'], data.map(m => [m.model,
        `${m.hallucinated_claims}/${m.hallucinated_cases}`, number(m.hallucinated_cases ? m.hallucinated_claims / m.hallucinated_cases : null),
        ratio(m.invalid_evidence_id_cases, 300), m.a.filter(r => r.hallucination.silent_conflict_pick).length]));
    h(3, '7-1. 경미한 이슈 4점 사례 전체');
    const minor = data.flatMap(m => m.a.filter(r => r.hallucination.grounding_score === 4).map(r => [m.model, r.id, r.accuracy.verdict,
        r.hallucination.minor_issues.map(x => x.claim + ' → ' + x.reason).join('\n')]));
    table(['모델', 'ID', '정확도', 'minor_issues 원문'], minor);
    text('위 사례는 모두 is_grounded=true이며 hallucinated_claims는 빈 배열이다. 4점의 사유를 보존하지만 환각 답변 수에 더하지 않았다. 신분증 지참/제출 등 3·4점의 경계는 검수 메모의 팀 확인 항목을 함께 읽는다.');

    h(2, toc[7][1], 'expression');
    table(['모델', '5점', '4점', '3점', '2점', '1점', '평균'], data.map(m => [m.model,
        ...[5, 4, 3, 2, 1].map(score => m.a.filter(r => r.expression_quality === score).length), number(m.expression_quality_avg)]));
    table(['모델', '정답의 표현 평균 (n)', '오답의 표현 평균 (n)', '표현 1~3점 비율'], data.map(m => {
        const c = m.a.filter(r => r.accuracy.verdict === 'CORRECT'), w = m.a.filter(r => r.accuracy.verdict === 'INCORRECT');
        return [m.model, `${number(average(c.map(r => r.expression_quality)))} (${c.length})`, `${number(average(w.map(r => r.expression_quality)))} (${w.length})`, ratio(m.a.filter(r => r.expression_quality <= 3).length, 300)];
    }));
    text('표현 점수의 높고 낮음은 정확도와 별개다. 아래 사례는 각 모델에서 표현 점수가 가장 낮은 문항 중 ID 순 첫 번째를 선택했으며, 전체의 대표성을 주장하는 무작위 표본은 아니다.');
    table(['모델', 'ID', '표현 점수', '답변 발췌', '기존 Judge 이유'], data.map(m => {
        const r = [...m.a].sort((a, b) => a.expression_quality - b.expression_quality || a.id.localeCompare(b.id))[0];
        const answer = String(m.rawById.get(r.id).parsed?.answer ?? m.rawById.get(r.id).raw_content);
        return [m.model, r.id, r.expression_quality, answer.length > 240 ? answer.slice(0, 240) + '… (전체는 모델 상세)' : answer, r.reasoning];
    }));

    h(2, toc[8][1], 'status');
    table(['모델', '기대 상태 완전 일치', 'Judge 상태 부적절', 'Judge 상태·본문 불일치', '상태 문제인데 정답', '상태 문제로만 오답'], data.map(m => [m.model,
        ratio(m.entries.filter(e => e.expected === e.predicted).length, 300), m.a.filter(r => !r.accuracy.status_appropriate).length,
        m.a.filter(r => !r.accuracy.status_content_consistent).length, m.correct_with_status_issue, m.incorrect_status_only]));
    table(['모델', '필수 사실 누락 있음', '핵심 모순 기록 있음', '상태 부적절 있음', '상태·본문 불일치 있음'], data.map(m => [m.model,
        m.a.filter(r => r.accuracy.missing_required_facts.length).length, m.a.filter(r => r.accuracy.contradicted_facts.length).length,
        m.a.filter(r => !r.accuracy.status_appropriate).length, m.a.filter(r => !r.accuracy.status_content_consistent).length]));
    text('오류 구성 열은 서로 겹칠 수 있어 합산하면 안 된다. 누락·모순 목록이 비었다고 새로 정답으로 보정하지 않았고, 상태 문제가 기록된 CORRECT도 원판정을 유지했다.');
    for (const m of data) {
        h(3, `9-${data.indexOf(m) + 1}. ${m.model} 상태 혼동표`);
        table(['기대 상태 ↓ / 예측 →', ...statuses, 'INVALID'], statuses.map(expected => [expected,
            ...[...statuses, 'INVALID'].map(predicted => statusRows.find(r => r.model === m.model && r.expected === expected && r.predicted === predicted).count)]));
    }
    text('각 혼동표의 합계는 300이다. INVALID는 상태 필드가 없거나 허용된 enum이 아닌 경우다. 이 표의 완전 일치율은 Judge가 대체 상태를 합리적이라고 인정했는지와 무관하다.');

    h(2, toc[9][1], 'absence');
    table(['모델', 'TP', 'FP', 'FN', 'TN', '집계 n', '미기록'], data.map(m => [m.model, m.absence_confusion.tp, m.absence_confusion.fp,
        m.absence_confusion.fn, m.absence_confusion.tn, m.absence_eligible, 300 - m.absence_eligible]));
    table(['모델', 'Precision', 'Recall', 'F1', '기대 ABSTAIN 중 실제 ABSTAIN', '기대 ABSTAIN 중 PARTIAL / CLARIFY'], data.map(m => {
        const expected = m.entries.filter(e => e.expected === 'ABSTAIN');
        return [m.model, number(m.absence_precision, 3), number(m.absence_recall, 3), number(m.absence_f1, 3),
            ratio(expected.filter(e => e.predicted === 'ABSTAIN').length, expected.length), `${expected.filter(e => e.predicted === 'PARTIAL').length} / ${expected.filter(e => e.predicted === 'CLARIFY').length}`];
    }));
    text('TP=보류해야 할 때 ABSTAIN, FP=다른 상태가 기대되는데 ABSTAIN, FN=보류해야 하는데 다른 상태, TN=기대·예측 모두 ABSTAIN 아님이다. 기존 스크립트는 파싱된 상태가 없는 문항을 혼동행렬에서 제외하므로 미기록 수를 표시했다. 낮은 Recall이 전부 사실 날조를 의미하지는 않으며 PARTIAL·CLARIFY 사용도 영향을 준다.');

    h(2, toc[10][1], 'format');
    table(['모델', '고유 300 성공', '고유 300 실패', '전체 380 성공', '전체 380 실패', '요청 자체 오류'], data.map(m => [m.model,
        ratio(m.entries.filter(e => e.raw.format_pass).length, 300), m.entries.filter(e => !e.raw.format_pass).length,
        ratio(m.raw.filter(r => r.format_pass).length, 380), m.raw.filter(r => !r.format_pass).length, m.raw.filter(r => r.error).length]));
    table(['모델', 'ID', '평가 회차', '형식 실패 이유', 'AI 정확도'], formatRows.map(r => [r.model, r.id, r.primary ? '고유 1회차' : '반복 2·3회차', r.reason, r.accuracy]));
    text('검사는 JSON 객체, 필수 키, status enum, 비어 있지 않은 answer 문자열, 문자열 배열 evidence_ids를 확인한다. 존재하지 않는 문자열 ID도 배열 형식 자체는 통과할 수 있으므로 근거 ID 유효성과 구분한다. 파싱 실패 답변도 AI 내용 평가 300문항에는 포함되어 있다.');

    h(2, toc[11][1], 'performance');
    h(3, '12-1. 응답 시간 분포 / 초');
    table(['모델', '최소', '평균', 'P50', 'P90', 'P95', 'P99', '최대'], timingRows.map(r => [r.model, sec(r.min_ms), sec(r.average_ms), sec(r.median_ms), sec(r.p90_ms), sec(r.p95_ms), sec(r.p99_ms), sec(r.max_ms)]));
    h(3, '12-2. 지정 시간 이내 완료된 문항 수 — 누적 구간');
    table(['모델', '2초 이내', '5초 이내', '10초 이내', '20초 이내'], timingRows.map(r => [r.model, ratio(r.within_2s, 300), ratio(r.within_5s, 300), ratio(r.within_10s, 300), ratio(r.within_20s, 300)]));
    h(3, '12-3. 입력·출력 크기와 생성 시간');
    table(['모델', '입력 토큰 평균 (n)', '생성 토큰 평균 (n)', '생성 토큰 P95', 'answer 문자 평균 (n)', '평균 TPS'], timingRows.map(r => [r.model,
        `${number(r.prompt_tokens_avg, 1)} (${r.prompt_tokens_n})`, `${number(r.output_tokens_avg, 1)} (${r.output_tokens_n})`, r.output_tokens_p95,
        `${number(r.output_chars_avg, 1)} (${r.output_chars_n})`, number(r.tps_avg, 1)]));
    table(['모델', '로드 평균 ms (n)', '로드 P95 ms', '토큰 생성 평균 초 (n)', '서버 총 시간 평균 초 (n)', '클라이언트 기록 평균 초'], timingRows.map(r => [r.model,
        `${number(r.load_avg_ms, 2)} (${r.load_n})`, number(r.load_p95_ms, 3), `${sec(r.eval_avg_ms)} (${r.eval_n})`, `${sec(r.server_total_avg_ms)} (${r.server_total_n})`, sec(r.average_ms)]));
    h(3, '12-4. 응답 후 GPU 점유 샘플');
    table(['모델', '측정 n', '최소 MiB', '평균 MiB', '최대 MiB'], timingRows.map(r => [r.model, r.vram_n, r.vram_min_mib, number(r.vram_avg_mib, 1), r.vram_max_mib]));
    text('분위수는 기존 P95 구현과 같은 방식으로 정렬 후 0부터 시작하는 floor(n×p) 위치를 사용한다. P50은 이 방식의 분위수로 계산했으며 짝수 개의 가운데 두 값 평균과 다를 수 있다. 2·5·10·20초 표는 누적 구간으로 서로 합산하지 않는다.',
        'wall_ms는 기존 클라이언트에서 fetch 반환 시점까지 측정한 값이며, 뒤의 res.json() 파싱 시간은 포함하지 않는다. 서버 total_duration과 같다고 보장하지 않으며 TTFT도 아니다. 로드 시간과 토큰 생성 시간은 별도로 기록된 API 필드에서 가져왔다. prompt_eval_duration은 원본에 저장되지 않아 분리 계산하지 않았다.',
        'EXAONE MC-0056에는 wall_ms는 있지만 토큰·서버 시간 필드가 없다. 해당 평균은 299건 기준이며 누락을 0으로 채우지 않았다. answer 문자 수는 파싱된 문자열만 집계하고 n을 표시했다.',
        '생성 토큰은 Ollama eval_count이며 사용자에게 보이는 글자 수와 같지 않다. 토크나이저·내부 추론 여부가 다른 모델의 토큰 수/TPS를 동일한 문장 생산량으로 해석하지 않는다. 장치 점유 VRAM은 모델 단독 메모리로 확정하지 않는다.');

    h(2, toc[12][1], 'repeat');
    table(['모델', '상태 일치 / 40', '숫자 일치 / 40', '근거 ID 일치 / 40', '상태+숫자 / 40'], data.map(m => [m.model,
        ratio(m.repeated.filter(r => r.status_consistent).length, 40), ratio(m.repeated.filter(r => r.numbers_consistent).length, 40),
        ratio(m.repeated.filter(r => r.evidence_consistent).length, 40), ratio(m.repeated.filter(r => r.overall_consistent).length, 40)]));
    text('아래 셀의 순서는 상태/숫자/근거 ID이며 ✓=3회 일치, ✕=불일치다. 상태+숫자 지표에는 근거 ID 일치가 포함되지 않는다. 숫자 목록을 비교하는 규칙이므로 표현 변화나 추가 설명도 영향을 줄 수 있고, 세 번 동일한 오답도 일관성은 높을 수 있다.');
    const repeatIds = data[0].repeated.map(r => r.original_id);
    table(['ID', '유형', ...modelHeaders], repeatIds.map(id => [id, byCase.get(id)['유형'], ...data.map(m => {
        const r = m.repeated.find(v => v.original_id === id); assert.ok(r);
        return [r.status_consistent, r.numbers_consistent, r.evidence_consistent].map(v => v ? '✓' : '✕').join('/');
    })]));
    h(3, '13-1. 반복 불일치의 실제 상태·숫자 예시');
    table(['모델', 'ID', '1회 상태 / 숫자', '2회 상태 / 숫자', '3회 상태 / 숫자'], data.map(m => {
        const r = [...m.repeated].filter(v => !v.overall_consistent).sort((a, b) => a.original_id.localeCompare(b.original_id))[0];
        return [m.model, r.original_id, ...r.per_run.map(v => `${v.status} / ${JSON.stringify(v.numbers)}`)];
    }));

    h(2, toc[13][1], 'safety');
    table(['모델', 'SAFE', 'UNSAFE', 'OVER_REFUSAL', 'NOT_APPLICABLE', '합계'], data.map(m => [m.model, m.safety_counts.SAFE, m.safety_counts.UNSAFE,
        m.safety_counts.OVER_REFUSAL, m.safety_counts.NOT_APPLICABLE, m.safety_scored]));
    const safetyIds = primaryCases.filter(c => c['유형'] === '적대적 입력·범위 밖').map(c => c.ID);
    const safetyLabels = { SAFE: '안전', UNSAFE: '위반', OVER_REFUSAL: '과잉 거절', NOT_APPLICABLE: '대상 아님' };
    table(['ID', '공격·범위 밖 입력 요지', ...modelHeaders], safetyIds.map(id => [id, byCase.get(id)['User Question'], ...data.map(m => safetyLabels[m.sMap.get(id).verdict])]));
    table(['모델', '내부 정보 유출', '가짜 수행·혜택 순응', '타인 개인정보 유출', 'injection 저항 true/false/null', '정상 부분 답변 true/false/null'], data.map(m => {
        const counts = field => [true, false, null].map(value => m.s.filter(r => r[field] === value).length).join('/');
        return [m.model, m.s.filter(r => r.leaked_internal_info).length, m.s.filter(r => r.fabricated_compliance).length,
            m.s.filter(r => r.leaked_others_pii).length, counts('resisted_injection'), counts('answered_legitimate_part')];
    }));
    text('안전성 세부 플래그는 기존 Judge 출력 그대로이며 최종 verdict와 별도로 보존했다. null은 해당 판단을 적용하지 않았다는 값으로 0점·실패가 아니다. 단순 범위 밖 요청 및 실행 금지된 공격 인용에서 SAFE와 NOT_APPLICABLE이 갈리므로 공통 분모를 정하기 전 SAFE 비율로 순위를 매기지 않는다.');
    h(3, '14-1. UNSAFE로 판정된 사례 전체');
    table(['모델', 'ID', '기존 Judge 판정 이유'], safetyRows.filter(r => r.verdict === 'UNSAFE').map(r => [r.model, r.id, r.reasoning]));

    h(2, toc[14][1], 'pairs');
    table(['모델 A', '모델 B', '둘 다 정답', 'A만 정답', 'B만 정답', '둘 다 정답 아님'], pairRows.map(r => [r.model_a, r.model_b, r.both_correct, r.a_only_correct, r.b_only_correct, r.neither_correct]));
    const agreement = Array.from({ length: 6 }, (_, n) => ({ correct_models: n, questions: primaryCases.filter(c => data.filter(m => m.aMap.get(c.ID).accuracy.verdict === 'CORRECT').length === n).length }));
    table(['동일 질문을 맞힌 모델 수', '해당 질문 수', '300문항 중 비중'], agreement.map(r => [r.correct_models, r.questions, percent(r.questions, 300)]));
    text('동일 문항의 저장된 정답 판정을 짝지은 비교다. 어떤 모델이 정답을 낼지 미리 알 수 있다는 뜻은 아니며, 이 표를 모델 라우팅의 실측 성능이나 개선 보장치로 해석하지 않는다.');

    h(2, toc[15][1], 'examples');
    text('정답·근거·상태·공격 대응의 차이를 보여주는 8개 문항을 선택했다. 질문과 필수 사실을 먼저 읽고 다섯 모델의 답변 및 판정 이유를 비교할 수 있다. 무작위 표본이나 추가 채점은 아니다.');
    const examples = ['AR-0003', 'AR-0019', 'AR-0020', 'CE-0026', 'SR-0068', 'AD-0021', 'AD-0049', 'AD-0064'];
    for (const id of examples) {
        const c = byCase.get(id); h(3, `16-${examples.indexOf(id) + 1}. ${id} — ${c['유형']}`);
        table(['항목', '내용'], [['질문', c['User Question']], ['필수 사실', c['필수 포함 사실']], ['기대 상태 / 난이도', c['기대 응답 상태'] + ' / ' + c['난이도']]]);
        text('<details><summary>제공 FAQ·대화 이력·API 결과 원문</summary>', '');
        code('[제공 Context]\n' + c['제공 Context'] + '\n\n[대화 이력]\n' + c['대화 이력'] + '\n\n[사용자 정보 / API 결과]\n' + c['사용자 정보 / API 결과']);
        text('</details>');
        table(['모델', '실제 status', '실제 답변', '정확도 / 근거 / 표현', '안전성'], data.map(m => {
            const r = m.rawById.get(id), a = m.aMap.get(id), s = m.sMap.get(id);
            return [m.model, r.parsed?.status ?? '파싱 불가', r.parsed?.answer ?? r.raw_content,
                `${a.accuracy.verdict} / ${a.hallucination.grounding_score} / ${a.expression_quality}`, s?.verdict ?? '해당 유형 아님'];
        }));
        table(['모델', '기존 내용 Judge 이유', '표본 검수 메모'], data.map(m => {
            const notes = ['accuracy', 'safety'].map(kind => reviewed.get(m.run_id + '/' + kind + '/' + id)).filter(Boolean);
            return [m.model, m.aMap.get(id).reasoning, notes.length ? notes.map(n => n.kind + ': ' + n.review_status + ' — ' + n.review_note).join('\n') : '이 문항·모델은 50건 의미 표본 검수 대상에 포함되지 않음'];
        }));
    }

    h(2, toc[16][1], 'profiles');
    for (const m of data) {
        h(3, `17-${data.indexOf(m) + 1}. ${m.model}`);
        const tr = typeRows.filter(r => r.model === m.model), t = timingRows.find(r => r.model === m.model);
        const highest = [...tr].sort((a, b) => b.correct_rate - a.correct_rate || b.n - a.n)[0];
        const lowest = [...tr].sort((a, b) => a.correct_rate - b.correct_rate || b.n - a.n)[0];
        text(`전체 정답 ${ratio(m.accuracy_counts.CORRECT, 300)}, 환각 ${ratio(m.hallucinated_cases, 300)}, 평균 응답 ${sec(t.average_ms)}초 / P95 ${sec(t.p95_ms)}초다. 이 모델 내 정답 판정률이 가장 높은 유형은 ${highest.type} ${ratio(highest.correct, highest.n)}, 가장 낮은 유형은 ${lowest.type} ${ratio(lowest.correct, lowest.n)}이다. 동률이면 문항 수가 큰 유형을 먼저 표시했다.`);
        table(['유형', 'n', '정답', '환각', '근거 / 5', '표현 / 5', '평균 / P95 초'], tr.map(r => [r.type, r.n,
            `${r.correct} (${percent(r.correct, r.n)})`, `${r.hallucinated} (${percent(r.hallucinated, r.n)})`, number(r.grounding), number(r.expression), `${sec(r.latency_avg_ms)} / ${sec(r.latency_p95_ms)}`]));
        text(`[${m.model} 고유 300문항 전체 판정](llm_judge/${m.report}) · [380응답 통합 CSV](../../scored/${suite}/${m.run_id}/review_V2.csv)`);
    }

    h(2, toc[17][1], 'review');
    const reviewValues = [...reviewed.values()];
    table(['모델', '타당', '팀 확인 필요', '판정 불일치 의심', '표본 합계'], data.map(m => [m.model,
        ...['타당', '팀 확인 필요', '판정 불일치 의심'].map(status => reviewValues.filter(r => r.model === m.model && r.review_status === status).length), 10]));
    table(['분류', '검수에서 확인한 문제', '비교표에 반영한 방법'], [
        ['상태 코드 반영', '상태가 부적절하다고 기록하면서 CORRECT인 사례와 상태만으로 INCORRECT인 사례가 함께 존재', '원점수 보존, 상태·내용 진단 필드를 별도 집계'],
        ['안전성 적용 여부', '동일 AD-0019·AD-0043 입력을 SAFE/NOT_APPLICABLE로 다르게 처리', '문항별 원판정 공개, SAFE 비율 순위화 보류'],
        ['공격 순응 경계', 'AD-0049에서 악성 무료 지시를 충돌 자료로 인용한 답변의 SAFE/UNSAFE 기준 차이', '실제 답변과 세 모델의 판정 이유 나란히 제공'],
        ['경미한 이슈 경계', '신분증 지참→제출 등 가까운 표현 차이에 근거 3점/4점 부여', 'minor_issues 원문과 표본 메모 공개'],
    ]);
    h(3, '18-1. 팀 확인 대상으로 남긴 19개 판정');
    table(['모델', '축', 'ID', '검수 구분', '확인할 내용'], reviewValues.filter(r => r.review_status !== '타당').map(r => [r.model, r.kind, r.id, r.review_status, r.review_note]));
    text('50개 판정은 경계 사례를 골라 본 목적 표본이다. 19/50을 전체 오채점 비율로 추정하지 않으며, 팀 확인 필요를 곧바로 오채점 확정으로 취급하지 않는다. 자동 필드 점검 후보 250건과 의미를 직접 대조한 50건도 구분한다.',
        '[표본 50건의 전체 검수 기록](review_notes_V2.md) · [검토 후보 250건](review_candidates_V2.csv)');

    h(2, toc[18][1], 'rules');
    table(['모델', '규칙 정확도 n', 'BGE 유사도 통과', '키워드 평균', '규칙 정확도 통과', 'AI 정답 / 300'], data.map(m => [m.model, m.rule_accuracy_n,
        percent(m.bge_similarity_pass_rate, 1), percent(m.keyword_coverage_avg, 1), percent(m.rule_accuracy_pass_rate, 1), ratio(m.accuracy_counts.CORRECT, 300)]));
    table(['모델', 'NLI+규칙 faithful', '집계/상태제외/미기록', '규칙 표현 / 100 (n)', 'AI 표현 / 5'], data.map(m => [m.model,
        percent(m.nli_rule_faithful_rate, 1), `${m.nli_rule_eligible}/${m.nli_rule_skipped}/${m.nli_rule_missing}`,
        `${number(m.rule_expression_avg)} (${m.rule_expression_n})`, number(m.expression_quality_avg)]));
    text('기존 NLI 입력 범위와 키워드의 표기 민감도 때문에 규칙 지표와 의미 채점 값이 다를 수 있다. 점수의 척도와 집계 대상이 다르므로 두 점수를 섞은 임의 총점은 계산하지 않았다. 규칙 점수가 없는 문항도 AI 내용 평가에는 포함되어 있다.');

    h(2, toc[19][1], 'sources');
    table(['파일', '포함 내용'], [['comparison_V2.csv', '모델 단위 핵심 비교 지표'], ['review_all_models_V2.csv', '1,900응답: 질문·근거·기존 자동점수·AI판정·표본 메모'],
        ['llm_judge/judgments_V2.csv', '고유 1,500답변의 AI 내용 판정과 해당 안전성 판정'], ['review_notes_V2.md / .csv', '의미 표본 50건의 재검토 기록'],
        ['evaluation_metrics_V2.json', '기존 통합 집계 지표'], ['detailed_metrics_V2.json', '이번 세부 분포·행렬·짝비교 집계'],
        ['tables/*_V2.csv', '각 상세 표의 재사용 가능한 데이터'], ['validation_V2.json / detailed_validation_V2.json', '원본·스키마·집계·CSV 검증 결과']] );
    text(...savedTables.map(r => `- [${r.file}](tables/${r.file}) — ${r.rows}행`));
    text('재집계 명령은 아래와 같다. 이미 저장된 결과만 읽어 표와 CSV를 만든다.', '```powershell', 'node scripts/test2/build_results_V2.js', '```',
        `[V2 파일 안내](README.md) · [AI 원본 결과 안내](llm_judge/README.md) · [실행 당시 배치 기록](../../reports/${suite}/${batchId}.json)`,
        '이번 상세 보고서에서 모델 또는 외부 Judge를 다시 실행하지 않았으며, 기존 1,500건의 정확도·환각·표현 판정과 75건의 안전성 판정을 보존했다. 세부 수치는 원본 응답과 대응하는 판정 ID로 결합한 뒤 집계했다. 사람 최종 검수와 모델 선정은 완료했다고 표시하지 않았다.');
    const output = md.join('\n');
    fs.writeFileSync(path.join(out, 'summary_results_V2.md'), output);
    fs.writeFileSync(path.join(out, 'detailed_metrics_V2.json'), JSON.stringify({ version: 'V2', original_scores_changed: false,
        types: typeRows, difficulties: difficultyRows, scores: scoreRows, accuracy_grounding: crossRows, performance: timingRows,
        status_confusion: statusRows, safety: safetyRows, repeat: repeatRows, paired_models: pairRows, correct_model_distribution: agreement }, null, 2) + '\n');
    fs.writeFileSync(path.join(out, 'detailed_validation_V2.json'), JSON.stringify({ report_sections: toc.length, report_tables: tableCount,
        report_lines: output.split('\n').length, detailed_csv_files: savedTables, primary_answers: 1500, safety_judgments: 75,
        repeated_question_model_pairs: 200, type_totals_reconciled: true, accuracy_and_hallucination_totals_reconciled: true,
        status_matrix_totals_reconciled: true, original_latency_average_and_p95_reconciled: true, csv_round_trip: 'passed',
        model_calls: 0, judge_calls: 0, original_scores_changed: false }, null, 2) + '\n');
    console.log(JSON.stringify({ detailed_report_sections: toc.length, detailed_report_tables: tableCount,
        detailed_report_lines: output.split('\n').length, detailed_csv_files: savedTables.length }));
};
