
import express from "express";
import PaymentControllers from "../Controllers/PaymentControllers.js";

const router = express.Router();

// Route to get all transactions
router.get("/tx", PaymentControllers.getTransactions);

export default router;
