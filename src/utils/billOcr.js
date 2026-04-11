/**
 * Convert the first page of a PDF file to an HTMLCanvasElement using pdfjs-dist.
 * Falls back gracefully if pdfjs fails.
 */
async function pdfToCanvas(file) {
  const pdfjsLib = await import("pdfjs-dist");

  // Point the PDF.js worker to its bundled web worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1); // render first page only

  const viewport = page.getViewport({ scale: 2.0 }); // scale up for better OCR accuracy
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas;
}

/**
 * Extract text and confidence from an image or PDF file.
 * PDFs are rendered to a canvas (first page) before OCR.
 */
export async function extractBillTextFromImage(file) {
  const { recognize } = await import("tesseract.js");

  let source = file;

  if (file.type === "application/pdf") {
    try {
      source = await pdfToCanvas(file);
    } catch (pdfErr) {
      console.warn("PDF render failed, attempting raw Tesseract on file:", pdfErr);
      // source stays as the raw file — Tesseract will attempt it anyway
    }
  }

  const {
    data: { text = "", confidence = 0 } = {},
  } = await recognize(source, "eng");

  return {
    text,
    confidence: Number(confidence) || 0,
  };
}
