import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from "cors";
import EmployeeModel from "./models/Employees.js";
import path from "path";
import fs from "fs";

const app = express();


app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use(cors());
app.use(express.json());


mongoose
  .connect("mongodb://localhost:27017/employee1")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });



const uploadsDir = path.join(path.resolve(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await EmployeeModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.password === password) {
      return res.json({ message: "Login successful", user });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/register", async (req, res) => {
  try {
    const employee = await EmployeeModel.create(req.body);
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});


app.put("/update-profile/:id", upload.single("avatar"), async (req, res) => {
  try {
    console.log("Updating profile for id:", req.params.id);
    console.log("REQ BODY:", req.body);
    console.log("REQ FILE:", req.file);

    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "Missing user id" });

    const { name, email } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await EmployeeModel.findByIdAndUpdate(userId, updateData, { new: true });

    console.log("Updated user result:", updatedUser);

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }

  //get details
});
app.get("/employees", async (req, res) => {
  try {
    const employees = await EmployeeModel.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//add details
app.post("/employees", async (req, res) => {
  try {
    const employee = await EmployeeModel.create(req.body);
    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 //Update details

app.put("/employees/:id", async (req, res) => {
  try {
    const updated = await EmployeeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//delete details
app.delete("/employees/:id", async (req, res) => {
  try {
    const deleted = await EmployeeModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
