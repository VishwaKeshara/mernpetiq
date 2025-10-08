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
router.post("/addappointment", async (req, res) => {
	try {
		const { ownerName, petName, petType, service, price, vet, date, time } = req.body;
		
		// Validate required fields
		if (!ownerName || !petName || !petType || !service || !price || !vet || !date || !time) {
			return res.status(400).json({ success: false, message: "All fields are required" });
		}

		const { default: Appointment } = await import("../Model/AppointmentModel.js");

		// Check for conflicting appointments
		const existingAppointments = await Appointment.find({ vet, date });
		
		const convertToMinutes = (timeStr) => {
			const [hours, minutes] = timeStr.split(":").map(Number);
			return hours * 60 + minutes;
		};

		const checkTimeConflict = (time1, time2) => {
			const start1 = convertToMinutes(time1);
			const end1 = start1 + 60; // 1 hour duration
			const start2 = convertToMinutes(time2);
			const end2 = start2 + 60; // 1 hour duration
			return start1 < end2 && start2 < end1;
		};

		const hasConflict = existingAppointments.some(appointment => 
			checkTimeConflict(appointment.time, time)
		);

		if (hasConflict) {
			return res.status(409).json({ 
				success: false, 
				message: `Dr. ${vet} already has an appointment on ${date} that conflicts with the selected time. Each appointment is 1 hour long.`
			});
		}

		const appointment = await Appointment.create({ ownerName, petName, petType, service, price, vet, date, time });
		return res.status(201).json({ success: true, appointment, message: "Appointment Created" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
}); // note: case-insensitive path from client
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
		const { _id, vet, date, time, ...updates } = req.body;
		const { default: Appointment } = await import("../Model/AppointmentModel.js");

		// Import conflict checking function
		const { hasConflictingAppointment } = await import("../Controllers/AppointmentControllers.js");

		// If updating time-related fields, check for conflicts
		if (vet && date && time) {
			// We need to implement the conflict checking here too
			const query = { vet, date, _id: { $ne: _id } };
			const existingAppointments = await Appointment.find(query);
			
			const convertToMinutes = (timeStr) => {
				const [hours, minutes] = timeStr.split(":").map(Number);
				return hours * 60 + minutes;
			};

			const checkTimeConflict = (time1, time2) => {
				const start1 = convertToMinutes(time1);
				const end1 = start1 + 60;
				const start2 = convertToMinutes(time2);
				const end2 = start2 + 60;
				return start1 < end2 && start2 < end1;
			};

			const hasConflict = existingAppointments.some(appointment => 
				checkTimeConflict(appointment.time, time)
			);

			if (hasConflict) {
				return res.status(409).json({ 
					success: false, 
					message: `Dr. ${vet} already has an appointment on ${date} that conflicts with the selected time. Each appointment is 1 hour long.`
				});
			}
		}

		const allUpdates = { ...updates };
		if (vet) allUpdates.vet = vet;
		if (date) allUpdates.date = date;
		if (time) allUpdates.time = time;

		const updated = await Appointment.findByIdAndUpdate(_id, allUpdates, { new: true });
		if (!updated) return res.status(404).json({ success: false, message: "Unable to update by this ID" });
		return res.status(200).json({ success: true, appointment: updated, message: "Appointment Updated" });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
});

export default router;
