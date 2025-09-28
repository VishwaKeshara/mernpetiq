const express = require("express");
const router = express.Router();
//Insert Model
const Appointment = require("../Model/AppointmentModel");
//Insert Appointment Controller
const AppointmentController = require("../Controllers/AppointmentControllers");

//Routes
router.get("/",AppointmentController.getAllAppointments);
router.post("/",AppointmentController.addAppointments);
router.get("/:id",AppointmentController.getById);
router.put("/:id",AppointmentController.updateAppointment);
router.delete("/:id",AppointmentController.deleteAppointment);


module.exports = router;
