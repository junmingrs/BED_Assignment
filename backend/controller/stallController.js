// stallController.js
const stallModel = require("../model/stallModel");

const getStallInfo = async (req, res) => {
  try {
    const { stallId } = req.params;
    const result = await stallModel.getStallInfo(stallId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getStallInfo:", error);
    res.status(500).json({ error: error.message });
  }
};

const getStallIdByVendorId = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const result = await stallModel.getStallIdByVendorId(vendorId);
    res.status(200).json(result.stall_id);
  } catch (error) {
    console.error("Error in getStallIdByVendorId:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStallInfo,
  getStallIdByVendorId
};
