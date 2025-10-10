import express from 'express';
import * as AppointmentController from '../Controllers/AppointmentControllers.js';

const router = express.Router();

//Routes
router.get("/", AppointmentController.getAllAppointments);
router.post("/", AppointmentController.addAppointments);
router.get("/:id", AppointmentController.getById);
router.put("/:id", AppointmentController.updateAppointment);
router.delete("/:id", AppointmentController.deleteAppointment);

export default router;
