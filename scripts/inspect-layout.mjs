import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:900}});
await page.goto('http://127.0.0.1:4173/lab-01/');await page.locator('#process-button').waitFor({state:'visible'});
for(const width of [390,320,768,1440]){
  await page.setViewportSize({width,height:1000});
  await page.locator('[data-task="rotate"]').click();
  const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,class:e.className?.baseVal??e.className,id:e.id,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})).filter(e=>e.right>innerWidth+.5||e.left<-.5)}));
  console.log(JSON.stringify(state,null,2));
}
await page.screenshot({path:'artifacts/desktop-initial.png',fullPage:true});
await browser.close();
