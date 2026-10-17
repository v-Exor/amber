import test from 'node:test';
import assert from 'node:assert/strict';
import { grayValue, grayscale, editPixel, pixelAt, crop, resize, rotate90 } from '../processing.js';

const fixture = { width: 3, height: 2, data: new Uint8ClampedArray([
  255,0,0,255, 0,255,0,255, 0,0,255,255,
  201,111,23,255, 255,255,255,255, 0,0,0,255,
]) };
test('grayscale preserves size and applies luminance weights', () => {
  assert.equal(grayValue(201,111,23),128);
  assert.equal(grayValue(255,0,0),76);
  assert.equal(grayValue(0,255,0),150);
  assert.equal(grayValue(0,0,255),29);
  const output=grayscale(fixture);
  assert.equal(output.width,3); assert.equal(output.height,2);
  for(let i=0;i<output.data.length;i+=4) { assert.equal(output.data[i],output.data[i+1]); assert.equal(output.data[i],output.data[i+2]); assert.equal(output.data[i+3],255); }
  assert.deepEqual(pixelAt(fixture,0,0).rgb,[255,0,0]);
});
test('BGR conversion and single-pixel assignment preserve original', () => {
  assert.deepEqual(pixelAt(fixture,0,1).bgr,[23,111,201]);
  const output=editPixel(fixture,0,1,[0,255,0]);
  let differences=0;
  for(let i=0;i<fixture.data.length;i+=4) if(!fixture.data.slice(i,i+4).every((v,c)=>v===output.data[i+c])) differences++;
  assert.equal(differences,1); assert.deepEqual(pixelAt(output,0,1).bgr,[0,255,0]);
  assert.deepEqual(pixelAt(fixture,0,1).bgr,[23,111,201]);
});
test('crop copies correct rows, excludes stop boundary, and handles edge ROI', () => {
  const output=crop(fixture,1,0,2,2);
  assert.equal(output.width,2); assert.equal(output.height,2);
  assert.deepEqual(Array.from(output.data),Array.from(new Uint8ClampedArray([0,255,0,255,0,0,255,255,255,255,255,255,0,0,0,255])));
  assert.deepEqual(pixelAt(crop(fixture,2,1,1,1),0,0).rgb,[0,0,0]);
  assert.throws(()=>crop(fixture,2,0,2,1),/Crop width/);
});
test('90-degree rotation swaps rectangular dimensions and maps exact pixels', () => {
  const cw=rotate90(fixture),ccw=rotate90(fixture,'counterclockwise');
  assert.equal(cw.width,2); assert.equal(cw.height,3);
  assert.deepEqual(pixelAt(cw,1,0).rgb,[255,0,0]);
  assert.deepEqual(pixelAt(cw,0,0).rgb,[201,111,23]);
  assert.deepEqual(pixelAt(ccw,0,2).rgb,[255,0,0]);
  assert.deepEqual(rotate90(cw,'counterclockwise'),fixture);
});
test('area reduction averages all source coverage and bilinear handles edges', () => {
  const checker={width:2,height:2,data:new Uint8ClampedArray([0,0,0,255,255,255,255,255,255,255,255,255,0,0,0,255])};
  assert.deepEqual(pixelAt(resize(checker,1,1,'area'),0,0).rgb,[128,128,128]);
  assert.deepEqual(pixelAt(resize(checker,3,3,'bilinear'),1,1).rgb,[128,128,128]);
  assert.deepEqual(pixelAt(resize(checker,4,4,'nearest'),3,0).rgb,[255,255,255]);
  assert.deepEqual(resize(fixture,3,2,'bilinear'),fixture);
  assert.throws(()=>resize(checker,3,3,'area'),/for reduction/);
});
test('fractional area footprints preserve weighted content',()=>{
  const strip={width:3,height:1,data:new Uint8ClampedArray([0,0,0,255,120,120,120,255,240,240,240,255])};
  const output=resize(strip,2,1,'area');
  assert.deepEqual(pixelAt(output,0,0).rgb,[40,40,40]);
  assert.deepEqual(pixelAt(output,1,0).rgb,[200,200,200]);
});
test('bad coordinates, colors, dimensions and oversized allocations are rejected',()=>{
  assert.throws(()=>pixelAt(fixture,3,0),/X must/);
  assert.throws(()=>pixelAt(fixture,-1,0),/X must/);
  assert.throws(()=>pixelAt(fixture,1.5,0),/whole number/);
  assert.throws(()=>editPixel(fixture,0,0,[0,300,0]),/Color component/);
  assert.throws(()=>resize(fixture,10000,10000),/too large/);
  assert.throws(()=>resize(fixture,0,1),/Width must/);
  assert.throws(()=>crop(fixture,0,0,NaN,1),/Crop width/);
  assert.throws(()=>rotate90(fixture,'invalid'),/direction/);
});
