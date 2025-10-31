import { getDB } from "../config/db.js";

export const addNote = async (req, res) => {
  try {
    const { patientId, doctorUsername, diagnosis, treatment, recommendations } = req.body;

    if (!patientId || !doctorUsername || !diagnosis)
      return res.status(400).json({ error: "Required fields missing" });

    const db = getDB();
    const note = {
      patientId,
      doctorUsername,
      diagnosis,
      treatment,
      recommendations,
      createdAt: new Date(),
    };

    const result = await db.collection("patientNotes").insertOne(note);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getNotesForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const db = getDB();
    const notes = await db.collection("patientNotes").find({ patientId }).toArray();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

