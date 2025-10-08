import Appointment from "../Model/AppointmentModel.js";

// Utility function to check if two appointment time slots conflict
// Each appointment is assumed to be 1 hour long
const checkTimeConflict = (time1, time2) => {
    const convertToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const start1 = convertToMinutes(time1);
    const end1 = start1 + 60; // 1 hour duration
    const start2 = convertToMinutes(time2);
    const end2 = start2 + 60; // 1 hour duration

    // Check if time slots overlap
    return start1 < end2 && start2 < end1;
};

// Function to check if an appointment conflicts with existing appointments
const hasConflictingAppointment = async (vet, date, time, excludeId = null) => {
    try {
        const query = { vet, date };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existingAppointments = await Appointment.find(query);
        
        return existingAppointments.some(appointment => 
            checkTimeConflict(appointment.time, time)
        );
    } catch (error) {
        console.error("Error checking appointment conflicts:", error);
        return false;
    }
};

// RESTful: GET /api/appointments
export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find();
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// RESTful: POST /api/appointments
export const addAppointments = async (req, res) => {
    try {
        const { ownerName, petName, petType, service, price, vet, date, time } = req.body;
        
        // Validate required fields
        if (!ownerName || !petName || !petType || !service || !price || !vet || !date || !time) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check for conflicting appointments
        const hasConflict = await hasConflictingAppointment(vet, date, time);
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
};

// RESTful: GET /api/appointments/:id
export const getById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ success: false, message: "No Appointment Found" });
        return res.status(200).json({ success: true, appointment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// RESTful: PUT /api/appointments/:id
export const updateAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { vet, date, time } = req.body;

        // If updating time-related fields, check for conflicts
        if (vet && date && time) {
            const hasConflict = await hasConflictingAppointment(vet, date, time, appointmentId);
            if (hasConflict) {
                return res.status(409).json({ 
                    success: false, 
                    message: `Dr. ${vet} already has an appointment on ${date} that conflicts with the selected time. Each appointment is 1 hour long.`
                });
            }
        }

        const updated = await Appointment.findByIdAndUpdate(appointmentId, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: "Unable to update by this ID" });
        return res.status(200).json({ success: true, appointment: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// RESTful: DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
    try {
        const deleted = await Appointment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Unable to delete by this ID" });
        return res.status(200).json({ success: true, message: "Appointment Successfully Deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Compatibility handlers for feature/appointment
export const handleAppointmentController = addAppointments; // POST create

export const handleAppointmentListController = async (req, res) => {
    try {
        const appointmentList = await Appointment.find({});
        return res.status(200).json({
            message: "All appointments fetched successfully",
            success: true,
            totalCount: appointmentList.length,
            appointmentList,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

export const handleAppointmentDeleteController = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ message: "Appointment ID is required", success: false });
        const deleted = await Appointment.deleteOne({ _id: id });
        if (deleted.deletedCount > 0) return res.json({ message: "Appointment deleted successfully", success: true });
        return res.status(404).json({ message: "Appointment not found", success: false });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

export const handleAppointmentUpdateController = async (req, res) => {
    try {
        const { _id, vet, date, time, ...rest } = req.body;
        if (!_id) return res.status(400).json({ message: "Appointment ID is required", success: false });

        // If updating time-related fields, check for conflicts
        if (vet && date && time) {
            const hasConflict = await hasConflictingAppointment(vet, date, time, _id);
            if (hasConflict) {
                return res.status(409).json({ 
                    success: false, 
                    message: `Dr. ${vet} already has an appointment on ${date} that conflicts with the selected time. Each appointment is 1 hour long.`
                });
            }
        }

        const updateData = { ...rest };
        if (vet) updateData.vet = vet;
        if (date) updateData.date = date;
        if (time) updateData.time = time;

        const updated = await Appointment.updateOne({ _id }, { $set: updateData });
        if (updated.matchedCount === 0) return res.status(404).json({ message: "Appointment not found", success: false });
        if (updated.modifiedCount > 0) return res.json({ message: "Appointment updated successfully", success: true });
        return res.json({ message: "No changes made", success: true });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};
