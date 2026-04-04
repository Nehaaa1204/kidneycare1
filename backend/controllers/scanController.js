import { getDB } from "../config/db.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "medical_images", allowed_formats: ["jpg", "png", "jpeg"] },
});
export const upload = multer({ storage });

export const uploadScan = async (req, res) => {
  try {
    const db = getDB();

    // ✅ Add this check
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }

    const patientId = req.params.patientId;
    const {
      ckdDetected, ckdProbability, normalProbability,
      egfr, ckdStage, message, imageUrl
    } = req.body;

    // ✅ Log what we received
    console.log("📥 uploadScan called for patient:", patientId);
    console.log("📥 body:", req.body);

    const scan = {
  patientId,

  // prediction
  ckdDetected: ckdDetected === true || ckdDetected === "true",
  prediction: ckdDetected ? "CKD" : "Normal",

  // probabilities
  ckdProbability: ckdProbability ? parseFloat(ckdProbability) : null,
  normalProbability: normalProbability ? parseFloat(normalProbability) : null,

  // medical data
  egfr: egfr ? parseFloat(egfr) : null,
  ckdStage: ckdStage || null,

  // doctor + notes
  message: message || "",
  doctor_comment: "",

  // image
  imageUrl: imageUrl || req.file?.path,

  // time
  uploadedAt: new Date(),
};

    await db.collection("scans").insertOne(scan);
  // 🔥 SAVE FOR TIMELINE
  await db.collection("patient_records").insertOne({
  patient_id: patientId,
  date: new Date(),

  // CKD info
  prediction: ckdDetected ? "CKD" : "Normal",
  risk_score: ckdProbability ? parseFloat(ckdProbability) * 100 : 0,

  // medical info
  egfr: egfr || null,
  ckdStage: ckdStage || null,

  doctor_comment: "",
  imageUrl: imageUrl || req.file?.path
});

    res.json({ success: true, scan });

  } catch (err) {
    console.error("❌ uploadScan error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
export const getScansByPatient = async (req, res) => {
  try {
    const db = getDB();
    const scans = await db
      .collection("scans")
      .find({ patientId: req.params.patientId })
      .sort({ uploadedAt: -1 })
      .toArray();
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const analyzeImage = async (req, res) => {
  try {
    const imageUrl = req.file?.path || req.body.imageUrl;
    if (!imageUrl) return res.status(400).json({ error: "No image URL" });

    const flaskRes = await fetch("https://kidneycare1-ml.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });

    const result = await flaskRes.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getCKDPredictions = async (req, res) => {
  try {
    const db = getDB();
    const patientId = req.params.patientId;
    
    console.log("Fetching CKD predictions for patient:", patientId);
    
    const predictions = await db
      .collection("scans")
      .find({ patientId: patientId })
      .sort({ uploadedAt: -1 })
      .toArray();
    
    console.log("Found predictions:", predictions.length);
    res.json(predictions);
  } catch (err) {
    console.error("Error fetching predictions:", err);
    res.status(500).json({ error: err.message });
  }
};