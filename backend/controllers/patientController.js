  import { getDB } from "../config/db.js";
  import bcrypt from "bcrypt";

export const addPatient = async (req, res) => {
  try {
    const db = getDB();

    // Generate unique 5-digit ID
    const id = Math.floor(10000 + Math.random() * 90000).toString();
    const password = Math.random().toString(36).slice(-8); // 8-character random password

    const hashedPassword = await bcrypt.hash(password, 10);
    const {name,age,gender}= req.body;
    const newPatient = { id, 
      name, age,gender,
      password: hashedPassword,
      role: "patient",
    };
    await db.collection("patients").insertOne(newPatient);

    await db.collection("users").insertOne({
      username: id,
      password: hashedPassword,
      role: "patient",
    });

    res.status(201).json({
      success: true,
      message: "Patient added successfully!",
      patientId: id,
      tempPassword: password, // plain password to give to patient
    });
  } catch (err) {
    console.error("Error adding patient:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getAllPatients = async (req, res) => {
  try {
    const db = getDB();
    const patients = await db.collection("patients").find({}).toArray();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSignedUpPatients = async (req, res) => {
  try {
    const db = getDB();
    const patients = await db.collection("users").find({ role: "patient" }).toArray();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;
    const result = await db.collection("patients").deleteOne({ id });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
