const express = require("express");
const router = express.Router();

//Insert Appointment Controller
const {handleAppointmentContoller} = require("../Controllers/AppointmentControllers");

//Routes
router.post("/addAppointment", handleAppointmentContoller);


module.exports = router;
