import express from "express";
import { getAdminPaymentRecords } from "../Controllers/AdminPaymentController.js";

const router = express.Router();

// Route to fetch all payment records for admin dashboard - no auth required
router.get("/payments", getAdminPaymentRecords);

// Public route for testing
router.get("/payments-test", (req, res) => {
  res.json({ success: true, message: "Admin payments test endpoint", data: [] });
});

export default router;