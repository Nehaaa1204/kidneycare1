import axios from "axios";
import express from "express";
import { upload, uploadScan, getScansByPatient, analyzeImage, getCKDPredictions } from "../controllers/scanController.js";

const router = express.Router();

// ✅ SPECIFIC routes FIRST — before any /:patientId
router.post("/analyze", analyzeImage);

router.post("/test", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    console.log("🧠 CT analyze called with:", imageUrl);
    
    if (!imageUrl) return res.status(400).json({ error: "imageUrl missing" });

    const mlResponse = await axios.post("https://kidneycare1-5.onrender.com/predict", { imageUrl });
    console.log("✅ ML response:", mlResponse.data);
    res.json(mlResponse.data);

  } catch (error) {
    console.error("❌ ML error:", error.message);
    res.status(500).json({ error: "ML prediction failed" });
  }
});

// ✅ DYNAMIC routes LAST
router.post("/:patientId", (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart")) {
    upload.single("image")(req, res, next);
  } else {
    next();
  }
}, uploadScan);

router.get("/:patientId", getScansByPatient);
router.get("/ckd/:patientId", getCKDPredictions);

export default router;