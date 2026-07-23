const hawkerCentreModel = require("../model/hawkerCentreModel");

// GET /hawkercentre -> for the list page
async function getAllHawkerCentres(req, res) {
  try {
    const centres = await hawkerCentreModel.getAllHawkerCentres();
    res.status(200).json(centres);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hawker centres", details: err.message });
  }
}

// GET /hawkercentre/:id -> for the details page (name, location, stalls)
async function getHawkerCentreById(req, res) {
  try {
    const { id } = req.params;

    const centre = await hawkerCentreModel.getHawkerCentreById(id);
    if (!centre) return res.status(404).json({ error: "Hawker centre not found" });

    const stalls = await hawkerCentreModel.getStallsByHawkerCentreId(id);

    res.status(200).json({ ...centre, stalls });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hawker centre", details: err.message });
  }
}

module.exports = {
  getAllHawkerCentres,
  getHawkerCentreById,
};