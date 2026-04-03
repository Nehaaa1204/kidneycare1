import React, { useState } from "react";
import { Box, Typography, Paper, Divider, Button, CircularProgress, Alert, Stack, TextField } from "@mui/material";
import { Activity, User, Calendar, FlaskConical, ChevronLeft, ChevronRight } from "lucide-react";

export default function ViewCKDPrediction() {
  const [reports, setReports] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [searched, setSearched] = useState(false);

  // ✅ FETCH FUNCTION
  const fetchReports = async () => {
    if (!patientId.trim()) {
      alert("Please enter a patient ID");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    setCurrentIndex(0);

    try {
      console.log("Fetching CKD predictions for patient:", patientId);

      const response = await fetch(
        `http://localhost:5000/api/scans/ckd/${patientId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch CKD predictions");
      }

      const data = await response.json();
      console.log("Reports received:", data);

      if (data.length === 0) {
        setError("No CKD predictions found for this patient");
        setReports([]);
      } else {
        setReports(data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message || "Failed to fetch records");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE ENTER KEY PRESS
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchReports();
    }
  };

  // ✅ SEARCH PAGE
  if (!searched) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Activity size={24} /> Search CKD Predictions
        </Typography>

        <Paper
          sx={{
            p: 3,
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 2,
            maxWidth: 600,
          }}
        >
          <Typography sx={{ mb: 2, color: "#fff", fontWeight: 600 }}>
            Enter Patient ID to view CKD predictions
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Patient ID or Name"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter patient ID"
              fullWidth
              sx={{
                "& .MuiInputBase-input": { color: "#fff" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={fetchReports}
              disabled={loading}
              sx={{
                backgroundColor: "#1a237e",
                color: "#fff",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#0d1b4e" },
              }}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // ✅ LOADING STATE
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress color="inherit" />
      </Box>
    );

  // ✅ ERROR STATE
  if (error)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          onClick={() => setSearched(false)}
          sx={{ mt: 2, color: "#fff" }}
        >
          Back to Search
        </Button>
      </Box>
    );

  // ✅ NO RESULTS STATE
  if (reports.length === 0)
    return (
      <Box sx={{ p: 4 }}>
        <Typography sx={{ textAlign: "center", color: "#aaa" }}>
          No CKD predictions found.
        </Typography>
        <Button
          onClick={() => setSearched(false)}
          sx={{ mt: 2, color: "#fff" }}
        >
          Back to Search
        </Button>
      </Box>
    );

  const currentReport = reports[currentIndex];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: "#fff", p: 4 }}>
      
      {/* Navigation for multiple reports */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Button 
          disabled={currentIndex === 0} 
          onClick={() => setCurrentIndex(prev => prev - 1)}
          sx={{ color: '#fff' }}
        >
          <ChevronLeft />
        </Button>
        <Typography variant="body2">Report {currentIndex + 1} of {reports.length}</Typography>
        <Button 
          disabled={currentIndex === reports.length - 1} 
          onClick={() => setCurrentIndex(prev => prev + 1)}
          sx={{ color: '#fff' }}
        >
          <ChevronRight />
        </Button>
      </Stack>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
        <Activity size={24} /> CKD Prediction History
      </Typography>

      <Paper elevation={6} sx={{ maxWidth: 700, width: "100%", p: 4, borderRadius: 3, backdropFilter: "blur(15px)", background: "rgba(255,255,255,0.05)", border: `2px solid ${currentReport.ckdDetected ? "#d32f2f" : "#2e7d32"}` }}>        
        {/* Patient Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "#ffffff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} style={{ marginRight: 8 }} />
            {currentReport.patientId || "Patient Record"}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Calendar size={14} /> Saved on: {new Date(currentReport.uploadedAt).toLocaleDateString()} at {new Date(currentReport.uploadedAt).toLocaleTimeString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.2)" }} />

        {/* CKD Status */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            textAlign: "center",
            bgcolor: currentReport.ckdDetected
              ? "rgba(211, 47, 47, 0.2)"
              : "rgba(46, 125, 50, 0.2)",
            border: `1px solid ${
              currentReport.ckdDetected ? "#d32f2f" : "#2e7d32"
            }`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: currentReport.ckdDetected ? "#ff5252" : "#4caf50",
              fontWeight: 900,
              mb: 1,
            }}
          >
            {currentReport.ckdDetected ? "🔴 CKD DETECTED" : "🟢 NORMAL"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff" }}>
            {currentReport.message || "CKD Analysis Complete"}
          </Typography>
        </Box>

        {/* ML Prediction Confidence */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            textAlign: "left",
            bgcolor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: "bold",
              mb: 1,
            }}
          >
            <FlaskConical size={16} /> ML MODEL PREDICTION
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="body2">
              ✅ CKD Confidence:{" "}
              <strong style={{ color: "#ff5252" }}>
                {currentReport.ckdProbability || 0}%
              </strong>
            </Typography>
            <Typography variant="body2">
              ✅ Normal Confidence:{" "}
              <strong style={{ color: "#4caf50" }}>
                {currentReport.normalProbability || 0}%
              </strong>
            </Typography>
          </Box>
        </Box>

        {/* Clinical Staging */}
        <Box sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Clinical Stage:</strong> {currentReport.ckdStage || "N/A"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>eGFR Level:</strong> {currentReport.egfr || "N/A"} mL/min
          </Typography>
          <Typography variant="body1">
            <strong>Risk Status:</strong> {currentReport.ckdDetected ? "HIGH" : "LOW"}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.2)" }} />

        {/* Lab Report Image */}
        {currentReport.imageUrl && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
              📋 Lab Report Image
            </Typography>
            <img
              src={currentReport.imageUrl}
              alt="Lab Report"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => setSearched(false)}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            py: 1.5,
            fontWeight: 600,
          }}
        >
          Search Another Patient
        </Button>
      </Paper>
    </Box>
  );
}