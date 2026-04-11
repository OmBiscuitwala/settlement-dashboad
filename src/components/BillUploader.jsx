import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { parseBill } from "../utils/billParser";
import { saveBill } from "../utils/billDatabase";

function BillUploader({ onExtract, merchantId }) {

  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [savedId, setSavedId] = useState(null);

  const handleUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setLoading(true);
    setSavedId(null);

    const result = await Tesseract.recognize(
      file,
      "eng",
      { logger: m => console.log(m) }
    );

    const extractedText = result.data.text;
    const ocrConfidence = result.data.confidence; // 0-100

    setText(extractedText);
    setLoading(false);

    // Parse amounts from OCR text
    const parsed = parseBill(extractedText);

    // Persist to IndexedDB with raw file blob for cross-checking
    if (merchantId) {
      try {
        const id = await saveBill({
          merchantId,
          fileName: file.name,
          fileBlob: file,
          ocrText: extractedText,
          ocrConfidence,
          parsedAmount: parsed.amount,
          parsedFee: parsed.fee,
        });
        setSavedId(id);
      } catch (err) {
        console.error("Failed to save bill to IndexedDB:", err);
      }
    }

    if (onExtract) onExtract(extractedText);
  };

  return (
    <div style={{ marginTop: "40px" }}>

      <h3>📄 Upload Merchant Invoice</h3>

      {/* Note: Tesseract.js handles images. PDFs are passed as-is; only the first
          page text may be extracted. For full PDF support, a PDF-to-image step
          would be required before OCR. */}
      <input type="file" accept="image/*,application/pdf" onChange={handleUpload} />

      {loading && <p>Processing invoice...</p>}

      {text && (
        <textarea
          value={text}
          readOnly
          style={{
            width: "100%",
            height: "150px",
            marginTop: "10px"
          }}
        />
      )}

      {savedId != null && (
        <p style={{ color: "green", marginTop: "6px", fontSize: "14px" }}>
          ✅ Bill saved (ID: #{savedId})
        </p>
      )}

    </div>
  );
}

export default BillUploader;