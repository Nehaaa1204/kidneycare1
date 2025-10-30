import * as React from "react";
import { useNavigate } from "react-router-dom";
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
  Link,
  Card as MuiCard,
  MenuItem,
  Select,
} from "@mui/material";
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import Aurora from "../components/Aurora";
import GradientText from "../components/GradientText";
import { signupUser } from "../api/api";

// Styled components
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

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: "100vh",
  padding: theme.spacing(4),
  position: "relative",
  zIndex: 1,
  alignItems: "center",
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

export default function Signup() {
  const navigate = useNavigate();
  const auroraColors = ["#0A0D5A", "#8B0000", "#0A0D5A"];

  const [form, setForm] = React.useState({
    username: "",
    password: "",
    role: "doctor",
  });
  const [errors, setErrors] = React.useState({});

  const validateInputs = () => {
    const newErrors = {};
    if (!form.username) newErrors.username = "Username is required.";
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const { data } = await signupUser(form);
      if (data.success) {
        alert("Account created successfully!");
        navigate("/");
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error during signup");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline enableColorScheme />
      <Aurora
        colorStops={["#0A0D5A", "#8B0000", "#0A0D5A", "#8B0000", "#0A0D5A"]} // more variation
        amplitude={2.0}       // bigger waves
        blend={0.5}            // stronger blending
        speed={2.0}            // faster movement
      />

      <SignUpContainer direction="column" justifyContent="center">
        <GradientText
          colors={['#40ffaa', '#4079ff', '#40ffaa', '#4079ff', '#40ffaa']}
          animationSpeed={8}
          showBorder={true}
          className="mb-6"
        >
          Welcome to Kidney Care
        <p style = {{textAlign: "center", fontSize: "1.5rem", fontWeight: "normal"}}>Multilevel Kidney Diagnostics</p>

        </GradientText>

        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h5"
            sx={{ width: "100%", textAlign: "center" }}
          >
            Sign up
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Username */}
            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>
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
              <FormLabel htmlFor="password">Password</FormLabel>
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
              </Select>
            </FormControl>

            <Button type="submit" fullWidth variant="contained">
              Sign up
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography sx={{ color: "text.secondary" }}>or</Typography>
          </Divider>

          <Typography sx={{ textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/" variant="body2" sx={{ cursor: "pointer" }}>
              Sign in
            </Link>
          </Typography>
        </Card>
      </SignUpContainer>
    </ThemeProvider>
  );
}
