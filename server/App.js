// password = ICREf1Yx8Mb0GcXt

const express = require("express");
const mongoose = require("mongoose");
const router = require("./routes/AppointmentRoutes");

const app = express();
const cors = require("cors");



//Middleware
app.use(express.json());
app.use("/appointments",router);
app.use(cors());

mongoose.connect("mongodb+srv://admin:ICREf1Yx8Mb0GcXt@cluster0.9fyuypo.mongodb.net/")
.then(() => console.log("Uba Danatamath connected utto!"))
.then(() => {
    app.listen(5000);
    })
.catch((err) => console.log((err)));


