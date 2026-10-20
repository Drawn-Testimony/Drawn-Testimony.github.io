import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

class Compiler extends CompilerBase {
  createProcessCanvas(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    return canvas;
  }
  async compileTrack({ progressCallback, targetImages, basePercent }) {
    const list = [];
    for (let i = 0; i < targetImages.length; i++) {
      const imageList = buildTrackingImageList(targetImages[i]);
      const result = extractTrackingFeatures(imageList, () => {});
      list.push(result);
      progressCallback(basePercent + (100 - basePercent) * (i + 1) / targetImages.length);
    }
    return list;
  }
}

window.compileTarget = async (svgUrl) => {
  const response = await fetch(svgUrl);
  const source = await response.text();
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
  svg.querySelectorAll('image[id*="hidden"]').forEach((image) => image.remove());
  const viewBox = svg.viewBox.baseVal;
  const width = 1000;
  const height = Math.round(width * viewBox.height / viewBox.width);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  const image = new Image();
  const blobUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], {type: 'image/svg+xml'}));
  try {
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = blobUrl; });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const flattened = new Image();
    await new Promise((resolve, reject) => { flattened.onload = resolve; flattened.onerror = reject; flattened.src = canvas.toDataURL('image/png'); });
    const compiler = new Compiler();
    await compiler.compileImageTargets([flattened], () => {});
    return Array.from(compiler.exportData());
  } finally { URL.revokeObjectURL(blobUrl); }
};
