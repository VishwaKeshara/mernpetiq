import express from "express";
import { Tx } from "../Model/PaymentModel.js";

const router = express.Router();

// Public route to fetch all payment records without authentication
router.get("/admin-payments", async (req, res) => {
  try {
    console.log("Public admin payment records requested with query:", req.query);
    
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
    
    console.log(`Found ${transactions.length} admin payment records (public route)`);
    
    return res.json(transactions);
  } catch (error) {
    console.error("Error fetching admin payment records (public route):", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching admin payment records",
      error: error.message,
    });
  }
});

export default router;