import { useEffect, useState } from "react";
import { getPatients, deletePatient, getNotes } from "../api/api";
import {
  Box,
  Typography,
  Button,
  Collapse,
  Divider,
} from "@mui/material";
import { Users, Trash2, StickyNote } from "lucide-react";



export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [openNotes, setOpenNotes] = useState({});
  const [notesData, setNotesData] = useState({});

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getPatients();
        setPatients(res.data || []);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };
    fetchPatients();
  }, []);

  // Remove patient
  const remove = async (id) => {
    try {
      await deletePatient(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert("❌ Could not delete patient. Please try again.");
    }
  };

  // Toggle & fetch notes
  const toggleNotes = async (id) => {
    setOpenNotes((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!notesData[id]) {
      try {
        const res = await getNotes(id);
        setNotesData((prev) => ({ ...prev, [id]: res.data || [] }));
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 700,
        margin: "0 auto",
        color: "white",
        p: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          mb: 3,
        }}
      >
        <Users size={26} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            letterSpacing: 0.5,
            color: "#fff",
            textAlign: "center",
          }}
        >
          Patient List
        </Typography>
      </Box>

      {/* Patient Table */}
      {patients.length === 0 ? (
        <Typography sx={{ color: "#bbb", textAlign: "center", mt: 2 }}>
          No patients found.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            backgroundColor: "rgba(255,255,255,0.05)",
            p: 2,
            borderRadius: 2,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {patients.map((p) => (
            <Box
              key={p.id}
              sx={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 2,
                p: 2,
                backgroundColor: "rgba(255,255,255,0.07)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {/* Patient info */}
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#ccc" }}>
                    ID: {p.id}| Age: {p.age} | Gender: {p.gender}
                  </Typography>
                </Box>

                {/* Buttons */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<StickyNote size={16} />}
                    onClick={() => toggleNotes(p.id)}
                    sx={{
                      borderRadius: 2,
                      fontSize: "0.8rem",
                      color: "#fff",
                      textTransform: "none",
                      border: "1px solid rgba(255,255,255,0.3)",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.5)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    See Notes
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => remove(p.id)}
                    sx={{
                      borderRadius: 2,
                      fontSize: "0.8rem",
                      color: "#fff",
                      textTransform: "none",
                      border: "1px solid rgba(255,255,255,0.3)",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.5)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>

              {/* Collapsible Notes Section */}
              <Collapse in={openNotes[p.id]}>
                <Divider sx={{ my: 1.5, backgroundColor: "rgba(255,255,255,0.2)" }} />
                {notesData[p.id]?.length ? (
                  notesData[p.id].map((note, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: "#90caf9" }}>
                        Diagnosis:
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#ddd", mb: 0.5 }}>
                        {note.diagnosis}
                      </Typography>

                      <Typography variant="subtitle2" sx={{ color: "#90caf9" }}>
                        Treatment:
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#ddd", mb: 0.5 }}>
                        {note.treatment}
                      </Typography>

                      <Typography variant="subtitle2" sx={{ color: "#90caf9" }}>
                        Recommendations:
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#ddd" }}>
                        {note.recommendations}
                      </Typography>

                      {i !== notesData[p.id].length - 1 && (
                        <Divider sx={{ my: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: "#aaa" }}>
                    No notes found for this patient.
                  </Typography>
                )}
              </Collapse>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
