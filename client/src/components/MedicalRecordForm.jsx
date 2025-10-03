import React, { useState } from 'react';

export default function MedicalRecordForm({ onSubmit, initial = {}, onCancel, ownersList = [] }) {
  const [form, setForm] = useState({
    _id: initial._id || null,
    ownerEmail: initial.ownerEmail || '',
    ownerName: initial.ownerName || '',
    petName: initial.petName || '',
    petType: initial.petType || 'Dog',
    breed: initial.breed || '',
    age: initial.age || '',
    visitDate: initial.visitDate ? new Date(initial.visitDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    symptoms: initial.symptoms || '',
    diagnosis: initial.diagnosis || '',
    prescription: initial.prescription || '',
    notes: initial.notes || ''
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          {initial && initial._id ? 'Edit Medical Record' : 'New Medical Record'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
            <input 
              name="ownerEmail" 
              type="email"
              value={form.ownerEmail} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
            <input 
              name="ownerName" 
              value={form.ownerName} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
            <input 
              name="petName" 
              value={form.petName} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pet Type</label>
            <select 
              name="petType" 
              value={form.petType} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Fish">Fish</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date</label>
            <input 
              type="date" 
              name="visitDate" 
              value={form.visitDate} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
            <input 
              name="breed" 
              value={form.breed} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input 
              name="age" 
              value={form.age} 
              onChange={handleChange} 
              placeholder="e.g., 2 years, 6 months"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
          <textarea 
            name="symptoms" 
            value={form.symptoms} 
            onChange={handleChange} 
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
            placeholder="Describe the symptoms..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
          <textarea 
            name="diagnosis" 
            value={form.diagnosis} 
            onChange={handleChange} 
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
            placeholder="Enter diagnosis..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prescription</label>
          <textarea 
            name="prescription" 
            value={form.prescription} 
            onChange={handleChange} 
            rows="2"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
            placeholder="Enter medication and dosage..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
          <textarea 
            name="notes" 
            value={form.notes} 
            onChange={handleChange} 
            rows="2"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            {initial && initial._id ? 'Update Record' : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
