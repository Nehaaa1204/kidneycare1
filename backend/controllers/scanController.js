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
    const patientId = req.params.patientId;
    if (!req.file?.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const scan = {
      patientId,
      imageUrl: req.file.path,
      uploadedAt: new Date(),
    };

    await db.collection("scans").insertOne(scan);
    res.json({ success: true, scan });
  } catch (err) {
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
    console.log("📩 Received analyze request...");

    const imageUrl = req.file?.path || req.body.imageUrl;
    console.log("🖼️ Image URL received in backend:", imageUrl);

    if (!imageUrl) {
      console.log("❌ No image URL received!");
      return res.status(400).json({ error: "No image URL" });
    }

    // 🔹 Send to Flask for prediction
    const flaskRes = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });

    console.log("📨 Sent to Flask... waiting for response...");

    const result = await flaskRes.json();
    console.log("✅ Flask result received:", result);

    res.json(result);
  } catch (err) {
    console.error("❌ Error analyzing image:", err);
    res.status(500).json({ error: err.message });
  }
};

