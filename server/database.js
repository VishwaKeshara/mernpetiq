// password = ICREf1Yx8Mb0GcXt

const mongoose = require("mongoose");

const databaseconnection = () => {
    mongoose
        .connect("mongodb+srv://admin:ICREf1Yx8Mb0GcXt@cluster0.9fyuypo.mongodb.net/")
        .then(() => { 
            console.log("DB connected!")
        })
        .catch((err) => {
            console.log("Database connection error:", err);   
        });
};
module.exports = databaseconnection;


