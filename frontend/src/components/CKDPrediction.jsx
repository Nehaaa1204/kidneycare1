import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { Upload, Activity, FlaskConical } from "lucide-react";

export default function CKDPrediction() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleAnalyze = () => {
    if (!file) {
      alert("Please upload a report before analyzing.");
      return;
    }

    setLoading(true);

    // Simulate backend delay
    setTimeout(() => {
      setLoading(false);

      // Mock random results for demo
      const randomRisk = ["Low", "Moderate", "High"];
      const randomStages = [
        "Stage 1: Kidney damage with normal or increased GFR (≥90)",
        "Stage 2: Mild reduction in GFR (60–89)",
        "Stage 3: Moderate reduction in GFR (30–59)",
        "Stage 4: Severe reduction in GFR (15–29)",
        "Stage 5: Kidney failure (GFR <15)",
      ];

      const randomResult = {
        risk: randomRisk[Math.floor(Math.random() * randomRisk.length)],
        stage: randomStages[Math.floor(Math.random() * randomStages.length)],
        summary:
          "This is a simulated analysis result for demonstration purposes. Once backend integration is done, real predictions will appear here.",
      };

      setResult(randomResult);
    }, 2000);
  };

  return (
    // new
    <Box sx={{ p: 0, width: "100%" }}>


      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 600,
          color: "#f5f5f5ff",
          display: "flex",
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Activity size={22} /> CKD Prediction
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
          accept="image/*,.pdf,.csv"
          style={{ display: "none" }}
          id="ckd-upload"
          onChange={handleFileChange}
        />
        <label htmlFor="ckd-upload">
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
            Upload Lab Report
          </Button>
        </label>

        {file && (
          <Typography variant="body1" sx={{ color: "#90caf9" }}>
            Selected File: {file.name}
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<FlaskConical />}
          onClick={handleAnalyze}
          disabled={!file || loading}
          sx={{
            mt: 1,
            borderRadius: 2,
            textTransform: "none",
            backgroundColor: "rgba(25,118,210,0.8)",
            color: "#fff",
            "&:hover": {
              backgroundColor: "rgba(25,118,210,1)",
            },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Analyze CKD Risk"}
        </Button>
      </Box>

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: "#f48fb1", mb: 1 }}>
            🧬 Analysis Result
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
            <Typography variant="body1">
              <strong>Risk Factor:</strong> {result.risk}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <strong>Stage:</strong> {result.stage}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: "#aaa" }}>
              {result.summary}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
