import express from "express";
import { getAdminAddresses } from "../Controllers/AdminAddressControllers.js";

const router = express.Router();


router.get("/api/admin/addresses", getAdminAddresses);

export default router;