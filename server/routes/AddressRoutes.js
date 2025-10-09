import express from "express";
import * as AddressController from "../Controllers/AddressControllers.js";

const router = express.Router();

router.get("/addresses", AddressController.getAddresses);
router.post("/addresses", AddressController.createAddress);
router.patch("/addresses/:id", AddressController.updateAddress);
router.delete("/addresses/:id", AddressController.deleteAddress);

export default router;