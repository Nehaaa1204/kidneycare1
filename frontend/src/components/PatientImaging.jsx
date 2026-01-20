import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { Upload, FileImage, Brain } from "lucide-react";
import axios from "axios";

export default function PatientImaging() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); 

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnalysis(null);
    setImageUrl(null);
  };

  const handleUpload = async () => {
  if (!file) {
    alert("Please select a scan to upload.");
    return;
  }

  setLoading(true);
  setAnalysis(null);

  try {
    console.log("📤 Starting Cloudinary upload...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "patient_scans_unsigned");
    formData.append("cloud_name", "dsy2znu4i");

    // ✅ Upload to Cloudinary
    const cloudRes = await axios.post(
      "https://api.cloudinary.com/v1_1/dsy2znu4i/image/upload",
      formData
    );

    // ✅ DEFINE FIRST
    const uploadedUrl = cloudRes.data.secure_url;

    console.log("🔗 Uploaded image URL:", uploadedUrl);

    // ✅ THEN USE
    setImageUrl(uploadedUrl);

    // ✅ Send to backend
    const analyzeRes = await axios.post(
      "http://localhost:5000/api/scans/test",
      {
        imageUrl: uploadedUrl,
      }
    );

    setAnalysis(analyzeRes.data);

  } catch (err) {
    console.error("❌ Full error object:", err);
    alert("❌ Upload or analysis failed.");
  } finally {
    setLoading(false);
  }
};



  return (
    // new
    <Box sx={{ p: 0, width: "100%" }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: 600, color: "#ffffffff", textAlign: "center", justifyContent: "center", display: "flex", alignItems: "center", gap: 1 }}
      >
        <FileImage size={22} /> Upload and Analyze Scan
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          border: "2px dashed rgba(255,255,255,0.3)",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      >
        <input
          type="file"
          accept="image/*,"
          style={{ display: "none" }}
          id="scan-upload"
          onChange={handleFileChange}
        />
        <label htmlFor="scan-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<Upload />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            Choose File
          </Button>
        </label>

        {file && (
          <Typography variant="body1" sx={{ color: "#90caf9" }}>
            Selected: {file.name}
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<Brain />}
          onClick={handleUpload}
          disabled={!file || loading}
          sx={{
            mt: 1,
            borderRadius: 2,
            textTransform: "none",
            backgroundColor: "rgba(183,28,28,0.8)",
            color: "#fff",
            "&:hover": {
              backgroundColor: "rgba(183,28,28,1)",
            },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Analyze Scan"}
        </Button>
      </Box>

       {/* Show Uploaded Image */}
      {imageUrl && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <img
            src={imageUrl}
            alt="Uploaded Scan"
            style={{
              width: "300px",
              borderRadius: "10px",
              marginBottom: "1rem",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          />
        </Box>
      )}

      {analysis && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: "#90caf9", mb: 1 }}>
            🧠 Analysis Result
          </Typography>
          <Paper
            sx={{
              p: 2,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              color: "#ddd",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            
              
              <Typography>
                <b>Prediction: </b> {analysis.result || analysis.prediction || analysis.message}
              </Typography>

              {analysis.confidence && (
              <Typography>
                  <b>Confidence:</b> {analysis.confidence}%
                </Typography>
              )}

          </Paper>
        </Box>
      )}
    </Box>
  );
}
