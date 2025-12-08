
console.log("✅ scanRoutes.js is loaded");

import express from "express";

import { upload, uploadScan, getScansByPatient, analyzeImage } from "../controllers/scanController.js";

const router = express.Router();

router.post("/test", (req, res) => {
  console.log("✅ /api/scans/test called!");
  console.log("Request body:", req.body);
  res.json({ message: "Test route working!" });
});


router.post("/:patientId", upload.single("image"), uploadScan);
router.get("/:patientId", getScansByPatient);
router.post("/analyze", analyzeImage);

export default router;
