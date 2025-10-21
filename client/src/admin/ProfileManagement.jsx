import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaCamera, FaSave, FaTimes } from "react-icons/fa";

export default function ProfileManagement() {
  const { user, updateUserContext } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    avatarUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        avatarUrl: user.avatarUrl || ""
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.put(
        'http://localhost:5000/api/admin/profile/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          avatarUrl: response.data.data.user.avatarUrl
        }));
        
        // Update user context
        updateUserContext(response.data.data.user);
        setSuccess('Profile photo updated successfully!');
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err.response?.data?.message || 'Failed to upload profile photo');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain letters and spaces';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return errors;
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setValidationErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      // Use the correct user ID (could be _id or id depending on the auth context)
      const userId = user._id || user.id;
      
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/${userId}`,
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase()
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Update user context with the updated user data
        const updatedUser = {
          ...user,
          name: response.data.data.admin.name,
          email: response.data.data.admin.email,
          avatarUrl: response.data.data.admin.avatarUrl
        };
        
        updateUserContext(updatedUser);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        setError('Email already exists. Please use a different email address.');
      } else if (err.response?.status === 404) {
        setError('User not found. Please log in again.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile admin</h1>

      {error && (
        <div
          
          
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          
          
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6"
        >
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Photo Section */}
        <div className="lg:col-span-1">
          <div
            
            
            className="bg-white rounded-lg shadow-md p-6 text-center"
          >
            <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>
            
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mx-auto">
                {formData.avatarUrl ? (
                  <img 
                    src={`http://localhost:5000${formData.avatarUrl}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser className="text-gray-400 text-4xl" />
                )}
              </div>
              
              <button
                onClick={() => setShowImagePreview(!showImagePreview)}
                className="absolute bottom-0 right-0 bg-amber-500 text-white rounded-full p-2 hover:bg-amber-600 transition-colors"
              >
                <FaCamera className="text-sm" />
              </button>
            </div>

            {showImagePreview && (
              <div
                
                
                className="mb-4"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  <FaCamera />
                  {loading ? 'Uploading...' : 'Change Photo'}
                </label>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Click the camera icon to upload a new profile photo
            </p>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="lg:col-span-2">
          <div
            
            
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-amber-500'
                  }`}
                  placeholder="Enter your full name"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-amber-500'
                  }`}
                  placeholder="Enter your email"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <input
                  type="text"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-amber-500 hover:bg-amber-600'
                } text-white`}
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                onClick={() => {
                  setFormData({
                    name: user.name || "",
                    email: user.email || "",
                    role: user.role || "",
                    avatarUrl: user.avatarUrl || ""
                  });
                  setError("");
                  setSuccess("");
                  setValidationErrors({});
                }}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

