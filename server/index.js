const databaseconnection = require("./database");
const  express = require("express");
const cors = require("cors");
const appointmentRouter = require("./routes/AppointmentRoutes");


databaseconnection();

const app = express();

app.use(express.json())
app.use(cors());

app.get("/", (req, res) => {
    res.send("API is running...");
} );

app.use('/appointment', appointmentRouter)


app.listen(8000, () => {
    console.log("Server is running on port 8000");
});
