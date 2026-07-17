const rentalAgreementModel = require("../model/rentalAgreementModel");

// GET /rentalagreement?stallId=xxx  -> for your table view
async function getRentalAgreementsByStallId(req, res) {
  try {
    const { stallId } = req.query;
    if (!stallId) return res.status(400).json({ error: "stallId is required" });

    const agreements = await rentalAgreementModel.getRentalAgreementsByStallId(stallId);
    res.status(200).json(agreements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rental agreements", details: err.message });
  }
}

// GET /rentalagreement/:id  -> for your details view
async function getRentalAgreementById(req, res) {
  try {
    const { id } = req.params;
    const agreement = await rentalAgreementModel.getRentalAgreementById(id);
    if (!agreement) return res.status(404).json({ error: "Rental agreement not found" });

    res.status(200).json(agreement);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rental agreement", details: err.message });
  }
}

// POST /rentalagreement
async function createRentalAgreement(req, res) {
  try {
    const { stallId, operatorId, startDate, endDate, rentalFee } = req.body;
    if (!stallId || !operatorId || !startDate || !endDate || !rentalFee) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newAgreement = await rentalAgreementModel.createRentalAgreement(req.body);
    res.status(201).json(newAgreement);
  } catch (err) {
    res.status(500).json({ error: "Failed to create rental agreement", details: err.message });
  }
}

// PUT /rentalagreement
async function updateRentalAgreement(req, res) {
  try {
    const { rentalAgreementId } = req.body;
    if (!rentalAgreementId) return res.status(400).json({ error: "rentalAgreementId is required" });

    const updated = await rentalAgreementModel.updateRentalAgreement(req.body);
    if (!updated) return res.status(404).json({ error: "Rental agreement not found" });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update rental agreement", details: err.message });
  }
}

module.exports = {
  getRentalAgreementsByStallId,
  getRentalAgreementById,
  createRentalAgreement,
  updateRentalAgreement,
};