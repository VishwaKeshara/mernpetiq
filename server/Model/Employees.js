const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarUrl: { type: String }, 
});

const Employees = mongoose.model("Employees", employeeSchema);

module.exports = Employees;
