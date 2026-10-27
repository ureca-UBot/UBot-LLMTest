import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const RUNTIME='C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {Presentation,PresentationFile}=await import(pathToFileURL(`${RUNTIME}/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs`).href);
const SKILL='C:/Users/pc/.codex/plugins/cache/openai-primary-runtime/presentations/26.1024.11018/skills/presentations';
const {applyPresentationChartFont}=await import(pathToFileURL(`${SKILL}/container_tools/artifact_tool_utils.mjs`).href);
const DIR='C:/Ureka/ureca_project2/LLM_Test/presentation_work';
const ROOT='C:/Ureka/ureca_project2/LLM_Test';
const BE='C:/Ureka/ureca_project2/BackEnd';
const W=13712825/9525,H=7713663/9525;
const C={pink:'#F72585',purple:'#32142F',black:'#17171A',gray:'#686B72',line:'#E6DCE3',pale:'#FFF4F9',white:'#FFFFFF'};
const P=Presentation.create({slideSize:{width:W,height:H}});
let uid=0;
function text(s,t,x,y,w,h,size=27,color=C.black,bold=false,align='left'){
 const a=s.shapes.add({geometry:'textbox',name:`txt-${++uid}`,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 a.text=t;a.text.style={fontSize:size,typeface:'굴림',color,bold,alignment:align,verticalAlignment:'top',autoFit:'none',wrap:'square',insets:0};return a;
}
function line(s,x,y,w,h=0,color=C.line,width=1){return s.shapes.add({geometry:'line',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:color,width}})}
function base(section,title,foot=''){
 const s=P.slides.add();s.background.fill=C.white;
 text(s,section,65,38,1260,30,20,C.pink);
 text(s,title,65,111,1310,75,45.333,C.black,true);
 line(s,65,724,1309,0,C.line,1);
 text(s,'UBot',65,751,230,26,17.333,C.gray,true);
 text(s,String(P.slides.items.length).padStart(2,'0'),1280,751,94,26,17.333,C.gray,false,'right');
 if(foot)text(s,foot,65,680,1308,33,18.667,C.gray);
 return s;
}
function table(s,values,x,y,width,height,widths,size=25){
 const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width,height,values,columnWidths:widths});
 t.borders.assign({style:'solid',fill:C.line,width:1});
 t.cells.block({row:0,column:0,rowCount:values.length,columnCount:values[0].length}).assign({textStyle:{typeface:'굴림',fontSize:size,color:C.black},margins:{left:17,right:15,top:13,bottom:11},anchor:'center'});
 for(let r=0;r<values.length;r++){
  t.rows[r].height=height/values.length;
  for(let c=0;c<values[0].length;c++){
   const cell=t.getCell(r,c);cell.fill=r===0?C.purple:(r%2===0?C.pale:C.white);
   cell.text.style={typeface:'굴림',fontSize:size,color:r===0?C.white:(c===0?C.pink:C.black),bold:r===0||c===0,verticalAlignment:'middle',autoFit:'none'};
  }
 }
 return t;
}
function node(s,t,x,y,w,h,{fill=C.white,color=C.black,border=C.line,size=25}={}){
 const a=s.shapes.add({geometry:'rect',name:`process-${++uid}`,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:border,width:1.4}});
 a.text=t;a.text.style={fontSize:size,typeface:'굴림',color,alignment:'center',verticalAlignment:'middle',autoFit:'none',insets:10};return a;
}
function arrow(s,a,b,fromSide='right',toSide='left',dashed=false){return s.shapes.connect(a,b,{kind:fromSide==='right'&&toSide==='left'?'straight':'elbow',fromSide,toSide,line:{style:dashed?'dashed':'solid',fill:C.gray,width:2},tail:{type:'triangle',width:'sm',length:'sm'}})}
function note(s,script,sources){s.speakerNotes.text=`${script}\n\n근거 자료\n${sources.join('\n')}`;}
const SUB=`${BE}/docs/질문분리_멀티턴_테스트_보고서.md`;
const SUBJECT=`C:/Ureka/ureca_project2/발표/subject.zip (조현빈 요약)`;
const FLOW='C:/Ureka/ureca_project2/발표/flow.zip';

// 01 기능: 복합 질문과 부분 응답
{
 const s=base('프로젝트 수행 절차 및 방법 · 기능','여러 질문을 나눠 답할 수 있는 부분만 응답');
 text(s,'“유심 재발급 방법이랑 eSIM 전환 비용 알려줘”',65,216,1300,65,34,C.purple,true);
 table(s,[['하위 질문','검색 결과','최종 응답'],['유심 재발급 방법','답변 근거 있음','FAQ 근거로 답변'],['eSIM 전환 비용','묻는 비용의 근거 없음','코드가 고정 안내 추가']],65,317,1309,228,[460,390,459],27);
 text(s,'한 메시지당 최대 3개 질문',65,590,620,42,30,C.pink,true);
 text(s,'4개 이상이면 질문을 줄이도록 안내',740,592,630,42,27,C.gray);
 note(s,'한 메시지 안에 여러 질문이 있으면 각각 FAQ를 검색합니다. 일부 질문의 근거가 없어도 답할 수 있는 질문은 살리고, 미확인 질문에는 코드가 안내를 붙입니다. 화면의 문장은 동작 설명용 예시이며 실제 상품 가격을 뜻하지 않습니다. 최대 3개 제한은 질문 누락과 답변 혼합을 관리하기 위한 서비스 정책입니다.',[SUBJECT,SUB,FLOW]);
}
// 02 기능: 멀티턴
{
 const s=base('프로젝트 수행 절차 및 방법 · 기능','앞 대화를 이어 묻는 질문 처리');
 text(s,'이전 질문',65,220,250,35,24,C.gray);
 text(s,'“유심 재발급은 어떻게 해요?”',65,274,1250,55,36,C.black,true);
 text(s,'후속 질문',65,372,250,35,24,C.gray);
 text(s,'“그거 얼마예요?”',65,424,1250,65,44,C.pink,true);
 line(s,65,538,1309);
 text(s,'최근 최대 3턴을 참조',65,577,600,43,30,C.black,true);
 text(s,'맥락이 필요할 때만 답변 LLM에 전달',65,628,1280,40,27,C.gray);
 note(s,'그거, VVIP는요, 5G로 바꾸면요처럼 앞 대화의 대상이나 조건을 생략한 질문을 처리합니다. 판정 LLM을 호출할 때는 이전 대화를 함께 보지만, 최종 답변 LLM에는 멀티턴이 필요하다고 판단된 경우에만 최대 3턴을 줍니다. 이전 질문은 사용자가 입력한 원문으로 유지합니다. 이전 답변의 틀린 내용이 독립 질문까지 전파되는 것을 줄이기 위한 설계입니다.',[SUBJECT,SUB]);
}
// 03 스케줄러
{
 const s=base('프로젝트 수행 절차 및 방법 · 기능','매일 보관 기간이 지난 데이터를 정리');
 text(s,'04:00',65,218,430,105,82,C.pink,true);
 text(s,'KST 기준 매일 실행',520,252,820,45,31,C.black,true);
 table(s,[['운영 장치','설계 이유'],['ShedLock · 최소 10분 / 최대 30분','여러 서버의 중복 실행 방지'],['1,000건 단위 삭제·커밋','긴 DB 잠금을 줄이고 실패 뒤 남은 데이터부터 재개'],['하위 테이블부터 삭제','참조 관계 때문에 정리가 밀리는 상황 방지'],['실패 시 최대 3회 재시도 · 1분 간격','일시적인 DB 연결 오류·락 충돌에 대응']],65,360,1309,284,[570,739],24);
 note(s,'기본 실행 시각은 매일 04시 KST이며 환경변수로 변경할 수 있습니다. 삭제 전에 날짜 기준 로밍 상태를 예약, 이용 중, 종료로 전환합니다. 로밍 상태 전환이 실패해도 데이터 삭제는 이어갑니다. ShedLock 잠금을 최소 10분 유지해 시계가 늦은 서버의 직후 재실행도 막습니다. 최초 시도와 별도로 최대 3회 재시도하므로 최대 4번 시도합니다. DB 프로시저가 배치마다 COMMIT하므로 바깥에 @Transactional을 걸지 않습니다. 핵심 보관 정책은 대화 등 3개월, FAQ 로그는 3개월 뒤 원문·회원 연결을 비우고 3년 통계를 유지하는 것입니다. 전체 정책은 부록에 있습니다.',[SUBJECT,`${BE}/src/main/java/com/ubot/retention/scheduler/DataRetentionScheduler.java`,`${BE}/src/main/resources/application.yml`,`${BE}/src/main/resources/db/migration/R__purge_expired_data.sql`]);
}
// 04 모델 선정의 과정
{
 const s=base('프로젝트 수행 절차 및 방법 · 모델 선정','품질을 확인한 뒤 4B 모델로 운영 범위를 조정');
 table(s,[['단계','확인한 내용','선택'],['v1·v2','작은 모델의 출력 형식·RAG 안정성 비교','9개 후보에서 선별'],['v3','근거·상태·조건 판단과 지연을 함께 비교','Qwen3 14B OFF · 1차 MVP'],['v4','14B의 자원 부담과 P95 8.1초를 재검토','4B 모델 튜닝으로 전환'],['v5','Instruct 버전과 Q4 / Q8을 같은 문항으로 비교','Qwen3-4B-Instruct · Q4_K_M']],65,225,1309,342,[170,740,399],25);
 text(s,'평균 정답률과 함께 오답의 성격·응답 시간을 판단',65,609,1290,43,30,C.pink,true);
 note(s,'모델 이름만 비교한 것이 아니라 실제 상담 질문에 맞는 조건 판단과 보류, 환각, 출력 형식, 응답 시간을 함께 봤습니다. v3의 14B는 첫 MVP 후보였고 최종 확정은 아니었습니다. 이후 지연과 동시 처리 자원을 고려해 4B 튜닝으로 내려왔습니다. 버전마다 데이터셋과 채점 기준이 달라 버전 간 정답률을 곧바로 개선율로 비교하지 않습니다. Q4_K_M은 Ollama 평가 모델의 양자화입니다. 운영 vLLM의 w4a16과 동일한 형식으로 보지 않습니다.',[SUBJECT,`${ROOT}/model_test_v3/try1/results/summary/model_selection.md`,`${ROOT}/model_test_v4/try1/results/summary/tuning_target_decision.md`,`${ROOT}/model_test_v5/try1/results/summary/brief_report.md`]);
}
// 05 오답 분석
{
 const s=base('프로젝트 수행 절차 및 방법 · 모델 선정','정답률 뒤에 있는 오답 유형을 분석', 'v4 · 고정 컨텍스트 · RT 제외 · Gemma 2,598행 / Qwen 2,600행');
 table(s,[['비교 기준','Gemma3 4B','Qwen3 4B OFF'],['전체 정답률','65.1%','63.0%'],['오답 중 과잉 보류','3.5%  (32 / 908)','36.6%  (352 / 962)'],['실제로 답한 경우의 정답률¹','69.9%','77.0%'],['보류가 정답인 문항의 정답률','79.5%','87.2%']],65,228,1309,305,[620,344,345],26);
 text(s,'Qwen의 과잉 보류를 튜닝 대상으로 선택',65,574,1300,45,32,C.pink,true);
 text(s,'¹ 기대 ANSWER 중 실제 답한 부분집합의 결과로, 자신 있는 문항을 고른 효과도 포함',65,629,1300,38,24,C.gray);
 note(s,'Gemma가 전체 정답률은 높았지만, Qwen의 오답 352건은 답할 수 있는데 보류한 유형이었습니다. 그중 255건에는 환각이 없었습니다. 이를 프롬프트로 개선할 여지가 있다고 보고 Qwen을 튜닝 대상으로 바꿨습니다. 이는 당시의 선택 가설이며 계산 능력이나 환각을 프롬프트로 절대로 고칠 수 없다는 뜻은 아닙니다. ¹ 실제로 답한 경우는 기대 상태 ANSWER이면서 본문이 실제로 답한 부분집합이며 Gemma n=1,319, Qwen n=1,090입니다. Qwen이 자신 있는 문항만 답한 선택 효과도 있으므로 전체 정확도로 해석하지 않습니다.',[`${ROOT}/model_test_v4/try1/results/summary/brief_report.md`,`${ROOT}/model_test_v4/try1/results/summary/tuning_target_decision.md`,SUBJECT]);
}
// 06 모델 선택 수치: 네이티브 차트
{
 const s=base('프로젝트 수행 절차 및 방법 · 모델 선정','Instruct의 품질 이득과 Q4의 속도 이점', '동일 1,300행 품질 비교 · T4 순차 단일 요청 · 전체 상담 파이프라인 성능과 구분');
 text(s,'답변 정답률 (%)',65,218,800,33,24,C.gray);
 s.charts.add('bar',{position:{left:65,top:266,width:780,height:350},categories:['Qwen3 4B OFF','Instruct Q4','Instruct Q8'],series:[{name:'답변 정답률',values:[62.2,77.5,78.8],fill:C.pink,points:[{idx:0,fill:'#DCCBD5'},{idx:1,fill:C.pink},{idx:2,fill:C.purple}]}],barOptions:{direction:'column',grouping:'clustered',gapWidth:95},hasLegend:false,chartFill:'none',chartLine:{fill:'none',width:0},plotAreaFill:'none',plotAreaLine:{fill:'none',width:0},xAxis:{textStyle:{fontSize:21,fill:C.gray},line:{fill:C.line,width:1},majorGridlines:null},yAxis:{min:0,max:100,majorUnit:20,numberFormatCode:'0',textStyle:{fontSize:19,fill:C.gray},majorGridlines:{style:'solid',fill:C.line,width:1},line:{fill:'none',width:0}},dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.0',textStyle:{fontSize:25,fill:C.black,bold:true}}});
 text(s,'+15.3%p',925,245,440,72,52,C.pink,true);
 text(s,'OFF 대비 Instruct Q4의 정답률',925,327,445,65,25,C.black);
 text(s,'Q4  2.61초\nQ8  3.49초',925,428,440,94,32,C.black,true);
 text(s,'Q8의 정답률 차이 1.3%p는\n유의하지 않음 (p=0.22)',925,551,445,79,24,C.gray);
 text(s,'Instruct Q4의 환각률은 22.8%에서 26.2%로 증가해 추가 보완 필요',65,640,1305,29,21,C.gray);
 note(s,'v4의 Qwen3 4B OFF와 v5의 Instruct Q4를 같은 100건 서브셋, RT 제외 1,300행으로 비교하면 62.2%에서 77.5%로 15.3%p 올랐습니다. 이 비교는 모델 버전과 출력 순서 차이를 함께 포함하므로 모델 이름 하나의 독립 효과로 단정하지 않습니다. Instruct가 JSON 키 순서를 지키지 않고 답을 먼저 쓴 차이도 있습니다. 환각률은 22.8%에서 26.2%로 3.4%p 늘었습니다. 답을 더 많이 하는 대가를 이후 가드와 프롬프트에서 다뤘습니다. Q8은 78.8%이나 Q4와의 짝 비교 p=0.22로 정확도 이득을 확인하지 못했고, 평균 3.49초로 Q4의 2.61초보다 1.34배 느렸습니다. 따라서 이 평가 범위에서는 Q4를 선택했습니다. 이 시간은 검색·가드를 포함한 종단 지연이나 동시 요청 결과가 아닙니다.',[`${ROOT}/model_test_v5/try1/results/summary/brief_report.md`,`${ROOT}/model_test_v5/try1/results/summary/v4_comparison.md`,`${ROOT}/model_test_v5/try1/results/summary/quantization_decision.md`]);
}
// 07 전체 입력 흐름
{
 const s=base('프로젝트 수행 절차 및 방법 · 입력 파이프라인','분류·질문 판정·검색·답변의 책임 분리');
 const input=node(s,'사용자 원문',65,240,250,86,{fill:C.purple,color:C.white});
 const router=node(s,'분류기\n분리·멀티턴 표지',378,240,355,86);
 const raw=node(s,'원문 우선 검색',888,240,465,86);
 const judge=node(s,'판정 LLM\n검색어 한 문장씩',378,427,355,92,{fill:C.pale,border:C.pink});
 const guard=node(s,'변형 가드',811,427,230,92);
 const retrieve=node(s,'검색된 FAQ',1118,427,235,92);
 const answer=node(s,'답변 LLM   사용자 원문 + 검색한 FAQ',378,589,975,71,{fill:C.purple,color:C.white});
 arrow(s,input,router);arrow(s,router,raw);arrow(s,router,judge,'bottom','top');arrow(s,judge,guard);arrow(s,guard,retrieve);arrow(s,retrieve,answer,'bottom','top');arrow(s,raw,retrieve,'bottom','top');arrow(s,raw,judge,'bottom','top');
 text(s,'표지 없음',749,213,137,29,21,C.gray);
 text(s,'표지 있음',402,365,180,31,21,C.pink);
 text(s,'검색 실패 시 판정으로 재시도',765,337,595,31,22,C.gray);
 text(s,'검색 통과',1233,365,150,31,20,C.gray);
 text(s,'검색',1047,438,66,28,19,C.gray);
 note(s,'QuestionRouter는 LLM 없이 형태소와 규칙으로 판정 LLM 호출 필요성만 정합니다. 표지가 없으면 원문으로 먼저 검색하고, 충분한 근거를 찾으면 판정 LLM을 생략합니다. 표지가 있거나 원문 검색이 실패하면 판정 LLM이 한 턴에 한 번 검색어를 생성합니다. 검색어는 가드를 거쳐 하위 질문별로 검색합니다. 원문 검색 실패는 유사도 기준 미달뿐 아니라 답변 문장 필터를 통과한 문장이 없는 경우도 포함합니다. 그림의 원문 검색 성공 경로는 답변으로 바로 이어지고 실패 경로는 판정 단계로 들어갑니다. 검색어를 답변 LLM에 전달하지 않는 점은 뒤에서 설명합니다.',[SUBJECT,SUB]);
}
// 08 선택적 호출
{
 const s=base('프로젝트 수행 절차 및 방법 · 입력 파이프라인','명확한 질문은 원문으로 먼저 검색', '2차 재설계 실험 · 이전 대화 없는 141건 중 66건 · 운영 전체 트래픽 비율이 아님');
 text(s,'47%',65,232,465,120,91,C.pink,true);
 text(s,'판정 LLM을 생략하고\n원문 검색으로 처리',543,250,800,95,33,C.black,true);
 table(s,[['판정 LLM을 부르는 표지','예시'],['질문 분리 가능성','여러 문장, 나열어, 접속조사, 연결어미'],['이전 대화에 기대는 질문','그거, 그럼, ~은요?, 조건 바꾸기'],['표지가 없지만 원문 검색 실패','근거 부족 또는 답변 문장 검사 실패']],65,401,1309,228,[600,709],25);
 note(s,'명확한 단일 질문까지 LLM이 다시 쓰면 원문에 있던 표현이 바뀌어 오히려 검색이 나빠진 사례가 있었습니다. 그래서 표지가 없으면 원문을 먼저 검색합니다. 이전 대화가 없는 실험 141건 중 66건, 약 47%는 판정 LLM 호출 없이 끝났습니다. 이 수치는 비용이나 종단 지연을 직접 측정한 절감률은 아닙니다. 표지는 넓게 잡았습니다. 표지를 놓치면 검색과 답변을 망칠 수 있지만 과하게 잡으면 대체로 판정 호출이 한 번 늘기 때문입니다. 형태소 분석 실패는 표지 없음으로 처리하고 검색 실패 시 판정 재시도 경로를 유지합니다.',[SUB,SUBJECT]);
}
// 09 출력 칸 실험
{
 const s=base('프로젝트 수행 절차 및 방법 · 입력 파이프라인','판정 LLM은 검색어 생성에 집중', '복합 질문 100건 · 로컬 Ollama Q4_K_M · 1회 실행 · AI 생성 문항·판정, 사람 검수 전');
 table(s,[['출력 설계','맞게 나눈 질문'],['원문 보존 칸(keep) + 검색어','69 / 100'],['검색어만 출력하는 최종 프롬프트','90 / 100']],65,242,1309,208,[980,329],29);
 text(s,'원문 보존은 코드가 담당',65,504,1270,45,34,C.pink,true);
 text(s,'LLM에는 하위 질문마다 검색에 쓸 문장 하나만 요청',65,561,1280,45,29,C.black);
 text(s,'프롬프트의 괄호 나열 제거 후 문구 누출 5건에서 0건',65,624,1290,38,25,C.gray);
 note(s,'문장 규칙을 자세히 바꾸는 실험은 질문 분리를 크게 개선하지 못했습니다. 원문 보존 칸과 검색어를 함께 출력시키면 원문을 지키려는 요구와 문장을 나누는 요구가 충돌했습니다. keep을 빼고 최종 프롬프트가 검색어 한 문장만 출력하도록 하자 69건에서 90건으로 늘었습니다. 중간 V4는 92건이었지만 프롬프트 괄호 나열이 검색어에 5건 새어 나왔고, 이를 지운 최종본은 90건이며 해당 문구 누출은 0건입니다. LLM의 출력 부담을 줄이고 원문 보존 책임을 코드로 옮겼다는 설계 선택을 설명합니다. 이는 사람 검수 전 같은 실험셋에서 얻은 결과입니다.',[SUB,SUBJECT]);
}
// 10 검색어와 원문
{
 const s=base('프로젝트 수행 절차 및 방법 · 입력 파이프라인','검색어와 답변용 질문을 분리');
 const user=node(s,'사용자가 쓴 원문',65,235,1309,78,{fill:C.purple,color:C.white,size:29});
 const search=node(s,'판정 LLM의 검색어',65,408,570,85,{fill:C.pale,border:C.pink});
 const original=node(s,'코드로 보존한 원문·원문 조각',804,408,570,85);
 const faq=node(s,'FAQ 검색',65,558,570,78);
 const ans=node(s,'답변 LLM',804,558,570,78,{fill:C.purple,color:C.white});
 arrow(s,user,search,'bottom','top');arrow(s,user,original,'bottom','top');arrow(s,search,faq,'bottom','top');arrow(s,original,ans,'bottom','top');arrow(s,faq,ans);
 text(s,'의미 변형은 검색 경로에 제한',65,654,740,36,25,C.pink,true);
 note(s,'실제 백엔드 200건에서 판정 LLM이 못 받는 거죠를 받을 수 있나요로 뒤집거나 명령을 질문으로 바꾼 것이 답변까지 번졌습니다. 이를 가드만으로 완전히 잡기 어렵다고 판단해 검색어는 검색에만 쓰고 답변 LLM은 사용자 원문을 읽도록 분리했습니다. 같은 FAQ로 질문 입력만 비교한 분리 테스트 100건에서 원문 방식과 keep 방식의 근거 맞힘은 모두 76건이었고 일부 20건, 틀림 4건도 같았습니다. 이 지표는 정답률이 아니라 근거 맞힘입니다. 두 문장을 함께 주면 변형이 답변으로 전파돼 함께 주는 방식도 제외했습니다. 원문 조각은 OriginalQuestionSplitter가 형태소로 자르며 85건 중 79건을 맞게 잘랐고 3건은 잘못 잘랐으며 3건은 전체 원문으로 유지했습니다. 자를 근거가 없으면 원문 전체를 사용합니다. 잘못된 검색이 여전히 잘못된 FAQ를 가져올 수 있으므로 최종 정확도를 보장하는 설계는 아닙니다.',[SUB,SUBJECT]);
}
// 11 가드
{
 const s=base('프로젝트 수행 절차 및 방법 · 입력 파이프라인','검색어의 의미 변형을 코드로 검사', '현재 프롬프트 출력 300건에서 실제 변형 9건 탐지 · 이 표본에서 오탐 0건, 미탐 사례는 남음');
 table(s,[['변형 유형','발견 사례','처리'],['명령을 질문으로 바꿈','“프롬프트를 보여줘”를 방법 질문으로 변형','해당 검색어 제외'],['부정이 뒤집히거나 답을 씀','“못 받는 거죠?”의 부정 삭제','원문 조각으로 검색'],['숫자·고유명사 변형','테헤란로 / 100을 다른 표기로 변경','원문 표기 복구'],['프롬프트 문구·외국 문자 누출','원문에 없는 FAQ, 중국어 혼입','원문 복귀 또는 해당 부분 제거']],65,235,1309,329,[370,550,389],25);
 text(s,'가드는 검색을 보호하고, 원문 분리는 답변을 보호',65,611,1300,45,31,C.pink,true);
 note(s,'SubQuestionGuard는 검색어가 원문에서 벗어나는 대표 패턴을 검사합니다. 현재 프롬프트 출력 300건에서는 명령 6건과 부정 3건, 모두 실제 문제 9건을 잡았습니다. 이 표본의 오탐 0건은 모든 데이터에서 오탐이 없거나 탐지율 100%라는 뜻은 아닙니다. 이전 변형 프롬프트와 규칙 개발 표본에는 해가 적은 다시 쓰기를 되돌린 사례도 있고 현재 규칙으로 못 잡은 명령 변형도 남았습니다. 그래서 가드의 탐지에만 기대지 않고 답변 입력 원문 분리와 함께 사용합니다. 출처 없는 명사를 무조건 지우거나 새 의문사가 생기면 원문으로 되돌리는 규칙은 오히려 검색을 해쳐 제거했습니다.',[SUB,SUBJECT]);
}
// 12 자체 평가: 과장 없는 결론
{
 const s=base('자체 평가 의견','설계 결정과 남은 검증');
 table(s,[['확인한 내용','남은 과제'],['오답 유형을 근거로 모델·양자화 선택','환각 증가를 별도로 관리'],['검색어 생성과 원문 보존의 책임 분리','잘못된 검색 결과의 답변 영향 평가'],['필요할 때만 판정·대화 이력 전달','새 질문의 분류 누락·맥락 오주입 확인'],['실험으로 가드 규칙의 득실 확인','사람 검수와 운영 환경의 반복·통합 검증']],65,235,1309,322,[650,659],27);
 text(s,'개별 실험의 개선을 전체 서비스 성능으로 확대하지 않음',65,606,1295,55,31,C.pink,true);
 note(s,'담당 파트에서 얻은 결론은 모델을 단일 점수로 고르기보다 오답의 성격을 보고, LLM이 만드는 검색어와 사용자 원문을 분리하며, 필요한 경우에만 맥락을 전달해야 한다는 것입니다. 모델 비교의 고정 컨텍스트 실험, 질문 분리 실험, 통합 파이프라인 평가는 분모와 평가 기준이 다릅니다. 분리 실험은 로컬 Ollama, 1회 실행, AI 생성·판정 데이터이며 사람 검수 전입니다. 운영은 vLLM w4a16이라 양자화·서빙 방식 차이가 있습니다. 300건 가드 실험과 141건 호출 생략 관측을 운영 전체 성능으로 해석하지 않습니다. 실험 뒤 원문 이력 저장 등 바뀐 흐름도 있어 최신 코드 전체는 별도 통합 검증이 필요합니다.',[SUB,`${ROOT}/model_test_v5/try1/results/summary/brief_report.md`,SUBJECT]);
}
// A1 질문 대응용 모델 실험 범위
{
 const s=base('부록 · 모델 평가','모델 비교의 조건과 해석 범위');
 table(s,[['실험','범위','주요 판단'],['v3','고정 300건 + 반복 80행','품질과 응답 지연을 함께 보고 14B 1차 선정'],['v4','14항목 × 200건 = 모델별 2,800행','같은 문항에서 4B 모델의 오답 유형 분석'],['v5','14항목 × 100건 = 모델별 1,400행','Instruct·Q4 / Q8 비교, RT 제외 1,300행'],['질문 분리·멀티턴 재설계','분리 100건 / 평가 200건 등 별도 실험','원문 보존·선택 호출·가드의 역할 결정']],65,225,1309,345,[230,490,589],25);
 text(s,'고정 컨텍스트 정확도는 검색 실패·가드 후 최종 품질을 포함하지 않음',65,611,1290,57,28,C.pink,true);
 note(s,'v3와 v4는 정확도 정의와 데이터셋이 달라 숫자를 곧바로 비교하지 않습니다. v5 Q4와 Q8의 정확도는 각각 1,300행이 분모입니다. T4 순차 단일 요청 시간은 운영 동시성 지표가 아닙니다. Q8_0 실험은 FP8 자체의 실험이 아닙니다. 운영 모델은 RedHatAI/Qwen3-4B-Instruct-2507-quantized.w4a16 계열이며 실제 로드 상태는 배포 설정에 따라 확인해야 합니다. 출처별 상세 보고서와 모델명을 유지해 추가 질문에 대응합니다.',[`${ROOT}/model_test_v3/try1/results/all_summary.md`,`${ROOT}/model_test_v4/try1/results/summary/brief_report.md`,`${ROOT}/model_test_v5/try1/results/summary/brief_report.md`,SUB]);
}
// A2 데이터 보관 정책
{
 const s=base('부록 · 스케줄러','데이터별 보관·익명화 정책', '프로젝트에 설정한 보관 정책 · 삭제 조건은 DB 프로시저에서 관리');
 table(s,[['대상','정리 기준'],['대화·답변 시도·예약·알림','3개월'],['FAQ 질문·답변 로그','3년 보관 / 3개월 뒤 질문 원문·회원 연결 제거'],['미답변 질문 묶음','관리자 처리 후 3개월 / 검토 대기·보류는 유지'],['구독·청구 기록','5년'],['탈퇴 회원','3개월 뒤 삭제 / 보존할 거래 식별 정보는 retention 분리'],['FAQ·매장·상품 마스터','soft delete 후 3년 / 참조가 없을 때만 삭제']],65,216,1309,415,[490,819],23.5);
 note(s,'보관 기간은 제공 요약과 현재 프로젝트 코드에서 확인한 정책입니다. 이 슬라이드는 법적 의무의 완전성이나 적합성을 판단한 법률 검토가 아닙니다. FAQ 통계는 생성 시각과 FAQ 연결을 활용하므로 개인 식별이 가능한 질문 원문·회원 연결은 3개월 뒤 먼저 비웁니다. 미답변 묶음은 대기 중에 지우면 질문 수와 중심 벡터가 바뀌어 관리자 검토 우선순위가 흔들리므로 처리 후부터 기간을 셉니다. 마스터는 FK 참조가 남아 있으면 물리 삭제하지 않습니다.',[SUBJECT,`${BE}/src/main/resources/db/migration/R__purge_expired_data.sql`,`${BE}/src/main/resources/db/migration/V28__apply_data_retention_policy.sql`]);
}
// A3 멀티턴 판정 상세
{
 const s=base('부록 · 멀티턴','이전 대화 전달을 결정하는 기준');
 table(s,[['판정 조건','처리'],['검색어가 이전 대화에서만 나온 단어를 사용','답변 LLM에 이전 원문·답변을 전달'],['검색어에 지시어가 남음','앞 대화를 참조할 수 있도록 전달'],['원문에 멀티턴 표지가 있음','최대 3턴 전달'],['독립 질문으로 판단','이전 대화를 답변 LLM에 넣지 않음']],65,238,1309,302,[720,589],26);
 text(s,'이전 질문도 사용자가 입력한 원문으로 유지',65,587,1290,49,32,C.pink,true);
 text(s,'LLM이 한 번 만든 지명·조건이 다음 턴의 사실로 굳는 현상을 방지',65,642,1290,38,25,C.gray);
 note(s,'MultiTurnDetector의 조건입니다. 원문 검색 성공으로 판정 LLM을 생략하는 경로와, 판정 결과를 보고 대화를 전달하는 경로를 구분합니다. 실험에서 틀린 이전 답변을 의도적으로 넣은 8건 중 2~3건은 그 값을 따라 썼습니다. 따라서 매번 이력을 주지 않습니다. 과거 질문에 검색어를 저장해 넘기면 LLM이 한 번 만든 지명 등이 다음 턴의 사용자 사실처럼 굳을 수 있어 원문 이력으로 변경했습니다. 이 변경 뒤 동일 200건 전체를 다시 돌린 결과는 해당 원보고서에 없으므로 이전 수치를 최신 코드의 보장 성능으로 설명하지 않습니다.',[SUB,SUBJECT]);
}

await fs.mkdir(`${DIR}/build`,{recursive:true});
for(const slide of P.slides.items)for(const chart of slide.charts.items)applyPresentationChartFont(chart,{fontFamily:'굴림'});
await (await PresentationFile.exportPptx(P)).save(`${DIR}/build/draft.pptx`);
await fs.writeFile(`${DIR}/build/presentation.json`,JSON.stringify(P.toProto()));
await fs.writeFile(`${DIR}/build/inspect.ndjson`,(await P.inspect({kind:'slide,textbox,table,chart',maxChars:500000})).ndjson);
console.log(JSON.stringify({slides:P.slides.items.length,path:`${DIR}/build/draft.pptx`}));
