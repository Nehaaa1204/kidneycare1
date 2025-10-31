import { useEffect, useState } from "react";
import { addNote, getPatients } from "../api/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { NotebookPen } from "lucide-react";





export default function NotesForm() {
  const [form, setForm] = useState({
    patientId: "",
    diagnosis: "",
    treatment: "",
    recommendations: "",
  });
  const [errors, setErrors] = useState({});
  const [patients, setPatients] = useState([]);

  // 🔹 Fetch patient list from DB
  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await getPatients();
        setPatients(res.data || []);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    }
    fetchPatients();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.patientId.trim()) newErrors.patientId = "Patient ID is required";
    if (!form.diagnosis.trim()) newErrors.diagnosis = "Diagnosis is required";
    if (!form.treatment.trim()) newErrors.treatment = "Treatment is required";
    if (!form.recommendations.trim())
      newErrors.recommendations = "Recommendations are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      alert("Please fill out all fields before saving notes.");
      return;
    }

  const loggedInDoctor = JSON.parse(localStorage.getItem("doctorData"));

  try {
      const data = {
        ...form,
        doctorUsername: loggedInDoctor?.username || "unknownDoctor",
      };

      console.log("Submitting note data:", data);
      await addNote(data);
      alert("✅ Note saved successfully!");
      setForm({
        patientId: "",
        diagnosis: "",
        treatment: "",
        recommendations: "",
      });
    } catch (err) {   
      console.error(err);
      alert("❌ Error saving note. Please try again.");
    } 
  };
    


  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        color: "white",
        p: 3,
      }}
    >
      {/* Header with icon */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          mb: 3,
        }}
      >
        <NotebookPen size={26} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            letterSpacing: 0.5,
            color: "#fff",
            textAlign: "center",
          }}
        >
          Professional Notes
        </Typography>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* 🔽 Dropdown for patient ID */}
        <TextField
          select
          label="Select Patient"
          value={form.patientId}
          onChange={(e) =>
            setForm({ ...form, patientId: e.target.value })
          }
          fullWidth
          error={!!errors.patientId}
          helperText={errors.patientId}
          InputLabelProps={{ style: { color: "#ccc" } }}
          InputProps={{
            style: {
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 8,
            },
          }}
        >
          {patients.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} (ID: {p.id})
            </MenuItem>
          ))}
        </TextField>

        {/* Other Fields */}
        <TextField
          label="Diagnosis"
          variant="outlined"
          multiline
          minRows={3}
          value={form.diagnosis}
          onChange={(e) =>
            setForm({ ...form, diagnosis: e.target.value })
          }
          fullWidth
          error={!!errors.diagnosis}
          helperText={errors.diagnosis}
          InputLabelProps={{ style: { color: "#ccc" } }}
          InputProps={{
            style: {
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 8,
            },
          }}
        />

        <TextField
          label="Treatment"
          variant="outlined"
          multiline
          minRows={3}
          value={form.treatment}
          onChange={(e) =>
            setForm({ ...form, treatment: e.target.value })
          }
          fullWidth
          error={!!errors.treatment}
          helperText={errors.treatment}
          InputLabelProps={{ style: { color: "#ccc" } }}
          InputProps={{
            style: {
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 8,
            },
          }}
        />

        <TextField
          label="Recommendations"
          variant="outlined"
          multiline
          minRows={3}
          value={form.recommendations}
          onChange={(e) =>
            setForm({ ...form, recommendations: e.target.value })
          }
          fullWidth
          error={!!errors.recommendations}
          helperText={errors.recommendations}
          InputLabelProps={{ style: { color: "#ccc" } }}
          InputProps={{
            style: {
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 8,
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          sx={{
            mt: 1,
            borderRadius: 2,
            px: 3,
            fontWeight: "bold",
            color: "#fff",
            textTransform: "none",
            boxShadow: "none",
            border: "1px solid rgba(255,255,255,0.3)",
            backgroundColor: "rgba(255,255,255,0.08)",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.5)",
              transform: "translateY(-2px)",
            },
          }}
        >
          Save Note
        </Button>
      </Box>
    </Box>
  );
}
