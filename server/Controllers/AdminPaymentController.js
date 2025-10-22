import { Tx } from "../Model/PaymentModel.js";

// This controller handles admin payment record listing
export const getAdminPaymentRecords = async (req, res) => {
  try {
    console.log("Admin payment records requested with query:", req.query);
    
    const filter = {};
    
    // Apply filters from query parameters
    if (req.query.source && req.query.source !== "any") {
      filter.source = req.query.source;
    }
    if (req.query.ref) {
      filter.ref_id = { $regex: req.query.ref, $options: "i" };
    }
    if (req.query.service) {
      filter.description = { $regex: req.query.service, $options: "i" };
    }
    if (req.query.status && req.query.status !== "any") {
      filter.status = req.query.status;
    }
    
    console.log("Applying filter:", JSON.stringify(filter));
    
    const transactions = await Tx.find(filter).sort({ createdAt: -1 });
    
    console.log(`Found ${transactions.length} admin payment records`);
    
    return res.json(transactions);
  } catch (error) {
    console.error("Error fetching admin payment records:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching admin payment records",
      error: error.message,
    });
  }
};