import { useState } from "react";
import { addPatient } from "../api/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { User } from "lucide-react";

export default function PatientForm() {
  const [form, setForm] = useState({ name: "", age: "", gender: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.age) newErrors.age = "Age is required";
    if (!form.gender) newErrors.gender = "Gender is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      alert("Please fill out all fields before adding a patient.");
      return;
    }

    try {
      const res = await addPatient(form);
      alert(`✅ Patient added successfully!\n\n` +
        `🆔 Patient ID: ${res.data.patientId}\n` +
        `🔑 Temporary Password: ${res.data.tempPassword}\n\n` +
        `Please provide these credentials to the patient for login.`
        );
      setForm({ name: "", age: "", gender: "" });
      setErrors({});
    }catch (err) {
      console.error("Error adding patient:", err);
      alert("Failed to add patient. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 500,
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
        <User size={26} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            letterSpacing: 0.5,
            color: "#fff",
            textAlign: "center",
          }}
        >
          Patient Management
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
        <TextField
          label="Name"
          variant="outlined"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth
          error={!!errors.name}
          helperText={errors.name}
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
          label="Age"
          type="number"
          variant="outlined"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          fullWidth
          error={!!errors.age}
          helperText={errors.age}
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
          label="Gender"
          select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          fullWidth
          error={!!errors.gender}
          helperText={errors.gender}
          InputLabelProps={{ style: { color: "#ccc" } }}
          InputProps={{
            style: {
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 8,
            },
          }}
        >
          <MenuItem value="">Select Gender</MenuItem>
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
        </TextField>

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
          Add Patient
        </Button>
      </Box>
    </Box>
  );
}
