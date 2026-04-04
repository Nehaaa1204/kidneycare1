import React, { useState, useEffect } from "react";
import {
  Box, Button, Typography, Paper, CircularProgress, TextField, Grid, Alert
} from "@mui/material";
import { Activity, Upload, FlaskConical, Save, Edit3 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import axios from "axios";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function CKDPrediction() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingPrediction, setSavingPrediction] = useState(false);
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
    if (!egfr) return { risk: "UNKNOWN", stage: "Unknown" };
    const val = parseFloat(egfr);
    if (val >= 90) return { risk: "Low", stage: "Stage 1 (Normal)" };
    if (val >= 60) return { risk: "Moderate", stage: "Stage 2 (Mild)" };
    if (val >= 45) return { risk: "High", stage: "Stage 3a (Moderate)" };
    if (val >= 30) return { risk: "High", stage: "Stage 3b (Moderate)" };
    if (val >= 15) return { risk: "High", stage: "Stage 4 (Severe)" };
    return { risk: "High", stage: "Stage 5 (Kidney Failure)" };
  };

  // --- 2. HANDLE MANUAL EDITS ---
  const handleInputChange = (field, value) => {
    if (!result) return;
    
    const updatedResult = { ...result };

    // Update based on field type
    if (field === "name") {
      updatedResult.patient = { ...updatedResult.patient, name: value };
    } else if (field === "age") {
      updatedResult.patient = { ...updatedResult.patient, age: value };
    } else if (field === "sex") {
      updatedResult.patient = { ...updatedResult.patient, sex: value };
    } else if (field === "creatinine_mg_dl") {
      updatedResult.values = { ...updatedResult.values, creatinine_mg_dl: value };
    } else if (field === "urea_mg_dl") {
      updatedResult.values = { ...updatedResult.values, urea_mg_dl: value };
    } else if (field === "id") {
      updatedResult.patient = { ...updatedResult.patient, id: value };
    }
    

    // Recalculate eGFR automatically if parameters change
    const newEgfr = calculateLiveEgfr(
      updatedResult.values?.creatinine_mg_dl,
      updatedResult.patient?.age,
      updatedResult.patient?.sex
    );
    
    if (newEgfr) {
      updatedResult.values = { ...updatedResult.values, egfr: newEgfr };
      const { risk, stage } = getRiskAndStage(newEgfr);
      updatedResult.ckd = { ...updatedResult.ckd, risk: risk, stage: stage };
    }

    setResult(updatedResult);
    console.log("Updated result:", updatedResult);
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

  // ✅ CALL FLASK API WITH DATA
  const callFlaskAPI = async (data) => {
    try {
      console.log("Calling Flask with:", data);
      
      const response = await fetch("https://kidneycare1-5.onrender.com/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: parseFloat(data.age) || 0,
          creatinine: parseFloat(data.creatinine) || 0,
          urea: parseFloat(data.urea) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get ML prediction");
      }

      const mlResult = await response.json();
      console.log("ML Result from Flask:", mlResult);
      
      return {
        ckd_detected: mlResult.ckd_detected,
        message: mlResult.message,
        confidence: mlResult.confidence,
        ckd_probability: mlResult.ckd_probability,
        normal_probability: mlResult.normal_probability,
      };
    } catch (error) {
      console.error("Error calling Flask:", error);
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (!file) { 
      alert("Please upload a lab report"); 
      return; 
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Get OCR results from FastAPI
      const response = await fetch("https://kidneycare1-2.onrender.com/analyze", { 
        method: "POST", 
        body: formData 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis failed");
      }
      
      const data = await response.json();
      console.log("OCR Analysis result:", data);
      
      // Step 2: Immediately call Flask API with extracted data
      const mlResult = await callFlaskAPI({
        age: data.patient?.age,
        creatinine: data.values?.creatinine_mg_dl,
        urea: data.values?.urea_mg_dl,
      });

      // Step 3: Combine OCR results + ML results
      const combinedResult = {
        ...data,
        mlResult: mlResult || {
          ckd_detected: false,
          message: "Unable to load ML prediction",
          confidence: 0,
          ckd_probability: 0,
          normal_probability: 0,
        }
      };
      
      setResult(combinedResult);
      console.log("Combined result:", combinedResult);
      
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAVE AND RE-ANALYZE WITH EDITED DATA
  // ✅ SAVE AND RE-ANALYZE WITH EDITED DATA
  const handleSaveAndReanalyze = async () => {
    if (!result) return;

    setSavingPrediction(true);
    console.log("Saving with data:", {
      age: result.patient?.age,
      creatinine: result.values?.creatinine_mg_dl,
      urea: result.values?.urea_mg_dl,
    });

    try {
      // Call Flask API with edited values
      const mlResult = await callFlaskAPI({
        age: result.patient?.age,
        creatinine: result.values?.creatinine_mg_dl,
        urea: result.values?.urea_mg_dl,
      });

      // Update result with NEW ML prediction
      const updatedResult = {
        ...result,
        mlResult: mlResult || {
          ckd_detected: false,
          message: "Unable to load ML prediction",
          confidence: 0,
          ckd_probability: 0,
          normal_probability: 0,
        }
      };
      
      setResult(updatedResult);
      
      // ✅ SAVE TO BACKEND
      try {
        // Get patientId from patient name
        const patientId = result.patient?.id || "Unknown_" + Date.now();
        
        console.log("Saving to backend with patientId:", patientId);

        const response = await fetch(
          `https://kidneycare1-backend.onrender.com/api/scans/${patientId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ckdDetected: mlResult?.ckd_detected,
              ckdProbability: mlResult?.ckd_probability || 0,
              normalProbability: mlResult?.normal_probability || 0,
              egfr: result.values?.egfr,
              ckdStage: result.ckd?.stage,
              message: mlResult?.message,
              imageUrl: imagePreview,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error:", errorText);
          throw new Error(`Backend error: ${response.status}`);
        }

        const savedData = await response.json();
        console.log("✅ Saved to backend:", savedData);
        alert("✅ CKD Prediction saved to Doctor Dashboard!");
      } catch (backendError) {
        console.error("Backend save error:", backendError);
        alert("✅ ML Prediction updated (backend save attempted)");
      }
      
    } catch (error) {
      console.error("Error:", error);
      alert(`Error saving record: ${error.message}`);
    } finally {
      setSavingPrediction(false);
    }
  };
  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 2 }}>
      {/* Header */}
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3, 
          fontWeight: 800, 
          textAlign: "center", 
          color: "#1773cf", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: 1 
        }}
      >
        <Activity size={28} /> AI CKD DIAGNOSTIC SYSTEM
      </Typography>

      {/* Upload Section */}
      <Paper 
        variant="outlined" 
        sx={{ p: 3, textAlign: "center", mb: 2, bgcolor: "#fafafa" }}
      >
        <input 
          type="file" 
          accept="image/*,application/pdf" 
          hidden 
          id="ckd-upload" 
          onChange={handleFileChange} 
        />
        <label htmlFor="ckd-upload">
          <Button 
            variant="outlined" 
            component="span" 
            startIcon={<Upload />}
          >
            Select Medical Report
          </Button>
        </label>
        
        {imagePreview && (
          <Box sx={{ mt: 2 }}>
            <img 
              src={imagePreview} 
              alt="preview" 
              style={{ 
                maxHeight: 200, 
                borderRadius: 8, 
                border: "1px solid #ddd" 
              }} 
            />
          </Box>
        )}
        
        <Button 
          sx={{ mt: 2 }} 
          variant="contained" 
          fullWidth 
          onClick={handleAnalyze} 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "RUN AI ANALYSIS"}
        </Button>
      </Paper>

      {/* Results Section */}
      {result && (
        <Paper 
          elevation={4} 
          sx={{ 
            p: 3, 
            mt: 3, 
            borderTop: `10px solid ${result.ckd?.risk === "High" ? "#d32f2f" : "#2e7d32"}` 
          }}
        >
          
          {/* ML Prediction Header */}
          <Box 
            sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: result.mlResult?.ckd_detected ? "#0b0b0b" : "#af994b",
              borderRadius: 2, 
              border: `1px solid ${result.mlResult?.ckd_detected ? "#ef5350" : "#81c784"}`
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: "bold", 
                color: "#64748b", 
                display: "flex", 
                alignItems: "center", 
                gap: 1 
              }}
            >
              <FlaskConical size={18} /> 🤖 ML MODEL PREDICTION
            </Typography>
            
            <Typography 
              variant="h4" 
              sx={{ 
                my: 1, 
                fontWeight: 900, 
                color: result.mlResult?.ckd_detected ? "#d32f2f" : "#2e7d32"
              }}
            >
              {result.mlResult?.message || "Analyzing..."}
            </Typography>
            
            <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ✅ CKD Confidence: <strong>{result.mlResult?.ckd_probability || 0}%</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ✅ Normal Confidence: <strong>{result.mlResult?.normal_probability || 0}%</strong>
              </Typography>
            </Box>
          </Box>

          {/* Edit Section */}
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}
          >
            <Edit3 size={20}/> Edit Extracted Data
          </Typography>

          {/* Input Fields */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                label="Patient ID" 
                fullWidth 
                value={result?.patient?.id || ""} 
                onChange={(e) => handleInputChange("id", e.target.value)}
                variant="outlined"
                placeholder="Enter unique patient ID"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField 
                label="Patient Name" 
                fullWidth 
                value={result?.patient?.name || ""} 
                onChange={(e) => handleInputChange("name", e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField 
                label="Age" 
                type="number" 
                fullWidth 
                value={result?.patient?.age || ""} 
                onChange={(e) => handleInputChange("age", e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField 
                label="Sex" 
                fullWidth 
                value={result?.patient?.sex || ""} 
                onChange={(e) => handleInputChange("sex", e.target.value)}
                variant="outlined"
                placeholder="Male/Female"
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField 
                label="Creatinine (mg/dL)" 
                type="number" 
                fullWidth 
                inputProps={{ step: "0.1" }}
                value={result?.values?.creatinine_mg_dl || ""} 
                onChange={(e) => handleInputChange("creatinine_mg_dl", e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField 
                label="Urea (mg/dL)" 
                type="number" 
                fullWidth 
                inputProps={{ step: "0.1" }}
                value={result?.values?.urea_mg_dl || ""} 
                onChange={(e) => handleInputChange("urea_mg_dl", e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>

          {/* Result Box - eGFR Display */}
          <Box 
            sx={{ 
              mt: 3, 
              p: 3, 
              bgcolor: "#1e293b", 
              borderRadius: 2, 
              textAlign: 'center', 
              color: 'white' 
            }}
          >
            <Typography variant="h6" sx={{ color: "#94a3b8" }}>
              {result.ckd?.stage || "Unknown"}
            </Typography>
            
            <Typography variant="h2" sx={{ fontWeight: 900, my: 1 }}>
              {result.values?.egfr || "0.00"} 
              <span style={{ fontSize: '1.5rem' }}> mL/min</span>
            </Typography>
            
            <Box 
              sx={{ 
                display: 'inline-block', 
                px: 2, 
                py: 0.5, 
                borderRadius: 1, 
                bgcolor: result.ckd?.risk === "High" ? "#7f1d1d" : "#064e3b" 
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                RISK: {result.ckd?.risk?.toUpperCase() || "UNKNOWN"}
              </Typography>
            </Box>
          </Box>

          {/* Save Button */}
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }} 
            startIcon={<Save />}
            onClick={handleSaveAndReanalyze}
            disabled={savingPrediction}
          >
            {savingPrediction ? <CircularProgress size={24} color="inherit" /> : "SAVE & RE-ANALYZE WITH ML"}
          </Button>

          {/* Help Text */}
          <Alert severity="info" sx={{ mt: 2 }}>
            💡 <strong>Tip:</strong> Edit Age, Creatinine, or Urea values and click "SAVE & RE-ANALYZE WITH ML" to see how ML predictions change based on patient data!
          </Alert>
        </Paper>
      )}
    </Box>
  );
}