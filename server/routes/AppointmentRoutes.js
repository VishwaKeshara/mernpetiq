const express = require("express");

const {
   handleAppointmentController,
   handleAppointmentListController,
   handleAppointmentDeleteController,
   handleAppointmentUpdateController
} = require("../Controllers/AppointmentControllers");

const router = express.Router();

// Routes
router.post("/addAppointment", handleAppointmentController);
router.get("/appointmentList", handleAppointmentListController);
router.post("/deleteAppointment", handleAppointmentDeleteController); // <- ID in body
router.post("/updateAppointment", handleAppointmentUpdateController);

module.exports = router;
