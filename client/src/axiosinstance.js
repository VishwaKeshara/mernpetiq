import axios from "axios";

// Backend on server/server.js listens on PORT (default 5000)
const baseConfig = {
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
};

// Product API client
export const productBaseURL = axios.create({
  ...baseConfig,
  baseURL: "http://localhost:5000/api/products",
});

// Appointment feature compatibility endpoints under unified server
export const appointmentBaseURL = axios.create({
  ...baseConfig,
  baseURL: "http://localhost:5000/api/appointments",
});

// Medical records API client
export const medicalRecordBaseURL = axios.create({
  ...baseConfig,
  baseURL: 'http://localhost:5000/api/medical-records'
});

// Payment API client
export const paymentBaseURL = axios.create({
  ...baseConfig,
  baseURL: 'http://localhost:5000/api/payment'
});

// Add response interceptor to all instances
[productBaseURL, appointmentBaseURL, medicalRecordBaseURL, paymentBaseURL].forEach(instance => {
  instance.interceptors.response.use(
    response => response,
    error => {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
      return Promise.reject(error);
    }
  );
});