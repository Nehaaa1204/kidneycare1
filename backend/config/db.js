// backend/config/db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
let db;

export async function connectDB() {
  const uri = process.env.MONGO_URI; // ← read here, after dotenv runs

  if (!uri) {
    console.error("❌ MONGO_URI is not defined!");
    process.exit(1);
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db("medicaldb");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// ✅ named export so controllers can import { getDB }
export function getDB() {
  if (!db) {
    throw new Error("Database not initialized! Call connectDB() first.");
  }
  return db;
}

