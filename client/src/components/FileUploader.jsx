import React from 'react';

export default function FileUploader({ onUpload = () => {} }) {
  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    onUpload(files);
  };

  return (
    <label className="inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded cursor-pointer">
      <input type="file" multiple onChange={handleChange} className="hidden" />
      Upload
    </label>
  );
}
