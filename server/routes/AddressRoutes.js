const express = require("express");
const router = express.Router();
//Insert Address Controller
const AddressController = require("../Controllers/AddressControllers");

//Routes
router.get("/api/addresses", AddressController.getAddresses);
router.post("/api/addresses", AddressController.createAddress);
router.patch("/api/addresses/:id", AddressController.updateAddress);
router.delete("/api/addresses/:id", AddressController.deleteAddress);

module.exports = router;
