import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile, mkdir } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage();
await page.goto('http://127.0.0.1:4173/lab-01/');
await page.locator('#process-button').waitFor({state:'visible'});
await page.waitForFunction(()=>!document.querySelector('#process-button').disabled);
const runs=[];
async function audit(state){
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  runs.push({state,violations:result.violations});
  console.log(JSON.stringify({state,violations:result.violations.map(v=>({id:v.id,count:v.nodes.length,targets:v.nodes.map(n=>n.target)}))}));
}
await audit('desktop overview');
await page.locator('[data-task="pixel"]').click();await page.locator('#process-button').click();await page.waitForFunction(()=>document.querySelector('#process-status').textContent.includes('Complete'));
await page.locator('.code-details summary').click();
await page.locator('.qa-list details').evaluateAll(details=>details.forEach(d=>d.open=true));
await audit('pixel result, zooms, expanded code and answers');
await page.locator('#open-settings').click();await audit('link configuration dialog');await page.keyboard.press('Escape');
await page.setViewportSize({width:390,height:844});await page.locator('[data-task="resize"]').click();await audit('mobile resize');
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/accessibility.json',JSON.stringify(runs,null,2));
if(runs.some(run=>run.violations.length))process.exitCode=1;
await browser.close();
