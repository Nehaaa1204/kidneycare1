
import React, { useState } from "react";
import PatientTimeline from "../components/PatientTimeline";

const PatientProgressPage = () => {
  const [patientId, setPatientId] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const handleSubmit = () => {
    if (!patientId.trim()) {
      alert("Please enter a valid Patient ID");
      return;
    }
    setSelectedId(patientId);
  };

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>
        📊 Patient Progress Tracking
      </h2>

      {/* 🔍 Input Section */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Enter Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "250px",
          }}
        />

        <button
          onClick={handleSubmit}
          style={{
            padding: "10px 15px",
            borderRadius: "8px",
            backgroundColor: "#1a237e",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          View Progress
        </button>
      </div>

      {/* 📊 Timeline Section */}
      {selectedId ? (
        <PatientTimeline patientId={selectedId} />
      ) : (
        <p style={{ color: "#aaa" }}>
          Enter a Patient ID to view progress
        </p>
      )}
    </div>
  );
};

export default PatientProgressPage;
