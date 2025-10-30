import express from "express";
import {
  addPatient,
  getAllPatients,
  getSignedUpPatients,
  deletePatient,
} from "../controllers/patientController.js";

const router = express.Router();

router.post("/", addPatient);
router.get("/", getAllPatients);
router.get("/signedup", getSignedUpPatients);
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Patient.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Patient not found" });
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting patient" });
  }
});


export default router;
