export async function extractBillTextFromImage(file) {
  const { recognize } = await import("tesseract.js");

  const {
    data: { text = "", confidence = 0 } = {},
  } = await recognize(file, "eng");

  return {
    text,
    confidence: Number(confidence) || 0,
  };
}
