import axios from "axios";

export const appointmentBaseURL = axios.create({
  baseURL: "http://localhost:8000/appointment",
});