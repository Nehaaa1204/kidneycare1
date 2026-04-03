import { useState } from "react";
import { Box, Button, Typography, Paper, CircularProgress } from "@mui/material";
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
    if (!file) { alert("Please select a scan to upload."); return; }

    const loggedInPatient = JSON.parse(localStorage.getItem("user"));
    const patientId = loggedInPatient?.username;
    if (!patientId) { alert("Session expired. Please login again."); return; }

    setLoading(true);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "patient_scans_unsigned");
      formData.append("cloud_name", "dsy2znu4i");

      // Step 1: Upload to Cloudinary
      const cloudRes = await axios.post(
        "https://api.cloudinary.com/v1_1/dsy2znu4i/image/upload",
        formData
      );
      const uploadedUrl = cloudRes.data.secure_url;
      setImageUrl(uploadedUrl);
      console.log("🔗 Uploaded:", uploadedUrl);

      // Step 2: Save to MongoDB
      await axios.post(`http://localhost:5000/api/scans/${patientId}`, {
        imageUrl: uploadedUrl
      });
      console.log("✅ Saved to DB!");

      // Step 3: Analyze CT scan via ml_server.py
      const analyzeRes = await axios.post(
        "http://localhost:5000/api/scans/test",
        { imageUrl: uploadedUrl }
      );
      console.log("🧠 Analysis:", analyzeRes.data);
      setAnalysis(analyzeRes.data);

    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Upload or analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 0, width: "100%" }}>
      <Typography variant="h6" sx={{
        mb: 2, fontWeight: 600, color: "#fff",
        textAlign: "center", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 1,
      }}>
        <FileImage size={22} /> Upload and Analyze Scan
      </Typography>

      <Box sx={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 2, border: "2px dashed rgba(255,255,255,0.3)",
        borderRadius: 2, p: 3, textAlign: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
      }}>
        <input
          type="file" accept="image/*"
          style={{ display: "none" }} id="scan-upload"
          onChange={handleFileChange}
        />
        <label htmlFor="scan-upload">
          <Button variant="contained" component="span" startIcon={<Upload />} sx={{
            borderRadius: 2, textTransform: "none", color: "#fff",
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
          }}>
            Choose File
          </Button>
        </label>

        {file && (
          <Typography variant="body1" sx={{ color: "#90caf9" }}>
            Selected: {file.name}
          </Typography>
        )}

        <Button variant="contained" startIcon={<Brain />}
          onClick={handleUpload} disabled={!file || loading}
          sx={{
            mt: 1, borderRadius: 2, textTransform: "none",
            backgroundColor: "rgba(183,28,28,0.8)", color: "#fff",
            "&:hover": { backgroundColor: "rgba(183,28,28,1)" },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Analyze Scan"}
        </Button>
      </Box>

      {/* Uploaded Image */}
      {imageUrl && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <img src={imageUrl} alt="Uploaded Scan" style={{
            width: "300px", borderRadius: "10px",
            marginBottom: "1rem", border: "2px solid rgba(255,255,255,0.2)",
          }} />
        </Box>
      )}

      {/* Analysis Result */}
      {analysis && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: "#90caf9", mb: 1 }}>
            🧠 CT Scan Analysis
          </Typography>
          <Paper sx={{
            p: 2, backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 2, color: "#ddd",
            border: `1px solid ${analysis.prediction === "Normal"
              ? "rgba(102,187,106,0.5)" : "rgba(239,83,80,0.5)"}`,
          }}>
            <Typography variant="h6" sx={{
              color: analysis.prediction === "Normal" ? "#66bb6a" : "#ef5350",
              fontWeight: "bold", mb: 1
            }}>
              {analysis.prediction === "Normal" ? "✅" : "⚠️"} {analysis.prediction || "No prediction"}
            </Typography>

            <Typography sx={{ mb: 1 }}>
              📊 <b>Confidence:</b> {analysis.confidence}%
            </Typography>

            {analysis.all_scores && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ mb: 0.5 }}><b>All Scores:</b></Typography>
                {Object.entries(analysis.all_scores).map(([label, score]) => (
                  <Typography key={label} sx={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                    • {label}: {score}%
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      )}

    </Box>  // ✅ closes the outer Box
  );        // ✅ closes return
}           // ✅ closes component