import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";
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
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import Aurora from "../components/Aurora";
import GradientText from "../components/GradientText";

// Styled Components
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

// Dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1a237e" },
    secondary: { main: "#b71c1c" },
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
  const auroraColors = ["#0A0D5A", "#8B0000", "#0A0D5A"];

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
        login(data.user);
        navigate("/dashboard");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error during login");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {/* Aurora Background */}
      <Aurora
        colorStops={["#0A0D5A", "#8B0000", "#0A0D5A", "#8B0000", "#0A0D5A"]} // more variation
        amplitude={2.0}       // bigger waves
        blend={0.5}            // stronger blending
        speed={2.0}            // faster movement
      />

      <SignInContainer direction="column">
        <GradientText
          colors={["#10643eff", "#4079ff", "#10643eff", "#4079ff", "#10643eff"]}
          animationSpeed={8}
          showBorder={true}
          style={{ textAlign: "center", fontSize: "2.5rem", fontWeight: "bold", marginBottom: "2rem" }}
        >
          Welcome to Kidney Care
          <p style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "normal" }}>
            Multilevel Kidney Diagnostics
          </p>
        </GradientText>

        <Card variant="outlined">
          <Typography component="h1" variant="h5" sx={{ width: "100%", textAlign: "center" }}>
            Login
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Username */}
            <FormControl>
              <FormLabel htmlFor="username" placeholder="Please enter username or id">Username</FormLabel>
              <TextField
                fullWidth
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                error={!!errors.username}
                helperText={errors.username}
              />
            </FormControl>

            {/* Password */}
            <FormControl>
              <FormLabel htmlFor="password" placeholder="please enter the password">Password</FormLabel>
              <TextField
                fullWidth
                type="password"
                id="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={!!errors.password}
                helperText={errors.password}
              />
            </FormControl>

            {/* Role */}
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
              Login
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography sx={{ color: "text.secondary" }}>or</Typography>
          </Divider>

          <Typography sx={{ textAlign: "center", mt:2,color: "#fff" }}>
            Don’t have an account?{" "}
            <Link onClick={() => navigate("/signup")} sx={{ cursor: "pointer",color:"#64b5f6" }}>
              Sign up
            </Link>
          </Typography>
        </Card>
      </SignInContainer>
    </ThemeProvider>
  );
}
