import express from "express";
import { addNote, getNotesForPatient } from "../controllers/noteController.js";

const router = express.Router();

router.post("/", addNote);
router.get("/:patientId", getNotesForPatient); // changed here ✅

export default router;
