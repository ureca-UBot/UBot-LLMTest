"""Package existing evidence for review. No source modification or model calls."""
from pathlib import Path
import json, hashlib, html, re, zipfile

ROOT = Path(r'C:\Ureka\ureca_project2\LLM_Test')
OUT = ROOT/'presentation_work/evidence_20261026'
BE = ROOT.parent/'BackEnd'
FE = ROOT.parent/'FrontEnd'
JAVA = BE/'src/main/java/com/ubot'
RES = BE/'src/main/resources'
M = json.loads((OUT/'recomputed_metrics.json').read_text(encoding='utf-8'))
SOURCES = {}

def source(key, path, *needles):
    path = Path(path)
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    excerpts = []
    for needle in needles or ('',):
        idx = next((i for i,s in enumerate(lines) if needle in s), None)
        if idx is None:
            raise ValueError(f'Anchor not found: {key}: {needle}')
        a,b = max(0,idx-3), min(len(lines),idx+15)
        excerpts.append(dict(line=idx+1,start_line=a+1,end_line=b,text='\n'.join(lines[a:b])))
    SOURCES[key] = dict(id=key,path=str(path),line=excerpts[0]['line'],sha256=hashlib.sha256(path.read_bytes()).hexdigest(),excerpts=excerpts)
    return key

source('v2_first',ROOT/'model_test_v2/try1/results/all_summary.md','9개 모델 × 380건')
source('v2_judge',ROOT/'model_test_v2/try2/results/all_summary.md','72.0%')
source('v3_choice',ROOT/'model_test_v3/try1/results/summary/model_selection.md','1차 MVP 모델','47.6초','88문항 중 0문항')
source('v4_tune',ROOT/'model_test_v4/try1/results/summary/tuning_target_decision.md','352 (36.6%)','486 (100%)','모든 요금이 무료')
source('v5_quality',ROOT/'model_test_v5/try1/results/summary/brief_report.md','77.5%','키 순서','최종 모델 선정은 아니다')
source('v5_compare',ROOT/'model_test_v5/try1/results/summary/v4_comparison.md','62.2%')
source('off_transfer',ROOT/'model_test_v5/try1/results/summary/prompt_tuning_transfer.md','v4_t1c','3차 범위')
source('off_tuned_compare',OUT/'off_tuned_vs_instruct.json','"off_t1c__instruct_base"')
source('off_compare_script',OUT/'compare_off_instruct.py','commit=git')
source('off_compare_sources',OUT/'off_tuned_vs_instruct_sources.json','"git_commit"')
source('v5_quant',ROOT/'model_test_v5/try1/results/summary/quantization_decision.md','Q4_K_M')
source('concurrency',ROOT/'servingtest/l4/reports/L4_MULTIMODEL_RESULTS_20261006.md','9.13')
source('serving_limit',ROOT/'servingtest/docs/CONCLUSIONS.md','30초')
source('runtime_config',BE/'infra/llm/docker-compose.yml','LLM_HF_MODEL')
source('prompt_base',ROOT/'prompts_test_v7/try1/results/llm_judge/pv7-try1_variant_compare_vs_v4_base.md','900')
source('prompt_i2',ROOT/'prompts_test_v7/try1/results/llm_judge/pv7-try1_variant_compare_vs_v5_i2.md','900')
source('prompt_i3',ROOT/'prompts_test_v7/try1/results/llm_judge/pv7-try1_variant_compare_vs_v5_i3.md','699')
source('prompt_failure',ROOT/'prompts_test_v7/try1/results/summary/failure_analysis.md','HR')
source('prompt_changes',ROOT/'prompts_test_v7/SETUP.md','다른 점','조건만 남겼다')
source('prompt_calc',ROOT/'prompts_test_v8/try2/results/interim_summary.md','900')
source('prompt_i5',ROOT/'prompts_test_v9/SETUP.md','Judge')
source('current_prompt',RES/'prompts/README.md','v5_i4b','faq-system-slot.txt','검색어는 FAQ 검색에만')
source('pipeline_single',ROOT/'pipeline_test_v1/try1/results/interim_summary.md','single')
source('pipeline_slot',ROOT/'pipeline_test_v4/try2/results/all_summary.md','공통 Judge 문항 339건','이중 고지는 67','191')
source('format_recovery_script',ROOT/'pipeline_test_v7/analyze.py','RUNS =')
source('format_recovery',OUT/'pipeline_format_recovery.txt','on-broken vs v6')
source('planner_report',BE/'docs/질문분리_멀티턴_테스트_보고서.md','현재 운영 프롬프트','43/50 | 31/38','300건에서는 9건','141건 중 66건','8건 중 2~3건','2026-10-19 변경')
source('mt_baseline',OUT/'multiturn_before_after.json','"history_positive_41"','"answer_trials"')
source('mt_baseline_script',OUT/'collect_multiturn_baseline.py','Original-query retrieval is a saved')
source('mt_baseline_sources',OUT/'multiturn_before_after_sources.json','scores-orig-full.json')
source('mt_answer_conditions',ROOT.parent/'eval_205_multiturn/tools-evaluation/keep_search/answer_eval.py','A: 지금 방식','FAQ는 판정 LLM')
source('mt_old_handoff',ROOT.parent/'eval_205_multiturn/docs-evaluation/2026-10-15-keep-search/HANDOFF.md','멀티턴 처리 방식','답변 LLM 비교 결과')
source('planner_guard',JAVA/'chat/service/SubQuestionGuard.java','class SubQuestionGuard')
source('schedule_config',RES/'application.yml','ranking:','reservation-reminder-cron','purge-cron')
source('notify',JAVA/'notification/reminder/NotificationReminderScheduler.java','@Scheduled')
for key,name,needle in [
    ('reserve','ReservationReminderService','24'),('billing','BillingReminderService','class BillingReminderService'),
    ('roaming','RoamingReminderService','class RoamingReminderService'),('contract','ContractReminderService','class ContractReminderService'),
    ('usage','DataUsageReminderService','class DataUsageReminderService')]:
    source(key,JAVA/f'notification/reminder/{name}.java',needle)
source('retention',JAVA/'retention/scheduler/DataRetentionScheduler.java','@Scheduled','lockAtMostFor')
source('retention_sql',RES/'db/migration/R__purge_expired_data.sql',"INTERVAL '3 months'",'user_text =',"purge_in_batches('store_reservations'")
source('rank',JAVA/'ranking/scheduler/RankingScheduler.java','@Scheduled')
source('rank_service',JAVA/'ranking/service/RankingService.java','refreshRanking')
source('naming',JAVA/'unanswered/scheduler/UnansweredGroupNamingScheduler.java','@Scheduled')
source('naming_service',JAVA/'unanswered/service/UnansweredGroupNamingService.java','QUESTION_LIMIT')
source('review_schedule',JAVA/'guardreview/scheduler/ReviewScheduler.java','fixedDelay = 60000','0 15 4')
source('review_settings',RES/'db/migration/V48__create_guard_review_tables.sql','DEFAULT false')
source('outbox',JAVA/'outbox/OutboxWorker.java','MAX_RETRIES','@Scheduled')
source('maintenance',JAVA/'counsel/common/config/CounselMaintenanceScheduler.java','@Scheduled')
source('review_worker',JAVA/'guardreview/worker/ReviewWorker.java','fixedDelay = 5000','fixedDelay = 2000')
source('word_cache',JAVA/'guardreview/scheduler/ReviewWordCacheRefresh.java','@Scheduled')
source('cancel_sub',JAVA/'chat/job/stream/ChatJobCancellationSubscriber.java','@Scheduled')
source('embed_metrics',JAVA/'embedding/metrics/EmbeddingBacklogMetrics.java','@Scheduled')
source('app_role',JAVA/'global/config/AppRole.java','RUNS_SCHEDULERS')
source('store_service',JAVA/'store/service/StoreService.java','class StoreService')
source('store_list',RES/'sql/store/find-stores.sql','HAVING','ORDER BY')
source('store_nearby',RES/'sql/store/find-nearby.sql','ST_DWithin','ORDER BY')
source('store_map',RES/'sql/store/find-clusters.sql','ST_ClusterDBSCAN')
source('store_tool',JAVA/'ai/tool/StoreTools.java','isMentionedInQuestion','locations.getFirst')
source('nearby_tool',JAVA/'ai/tool/NearbyStoreSearcher.java','CHAT_STORE_RADIUS_KM')
source('directions',JAVA/'direction/service/DirectionsService.java','class DirectionsService','sorted')
source('directions_api',JAVA/'direction/client/KakaoDirectionsClient.java','RECOMMEND')
source('store_front',FE/'src/user/store-locator/setupStoreLocator.ts','const sortedStores')
source('directions_front',FE/'src/user/store-locator/directions/setupStoreDirections.ts','selectTransitCandidate')

def table(title,headers,rows,caption='',sources=()):
    return dict(title=title,headers=headers,rows=rows,caption=caption,sources=list(sources))
def finding(title,body,sources=(),strength='측정'):
    return dict(title=title,body=body,sources=list(sources),strength=strength)
def section(id,title,summary,findings,tables,limits,sources):
    return dict(id=id,title=title,summary=summary,findings=findings,tables=tables,limits=limits,sources=sources)

SECTIONS=[]
SECTIONS.append(section('model','1. 모델 선정',
 '정확도 한 가지보다 치명적인 실패, 프롬프트로 고칠 여지, 지연과 처리량을 함께 고려해 Qwen3 4B Instruct 계열로 좁혀진 과정이다. 최종 운영 설정과 측정 모델은 구분한다.',[
 finding('초기 선별: 평균이 가리는 실패를 배제',
 'v2는 9개 모델을 5개로 압축했고, v3는 정확도·근거·상태·부재 판단·일관성·P95의 최하위 실패를 먼저 살폈다. 지표 순서 720개를 모두 검사한 뒤 Qwen3 14B OFF를 1차 MVP로 골랐다. 당시 문서도 최종 확정이 아니라고 명시한다.', ['v2_first','v2_judge','v3_choice']),
 finding('v4의 선택 전환: 오답의 교정 가능성',
 '전체 정답률은 Gemma가 65.1%, Qwen OFF가 63.0%였지만 Qwen의 오답 962건 중 352건(36.6%)이 과잉 보류였다. Gemma는 908건 중 32건(3.5%)이었다. Qwen은 답할 수 있는 부분을 프롬프트 구조가 막는 사례가 많아 튜닝 대상으로 선택했다. Gemma의 계산·조건 판단 오류보다 교정 가능성이 높다는 당시 가설이었다.', ['v4_tune'], '선정 근거·가설'),
 finding('Instruct 전환의 효과와 대가',
 '동일 n100·RT 제외 1,300건에서 Qwen OFF 62.2% → Instruct Q4 77.5%(+15.3%p)로 개선됐다. 대신 환각은 22.8% → 26.2%(+3.4%p)로 증가했다. 추론 전용 모델의 추론 OFF와 Instruct 모델의 차이이며, 실제 생성 키 순서도 달라 순수 프롬프트 효과로 돌릴 수 없다.', ['v5_quality','v5_compare']),
 finding('4bit 선택의 근거',
 'Instruct Q8의 정답률은 78.8%로 Q4보다 1.3%p 높았지만 짝 검정 p=0.22였다. 환각 차이도 유의하지 않았다(p=0.85). Q4는 평균 2.61초·P95 4.75초, Q8은 3.49초·5.98초였다. 확인된 품질 이득이 작은 상태에서 Q4가 속도·용량에 유리했다.', ['v5_quality','v5_quant']),
 finding('현재 코드가 가리키는 모델',
 '백엔드 vLLM compose 기본값은 RedHatAI/Qwen3-4B-Instruct-2507-quantized.w4a16, max-model-len 4096, GPU 메모리 비율 0.6이다. 이는 현재 설정 근거이며 실행 중 서버의 실제 환경변수를 확인한 결과는 아니다.', ['runtime_config'],'코드 확인')], [
 table('후보를 배제한 실패 유형',['단계·후보','관측','선정에 준 의미'],[
 ['v2 Qwen3 4B','정답률 72.0%, 환각률 14.0% / 고유 300건','초기 품질 후보'],
 ['v2 EXAONE 7.8B','정답률 51.7%, 환각률 51.3% / 고유 300건','답변 생성과 근거 준수는 별개'],
 ['v3 Qwen3 4B 추론 ON','P95 47.6초, 300/300건이 5초 초과','품질이 좋아도 지연 한계'],
 ['v3 EXAONE 7.8B','기대 ABSTAIN 88건 중 0건 일치','자료 부재에 대한 취약성'],
 ['v4 Gemma 4B','문자 95/100건을 5건 초과로 계산; 4,999점 보유에 5,000점 사용','경계값·조건 판단 오류'],
 ['v4 Qwen 4B OFF','기대 ANSWER인데 ABSTAIN인 486건 모두 evidence_ids 빈 배열','근거 선택→상태→답변 연결의 과잉 보류']
 ],'v2·v3·v4는 데이터·평가가 다르다. 표의 행은 단계별 진단이며 버전 간 성장률이 아니다.',['v2_judge','v3_choice','v4_tune']),
 table('L4 동시성: 같은 P32·사용자 32 조건',['측정 모델','완료 RPS','응답 P50 / P95','평균 출력 토큰'],[
 ['Qwen3-4B (이전 모델)','9.13','3.04 / 5.70초','113'],['Qwen3-8B','6.10','4.15 / 8.60초','100'],['Qwen3-14B','3.33','7.10 / 15.99초','95']
 ],'L4·vLLM·30초 closed-loop 단회. HTTP 2xx 완료 기준이며 품질·지연 SLO를 적용한 수용량이 아니다. 출력 길이도 다르다.',['concurrency','serving_limit'])], [
 '4B 계열의 동시 처리 이점은 확인했으나 최종 Instruct w4a16을 같은 조건에서 직접 측정한 자료는 찾지 못했다. Qwen3-4B 9.13 RPS를 최종 모델의 보장 성능으로 쓰면 안 된다.',
 'Q4_K_M/Ollama 품질 측정과 w4a16/vLLM 배포 설정은 다른 조합이다. Q8 측정을 FP8 실측으로 부르면 안 된다.',
 'Q8과 Q4의 차이가 유의하지 않다는 것은 동등성이 증명됐다는 뜻이 아니다.',
 'v4 이후에도 test_set4 → test_set4r 문항 교정과 항목·표본 크기 변경이 있다. 모델 전환은 같은 1,300건, 프롬프트는 같은 900건 등 비교 집합을 따로 고정해야 한다.'
 ],['v2_first','v2_judge','v3_choice','v4_tune','v5_quality','v5_compare','v5_quant','concurrency','serving_limit','runtime_config']))

SECTIONS.append(section('prompt','2. 최종 계열 프롬프트 개선',
 'Qwen3-4B-Instruct Q4의 공통 900문항에서 전체 정확도는 유지되는 수준이었고, 환각과 불필요한 되묻기가 크게 줄었다.',[
 finding('대표 비교는 v4_base → v5_i4',
 '같은 test_set4r 9개 항목×100문항의 기존 Judge 결과를 ID로 맞췄다. 정확도 703/900 → 698/900, 환각 184/900 → 122/900, 되묻기 126/900 → 1/900이다. 환각은 62건·6.89%p 감소했고 상대 감소율은 33.7%다.', ['prompt_base']),
 finding('무조건 짧게 쓰게 한 실험은 실패',
 'v5_i2의 50자 제한은 환각을 줄였지만 누락 때문에 정확도가 크게 내려갔다. 공통 900건에서 i2 555건 → i4 698건(+143건·15.89%p)으로 회복됐다. 이 수치를 기준선 대비 정확도 향상으로 쓰면 안 된다.', ['prompt_i2']),
 finding('개선 방향은 필요한 조건을 유지하면서 불필요한 발화를 제거',
 '50자 제한을 풀고 필수 조건·값을 유지하는 i3 단계에서 정확도를 회복했다. i4는 답할 수 있는 내용과 마지막 한계 고지를 정리하고 반복·되묻기를 억제했다. i3와 i4의 공통 699건은 정답 551→549로 유지되는 수준이고 환각은 126→90으로 줄었다.', ['prompt_i3','prompt_failure']),
 finding('채택하지 않은 후속 실험도 남김',
 '계산 결과를 answer 쪽에 쓰게 한 v8 try2는 i4와 같은 900건에서 정답 698→640으로 감소했다. 환각 122→109의 차이는 p=0.228로 유의하지 않았다. v9 i5는 결정론 검사에서 반복 고지·FAQ ID 노출이 증가해 Judge를 진행하지 않았다.', ['prompt_calc','prompt_i5']),
 finding('측정 프롬프트와 현재 서비스 프롬프트의 경계',
 '측정본은 v5_i4다. 백엔드의 단일 status 지침 v5_i4b는 파생본이며 자체 전수 Judge가 없다. 현재 채팅은 다시 faq-system-slot.txt를 사용한다. 따라서 13.56%를 현재 운영 전체 파이프라인의 환각률로 제시하면 안 된다.', ['current_prompt'],'코드·측정 범위 확인')], [
 table('같은 900건: v4_base와 v5_i4',['지표','v4_base','v5_i4','변화','짝 검정 p'],[
 ['답변 정확도','703/900 (78.11%)','698/900 (77.56%)','−0.56%p','0.740'],
 ['환각률','184/900 (20.44%)','122/900 (13.56%)','−6.89%p / 상대 −33.7%','0.00000168'],
 ['되묻기','126/900 (14.00%)','1/900 (0.11%)','−13.89%p','<0.001'],
 ['FAQ ID 노출 (패턴 검사)','147건','77건','−70건','별도 검정 안 함'],
 ['반복 표현 (패턴 검사)','303건','234건','−69건','별도 검정 안 함']
 ],'Qwen3-4B-Instruct Q4_K_M·temperature 0·고정 Context. Ollama 0.40.2→0.40.3의 작은 환경 차이가 남는다. 정확도·환각·되묻기는 paths.jsonl 재집계, 패턴 항목은 비교 보고서.',['prompt_base']),
 table('항목별 정확도: 각 100건',['항목','base → i4','해석'],[
 ['노이즈 FAQ 구분 (NC)','82 → 87','개선'],['다중 FAQ 조합 (MC)','90 → 86','하락'],['사용자 정보 (UI)','60 → 58','하락'],['조건·경계값 (CE)','68 → 66','하락'],['부분 정보 (PI)','74 → 76','개선'],['유사하지만 답 없음 (SR)','93 → 91','하락'],['무관 FAQ (HR)','94 → 82','명확한 약점: p=0.004'],['멀티턴 (MT)','83 → 86','개선'],['API 결과 (AR)','59 → 66','개선']
 ],'전체 평균만으로 모든 유형이 좋아졌다고 해석할 수 없다. 항목별 검정은 다중 비교 보정 없는 탐색 결과.',['prompt_base','prompt_failure']),
 table('고친 문제와 실제 수정 방식',['관측한 문제','수정','평가에서 확인한 범위'],[
 ['너무 짧은 답변이 조건·값을 누락','50자 제한 제거, 필수 조건·단서·최종 값 유지','i2→i4 공통 900건 정답 +143건. 두 변경의 개별 효과는 분리하지 않음'],
 ['답변 불가 고지가 여러 지침에 중복','base 작성 방식 한 곳으로 모으고 status/output_order의 중복 지시 제거','i3→i4 공통 699건 환각 126→90, 정답 551→549'],
 ['답할 수 있는 질문에도 확인 불가·추측 추가','질문에 못 답하는 부분이 있을 때만 끝에 한 문장, 대상만 쓰고 이유·추측·다른 안내 제외','base→i4 전체 환각 −6.89%p. 규칙별 독립 효과는 아님'],
 ['사용자에게 조건을 되묻거나 완료 후 추가 질문','답변 끝에 추가 문장·되묻기 금지','base→i4 되묻기 126→1/900'],
 ['고정 문구·대괄호 예시를 그대로 복사','문장 틀·예시 대신 작성 조건만 지시','22건 스모크에서 복사 오류 관측 후 제거; 전수 성능과 구분']
 ],'v7 SETUP의 실제 변경 목록과 단계별 Judge 결과를 연결했다. 여러 규칙을 함께 바꾼 실험이므로 항목별 단독 인과 효과는 주장하지 않는다.',['prompt_changes','prompt_i2','prompt_i3','prompt_base'])], [
 '환각 감소와 정확도 증가를 같은 의미로 쓰지 않는다. 기준선 대비 전체 정확도 상승은 확인되지 않았다.',
 'v4 Qwen OFF → v5 Instruct의 +15.3%p는 모델 전환 효과다. v4_base → i4의 프롬프트 비교 수치와 합치지 않는다.',
 '같은 데이터에서 반복 튜닝한 결과다. 독립적인 미사용 검증셋에서 재검증한 일반화 성능은 아니다.'
 ],['prompt_base','prompt_i2','prompt_i3','prompt_changes','prompt_failure','prompt_calc','prompt_i5','current_prompt']))

SECTIONS.append(section('slot','3. single에서 slot으로',
 'slot은 답변과 고지의 책임을 나누고, 질문별 상태에 따라 출력 본문을 코드가 선택할 수 있게 만든 설계다. 가장 강한 수치 근거는 중복 고지와 출력 오류 감소다.',[
 finding('구조를 바꾼 이유',
 'single은 공통 본문과 단일 상태, sub는 공통 본문과 하위 상태 목록, slot은 하위 질문마다 answer→status 칸을 만든다. 코드는 ANSWER 칸만 합치고 나머지 안내는 정해진 문장으로 붙인다. 모델이 공통 본문에 섞어 쓴 보류 고지를 억제하기 위한 선택이다.', ['pipeline_single','pipeline_slot'],'설계·구현'),
 finding('최초 single 대비: 상태·고지는 개선, 정확도·환각은 유의하지 않음',
 '동일 ID·기대 라벨 390건에서 최종 상태 일치는 274→310건이다. 공통 Judge 350건에서 모델 고지는 201→8건으로 감소했다. 정확도는 284→278건, 환각은 44→36건으로 모두 5% 수준의 유의한 차이가 아니었다.', ['pipeline_single','pipeline_slot']),
 finding('같은 회차 sub 대비: 실행 오류 12→1, 이중 고지 67→1',
 '출력 형식을 더 가깝게 비교한 v4 try2에서 공통 Judge 339건의 정답은 259→272(+3.83%p, p=0.0596), 환각은 30→33으로 소폭 증가했다. 반면 모델 고지 69→8건, 전체 실행 오류 12→1건으로 줄었다.', ['pipeline_slot']),
 finding('환각을 구조적으로 전부 막는 방식은 아님',
 'slot은 비ANSWER 칸 191개를 버렸고 그중 152개에 고지 패턴이 있었다. ANSWER 칸 안의 잘못된 사실은 남을 수 있다. SB 유형의 환각은 sub 1건→slot 7건으로 늘었고, slot의 칸 개수 불일치 6건도 남아 있었다.', ['pipeline_slot'])], [
 table('최초 single v1 → slot v4',['지표·분모','single','slot','변화','짝 검정 p'],[
 ['정답 / 공통 Judge 350건','284 (81.14%)','278 (79.43%)','−1.71%p','0.418'],
 ['환각 / 공통 Judge 350건','44 (12.57%)','36 (10.29%)','−2.29%p','0.302'],
 ['모델 고지 / 공통 Judge 350건','201 (57.43%)','8 (2.29%)','−55.14%p','<0.001'],
 ['최종 status 일치 / 전체 390건','274 (70.26%)','310 (79.49%)','+9.23%p','<0.001'],
 ['실행 오류 / 전체 390건','1','1','동일','1.000'],
 ['최종 질문 API 평균 대기 / 전체 390건','4.10초','4.19초','+0.08초','별도 검정 안 함']
 ],'10/20과 10/23 실행 비교. ID·기대 라벨은 일치하나 백엔드·프롬프트 변경이 섞여 있어 slot만의 인과 효과로 단정할 수 없다.',['pipeline_single','pipeline_slot']),
 table('같은 v4 try2: sub → slot',['지표·분모','sub','slot','해석'],[
 ['정답 / 공통 Judge 339건','259 (76.40%)','272 (80.24%)','+3.83%p, p=0.0596'],
 ['환각 / 공통 Judge 339건','30 (8.85%)','33 (9.73%)','+0.88%p, p=0.743'],
 ['모델 고지 / 공통 Judge 339건','69 (20.35%)','8 (2.36%)','−17.99%p, p<0.001'],
 ['모델·코드 중복 고지 / 전체 390건','67','1','출력 제어 개선'],
 ['실행 오류 / 전체 390건','12 (LLM-005)','1 (CHAT-021)','LLM-005 12→0'],
 ['최종 status 일치 / 전체 390건','302','310','p=0.322']
 ],'Judge가 없는 정상 코드 보류(CHAT-013)를 환각 0인 답변으로 분모에 넣지 않았다. 두 모드에 모두 Judge가 있는 문항만 품질을 짝 비교했다.',['pipeline_slot'])], [
 '각 실행 전체 Judge 수(예: single 352, slot 352)가 같아도 Judge 문항이 완전히 같지는 않다. 공통 350건·339건을 별도로 맞췄다.',
 'v1 요약의 매장 재판정 전 수치와 최신 case_scores.jsonl 값이 일부 다르다. 이 근거집은 저장된 최신 scored 행을 기준으로 재집계했다.',
 '출력 오류 감소는 sub 대비 근거다. 최초 single도 오류 1건이므로 single 대비 오류 개선이라고 쓰면 안 된다.',
 '후속 pipeline v6/v7의 172건은 도구 형식 복구 실험이다. on_broken 재호출은 형식 불일치를 줄였으나 공통 표본의 정확도·환각 개선은 유의하지 않았다. 최초 slot 비교와 합치지 않는다.'
 ],['pipeline_single','pipeline_slot','current_prompt','format_recovery_script','format_recovery']))

SECTIONS.append(section('planner','4. 판단 LLM·분류기·가드',
 '검색어를 잘 만드는 일과 답변의 의미를 지키는 일을 분리했다. 분류기로 불필요한 판단 호출을 피하고, 생성 검색어는 검색에만 쓰며 답변에는 사용자 원문을 준다.',[
 finding('분리 프롬프트의 개선과 검색 이득',
 '질문 분리 100건에서 기대 하위 질문 수 일치는 기존 81→최종 90건이다. 실패했던 keep+search 실험 69건 대비로는 +21건이다. 최종 저장 실행 안에서 원문 검색은 정답 의도 161/201개를 찾았고, search로는 182/201개를 찾았다(+21개·10.45%p). 기존 분리 프롬프트는 같은 실행에서 181개였다.', ['planner_report']),
 finding('멀티턴은 지시어 정리가 주된 개선',
 '같은 하위 질문 평가 기준으로 42/50→43/50, 맥락 필요 질문 30/38→31/38이었다. 지시어가 남은 문항은 12→1건, 맥락이 필요 없는 8건의 뜻은 모두 유지했다. 최초 29/50(58%)는 context_used까지 포함한 다른 기준이라 43/50과 직접 비교하지 않는다.', ['planner_report']),
 finding('분류기: 판단 호출을 필요한 질문에 집중',
 '분리·멀티턴 표지가 없으면 원문 검색을 먼저 한다. 기준 미달이거나 답변 문장 필터를 통과하지 못할 때만 판단 LLM을 호출한다. 최종 slot 390건의 planner 기록은 호출 216건·생략 174건(44.62%)이며, 기본 단건 SA 50건은 49건(98%)을 생략했다. 항상 1회 판단한다고 가정한 대비 절감이며 전체 LLM 호출 수의 절감률은 아니다.', ['planner_report','current_prompt']),
 finding('검색어 변형이 답변으로 넘어가는 경로를 끊음',
 'SubQuestionGuard는 명령 변환·부정 뒤집힘·질문 대신 답 쓰기·누출 문구·숫자·명사 변형을 검사한다. 검색은 판단 LLM의 searchQuery로 하되 답변 LLM에는 사용자 원문과 코드로 자른 원문 조각을 준다. 의미가 바뀐 생성 검색어를 답변의 질문처럼 제시하지 않는다.', ['planner_report','planner_guard','current_prompt'],'코드·설계'),
 finding('가드·원문 전략의 측정 근거와 한계',
 '운영 프롬프트 출력 300건에서 가드가 명령 6건·부정 3건의 실제 변형을 잡았고 이 표본의 오탐은 0건이었다. 같은 FAQ를 넣어 원문과 복구 keep을 비교한 100건은 두 방식 모두 근거 맞힘/일부/틀림이 76/20/4로 같았다. 가드 도입으로 최종 환각률이 몇 % 줄었는지 분리한 전수 비교는 찾지 못했다.', ['planner_report']),
 finding('이력 오염도 제어 대상으로 삼음',
 '틀린 이전 답변을 주입한 8건 중 2~3건이 그 값을 따라 썼다. 그래서 멀티턴에만 이전 user/assistant 대화를 주고, 과거 사용자 질문은 생성 검색어가 아닌 실제 원문으로 보관·재사용한다. 다만 원문 이력 전환 등 10/19 이후 변경은 기존 평가 200건을 다시 돌린 결과가 아니다.', ['planner_report','current_prompt'],'소규모 실험·코드')], [
 table('분리·멀티턴 근거별 비교',['대상','이전','개선안','무엇을 의미하는가'],[
 ['분리 100건: 기대 개수 일치','기존 81/100','최종 90/100','+9%p / 전체 의미 정답률은 아님'],
 ['분리 100건: keep+search 실패안','69/100','최종 90/100','+21%p / 운영 기준선과 혼동 금지'],
 ['최종 실행 201개 의도: FAQ 적중','원문 161/201 (80.10%)','search 182/201 (90.55%)','정답 FAQ가 top3·유사도≥0.75에 포함'],
 ['같은 201개 의도: 기존 분리 vs 최종','181/201','182/201','개선은 원문 무분리 대비가 주효과'],
 ['멀티턴 하위 질문 기준','42/50 (84%)','43/50 (86%)','+1건, 실행 변동 주의'],
 ['멀티턴 지시어 잔존','12건','1건','대상어를 명시한 검색어로 정리'],
 ['가드의 변형 탐지 / 300건','무가드 대비 전수 환각 수치 없음','실제 오류 9건 탐지, 관측 오탐 0','누락·미검증 질문에 대한 보장은 아님']
 ],'로컬 Ollama Q4·BGE-M3·temperature 0·단회. 질문/정답은 AI 생성이며 사람 전수 검수 전이다.',['planner_report']),
 table('slot 390건의 판단 LLM 호출 기록',['유형','총 문항','호출','생략','생략률'],[
 [t,str(v['n']),str(v['planner_called']),str(v['n']-v['planner_called']),f"{(v['n']-v['planner_called'])/v['n']*100:.1f}%"]
 for t,v in M['pipeline']['slot_v4']['by_type'].items()
 ]+[ ['전체','390','216','174','44.6%'] ],
 'case_scores.jsonl의 planner.judge_called/source 재집계. 유형 약어는 원본 테스트 라벨을 유지했다. 이력 준비 턴·답변 모델·형식 재호출은 이 분모에 포함하지 않는다.',['pipeline_slot']),
 table('분류기 이전 소규모 평가도 별도로 보존',['평가 집합','생략','해석'],[
 ['이력 없는 141건','66/141 (46.81%)','원문 검색으로 종료'],
 ['평가 전체 200건','70/200 (35.0%)','위 66건 + 이력 있는 원문 검색 종료 4건'],
 ['현재 slot 전체 390건','174/390 (44.62%)','별도 데이터의 실제 planner 호출 기록']
 ],'서로 다른 평가 집합을 이어 붙여 절감률 향상이라고 쓰지 않는다.',['planner_report','pipeline_slot'])], [
 '분리 수 일치는 질문 의미·대상·조건을 모두 올바르게 복원했다는 뜻이 아니다. FAQ 적중과 최종 답변 품질을 따로 본다.',
 '초기 단건 검색의 임계값 통과 95→103건은 FAQ 정답률 향상이 아니다. 유사도 임계값 통과와 정답 FAQ 적중을 구분한다.',
 'base 폴더의 기존 프롬프트 검색 적중은 182, final 실행은 181이다. 기존 출력의 미세한 실행 차이가 있으므로 최종 실행의 원문161·기존181·최종182를 함께 사용한다.',
 '가드와 분류 표지는 평가 데이터를 보며 수정했다. 300건 오탐 0은 독립 검증셋의 오탐률 0을 의미하지 않는다.',
 '검색어·이력 통제는 오염 경로를 줄이는 설계 근거다. 최종 답변 환각률의 독립 A/B 감소 수치가 없는 부분은 정량 효과 미확인으로 남겼다.'
 ],['planner_report','planner_guard','current_prompt','pipeline_slot']))

scheduler_rows=[
 ['방문 예약 알림','매시 정각','방문 24h·6h·1h 전. 이미 지난 단계는 건너뛰고 해당 단계 1회만 생성','예약을 잊지 않게 안내','notify','reserve'],
 ['요금 납부 알림','매일 09:00 KST','납부일까지 0~3일, 연체 1~30일. 총액−납부액>0 기준','납부 시점 안내·장기 연체 반복 생성 제한','notify','billing'],
 ['로밍 시작·종료 알림','매일 09:00 KST','시작/종료 D-1·D0. 직전 구매·1일 로밍 등의 중복 안내는 제외','사용 기간 안내','notify','roaming'],
 ['약정·할부 만료 알림','매일 09:00 KST','활성 구독의 종료 D-30·D-7·D-1. 당일은 D1 단계의 오늘 문구','만료·변경 준비','notify','contract'],
 ['데이터 사용량 알림','매시 정각','이번 달 한도 80%·100%. 도달한 최고 단계, 무제한·한도 불명은 제외','소진 전에 안내; 사용량 원천 갱신은 별도','notify','usage'],
 ['보관 데이터 정리·로밍 상태 갱신','매일 04:00 KST','정책별 기한과 상태/FK 조건. 1,000건씩 commit·하위→상위 삭제','로그/개인정보 축적 완화·삭제 락 단축','retention','retention_sql'],
 ['인기·급상승 FAQ 랭킹','기본 1분 fixedRate','최근 20분 top5. 최소 10회, 2일 기준·최소 10표본·급상승 비율 5','Redis 스냅샷으로 조회마다 재집계하는 비용 감소','rank','rank_service'],
 ['미응답 그룹 이름 생성','시작 5분 뒤, 완료 후 5분','대상 묶음의 최근 질문 최대 10개로 이름 생성. 배치·시간 예산 적용','관리자가 묶음의 주제를 빠르게 파악','naming','naming_service'],
 ['상담 가드 검토 예약','60초마다 실행 시점 확인','DB enabled=true·next_run_at 도래·기존 실행 없음. 실제 주기는 관리자 설정','새 상담 기록을 주기적으로 분석','review_schedule','review_settings'],
 ['가드 검토 기록 정리','매일 04:15 KST','기한 지난 상세 기록·분석 산출물 정리','검토 데이터 누적 제한','review_schedule'],
 ['Outbox 비동기 전달','기본 완료 후 2초','미처리 이벤트 잠금·최대 20개 배치. 재시도 한계 5회, 기본 지연 10초','트랜잭션 이후 작업을 재시도 가능한 큐로 전달','outbox'],
 ['상담 세션·메시지 유지보수','기본 완료 후 5초','세션 유지보수와 pending 메시지 복구. 별도 scheduler로 미색인 안전 문장 처리','중단 작업 복구·정책 문장 색인','maintenance'],
 ['검토 worker·알림 집계','완료 후 2초 / 5초','검토 작업 실행 / 알림 묶음 flush','예약과 실제 분석 작업을 분리','review_worker'],
 ['검토 금칙어 캐시 갱신','완료 후 5초','DB 버전 변화 확인 후 캐시 갱신','변경한 금칙어 적용 지연 축소','word_cache'],
 ['채팅 취소 구독 복구','기본 완료 후 15초','Redis 취소 구독 연결 확인·재구독','취소 신호 전달 경로 복구','cancel_sub'],
 ['임베딩 적체 지표 갱신','시작 30초 뒤 / 완료 후 5분','미처리·실패 이벤트 등의 backlog 수집','적체를 관측하는 지표 제공','embed_metrics']
]
SECTIONS.append(section('scheduler','5. 스케줄러 전체 역할',
 '팀 전체 구현을 사용자 알림·데이터 정리·FAQ 운영·복구 작업으로 묶었다. 주기는 현재 코드와 설정의 기본값이다.',[
 finding('개인 담당 근거: 데이터 보관 정리',
 '04시 정리에 로밍 날짜 상태 갱신을 먼저 수행한다. 질문 원문·연결 정보는 3개월 뒤 익명화하고 모니터링 집계용 행은 3년 남긴다. 로그/예약/알림은 3개월, 구독·청구 계열은 5년 기준 등 테이블별 조건을 적용한다. 이 기간은 프로젝트 구현 정책이며 법정 의무라고 검증한 자료는 아니다.', ['retention','retention_sql'],'코드 확인'),
 finding('삭제를 운영 작업으로 만든 장치',
 'ShedLock 최소 10분·최대 30분으로 서버 간 중복 실행을 억제하고, 실패 시 1분 간격 최대 3회 재시도한다. 프로시저는 1,000건마다 commit하므로 장시간 락을 줄이고 실패 뒤 남은 행부터 다시 정리한다. 로밍 상태 갱신 실패가 삭제 작업을 막지는 않는다.', ['retention','retention_sql'],'코드 확인'),
 finding('검토 주기와 스케줄러 tick을 구분',
 '가드 검토 scheduler는 매분 예약 시점만 확인한다. 기본 DB 설정은 enabled=false·interval 1,440분이고 관리자가 5~43,200분 사이로 바꿀 수 있다. 매분 LLM 분석을 한다는 뜻이 아니다.', ['review_schedule','review_settings'],'코드 확인')], [
 table('역할·기본 주기·판정 기준',['스케줄러/작업','기본 주기','기준','이득'],[r[:4] for r in scheduler_rows],
 'cron은 Asia/Seoul. fixedDelay는 작업 완료 뒤의 대기이며 정확한 벽시계 주기가 아니다. 환경변수·DB 설정으로 실제 운영값이 달라질 수 있다. 알림 서비스는 단계 중복 방지를 사용한다.',
 ['schedule_config','notify','retention','rank','naming','review_schedule','outbox','maintenance','review_worker','word_cache','cancel_sub','embed_metrics']),
 table('보관 정리의 핵심 기준',['대상','구현 기준','주의'],[
 ['질문 로그·FAQ 사용 로그','3개월 뒤 원문/사용자·대화 연결 익명화, 집계용 행 3년','활성 상담 등 연결 상태에 따른 예외 조건'],
 ['예약·알림·일반 답변 시도 로그','주로 3개월','예약은 방문일 기준, 테이블마다 기준 시각이 다름'],
 ['미응답 그룹','APPROVED/REJECTED 처리 뒤 3개월','검토 대기·보류 그룹을 일괄 제거하지 않음'],
 ['구독·청구 계열','종료일·청구월 등 기준 5년','테이블별 상세 조건·참조 관계 우선'],
 ['회원·FAQ·매장·상품 등 마스터','soft delete 후 정해진 기간·참조 조건','모든 데이터를 생성 후 일정 기간에 지우는 구조가 아님']
 ],'R__purge_expired_data.sql의 현재 구현 요약. 기간을 법률 근거로 제시하지 않는다.',['retention_sql'])], [
 '개별 작성자 귀속은 전체 git 이력으로 확정하지 않았다. 데이터 보관 정리는 사용자 담당 자료와 일치하며, 나머지는 팀 도메인 전체 설명이다.',
 'app.role에 따라 api/all은 주기 예약, worker/all은 비동기 실행을 담당하는 조건이 있다. 알림 등 각 클래스의 조건은 소스별로 확인해야 한다.',
 '배포 환경변수·DB의 현재 enabled/next_run_at은 조회하지 않았다. 실제 가동 여부·실행 성공률이나 성능 향상 수치로 제시하지 않는다.'
 ],list(dict.fromkeys(['schedule_config','app_role']+[key for r in scheduler_rows for key in r[4:]]))))

SECTIONS.append(section('store','6. 매장 검색·길찾기 통합',
 '매장 선택은 위치·지역·지원 서비스의 조건 검색이며, 길찾기는 선택한 매장까지 교통수단별 경로 조회다. 주변 매장 거리와 실제 이동 경로 거리를 구분한다.',[
 finding('검색 대상과 조건',
 '활성·미삭제 매장만 검색한다. 시도/시군구는 지역 조건, 서비스 코드는 여러 개를 선택하면 모두 지원하는 매장을 찾는 AND 조건이다. 좌표 기반 주변 검색은 PostGIS ST_DWithin으로 반경을 제한하고 ST_Distance 거리순·동률 store_id순으로 정렬한다.', ['store_service','store_list','store_nearby'],'코드 확인'),
 finding('같은 도메인을 쓰되 화면과 채팅의 기본값은 다름',
 '주변 검색 API는 기본 반경 10km·최대 반경 100km, 기본 20개·최대 100개다. 채팅 도구는 기본 3km·최대 5개를 같은 StoreService로 검색하며 서비스 필터는 빈 목록으로 전달한다. 프런트의 지도 영역 목록은 전달받은 거리가 있으면 거리순으로 정렬한다.', ['store_service','nearby_tool','store_front'],'코드 확인'),
 finding('채팅에서 장소를 지어내지 않도록 제한',
 'LLM이 추출한 장소는 공백을 제거한 사용자 질문 안에 실제로 포함돼야 한다. Kakao 장소 검색의 첫 결과를 기준점으로 쓰며 장소를 못 찾으면 재입력을 안내한다. 장소 없이 현재 위치를 쓰려면 위치 제공 경로를 따른다. 임의 오타 보정으로 다른 지명을 만드는 경우도 통과시키지 않는다.', ['store_tool','nearby_tool'],'코드 확인'),
 finding('교통수단별 추천 기준',
 '도보·자동차·대중교통을 지원한다. 자동차는 Kakao Mobility priority=RECOMMEND의 첫 경로다. 대중교통 후보는 최초 예상 소요 시간순으로 보여 주며, 사용자가 고른 후보에 대해서만 출발·도착 도보 연결을 조회해 총시간·거리를 보완한다.', ['directions','directions_api','directions_front'],'코드 확인'),
 finding('선택 이후의 비싼 조회를 지연',
 '모든 대중교통 후보에 도보 API를 선호출하지 않는다. 선택 후보의 시작/끝 도보 구간을 구한 뒤 합계 값을 다시 계산하며, 도보 한 구간 실패 시 완성된 경로처럼 부분 결과를 보내지 않는다. 구현은 경로 결과를 저장·재사용하지 않고 매번 조회한다.', ['directions','directions_front'],'코드 확인')], [
 table('매장 검색의 기준',['기능','기준','해석'],[
 ['공통 필터','active=true·미삭제','영업 중 여부 실시간 필터와는 다름'],
 ['지역 검색','시도·시군구 조건 + 선택 서비스 전부','서비스 A 또는 B가 아니라 A와 B 모두'],
 ['일반 페이지 목록','기본 20개, 최대 100개; DB는 store_id순','좌표가 있어도 일반 목록 SQL이 자동 거리순은 아님'],
 ['주변 매장 API','기본 10km, 0.1~100km; 거리순','도로 이동 거리가 아닌 좌표 간 거리'],
 ['채팅 주변 검색','기본 3km·최대 5개; 서비스 필터 없음','일반 API 기본값과 구분'],
 ['축소 지도','줌 7~13에서 DBSCAN 군집, 600~32,000m 단계','많은 매장 점을 묶어 표시; 경로 탐색 알고리즘 아님']
 ],'백엔드 SQL/서비스와 프런트 표시 로직을 함께 확인했다. 환경변수로 바뀌는 도구 기본값은 설정값이다.',['store_service','store_list','store_nearby','store_map','nearby_tool','store_front']),
 table('길찾기의 기준',['수단','조회·선택','표시'],[
 ['도보','Kakao Map 경로 1개','구간 안내·총거리·총시간'],
 ['자동차','Kakao Mobility RECOMMEND 첫 경로','경로·거리·시간·제공되는 통행/택시 비용 정보'],
 ['대중교통','최초 후보는 예상 소요 시간 오름차순','선택 후보에만 도보 연결을 보완해 합계 재계산']
 ],'출발지는 사용자 지정/제공 좌표, 도착지는 선택 매장의 DB 좌표다. 대중교통 최초 순서는 도보 보완 후의 전 후보 최단 시간 보장이 아니다.',['directions','directions_api','directions_front'])], [
 '근처 매장 선정은 직선/좌표 거리, 길찾기는 교통망 경로다. “자동차로 가장 가까운 매장부터 추천”으로 설명하면 구현과 다르다.',
 '대중교통 추천은 최초 응답 예상 시간 기준이다. 최소 환승·최저 요금·도보 보완 후 전 후보 최단 시간을 보장하는 자체 최적화 알고리즘은 확인되지 않았다.',
 '영업시간 문자열은 제공되지만 현재 영업 중만 검색하는 SQL 조건은 확인하지 못했다.',
 '팀 전체 기능을 도메인 기준으로 합친 것이며 개별 작성자 구분은 포함하지 않았다.'
 ],['store_service','store_list','store_nearby','store_map','store_tool','nearby_tool','directions','directions_api','store_front','directions_front']))

# User follow-up: compare the last OFF tuning version, rather than only the untuned baseline.
OFF=json.loads((OUT/'off_tuned_vs_instruct.json').read_text(encoding='utf-8'))
SECTIONS[0]['findings'].insert(0,finding('추가 확인: OFF 최종 튜닝 뒤에도 Instruct의 정답 이점은 남음',
 '전환 직전 마지막 안은 v4_t1c다. 공통 405건에서 OFF+t1 306건(75.56%), OFF+t1c 314건(77.53%), Instruct+v4_base 345건(85.19%)이 정답이었다. 최종 튜닝 대비 +31건·7.65%p(p=0.00117)이며, 환각은 99→93건으로 유의한 차이가 아니다(p=0.645). 앞서 제시한 +15.3%p는 튜닝 전 OFF 대비 수치이므로 전환 이유를 설명할 때 이 보완 비교를 우선한다.',
 ['off_tuned_compare','off_transfer']))
SECTIONS[0]['findings'].insert(1,finding('마지막 버전과 모든 지표에서 가장 좋은 버전은 다름',
 'OFF 튜닝끼리 같은 500건을 보면 t1→t1c 정답은 379→393건(75.8%→78.6%, p=0.189)이고 환각은 87→107건(17.4%→21.4%)이었다. 정확도 상승이 확실하게 입증된 단일 최우수 안은 아니며, 환각을 우선하면 t1이 유리하다. 따라서 최종 t1c와 더 보수적인 t1을 모두 비교했다. 최신 체크아웃에는 없던 t1c Judge 500건을 기존 로컬 commit 315fffe에서 읽어 복사했으며 브랜치를 전환하거나 Judge를 새로 실행하지 않았다.',
 ['off_tuned_compare','off_compare_sources','off_compare_script']))
rows=[]
for key,label in [('off_t1','OFF + v4_t1 (1차)'),('off_t1c','OFF + v4_t1c (마지막)'),('instruct_base','Instruct Q4 + v4_base')]:
    d=OFF['cohorts']['same_405_three_versions']['stats'][key];n=d['n']
    rows.append([label,f"{d['correct']}/{n} ({d['correct']/n*100:.2f}%)",f"{d['hallucination']}/{n} ({d['hallucination']/n*100:.2f}%)",str(d['asks'])])
SECTIONS[0]['tables'].insert(0,table('OFF 튜닝 후와 Instruct: 같은 405문항',['모델·프롬프트','정답','환각','되묻기'],rows,
 'PI·HR·SR 각 100건 + NC·MC 오답 위주 목록과 Instruct 서브셋의 교집합 105건. 전체 서비스 정답률의 대표 표본은 아니다. Instruct는 전환 직후 기본 프롬프트이며 이후 i4 튜닝 결과가 아니다.',['off_tuned_compare','off_transfer']))
SECTIONS[0]['tables'].insert(1,table('더 넓은 정규 900문항: OFF 1차 튜닝과 Instruct',['지표','OFF + v4_t1','Instruct Q4 + v4_base','짝 비교'],[
 ['정답','576/900 (64.00%)','663/900 (73.67%)','+9.67%p, p<0.001'],
 ['환각','211/900 (23.44%)','245/900 (27.22%)','+3.78%p, p=0.038'],
 ['되묻기','26/900','195/900','Instruct 기준선에서 다시 증가']
 ],'PI·CE·UI·AR·AD·SR·HR·EC·CF 각 100건. NC·MC의 오답 위주 목록을 제외했다. t1c는 이 900건 전체를 측정하지 않아 동일 범위 비교가 불가능하다.',['off_tuned_compare','off_transfer']))
SECTIONS[0]['tables'].insert(2,table('최종 OFF t1c와 Instruct의 유형별 정답',['항목','OFF t1c','Instruct Q4 기본','표본'],[
 ['부분 정보 PI','57/100','73/100','정규 서브셋'],['무관 FAQ HR','82/100','96/100','정규 서브셋'],
 ['유사하지만 답 없음 SR','87/100','91/100','정규 서브셋'],['노이즈 FAQ NC','46/56','43/56','오답 위주 목록 교집합'],
 ['다중 FAQ MC','42/49','42/49','오답 위주 목록 교집합']
 ],'Instruct가 모든 유형에서 우세한 것은 아니다. NC는 OFF 최종 튜닝 쪽이 앞섰고 MC는 같았다.',['off_tuned_compare','off_transfer']))
SECTIONS[0]['findings'].insert(2,finding('가정 계산: 미측정 문항이 튜닝 전과 같았다면',
 '같은 1,300건에서 t1c가 측정된 405건만 대체하고 나머지 895건은 튜닝 전 OFF 결과로 유지하면 정답 868/1,300(66.77%), 환각 300/1,300(23.08%)이다. 튜닝 전은 정답 809·환각 297이므로 정답 +59건·환각 +3건이다. 실제 전수 t1c 측정치가 아니라 사용자가 지정한 조건의 합성 계산이며, NC·MC 집중 목록의 비율을 미측정 문항에 확대하지 않았다.',
 ['off_tuned_compare','off_compare_script'],'명시적 가정 계산'))
SECTIONS[0]['tables'].insert(3,table('가정: t1c 미측정 문항은 튜닝 전 OFF 결과 유지 / 동일 1,300건',['조합','정답','환각','구분'],[
 ['튜닝 전 OFF','809/1,300 (62.23%)','297/1,300 (22.85%)','실측'],
 ['t1c 측정 405건 + OFF 기준선 895건','868/1,300 (66.77%)','300/1,300 (23.08%)','가정에 따른 합성값'],
 ['Instruct Q4 기본','1,007/1,300 (77.46%)','341/1,300 (26.23%)','실측']
 ],'계산: 정답 809−255+314=868; 환각 297−96+99=300. 405건은 PI·HR·SR 각 100 + NC 56 + MC 49건이다. 나머지 NC 44·MC 51건도 기준선으로 유지했다.',['off_tuned_compare','off_compare_script']))
SECTIONS[0]['limits'].extend([
 'OFF 최종 t1c는 PI·HR·SR + NC·MC 집중 목록 500건만 Judge가 있다. 전체 1,300건의 최종 튜닝 정답률은 없다.',
 'OFF 최종 튜닝과 Instruct는 모델뿐 아니라 프롬프트·로컬/EC2 환경·실제 키 출력 순서도 다르다. 이는 측정된 두 조합의 비교이며 순수 모델 교체 효과의 분리 실험은 아니다.',
 '정답률만으로 t1c를 최고라고 고정하지 않았다. t1은 환각이 적고 t1c는 일부 범위에서 정답이 많아, 목적에 따라 평가가 달라진다.'
 ,'미측정 문항 유지 합성값은 전수 실행 결과가 아니다. 참고로 정규 PI·HR·SR 300건만 t1c로 대체하고 나머지 1,000건을 유지하면 정확도 63.69%·환각 23.92%다. 두 가정의 결과를 섞지 않는다.'
])
SECTIONS[0]['sources'].extend(['off_tuned_compare','off_transfer','off_compare_script','off_compare_sources'])

planner=next(s for s in SECTIONS if s['id']=='planner')
planner['findings'].insert(0,finding('추가 발굴: 멀티턴 맥락 보완 전의 동일 질문 검색 기준선',
 '10/15 저장 자료에서 이전 대화가 있는 59문항 중 정답 FAQ가 주석된 41문항을 동일 ID로 비교했다. 이력 없이 사용자 원문만 검색하면 정답 FAQ를 모두 찾은 문항은 16/41(39.02%), 이력을 바탕으로 재작성한 검색어로 검색하면 29/41(70.73%)이다. 새 적중 15·적중 소실 2, 순증 13건·31.71%p(p=0.00235)다. 원문 검색은 저장된 벡터 검색 기준선이며 전체 구버전 API 실행이나 최종 답변 정확도를 뜻하지 않는다.',
 ['mt_baseline','mt_baseline_script','mt_baseline_sources'],'저장 검색 결과 재집계'))
planner['findings'].insert(1,finding('같은 답변 질문의 이력 미전달 A / 메시지 전달 D 실험도 존재',
 'answer-eval.jsonl과 answer-eval-plain-D.jsonl 각각에 주입 없는 공통 A/D 19문항이 있다. 질문과 검색어·FAQ ID는 19쌍 모두 같고, A는 답변 LLM에 이력을 주지 않으며 D는 이전 user/assistant 메시지를 준다. 두 파일은 같은 19개 ID이므로 38개 독립 문항으로 합치지 않는다. 검색은 양쪽 모두 이미 이력으로 재작성한 search를 사용하므로 답변 단계의 이력 전달만 비교한 실험이다. 이 19쌍의 정답·환각을 전수 짝 채점한 저장 Judge는 찾지 못했다.',
 ['mt_answer_conditions','mt_baseline','mt_old_handoff'],'동일 문항 응답 기록'))
planner['tables'].insert(0,table('멀티턴 이전 맥락을 보완하지 않은 원문 검색과 비교',['대상·지표','원문 검색','이력 기반 재작성 검색','변화'],[
 ['정답 FAQ가 있는 이력 문항 41건: 모든 의도 적중','16/41 (39.02%)','29/41 (70.73%)','+13건·31.71%p'],
 ['정답 FAQ가 있는 41건: 틀린 FAQ만 기준 통과','9/41','7/41','−2건'],
 ['정답 FAQ가 있는 41건: 기준 통과 FAQ 없음','16/41','5/41','−11건'],
 ['정답 FAQ 없는 이력 문항 18건: 관련 없는 FAQ 기준 통과','5/18','9/18','+4건 / 답변 환각 판정은 아님']
 ],'10/15 탐색 실험·BGE-M3·질문 벡터 top3·유사도≥0.75. 정답은 Claude가 만든 FAQ ID 주석이며 사람 검수 전이다. 현재 최종 파이프라인의 멀티턴 ON/OFF 최종 정답률과 구분한다.',['mt_baseline','mt_baseline_sources']))
planner['tables'].insert(1,table('직접 실행된 답변 이력 조건 비교',['실험','이력 미전달','이력 전달','동일 질문 쌍'],[
 ['하위 질문 제목을 포함한 답변 입력','A: 이전 대화 없음','D: user/assistant 메시지','19'],
 ['하위 질문 제목 없는 평평한 FAQ 목록','A: 이전 대화 없음','D: user/assistant 메시지','같은 19개 ID']
 ],'인위적 오류 주입 조건은 제외했다. FAQ 검색은 두 조건 모두 이미 이력 기반 검색어를 사용한다. 저장된 응답은 있으나 이 19쌍에 대한 전수 정확도·환각 Judge 수치는 없다.',['mt_answer_conditions','mt_baseline']))
planner['limits'].extend([
 '위 41건 수치는 멀티턴 검색 맥락 보완의 이득이다. “멀티턴 도입으로 최종 답변 정확도 39%→71%”라고 표현하면 안 된다.',
 '59건 중 정답 FAQ 없는 18건은 별도로 보았다. 재작성으로 검색 통과가 늘어도 정답 근거가 없는 문항에서는 답변 단계의 보류·근거 통제가 필요하다.',
 '멀티턴 완전 미적용 vs 현재 최종 전체 파이프라인을 동일 문항으로 실행·전수 Judge한 결과는 이번 조사에서 찾지 못했다. 답변 이력 A/D 19쌍과 검색 원문/재작성 비교를 대신 구분해 보존했다.'
])
planner['sources'].extend(['mt_baseline','mt_baseline_script','mt_baseline_sources','mt_answer_conditions','mt_old_handoff'])

DATA=dict(title='UBot 발표 근거 수집',date='2026-10-26',scope='기존 결과와 현재 소스의 근거만 수집. 슬라이드 수정·신규 LLM 호출·서비스 실행 없음.',
 overview=[
  '모델: OFF 최종 튜닝 t1c와 Instruct 기본형의 공통 405건에서 정답 77.53%→85.19%(+7.65%p), 환각 24.44%→22.96%(유의하지 않음). 튜닝 전 대비 +15.3%p와 구분한다.',
  '프롬프트: 공통 900건 환각 20.44%→13.56%, 정확도 78.11%→77.56%. 정확도 향상보다 환각·되묻기 억제가 주효과다.',
  'slot: 최초 single 대비 상태 일치 +9.23%p, 모델 고지 −55.14%p. 정확도·환각 개선의 통계적 근거는 약하다.',
  '판단 로직: 분리 수 일치 81→90/100, 원문 무분리 검색 대비 FAQ 적중 161→182/201, 최종 390건 중 판단 호출 174건 생략.',
  '스케줄러·매장·길찾기: 팀 전체 현재 구현의 역할·기준·기본 주기를 모았다.'
 ],sections=SECTIONS,methods=[
 '원본 scored case_scores.jsonl과 완료된 Judge paths.jsonl을 읽어 문항 ID로 비교했다. 원본 파일은 변경하지 않았다.',
 '품질 비교는 양쪽 모두 Judge가 있는 공통 문항만 분모에 넣었다. 코드 보류·미채점·실행 오류를 정답이나 환각 없음으로 자동 처리하지 않았다.',
 'p값은 대응 문항의 개선/악화 건수에 대한 양측 exact McNemar 검정이며 다중 비교 보정을 하지 않은 탐색 결과다. 단회 실행의 변동·Judge 오류·튜닝셋 재사용 한계를 없애지는 않는다.',
 '정확도·환각은 각 단계의 LLM Judge 정의에 따른 값이다. 버전별 데이터·루브릭 차이를 넘어서 직접 비교하지 않는다.',
 '분리 개수 일치, 검색 적중, 최종 정답, 최종 상태 일치, 고지 패턴은 서로 다른 지표다.',
 '소스 경로·줄 번호·SHA-256·핵심 발췌는 source_extracts.json, 재집계 입력 해시는 metric_sources.json에 보존했다. gain/loss 문항 ID는 recomputed_metrics.json에 있다.'
 ],gaps=[
 '최종 Instruct w4a16/vLLM 조합의 동일 품질 기준 동시성 실측',
 '현재 faq-system-slot.txt 전체 조합을 프롬프트 기준선과 비교한 동일 문항 전수 Judge',
 '판단 가드·원문 전용 입력 각각의 최종 답변 환각 감소를 분리한 독립 A/B',
 '이력 원문 전환 등 후속 코드 변경을 반영한 기존 200건 재실행',
 '실제 배포 환경변수·DB 스케줄러 활성값·실행 성공률 (현재 자료는 코드 기본값)'
 ],sources=[{k:v for k,v in s.items() if k!='excerpts'} for s in SOURCES.values()])

(OUT/'evidence_review.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'source_extracts.json').write_text(json.dumps(list(SOURCES.values()),ensure_ascii=False,indent=2),encoding='utf-8')

# Single-file canvas. No dynamic imports, network calls or source reads in the UI.
canvas = '''import { Button, Callout, CollapsibleSection, Divider, Grid, H1, H2, H3, Link, Row, Stack, Stat, Table, Text, useState, useHostTheme, useCanvasAction } from 'cursor/canvas';
const DATA = __DATA__;
export default function UBotEvidence() {
 const theme = useHostTheme();
 const dispatch = useCanvasAction();
 const [selected,setSelected] = useState('overview');
 const sourceMap = Object.fromEntries(DATA.sources.map(s=>[s.id,s]));
 const sources = (ids: string[]) => <Row gap={8} wrap>{Array.from(new Set(ids)).map(id=>{const s=sourceMap[id]; return <Button key={id} variant="ghost" onClick={()=>dispatch({type:'openFile',path:s.path,selection:{startLineNumber:s.line,startColumn:1,endLineNumber:s.line,endColumn:1}})}>{id} : {s.line}</Button>})}</Row>;
 const section = DATA.sections.find(s=>s.id===selected);
 return <Stack gap={20} style={{maxWidth:1250,margin:'0 auto',padding:24,color:theme.text.primary}}>
  <H1>{DATA.title}</H1>
  <Text tone="secondary">{DATA.date} · {DATA.scope}</Text>
  <Grid columns={3} gap={20}>
   <Stat value="−6.89%p" label="프롬프트 환각률 / 공통 900건" />
   <Stat value="67 → 1" label="모델·코드 이중 고지 / sub→slot 390건" />
   <Stat value="44.6%" label="판단 LLM 호출 생략 / slot 390건" />
  </Grid>
  <Row gap={8} wrap><Button variant={selected==='overview'?'primary':'secondary'} onClick={()=>setSelected('overview')}>수집 결과·해석 범위</Button>{DATA.sections.map(s=><Button key={s.id} variant={selected===s.id?'primary':'secondary'} onClick={()=>setSelected(s.id)}>{s.title}</Button>)}</Row>
  <Divider />
  {selected==='overview' ? <Stack gap={18}>
   <H2>우선 확보한 핵심 근거</H2>{DATA.overview.map((t,i)=><Text key={i}>{t}</Text>)}
   <H2>아직 수치로 입증하지 못한 부분</H2>{DATA.gaps.map((t,i)=><Text key={i} tone="secondary">{i+1}. {t}</Text>)}
   <CollapsibleSection title="재집계 기준·자료 파일" defaultOpen><Stack gap={12}>{DATA.methods.map((t,i)=><Text key={i}>{t}</Text>)}<Text>원본 결과·프로그램은 evidence_20261026 폴더에 있습니다.</Text><Row gap={8} wrap>{['evidence_review.json','recomputed_metrics.json','off_tuned_vs_instruct.json','off_tuned_vs_instruct_sources.json','metric_sources.json','source_extracts.json','compute_evidence.py','compare_off_instruct.py'].map(n=><Button key={n} variant="ghost" onClick={()=>dispatch({type:'openFile',path:'__OUT__/'+n})}>{n}</Button>)}</Row></Stack></CollapsibleSection>
  </Stack> : section && <Stack gap={22}>
   <H2>{section.title}</H2><Callout tone="neutral">{section.summary}</Callout>
   {section.findings.map((f,i)=><Stack key={i} gap={6}><H3>{f.title}</H3><Text>{f.body}</Text><Text tone="tertiary" size="small">근거 유형: {f.strength}</Text>{sources(f.sources)}</Stack>)}
   {section.tables.map((t,i)=><Stack key={i} gap={8}><H3>{t.title}</H3><Table headers={t.headers} rows={t.rows}/><Text tone="secondary" size="small">{t.caption}</Text>{sources(t.sources)}</Stack>)}
   <CollapsibleSection title="해석할 때 지킬 경계" defaultOpen><Stack gap={10}>{section.limits.map((t,i)=><Text key={i}>{i+1}. {t}</Text>)}</Stack></CollapsibleSection>
   <CollapsibleSection title="원본 위치·SHA-256" count={section.sources.length}><Table headers={['근거','원본 경로·줄','SHA-256']} rows={section.sources.map(id=>{const s=sourceMap[id];return [id,<Text size="small">{s.path}:{s.line}</Text>,<Text size="small" style={{overflowWrap:'anywhere'}}>{s.sha256}</Text>]})}/></CollapsibleSection>
  </Stack>}
 </Stack>;
}
'''.replace('__DATA__',json.dumps(DATA,ensure_ascii=False)).replace('__OUT__',OUT.as_posix())
(OUT/'UBot-evidence.canvas.tsx').write_text(canvas,encoding='utf-8')

# Portable review copy uses the same curated data and has no external dependencies.
def esc(t): return html.escape(str(t))
def refs(ids):
    return '<p class="sources">出典: '+ ' · '.join(f'<span title="{esc(SOURCES[k]["path"])}">{esc(k)} : {SOURCES[k]["line"]}</span>' for k in ids)+'</p>'
parts=[]
for s in SECTIONS:
    body=f'<section id="{s["id"]}"><h2>{esc(s["title"])}</h2><p class="lead">{esc(s["summary"])}</p>'
    for f in s['findings']:
        body+=f'<h3>{esc(f["title"])}</h3><p>{esc(f["body"])}</p>'+refs(f['sources'])
    for t in s['tables']:
        body+=f'<h3>{esc(t["title"])}</h3><div class="scroll"><table><thead><tr>'+''.join(f'<th>{esc(x)}</th>' for x in t['headers'])+'</tr></thead><tbody>'
        body+=''.join('<tr>'+''.join(f'<td>{esc(c)}</td>' for c in r)+'</tr>' for r in t['rows'])
        body+='</tbody></table></div><p class="caption">'+esc(t['caption'])+'</p>'+refs(t['sources'])
    body+='<details open><summary>해석할 때 지킬 경계</summary><ul>'+''.join(f'<li>{esc(x)}</li>' for x in s['limits'])+'</ul></details>'
    body+='<details><summary>원본 파일·줄·SHA-256</summary>'+''.join(f'<p class="path">{esc(k)}<br>{esc(SOURCES[k]["path"])}:{SOURCES[k]["line"]}<br>{SOURCES[k]["sha256"]}</p>' for k in s['sources'])+'</details></section>'
    parts.append(body)
page='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UBot 발표 근거 수집</title>
<style>:root{color-scheme:light dark}body{font-family:"Malgun Gothic",sans-serif;max-width:1180px;margin:auto;padding:24px;line-height:1.7}h1{font-size:26px}h2{font-size:22px;margin-top:36px}h3{font-size:17px;margin-top:26px}nav{position:sticky;top:0;background:Canvas;padding:12px 0;border-bottom:1px solid GrayText;display:flex;flex-wrap:wrap;gap:14px}nav a{color:LinkText}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid GrayText;padding:10px;text-align:left;vertical-align:top}th{white-space:nowrap}.scroll{overflow:auto}.lead{font-size:17px}.sources,.caption,.path{font-size:12px;color:GrayText}.path{overflow-wrap:anywhere}section{border-bottom:1px solid GrayText;padding-bottom:32px;scroll-margin-top:70px}details{margin:20px 0}summary{cursor:pointer;font-weight:bold}li{margin-bottom:8px}@media print{nav{position:static}details{break-inside:avoid}body{max-width:none}}</style>
<h1>UBot 발표 근거 수집</h1><p>2026-10-26 · 슬라이드 수정 없음 · 기존 결과 재집계와 현재 코드 확인</p>
<nav><a href="#overview">수집 결과</a>__NAV__</nav><section id="overview"><h2>우선 확보한 핵심 근거</h2>__OVERVIEW__<h3>아직 정량 입증이 없는 부분</h3><ul>__GAPS__</ul><details><summary>재집계 방법</summary>__METHODS__</details><p>상세 원본 발췌는 source_extracts.json, 변화 문항 ID와 검정은 recomputed_metrics.json을 참고하세요. 이 HTML의 근거 ID는 해당 JSON과 일치합니다.</p></section>__BODY__</html>'''
page=page.replace('__NAV__',''.join(f'<a href="#{s["id"]}">{esc(s["title"])}</a>' for s in SECTIONS)).replace('__OVERVIEW__',''.join(f'<p>{esc(t)}</p>' for t in DATA['overview'])).replace('__GAPS__',''.join(f'<li>{esc(t)}</li>' for t in DATA['gaps'])).replace('__METHODS__',''.join(f'<p>{esc(t)}</p>' for t in DATA['methods'])).replace('__BODY__',''.join(parts))
page=page.replace('出典:','근거:')
(OUT/'evidence_review.html').write_text(page,encoding='utf-8')
package_names=['evidence_review.html','evidence_review.json','source_extracts.json','recomputed_metrics.json','metric_sources.json','pipeline_format_recovery.txt','compute_evidence.py','build_review.py','UBot-evidence.canvas.tsx','compare_off_instruct.py','off_tuned_vs_instruct.json','off_tuned_vs_instruct_sources.json','off_t1c_focus_paths.jsonl','off_t1c_regular_paths.jsonl','collect_multiturn_baseline.py','multiturn_before_after.json','multiturn_before_after_sources.json']
(OUT/'package_manifest.json').write_text(json.dumps([dict(file=n,sha256=hashlib.sha256((OUT/n).read_bytes()).hexdigest(),bytes=(OUT/n).stat().st_size) for n in package_names],ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(OUT/'UBot_발표_근거모음_20261026.zip','w',zipfile.ZIP_DEFLATED) as z:
    for n in package_names+['package_manifest.json']:z.write(OUT/n,n)
print(json.dumps(dict(sections=len(SECTIONS),sources=len(SOURCES),tables=sum(len(s['tables']) for s in SECTIONS),files=[p.name for p in OUT.iterdir()]),ensure_ascii=False))
