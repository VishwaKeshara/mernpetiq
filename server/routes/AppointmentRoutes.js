const express = require("express");
const router = express.Router();

//Insert Appointment Controller
const {handleAppointmentContoller, handleAppointmentListContoller, handleAppointmentDeleteContoller} = require("../Controllers/AppointmentControllers");

//Routes
router.post("/addAppointment", handleAppointmentContoller);
router.get("/appointmentList", handleAppointmentListContoller);
router.post("/deleteAppointment", handleAppointmentDeleteContoller);

module.exports = router;
