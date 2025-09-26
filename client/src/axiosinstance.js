import axios from "axios";

// Base URL for your backend
const baseURL = "http://localhost:5000/api";

// Appointment API instance
export const appointmentBaseURL = axios.create({
  baseURL: `${baseURL}/appointments`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Product API instance
export const productBaseURL = axios.create({
  baseURL: `${baseURL}/products`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Default export for general use
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;