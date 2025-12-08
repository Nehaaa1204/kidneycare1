import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import {connectDB} from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import { fileURLToPath } from "url";
import "./config/cloudinary.js"; // ensures Cloudinary config loads

console.log(scanRoutes.stack.map(r => r.route.path));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/scans", scanRoutes);

const PORT = process.env.PORT || 5000;
app.get("/test", (req, res) => {
  res.json({ message: "Server working fine ✅" });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


await connectDB();