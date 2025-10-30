import bcrypt from "bcrypt";
import { getDB } from "../config/db.js";

export const signup = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role)
      return res.status(400).json({ error: "All fields required" });

    if (role === "patient") {
      return res.status(403).json({
        error: "Patients cannot sign up directly. Please contact your doctor.",
      });
    }

    const db = getDB();
    const users = db.collection("users");

    const existing = await users.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username already exists" });
    
    
      
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await users.insertOne({ username, password: hashedPassword, role });

    
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const db = getDB();
    const users = db.collection("users");
    const user = await users.findOne({ username, role });

    if (!user) return res.status(400).json({ error: "Invalid username or role" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    res.json({
      success: true,
      message: "Login successful",
      user: { username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
