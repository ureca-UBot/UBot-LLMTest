import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const DIR='C:/Ureka/ureca_project2/LLM_Test/presentation_work';
const SKILL='C:/Users/pc/.codex/plugins/cache/openai-primary-runtime/presentations/26.1024.11018/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(`${SKILL}/container_tools/artifact_tool_utils.mjs`).href);
const referencePath=`${DIR}/build/reference.pptx`;
const owners=[1,2,3,7,8,9,10,11,12,13,14];
const result=await finalizePresentation({
 workspaceDir:DIR,candidatePath:`${DIR}/build/compact_draft.pptx`,finalPath:`${DIR}/output/UBot_조현빈_담당파트_3~4분.pptx`,
 pythonExecutable:'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
 integrityValidatorPath:`${SKILL}/container_tools/inspect_presentation_package_integrity.py`,layoutValidatorPath:`${SKILL}/container_tools/inspect_presentation_layout_geometry.py`,
 layoutArgs:['--expected-slide-size-emu','13712825,7713663','--validate-bullet-geometry','--validate-heading-fit',...owners.flatMap(n=>['--require-native-table-slide',String(n)])],
 requiredNativeTableOwnerSlides:owners,requiredNativeChartOwnerSlides:[4],
 fontPolicy:{basis:'reference',families:['굴림'],referencePath,referenceSha256:createHash('sha256').update(await fs.readFile(referencePath)).digest('hex')},
 materializeLiteralChartWorkbooks:true,nativeChartTargetApplication:'portable',verifyArtifactToolImport:true,
 receiptPath:`${DIR}/build/compact.validation.json`
});
console.log(JSON.stringify({path:result.finalPath,sha256:result.finalSha256,integrity:result.packageIntegrity.status,layout:result.presentationLayout.findingCount,charts:result.nativeChartValidation.passed,import:result.firstPartyImport.passed}));
