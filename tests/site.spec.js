import { test, expect } from '@playwright/test';
import { deflateSync } from 'node:zlib';

function crc32(buffer) { let crc=0xffffffff; for(const value of buffer){crc^=value;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}return(crc^0xffffffff)>>>0; }
function pngFixture() {
  const chunk=(name,data)=>{const type=Buffer.from(name),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);type.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([type,data])),out.length-4);return out;};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(3,0);ihdr.writeUInt32BE(2,4);ihdr[8]=8;ihdr[9]=6;
  const pixels=Buffer.from([0,255,0,0,255,0,255,0,255,0,0,255,255,0,201,111,23,255,255,255,255,255,0,0,0,255]);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
async function ready(page) {
  await page.goto('./'); await expect(page.locator('#process-button')).toBeEnabled();
}
async function run(page) {
  await page.locator('#process-button').click();
  await expect(page.locator('#process-status')).toContainText('Complete', { timeout:30000 });
  await expect(page.locator('#error-message')).toBeHidden();
}
async function select(page, task) { await page.locator(`[data-task="${task}"]`).click(); }
async function pixel(page, canvas, x, y) { return page.locator(canvas).evaluate((c,{x,y})=>Array.from(c.getContext('2d').getImageData(x,y,1,1).data),{x,y}); }

test('all six experiments run with genuine pixel output and preserved original',async({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  await run(page); await expect(page.locator('#output-shape')).toContainText('(2048, 2048, 3)');
  await select(page,'grayscale'); await run(page);
  await expect(page.locator('#output-shape')).toContainText('(2048, 2048)');
  const gray=await pixel(page,'#output-canvas',512,1024); expect(gray[0]).toBe(gray[1]);expect(gray[1]).toBe(gray[2]);
  await select(page,'pixel'); await page.locator('#pixel-x').fill('0');await page.locator('#pixel-y').fill('0');await page.locator('#pixel-color').fill('#ff0000');
  const before=await pixel(page,'#original-canvas',0,0);await run(page);
  expect(await pixel(page,'#output-canvas',0,0)).toEqual([255,0,0,255]);expect(await pixel(page,'#original-canvas',0,0)).toEqual(before);
  await expect(page.locator('#pixel-zooms')).toBeVisible();
  const changed=await page.evaluate(()=>{const a=document.querySelector('#original-canvas'),b=document.querySelector('#output-canvas');const x=a.getContext('2d').getImageData(0,0,a.width,a.height).data,y=b.getContext('2d').getImageData(0,0,b.width,b.height).data;let count=0;for(let i=0;i<x.length;i+=4)if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2])count++;return count;});expect(changed).toBe(1);
  await select(page,'crop');await run(page);await expect(page.locator('#output-dimensions')).toHaveText('1024 × 1024');
  expect(await pixel(page,'#output-canvas',0,0)).toEqual(await pixel(page,'#original-canvas',512,512));
  await select(page,'resize');await run(page);await expect(page.locator('#output-dimensions')).toHaveText('1024 × 1024');
  await page.locator('[data-scale="1.5"]').click();await run(page);await expect(page.locator('#output-dimensions')).toHaveText('3072 × 3072');
  await select(page,'rotate');await run(page);
  expect(await pixel(page,'#output-canvas',2047,0)).toEqual(await pixel(page,'#original-canvas',0,0));
  await expect(page.locator('#result-count')).toHaveText('7');expect(errors).toEqual([]);
});

test('uploaded rectangular PNG preserves coordinates and swaps dimensions on rotation',async({page})=>{
  await ready(page);await page.locator('#image-upload').setInputFiles({name:'rectangle.png',mimeType:'image/png',buffer:pngFixture()});
  await expect(page.locator('#source-info')).toContainText('3 × 2 px');
  expect(await pixel(page,'#original-canvas',0,1)).toEqual([201,111,23,255]);
  await select(page,'pixel');await page.locator('#pixel-x').fill('0');await page.locator('#pixel-y').fill('1');await expect(page.locator('#pixel-readout')).toContainText('BGR [23, 111, 201]');
  await page.locator('#original-canvas').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#pixel-x')).toHaveValue('1');
  await select(page,'rotate');await run(page);await expect(page.locator('#output-dimensions')).toHaveText('2 × 3');
  expect(await pixel(page,'#output-canvas',0,0)).toEqual([201,111,23,255]);
  await page.locator('#rotation-direction').selectOption('counterclockwise');await run(page);
  expect(await pixel(page,'#output-canvas',0,2)).toEqual([255,0,0,255]);
});

test('invalid inputs are explained and prior input is retained',async({page})=>{
  await ready(page);await select(page,'crop');await page.locator('#crop-width').fill('99999');
  await page.locator('#process-button').click();await expect(page.locator('#error-message')).toContainText('Crop width must');
  await select(page,'pixel');await page.locator('#pixel-x').fill('');await page.locator('#process-button').click();await expect(page.locator('#error-message')).toContainText('X must');
  await select(page,'resize');await page.locator('[data-scale="1.5"]').click();await page.locator('#resize-method').selectOption('area');await page.locator('#process-button').click();await expect(page.locator('#error-message')).toContainText('for reduction');
  await page.locator('#image-upload').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});
  await expect(page.locator('#error-message')).toContainText('Could not load');await expect(page.locator('#input-dimensions')).toHaveText('2048 × 2048');
  await page.locator('#image-upload').setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('text')});await expect(page.locator('#error-message')).toContainText('Choose a JPG');
  await expect(page.locator('#result-count')).toHaveText('0');
});

test('downloads, source code, session export and real link configuration work',async({page,request})=>{
  await ready(page);await select(page,'grayscale');await run(page);
  const png=page.waitForEvent('download');await page.locator('#download-output').click();expect((await png).suggestedFilename()).toBe('lab1-grayscale-2048x2048.png');
  const json=page.waitForEvent('download');await page.locator('#export-results').click();const exportFile=await json;const stream=await exportFile.createReadStream();let body='';for await(const part of stream)body+=part;const session=JSON.parse(body);expect(session.records[0].operation).toBe('grayscale');expect(session.records[0].output.channels).toBe(1);
  for(const path of ['downloads/python-lab1.zip','python/part1.py','python/part2.py','downloads/ANSWERS.md','report/index.html']){const response=await request.get(`http://127.0.0.1:4173/lab-01/${path}`);expect(response.ok(),path).toBeTruthy();}
  await page.locator('.code-details summary').click();await expect(page.locator('#python-code')).toContainText('cv2.cvtColor');
  await page.locator('[data-link="compilation"]').first().click();await expect(page.locator('#settings-dialog')).toBeVisible();await expect(page.locator('#compilation-url')).toBeFocused();
  await page.locator('#compilation-url').fill('https://example.com/portfolio/');await page.locator('#repository-url').fill('https://github.com/example/lab1');await page.locator('#settings-form button[type=submit]').click();
  await page.reload();await expect(page.locator('#process-button')).toBeEnabled();await page.locator('#open-settings').click();await expect(page.locator('#compilation-url')).toHaveValue('https://example.com/portfolio/');
  await page.locator('#compilation-url').fill('javascript:alert(1)');await page.locator('#settings-form button[type=submit]').click();await expect(page.locator('#settings-error')).toContainText('HTTP or HTTPS');
  await page.keyboard.press('Escape');await expect(page.locator('#settings-dialog')).toBeHidden();
});

test('mobile navigation, narrow layouts, reduced motion and reference report',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
  await page.locator('.menu-toggle').click();await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded','true');await page.locator('#main-nav a[href="#experiments"]').click();await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded','false');
  for(const width of [390,320,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page overflow at ${width}`).toBeTruthy();
    for(const task of ['explore','grayscale','pixel','crop','resize','rotate']){
      await select(page,task);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${task} overflow at ${width}`).toBeTruthy();
    }
    await page.locator('.code-details summary').click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Expanded code overflow at ${width}`).toBeTruthy();
    await page.locator('.code-details summary').click();
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto('./');await expect(page.locator('#process-button')).toBeEnabled();
  for(const section of ['#overview','#objectives','#experiments','#results','#questions','#conclusion'])await page.locator(section).scrollIntoViewIfNeeded();
  await page.locator('body img').evaluateAll(images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));
  await page.locator('#home').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/lab1-desktop.png',fullPage:true});await page.screenshot({path:'artifacts/lab1-hero.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/lab1-mobile.png',fullPage:true});
  await page.goto('./report/index.html');await expect(page.locator('h1').first()).toContainText('Image Representation');
  expect(await page.locator('img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0))).toBeTruthy();expect(errors).toEqual([]);
});
