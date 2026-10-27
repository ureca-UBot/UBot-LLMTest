import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const DIR='C:/Ureka/ureca_project2/LLM_Test/presentation_work/revision_20261026_model_story';
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
const SEL=JSON.parse(await fs.readFile(`${DIR}/selection_metrics.json`,'utf8'));
const V3=JSON.parse(await fs.readFile(`${ROOT}/model_test_v3/try1/results/llm_judge/metrics.json`,'utf8'));
const MC=JSON.parse(await fs.readFile(`${DIR}/model_comparison_metrics.json`,'utf8'));
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
 const s=base('AI 품질 고도화  |  모델 선정','14B OFF 1차 선정과 4B 튜닝 검토','소형 모델의 단독 통과가 어려웠던 엄격한 품질·보류 기준에서, 후속 튜닝과 코드 교정을 검토',
 '시험: 단일·유사·다중 FAQ, 개인화·조건·예외, 근거 부재·충돌, 멀티턴, 공격·범위 밖, API(13유형)\n평가: 필수 사실·조건·답변 가능 여부를 만족하면 정답, 근거 밖 내용은 환각. 형식·일관성·지연·메모리·동시성도 고려.');
 const reasons={
 'gemma3:4b|t0_think':'4B 튜닝 후보',
 'gemma3:12b|t0_think':'크기·조건 판단',
 'exaone3.5:7.8b|t0_think':'보류 88건 실패',
 'qwen3:1.7b|t0_nothink':'내용 품질 부족',
 'qwen3:4b|t0_nothink':'4B 튜닝 후보',
 'qwen3:8b|t0_nothink':'튜닝 후 확장 후보',
 'qwen3:14b|t0_nothink':'1차 MVP 선정',
 'qwen3:1.7b|t0_think':'내용 품질 부족',
 'qwen3:4b|t0_think':'품질 우수·지연 큼',
 'qwen3:8b|t0_think':'품질·지연 검토',
 'qwen3:14b|t0_think':'품질 우수·지연 큼'};
 const ordered=V3.runs.filter(r=>['t0_think','t0_nothink'].includes(r.condition)).map(r=>({
   ...r,size:Number(r.model.match(/:([\d.]+)b$/)[1]),isOn:r.model.startsWith('qwen3:')&&r.condition==='t0_think'
 })).sort((a,b)=>Number(a.isOn)-Number(b.isOn)||a.size-b.size||a.model.localeCompare(b.model));
 if(ordered.length!==11)throw new Error('Expected 11 primary model configurations');
 const rows=[['모델','정답률','환각률','P95(초)','제외·후순위 근거']];
 for(const r of ordered){
  const family=r.model.startsWith('qwen3:')?'Qwen3':r.model.startsWith('gemma3:')?'Gemma3':'EXAONE';
  const label=`${family} ${r.size}B${family==='Qwen3'?r.isOn?' ON':' OFF':''}`;
  rows.push([label,`${(100*r.metrics.correct/r.metrics.n).toFixed(1)}%`,`${(100*r.metrics.hallucinated/r.metrics.n).toFixed(1)}%`,(r.performance.latency_ms.p95/1000).toFixed(2),reasons[`${r.model}|${r.condition}`]]);
 }
 const comparison=table(s,rows,66,218,760,408,[213,100,100,100,247],18.3,[2,3,7]);
 for(let ci=0;ci<5;ci++){const cell=comparison.getCell(7,ci);cell.fill=C.black;cell.text.style={typeface:FONT,fontSize:18.3,color:C.white,bold:true,verticalAlignment:'middle',autoFit:'none'};}
 for(let ri=8;ri<12;ri++)for(let ci=0;ci<5;ci++)comparison.getCell(ri,ci).fill='#F1F2F4';
 await fs.writeFile(`${DIR}/model_table_order.json`,JSON.stringify({source:`${ROOT}/model_test_v3/try1/results/llm_judge/metrics.json`,rows,sorting:'Non-thinking/OFF first, parameter size ascending. Thinking ON last, parameter size ascending. P95 is sequential single-request latency in seconds.'},null,2));
 text(s,'앞서 Qwen 0.6B·Gemma 270M/1B·EXAONE 2.4B는 형식·내용 문제로 제외\n해당 후보는 전수 정답률·환각률 평가가 없어 표에 넣지 않음',66,636,760,45,16.7,C.gray);
 text(s,'품질 기준으로 14B OFF를 1차 선정',866,218,510,61,25.3,C.black,true);
 bar(s,['4B','8B','14B'],[{name:'HTTP 완료 RPS',values:[9.13,6.10,3.33],fill:C.pink}],866,291,510,258,12);
 text(s,'동시 32명, 초당 완료 요청 수\nL4·30초 시험·이전 Qwen3 계열',866,566,510,54,18.6,C.gray);
 text(s,'동시 서빙 부담을 줄이기 위해\n4B 모델의 튜닝 가능성을 재검토',866,626,510,62,23.3,C.pink,true);
 note(s,'초기테스트는조건과예외,자료부족,공격대응까지함께보는엄격한기준이었습니다. 작은모델을그대로통과시키기어려워품질기준으로14B OFF를1차선정했습니다. 하지만별도동시서빙시험에서4B보다처리여유가작았습니다. 그래서큰모델을그대로운영하는대신4B를튜닝하고코드로보완할수있는지검토했습니다.',
 'v2 try1=9모델, 표본 검수 26건과 결정론 형식 지표. v2 try2 Qwen1.7B 정답47%=300건 Judge. v3 EXAONE7.8B 기대 ABSTAIN88건 중0; Qwen4B ON P95 47.6초. v3의 1차 MVP는 Qwen14B OFF였고, v4에서 작은4B 모델의 튜닝을 검토했다. 이를 처음부터4B가 전 지표 최고였다고 설명하지 않는다. v4 오답 중 과잉보류 Qwen352/962=36.6%, Gemma32/908=3.5%. Qwen 실제로 답한 문항의 정확도77%는 선택 편향이 있어 전체 정확도로 쓰지 않는다. L4 vLLM P32/U32 30초 단회 RPS4B9.13/8B6.10/14B3.33은 이전 Qwen3 계열, 최종 Instruct w4a16 직접 측정이 아니다. 품질 및 지연 SLO를 적용한 보장 수용량도 아니다.',
 [`${ROOT}/model_test_v2/try1/results/all_summary.md`,`${ROOT}/model_test_v2/try2/results/all_summary.md`,`${ROOT}/model_test_v3/try1/results/all_summary.md`,`${ROOT}/model_test_v3/try1/results/summary/model_selection.md`,`${ROOT}/model_test_v4/try1/results/summary/brief_report.md`,`${ROOT}/model_test_v4/try1/results/summary/tuning_target_decision.md`,`${ROOT}/servingtest/l4/reports/L4_MULTIMODEL_RESULTS_20261006.md`],24);
}

// 2. Dedicated v4 rationale: same conditions, controllable errors and abstention safety.
{
 const s=base('AI 품질 고도화  |  모델 선정','Gemma와 Qwen, 4B 튜닝 대상 선정','같은 v4 조건에서 보류 안정성·오답 유형·프롬프트 교정 가능성을 비교',
 '답변·계산 정답률은 실제 답한 표본으로 선택 편향 포함. 보류 정답 830건은 자료 부족·충돌·범위 밖 문항.\n답이 없는 문항은 두 모델 공통 670건. 답변 가능 출력은 모델 상태값 기준. 정답과 환각은 별도 판정.');
 const pct=(m,k)=>`${(100*SEL[m][k].rate).toFixed(1)}%`;
 const rows=[['v4 기준선 비교','Gemma3','Qwen3 OFF'],
 ['오답 중 답할 수 있는데 보류',pct('Gemma','over_abstain'),pct('Qwen','over_abstain')],
 ['답변했을 때의 정답률',pct('Gemma','answered_accuracy'),pct('Qwen','answered_accuracy')],
 ['계산형 답변의 정답률',pct('Gemma','calculation_accuracy'),pct('Qwen','calculation_accuracy')],
 ['보류가 정답인 문항의 정답률',pct('Gemma','decline_accuracy'),pct('Qwen','decline_accuracy')],
 ['답이 없는 문항의 오답률',pct('Gemma','no_answer_error'),pct('Qwen','no_answer_error')],
 ['답이 없는 문항의 환각률',pct('Gemma','no_answer_hallucination'),pct('Qwen','no_answer_hallucination')],
 ['답변 가능 출력의 환각률',pct('Gemma','labeled_answer_hallucination'),pct('Qwen','labeled_answer_hallucination')]];
 table(s,rows,66,218,840,380,[496,172,172],21.3,[1,2]);
 text(s,'4B 후보 재평가 (약 2,600건)',954,218,420,35,23.3,C.black,true);
 table(s,[['모델','정답률','환각률'],['Gemma3','65.1%','24.1%'],['Qwen3 OFF','63.0%','22.0%']],954,264,420,112,[194,113,113],19.3,[2]);
 text(s,'Gemma의 약점',954,399,420,33,23.3,C.black,true);
 text(s,'계산 오적용·답 없는 문항의 오답·환각\n자료 부족 3유형 비중 28.3%→23.1%\n문항·보류 지침도 바뀐 시험에서\n전체 환각률 50.3%→24.1%',954,446,420,104,19.3,C.gray);
 text(s,'Qwen의 프롬프트 교정 여지',954,569,420,33,23.3,C.pink,true);
 text(s,'과잉 보류 352건 중 255건은 환각 없음\n근거 우선 선택·과도한 되묻기가\n답변을 막는 구조를 확인',954,614,420,75,20,C.black,true);
 text(s,'전체 정답률 2.1%p 차이보다\n보류 안정성과 교정 가능성을 우선',66,618,840,72,28,C.pink,true);
 note(s,'전체 정답률은Gemma가2.1%포인트높았지만,오답의종류를다시봤습니다. Qwen오답의36.6%는답할수있는내용을보류한경우였고,352건중255건은환각도없었습니다. 실제로답한문항에서는정답률과계산형정답률이더높았습니다. 반대로답이없는670문항에서Gemma는오답18.4%,환각31.9%로Qwen보다높았고,답변가능으로출력한경우에도환각률이18.3%였습니다. 그래서보류안정성과프롬프트교정가능성을보고Qwen을튜닝대상으로정했습니다.',
 '주요근거=tuning_target_decision.md1-1·1-2. RT제외Gemma2598/Qwen2600,전체정답률65.05%/63.0%. 과잉보류32/908=3.5%,352/962=36.6%;그중환각없음15/255. 기대ANSWER이며본문도ANSWER인선택표본정답922/1319=69.9%,839/1090=77.0%;계산CE/UI/AR정답188/392=48.0%,156/281=55.5%. 답한표본은모델별로다르므로전체정답률또는보류를답변으로바꿨을때의예상정답률이아님. 기대보류계열830건(ABSTAIN670/CONFLICT90/OUT_OF_SCOPE70)정답660/724=79.5%/87.2%. 기대ABSTAIN670건오답123/71=18.4%/10.6%,환각214/143=31.9%/21.3%. 출력라벨ANSWER환각240/1313=18.3%,48/577=8.3%;본문ANSWER기준환각과구분. 정답과환각은독립이므로두비율을더하지않는다. 계산오적용은환각과별개일수있다. Qwen계산형답변환각62/281=22.1%로Gemma66/392=16.8%보다높은위험도남음. 따라서Gemma의보류를전혀통제할수없다거나Qwen이모든영역에서더안전하다는결론은아님. 우측사례CE-0031/UI-0055는결정문1-5. 1-3의근거→보류→본문연결,1-4의불필요한되묻기는관측된교정가설근거. 이후개선효과는다음프롬프트슬라이드의같은표본으로검증해야함. v3/v4의환각률차이를튜닝효과로연결하지않는다.',
 [`${ROOT}/model_test_v4/try1/results/summary/tuning_target_decision.md`,`${DIR}/selection_metrics.json`,`${DIR}/derive_selection_metrics.py`,`${ROOT}/presentation_work/evidence_20261026/gemma_v3_v4_and_status.json`],38);
 s.speakerNotes.text=s.speakerNotes.text.replace('우측사례CE-0031/UI-0055는결정문1-5.','계산사례는결정문1-5의원자료이며현재화면에서는예시를삭제하고약점만요약했다.');
 s.speakerNotes.text+='\n\nGemma의버전간비교해석\n자료부족3유형은SR/HR/EC이며v3 85/300=28.3%,v4 600/2598=23.1%다. 유형비중은낮아졌으나공통12유형에서v4의유형별환각률을v3비중으로가중해도약25.0%이므로,50.3→24.1감소를문항비중만의효과로설명할수없다. 유형내문항·FAQ,생성프롬프트·출력스키마,판정모델·상세루브릭이함께바뀌었다. 화면의설명도비중과문항·보류지침변화를함께명시한다. 계산능력문제를단독인과로확정한비교실험이아니며동일v4내모델비교를선정근거로사용한다.';
}

// 2. A fair matched cohort, plus full-suite Q4/Q8 evidence.
{
 const s=base('AI 품질 고도화  |  모델 선정','2차 모델 비교와 Instruct Q4 선정','기본 프롬프트의 Instruct도 OFF 개선안보다 정확했고, 상태 판단과 근거 선택도 개선',
 '표는 공통 404건(오답 집중 표본 포함). 상태는 기대 동작의 엄격 일치, 근거는 정답 문서만 1개 이상 인용한 비율(대상 205건).\n하단 Q4·Q8 품질·자원 및 오답 원인 비교는 별도 1,300문항 기준.');
 const labels=[['OFF','Qwen3 4B OFF · 기존'],['OFF_t1c','Qwen3 4B OFF · 프롬프트 개선'],['Gemma_QAT','Gemma3 4B · QAT'],['Instruct_Q4','Qwen3 4B Instruct Q4_K_M · 기존'],['Instruct_Q8','Qwen3 4B Instruct · Q8']];
 const values=[['모델·프롬프트','정답률','환각률','상태 판단','근거 선택']];
 for(const [key,label] of labels){const d=MC.models[key];values.push([label,`${(100*d.correct/d.n).toFixed(1)}%`,`${(100*d.hallucination/d.n).toFixed(1)}%`,`${(100*d.status_correct/d.n).toFixed(1)}%`,`${(100*d.evidence_correct/d.evidence_n).toFixed(1)}%`]);}
 table(s,values,66,218,1308,260,[500,190,190,214,214],20.3,[4]);
 text(s,'Q4와 Q8의 품질·자원 비교',66,512,630,35,24,C.black,true);
 text(s,'정답률 77.5% / 78.8%\n환각률 26.2% / 26.5%',66,556,630,62,23.3);
 text(s,'평균 응답 2.61초 / 3.49초·가중치 2.5GB / 4.3GB\n품질 차이가 뚜렷하지 않아 동시 서빙 여유를 고려',66,628,630,55,20.3,C.gray);
 text(s,'Instruct 고도화의 한계와 방향',744,512,630,35,24,C.pink,true);
 text(s,'오답 중 과잉 보류 37.7%에서 6.1%로 감소\n보류만 풀어 정답을 늘릴 교정 여지가 줄어듦',744,556,630,62,21.3);
 text(s,'정답률 상승보다 환각 감소에 집중',744,638,630,38,25.3,C.pink,true);
 note(s,'기본프롬프트의Instruct도OFF최종개선안보다정확했고상태판단과근거선택도개선됐습니다. Q8과품질차이는뚜렷하지않았지만시간과용량이늘어Q4를택했습니다. 다만Instruct에서는기존에쉽게고칠수있던과잉보류가이미많이줄었습니다. 그래서후속고도화는정답률상승보다환각을줄이는방향에집중했습니다.',
 '공통404건은 OFF 초안254정답96환각, t1c313/99, GemmaQ4 283/120, GemmaQAT290/172, InstructQ4 344/93, InstructQ8 354/90. GemmaQAT HR-0163 미채점1건을 제외했다. t1c와Instruct만 비교한405건=314/99 vs345/93, 정확도+7.65%p(p=.00117), 환각 차이 유의하지 않음(p=.645). NC·MC는 OFF 오답을 집중한 표본으로 전체 정확도의 대표 표본이 아니다. 미측정895건을 OFF 기준선 유지한 t1c 합성1,300건 정확도66.77%,환각23.08%는 실측이 아니므로 본문 표에 넣지 않았다. Q4/Q8 1,300건 정답77.5/78.8 환각26.2/26.5 p=.22/.85. 평균응답2.61/3.49초·파일2.5/4.3GB는 T4 순차측정이고 Q4와Q8의 동시성 직접 비교가 아니다. 4bit가 동시 서빙 여유에 유리할 것으로 고려한 판단과 실측을 구분한다. Instruct의 답먼저 키 순서와 모델·프롬프트·로컬/EC2 환경 차이가 섞여 순수 모델 단독 효과는 아니다.',
 [`${DIR}/model_comparison_metrics.json`,`${DIR}/derive_model_comparison.py`,`${ROOT}/scripts/docgen/judge_report.js`,`${ROOT}/presentation_work/evidence_20261026/off_tuned_vs_instruct.json`,`${ROOT}/model_test_v5/try1/results/summary/quantization_decision.md`,`${ROOT}/model_test_v5/try1/results/summary/cause_breakdown.md`],29);
 s.speakerNotes.text+='\n\n최신 정의\n화면은Gemma Q4_K_M기존모델을제외한5행이다. OFF와Instruct Q4_K_M에기존을붙인것은기존시험결과재사용을뜻한다. 상태판단은출력status와기대상태의엄격일치(정답과독립)로404건분모, 근거선택은evidence_ids에정답근거문서만하나이상인용한비율이며205건분모다. 공통404건에서상태정답252/313/315/357/370,근거정답80/101/191/180/185(표행순)다. n1300별도오답분석에서OFF의과잉보류는185/491=37.7%,Instruct Q4는18/293=6.1%,환각동반오답은32.6%에서64.2%였다. 사라진것은주로과잉보류를풀어정답을쉽게늘릴교정여지이며전체튜닝가능성이없어졌다는실증결론은아니다. 후속900건에서정답703→698,환각184→122를관측해환각감소중심방향으로정리한다.';
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
 table(s,[['질문 분리 전체 100건','판정 없이 검색','개선 판정'],['모든 정답 FAQ 검색','69 / 100','84 / 100'],['의도별 정답 FAQ 검색','161 / 201','182 / 201'],['질문 개수 맞게 나눔','—','90 / 100']],66,513,1308,165,[508,400,400],21.3,[1,3]);
 note(s,'여러질문을나누고생략된대상을복원하기위해판정모델을도입했습니다. 분리나멀티턴표지가없는질문은원문검색을먼저시도합니다. 질문분리100건전체에서필요한FAQ를모두찾은문항은판정없이69건에서판정적용84건이됐습니다. 의도별FAQ적중은161개에서182개,질문개수는90건에서맞았습니다. 이는답변정확도가아니라검색과분리성능입니다.',
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
 '표는 공통 채점 337문항. 세 방식 모두 분류기 적용. 반복 표현은 모델 본문에서 자료 부족 고지문이 두 문장 이상인 경우.');
 const nodes=[node(s,'질문 1: 답할 수 있음\n질문 2: 근거가 없어 답변 보류',66,215,530,84),node(s,'답할 수 있는 본문만 합침',681,215,307,84,{fill:C.pale,size:21.3}),node(s,'서버가 안내 문구 추가',1067,215,307,84,{fill:C.black,color:C.white,size:21.3})];
 arrow(s,nodes[0],nodes[1]);arrow(s,nodes[1],nodes[2]);
 const cols=['single','sub','slot'];const vals=[['동일 337문항','답변·판정 모두 통합','판정만 질문별 분리','답변·판정 모두 분리']];
 vals.push(['정답',...cols.map(k=>`${D.pipeline[k].common_three.correct} / 337`)]);
 vals.push(['환각',...cols.map(k=>String(D.pipeline[k].common_three.hallucination))]);
 vals.push(['FAQ ID 노출',...cols.map(k=>String(D.pipeline[k].common_three.id_mentions))]);
 vals.push(['반복 표현(고지문)',...cols.map(k=>String(D.pipeline[k].common_three.repeated_decline))]);
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
