import axios from "axios";

// Backend on server/App.js listens on PORT (default 3000)
export const productBaseURL = axios.create({
  baseURL: "http://localhost:5000/api/products",
});

// Appointment feature compatibility endpoints under unified server
export const appointmentBaseURL = axios.create({
  baseURL: "http://localhost:3000/api/appointments",
});

// Medical records API client
export const medicalRecordBaseURL = axios.create({
  baseURL: 'http://localhost:3000/api/medical-records'
});

// Payment API client - unified with main server
export const paymentBaseURL = axios.create({
  baseURL: "http://localhost:3000/api",
});