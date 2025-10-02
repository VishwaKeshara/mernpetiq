import express from "express";
import {
	getAllAppointments,
	addAppointments,
	getById,
	updateAppointment,
	deleteAppointment,
} from "../Controllers/AppointmentControllers.js";

const router = express.Router();

// Routes
router.get("/", getAllAppointments);
router.post("/", addAppointments);
router.get("/:id", getById);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;
