import React from 'react';

export default function PdfDownloader({ records = [] }) {
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical_records.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 text-white rounded">Download Records</button>
    </div>
  );
}

export function QuickDownloadButton({ records = [] }) {
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical_records.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleDownload} className="px-3 py-1 bg-yellow-500 text-white rounded">Quick Download</button>
  );
}
