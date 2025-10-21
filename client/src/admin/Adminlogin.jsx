import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Adminlogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "admin",
  });
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);


  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password || !form.role) {
      setErr("Please fill in all fields.");
      return;
    }

    setErr(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Login admin from Employee collection
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        email: form.email,
        password: form.password,
        role: form.role
      });

      if (response.data.success) {
        setSuccess(`Login successful! Welcome ${response.data.data.user.name}`);
        console.log("Login successful:", response.data.data);
        
        // Login the user with the token
        login(response.data.data.user, response.data.data.token);
        
        // Navigate to admin dashboard after successful login
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Error logging in admin:", error);
      if (error.response && error.response.data) {
        setErr(error.response.data.message || "Failed to login admin");
      } else {
        setErr("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-yellow-100 via-yellow-500 from-yellow-100">
      <div
        
        
        
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Admin Login
        </h2>

        {err && (
          <div
            
            
            className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center"
          >
            {err}
          </div>
        )}

        {success && (
          <div
            
            
            className="bg-green-100 text-green-600 p-3 rounded mb-4 text-center"
          >
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
            >
            <option value="admin">Admin</option>
              <option value="veterinarian">Veterinarian</option>
              <option value="nurse">Nurse</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>

          <button
            
            
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold shadow-md transition ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            } text-white`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="mt-4 text-sm text-gray-500 text-center">
          Don't have an admin account?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={() => window.location.href = "/adminregister"}
          >
            Register as Admin
          </span>
        </p>
      </div>
    </div>
  );
};

export default Adminlogin;
