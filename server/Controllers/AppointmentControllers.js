const Appointment = require("../Model/AppointmentModel");

// Create Appointment
const handleAppointmentController = async (req, res) => { 
    try {
        const body = req.body;
        const { ownerName, petName, petType, service, price, vet, date, time } = body;

        if (!ownerName || !petName || !petType || !service || !price || !vet || !date || !time) {
            return res
                .status(400)
                .json({ message: "All fields are required", success: false });
        }

        const appointmentAdd = await Appointment.create(body);

        if (appointmentAdd) {
            return res
                .status(201)
                .json({ 
                    message: "Appointment Submited successfully", 
                    success: true, 
                    id: appointmentAdd._id 
                });
        }
    } catch (error) {
        return res
            .status(500)
            .json({ message: error.message, success: false });
    }
};

// Get All Appointments
const handleAppointmentListController = async (req, res) => { 
    try {
        const appointmentList = await Appointment.find({});
        return res
            .status(200)
            .json({ 
                message: "All appointments fetched successfully", 
                success: true, 
                totalCount: appointmentList.length, 
                appointmentList 
            });
    } catch (error) {
        return res
            .status(500)
            .json({ message: error.message, success: false });
    }    
};

// Delete Appointment
const handleAppointmentDeleteController = async (req, res) => { 
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Appointment ID is required", success: false });
        }

        const deleted = await Appointment.deleteOne({ _id: id });

        if (deleted.deletedCount > 0) {
            return res.json({ message: "Appointment deleted successfully", success: true });
        } else {
            return res.status(404).json({ message: "Appointment not found", success: false });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }   
};

// Update Appointment
const handleAppointmentUpdateController = async (req, res) => { 
    try {
        const body = req.body;
        const { _id } = body;

        if (!_id) {
            return res.status(400).json({ message: "Appointment ID is required", success: false });
        }

        const updating = await Appointment.updateOne({ _id }, { $set: body });

        if (updating.matchedCount === 0) {
            return res.status(404).json({ message: "Appointment not found", success: false });
        }

        if (updating.modifiedCount > 0) {
            return res.json({ message: "Appointment updated successfully", success: true });
        } else {
            return res.json({ message: "No changes made", success: true });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }   
};

module.exports = {
    handleAppointmentController,
    handleAppointmentListController,
    handleAppointmentDeleteController,
    handleAppointmentUpdateController
};
