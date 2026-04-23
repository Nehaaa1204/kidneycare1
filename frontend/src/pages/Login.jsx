import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { InputAdornment, IconButton } from "@mui/material";
import {
  Box,
  Button,
  CssBaseline,
  Divider,
  FormControl,
  FormLabel,
  TextField,
  Typography,
  Stack,
  Card as MuiCard,
  MenuItem,
  Select,
  Link,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";

// ✅ NO Aurora or GradientText needed — real bg image replaces them

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  background: "rgba(10, 15, 30, 0.75)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(56, 189, 248, 0.15)",
  borderRadius: "24px",
  boxShadow: "0 0 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
  [theme.breakpoints.up("sm")]: {
    width: "460px",
  },
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(4),
  position: "relative",
  zIndex: 1,
  alignItems: "center",
  justifyContent: "center",

  // ✅ Real kidney anatomy background image
  backgroundImage: `url('https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&q=90')`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",

  // ✅ Dark overlay on top of image so card is readable
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    inset: 0,
    zIndex: -1,
    background:
      "linear-gradient(135deg, rgba(2,8,23,0.82) 0%, rgba(7,20,40,0.78) 50%, rgba(2,8,23,0.85) 100%)",
  },
}));

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0ea5e9" },
    secondary: { main: "#10b981" },
    background: {
      default: "#0f172a",
      paper: "rgba(10, 15, 30, 0.75)",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "rgba(30, 41, 59, 0.6)",
            borderRadius: "12px",
            "& fieldset": {
              borderColor: "rgba(71, 85, 105, 0.4)",
            },
            "&:hover fieldset": {
              borderColor: "#38bdf8",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#0ea5e9",
              boxShadow: "0 0 0 3px rgba(56,189,248,0.1)",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          background: "rgba(30, 41, 59, 0.6)",
          borderRadius: "12px",
        },
      },
    },
  },
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "doctor",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (e) => e.preventDefault();

  const validateInputs = () => {
    const newErrors = {};
    if (!form.username) newErrors.username = "Username is required.";
    if (!form.password) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const { data } = await loginUser(form);

      if (data.success) {
        showSnackbar("Login successful! Redirecting...", "success");
        setTimeout(() => {
          login(data.user);
          navigate("/dashboard");
        }, 1000);
      } else {
        if (data.error === "User not found") {
          showSnackbar("No account found with this username. Please check or sign up.", "error");
        } else if (data.error === "Invalid password") {
          showSnackbar("Incorrect password. Please try again.", "error");
        } else if (data.error === "Role mismatch") {
          showSnackbar(`Wrong role selected. This account is not registered as a ${form.role}.`, "warning");
        } else {
          showSnackbar(data.error || "Login failed. Please check your credentials.", "error");
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        showSnackbar("Username not found. Please check your username.", "error");
      } else if (err.response?.status === 401) {
        showSnackbar("Incorrect password. Please try again.", "error");
      } else if (err.response?.status === 403) {
        showSnackbar(`Wrong role selected. This account is not a ${form.role}.`, "warning");
      } else if (err.response?.status === 500) {
        showSnackbar("Server is down. Please try again later.", "error");
      } else {
        showSnackbar("Network error. Please check your connection.", "error");
      }
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      <SignInContainer direction="column">

        {/* ✅ Branding above card */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box sx={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(14,165,233,0.15)",
            border: "2px solid rgba(56,189,248,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
            boxShadow: "0 0 20px rgba(56,189,248,0.2)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </Box>
          <Typography sx={{
            fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #38bdf8, #34d399, #818cf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Kidney Care
          </Typography>
          <Typography sx={{
            fontSize: "0.72rem", color: "#475569",
            letterSpacing: "0.12em", textTransform: "uppercase", mt: 0.5,
          }}>
            Multilevel Kidney Diagnostics
          </Typography>
        </Box>

        <Card variant="outlined">
          <Typography component="h1" variant="h6"
            sx={{ width: "100%", textAlign: "center", color: "#f1f5f9", fontWeight: 600 }}>
            Welcome back
          </Typography>
          <Typography sx={{ textAlign: "center", fontSize: "0.8rem", color: "#475569", mt: -1 }}>
            Sign in to continue to your dashboard
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <FormControl>
              <FormLabel sx={{ fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>
                Username
              </FormLabel>
              <TextField
                fullWidth
                id="username"
                placeholder="Enter your username or ID"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                error={!!errors.username}
                helperText={errors.username}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel sx={{ fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>
                Password
              </FormLabel>
              <TextField
                id="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{
                          color: "#0ea5e9",
                          "&:hover": { backgroundColor: "rgba(14,165,233,0.1)", color: "#10b981" },
                          transition: "all 0.2s ease",
                        }}
                      >
                        {showPassword
                          ? <Visibility sx={{ fontSize: "20px" }} />
                          : <VisibilityOff sx={{ fontSize: "20px" }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel sx={{ fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>
                I am a
              </FormLabel>
              <Select
                fullWidth
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="doctor">🩺 Doctor</MenuItem>
                <MenuItem value="patient">🧑‍⚕️ Patient</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 1,
                py: 1.4,
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.9rem",
                letterSpacing: "0.03em",
                background: "linear-gradient(135deg, #0ea5e9, #10b981)",
                boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0284c7, #059669)",
                  boxShadow: "0 6px 25px rgba(14,165,233,0.45)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </Button>
          </Box>

          <Divider sx={{ my: 1, borderColor: "rgba(71,85,105,0.3)" }}>
            <Typography sx={{ color: "#334155", fontSize: "0.72rem" }}>or</Typography>
          </Divider>

          <Typography sx={{ textAlign: "center", fontSize: "0.8rem", color: "#475569" }}>
            Don't have an account?{" "}
            <Link
              onClick={() => navigate("/signup")}
              sx={{
                cursor: "pointer", color: "#38bdf8", fontWeight: 600,
                "&:hover": { color: "#10b981" },
                transition: "color 0.2s ease",
              }}
            >
              Sign up free
            </Link>
          </Typography>
        </Card>
      </SignInContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </ThemeProvider>
  );
}