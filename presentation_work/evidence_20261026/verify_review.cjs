const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = __dirname;
const ts = require('C:/Users/pc/AppData/Local/Programs/Microsoft VS Code/110a328ea5/resources/app/extensions/node_modules/typescript/lib/typescript.js');
const canvasPath=path.join(out,'UBot-evidence.canvas.tsx');
const compiled=ts.transpileModule(fs.readFileSync(canvasPath,'utf8'),{fileName:canvasPath,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,isolatedModules:true}});
if(compiled.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error)) throw Error(JSON.stringify(compiled.diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))));
console.log('Canvas TSX syntax: valid.');
const data = JSON.parse(fs.readFileSync(path.join(out, 'evidence_review.json'), 'utf8'));
const metrics = JSON.parse(fs.readFileSync(path.join(out, 'recomputed_metrics.json'), 'utf8'));
const off = JSON.parse(fs.readFileSync(path.join(out, 'off_tuned_vs_instruct.json'), 'utf8'));
for (const c of Object.values(off.comparisons)) if (c.expected_label_differences?.length) throw Error('OFF/Instruct expected labels differ');
if (off.comparisons.off_t1c__instruct_base.correct.n !== 405) throw Error('Wrong final OFF cohort');
if (data.sections.length !== 6) throw Error('Missing section');
for (const s of data.sections) {
  for (const t of s.tables) for (const row of t.rows) if (row.length !== t.headers.length) throw Error('Invalid table width: '+t.title);
  for (const id of s.sources) if (!data.sources.some(x=>x.id===id)) throw Error('Missing source '+id);
}
for (const s of data.sources) if (!fs.existsSync(s.path)) throw Error('Source path does not exist: '+s.path);
for (const [key,p] of Object.entries(metrics.pipeline_pairs)) if (p.expected_label_differences.length) throw Error('Different expected labels '+key);
if (metrics.prompt_pairs.base_local__i4.correct.n !== 900) throw Error('Wrong prompt cohort');
if (metrics.pipeline_pairs.single_v1__slot_v4.correct.n !== 350) throw Error('Wrong single-slot cohort');
if (metrics.pipeline_pairs.sub_v4__slot_v4.correct.n !== 339) throw Error('Wrong sub-slot cohort');
console.log('Data integrity: 6 sections, '+data.sources.length+' source anchors, table widths and paired cohorts valid.');
(async()=>{
  let browser;
  try {
    browser = await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
    const page = await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(pathToFileURL(path.join(out,'evidence_review.html')).href);
    const display = await page.evaluate(()=>({title:document.title,tables:document.querySelectorAll('table').length,sections:document.querySelectorAll('section').length,overflow:document.documentElement.scrollWidth>window.innerWidth}));
    if (display.overflow || display.tables!==data.sections.reduce((n,s)=>n+s.tables.length,0) || errors.length) throw Error(JSON.stringify({display,errors}));
    await page.screenshot({path:path.join(out,'review-overview.png')});
    await page.locator('a[href="#prompt"]').click();
    await page.screenshot({path:path.join(out,'review-prompt.png')});
    await page.locator('a[href="#scheduler"]').click();
    await page.screenshot({path:path.join(out,'review-scheduler.png')});
    console.log('HTML rendering: '+JSON.stringify(display));
  } finally { if(browser) await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
