import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
process.on('uncaughtException',e=>{console.error(`${e.name}: ${e.message}`);process.exit(1)});
const DIR='C:/Ureka/ureca_project2/LLM_Test/presentation_work';
const ROOT='C:/Ureka/ureca_project2/LLM_Test';
const BE='C:/Ureka/ureca_project2/BackEnd';
const RUNTIME='C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const SKILL='C:/Users/pc/.codex/plugins/cache/openai-primary-runtime/presentations/26.1024.11018/skills/presentations';
const {Presentation,PresentationFile}=await import(pathToFileURL(`${RUNTIME}/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs`).href);
const {applyPresentationChartFont}=await import(pathToFileURL(`${SKILL}/container_tools/artifact_tool_utils.mjs`).href);
const proto=JSON.parse(await fs.readFile(`${DIR}/build/presentation.json`,'utf8'));
const appendixIndexes=[3,4,7,8,10,12,13,14];
proto.slides=appendixIndexes.map(i=>proto.slides[i]);
proto.charts=[];
const P=Presentation.load(proto);
const appendix=[...P.slides.items];
const main=[];
const C={pink:'#F72585',purple:'#32142F',black:'#17171A',gray:'#686B72',line:'#E6DCE3',pale:'#FFF4F9',white:'#FFFFFF'};
const SUB=`${BE}/docs/질문분리_멀티턴_테스트_보고서.md`;
const SUBJECT='C:/Ureka/ureca_project2/발표/subject.zip (조현빈 요약)';
const MODEL=`${ROOT}/model_test_v5/try1/results/summary/brief_report.md`;
const RETENTION=`${BE}/src/main/resources/db/migration/R__purge_expired_data.sql`;
let uid=1000;
function text(s,t,x,y,w,h,size=27,color=C.black,bold=false,align='left'){
 const a=s.shapes.add({geometry:'textbox',name:`purpose-${++uid}`,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 a.text=t;a.text.style={fontSize:size,typeface:'굴림',color,bold,alignment:align,verticalAlignment:'top',autoFit:'none',wrap:'square',insets:0};return a;
}
function line(s,x,y,w,h=0,color=C.line,width=1){return s.shapes.add({geometry:'line',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:color,width}})}
function base(category,title,goal,foot=''){
 const s=P.slides.add();s.background.fill=C.white;main.push(s);
 text(s,`설계 관점 · ${category}`,65,38,1260,30,20,C.pink);
 text(s,title,65,111,1310,75,45.333,C.black,true);
 text(s,goal,65,215,1309,50,29,C.purple,true);
 line(s,65,724,1309);
 text(s,'UBot',65,751,230,26,17.333,C.gray,true);
 text(s,'00',1280,751,94,26,17.333,C.gray,false,'right');
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
 const a=s.shapes.add({geometry:'rect',name:`logic-${++uid}`,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:border,width:1.4}});
 a.text=t;a.text.style={fontSize:size,typeface:'굴림',color,alignment:'center',verticalAlignment:'middle',autoFit:'none',insets:10};return a;
}
function arrow(s,a,b,fromSide='right',toSide='left'){
 return s.shapes.connect(a,b,{kind:fromSide==='right'&&toSide==='left'?'straight':'elbow',fromSide,toSide,line:{style:'solid',fill:C.gray,width:2},tail:{type:'triangle',width:'sm',length:'sm'}});
}
function note(s,script,details,sources){
 s.speakerNotes.text=`발표 대본\n${script}\n\n상세 근거\n${details}\n\n근거 자료\n${sources.join('\n')}`;
}

// 1. Model selection: decision and its purpose, rather than version history.
{
 const s=base('모델 선정','상담 품질과 응답 지연을 함께 고려한 선택','같은 문항에서 품질·지연을 비교해 4B Instruct Q4를 선택', '동일 1,300행 품질 비교 · T4 순차 단일 요청 · 전체 서비스 성능과 구분');
 text(s,'답변 정답률 (%)',65,294,800,31,23,C.gray);
 const chart=s.charts.add('bar',{position:{left:65,top:334,width:780,height:302},categories:['4B OFF','Instruct Q4','Instruct Q8'],series:[{name:'답변 정답률',values:[62.2,77.5,78.8],fill:C.pink,points:[{idx:0,fill:'#DCCBD5'},{idx:1,fill:C.pink},{idx:2,fill:C.purple}]}],barOptions:{direction:'column',grouping:'clustered',gapWidth:95},hasLegend:false,chartFill:'none',chartLine:{fill:'none',width:0},plotAreaFill:'none',plotAreaLine:{fill:'none',width:0},xAxis:{textStyle:{fontSize:21,fill:C.gray},line:{fill:C.line,width:1},majorGridlines:null},yAxis:{min:0,max:100,majorUnit:20,textStyle:{fontSize:18,fill:C.gray},majorGridlines:{fill:C.line,width:1},line:{fill:'none',width:0}},dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.0',textStyle:{fontSize:25,fill:C.black,bold:true}}});
 applyPresentationChartFont(chart,{fontFamily:'굴림'});
 text(s,'Q4_K_M',930,310,430,67,48,C.pink,true);
 text(s,'평균 2.61초',930,394,430,56,37,C.black,true);
 text(s,'Q8은 3.49초\n정답률 차이 1.3%p는\n유의하지 않음 (p=0.22)',930,477,450,121,25,C.gray);
 text(s,'Instruct 전환 시 환각률도 22.8%에서 26.2%로 증가해 별도 제어 필요',65,641,1309,28,21,C.gray);
 note(s,
 '모델 선정에서는 상담 품질과 응답 지연을 함께 봤습니다. 14B를 첫 후보로 골랐지만 지연과 자원 부담을 고려해 4B급을 다시 비교했습니다. 오답 분석에서는 Qwen의 과잉 보류를 개선할 여지가 있다고 판단했습니다. 같은 문항에서 Instruct로 바꾸자 정답률이 62.2%에서 77.5%로 올랐고, Q8의 추가 정확도 이득은 통계적으로 확인하지 못했습니다. 평균 응답은 Q4가 2.61초로 더 빨라 Q4를 선택했습니다. 다만 환각률도 늘어 모델 선정 뒤의 파이프라인에서 별도로 다뤘습니다.',
 '선정 과제는 Qwen3-4B-Instruct 계열과 Q4_K_M 양자화다. 14B P95 8.1초는 이전 평가의 지연이며 데이터셋이 달라 4B와 정확도를 직접 비교하지 않는다. v4 Qwen 오답 중 과잉 보류는 36.6%, Gemma는 3.5%였다. 이는 튜닝 가능성에 대한 당시 가설이다. v4 OFF와 v5 Instruct 비교는 모델 버전과 실제 출력 순서의 차이를 함께 포함한다. Q4/Q8 비교는 각 1,300행의 고정 컨텍스트 평가이며 Q4 정답률 77.5%, Q8 78.8%, 짝 비교 p=0.22이다. 평균 2.61초와 3.49초는 T4 단일 요청으로 종단 지연·동시성 지표가 아니다. 운영 w4a16과 평가 Q4_K_M은 양자화 방식이 다르다.',
 [SUBJECT,MODEL,`${ROOT}/model_test_v4/try1/results/summary/tuning_target_decision.md`,`${ROOT}/model_test_v3/try1/results/summary/model_selection.md`]);
}
// 2. Accuracy: cover each intent and resolve omitted referents.
{
 const s=base('정확도','복합·생략 질문의 의도를 빠짐없이 처리','질문 일부를 놓치거나, 생략된 대상을 잘못 짚는 문제에 대응', '분리 성공은 복합 질문 100건의 보조 지표 · 최종 답변 정답률과 구분 · 사람 검수 전');
 table(s,[['방해 요인','도입한 로직','답변에 반영'],['한 메시지의 여러 질문','최대 3개로 나눠 각각 검색','가능한 부분만 답변'],['생략된 대상·조건','이전 대화로 맥락 보완','“그거”, “~은요?” 해석']],65,306,1309,219,[420,530,359],27);
 text(s,'90 / 100',65,568,490,74,53,C.pink,true);
 text(s,'검색어만 출력하도록 단순화한 뒤 분리 성공\n원문 보존 칸 + 검색어 출력은 69 / 100',591,580,780,75,25,C.gray);
 note(s,
 '정확도에서는 사용자가 물은 내용을 빠짐없이 이해하는 데 집중했습니다. 여러 질문이 들어오면 최대 세 개로 나누고, 질문마다 FAQ를 찾아 답변 가능 여부를 판단합니다. 일부에 근거가 없어도 나머지 답은 살리고 고정 안내를 붙입니다. “그거 얼마예요?”처럼 대상을 생략한 질문은 이전 대화로 보완합니다. 또 판정 모델이 원문 보존과 검색어 생성을 동시에 맡지 않도록 단순화해, 복합 질문 분리 성공을 백 건 중 69건에서 90건으로 높였습니다.',
 'QuestionRouter, 판정 LLM, OriginalQuestionSplitter가 질문 분리와 원문 조각 보존을 나눠 담당한다. 네 개 이상 질문은 안내 후 거절한다. 맥락을 답변 모델에 실제로 전달하는 기준은 할루시네이션 제어 장에서 설명한다. 69/100은 keep+search(keep 먼저), 90/100은 괄호 나열도 제거한 최종 search-only 프롬프트다. 중간 search-only V4는 92/100이지만 문구 누출 5건이 있었고 최종본은 해당 누출 0건이다. 질문 분리 지표로 최종 답변 정답률이나 멀티턴 정확도를 대신하지 않는다. 로컬 Ollama Q4_K_M, 1회, AI 생성 질문·정답·판정으로 사람 검수 전이다.',
 [SUBJECT,SUB]);
}
// 3. Embedding accuracy: own contribution is retrieval input, not embedding model selection.
{
 const s=base('임베딩 정확도 · 검색 입력','질문에 맞는 FAQ를 찾기 위한 검색 입력','질문의 의도는 보존하고, 검색에 필요한 대상과 조건을 보완', '의도 201개 · 정답 FAQ가 상위 3개 안에 있고 유사도 0.75 이상 · AI 생성 라벨, 사람 검수 전');
 table(s,[['검색을 방해하는 입력','도입한 설계'],['여러 의도가 섞인 문장','하위 질문마다 검색어 한 문장 생성'],['“그거”처럼 대상이 생략된 질문','이전 대상·조건을 검색어에 보완'],['명확한 질문의 불필요한 재작성','원문 먼저 검색 · 실패할 때 판정 LLM']],65,301,1309,244,[620,689],26);
 text(s,'keep + 검색어',65,573,430,30,21,C.gray);
 text(s,'검색어만 · 최종',490,573,420,30,21,C.gray);
 text(s,'175 / 201',65,611,430,57,41,C.gray,true);
 text(s,'182 / 201',490,611,420,57,41,C.pink,true);
 text(s,'복합 질문 테스트에서\n정답 FAQ 검색 건수',972,606,405,65,24,C.black);
 note(s,
 '임베딩 정확도에서 제가 맡은 부분은 검색에 넣을 문장입니다. 복합 질문은 여러 의도가 섞여 있으므로 하위 질문마다 검색어 한 문장을 만들고, 생략된 대상과 조건은 이전 대화로 채웁니다. 반대로 명확한 질문은 불필요하게 다시 쓰면 뜻이 변할 수 있어 원문으로 먼저 검색합니다. 실패할 때만 판정 모델을 부릅니다. 복합 질문 실험에서는 원문 보존 칸과 검색어를 함께 출력한 방식이 201개 의도 중 175개를 찾았고, 최종 검색어 전용 프롬프트는 182개를 찾았습니다.',
 '담당 기여는 임베딩 전 질문 가공과 원문 검색/판정 재시도 흐름이다. BGE-M3 모델 선정, 벡터 DB 선정, reranker·하이브리드 검색, 임계값 피팅은 이 담당 범위의 성과로 주장하지 않는다. 검색 맞힘 정의는 의도별 정답 FAQ가 유사도 0.75 이상이며 상위 3개 내 포함되는지다. 100개 복합 질문의 의도 201개가 분모다. keep+search 175/201, 최종 search-only 182/201은 이 표본의 프롬프트 비교이며 원문 우선 검색 전체와의 종단 비교는 아니다. 1차 운영 프롬프트도 181/201이었다. 따라서 175를 전체 프로젝트의 초기 검색 기준선으로 설명하지 않는다. 임베딩 모델 자체의 성능 향상이나 운영 전체 검색 성능으로 확대하지 않는다. 원문 우선 검색 경로 관측은 이전 대화 없는 141건 중 66건이며 별도 지표다.',
 [SUB,SUBJECT]);
}
// 4. Hallucination: editable diagram shows separation of search text from answer input.
{
 const s=base('할루시네이션 제어','검색어 변형과 이전 오류의 전파 제어','재작성한 문장과 이전 답변의 오류가 답변 근거로 굳는 문제에 대응', '같은 FAQ를 사용한 100건에서 원문 방식과 keep 방식의 근거 맞힘은 각각 76건');
 const raw=node(s,'사용자 원문',65,325,345,82,{fill:C.purple,color:C.white,size:29});
 const ans=node(s,'답변 LLM',979,325,395,82,{fill:C.purple,color:C.white,size:29});
 const search=node(s,'판정 LLM 검색어',65,513,345,82,{fill:C.pale,border:C.pink});
 const faq=node(s,'검색한 FAQ',651,513,395,82);
 arrow(s,raw,ans);arrow(s,raw,search,'bottom','top');arrow(s,search,faq);arrow(s,faq,ans,'right','bottom');
 text(s,'사용자가 쓴 질문을 그대로 전달',470,326,470,34,24,C.black);
 text(s,'검색에만 사용',445,478,200,30,23,C.gray);
 text(s,'이전 질문도 원문 유지 · 맥락이 필요할 때만 최근 3턴 전달',65,628,1309,43,27,C.pink,true);
 note(s,
 '할루시네이션 제어에서는 오류가 다음 단계로 전파되는 경로를 줄였습니다. 판정 모델이 “못 받는 거죠?”의 부정을 지우는 식으로 질문을 바꾸면, 그 문장을 그대로 받은 답변 모델도 바뀐 질문에 답했습니다. 그래서 판정 모델의 검색어는 FAQ 검색에만 쓰고, 답변 모델에는 사용자가 쓴 원문과 검색한 자료를 전달합니다. 이전 질문도 원문으로 유지하고, 대화 이력은 맥락이 필요할 때만 전달합니다. 가드로 모든 변형을 잡기 어렵기 때문에, 변형된 문장이 답변용 질문이 되지 않도록 역할을 나눈 것입니다.',
 'SubQuestionGuard로 의미 변형을 검사하고 OriginalQuestionSplitter로 원문 조각을 보존한다. 필요하면 MultiTurnDetector가 최근 최대 3턴을 답변 모델에 전달한다. 판정 LLM 호출 시의 이력 전달과 답변 LLM의 선택적 이력 전달은 구분한다. 초기 실제 백엔드 200건에서 재작성 변형이 답변에 전파됐다. 같은 FAQ의 원문/keep 입력 비교는 근거 맞힘 76/100으로 동일하지만 최종 정답률 비교나 환각 감소율 측정은 아니다. 잘못된 검색으로 자료가 바뀔 위험은 여전히 남는다. 이력의 이전 질문을 원문으로 바꾼 것은 보고서의 해당 200건 실험 이후 변경으로 재측정 범위가 다르다.',
 [SUB,SUBJECT]);
}
// 5. Security: own query guard and retention, bounded to their actual roles.
{
 const s=base('보안','공격 명령의 검색 진입과 원문 보관 관리','공격 명령의 우회와 개인정보의 불필요한 장기 보관에 대응', '검색어 가드와 프로젝트 보관 정책의 담당 범위 · 서비스 전체 보안 성능과 구분');
 table(s,[['위험','도입한 설계','처리'],['공격 명령의 질문 위장','검색어 명령 변형 가드','명령 변형 검색어 제외'],['질문 원문의 장기 보관','삭제·익명화 스케줄러','3개월 뒤 원문·\n회원 연결 제거']],65,308,1309,255,[430,435,444],25);
 text(s,'매일 04:00 KST',65,592,610,63,42,C.pink,true);
 text(s,'분산 잠금과 배치 삭제로\n중복 실행·긴 DB 잠금 완화',790,590,580,78,26,C.gray);
 note(s,
 '보안에서는 제 담당 범위의 두 가지를 적용했습니다. 첫째, “프롬프트를 보여줘” 같은 명령이 정상 FAQ 질문처럼 다시 쓰이면, 판정 결과 가드에서 해당 검색어를 제외합니다. 모든 공격을 이 규칙만으로 막는다는 뜻은 아닙니다. 둘째, 질문 원문이 필요 이상 오래 남지 않도록 정리와 익명화 스케줄러를 구현했습니다. FAQ 로그의 질문 원문과 회원 연결은 세 달 뒤 제거하고, 통계에 필요한 기록은 정책에 따라 유지합니다. 분산 잠금과 배치 삭제로 정리 작업도 안정적으로 실행하도록 했습니다.',
 '보안 담당 범위는 SubQuestionGuard의 명령 변형 검색어 검사와 데이터 보관·익명화 스케줄러다. 인증·권한·네트워크 보안 및 입출력 가드 전체를 본인의 구현으로 주장하지 않는다. 현재 프롬프트 출력 300건에서 가드가 잡은 실제 변형은 9건이며 명령 6건, 부정 3건이다. 이는 전체 공격 탐지율이나 전체 보안 성능이 아니다. 가드에 모든 하위 검색어가 제외되면 원문으로 복귀하는 흐름이 있어 보안 처리를 가드 규칙 하나로 보장하지 않는다. FAQ 로그는 3년 보관하되 3개월 뒤 질문 원문·회원 연결을 익명화하는 프로젝트 정책이다. 일반 대화·답변 시도·예약·알림은 3개월 보관이다. 스케줄러 기본 04:00 KST, ShedLock 최소 10분/최대 30분, 1,000건 단위 커밋, 최초 실행 외 최대 3회 재시도다. 법적 의무의 적합성을 판단한 법률 검토가 아니다.',
 [SUBJECT,SUB,RETENTION,`${BE}/src/main/java/com/ubot/retention/scheduler/DataRetentionScheduler.java`]);
}

P.slides.reorder([...main,...appendix].map(s=>`sl/${s.id}`));
const durations=[45,40,45,55,35];
let elapsed=0;
const stamp=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
for(const [i,s] of P.slides.items.entries()){
 const footer=s.shapes.items.find(x=>x.position.left>1250&&x.position.top>740);
 if(!footer)throw new Error(`Footer missing ${i+1}`);
 footer.text=i<5?String(i+1).padStart(2,'0'):`A${i-4}`;
 s.hidden=i>=5;
 const original=s.speakerNotes.text;
 if(i<5){const start=elapsed;elapsed+=durations[i];s.speakerNotes.text=`담당 파트 권장 ${durations[i]}초 · 누적 ${stamp(start)}~${stamp(elapsed)}\n\n${original}`;}
 else{s.speakerNotes.text=`질문 대응용 부록 A${i-4}. 정규 3~4분 설명에서는 건너뜁니다.\n\n${original}`;}
}
if(elapsed!==220)throw new Error('Timing must be 3m40s');
await (await PresentationFile.exportPptx(P)).save(`${DIR}/build/purpose_draft.pptx`);
await fs.writeFile(`${DIR}/build/purpose.presentation.json`,JSON.stringify(P.toProto()));
console.log(JSON.stringify({slides:P.slides.items.length,main:5,hiddenAppendix:8,seconds:elapsed}));
