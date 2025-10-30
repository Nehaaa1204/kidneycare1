import { useAuth } from "../context/AuthContext";
import { LogOut, UserCircle2 } from "lucide-react";
import { Box, Button, Typography, Avatar } from "@mui/material";
import logo from "../assets/KidneyCareLogo.png"; // update path if needed

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <Box
      sx={{
        width: "100%",
        background: "rgba(20, 20, 20, 0.6)", // semi-transparent dark background
        backdropFilter: "blur(10px)", // nice frosted-glass look
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, md: 4 },
        py: { xs: 1.5, md: 2 },
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left side - Logo and title */}
      <Box display="flex" alignItems="center" gap={2}>
        <img
          src={logo}
          alt="Kidney Care Logo"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "contain",
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "0.7px",
          }}
        >
          Kidney Care
        </Typography>
      </Box>

      {/* Right side - User info */}
      <Box display="flex" alignItems="center" gap={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{
              width: 42,
              height: 42,
              bgcolor: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <UserCircle2 size={24} color="#fff" />
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                color: "#fff",
              }}
            >
              {user?.username || "Guest"}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8rem",
                letterSpacing: 0.5,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {user?.role ? user.role.toUpperCase() : "N/A"}
            </Typography>
          </Box>
        </Box>

        {/* Logout button */}
        <Button
          onClick={logout}
          startIcon={<LogOut size={20} />}
          sx={{
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 0.8,
            fontSize: "0.9rem",
            backgroundColor: "rgba(255,255,255,0.08)",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              transform: "translateY(-2px)",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}