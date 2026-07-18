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

const getAllStalls = async (req, res) => {
    try {
        const result = await stallModel.getAllStalls();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getAllStalls:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateStall = async (req, res) => {
    try {
        const { stallId } = req.params;
        const { stall_name, stall_unit_no } = req.body;
        const accountId = req.user.id;

        if (!stall_name && !stall_unit_no) {
            return res.status(400).json({
                error: "At least one field to update is required: stall_name, stall_unit_no"
            });
        }

        // Check if stall exists and user has permission
        // (Only Vendor who owns the stall or Operator can update)
        const result = await stallModel.updateStall(stallId, accountId, {
            stall_name,
            stall_unit_no
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in updateStall:", error);
        res.status(500).json({ error: error.message });
    }
};
module.exports = {
  getStallInfo,
  getStallIdByVendorId,
  getStallInfo,
  getAllStalls,
  updateStall
};
