import express from "express";
import PaymentController from "../Controllers/PaymentControllers.js";

const router = express.Router();

//Routes
router.get("/api/order/:id", PaymentController.getOrder);
router.post("/api/create-setup-intent", PaymentController.createSetupIntent);
router.get("/api/payment-method/:pmId", PaymentController.getPaymentMethod);
router.get("/api/payment-methods", PaymentController.getPaymentMethods);
router.patch("/api/payment-method/:pmId", PaymentController.updatePaymentMethod);
router.post("/api/set-default-payment-method", PaymentController.setDefaultPaymentMethod);
router.delete("/api/payment-method/:pmId", PaymentController.deletePaymentMethod);
router.post("/api/create-payment-intent", PaymentController.createPaymentIntent);
router.post("/api/refund", PaymentController.createRefund);

//Database routes
router.get("/api/db/cards", PaymentController.getCards);
router.get("/api/db/tx", PaymentController.getTransactions);

//Admin routes
router.get("/api/admin/tx", PaymentController.getAdminTransactions);
router.post("/api/admin/tx/bulk-delete", PaymentController.bulkDeleteTransactions);
router.delete("/api/db/tx", PaymentController.deleteTransactions);

export default router;
