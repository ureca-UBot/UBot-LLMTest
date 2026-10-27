import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const DIR='C:/Ureka/ureca_project2/LLM_Test/presentation_work/revision_20261026_feedback1';
const ROOT='C:/Ureka/ureca_project2/LLM_Test';
const BE='C:/Ureka/ureca_project2/BackEnd';
const RT='C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const SKILL='C:/Users/pc/.codex/plugins/cache/openai-primary-runtime/presentations/26.1024.11018/skills/presentations';
const {Presentation,PresentationFile}=await import(pathToFileURL(`${RT}/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs`).href);
const {applyPresentationChartFont}=await import(pathToFileURL(`${SKILL}/container_tools/artifact_tool_utils.mjs`).href);
const ref=JSON.parse(await fs.readFile(`${DIR}/template.json`,'utf8'));
ref.slides=[{...ref.slides[12],elements:[],notesSlide:undefined}];ref.charts=[];
const P=Presentation.load(ref);
const D=JSON.parse(await fs.readFile(`${DIR}/slide_metrics.json`,'utf8'));
const C={bg:'#F6F7F8',pink:'#F72585',black:'#17171A',gray:'#686B72',line:'#DDDDE1',white:'#FFFFFF',pale:'#FFF1F7',dark:'#32142F'};
const FONT='맑은 고딕';let used=false,uid=0;const stages=[];
function text(s,t,x,y,w,h,size=24,color=C.black,bold=false,align='left'){
 const a=s.shapes.add({geometry:'textbox',name:`own-text-${++uid}`,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 a.text=t;a.text.style={fontSize:size,typeface:FONT,color,bold,alignment:align,verticalAlignment:'top',autoFit:'none',wrap:'square',insets:0};return a;
}
function rule(s,x,y,w,color=C.line,width=1){return s.shapes.add({geometry:'line',name:`rule-${++uid}`,position:{left:x,top:y,width:w,height:0},fill:'none',line:{style:'solid',fill:color,width}});}
function base(section,title,subtitle,foot){
 const s=used?P.slides.add():P.slides.items[0];used=true;s.background.fill=C.bg;
 text(s,section,66,44.1,1200,31.5,17.333,C.pink,true);
 text(s,title,66,79.8,1260,74,45.333,C.black,true);
 text(s,subtitle,66,157.5,1260,41,20,C.gray);
 text(s,'UBot',66,745.9,250,26,17.333,C.gray);
 text(s,String(P.slides.items.length).padStart(2,'0'),1300,745.9,74,26,17.333,C.gray,false,'right');
 if(foot)text(s,foot,66,foot.startsWith('시험:')?684:694,1308,foot.startsWith('시험:')?48:42,foot.startsWith('시험:')?18:15.4,C.gray);
 return s;
}
function table(s,values,x,y,width,height,widths,size=22,highlight=[]){
 const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width,height,values,columnWidths:widths});
 t.borders.assign({style:'solid',fill:C.line,width:.7});
 t.cells.block({row:0,column:0,rowCount:values.length,columnCount:values[0].length}).assign({textStyle:{typeface:FONT,fontSize:size,color:C.black},margins:size<20?{left:10,right:8,top:4,bottom:4}:{left:14,right:12,top:9,bottom:8},anchor:'center'});
 values.forEach((r,ri)=>{t.rows[ri].height=height/values.length;r.forEach((_,ci)=>{const c=t.getCell(ri,ci);c.fill=ri===0?C.black:(highlight.includes(ri)?C.pale:C.white);c.text.style={typeface:FONT,fontSize:size,color:ri===0?C.white:(highlight.includes(ri)?C.pink:C.black),bold:ri===0||highlight.includes(ri),verticalAlignment:'middle',autoFit:'none'};});});return t;
}
function node(s,t,x,y,w,h,{fill=C.white,color=C.black,size=23}={}){
 const a=s.shapes.add({geometry:'rect',name:`pipeline-${++uid}`,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:C.line,width:1}});
 a.text=t;a.text.style={fontSize:size,typeface:FONT,color,bold:true,alignment:'center',verticalAlignment:'middle',autoFit:'none',insets:8};return a;
}
function arrow(s,a,b,fromSide='right',toSide='left'){
 return s.shapes.connect(a,b,{kind:fromSide==='right'&&toSide==='left'?'straight':'elbow',fromSide,toSide,line:{style:'solid',fill:C.pink,width:2},tail:{type:'triangle',width:'sm',length:'sm'}});
}
function note(s,script,details,files,seconds){s.speakerNotes.text=`발표 메모 (${seconds}초)\n${script}\n\n비교 조건과 해석\n${details}\n\n근거\n${files.join('\n')}`;stages.push({slide:P.slides.items.indexOf(s)+1,seconds,title:String(script).slice(0,40)});}
function bar(s,categories,series,x,y,w,h,max=100){
 const c=s.charts.add('bar',{position:{left:x,top:y,width:w,height:h},categories,series,barOptions:{direction:'column',grouping:'clustered',gapWidth:110},hasLegend:series.length>1,legend:{position:'bottom',textStyle:{fontSize:18,fill:C.gray}},chartFill:'none',chartLine:{fill:'none',width:0},plotAreaFill:'none',plotAreaLine:{fill:'none',width:0},xAxis:{textStyle:{fontSize:19,fill:C.black},line:{fill:C.line,width:1},majorGridlines:null},yAxis:{min:0,max,majorUnit:max===12?3:5,textStyle:{fontSize:17,fill:C.gray},majorGridlines:{fill:C.line,width:.7},line:{fill:'none',width:0}},dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.0',textStyle:{fontSize:23,fill:C.black,bold:true}}});applyPresentationChartFont(c,{fontFamily:FONT});return c;
}

// 1. Initial screening, error types and operating burden.
{
 const s=base('AI 품질 고도화  |  모델 선정','1차 후보 선별과 4B 튜닝 대상 선정','초기 9종에서 후보를 줄인 뒤, 7종·11설정을 전수 평가한 정답률과 환각률',
 '시험: 단일·유사·다중 FAQ, 개인화·조건·예외, 근거 부재·충돌, 멀티턴, 공격·범위 밖, API(13유형)\n평가: 필수 사실·조건·답변 가능 여부를 만족하면 정답, 근거 밖 내용은 환각. 형식·일관성·지연·메모리·동시성도 고려.');
 table(s,[['300문항 전수 평가','정답률','환각률','제외·후순위 근거'],
 ['Gemma3 4B','31.3%','50.3%','답 없는 질문에 취약'],
 ['Qwen3 1.7B ON','39.0%','43.0%','내용 품질 부족'],
 ['Qwen3 4B ON','72.3%','13.7%','95% 응답 47.6초 이내'],
 ['Qwen3 8B ON','59.7%','26.8%','품질·지연 모두 검토'],
 ['EXAONE 7.8B','37.3%','53.3%','보류 대상 88건 실패'],
 ['Gemma3 12B','64.0%','21.3%','모델 크기·조건 판단'],
 ['Qwen3 14B ON','75.6%','24.7%','95% 응답 28.5초 이내'],
 ['Qwen3 1.7B OFF','23.0%','56.7%','내용 품질 부족'],
 ['Qwen3 4B OFF','43.7%','29.0%','이후 4B 튜닝 후보'],
 ['Qwen3 8B OFF','43.7%','26.0%','4B 튜닝 후 확장 후보'],
 ['Qwen3 14B OFF','70.7%','23.7%','1차 MVP·서빙 부담 검토']
 ],66,218,760,408,[225,120,120,295],18.3,[9]);
 text(s,'앞서 Qwen 0.6B·Gemma 270M/1B·EXAONE 2.4B는 형식·내용 문제로 제외\n해당 후보는 전수 정답률·환각률 평가가 없어 표에 넣지 않음',66,636,760,45,16.7,C.gray);
 text(s,'4B 후보 재평가 (약 2,600건)',866,218,510,35,24,C.black,true);
 table(s,[['모델','정답률','환각률'],['Gemma3 4B','65.1%','24.1%'],['Qwen3 4B OFF','63.0%','22.0%']],866,264,510,112,[250,130,130],19.3,[2]);
 text(s,'Gemma: 계산·조건 오류와 근거 밖 보충',866,397,510,34,21.3);
 text(s,'Qwen: 오답 중 과잉 보류 36.6%\n답하도록 프롬프트로 교정할 여지를 고려',866,445,510,61,21.3,C.pink,true);
 text(s,'동시 32명, 초당 완료 요청 수 (L4·30초 시험)',866,516,510,27,17.3,C.gray);
 bar(s,['4B','8B','14B'],[{name:'HTTP 완료 RPS',values:[9.13,6.10,3.33],fill:C.pink}],866,552,510,125,12);
 note(s,'여러 모델에 같은 FAQ 문제를 주고 정답과 환각을 전수 평가했습니다. 단순 답변뿐 아니라 유사 문서 구분, 조건과 예외, 근거가 없을 때의 보류, 멀티턴과 공격 대응을 봤습니다. 큰 모델은 정확도가 높아도 동시 서빙 부담이 있었습니다. 이후 4B를 다시 평가했을 때 Gemma가 조금 더 정확했지만, Qwen은 오답의36.6%가 과잉 보류여서 프롬프트로 고칠 여지를 보고 튜닝 대상으로 골랐습니다.',
 'v2 try1=9모델, 표본 검수 26건과 결정론 형식 지표. v2 try2 Qwen1.7B 정답47%=300건 Judge. v3 EXAONE7.8B 기대 ABSTAIN88건 중0; Qwen4B ON P95 47.6초. v3의 1차 MVP는 Qwen14B OFF였고, v4에서 작은4B 모델의 튜닝을 검토했다. 이를 처음부터4B가 전 지표 최고였다고 설명하지 않는다. v4 오답 중 과잉보류 Qwen352/962=36.6%, Gemma32/908=3.5%. Qwen 실제로 답한 문항의 정확도77%는 선택 편향이 있어 전체 정확도로 쓰지 않는다. L4 vLLM P32/U32 30초 단회 RPS4B9.13/8B6.10/14B3.33은 이전 Qwen3 계열, 최종 Instruct w4a16 직접 측정이 아니다. 품질 및 지연 SLO를 적용한 보장 수용량도 아니다.',
 [`${ROOT}/model_test_v2/try1/results/all_summary.md`,`${ROOT}/model_test_v2/try2/results/all_summary.md`,`${ROOT}/model_test_v3/try1/results/all_summary.md`,`${ROOT}/model_test_v3/try1/results/summary/model_selection.md`,`${ROOT}/model_test_v4/try1/results/summary/brief_report.md`,`${ROOT}/model_test_v4/try1/results/summary/tuning_target_decision.md`,`${ROOT}/servingtest/l4/reports/L4_MULTIMODEL_RESULTS_20261006.md`],32);
}

// 2. A fair matched cohort, plus full-suite Q4/Q8 evidence.
{
 const s=base('AI 품질 고도화  |  모델 선정','2차 모델 비교와 Instruct Q4 선정','기본 프롬프트의 Instruct도 OFF 최종 튜닝보다 정확했고, Q4의 자원 효율을 고려',
 '시험: 부분 답변·무관 FAQ·답 없는 유사 문서·유사/다중 FAQ(공통 404건), 양자화 비교는 13유형 1,300건\n고려: 정답·환각뿐 아니라 오답 유형·프롬프트 교정 가능성, 응답 시간·가중치 크기와 동시 서빙 여유.');
 const labels=[['OFF','Qwen3 4B OFF · 초안'],['OFF_t1c','Qwen3 4B OFF · 최종 개선'],['Gemma_Q4','Gemma3 4B · Q4_K_M'],['Gemma_QAT','Gemma3 4B · QAT'],['Instruct_Q4','Qwen3 4B Instruct · Q4'],['Instruct_Q8','Qwen3 4B Instruct · Q8']];
 const values=[['모델·프롬프트','정확도','환각률']];
 for(const [key,label] of labels){const d=D.models_common[key];values.push([label,`${(100*d.correct/d.n).toFixed(2)}%`,`${(100*d.hallucination/d.n).toFixed(2)}%`]);}
 table(s,values,66,218,850,340,[508,171,171],22.6,[5]);
 text(s,'Q4와 Q8의 품질 차이',956,218,420,35,25.3,C.black,true);
 text(s,'정확도 77.5% / 78.8%\n환각률 26.2% / 26.5%',956,276,420,72,24);
 text(s,'통계적으로 뚜렷한 차이는 확인되지 않음',956,365,420,30,18.6,C.gray);
 text(s,'Q4의 운영 자원 이점',956,420,420,35,25.3,C.pink,true);
 text(s,'평균 응답 2.61초 / 3.49초\n가중치 2.5GB / 4.3GB',956,472,420,72,23.3);
 rule(s,66,586,1308);
 text(s,'선정 근거',66,610,180,32,25.3,C.pink,true);
 text(s,'OFF 튜닝 이후에도 정답 우위가 남음\n추측·확인 경로 덧붙임은 후속 프롬프트 교정 대상으로 구체화',270,609,1100,66,25.3);
 note(s,'OFF를 튜닝한 뒤에도 Instruct의 정답 이점이 남았습니다. 기본 프롬프트만 적용한 Instruct Q4가 마지막 OFF 튜닝보다 공통 표본에서 더 정확했습니다. Q8은 전체 평가에서 정확도와 환각 차이가 유의하지 않았지만 응답 시간과 가중치 용량이 늘었습니다. 그래서 Q4를 택하고, 남은 추측성 덧붙임을 프롬프트로 교정했습니다.',
 '공통404건은 OFF 초안254정답96환각, t1c313/99, GemmaQ4 283/120, GemmaQAT290/172, InstructQ4 344/93, InstructQ8 354/90. GemmaQAT HR-0163 미채점1건을 제외했다. t1c와Instruct만 비교한405건=314/99 vs345/93, 정확도+7.65%p(p=.00117), 환각 차이 유의하지 않음(p=.645). NC·MC는 OFF 오답을 집중한 표본으로 전체 정확도의 대표 표본이 아니다. 미측정895건을 OFF 기준선 유지한 t1c 합성1,300건 정확도66.77%,환각23.08%는 실측이 아니므로 본문 표에 넣지 않았다. Q4/Q8 1,300건 정답77.5/78.8 환각26.2/26.5 p=.22/.85. 평균응답2.61/3.49초·파일2.5/4.3GB는 T4 순차측정이고 Q4와Q8의 동시성 직접 비교가 아니다. 4bit가 동시 서빙 여유에 유리할 것으로 고려한 판단과 실측을 구분한다. Instruct의 답먼저 키 순서와 모델·프롬프트·로컬/EC2 환경 차이가 섞여 순수 모델 단독 효과는 아니다.',
 [`${DIR}/slide_metrics.json`,`${ROOT}/presentation_work/evidence_20261026/off_tuned_vs_instruct.json`,`${ROOT}/model_test_v5/try1/results/summary/quantization_decision.md`,`${ROOT}/model_test_v5/try1/results/summary/cause_breakdown.md`],29);
}

// 3. Prompt gains, with the unchanged accuracy and remaining regressions disclosed.
{
 const s=base('AI 품질 고도화  |  프롬프트','프롬프트 개선으로 환각과 되묻기 감소','Qwen3 4B Instruct Q4, 동일 900문항의 기본 프롬프트와 개선 프롬프트 비교',
 '전체 정답 수는 늘지 않았고, 무관 FAQ 유형은 94/100에서 82/100으로 하락. 기본·개선 프롬프트의 같은 900문항 비교.');
 text(s,'환각·되묻기 발생률 (%)',66,218,600,32,23.3,C.gray,true);
 bar(s,['환각','되묻기'],[{name:'기본 프롬프트',values:[20.44,14],fill:'#B9BAC1'},{name:'개선 프롬프트',values:[13.56,.11],fill:C.pink}],66,267,604,310,25);
 table(s,[['동일 900문항','기본','개선'],['정답','703','698'],['환각','184','122'],['되묻기','126','1'],['FAQ ID 노출','147','77'],['반복 표현','303','234']],730,218,644,360,[284,180,180],24,[2,3]);
 text(s,'환각 6.89%p 감소',66,606,610,43,34.7,C.pink,true);
 text(s,'필수 조건·최종 값 유지\n한계 고지는 한곳에서 한 문장으로',730,609,644,65,25.3,C.black,true);
 note(s,'프롬프트로 가장 크게 줄인 것은 환각과 불필요한 되묻기입니다. 같은900문항에서 환각은184건에서122건, 되묻기는126건에서1건으로 줄었습니다. 50자 제한으로 생긴 누락을 되돌리고, 중복된 고지 지시를 한곳으로 모았습니다. 다만 전체 정확도 상승은 확인되지 않았고, FAQ번호와 반복 표현은 여전히 남아 다음 출력 구조 개선으로 이어졌습니다.',
 'base→i4 정답703→698/900 p=.73988. 환각184→122=−6.89%p 상대−33.7%, McNemar p=.00000168. asks126→1. FAQID147→77. 반복303→234는 문서의4범주(불가문장이중화/따라서재진술/문장재진술/질문복사) 코드집계이며 단순동일문장반복 규칙은900건모두0이다. 다음slot슬라이드의 반복고지81→0 또는 문장2gram재진술22→22와 같은 지표·표본이 아니므로 234→0으로 이어붙이지 않는다. 현재 백엔드는 파생slot프롬프트를 쓰며13.56%는 전체최종파이프라인환각률이 아니다.',
 [`${ROOT}/prompts_test_v7/try1/results/llm_judge/pv7-try1_variant_compare_vs_v4_base.md`,`${ROOT}/prompts_test_v7/try1/results/summary/failure_analysis.md`,`${ROOT}/prompts_test_v7/SETUP.md`],24);
}

// 4. Requested editable pipeline, and a shared retrieval baseline.
{
 const s=base('AI 품질 고도화  |  판정 LLM','판정 LLM 파이프라인과 검색 효과','분류기로 필요한 질문을 고르고, 판정 검색어는 코드 검사 후 FAQ 검색에 사용',
 '전체 기능 평가 200건과 별도 질문 분리 100건을 시험. 아래는 질문 분리 100건 전체의 같은 질문·정답 FAQ 비교.');
 const q=node(s,'사용자 원문',66,231,191,73);
 const route=node(s,'분류기',303,231,191,73,{fill:C.pale});
 const orig=node(s,'원문 우선 검색',540,231,241,73);
 const filt=node(s,'FAQ·문장 검사',827,231,241,73);
 const ans=node(s,'답변 LLM',1114,231,260,73,{fill:C.black,color:C.white});
 arrow(s,q,route);arrow(s,route,orig);arrow(s,orig,filt);arrow(s,filt,ans);
 const plan=node(s,'판정 LLM',303,378,191,73,{fill:C.pale});
 const guard=node(s,'검색어 변형 검사',540,378,241,73);
 const search=node(s,'하위 질문별 검색',827,378,241,73);
 arrow(s,route,plan,'bottom','top');arrow(s,orig,plan,'bottom','top');arrow(s,plan,guard);arrow(s,guard,search);arrow(s,search,filt,'top','bottom');
 text(s,'분리·멀티턴 표지\n또는 첫 검색 실패',66,375,215,73,21.3,C.gray);
 text(s,'질문 원문·원문 조각과\n통과한 자료를 전달',1114,375,260,73,21.3,C.gray);
 table(s,[['질문 분리 전체 100건','판정 없이 검색','초기 판정','개선 판정'],['모든 정답 FAQ 검색','69 / 100','81 / 100','84 / 100'],['의도별 정답 FAQ 검색','161 / 201','181 / 201','182 / 201'],['질문 개수 맞게 나눔','—','81 / 100','90 / 100']],66,513,1308,165,[411,299,299,299],21.3,[1,3]);
 note(s,'여러 질문을 나누고 생략된 대상을 복원하기 위해 판정 모델을 도입했습니다. 분리나 멀티턴 표지가 없는 질문은 먼저 원문으로 검색하고, 기준을 통과하면 판정을 건너뜁니다. 질문 분리100건 전체에서 필요한FAQ를 모두 찾은 문항은 판정 없이69건, 초기 판정81건, 개선 판정84건입니다. 질문 개수를 맞게 나눈 문항도81건에서90건이 됐습니다. 이는 답변 정확도가 아니라 검색과 분리 성능입니다.',
 '별도 질문분리100건·정답의도201개. final/split/split-analysis.json의 원문·old·search 저장검색 결과에서 재집계. 모든 의도 정답 FAQ 검색=69/81/84, 의도별 FAQ 적중=161/181/182; 기준 top3·score>=.75. 질문 개수 일치=초기81/개선90. 문서의 2차 재설계 현재 운영 프롬프트와 같은 결과다. 질문·gold는 AI 생성, 사람 검수 전이고 단회 실행. 전체 기능평가200건(이력 없음141/있음59)과 별도 제작100건이므로 같은300건 전후 비교로 합산하지 않는다. 기존41건은200건에서 이력59건 중 정답FAQ가 지정된41건만 추린 초기진단이었다. 그 수치를 전체 테스트로 해석하면 안 되므로 본문에서 별도100건 전체 결과로 교체했다. 원문 검색은 저장 벡터검색 기준선이며 구버전 전체API 실측이 아니다. 초기/분류기/slot의 종단 정답·환각 완전공통4단계 자료는 없고 분류기는 실제 호출 생략 수를 다음 장에서 제시한다.',
 [`${BE}/docs/질문분리_멀티턴_테스트_보고서.md`,`C:/Ureka/ureca_project2/eval_205_multiturn/docs-evaluation/2026-10-16-split/final/split/split-analysis.json`,`${DIR}/feedback_metrics.json`],30);
}

// 5. Meaning preservation and classifier call reduction are different gains.
{
 const s=base('AI 품질 고도화  |  판정 LLM','원문 보존과 분류기로 줄인 호출','재작성 오류의 답변 전파를 줄이고, 명확한 단건 질문은 판정 LLM을 생략',
 '변형 전파 8건·3건은 선정 사례의 수동 검토. 가드 9건은 300개 출력의 탐지 사례이며 전수 환각 감소율이 아님.');
 text(s,'답변에는 사용자 원문·원문 조각',66,221,630,38,29.3,C.black,true);
 const a=node(s,'사용자 원문',66,282,240,75);const b=node(s,'답변 LLM',426,282,250,75,{fill:C.black,color:C.white});arrow(s,a,b);
 text(s,'가공한 검색어는 FAQ 검색에만 사용',66,383,610,37,23.3,C.pink,true);
 text(s,'변형이 답변에 전파된 선정 사례',66,444,610,32,21.3,C.gray);
 text(s,'8건에서 3건',66,486,610,58,40,C.pink,true);
 text(s,'원문·원문을 보존한 질문 조각 모두 76/100\n검색어 검사로 실제 변형 9/300건 탐지',66,564,610,74,21.3);
 text(s,'판정 LLM 호출 생략',744,221,630,38,29.3,C.black,true);
 table(s,[['평가 집합','생략','비율'],['이력 없는 질문','66 / 141','46.8%'],['파이프라인 최종 질문','174 / 390','44.6%'],['기본 단건 질문','49 / 50','98.0%']],744,282,630,252,[302,174,154],23.3,[2,3]);
 text(s,'390건에서 216건만 판정 호출',744,573,630,40,28,C.pink,true);
 text(s,'생략률은 판정 호출 기준\n답변·도구·재호출을 합친 전체 호출 절감률과 구분',744,627,630,55,20,C.gray);
 note(s,'판정모델이검색어를잘만들어도뜻을바꾸면답변이오염될수있습니다. 그래서검색어는검색에만쓰고답변에는원문과원문조각을줬습니다. 선정한전파사례는8건에서3건으로줄었지만이를전체환각감소율로쓰지는않았습니다. 분류기는실제390건중174건의판정호출을생략했고,기본단건은50건중49건이판정없이끝났습니다.',
 '원문/keep100건근거맞힘76/20일부/4틀림동일:원문전달이항상정답률을높인실험은아니고의미변형전파를피하려는설계다. 초기HANDOFF의선정전파사례8→3은반복실행·독립Judge의정량환각률이아니다. 가드300출력에서9개(명령6부정3)실제변형·관측오탐0,검증세트튜닝및미탐한계. 이전답변오류주입8건중2~3건전파되어이력도멀티턴에만제공. 분류기초기200평가이력없는141중66생략,이력59중4원문검색종료로합계70/200=35%는경로분석수치. 최종390trace실측은planner_called216,ORIGINAL_SEARCH_FIRST174;SA50중1호출49생략. 항상1회판정하면390회라는설계기준과대비한절감이며상태모델/도구/출력재호출등전체LLM호출은아니다. 현재네단계전체동일종단정답률자료는없다.',
 [`${BE}/docs/질문분리_멀티턴_테스트_보고서.md`,`C:/Ureka/ureca_project2/eval_205_multiturn/docs-evaluation/2026-10-15-keep-search/HANDOFF.md`,`${ROOT}/presentation_work/evidence_20261026/recomputed_metrics.json`,`${DIR}/slide_metrics.json`],30);
}

// 6. Native output objects show the precise benefit, including remaining repetition.
{
 const s=base('AI 품질 고도화  |  판정 LLM','질문별로 답변 칸을 나눠 출력 제어','질문마다 답변과 답변 가능 여부를 따로 받고, 답할 수 있는 본문만 합친 뒤 안내를 부착',
 '표는 공통 채점 337문항. 세 방식 모두 분류기 적용. 반복 고지는 모델 본문에서 불가 안내가 두 문장 이상인 경우.');
 const nodes=[node(s,'질문 1: 답할 수 있음\n질문 2: 근거가 없어 답변 보류',66,215,530,84),node(s,'답할 수 있는 본문만 합침',681,215,307,84,{fill:C.pale,size:21.3}),node(s,'서버가 안내 문구 추가',1067,215,307,84,{fill:C.black,color:C.white,size:21.3})];
 arrow(s,nodes[0],nodes[1]);arrow(s,nodes[1],nodes[2]);
 const cols=['single','sub','slot'];const vals=[['동일 337문항','답변·판정 모두 통합','판정만 질문별 분리','답변·판정 모두 분리']];
 vals.push(['정답',...cols.map(k=>`${D.pipeline[k].common_three.correct} / 337`)]);
 vals.push(['환각',...cols.map(k=>String(D.pipeline[k].common_three.hallucination))]);
 vals.push(['FAQ ID 노출',...cols.map(k=>String(D.pipeline[k].common_three.id_mentions))]);
 vals.push(['반복 고지',...cols.map(k=>String(D.pipeline[k].common_three.repeated_decline))]);
 vals.push(['일반 문장 재진술',...cols.map(k=>String(D.pipeline[k].common_three.sentence_overlap))]);
 table(s,vals,66,344,1308,267,[450,286,286,286],21.3,[3,4]);
 text(s,'모델·코드 이중 고지 67건에서 1건',66,639,810,38,28,C.pink,true);
 text(s,'판정만 나눴을 때 대비 오류 12건에서 1건',895,640,479,50,20,C.black,true);
 note(s,'프롬프트만으로남았던고지문제는출력단위를바꿔제어했습니다. 질문별칸에서답할수있는본문만남기고보류안내는코드가붙입니다. 공통337문항에서FAQ번호노출은17,3,0건이고반복고지는81,12,0건입니다. 하지만일반문장재진술은single과slot이모두22건으로남았습니다. 이개선은전체정답이나환각의일괄개선과구분해야합니다.',
 'single_v1/sub_v4/slot_v4세모드의공통Judge337문항. 정답276/257/270,환각44/30/33. Native표는모두같은337ID. 모든390건의FAQID17/3/0·반복고지81/12/0과동일. 반복고지는기존case_scores.leak.notice_sentences길이>=2로집계하여FAQ인용문장제외. 일반재진술은문장최소12개2gram·작은쪽집합대비중복60%이상인쌍이있는응답수이며새보조지표. 모든반복표현이나프롬프트900건303→234와직접비교하지않는다. 최종사용자본문의반복고지는single81/sub70/slot2로코드안내도포함하므로모델본문0과다르다. 전체390건모델·코드중복고지sub67→slot1. sub실행오류LLM00512→slotCHAT0211(LLM0050). single도오류1이므로single대비오류개선아님. sub/slot공통339정답259→272 p=.0596;환각30→33 p=.743. single/slot공통350정답284→278 p=.418,환각44→36 p=.302. 품질향상통계적입증없음. 후속feat277가드는같은390에서정답률71.35/환각12.92로달라져이390slot실험을현재배포전체성능이라고하지않는다.',
 [`${DIR}/derive_slide_metrics.py`,`${DIR}/slide_metrics.json`,`${ROOT}/pipeline_test_v4/try2/results/all_summary.md`,`${ROOT}/pipeline_test_v1/try1/results/interim_summary.md`,`${ROOT}/pipeline_test_v5/try1/results/all_summary.md`],31);
}

// 7. Team-wide scheduler roles, concise enough for one slide.
{
 const s=base('주요 기능 소개  |  그 외','스케줄러의 주기와 역할','알림, 데이터 정리, FAQ 운영과 장애 복구를 주기 작업으로 분리','');
 table(s,[['기능','기본 주기','실행 기준·역할'],
 ['예약 알림','매시 정각','방문 24시간·6시간·1시간 전 단계별 안내'],
 ['요금·로밍·약정 알림','매일 09:00','납부 임박·연체, 로밍 시작·종료, 약정·할부 만료 안내'],
 ['데이터 사용량','매시 정각','월 한도 80%·100% 도달 안내'],
 ['데이터 보관 정리','매일 04:00','기간·상태 조건에 따른 익명화·삭제와 로밍 상태 갱신'],
 ['FAQ 랭킹·미응답 이름','1분 / 5분','최근 20분 top5 갱신 / 최근 질문으로 그룹 이름 생성'],
 ['가드 검토','예약 확인 1분','관리자 설정 주기에 분석, worker 2초·알림 5초, 04:15 정리'],
 ['비동기·상담 복구','2~15초','Outbox 2초 / 상담 유지·복구 5초 / 취소 구독 복구 15초'],
 ['캐시·적체 관측','5초 / 5분','금칙어 캐시 버전 확인 / 임베딩 backlog 지표 갱신']
 ],66,218,1308,421,[286,279,743],21.3,[]);
 note(s,'스케줄러는팀전체기능을주기와역할로묶었습니다. 예약이나요금일정에맞춰알림을보내고,사용량이한도에도달하면안내합니다. FAQ랭킹과미응답그룹이름도정기적으로갱신합니다. 이외에기간이지난데이터정리,관리자검토작업,비동기처리와상담복구를주기적으로실행합니다.',
 '예약24/6/1h,납부기한0~3일·연체1~30일미납액>0,로밍시작/종료D1/D0,약정할부D30/D7/D1,데이터80/100단계중복방지. 보관정리질문원문과연결3개월뒤익명화·집계행3년,로그예약알림주로3개월·구독청구5년등프로젝트정책이며법률적합성주장아님. ShedLock최소10분최대30분·1분간격최대3회재시도·하위부터삭제. FAQ랭킹20분창top5·최소10회·2일기준·급상승비율5. 미응답이름5분간격batch10·최근질문10·20분예산. 검토매분은예약시점확인,기본DBenabledfalse·interval1440분·관리자5~43200분설정;매분LLM분석아님. Outboxbatch20최대5재시도base10초. 상담5초maintainSessions/recoverPending와별도문장색인,검토worker2초·alert5초,금칙어캐시5초,취소구독15초,적체지표초기30초후5분. app.role별예약/worker분리조건존재. 실제활성화및운영성공률미조회.',
 [`${BE}/src/main/resources/application.yml`,`${BE}/src/main/java/com/ubot/retention/scheduler/DataRetentionScheduler.java`,`${BE}/src/main/resources/db/migration/R__purge_expired_data.sql`,`${ROOT}/presentation_work/evidence_20261026/evidence_review.json`],24);
}

// 8. Add only real operational screenshots supplied or captured from a working app.
const shots=['store-search.png','store-directions.png'];
let hasShots=true;for(const name of shots){try{await fs.access(`${DIR}/${name}`)}catch{hasShots=false}}
if(hasShots){
 const s=base('주요 기능 소개  |  채팅','매장 검색과 교통수단별 길찾기','지역·지원 서비스로 매장을 찾고, 선택한 매장까지 이동수단별 경로를 확인',
 '주변 매장 정렬은 좌표 거리순. 대중교통 후보는 최초 예상 소요 시간순이며 선택 후 도보 구간을 보완.');
 s.images.add({path:`${DIR}/${shots[0]}`,alt:'실제 매장 검색과 지도 화면',fit:'contain',position:{left:66,top:219,width:632,height:339}});
 s.images.add({path:`${DIR}/${shots[1]}`,alt:'실제 매장 길찾기 화면',fit:'contain',position:{left:742,top:219,width:632,height:339}});
 text(s,'지역·서비스 조건 검색',66,590,632,35,28,C.black,true);
 text(s,'복수 서비스는 모두 지원하는 매장\n지역 검색·주변 검색·지도 영역 검색',66,637,632,55,21.3,C.gray);
 text(s,'자동차·대중교통·도보',742,590,632,35,28,C.black,true);
 text(s,'자동차는 Kakao 추천 경로\n대중교통은 후보 선택 후 도보 연결 조회',742,637,632,55,21.3,C.gray);
 note(s,'매장기능은지역과지원서비스로조건을좁히고지도에서위치를확인합니다. 여러서비스를선택하면모두지원하는매장을찾습니다. 길찾기는선택한매장을목적지로자동차대중교통도보를제공합니다. 가까운매장순위는좌표거리이고실제이동시간순위와는다릅니다.',
 '실제동작스크린샷사용. 활성미삭제매장,시도시군구,서비스AND. 주변API기본10km20개,채팅기본3km최대5개. 지도를축소하면DBSCAN군집. 장소는사용자질문에실제포함된값만허용. 자동차RECOMMEND첫경로,대중교통최초시간순정렬후선택후보의처음끝도보두구간조회해합계재계산. 전체후보의최소요금·최소환승·도보보완후최단시간보장아님. 영업시간문자열은제공되지만현재영업중필터는확인되지않음.',
 [`${BE}/src/main/java/com/ubot/store/service/StoreService.java`,`${BE}/src/main/java/com/ubot/direction/service/DirectionsService.java`,`${BE}/src/main/java/com/ubot/ai/tool/NearbyStoreSearcher.java`],24);
}
await fs.writeFile(`${DIR}/authored.presentation.json`,JSON.stringify(P.toProto()));
await fs.writeFile(`${DIR}/timing.json`,JSON.stringify({slides:stages,totalSeconds:stages.reduce((n,s)=>n+s.seconds,0),storeScreenshotsReady:hasShots},null,2));
await (await PresentationFile.exportPptx(P)).save(`${DIR}/authored_draft.pptx`);
console.log(JSON.stringify({slides:P.slides.items.length,seconds:stages.reduce((n,s)=>n+s.seconds,0),storeScreenshotsReady:hasShots}));
