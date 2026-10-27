import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
process.on('uncaughtException',e=>{console.error(`${e.name}: ${e.message}`);process.exit(1);});
const DIR='C:/Ureka/ureca_project2/LLM_Test/presentation_work';
const RUNTIME='C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {Presentation,PresentationFile}=await import(pathToFileURL(`${RUNTIME}/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs`).href);
const P=Presentation.load(JSON.parse(await fs.readFile(`${DIR}/build/presentation.json`,'utf8')));
const source=[...P.slides.items];
const order=[0,2,4,5,6,9,3,7,8,10,11,12,13,14];
const previousNotes=new Map(source.map(s=>[s.id,s.speakerNotes.text]));
P.slides.keep(order);
P.slides.reorder(order.map(i=>`sl/${source[i].id}`));
const shape=(s,n)=>{const x=s.shapes.items.find(x=>x.name===n);if(!x)throw new Error(`Missing ${n}`);return x;};

const first=source[0];
shape(first,'txt-2').text='질문 분리와 멀티턴';
shape(first,'txt-5').text='“로밍 방법이랑 비용은?”  “그거 취소는요?”';
const fv=[['기능','처리','범위'],['질문 분리','질문별 검색·부분 답변','최대 3개 질문'],['멀티턴','필요할 때만 대화 참조','최근 최대 3턴']];
for(let r=0;r<3;r++)for(let c=0;c<3;c++)first.tables.items[0].getCell(r,c).value=fv[r][c];
shape(first,'txt-6').text='답할 수 있는 질문은 답변';
shape(first,'txt-7').text='근거가 없는 질문에는 코드가 고정 안내';

const model=source[4];
shape(model,'txt-30').text='오답 유형에서 튜닝 가능성을 판단';
model.tables.items[0].deleteRows({index:3,count:2});
for(const row of model.tables.items[0].rows)row.height=90;
shape(model,'txt-35').text='튜닝 가설: 프롬프트에 의한 과잉 보류를 줄일 여지가 있음';

const times=[35,25,35,40,45,40];
const scripts=[
 '제가 맡은 기능은 질문 분리와 멀티턴입니다. 한 번에 여러 질문이 들어오면 최대 세 개로 나누고, 각각 FAQ를 검색합니다. 일부 질문에 근거가 없어도 답할 수 있는 부분은 답하고, 나머지는 코드가 고정 안내를 붙입니다. 또 “그거 취소는요?”처럼 앞 대화에 기대는 질문은 최근 세 턴까지 참조합니다. 다만 이전 답변의 오류가 번지지 않도록, 맥락이 필요한 경우에만 답변 모델에 대화 이력을 전달합니다.',
 '운영 기능으로는 데이터 정리 스케줄러를 구현했습니다. 매일 새벽 네 시에 보관 기간이 지난 데이터를 정리합니다. 여러 서버가 같은 일을 중복 실행하지 않도록 분산 잠금을 쓰고, 천 건씩 삭제하고 커밋해 DB 잠금 시간을 줄였습니다. 중간에 실패하면 남은 데이터부터 다시 처리하며, 로밍 상태 전환도 함께 수행합니다.',
 '모델 선정에서는 정답률뿐 아니라 오답 내용을 분석했습니다. 14B를 첫 MVP 후보로 골랐지만 지연과 자원 부담 때문에 4B급을 다시 비교했습니다. 전체 정답률은 Gemma가 조금 높았습니다. 그런데 Qwen 오답의 36.6%는 답할 수 있는데 보류한 경우였습니다. 이 부분은 프롬프트를 조정해 개선할 여지가 있다고 보고 Qwen을 튜닝 대상으로 선택했습니다. 이는 당시 오답 분석에 따른 가설입니다.',
 '같은 문항에서 Instruct 버전을 비교하자 정답률은 62.2%에서 77.5%로 높아졌습니다. Q8의 78.8%는 Q4와 통계적으로 유의한 차이를 확인하지 못했습니다. 반면 평균 응답은 Q4가 2.61초, Q8이 3.49초여서 Q4를 선택했습니다. 다만 Instruct에서는 환각률도 늘어 별도 보완이 필요했습니다. 이 결과는 검색과 가드를 포함한 최종 서비스 성능이 아니라 고정 자료를 넣은 모델 비교입니다.',
 '입력 파이프라인은 코드 분류기와 판정 LLM의 역할을 나눴습니다. 분리나 멀티턴 표지가 없는 질문은 원문으로 먼저 검색하고, 충분한 근거를 찾으면 판정 LLM을 생략합니다. 표지가 있거나 검색이 실패한 경우에만 판정 LLM이 검색어를 만듭니다. 이후 코드가 부정 뒤집힘이나 숫자 변형 등을 검사하고 FAQ를 검색합니다. 명확한 질문까지 불필요하게 다시 써서 검색을 해치는 문제를 줄이기 위한 구조입니다.',
 '가장 중요한 변경은 검색어와 답변용 질문을 분리한 점입니다. 판정 LLM이 만든 문장에서 부정이 뒤집히는 등의 변형이 실제 답변까지 번지는 사례를 확인했습니다. 그래서 LLM이 만든 문장은 검색에만 쓰고, 답변 모델에는 사용자가 쓴 원문과 검색한 FAQ를 전달합니다. 가드로 모든 변형을 잡을 수 없기 때문에 입력 경로도 분리한 것입니다. 다만 잘못된 검색과 환각이 여전히 남아, 사람 검수와 운영 환경의 통합 검증을 이어가야 합니다.'
];
function stamp(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
let elapsed=0;
for(const [i,s] of P.slides.items.entries()){
 const footer=s.shapes.items.find(x=>x.position.left>1250&&x.position.top>740);
 if(!footer)throw new Error(`Footer missing ${i+1}`);
 footer.text=i<6?String(i+1).padStart(2,'0'):`A${i-5}`;
 s.hidden=i>=6;
 const original=previousNotes.get(s.id);
 if(i<6){
  const start=elapsed;elapsed+=times[i];
  const prefix=i===0?'전체 발표 25분 중 담당 파트 권장 3분 40초. 아래 시간은 담당 파트의 설명 시간이며 전체 시연 시간을 따로 더하지 않습니다.\n\n':'';
  s.speakerNotes.text=`${prefix}권장 설명 ${times[i]}초 · 누적 ${stamp(start)}~${stamp(elapsed)}\n\n발표 대본\n${scripts[i]}\n\n질문 대응용 상세 근거\n${original}`;
 }else{
  s.speakerNotes.text=`질문 대응용 부록 A${i-5}. 정규 3~4분 설명에서는 생략하고, 관련 질문이 있을 때 참조합니다.\n\n${original}`;
 }
}
if(elapsed!==220)throw new Error('Timing does not sum to 3m40s');
await (await PresentationFile.exportPptx(P)).save(`${DIR}/build/compact_draft.pptx`);
await fs.writeFile(`${DIR}/build/compact_timing.json`,JSON.stringify({mainSlides:6,hiddenAppendices:8,totalSpeakingSeconds:elapsed,secondsBySlide:times,scripts},null,2));
console.log(JSON.stringify({slides:P.slides.items.length,main:6,hiddenAppendix:8,seconds:elapsed}));
