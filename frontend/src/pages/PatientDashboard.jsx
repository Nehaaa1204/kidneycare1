import { useState, useEffect, useRef } from "react";
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
  TextField,
  IconButton,
  Avatar,
} from "@mui/material";
import { FileUp, Activity, ClipboardList, MessageCircle, Send, Bot, User } from "lucide-react";
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

// AI Assistant Chatbot Component
const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI health assistant. I can help you understand your kidney health, answer questions about CKD, and provide general health information. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response - replace with actual API call to your backend
    setTimeout(() => {
      const responses = [
        "Based on your health profile, I recommend discussing this with your nephrologist. Would you like me to explain more about kidney function?",
        "That's a great question about kidney health. Staying hydrated and maintaining a balanced diet are key factors. Your doctor's recommendations should be your primary guide.",
        "I understand your concern. Chronic Kidney Disease management involves regular monitoring and lifestyle adjustments. Make sure to follow up with your healthcare provider.",
        "For CKD patients, it's important to monitor blood pressure, limit sodium intake, and follow prescribed medications. Always consult with your doctor before making any changes.",
      ];
      
      const aiMessage = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: "white",
      }}
    >
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, textAlign: "center" }}>
        AI Health Assistant
      </Typography>

      {/* Chat Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 2,
          pr: 1,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(255,255,255,0.05)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.2)",
            borderRadius: "4px",
            "&:hover": {
              background: "rgba(255,255,255,0.3)",
            },
          },
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              mb: 2,
              gap: 1,
            }}
          >
            {msg.role === "assistant" && (
              <Avatar
                sx={{
                  bgcolor: "#1a237e",
                  width: 32,
                  height: 32,
                }}
              >
                <Bot size={18} />
              </Avatar>
            )}
            <Box
              sx={{
                maxWidth: "70%",
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor:
                    msg.role === "user"
                      ? "rgba(26, 35, 126, 0.4)"
                      : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.95)" }}>
                  {msg.content}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5, px: 1 }}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
            {msg.role === "user" && (
              <Avatar
                sx={{
                  bgcolor: "#b71c1c",
                  width: 32,
                  height: 32,
                }}
              >
                <User size={18} />
              </Avatar>
            )}
          </Box>
        ))}

        {isTyping && (
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: "#1a237e",
                width: 32,
                height: 32,
              }}
            >
              <Bot size={18} />
            </Avatar>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.6)",
                  animation: "bounce 1.4s infinite ease-in-out",
                  animationDelay: "0s",
                  "@keyframes bounce": {
                    "0%, 80%, 100%": { transform: "scale(0)" },
                    "40%": { transform: "scale(1)" },
                  },
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.6)",
                  animation: "bounce 1.4s infinite ease-in-out",
                  animationDelay: "0.2s",
                  "@keyframes bounce": {
                    "0%, 80%, 100%": { transform: "scale(0)" },
                    "40%": { transform: "scale(1)" },
                  },
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.6)",
                  animation: "bounce 1.4s infinite ease-in-out",
                  animationDelay: "0.4s",
                  "@keyframes bounce": {
                    "0%, 80%, 100%": { transform: "scale(0)" },
                    "40%": { transform: "scale(1)" },
                  },
                }}
              />
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 2,
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "white",
              "& fieldset": {
                borderColor: "rgba(255,255,255,0.2)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255,255,255,0.3)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#1a237e",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(255,255,255,0.5)",
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!input.trim()}
          sx={{
            bgcolor: "#1a237e",
            color: "white",
            "&:hover": {
              bgcolor: "#283593",
            },
            "&:disabled": {
              bgcolor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.3)",
            },
          }}
        >
          <Send size={20} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default function PatientDashboard() {
  const auroraColors = ["#0A0D5A", "#8B0000", "#0A0D5A", "#8B0000", "#0A0D5A"];
  const [selected, setSelected] = useState("Doctor Recommendations");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (selected === "Doctor Recommendations" && user) {
      console.log("Fetching notes for patientId:", user.username);
      setLoading(true);
      getNotes(user.username)
        .then((res) => {
          console.log("Fetched notes:", res.data);
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
      case "AI Assistant":
        return <AIAssistant />;
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
                { name: "AI Assistant", icon: <MessageCircle size={20} /> },
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