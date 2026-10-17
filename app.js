import { MAX_PIXELS, clone, pixelAt, grayscale, editPixel, crop, resize, rotate90 } from './processing.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const tasks = {
  explore: {
    number: '1.1', title: 'Load & explore an image', technique: 'Array representation', action: 'Inspect image',
    description: 'Display the original image and inspect its dimensions, channel ordering, pixel count, and uncompressed memory size.',
    observation: 'Shape uses height before width. OpenCV’s three color channels are BGR; browser display data is RGBA. The source’s dimensions are preserved when it is loaded.',
    algorithm: 'Decode the image, display it, and inspect its numerical representation. Pixel count is width × height. For uint8, each channel occupies one byte; these are uncompressed array sizes, not JPEG file sizes.',
  },
  grayscale: {
    number: '1.2', title: 'Turn color into intensity', technique: 'BT.601 grayscale', action: 'Convert to grayscale',
    description: 'Combine three color components into a single brightness value. The image keeps its width and height while losing color information.',
    observation: 'Grayscale is a weighted combination, not a simple average. Green contributes most to brightness. Width and height stay unchanged; the logical OpenCV array has one channel.',
    algorithm: 'The live implementation uses 8-bit BT.601 fixed-point weights. Its displayed RGBA pixels repeat the same intensity in R, G, and B. In Python, cvtColor produces an actual two-dimensional array.',
  },
  pixel: {
    number: '1.3', title: 'One pixel. A visible difference.', technique: 'Pixel indexing & assignment', action: 'Change one pixel',
    description: 'Inspect a coordinate, read its RGB and BGR values, then change exactly one source pixel. Zoom views make the smallest edit easy to see.',
    observation: 'Use img[y, x], with row before column. A single-pixel edit is nearly invisible at full-image scale. Nearest-neighbor magnification shows the edit without smoothing it.',
    algorithm: 'Copy the original array and assign a new color at the selected coordinate. Display RGB values are reversed for the equivalent BGR representation. Before and after zooms show an up-to-11 × 11 neighborhood, including edge pixels.',
  },
  crop: {
    number: '2.1', title: 'Focus on a region of interest', technique: 'Array slicing', action: 'Crop the region',
    description: 'Select a rectangular ROI using its top-left coordinate and dimensions. The highlighted box previews exactly which source pixels will remain.',
    observation: 'Cropping selects content without resampling it. End coordinates are excluded in Python slices. A central crop can have the same dimensions as a smaller resize but show different content.',
    algorithm: 'Copy consecutive rows and columns inside the selected rectangle. The output width and height match the ROI dimensions exactly; retained pixel values do not change.',
  },
  resize: {
    number: '2.2', title: 'Give the image a new scale', technique: 'Resampling & interpolation', action: 'Resize the image',
    description: 'Make the complete image smaller or larger. Explore how area averaging, bilinear interpolation, and nearest neighbor estimate output pixels.',
    observation: 'cv2.resize takes (width, height), while shape reports (height, width, channels). Reduction can discard detail; enlargement adds samples, not new scene information.',
    algorithm: 'Area averaging integrates the source pixels covered by each output pixel. Bilinear uses a half-pixel mapping with four neighboring samples. Nearest neighbor selects one source sample. Rounding can differ from optimized OpenCV resize kernels by a small intensity amount.',
  },
  rotate: {
    number: '2.3', title: 'A quarter-turn changes the view', technique: 'Exact pixel remapping', action: 'Rotate the image',
    description: 'Rotate the original image by exactly 90 degrees. Choose either direction and observe how width and height swap.',
    observation: 'A square image keeps the same dimensions after a quarter-turn. A rectangular image swaps width and height. No interpolation is needed: each pixel moves to an exact new position.',
    algorithm: 'Clockwise mapping sends (x, y) to (height − 1 − y, x). Counterclockwise mapping sends it to (y, width − 1 − x). All pixel values and the full content are preserved.',
  },
};

let source = null, sourceName = '', currentTask = 'explore', output = null, busy = false;
let sourceRevision = 0, requestId = 0, toastTimer, history = [], worker = null;
const requests = new Map();
const inputCanvas = $('#original-canvas'), outputCanvas = $('#output-canvas');
const numberFormat = new Intl.NumberFormat('en-US');
const numeric = (id) => { const raw = $(id).value; return raw.trim() ? Number(raw) : NaN; };
const shape = (image, channels = 3) => channels === 1 ? `(${image.height}, ${image.width})` : `(${image.height}, ${image.width}, ${channels})`;

function showError(message = '') { $('#error-message').textContent = message; $('#error-message').hidden = !message; }
function toast(message) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4000);
}
function setBusy(value, message = '') {
  busy = value;
  $('#process-button').disabled = value || !source;
  $('#sample-button').disabled = value;
  $('#image-upload').disabled = value;
  $('#reset-output').disabled = value;
  $$('.task-button').forEach(button => { button.disabled = value; });
  $('#process-status').textContent = message || (value ? 'Processing locally…' : 'Ready to explore');
  $('#process-status').classList.toggle('busy', value);
  $('#experiment-form').setAttribute('aria-busy', String(value));
}
function paint(canvas, image) {
  canvas.width = image.width; canvas.height = image.height;
  canvas.getContext('2d').putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
}
function resetOutput() {
  output = null;
  outputCanvas.hidden = true; outputCanvas.width = outputCanvas.height = 1;
  $('#output-empty').hidden = false; $('#output-dimensions').textContent = '—';
  $('#output-shape').textContent = 'Your result appears here'; $('#download-output').disabled = true;
  $('#pixel-zooms').hidden = true;
  $('#observation').textContent = tasks[currentTask].observation;
}
function selectTask(name) {
  if (busy || !tasks[name]) return;
  currentTask = name; const task = tasks[name];
  $$('.task-button').forEach(button => { const selected = button.dataset.task === name; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); });
  $$('[data-controls]').forEach(panel => { panel.hidden = panel.dataset.controls !== name; });
  $('#task-number').textContent = `EXPERIMENT ${task.number}`;
  $('#task-title').textContent = task.title; $('#technique-tag').textContent = task.technique;
  $('#task-description').textContent = task.description; $('#process-button span').textContent = task.action;
  resetOutput(); showError();
  $('#process-status').textContent = source ? 'Ready to explore' : 'Choose an image';
  updatePixelReadout(); updateOverlays();
}

function initializeParameters() {
  const { width, height } = source;
  $('#pixel-x').value = Math.floor(width / 4); $('#pixel-y').value = Math.floor(height / 2);
  $('#pixel-x').max = width - 1; $('#pixel-y').max = height - 1;
  const x = Math.floor(width / 4), y = Math.floor(height / 4);
  $('#crop-x').value = x; $('#crop-y').value = y;
  $('#crop-width').value = Math.max(1, Math.floor(3 * width / 4) - x);
  $('#crop-height').value = Math.max(1, Math.floor(3 * height / 4) - y);
  $('#crop-x').max = width - 1; $('#crop-y').max = height - 1;
  $('#crop-width').max = width; $('#crop-height').max = height;
  setScale(.5);
}

async function loadSource(url, name, isObjectUrl = false) {
  const revision = ++sourceRevision;
  setBusy(true, 'Decoding image…'); showError();
  try {
    const image = new Image(); image.src = url; await image.decode();
    if (revision !== sourceRevision) return;
    const width = image.naturalWidth, height = image.naturalHeight;
    if (!width || !height || width * height > MAX_PIXELS) throw new Error('This image exceeds 10 million pixels. Choose a smaller image; the site never silently rescales your input.');
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, width, height);
    source = { width, height, data: data.data }; sourceName = name;
    paint(inputCanvas, source);
    $('#source-name').textContent = name;
    $('#source-info').textContent = `${width} × ${height} px · ${numberFormat.format(width * height)} pixels · 8-bit color`;
    $('#input-dimensions').textContent = `${width} × ${height}`;
    $('#input-shape').textContent = `BGR equivalent ${shape(source)}`;
    initializeParameters(); resetOutput(); updatePixelReadout(); updateOverlays();
    setBusy(false, 'Image ready');
  } catch (error) {
    if (revision !== sourceRevision) return;
    showError(`Could not load the image. ${error.message || 'Try a valid JPG, PNG, or WebP.'}`);
    setBusy(false, source ? 'Previous image retained' : 'Image not loaded');
  } finally { if (isObjectUrl) URL.revokeObjectURL(url); }
}

function updatePixelReadout() {
  if (!source) return;
  try {
    const p = pixelAt(source, numeric('#pixel-x'), numeric('#pixel-y'));
    $('#pixel-readout').textContent = `img[${p.y}, ${p.x}]  ·  RGB [${p.rgb.join(', ')}]  ·  BGR [${p.bgr.join(', ')}]  ·  Gray ${p.gray}`;
  } catch { $('#pixel-readout').textContent = `Use whole-number coordinates: X = 0–${source.width - 1}, Y = 0–${source.height - 1}.`; }
}

function updateOverlays() {
  const roi = $('#roi-overlay'), marker = $('#pixel-marker');
  roi.hidden = marker.hidden = true;
  if (!source || !inputCanvas.isConnected) return;
  const stageRect = $('#original-stage').getBoundingClientRect(), rect = inputCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const left = rect.left - stageRect.left, top = rect.top - stageRect.top;
  if (currentTask === 'crop') {
    const x = numeric('#crop-x'), y = numeric('#crop-y'), width = numeric('#crop-width'), height = numeric('#crop-height');
    if (![x, y, width, height].every(Number.isInteger) || x < 0 || y < 0 || width < 1 || height < 1 || x + width > source.width || y + height > source.height) return;
    Object.assign(roi.style, { left: `${left + x / source.width * rect.width}px`, top: `${top + y / source.height * rect.height}px`, width: `${width / source.width * rect.width}px`, height: `${height / source.height * rect.height}px` });
    roi.hidden = false;
  }
  if (currentTask === 'pixel') {
    try {
      const p = pixelAt(source, numeric('#pixel-x'), numeric('#pixel-y'));
      Object.assign(marker.style, { left: `${left + (p.x + .5) / source.width * rect.width}px`, top: `${top + (p.y + .5) / source.height * rect.height}px` });
      marker.hidden = false;
    } catch { /* Invalid coordinates are explained in the readout and on submit. */ }
  }
}

function setScale(scale) {
  if (!source) return;
  $('#resize-width').value = Math.max(1, Math.round(source.width * scale));
  $('#resize-height').value = Math.max(1, Math.round(source.height * scale));
  $('#resize-method').value = scale <= 1 ? 'area' : 'bilinear';
}

function parametersForTask() {
  switch (currentTask) {
    case 'pixel': {
      const hex = $('#pixel-color').value;
      return { x: numeric('#pixel-x'), y: numeric('#pixel-y'), rgb: [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)) };
    }
    case 'crop': return { x: numeric('#crop-x'), y: numeric('#crop-y'), width: numeric('#crop-width'), height: numeric('#crop-height') };
    case 'resize': return { width: numeric('#resize-width'), height: numeric('#resize-height'), method: $('#resize-method').value };
    case 'rotate': return { direction: $('#rotation-direction').value };
    default: return {};
  }
}

function localOperation(operation, image, parameters) {
  switch (operation) {
    case 'grayscale': return grayscale(image);
    case 'pixel': return editPixel(image, parameters.x, parameters.y, parameters.rgb);
    case 'crop': return crop(image, parameters.x, parameters.y, parameters.width, parameters.height);
    case 'resize': return resize(image, parameters.width, parameters.height, parameters.method);
    case 'rotate': return rotate90(image, parameters.direction);
    default: return clone(image);
  }
}

try {
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const pending = requests.get(data.id); if (!pending) return;
    clearTimeout(pending.timeout); requests.delete(data.id);
    if (data.error) pending.reject(new Error(data.error)); else pending.resolve(data);
  };
  worker.onerror = () => {
    worker?.terminate(); worker = null;
    for (const pending of requests.values()) { clearTimeout(pending.timeout); pending.reject(new Error('Background processing could not start. Run again to use the browser fallback.')); }
    requests.clear();
  };
} catch { worker = null; }

async function processImage(operation, parameters) {
  if (operation === 'explore' || !worker) {
    await new Promise(resolve => setTimeout(resolve, 15));
    const start = performance.now();
    return { output: localOperation(operation, source, parameters), elapsed: performance.now() - start };
  }
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      requests.delete(id); worker?.terminate(); worker = null;
      reject(new Error('Processing exceeded 45 seconds. Try a smaller image or fewer output pixels.'));
    }, 45000);
    requests.set(id, { resolve, reject, timeout });
    worker.postMessage({ id, operation, image: source, parameters });
  });
}

function showZooms(result, parameters) {
  const x = parameters.x, y = parameters.y;
  const left = Math.max(0, x - 5), top = Math.max(0, y - 5);
  const width = Math.min(source.width, x + 6) - left, height = Math.min(source.height, y + 6) - top;
  for (const [canvasId, image] of [['#zoom-before', source], ['#zoom-after', result]]) {
    const region = crop(image, left, top, width, height);
    const enlarged = resize(region, 220, 220, 'nearest'); paint($(canvasId), enlarged);
  }
  const before = pixelAt(source, x, y), after = pixelAt(result, x, y);
  $('#zoom-note').textContent = `BGR [${before.bgr.join(', ')}] → [${after.bgr.join(', ')}]. This ${width} × ${height} neighborhood is magnified with nearest neighbor; only the selected source pixel is assigned a new value.`;
  $('#pixel-zooms').hidden = false;
}

function observedResult(task, result, parameters, elapsed) {
  const dimensions = `${result.width} × ${result.height}`;
  switch (task) {
    case 'explore': return `Loaded ${source.width} × ${source.height}, with ${numberFormat.format(source.width * source.height)} pixels. Equivalent uint8 BGR array: ${shape(source)} and ${numberFormat.format(source.width * source.height * 3)} bytes; browser RGBA buffer: ${numberFormat.format(source.data.byteLength)} bytes. These are uncompressed sizes.`;
    case 'grayscale': return `Grayscale conversion kept ${dimensions} pixels and changed 3 logical color channels to 1 intensity channel. OpenCV shape: ${shape(result, 1)}. Browser display repeats that intensity across RGB.`;
    case 'pixel': { const p = pixelAt(source, parameters.x, parameters.y), after = [...parameters.rgb].reverse(); const same = p.bgr.every((v, i) => v === after[i]); return `At (x=${p.x}, y=${p.y}), BGR [${p.bgr.join(', ')}] became [${after.join(', ')}]. ${same ? 'The chosen color equals the original, so there is no value difference.' : 'Exactly one source pixel changed.'} The original input is preserved; inspect the zoom views below.`; }
    case 'crop': return `Selected columns ${parameters.x}–${parameters.x + parameters.width - 1} and rows ${parameters.y}–${parameters.y + parameters.height - 1}. Output: ${dimensions}, ${((result.width * result.height) / (source.width * source.height) * 100).toFixed(1)}% of the source pixels. Selected values are copied without resampling.`;
    case 'resize': return `Resized ${source.width} × ${source.height} → ${dimensions} using ${parameters.method}. Scale: ${(result.width / source.width).toFixed(3)}× horizontally, ${(result.height / source.height).toFixed(3)}× vertically. ${result.width > source.width || result.height > source.height ? 'Enlargement adds samples without recovering new source detail.' : 'The whole image is retained at a different sampling resolution.'}`;
    case 'rotate': return `Rotated 90° ${parameters.direction}. ${source.width} × ${source.height} → ${dimensions}. ${source.width === source.height ? 'The source is square, so its dimensions remain the same.' : 'Width and height swapped.'} Pixel values are preserved without interpolation.`;
  }
}

function makePreview(canvas, size = 320) {
  const thumbnail = document.createElement('canvas');
  const scale = Math.min(1, size / Math.max(canvas.width, canvas.height));
  thumbnail.width = Math.max(1, Math.round(canvas.width * scale)); thumbnail.height = Math.max(1, Math.round(canvas.height * scale));
  thumbnail.getContext('2d').drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
  return thumbnail.toDataURL('image/webp', .82);
}
function recordResult(operation, result, parameters, elapsed) {
  const channels = operation === 'grayscale' ? 1 : 3;
  history.unshift({ experiment: tasks[operation].number, operation, title: tasks[operation].title, source: sourceName,
    input: { width: source.width, height: source.height, channels: 3 },
    output: { width: result.width, height: result.height, channels, shape: shape(result, channels) },
    parameters, elapsedMs: Number(elapsed.toFixed(2)), timestamp: new Date().toISOString(),
    implementation: 'JavaScript pixel operations; browser-decoded opaque RGBA', preview: makePreview(outputCanvas) });
  history = history.slice(0, 12); renderHistory();
}
function renderHistory() {
  const container = $('#session-results');
  $('#result-count').textContent = history.length; $('#export-results').disabled = !history.length; $('#clear-results').disabled = !history.length;
  if (!history.length) {
    container.innerHTML = '<div class="notebook-empty"><svg class="icon"><use href="#i-book"/></svg><div><strong>Your discoveries belong here.</strong><p>Run an experiment to record its dimensions, parameters, timing, and preview.</p></div><a href="#experiments">Start exploring <span>↗</span></a></div>';
    return;
  }
  container.replaceChildren(...history.map(record => {
    const card = document.createElement('article'); card.className = 'session-card';
    const img = document.createElement('img'); img.src = record.preview; img.alt = `${record.operation} result for ${record.source}`; img.width = 320; img.height = 200;
    const body = document.createElement('div'), title = document.createElement('strong'); title.textContent = `${record.experiment} · ${record.operation === 'explore' ? 'Image inspected' : record.title}`;
    const dimensions = document.createElement('span'); dimensions.textContent = `${record.output.width} × ${record.output.height} · ${record.output.channels} channel${record.output.channels > 1 ? 's' : ''} · ${record.elapsedMs} ms`;
    const filename = document.createElement('span'); filename.textContent = record.source;
    const download = document.createElement('a'); download.href = record.preview; download.download = `lab1-${record.operation}-preview.webp`; download.textContent = 'Save preview ↗';
    body.append(title, dimensions, filename, download); card.append(img, body); return card;
  }));
}

$('#experiment-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!source || busy) return;
  showError(); const operation = currentTask, parameters = parametersForTask(), revision = sourceRevision;
  setBusy(true);
  try {
    const { output: result, elapsed } = await processImage(operation, parameters);
    if (revision !== sourceRevision) return;
    output = result; paint(outputCanvas, result); outputCanvas.hidden = false; $('#output-empty').hidden = true;
    $('#output-dimensions').textContent = `${result.width} × ${result.height}`;
    $('#output-shape').textContent = `OpenCV shape ${shape(result, operation === 'grayscale' ? 1 : 3)}`;
    $('#download-output').disabled = false;
    $('#observation').textContent = observedResult(operation, result, parameters, elapsed);
    if (operation === 'pixel') showZooms(result, parameters); else $('#pixel-zooms').hidden = true;
    recordResult(operation, result, parameters, elapsed);
    setBusy(false, `Complete · ${elapsed.toFixed(1)} ms`);
  } catch (error) { showError(error.message || 'Could not process the image.'); setBusy(false, 'Check your parameters'); }
});

$$('.task-button').forEach(button => button.addEventListener('click', () => selectTask(button.dataset.task)));
$('#reset-output').addEventListener('click', () => { if (!busy) { resetOutput(); showError(); $('#process-status').textContent = 'Output reset'; } });
$('#sample-button').addEventListener('click', () => { if (!busy) loadSource(new URL('./assets/sample.jpg', import.meta.url).href, 'Handout sample · College of Computer Studies'); });
$('#image-upload').addEventListener('change', event => {
  const file = event.target.files[0]; if (!file || busy) return;
  event.target.value = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showError('Choose a JPG, PNG, or WebP image.'); return; }
  if (file.size > 30 * 1024 * 1024) { showError('This file exceeds 30 MB. Choose a smaller image.'); return; }
  loadSource(URL.createObjectURL(file), file.name, true);
});
for (const id of ['#pixel-x', '#pixel-y']) $(id).addEventListener('input', () => { updatePixelReadout(); updateOverlays(); });
for (const id of ['#crop-x', '#crop-y', '#crop-width', '#crop-height']) $(id).addEventListener('input', updateOverlays);
inputCanvas.addEventListener('click', event => {
  if (currentTask !== 'pixel' || !source || busy) return;
  const rect = inputCanvas.getBoundingClientRect();
  $('#pixel-x').value = Math.min(source.width - 1, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * source.width)));
  $('#pixel-y').value = Math.min(source.height - 1, Math.max(0, Math.floor((event.clientY - rect.top) / rect.height * source.height)));
  updatePixelReadout(); updateOverlays();
});
inputCanvas.addEventListener('keydown', event => {
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (currentTask !== 'pixel' || !source || busy || !directions[event.key]) return;
  event.preventDefault(); const [dx, dy] = directions[event.key];
  $('#pixel-x').value = Math.max(0, Math.min(source.width - 1, (numeric('#pixel-x') || 0) + dx));
  $('#pixel-y').value = Math.max(0, Math.min(source.height - 1, (numeric('#pixel-y') || 0) + dy));
  updatePixelReadout(); updateOverlays();
});
new ResizeObserver(updateOverlays).observe($('#original-stage'));
$$('[data-scale]').forEach(button => button.addEventListener('click', () => setScale(Number(button.dataset.scale))));
$('#resize-width').addEventListener('input', () => { if (source && $('#aspect-lock').checked) { const value = numeric('#resize-width'); $('#resize-height').value = Number.isFinite(value) && value > 0 ? Math.max(1, Math.round(value * source.height / source.width)) : ''; } });
$('#resize-height').addEventListener('input', () => { if (source && $('#aspect-lock').checked) { const value = numeric('#resize-height'); $('#resize-width').value = Number.isFinite(value) && value > 0 ? Math.max(1, Math.round(value * source.width / source.height)) : ''; } });
$('#aspect-lock').addEventListener('change', () => { if (source && $('#aspect-lock').checked) $('#resize-width').dispatchEvent(new Event('input')); });

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
}
$('#download-output').addEventListener('click', () => {
  if (!output) return;
  outputCanvas.toBlob(blob => { if (blob) downloadBlob(blob, `lab1-${currentTask}-${output.width}x${output.height}.png`); else showError('Your browser could not encode this output. Try a smaller image.'); }, 'image/png');
});
$('#export-results').addEventListener('click', () => {
  if (!history.length) return;
  const records = history.map(({ preview, ...record }) => record);
  downloadBlob(new Blob([JSON.stringify({ laboratory: 'CSST106 Lab 1 — Images and Image Processing', exportedAt: new Date().toISOString(), records }, null, 2)], { type: 'application/json' }), 'lab1-session.json');
});
$('#clear-results').addEventListener('click', () => { history = []; renderHistory(); toast('Session notebook cleared.'); });
// Public navigation exposes the compilation destination only.
document.querySelectorAll('[data-link="compilation"]').forEach(button => button.addEventListener('click', () => {
  try {
    const url = new URL(window.LAB_CONFIG?.compilationUrl || '');
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid compilation address.');
    window.location.assign(url.href);
  } catch { toast('The compilation link is not configured.'); }
}));

const menu = $('.menu-toggle'), navigation = $('#main-nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); navigation.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); navigation.classList.toggle('open', open); });
$$('#main-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
window.addEventListener('resize', () => { if (innerWidth > 700) closeMenu(); });
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: .08 });
  $$('.reveal').forEach(element => observer.observe(element));
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) $$('#main-nav a').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`)); });
  }, { rootMargin: '-15% 0px -60% 0px' });
  $$('main>section[id]').forEach(section => navObserver.observe(section));
}
selectTask('explore');
loadSource(new URL('./assets/sample.jpg', import.meta.url).href, 'Handout sample · College of Computer Studies');
