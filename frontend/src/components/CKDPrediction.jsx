import React, { useState, useEffect } from "react";
import {
  Box, Button, Typography, Paper, CircularProgress, TextField, Grid
} from "@mui/material";
import { Activity, Upload, FlaskConical, Save, Edit3 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function CKDPrediction() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // --- 1. LIVE CALCULATION LOGIC (CKD-EPI) ---
  const calculateLiveEgfr = (creat, age, sex) => {
    if (!creat || !age || !sex) return null;
    const sCr = parseFloat(creat);
    const vAge = parseInt(age);
    const isFemale = sex.toLowerCase() === "female";
    
    const k = isFemale ? 0.7 : 0.9;
    const a = isFemale ? -0.329 : -0.411;
    const genderFactor = isFemale ? 1.018 : 1.0;
    
    const egfr = 141 * Math.pow(Math.min(sCr / k, 1), a) * Math.pow(Math.max(sCr / k, 1), -1.209) * Math.pow(0.993, vAge) * genderFactor;
    return egfr.toFixed(2);
  };

  const getRiskAndStage = (egfr) => {
    if (!egfr) return { risk: "UNKNOWN", stage: "N/A" };
    const val = parseFloat(egfr);
    if (val >= 90) return { risk: "Low", stage: "Stage 1" };
    if (val >= 60) return { risk: "Moderate", stage: "Stage 2" };
    if (val >= 30) return { risk: "High", stage: "Stage 3" };
    if (val >= 15) return { risk: "High", stage: "Stage 4" };
    return { risk: "High", stage: "Stage 5 (Failure)" };
  };

  // --- 2. HANDLE MANUAL EDITS ---
  const handleInputChange = (field, value) => {
    const updatedResult = { ...result };
    
    if (field === "name" || field === "age" || field === "sex") {
      updatedResult.patient[field] = value;
    } else {
      updatedResult.values[field] = value;
    }

    // Recalculate eGFR automatically if parameters change
    const newEgfr = calculateLiveEgfr(
      updatedResult.values.creatinine_mg_dl,
      updatedResult.patient.age,
      updatedResult.patient.sex
    );
    
    updatedResult.values.egfr = newEgfr;
    const { risk, stage } = getRiskAndStage(newEgfr);
    updatedResult.ckd.risk = risk;
    updatedResult.ckd.stage = stage;

    setResult(updatedResult);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);

    if (selectedFile.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        setImagePreview(canvas.toDataURL());
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyze = async () => {
    if (!file) { alert("Please upload a lab report"); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8001/analyze", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis failed");
      }
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, textAlign: "center", color: "#1773cf", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <Activity size={28} /> AI CKD DIAGNOSTIC SYSTEM
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, textAlign: "center", mb: 2, bgcolor: "#fafafa" }}>
        <input type="file" accept="image/*,application/pdf" hidden id="ckd-upload" onChange={handleFileChange} />
        <label htmlFor="ckd-upload">
          <Button variant="outlined" component="span" startIcon={<Upload />}>Select Medical Report</Button>
        </label>
        {imagePreview && (
          <Box sx={{ mt: 2 }}><img src={imagePreview} alt="preview" style={{ maxHeight: 200, borderRadius: 8, border: "1px solid #ddd" }} /></Box>
        )}
        <Button sx={{ mt: 2 }} variant="contained" fullWidth onClick={handleAnalyze} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : "RUN AI ANALYSIS"}
        </Button>
      </Paper>

      {result && (
        <Paper elevation={4} sx={{ p: 3, mt: 3, borderTop: `10px solid ${result.ckd.risk === "High" ? "#d32f2f" : "#2e7d32"}` }}>
          
          {/* ML Prediction Header */}
          {/* <Box sx={{ mb: 3, p: 2, bgcolor: "#83d794", borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#64748b", display: "flex", alignItems: "center", gap: 1 }}>
              <FlaskConical size={18} /> ML MODEL PREDICTION
            </Typography>
            <Typography variant="h4" sx={{ my: 1, fontWeight: 900, color: result.mlResult?.prediction?.includes("Likely") ? "#d32f2f" : "#2e7d32" }}>
              {result.mlResult?.prediction}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Confidence: {result.mlResult?.confidence}
            </Typography>
          </Box> */}

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit3 size={20}/> Edit Extracted Data
          </Typography>

          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField 
                label="Patient Name" 
                fullWidth 
                value={result?.patient?.name || ""} 
                onChange={(e) => handleInputChange("patient", "name", e.target.value)} 
              />
            </Grid>
            <Grid size={6}>
              <TextField 
                label="Age" 
                type="number" 
                fullWidth 
                value={result?.patient?.age || ""} 
                onChange={(e) => handleInputChange("patient", "age", e.target.value)} 
              />
            </Grid>
            <Grid size={6}>
              <TextField 
                label="Sex" 
                fullWidth 
                value={result?.patient?.sex || ""} 
                onChange={(e) => handleInputChange("patient", "sex", e.target.value)} 
              />
            </Grid>
            <Grid size={6}>
              <TextField 
                label="Creatinine (mg/dL)" 
                type="number" 
                fullWidth 
                value={result?.values?.creatinine_mg_dl || ""} 
                onChange={(e) => handleInputChange("values", "creatinine_mg_dl", e.target.value)} 
              />
            </Grid>
            <Grid size={6}>
              <TextField 
                label="Urea (mg/dL)" 
                type="number" 
                fullWidth 
                value={result?.values?.urea_mg_dl || ""} 
                onChange={(e) => handleInputChange("values", "urea_mg_dl", e.target.value)} 
              />
            </Grid>
          </Grid>

          {/* Result Box */}
          <Box sx={{ mt: 3, p: 3, bgcolor: "#1e293b", borderRadius: 2, textAlign: 'center', color: 'white' }}>
            <Typography variant="h6" sx={{ color: "#94a3b8" }}>{result.ckd.stage}</Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, my: 1 }}>
                {result.values.egfr || "0.00"} <span style={{ fontSize: '1.5rem' }}>mL/min</span>
            </Typography>
            <Box sx={{ display: 'inline-block', px: 2, py: 0.5, borderRadius: 1, bgcolor: result.ckd.risk === "High" ? "#7f1d1d" : "#064e3b" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                RISK: {result.ckd.risk?.toUpperCase()}
              </Typography>
            </Box>
          </Box>

          <Button variant="contained" color="primary" fullWidth sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }} startIcon={<Save />}>
            SAVE UPDATED RECORD
          </Button>
        </Paper>
      )}
    </Box>
  );
}
