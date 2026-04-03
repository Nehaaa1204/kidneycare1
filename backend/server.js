
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";

// Cloudinary config
import "./config/cloudinary.js";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);   
app.use("/api/notes", noteRoutes);
app.use("/api/scans", scanRoutes);

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server working fine ✅" });
});

// Root route (optional but nice)
app.get("/", (req, res) => {
  res.send(" Backend API is running...");
});

// Start Server AFTER DB connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to connect to DB:", error);
    process.exit(1);
  }
};

startServer();
