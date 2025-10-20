import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaEnvelope, FaSpinner } from 'react-icons/fa';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:3000/api/register/forgot-password', {
        email: email.trim().toLowerCase()
      });

      if (response.data.success) {
        setSuccess(true);
        setMessage('Password reset code sent to your email. Please check your inbox and spam folder.');
      } else {
        setError(response.data.message || 'Failed to send reset code');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
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
              <FaEnvelope className="text-green-600 text-2xl" />
            </div>
            
            <h2 className="text-2xl font-bold text-green-600 mb-4">Check Your Email</h2>
            
            <p className="text-gray-600 mb-6">
              We've sent a password reset code to <strong>{email}</strong>
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Please check your inbox and spam folder. The code will expire in 15 minutes.
            </p>
            
            <div className="space-y-3">
              <Link
                to={`/reset-password?email=${encodeURIComponent(email)}`}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Enter Reset Code
              </Link>
              
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setMessage('');
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Try Different Email
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                to="/login"
                className="flex items-center justify-center text-yellow-600 hover:text-yellow-700 font-medium"
              >
                <FaArrowLeft className="mr-2" />
                Back to Login
              </Link>
            </div>
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
            <FaEnvelope className="text-yellow-600 text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-yellow-600 mb-2">Forgot Password?</h2>
          <p className="text-gray-600">Enter your email address and we'll send you a reset code</p>
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
              <FaEnvelope className="absolute right-3 top-3.5 text-gray-400" />
            </div>
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
                Sending Code...
              </span>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <Link
            to="/login"
            className="flex items-center justify-center text-yellow-600 hover:text-yellow-700 font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
