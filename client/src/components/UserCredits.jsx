import React, { useState, useEffect } from 'react';
import { 
  FaCreditCard, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaClock, 
  FaCheck, 
  FaExclamationTriangle,
  FaPaw,
  FaFileMedical,
  FaGift
} from 'react-icons/fa';
import axios from 'axios';

const UserCredits = () => {
  const [credits, setCredits] = useState([]);
  const [availableCredits, setAvailableCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchUserCredits();
  }, []);

  const fetchUserCredits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user._id) {
        console.error('User not found');
        return;
      }

      // Fetch all credits for the user
      const allCreditsResponse = await axios.get(`http://localhost:5000/api/credits/owner/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch available credits for the user
      const availableCreditsResponse = await axios.get(`http://localhost:5000/api/credits/owner/${user._id}/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (allCreditsResponse.data.success) {
        setCredits(allCreditsResponse.data.data);
      }

      if (availableCreditsResponse.data.success) {
        setAvailableCredits(availableCreditsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Used': return 'text-blue-600 bg-blue-100';
      case 'Expired': return 'text-gray-600 bg-gray-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FaClock className="w-4 h-4" />;
      case 'Approved': return <FaCheck className="w-4 h-4" />;
      case 'Used': return <FaDollarSign className="w-4 h-4" />;
      case 'Expired': return <FaExclamationTriangle className="w-4 h-4" />;
      case 'Cancelled': return <FaExclamationTriangle className="w-4 h-4" />;
      default: return <FaCreditCard className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalAvailableAmount = availableCredits.reduce((sum, credit) => sum + credit.remainingAmount, 0);
  const totalCreditsAmount = credits.reduce((sum, credit) => sum + credit.creditAmount, 0);
  const totalUsedAmount = credits.reduce((sum, credit) => sum + credit.usedAmount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaGift className="w-5 h-5 mr-2 text-green-600" />
              My Credits
            </h3>
            <p className="text-sm text-gray-600 mt-1">Manage your pet care credits</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">${totalAvailableAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Available Credits</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-green-600">${totalAvailableAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-blue-600">${totalUsedAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Used</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-gray-600">${totalCreditsAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'available'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available ({availableCredits.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'all'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Credits ({credits.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'available' ? (
          <div>
            {availableCredits.length === 0 ? (
              <div className="text-center py-8">
                <FaCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Credits</h3>
                <p className="text-gray-600">You don't have any available credits at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableCredits.map((credit) => (
                  <div
                    key={credit._id}
                    className={`border rounded-lg p-4 ${
                      isExpiringSoon(credit.expiryDate) ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FaPaw className="w-4 h-4 text-green-600 mr-2" />
                          <h4 className="text-lg font-medium text-gray-900">{credit.petName}</h4>
                          <span className="ml-2 text-sm text-gray-500">({credit.creditType})</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{credit.creditReason}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <FaCalendarAlt className="w-4 h-4 mr-1" />
                          <span>Expires: {formatDate(credit.expiryDate)}</span>
                          {isExpiringSoon(credit.expiryDate) && (
                            <span className="ml-2 text-yellow-600 font-medium">(Expiring Soon!)</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${credit.remainingAmount}</div>
                        <div className="text-sm text-gray-500">Available</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {credits.length === 0 ? (
              <div className="text-center py-8">
                <FaCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Credits</h3>
                <p className="text-gray-600">You haven't received any credits yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {credits.map((credit) => (
                  <div
                    key={credit._id}
                    className={`border rounded-lg p-4 ${
                      isExpired(credit.expiryDate) ? 'border-gray-200 bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FaPaw className="w-4 h-4 text-gray-600 mr-2" />
                          <h4 className="text-lg font-medium text-gray-900">{credit.petName}</h4>
                          <span className="ml-2 text-sm text-gray-500">({credit.creditType})</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{credit.creditReason}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <FaCalendarAlt className="w-4 h-4 mr-1" />
                          <span>Issued: {formatDate(credit.issuedDate)}</span>
                          <span className="mx-2">•</span>
                          <span>Expires: {formatDate(credit.expiryDate)}</span>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(credit.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(credit.status)}`}>
                            {credit.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">${credit.creditAmount}</div>
                        <div className="text-sm text-gray-500">Total Amount</div>
                        {credit.remainingAmount !== credit.creditAmount && (
                          <div className="text-sm text-green-600">${credit.remainingAmount} remaining</div>
                        )}
                      </div>
                    </div>

                    {/* Usage History */}
                    {credit.usageHistory && credit.usageHistory.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Usage History</h5>
                        <div className="space-y-2">
                          {credit.usageHistory.map((usage, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div>
                                <span className="font-medium">{usage.usedFor}</span>
                                <span className="text-gray-500 ml-2">({formatDate(usage.usedDate)})</span>
                              </div>
                              <span className="text-red-600">-${usage.usedAmount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t text-center">
        <p className="text-sm text-gray-600">
          Credits can be used for future veterinary services and treatments
        </p>
      </div>
    </div>
  );
};

export default UserCredits;
