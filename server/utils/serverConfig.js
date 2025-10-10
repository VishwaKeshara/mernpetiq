import path from "path";
import fs from "fs";


export const setupUploadsDirectory = () => {
  const uploadsDir = path.join(path.resolve(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("Created uploads directory:", uploadsDir);
  }
};


export const MONGODB_URI = "mongodb://localhost:27017/employee1";


export const PORT = 3001;

