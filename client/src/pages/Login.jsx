import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; 

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError("");
    setValidationErrors({});

    // Validate form before submission
    if (!validateForm()) {
      setError("Please fix the validation errors below");
      return;
    }

    setLoading(true);

    try {
      const result = await axios.post("http://localhost:3000/api/register/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.data?.success) {
        const { user, token } = result.data.data;
        login(user, token);
        navigate("/");
      } else {
        setError(result.data?.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
      <div className="bg-white rounded-3xl shadow-2xl flex max-w-4xl w-full overflow-hidden">
        <div className="w-1/2 hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1605460375648-278bcbd579a6?auto=format&fit=crop&w=800&q=80"
            alt="Pets"
            className="h-full w-full object-cover"
          />
        </div>

        <div
          
          
          
          className="w-full md:w-1/2 p-10 md:p-16 relative"
        >
          <h2 className="text-3xl font-bold mb-6 text-yellow-600">Login</h2>

          {error && <div className="text-red-600 mb-4 font-semibold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="email"
                value={email}
                required
                className={`peer w-full border-b-2 ${validationErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Email
              </label>
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                required
                className={`peer w-full border-b-2 ${validationErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 pr-10 placeholder-transparent transition-colors`}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Password
              </label>
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
              )}
            </div>

            <button
              
              
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
              } text-white`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-gray-500 text-center">
            <div>
              <span
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </span>
            </div>
            
            <div>
              Don't have an account?{" "}
              <span
                className="text-yellow-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/signup")}
              >
                Register
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
