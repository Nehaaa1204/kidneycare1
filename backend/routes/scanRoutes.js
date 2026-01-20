import axios from "axios";

console.log("✅ scanRoutes.js is loaded");


import express from "express";

import { upload, uploadScan, getScansByPatient, analyzeImage } from "../controllers/scanController.js";

const router = express.Router();

router.post("/test", async (req, res) => {
  try {
    console.log("✅ /api/scans/test called!");
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl missing" });
    }

    // 🔥 Call ML server
    const mlResponse = await axios.post(
      "http://localhost:8000/predict",
      { imageUrl }
    );

    console.log("🧠 ML response:", mlResponse.data);

    // 🔁 Send ML response back to frontend
    res.json(mlResponse.data);

  } catch (error) {
    console.error("❌ ML error:", error.message);
    res.status(500).json({ error: "ML prediction failed" });
  }
});


router.post("/:patientId", upload.single("image"), uploadScan);
router.get("/:patientId", getScansByPatient);
router.post("/analyze", analyzeImage);

export default router;
