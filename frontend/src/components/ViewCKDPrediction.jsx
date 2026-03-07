import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Divider, Button, CircularProgress, Alert, Stack } from "@mui/material";
import { Activity, FileText, User, Calendar, FlaskConical, ChevronLeft, ChevronRight } from "lucide-react";

export default function ViewCKDPrediction() {
  const [reports, setReports] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reports from the FastAPI backend
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8001/reports");
        if (!response.ok) throw new Error("Failed to fetch records");
        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress color="inherit" /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (reports.length === 0) return <Typography sx={{ textAlign: 'center', mt: 10, color: '#aaa' }}>No medical records found.</Typography>;

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
        <Typography variant="body2">Record {currentIndex + 1} of {reports.length}</Typography>
        <Button 
          disabled={currentIndex === reports.length - 1} 
          onClick={() => setCurrentIndex(prev => prev + 1)}
          sx={{ color: '#fff' }}
        >
          <ChevronRight />
        </Button>
      </Stack>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
        <Activity size={24} /> CKD History & Analytics
      </Typography>

      <Paper elevation={6} sx={{ maxWidth: 600, width: "100%", p: 4, borderRadius: 3, backdropFilter: "blur(15px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}>
        
        {/* Patient Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "#ffffff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} style={{ marginRight: 8 }} />
            {currentReport.patient?.name || "Anonymous Patient"}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Calendar size={14} /> Saved on: {new Date(currentReport.saved_at).toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.2)" }} />

        {/* Clinical Staging */}
        <Box sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Risk Status:</strong> {currentReport.ckd?.risk}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Clinical Stage:</strong> {currentReport.ckd?.stage}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>eGFR Level:</strong> {currentReport.values?.egfr} mL/min/1.73m²
          </Typography>
        </Box>

        {/* AI/ML Verdict Box */}
        <Box sx={{ 
          mb: 3, p: 2, borderRadius: 2, textAlign: 'left',
          bgcolor: currentReport.mlResult?.prediction?.includes("Detected") ? "rgba(211, 47, 47, 0.2)" : "rgba(46, 125, 50, 0.2)",
          border: `1px solid ${currentReport.mlResult?.prediction?.includes("Detected") ? "#d32f2f" : "#2e7d32"}`
        }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
            <FlaskConical size={16} /> ML MODEL VERDICT
          </Typography>
          <Typography variant="h6">{currentReport.mlResult?.prediction}</Typography>
          <Typography variant="caption">Confidence Score: {currentReport.mlResult?.confidence}</Typography>
        </Box>

        <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.2)" }} />

        <Typography variant="body1" sx={{ mb: 3, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, textAlign: "justify" }}>
          <FileText size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
          <strong>Lab Values:</strong> Creatinine: {currentReport.values?.creatinine_mg_dl} mg/dL | Urea: {currentReport.values?.urea_mg_dl} mg/dL
        </Typography>

        <Button variant="contained" color="primary" fullWidth sx={{ textTransform: "none", borderRadius: 2, py: 1.5, fontWeight: 600 }}>
          Download Clinical Summary
        </Button>
      </Paper>
    </Box>
  );
}