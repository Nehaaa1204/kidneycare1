import React from "react";
import { Box, Typography, Paper, Divider, Button } from "@mui/material";
import { Activity, FileText, User } from "lucide-react";

export default function ViewCKDPrediction() {
  // Temporary mock data for now (replace later with API/database data)
  const mockPrediction = {
    patientName: "John Doe",
    riskFactor: "High",
    stage: "Stage 3 - Moderate CKD",
    eGFR: "42 ml/min/1.73m²",
    date: "2025-10-30",
    notes: "Patient advised to reduce sodium intake and schedule nephrology follow-up.",
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        color: "#fff",
        height: "100%",
        p: 4,
      }}
    >
      {/* Page Heading */}
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 600,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: "center",
        }}
      >
        <Activity size={24} /> CKD Prediction Results
      </Typography>

      {/* Results Container */}
      <Paper
        elevation={6}
        sx={{
          maxWidth: 600,
          width: "100%",
          p: 4,
          borderRadius: 3,
          backdropFilter: "blur(15px)",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 1, color: "#ffffff" }}
          >
            <User size={18} style={{ marginRight: 8 }} />
            Patient: {mockPrediction.patientName}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Date: {mockPrediction.date}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.2)" }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Risk Factor:</strong> {mockPrediction.riskFactor}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Stage:</strong> {mockPrediction.stage}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>eGFR:</strong> {mockPrediction.eGFR}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.2)" }} />

        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.6,
            textAlign: "justify",
          }}
        >
          <FileText size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
          <strong>Doctor Notes:</strong> {mockPrediction.notes}
        </Typography>

        <Button
          variant="contained"
          color="secondary"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 4,
            py: 1,
            fontWeight: 500,
          }}
        >
          View Full Report
        </Button>
      </Paper>
    </Box>
  );
}
