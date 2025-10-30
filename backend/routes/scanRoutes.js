import express from "express";
import { upload, uploadScan, getScansByPatient, analyzeImage } from "../controllers/scanController.js";

const router = express.Router();

router.post("/:patientId", upload.single("image"), uploadScan);
router.get("/:patientId", getScansByPatient);
router.post("/analyze", upload.single("image"), analyzeImage);

export default router;
