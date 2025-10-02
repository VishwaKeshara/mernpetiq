import React, { useState } from 'react';

export default function MedicalRecordForm({ onSubmit, initial = {} }) {
  const [form, setForm] = useState({
    ownerEmail: initial.ownerEmail || '',
    petName: initial.petName || '',
    petType: initial.petType || 'Dog',
    visitDate: initial.visitDate ? new Date(initial.visitDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    symptoms: initial.symptoms || '',
    diagnosis: initial.diagnosis || '',
    prescription: initial.prescription || ''
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium">Owner Email</label>
        <input name="ownerEmail" value={form.ownerEmail} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">Pet Name</label>
        <input name="petName" value={form.petName} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">Pet Type</label>
          <select name="petType" value={form.petType} onChange={handleChange} className="w-full border rounded px-2 py-1">
            <option>Dog</option>
            <option>Cat</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Visit Date</label>
          <input type="date" name="visitDate" value={form.visitDate} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Symptoms</label>
        <textarea name="symptoms" value={form.symptoms} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">Diagnosis</label>
        <textarea name="diagnosis" value={form.diagnosis} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">Prescription</label>
        <input name="prescription" value={form.prescription} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div className="text-right">
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
      </div>
    </form>
  );
}
