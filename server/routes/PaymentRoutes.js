import express from "express";
import * as PaymentController from "../Controllers/PaymentControllers.js";
import Tx from "../Model/Tx.js";

const router = express.Router();

// Card management routes
router.post("/create-setup-intent", PaymentController.createSetupIntent);
router.get("/payment-methods", PaymentController.getPaymentMethods);
router.get("/payment-method/:pmId", PaymentController.getPaymentMethod);
router.delete("/payment-method/:pmId", PaymentController.deletePaymentMethod);
router.patch("/payment-method/:pmId", PaymentController.updatePaymentMethod);

// Payment processing routes
router.post("/create-payment-intent", PaymentController.createPaymentIntent);
router.post("/webhook", PaymentController.stripeWebhook);
router.put("/appointment/:appointmentId/payment-status", PaymentController.updateAppointmentPaymentStatus);

// ADMIN: Get all payments
router.get("/payments", PaymentController.getAllPayments);

// ADMIN: Bulk delete payments
router.post("/admin/tx/bulk-delete", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No IDs provided" });
  }
  try {
    await Tx.deleteMany({ _id: { $in: ids } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "Delete failed" });
  }
});

export default router;