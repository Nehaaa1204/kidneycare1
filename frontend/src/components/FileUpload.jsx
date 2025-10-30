import { useState, useEffect } from "react";
import { getScans, getPatients } from "../api/api";
import {
  Box,
  Button,
  Typography,
  Autocomplete,
  TextField,
} from "@mui/material";
import { ImagePlus } from "lucide-react";

export default function FileUpload() {
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);

  // Fetch all patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await getPatients();
        setPatients(data || []);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };
    fetchPatients();
  }, []);

  const fetchScans = async () => {
    if (!patientId) {
      alert("Please select a Patient ID");
      return;
    }
    const { data } = await getScans(patientId);
    setScans(data);
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
          gap: 1.2,
          mb: 3,
        }}
      >
        <ImagePlus size={26} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            letterSpacing: 0.5,
            color: "#fff",
            textAlign: "center",
          }}
        >
          Upload Medical Scan
        </Typography>
      </Box>

      {/* Dropdown + Button */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "center",
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Autocomplete
          options={patients}
          getOptionLabel={(option) =>
            `${option.id} - ${option.name || "Unnamed"}`
          }
          onChange={(e, value) => setPatientId(value?.id || "")}
          sx={{ width: 250 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Patient ID"
              variant="outlined"
              InputLabelProps={{ style: { color: "#ccc" } }}
              InputProps={{
                ...params.InputProps,
                style: {
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 8,
                },
              }}
            />
          )}
        />

        <Button
          variant="contained"
          onClick={fetchScans}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: "bold",
            color: "#fff",
            textTransform: "none",
            boxShadow: "none",
            border: "1px solid rgba(255,255,255,0.3)", // ✅ thin semi-transparent border
            backgroundColor: "rgba(255,255,255,0.08)",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.5)",
              transform: "translateY(-2px)",
            },
          }}
        >
          View Previous Scans
        </Button>
      </Box>

      {/* Display Scans */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 2,
          mt: 2,
        }}
      >
        {scans.length > 0 ? (
          scans.map((s, i) => (
            <Box
              key={i}
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(4px)",
                textAlign: "center",
              }}
            >
              <img
                src={s.imageUrl}
                alt="scan"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  objectFit: "cover",
                }}
              />
            </Box>
          ))
        ) : (
          <Typography sx={{ color: "#bbb", textAlign: "center", mt: 3 }}>
            No scans available.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
