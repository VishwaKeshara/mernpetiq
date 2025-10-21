import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validatePostalCode = (postalCode) => {
    const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
    return postalRegex.test(postalCode);
  };

  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) return true; // Optional field
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13 && age <= 120; // Reasonable age range
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!name.trim()) {
      errors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long";
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      errors.name = "Name can only contain letters and spaces";
    }

    // Email validation
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.password = "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Phone validation
    if (phone && !validatePhone(phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    // Address validation
    if (addressLine1 && addressLine1.trim().length < 5) {
      errors.addressLine1 = "Address must be at least 5 characters long";
    }

    // City validation
    if (city && city.trim().length < 2) {
      errors.city = "City must be at least 2 characters long";
    }

    // State validation
    if (state && state.trim().length < 2) {
      errors.state = "State must be at least 2 characters long";
    }

    // Postal code validation
    if (postalCode && !validatePostalCode(postalCode)) {
      errors.postalCode = "Please enter a valid postal code";
    }

    // Country validation
    if (country && country.trim().length < 2) {
      errors.country = "Country must be at least 2 characters long";
    }

    // Date of birth validation
    if (dateOfBirth && !validateDateOfBirth(dateOfBirth)) {
      errors.dateOfBirth = "You must be at least 13 years old to register";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError("");
    setSuccess("");
    setValidationErrors({});

    // Validate form before submission
    if (!validateForm()) {
      setError("Please fix the validation errors below");
      return;
    }

    setLoading(true);

    axios
      .post("http://localhost:5000/api/register/register", { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password,
        phone: phone.trim(), 
        addressLine1: addressLine1.trim(), 
        addressLine2: addressLine2.trim(), 
        city: city.trim(), 
        state: state.trim(), 
        postalCode: postalCode.trim(), 
        country: country.trim(), 
        dateOfBirth
      })
      .then((result) => {
        console.log("Registration successful:", result.data);
        setSuccess("Registration successful! Redirecting to login...");
        
        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setPhone("");
        setAddressLine1("");
        setAddressLine2("");
        setCity("");
        setState("");
        setPostalCode("");
        setCountry("");
        setDateOfBirth("");
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate("/login"); 
        }, 2000);
      })
      .catch((err) => {
        console.error("Registration error:", err);
        setError(err.response?.data?.message || "Failed to register. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
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
          <h2 className="text-3xl font-bold mb-6 text-yellow-600">
            Create Account
          </h2>

          {error && (
            <div className="text-red-600 mb-4 font-semibold">{error}</div>
          )}

          {success && (
            <div className="text-green-600 mb-4 font-semibold">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                name="name"
                value={name}
                required
                className={`peer w-full border-b-2 ${validationErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                placeholder="Full Name"
                onChange={(e) => setName(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Full Name
              </label>
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
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
                type="password"
                name="password"
                value={password}
                required
                className={`peer w-full border-b-2 ${validationErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Password
              </label>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
              )}
              {password && (
                <div className="mt-2 text-xs">
                  <p className="text-gray-600 mb-1">Password requirements:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-2">{password.length >= 8 ? '✓' : '✗'}</span>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-2">{/[A-Z]/.test(password) ? '✓' : '✗'}</span>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-2">{/[a-z]/.test(password) ? '✓' : '✗'}</span>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${/\d/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-2">{/\d/.test(password) ? '✓' : '✗'}</span>
                      One number
                    </div>
                    <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-2">{/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '✗'}</span>
                      One special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                required
                className={`peer w-full border-b-2 ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Confirm Password
              </label>
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={phone}
                className={`peer w-full border-b-2 ${validationErrors.phone ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                placeholder="Phone"
                onChange={(e) => setPhone(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Phone
              </label>
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                name="addressLine1"
                value={addressLine1}
                className={`peer w-full border-b-2 ${validationErrors.addressLine1 ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                placeholder="Address line 1"
                onChange={(e) => setAddressLine1(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Address line 1
              </label>
              {validationErrors.addressLine1 && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.addressLine1}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                name="addressLine2"
                value={addressLine2}
                className="peer w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2 placeholder-transparent transition-colors"
                placeholder="Address line 2"
                onChange={(e) => setAddressLine2(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Address line 2
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  name="city"
                  value={city}
                  className={`peer w-full border-b-2 ${validationErrors.city ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                  placeholder="City"
                  onChange={(e) => setCity(e.target.value)}
                />
                <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                  City
                </label>
                {validationErrors.city && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="state"
                  value={state}
                  className={`peer w-full border-b-2 ${validationErrors.state ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                  placeholder="State/Province"
                  onChange={(e) => setState(e.target.value)}
                />
                <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                  State/Province
                </label>
                {validationErrors.state && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  name="postalCode"
                  value={postalCode}
                  className={`peer w-full border-b-2 ${validationErrors.postalCode ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                  placeholder="Postal Code"
                  onChange={(e) => setPostalCode(e.target.value)}
                />
                <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                  Postal Code
                </label>
                {validationErrors.postalCode && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.postalCode}</p>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="country"
                  value={country}
                  className={`peer w-full border-b-2 ${validationErrors.country ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                  placeholder="Country"
                  onChange={(e) => setCountry(e.target.value)}
                />
                <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                  Country
                </label>
                {validationErrors.country && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.country}</p>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="date"
                name="dateOfBirth"
                value={dateOfBirth}
                className={`peer w-full border-b-2 ${validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300 focus:border-yellow-500'} outline-none p-2 placeholder-transparent transition-colors`}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Date of Birth
              </label>
              {validationErrors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
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
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <span
              className="text-yellow-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
          
          <p className="mt-2 text-sm text-gray-500 text-center">
            Staff member?{" "}
            <span
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/adminlogin")}
            >
              Admin Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
