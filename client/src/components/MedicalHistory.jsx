import React from 'react';

export default function MedicalHistory({ records = [] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Medical History</h2>
      {records.length === 0 ? (
        <p className="text-gray-500">No records available.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li key={r._id} className="border rounded p-2">
              <div className="flex justify-between">
                <strong>{r.petName}</strong>
                <span className="text-sm text-gray-500">{new Date(r.visitDate).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600">{r.diagnosis || r.symptoms}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
