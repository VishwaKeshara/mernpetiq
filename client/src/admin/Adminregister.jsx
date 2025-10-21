import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminRegister = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    shift: "",
    role: "admin",
  });

  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setErr("Please fill in all required fields");
      return;
    }

    if (form.role === "receptionist" && !form.phone) {
      setErr("Phone number is required for Receptionist");
      return;
    }
    if (form.role === "veterinarian" && !form.specialization) {
      setErr("Specialization is required for Veterinarian");
      return;
    }
    if (form.role === "nurse" && !form.shift) {
      setErr("Shift is required for Nurse");
      return;
    }

    setErr(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Save admin data to Employee collection (for staff)
      const response = await axios.post('http://localhost:5000/api/admin/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      });

      if (response.data.success) {
        setSuccess(`Admin registered successfully! Welcome ${response.data.data.name}`);
        console.log("Data saved to Employee collection:", response.data.data);
        
        // Login the user with the token
        login(response.data.data, response.data.data.token);
        
        // Navigate to admin dashboard after successful registration
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Error registering admin:", error);
      if (error.response && error.response.data) {
        setErr(error.response.data.message || "Failed to register admin");
      } else {
        setErr("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400">
      <div
        
        
        
        className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-lg"
      >
        <h2
          
          
          
          className="text-4xl font-extrabold text-center text-gray-800 mb-6"
        >
          Create Account
        </h2>

        {err && (
          <div
            
            
            className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center font-medium"
          >
            {err}
          </div>
        )}

        {success && (
          <div
            
            
            className="bg-green-100 text-green-600 p-3 rounded mb-4 text-center font-medium"
          >
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Name */}
          <input
            whileFocus={{ scale: 1.02 }}
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={onChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
          />

          {/* Email */}
          <input
            whileFocus={{ scale: 1.02 }}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
          />

          {/* Password */}
          <input
            whileFocus={{ scale: 1.02 }}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
          />

          {/* Role Select */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Role</label>
            <select
              whileFocus={{ scale: 1.02 }}
              name="role"
              value={form.role}
              onChange={onChange}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
            >
            <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
              <option value="veterinarian">Veterinarian</option>
              <option value="nurse">Nurse</option>
            </select>
          </div>

          {/* Conditional Fields */}
          {form.role === "receptionist" && (
            <input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={onChange}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
            />
          )}

          {form.role === "veterinarian" && (
            <input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="specialization"
              placeholder="Specialization (Ex: Surgery)"
              value={form.specialization}
              onChange={onChange}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
            />
          )}

          {form.role === "nurse" && (
            <input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="shift"
              placeholder="Shift (Morning/Evening)"
              value={form.shift}
              onChange={onChange}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
            />
          )}

          {/* Submit */}
          <button
            
            
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold shadow-lg transition ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:opacity-90'
            } text-white`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p className="mt-4 text-sm text-gray-500 text-center">
          Already have an admin account?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={() => window.location.href = "/adminlogin"}
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminRegister;
