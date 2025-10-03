const express = require("express");
const router = express.Router();
//Insert Admin Address Controller
const AdminAddressController = require("../Controllers/AdminAddressControllers");

//Routes
router.get("/api/admin/addresses", AdminAddressController.getAdminAddresses);

module.exports = router;
