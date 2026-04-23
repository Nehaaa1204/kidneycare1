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
import Aurora from "../components/Aurora";
import GradientText from "../components/GradientText";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow:
    "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "100vh",
  padding: theme.spacing(4),
  position: "relative",
  zIndex: 1,
  alignItems: "center",
  justifyContent: "center",
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    backgroundRepeat: "no-repeat",
  },
}));

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0ea5e9" },
    secondary: { main: "#10b981" },
    background: {
      default: "#0f172a",
      paper: "rgba(30, 41, 59, 0.95)",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#cbd5e1",
    },
  },
  divider: "rgba(14, 165, 233, 0.2)",
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

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

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
        showSnackbar(data.error || "Login failed. Please check your credentials.", "error");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        const backendError = err.response.data?.error;
        if (backendError === "Invalid username or role") {
          showSnackbar("Username not found or wrong role selected.", "error");
        } else if (backendError === "Invalid password") {
          showSnackbar("Incorrect password. Please try again.", "error");
        } else {
          showSnackbar(backendError || "Invalid credentials.", "error");
        }
      } else if (err.response?.status === 403) {
        showSnackbar(err.response.data?.error, "warning");
      } else if (err.response?.status === 500) {
        showSnackbar("Server error. Please try again later.", "error");
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        showSnackbar("Server is waking up, please wait 30s and try again.", "warning");
      } else {
        showSnackbar("Something went wrong. Please try again.", "error");
      }
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Aurora
        colorStops={["#0A0D5A", "#8B0000", "#0A0D5A", "#8B0000", "#0A0D5A"]}
        amplitude={2.0}
        blend={0.5}
        speed={2.0}
      />

      <SignInContainer direction="column">
        <GradientText
          colors={["#10643eff", "#4079ff", "#10643eff", "#4079ff", "#10643eff"]}
          animationSpeed={8}
          showBorder={true}
          style={{
            textAlign: "center",
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "2rem",
          }}
        >
          Welcome to Kidney Care
          <p
            style={{
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "normal",
            }}
          >
            Multilevel Kidney Diagnostics
          </p>
        </GradientText>

        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h5"
            sx={{ width: "100%", textAlign: "center" }}
          >
            Login
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>
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
              <FormLabel sx={{ mb: 1 }}>Password</FormLabel>
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
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{
                          color: "#0ea5e9",
                          "&:hover": {
                            backgroundColor: "rgba(14, 165, 233, 0.1)",
                            color: "#10b981",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        {showPassword ? (
                          <Visibility sx={{ fontSize: "20px" }} />
                        ) : (
                          <VisibilityOff sx={{ fontSize: "20px" }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="role">Role</FormLabel>
              <Select
                fullWidth
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="patient">Patient</MenuItem>
              </Select>
            </FormControl>

            <Button type="submit" fullWidth variant="contained">
              LOGIN
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography sx={{ color: "text.secondary" }}>or</Typography>
          </Divider>

          <Typography sx={{ textAlign: "center", mt: 2, color: "#fff" }}>
            Don't have an account?{" "}
            <Link
              onClick={() => navigate("/signup")}
              sx={{
                cursor: "pointer",
                color: "#64b5f6",
                "&:hover": {
                  color: "#10b981",
                  textDecoration: "underline",
                },
                transition: "all 0.2s ease",
              }}
            >
              Sign up
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