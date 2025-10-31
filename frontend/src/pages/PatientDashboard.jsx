import { useState, useEffect } from "react";
import Header from "../components/Header";
import Aurora from "../components/Aurora";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Typography,
  CircularProgress,
} from "@mui/material";
import { FileUp, Activity, ClipboardList } from "lucide-react";
import PatientImaging from "../components/PatientImaging";
import CKDPrediction from "../components/CKDPrediction";
import { getNotes } from "../api/api";
import { useAuth } from "../context/AuthContext";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1a237e" },
    secondary: { main: "#b71c1c" },
    background: {
      default: "#0b0c10",
      paper: "rgba(255,255,255,0.05)",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

export default function PatientDashboard() {
  const auroraColors = ["#0A0D5A", "#8B0000", "#0A0D5A", "#8B0000", "#0A0D5A"];
  const [selected, setSelected] = useState("Doctor Recommendations");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (selected === "Doctor Recommendations" && user) {
      console.log("Fetching notes for patientId:", user.username); // 👈 Add this
      setLoading(true);
      getNotes(user.username)
        .then((res) => {
          console.log("Fetched notes:", res.data); // 👈 Add this
          setRecommendations(res.data || []);
        })
        .catch((err) => console.error("Error fetching notes:", err))
        .finally(() => setLoading(false));
    }
  }, [selected, user]);


  const renderContent = () => {
    switch (selected) {
      case "Kidney Imaging":
        return <PatientImaging />;
      case "CKD Prediction":
        return <CKDPrediction />;
      case "Doctor Recommendations":
        return (
          <Box
            sx={{
              textAlign: "center",
              color: "white",
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
              Doctor Recommendations
            </Typography>

            {loading ? (
              <CircularProgress color="secondary" />
            ) : recommendations.length > 0 ? (
              recommendations.map((n, i) => (
                <Box
                  key={i}
                  sx={{
                    textAlign: "left",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.1)",
                    p: 2,
                    mb: 2,
                    width: "100%",
                    maxWidth: 700,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "#90caf9", fontWeight: 600 }}
                  >
                    Diagnosis: {n.diagnosis}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}
                  >
                    Treatment: {n.treatment}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#ddd",
                      mt: 1,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      pt: 1,
                    }}
                  >
                    Recommendation: {n.recommendations || "No recommendations."}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                No recommendations available yet.
              </Typography>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Aurora colorStops={auroraColors} amplitude={2.0} blend={0.5} speed={2.0} />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <Box sx={{ display: "flex", flex: 1, gap: 2, p: 2, overflow: "hidden" }}>
          {/* Sidebar */}
          <Paper
            elevation={6}
            sx={{
              width: { xs: "100%", md: 260 },
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 3,
              backdropFilter: "blur(20px)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              p: 1,
              overflow: "hidden",
            }}
          >
            <List sx={{ flexGrow: 1 }}>
              {[
                { name: "Doctor Recommendations", icon: <ClipboardList size={20} /> },
                { name: "Kidney Imaging", icon: <FileUp size={20} /> },
                { name: "CKD Prediction", icon: <Activity size={20} /> },
              ].map((item) => (
                <ListItemButton
                  key={item.name}
                  selected={selected === item.name}
                  onClick={() => setSelected(item.name)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    color:
                      selected === item.name
                        ? "#fff"
                        : "rgba(255,255,255,0.8)",
                    backgroundColor:
                      selected === item.name
                        ? "rgba(255,255,255,0.18)"
                        : "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.12)",
                      transform: "scale(1.02)",
                      transition: "all 0.2s ease",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              ))}
            </List>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </Paper>

          {/* Main Content */}
          <Box
            sx={{
              flexGrow: 1,
              p: 4,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.05)",
              boxShadow: "0 0 15px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              overflowY: "auto",
            }}
          >
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
