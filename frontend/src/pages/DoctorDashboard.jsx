import { useState } from "react";
import Header from "../components/Header";
import PatientForm from "../components/PatientForm";
import FileUpload from "../components/FileUpload";
import NotesForm from "../components/NotesForm";
import PatientList from "../components/PatientList";
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
} from "@mui/material";
import {
  UserPlus,
  Image as ImageIcon,
  NotebookPen,
  Users,
} from "lucide-react";

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

export default function DoctorDashboard() {
  const auroraColors = ["#0A0D5A", "#8B0000", "#0A0D5A", "#8B0000", "#0A0D5A"];
  const [selected, setSelected] = useState("Patient Management");

  const renderContent = () => {
    switch (selected) {
      case "Patient Management":
        return <PatientForm />;
      case "Medical Imaging":
        return <FileUpload />;
      case "Professional Notes":
        return <NotesForm />;
      case "Patient List":
        return <PatientList />;
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
              background: "rgba(255,255,255,0.08)", // transparent glass effect
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              p: 1,
              overflow: "hidden",
            }}
          >
            <List sx={{ flexGrow: 1 }}>
              {[
                { name: "Patient Management", icon: <UserPlus size={20} /> },
                { name: "Medical Imaging", icon: <ImageIcon size={20} /> },
                { name: "Professional Notes", icon: <NotebookPen size={20} /> },
                { name: "Patient List", icon: <Users size={20} /> },
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
              p: 2,
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
