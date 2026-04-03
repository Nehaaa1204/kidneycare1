const express = require("express");
const router = express.Router();
const PatientRecord = require("../models/PatientRecord");

// GET timeline records
router.get("/:id/records", async (req, res) => {
try {
    const records = await PatientRecord.find({
    patient_id: req.params.id
    }).sort({ date: -1 });

    res.json(records);
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

module.exports = router;
