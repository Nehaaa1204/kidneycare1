import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import {connectDB} from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();

app.use(cors());
app.use(bodyParser.json());

await connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/scans", scanRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
