import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function renderPdfPageToJpeg(pdfPath, outJpegPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
  const context = canvas.getContext('2d');

  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };

  await page.render(renderContext).promise;

  const pngBuffer = canvas.toBuffer('image/png');
  
  // Convert PNG buffer to JPEG via Sharp
  await sharp(pngBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(outJpegPath);

  console.log(`Successfully converted ${pdfPath} (Page 1) to JPEG: ${outJpegPath}`);
}

const testPdf = path.join(ROOT_DIR, 'public', 'assets', '2026', 'akkaya-berk', 'work', 'original', 'sample-1.pdf');
const testOut = path.join(ROOT_DIR, 'public', 'assets', '2026', 'akkaya-berk', 'work', 'web', 'sample-1.jpg');

renderPdfPageToJpeg(testPdf, testOut).catch(err => {
  console.error('PDF Conversion error:', err);
});
