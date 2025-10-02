import Appointment from "../Model/AppointmentModel.js";

export const getAllAppointments = async (req, res, next) => {
    let appointments;
    //Get All Appointments
    try {
        appointments = await Appointment.find();
    } catch (err) {
        console.log(err);
    }
    //If no appointments found
    if (!appointments) {
        return res.status(404).json({ message: "No Appointments Found" });
    }
    //Display all appointments
    return res.status(200).json({ appointments });
};

//Data insert
export const addAppointments = async (req, res, next) => {
    const { ownerName, petName, petType, service, price, vet, date, time } = req.body;

    let appointment;    
    try {
        appointment = new Appointment({
            ownerName,
            petName,
            petType,
            service,
            price,
            vet,
            date,
            time
        });
        await appointment.save();
    } catch (err) {
        console.log(err);
    }       
    if (!appointment) {
        return res.status(404).json({ message: "Unable to add" });
    }
    return res.status(200).json({ appointment });

};

//Get by ID
export const getById = async (req, res, next) => {

    const id = req.params.id;

    let appointment;  

    try {
        appointment = await Appointment.findById(id);
    } catch (err) {
        console.log(err);
    }
    if (!appointment) {
        return res.status(404).json({ message: "No Appointment Found" });
    }
    return res.status(200).json({ appointment });
};
//Update Appointment details
export const updateAppointment = async (req, res, next) => {
    const id = req.params.id;
    const { ownerName, petName, petType, service, price, vet, date, time } = req.body;
    let appointment;
    try {
        appointment = await Appointment.findByIdAndUpdate(id, {
            ownerName: ownerName,
            petName: petName,
            petType: petType,
            service: service,
            price: price,
            vet: vet,
            date: date,
            time: time
        });
        appointment = await appointment.save();
    } catch (err) {
        console.log(err);
    }
    if (!appointment) {
        return res.status(404).json({ message: "Unable to update by this ID" });
    }
    return res.status(200).json({ appointment });
};
//Delete Appointment details
export const deleteAppointment = async (req, res, next) => {
    const id = req.params.id;
    let appointment;    
    try {
        appointment = await Appointment.findByIdAndDelete(id);
    }
    catch (err) {
        console.log(err);
    }   
    if (!appointment) {
        return res.status(404).json({ message: "Unable to delete by this ID" });
    }
    return res.status(200).json({ message: "Appointment Successfully Deleted" });
};
// ESM named exports above