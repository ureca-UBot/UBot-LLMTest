import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const D='C:/Ureka/ureca_project2/LLM_Test/presentation_work/revision_20261026_pink';
const SK='C:/Users/pc/.codex/plugins/cache/openai-primary-runtime/presentations/26.1024.11018/skills/presentations';
process.env.RUNTIME_NODE_MODULES='C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const source='C:/Ureka/ureca_project2/발표/프로젝트_발표자료_통합_정리.pptx';
const {finalizePresentation}=await import(pathToFileURL(`${SK}/container_tools/artifact_tool_utils.mjs`).href);
const integrated=process.argv.includes('--integrated');
const data=JSON.parse(await fs.readFile(`${D}/timing.json`,'utf8'));
const n=data.slides.length;
const candidatePath=integrated?`${D}/integrated_fixed_candidate_v2.pptx`:`${D}/authored_draft.pptx`;
await fs.mkdir(`${D}/output`,{recursive:true});
const finalPath=integrated?`${D}/output/integrated_validated_v2.pptx`:`${D}/output/authored_validated_v2.pptx`;
const tables=integrated?[9,10,11,12,13,14,15,34]:[1,2,3,4,5,6,7,8];
const charts=integrated?[9,12]:[1,4];
const result=await finalizePresentation({
 workspaceDir:'C:/Ureka/ureca_project2/LLM_Test/presentation_work',candidatePath,finalPath,
 pythonExecutable:'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
 integrityValidatorPath:`${SK}/container_tools/inspect_presentation_package_integrity.py`,layoutValidatorPath:`${SK}/container_tools/inspect_presentation_layout_geometry.py`,
 explicitTotalSlideCount:integrated?35:n,
 expectedSlideSizeEmu:'13716000,7715250',
 layoutArgs:['--expected-slide-size-emu','13716000,7715250','--validate-bullet-geometry','--validate-heading-fit',...tables.flatMap(x=>['--require-native-table-slide',String(x)])],
 requiredNativeTableOwnerSlides:tables,requiredNativeChartOwnerSlides:charts,
 fontPolicy:{basis:'reference',families:['맑은 고딕'],referencePath:source,referenceSha256:createHash('sha256').update(await fs.readFile(source)).digest('hex')},
 materializeLiteralChartWorkbooks:!integrated,nativeChartTargetApplication:'portable',verifyArtifactToolImport:true,
 receiptPath:`${D}/${integrated?'integrated':'authored'}_v2.validation.json`
});
console.log(JSON.stringify({path:result.finalPath,sha256:result.finalSha256,integrity:result.packageIntegrity.status,layout:result.presentationLayout.findingCount,charts:result.nativeChartValidation.passed,import:result.firstPartyImport.passed}));
