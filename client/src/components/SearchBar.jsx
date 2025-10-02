import React from 'react';

export default function SearchBar({ onSearch = () => {}, onFilterChange = () => {}, filters = {}, placeholder = 'Search...' }) {
  return (
    <div className="flex items-center gap-2">
      <input type="text" placeholder={placeholder} onChange={(e) => onSearch(e.target.value)} className="w-full border rounded px-2 py-1" />
      <select value={filters.petType || ''} onChange={(e) => onFilterChange(prev => ({ ...prev, petType: e.target.value }))} className="border rounded px-2 py-1">
        <option value="">All Types</option>
        <option>Dog</option>
        <option>Cat</option>
        <option>Bird</option>
        <option>Other</option>
      </select>
      <select value={filters.dateRange || ''} onChange={(e) => onFilterChange(prev => ({ ...prev, dateRange: e.target.value }))} className="border rounded px-2 py-1">
        <option value="">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="quarter">Last 3 Months</option>
        <option value="year">This Year</option>
      </select>
      <select value={filters.status || 'active'} onChange={(e) => onFilterChange(prev => ({ ...prev, status: e.target.value }))} className="border rounded px-2 py-1">
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  );
}
