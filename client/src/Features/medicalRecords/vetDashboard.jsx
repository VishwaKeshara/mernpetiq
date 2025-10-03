import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { medicalRecordBaseURL } from '../../axiosinstance';
import { toast } from 'react-toastify';
import { 
  User, 
  LogOut, 
  Plus, 
  FileText, 
  Calendar, 
  Pill,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

// Removed authentication dependency
import MedicalRecordForm from '../../components/MedicalRecordForm';
import SearchBar from '../../components/SearchBar';
import FileUploader from '../../components/FileUploader';
import { QuickDownloadButton } from '../../components/PdfDownloader';

const VetDashboard = () => {
  // Mock user data since authentication is removed
  const user = { name: 'Dr. Veterinarian', role: 'vet' };
  const logout = () => {
    toast.info('Logout functionality removed');
  };
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [owners, setOwners] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    todayRecords: 0,
    recordsWithPrescriptions: 0
  });

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    petType: '',
    status: 'active',
    dateRange: ''
  });

  const filterRecords = useCallback(() => {
    let filtered = [...records];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.petName.toLowerCase().includes(query) ||
        record.ownerName.toLowerCase().includes(query) ||
        record.petType.toLowerCase().includes(query) ||
        record.symptoms?.toLowerCase().includes(query) ||
        record.diagnosis?.toLowerCase().includes(query)
      );
    }

    // Pet type filter
    if (filters.petType) {
      filtered = filtered.filter(record => record.petType === filters.petType);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(record => record.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(record => 
            new Date(record.visitDate) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(record => 
            new Date(record.visitDate) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(record => 
            new Date(record.visitDate) >= filterDate
          );
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(record => 
            new Date(record.visitDate) >= filterDate
          );
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(record => 
            new Date(record.visitDate) >= filterDate
          );
          break;
        default:
          // No additional filtering for unknown date ranges
          break;
      }
    }

    setFilteredRecords(filtered);
  }, [records, searchQuery, filters]);

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filter records when search query or filters change
  useEffect(() => {
    filterRecords();
  }, [filterRecords]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Check if backend is running by trying to connect
      try {
        const [recordsRes, statsRes] = await Promise.all([
          medicalRecordBaseURL.get('/'),
          medicalRecordBaseURL.get('/stats')
        ]);

        setRecords(recordsRes.data.data || []);
        setStats(statsRes.data.data || {});
        
        // Try to get owners list, but don't fail if it's not available
        try {
          const ownersRes = await axios.get('/api/users/owners/list');
          setOwners(ownersRes.data.data || []);
        } catch (ownersError) {
          console.warn('Owners list not available:', ownersError.message);
          setOwners([]);
        }
      } catch (apiError) {
        console.warn('Backend not running, using mock data:', apiError.message);
        // Use mock data when backend is not available
        setRecords([]);
        setOwners([]);
        setStats({
          totalRecords: 0,
          todayRecords: 0,
          recordsWithPrescriptions: 0
        });
        toast.info('Backend not running - using demo mode');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (recordData) => {
    try {
  const response = await medicalRecordBaseURL.post('/', recordData);
      setRecords(prev => [response.data.data, ...prev]);
      setShowForm(false);
      toast.success('Medical record created successfully!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalRecords: prev.totalRecords + 1,
        todayRecords: prev.todayRecords + (new Date(recordData.visitDate).toDateString() === new Date().toDateString() ? 1 : 0),
        recordsWithPrescriptions: prev.recordsWithPrescriptions + (recordData.prescription ? 1 : 0)
      }));
    } catch (error) {
      console.error('Error creating record:', error);
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Backend server is not running. Please start the backend server.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create medical record');
      }
    }
  };

  const handleEditRecord = async (recordData) => {
    try {
      // Ensure we have the record ID for updating
      const recordId = editingRecord?._id || recordData._id;
      if (!recordId) {
        toast.error('Record ID is missing. Cannot update record.');
        return;
      }

      const response = await medicalRecordBaseURL.put(`/${recordId}`, recordData);
      setRecords(prev => prev.map(r => 
        r._id === recordId ? response.data.data : r
      ));
      setEditingRecord(null);
      toast.success('Medical record updated successfully!');
    } catch (error) {
      console.error('Error updating record:', error);
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Backend server is not running. Please start the backend server.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update medical record');
      }
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) {
      return;
    }

    try {
  await medicalRecordBaseURL.delete(`/${recordId}`);
      setRecords(prev => prev.filter(r => r._id !== recordId));
      toast.success('Medical record deleted successfully!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalRecords: prev.totalRecords - 1
      }));
    } catch (error) {
      console.error('Error deleting record:', error);
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Backend server is not running. Please start the backend server.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete medical record');
      }
    }
  };

  const handleFileUpload = (files) => {
    toast.success(`${files.length} file(s) uploaded successfully!`);
    // Refresh record data if needed
    fetchInitialData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center">
                <span className="text-xl">🐾</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">PetIQ.LK</h1>
                <p className="text-sm text-gray-600">Veterinarian Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-600">Veterinarian</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRecords}</p>
                <p className="text-gray-600 text-sm">Total Records</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.todayRecords}</p>
                <p className="text-gray-600 text-sm">Today's Visits</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.recordsWithPrescriptions}</p>
                <p className="text-gray-600 text-sm">With Prescriptions</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Pill className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{owners.length}</p>
                <p className="text-gray-600 text-sm">Registered Owners</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <User className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-2xl">
              <SearchBar
                onSearch={setSearchQuery}
                onFilterChange={setFilters}
                filters={filters}
                placeholder="Search by pet name, owner, symptoms, or diagnosis..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('New Record button clicked');
                  setShowForm(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>New Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* Records Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <div key={record._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{record.petName}</h3>
                    <p className="text-sm text-gray-600">{record.ownerName}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {record.petType}
                      </span>
                      {record.prescription && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                          Prescribed
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(record.visitDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  {record.symptoms && (
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Symptoms:</span>{' '}
                      <span className="text-gray-600">
                        {record.symptoms.length > 60 
                          ? `${record.symptoms.substring(0, 60)}...` 
                          : record.symptoms}
                      </span>
                    </p>
                  )}
                  {record.diagnosis && (
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Diagnosis:</span>{' '}
                      <span className="text-gray-600">
                        {record.diagnosis.length > 60 
                          ? `${record.diagnosis.substring(0, 60)}...` 
                          : record.diagnosis}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingRecord(record)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingRecord(record)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit Record"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <QuickDownloadButton record={record} size="small" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Medical Records Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filters.petType || filters.dateRange
                ? 'Try adjusting your search criteria or filters'
                : 'Create your first medical record to get started'}
            </p>
            {!searchQuery && !filters.petType && !filters.dateRange && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Create First Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showForm || editingRecord) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {console.log('Rendering form modal. showForm:', showForm, 'editingRecord:', editingRecord)}
            <MedicalRecordForm
              onSubmit={editingRecord ? handleEditRecord : handleCreateRecord}
              initial={editingRecord || {}}
              onCancel={() => {
                setShowForm(false);
                setEditingRecord(null);
              }}
              ownersList={owners}
            />
          </div>
        </div>
      )}

      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Medical Record Details</h3>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Pet Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {viewingRecord.petName}</p>
                      <p><span className="font-medium">Owner:</span> {viewingRecord.ownerName}</p>
                      <p><span className="font-medium">Type:</span> {viewingRecord.petType}</p>
                      {viewingRecord.breed && <p><span className="font-medium">Breed:</span> {viewingRecord.breed}</p>}
                      {viewingRecord.age && <p><span className="font-medium">Age:</span> {viewingRecord.age}</p>}
                      {viewingRecord.weight && <p><span className="font-medium">Weight:</span> {viewingRecord.weight}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Visit Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Date:</span> {new Date(viewingRecord.visitDate).toLocaleDateString()}</p>
                      <p><span className="font-medium">Veterinarian:</span> Dr. {viewingRecord.veterinarianName}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {viewingRecord.symptoms && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Symptoms</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingRecord.symptoms}</p>
                  </div>
                )}
                
                {viewingRecord.diagnosis && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Diagnosis</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingRecord.diagnosis}</p>
                  </div>
                )}
                
                {viewingRecord.treatment && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Treatment</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingRecord.treatment}</p>
                  </div>
                )}
                
                {viewingRecord.prescription && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Prescription</h4>
                    <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">{viewingRecord.prescription}</p>
                  </div>
                )}
                
                {viewingRecord.notes && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Additional Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingRecord.notes}</p>
                  </div>
                )}
              </div>

              {/* File Uploader for this record */}
              <div className="mb-6">
                <FileUploader 
                  recordId={viewingRecord._id}
                  onUploadComplete={handleFileUpload}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingRecord(viewingRecord)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Edit Record
                </button>
                <QuickDownloadButton record={viewingRecord} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetDashboard;