import axios from "axios";
import express from "express";
import { upload, uploadScan, getScansByPatient, analyzeImage } from "../controllers/scanController.js";

const router = express.Router();

// ✅ Specific routes FIRST (before /:patientId)
router.post("/analyze", analyzeImage);

router.post("/test", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl missing" });

    const mlResponse = await axios.post("http://localhost:8000/predict", { imageUrl });
    res.json(mlResponse.data);
  } catch (error) {
    console.error("❌ ML error:", error.message);
    res.status(500).json({ error: "ML prediction failed" });
  }
});

// ✅ Dynamic routes LAST
router.post("/:patientId", upload.single("image"), uploadScan);
router.get("/:patientId", getScansByPatient);

export default router;