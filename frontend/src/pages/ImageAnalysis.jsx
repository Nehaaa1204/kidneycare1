import { useState } from "react";
import { analyzeImage } from "../api/api";

export default function ImageAnalysis() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await analyzeImage(formData);
    setResult(data);
  };

  return (
    <div className="container">
      <h2>Image Analysis</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button className="btn" onClick={handleUpload}>
        Analyze
      </button>
      {result && (
        <div className="card">
          <p><b>Prediction:</b> {result.prediction}</p>
          <p><b>Confidence:</b> {result.confidence}%</p>
        </div>
      )}
    </div>
  );
}
