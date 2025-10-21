import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaLock, FaSpinner, FaCheck } from 'react-icons/fa';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  
  const [formData, setFormData] = useState({
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const validateForm = () => {
    const errors = {};

    if (!formData.resetCode.trim()) {
      errors.resetCode = 'Reset code is required';
    } else if (formData.resetCode.length !== 6) {
      errors.resetCode = 'Reset code must be 6 digits';
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const minLength = formData.newPassword.length >= 8;
      const hasUpperCase = /[A-Z]/.test(formData.newPassword);
      const hasLowerCase = /[a-z]/.test(formData.newPassword);
      const hasNumbers = /\d/.test(formData.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);
      
      if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        errors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/register/reset-password', {
        email: email,
        resetCode: formData.resetCode.trim(),
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess(true);
        setMessage('Password reset successfully! You can now login with your new password.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-600 text-2xl" />
            </div>
            
            <h2 className="text-2xl font-bold text-green-600 mb-4">Password Reset Successfully!</h2>
            
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                You will be redirected to the login page in a few seconds...
              </p>
            </div>
            
            <Link
              to="/login"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl transition-colors inline-block"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-yellow-600 text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-yellow-600 mb-2">Reset Password</h2>
          <p className="text-gray-600">Enter the reset code and your new password</p>
          {email && (
            <p className="text-sm text-gray-500 mt-2">
              Code sent to: <strong>{email}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
              Reset Code
            </label>
            <input
              type="text"
              id="resetCode"
              name="resetCode"
              value={formData.resetCode}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors ${
                validationErrors.resetCode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
              disabled={loading}
            />
            {validationErrors.resetCode && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.resetCode}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors ${
                validationErrors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter new password"
              required
              disabled={loading}
            />
            {validationErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.newPassword}</p>
            )}
            {formData.newPassword && (
              <div className="mt-2 text-xs">
                <p className="text-gray-600 mb-1">Password requirements:</p>
                <div className="space-y-1">
                  <div className={`flex items-center ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="mr-2">{formData.newPassword.length >= 8 ? '✓' : '✗'}</span>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="mr-2">{/[A-Z]/.test(formData.newPassword) ? '✓' : '✗'}</span>
                    One uppercase letter
                  </div>
                  <div className={`flex items-center ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="mr-2">{/[a-z]/.test(formData.newPassword) ? '✓' : '✗'}</span>
                    One lowercase letter
                  </div>
                  <div className={`flex items-center ${/\d/.test(formData.newPassword) ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="mr-2">{/\d/.test(formData.newPassword) ? '✓' : '✗'}</span>
                    One number
                  </div>
                  <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="mr-2">{/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? '✓' : '✗'}</span>
                    One special character
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors ${
                validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                Resetting Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <Link
            to="/forgot-password"
            className="flex items-center justify-center text-yellow-600 hover:text-yellow-700 font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Back to Forgot Password
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
