/** Pure image operations. Data is interleaved RGBA; image inputs are opaque. */
export const MAX_PIXELS = 10_000_000;

export function validateImage(image) {
  if (!image || !Number.isInteger(image.width) || !Number.isInteger(image.height) ||
      image.width < 1 || image.height < 1 || image.width * image.height > MAX_PIXELS ||
      image.data?.length !== image.width * image.height * 4) {
    throw new Error('Image must contain 1–10 million pixels with valid RGBA data.');
  }
  return image;
}

function integer(value, min, max, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return n;
}

function allocate(width, height) {
  if (width * height > MAX_PIXELS) throw new Error('Output is too large. Keep the result at or below 10 million pixels.');
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

export function clone(image) {
  validateImage(image);
  return { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) };
}

export function grayValue(r, g, b) {
  // OpenCV's 8-bit BT.601 fixed-point coefficients, in RGB order.
  return (r * 9798 + g * 19235 + b * 3735 + 16384) >> 15;
}

export function grayscale(image) {
  const output = clone(image);
  for (let i = 0; i < output.data.length; i += 4) {
    const y = grayValue(image.data[i], image.data[i + 1], image.data[i + 2]);
    output.data[i] = output.data[i + 1] = output.data[i + 2] = y;
  }
  return output;
}

export function pixelAt(image, x, y) {
  validateImage(image);
  x = integer(x, 0, image.width - 1, 'X');
  y = integer(y, 0, image.height - 1, 'Y');
  const i = (y * image.width + x) * 4;
  const rgb = Array.from(image.data.subarray(i, i + 3));
  return { x, y, rgb, bgr: [...rgb].reverse(), gray: grayValue(...rgb) };
}

export function editPixel(image, x, y, rgb) {
  pixelAt(image, x, y);
  if (!Array.isArray(rgb) || rgb.length !== 3) throw new Error('Specify three RGB components.');
  rgb.forEach(v => integer(v, 0, 255, 'Color component'));
  const output = clone(image);
  output.data.set([...rgb, 255], (Number(y) * image.width + Number(x)) * 4);
  return output;
}

export function crop(image, x, y, width, height) {
  validateImage(image);
  x = integer(x, 0, image.width - 1, 'Crop X');
  y = integer(y, 0, image.height - 1, 'Crop Y');
  width = integer(width, 1, image.width - x, 'Crop width');
  height = integer(height, 1, image.height - y, 'Crop height');
  const output = allocate(width, height);
  for (let row = 0; row < height; row++) {
    const offset = ((y + row) * image.width + x) * 4;
    output.data.set(image.data.subarray(offset, offset + width * 4), row * width * 4);
  }
  return output;
}

export function rotate90(image, direction = 'clockwise') {
  validateImage(image);
  if (!['clockwise', 'counterclockwise'].includes(direction)) throw new Error('Choose a valid rotation direction.');
  const output = allocate(image.height, image.width);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const dx = direction === 'clockwise' ? image.height - 1 - y : y;
      const dy = direction === 'clockwise' ? x : image.width - 1 - x;
      const source = (y * image.width + x) * 4;
      output.data.set(image.data.subarray(source, source + 4), (dy * output.width + dx) * 4);
    }
  }
  return output;
}

/** Half-pixel bilinear mapping; area integration for reduction. */
export function resize(image, width, height, method = 'bilinear') {
  validateImage(image);
  width = integer(width, 1, MAX_PIXELS, 'Width');
  height = integer(height, 1, MAX_PIXELS, 'Height');
  if (!['nearest', 'bilinear', 'area'].includes(method)) throw new Error('Choose a valid interpolation method.');
  if (method === 'area' && (width > image.width || height > image.height)) {
    throw new Error('Area averaging is for reduction. Choose bilinear or nearest for enlargement.');
  }
  const output = allocate(width, height);
  const sx = image.width / width, sy = image.height / height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dst = (y * width + x) * 4;
      if (method === 'nearest') {
        const src = (Math.floor(y * sy) * image.width + Math.floor(x * sx)) * 4;
        output.data.set(image.data.subarray(src, src + 4), dst);
      } else if (method === 'area') {
        const left = x * sx, right = (x + 1) * sx, top = y * sy, bottom = (y + 1) * sy;
        const sums = [0, 0, 0];
        for (let iy = Math.floor(top); iy < Math.min(image.height, Math.ceil(bottom)); iy++) {
          const wy = Math.min(iy + 1, bottom) - Math.max(iy, top);
          for (let ix = Math.floor(left); ix < Math.min(image.width, Math.ceil(right)); ix++) {
            const weight = wy * (Math.min(ix + 1, right) - Math.max(ix, left));
            const src = (iy * image.width + ix) * 4;
            for (let c = 0; c < 3; c++) sums[c] += image.data[src + c] * weight;
          }
        }
        for (let c = 0; c < 3; c++) output.data[dst + c] = Math.round(sums[c] / (sx * sy));
      } else {
        const fx = Math.max(0, Math.min(image.width - 1, (x + .5) * sx - .5));
        const fy = Math.max(0, Math.min(image.height - 1, (y + .5) * sy - .5));
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const x1 = Math.min(x0 + 1, image.width - 1), y1 = Math.min(y0 + 1, image.height - 1);
        const wx = fx - x0, wy = fy - y0;
        for (let c = 0; c < 3; c++) {
          const a = image.data[(y0 * image.width + x0) * 4 + c] * (1 - wx) + image.data[(y0 * image.width + x1) * 4 + c] * wx;
          const b = image.data[(y1 * image.width + x0) * 4 + c] * (1 - wx) + image.data[(y1 * image.width + x1) * 4 + c] * wx;
          output.data[dst + c] = Math.round(a * (1 - wy) + b * wy);
        }
      }
      output.data[dst + 3] = 255;
    }
  }
  return output;
}
