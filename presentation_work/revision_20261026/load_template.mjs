import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const R='C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {PresentationFile,FileBlob}=await import(pathToFileURL(`${R}/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs`).href);
const p=await PresentationFile.importPptx(await FileBlob.load('C:/Ureka/ureca_project2/발표/프로젝트_발표자료_통합_정리.pptx'));
await fs.writeFile('template.inspect.ndjson',(await p.inspect({kind:'slide,layout,textbox',maxChars:140000})).ndjson);
await fs.writeFile('template.json',JSON.stringify(p.toProto()));
console.log('Imported',p.slides.items.length,'slides');
