const Appointment = require("../Model/AppointmentModel");

const handleAppointmentContoller = async (req, res) => { 
    try{
        const body = req.body;
        if(!body.ownerName || 
            !body.petName || 
            !body.petType || 
            !body.service || 
            !body.price || 
            !body.vet || 
            !body.date || 
            !body.time
        ) {
            return res
            .status(400)
            .json({message: "All fields are required", Success: false});
        }
        const appointmentAdd = await Appointment.create(body);

        if(appointmentAdd){
            return res
            .status(201)
            .json({message: "Data Created Succsefully", Success: true, Id: appointmentAdd?._id});
        }

        console.log("appointmentAdd", appointmentAdd);

    }catch(error){
     return res
        .status(500)
        .json({message: error.message, Success: false});
    }
};

module.exports = {handleAppointmentContoller};