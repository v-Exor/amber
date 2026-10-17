import { grayscale, crop, resize, rotate90, editPixel } from './processing.js';
self.onmessage = ({ data: { id, operation, image, parameters } }) => {
  try {
    const start = performance.now();
    let output;
    switch (operation) {
      case 'grayscale': output = grayscale(image); break;
      case 'pixel': output = editPixel(image, parameters.x, parameters.y, parameters.rgb); break;
      case 'crop': output = crop(image, parameters.x, parameters.y, parameters.width, parameters.height); break;
      case 'resize': output = resize(image, parameters.width, parameters.height, parameters.method); break;
      case 'rotate': output = rotate90(image, parameters.direction); break;
      default: throw new Error('Unknown image operation.');
    }
    self.postMessage({ id, output, elapsed: performance.now() - start }, [output.data.buffer]);
  } catch (error) { self.postMessage({ id, error: error.message }); }
};
