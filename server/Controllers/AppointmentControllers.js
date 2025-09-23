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
            .json({message: "All fields are required", success: false});
        }
        const appointmentAdd = await Appointment.create(body);

        if(appointmentAdd){
          return res
            .status(201)
            .json({message: "Data Created Sucssefully", success: true, Id:appointmentAdd?._id, });
        }

        console.log("appointmentAdd", appointmentAdd);
    }catch(error){
     return res
        .status(500)
        .json({message: error.message, Success: false});
    }
};
const handleAppointmentListContoller = async (req, res) => { 
    try{
        const appointmentList =await Appointment.find({});
        return res
        .status(200)
        .json({message: "All Appointmnets fetched successfully", Success: true, TotalCount: appointmentList.length, appointmentList:appointmentList });
        
    }catch(error){
        return res
        .status(400)
        .json({message: error.message, Success: false});
    }    
};
const handleAppointmentDeleteContoller = async (req, res) => { 
   const body = req.body;
    try{
        const deleted =await Appointment.deleteOne({_id: body.Id});
        console.log("deleted", deleted);
        if(deleted.acknowledged){
        return res.json({
          message: "Appointment Deleted successfully", 
          success: true});
        }
        }catch(error){
          return res
        .status(400)
        .json({message: error.message, success: false});
    }   
} ;


module.exports = {handleAppointmentContoller, handleAppointmentListContoller, handleAppointmentDeleteContoller};