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
    const imageUrl = req.file?.path || req.body.imageUrl;
    if (!imageUrl) return res.status(400).json({ error: "No image URL" });

    const flaskRes = await fetch("http://127.0.0.1:8000/predict", {
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
