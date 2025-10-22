import express from "express";
import * as PaymentController from "../Controllers/PaymentControllers.js";
import { getInvoice, getInvoiceByParam } from "../Controllers/InvoiceController.js";
import { Tx } from "../Model/PaymentModel.js";
import * as AddressController from "../Controllers/AddressControllers.js";

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


router.get("/invoice", getInvoice);                
router.get("/payments/:id/invoice", getInvoiceByParam); 


// Admin access to payments data
router.get("/payments", PaymentController.getAllPayments);

// Ensure this route has proper error handling
router.get("/payments-debug", async (req, res) => {
  try {
    const filter = {};
    const transactions = await Tx.find(filter).sort({ createdAt: -1 });
    console.log(`Found ${transactions.length} payment transactions`);
    res.json(transactions);
  } catch (error) {
    console.error("Payment query error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments (debug route)",
      error: error.message,
    });
  }
});


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

// Address routes directly in the payment routes file
router.get("/addresses", AddressController.getAddresses);
router.post("/addresses", AddressController.createAddress);
router.patch("/addresses/:id", AddressController.updateAddress);
router.delete("/addresses/:id", AddressController.deleteAddress);

export default router;