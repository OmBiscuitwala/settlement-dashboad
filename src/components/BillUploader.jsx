import React, { useState } from "react";
import Tesseract from "tesseract.js";

function BillUploader({ onExtract }) {

  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  const handleUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setLoading(true);

    const result = await Tesseract.recognize(
      file,
      "eng",
      { logger: m => console.log(m) }
    );

    const extractedText = result.data.text;

    setText(extractedText);

    setLoading(false);

    onExtract(extractedText);
  };

  return (
    <div style={{ marginTop: "40px" }}>

      <h3>📄 Upload Merchant Invoice</h3>

      <input type="file" onChange={handleUpload} />

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

    </div>
  );
}

export default BillUploader;