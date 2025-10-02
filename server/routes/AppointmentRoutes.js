import express from "express";
import {
	getAllAppointments,
	addAppointments,
	getById,
	updateAppointment,
	deleteAppointment,
} from "../Controllers/AppointmentControllers.js";

const router = express.Router();

// RESTful routes used by server mounting at /api/appointments
router.get("/", getAllAppointments);
router.post("/", addAppointments);
router.get("/:id", getById);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

// Optional compatibility routes for feature/appointment client if needed
// POST body: full appointment object
router.post("/addappointment", addAppointments); // note: case-insensitive path from client
router.get("/appointmentList", async (req, res, next) => {
	try {
		// Reuse getAllAppointments but adapt response shape
		const reqMock = req; const resMock = { status:(c)=>({ json:(o)=>o }) };
		// We'll just call model directly here instead for simplicity
		// import inside to avoid circular
		const { default: Appointment } = await import("../Model/AppointmentModel.js");
		const appointmentList = await Appointment.find();
		return res.status(200).json({ success: true, appointmentList });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
});
router.post("/deleteAppointment", async (req, res) => {
	try {
		const { id } = req.body;
		const { default: Appointment } = await import("../Model/AppointmentModel.js");
		await Appointment.findByIdAndDelete(id);
		return res.status(200).json({ success: true, message: "Appointment Successfully Deleted" });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
});
router.post("/updateAppointment", async (req, res) => {
	try {
		const { _id, ...updates } = req.body;
		const { default: Appointment } = await import("../Model/AppointmentModel.js");
		const updated = await Appointment.findByIdAndUpdate(_id, updates, { new: true });
		if (!updated) return res.status(404).json({ success: false, message: "Unable to update by this ID" });
		return res.status(200).json({ success: true, appointment: updated, message: "Appointment Updated" });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
});

export default router;
