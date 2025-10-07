import React, { useState, useMemo } from 'react';
import { Usage as UsageType, FilterOptions } from '../types/stock';
import { mockUsage } from '../data/mockStockData';
import { Plus, Search, Filter, Download, FileText, Calendar, Package, User } from 'lucide-react';
import { exportUsageToExcel } from '../utils/exportUtils';
import AddUsageModal from './AddUsageModal';

const Usage: React.FC = () => {
  const [usage, setUsage] = useState<UsageType[]>(mockUsage);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    supplier: '',
    location: ''
  });

  // Filter usage based on current filters
  const filteredUsage = useMemo(() => {
    return usage.filter(usageItem => {
      const matchesSearch = usageItem.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           usageItem.usedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           usageItem.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           usageItem.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           usageItem.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filters.category || usageItem.category === filters.category;
      const matchesLocation = !filters.location || usageItem.location === filters.location;

      const matchesDateFrom = !filters.dateFrom || new Date(usageItem.usageDate) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(usageItem.usageDate) <= new Date(filters.dateTo);

      return matchesSearch && matchesCategory && matchesLocation && matchesDateFrom && matchesDateTo;
    });
  }, [usage, searchTerm, filters]);

  const categories = useMemo(() => {
    return Array.from(new Set(usage.map(usageItem => usageItem.category))).sort();
  }, [usage]);

  const locations = useMemo(() => {
    return Array.from(new Set(usage.map(usageItem => usageItem.location))).sort();
  }, [usage]);

  const users = useMemo(() => {
    return Array.from(new Set(usage.map(usageItem => usageItem.usedBy))).sort();
  }, [usage]);

  const purposes = useMemo(() => {
    return Array.from(new Set(usage.map(usageItem => usageItem.purpose))).sort();
  }, [usage]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleAddUsage = (usageData: Omit<UsageType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUsage: UsageType = {
      ...usageData,
      id: `USE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setUsage(prev => [newUsage, ...prev]);
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalUsage = filteredUsage.length;
    const totalItemsUsed = filteredUsage.reduce((sum, usageItem) => sum + usageItem.quantityUsed, 0);
    const uniqueUsers = new Set(filteredUsage.map(usageItem => usageItem.usedBy)).size;
    const uniqueLocations = new Set(filteredUsage.map(usageItem => usageItem.location)).size;

    return {
      totalUsage,
      totalItemsUsed,
      uniqueUsers,
      uniqueLocations
    };
  }, [filteredUsage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Usage Tracking</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor item consumption, track usage patterns, and manage inventory depletion
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Usage Records</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalUsage}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Items Used</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalItemsUsed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.uniqueUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Usage Locations</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.uniqueLocations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by item name, user, purpose, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportUsageToExcel(filteredUsage)}
            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
            title="Export to Excel"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Record Usage</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange({ location: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    search: '',
                    category: '',
                    dateFrom: '',
                    dateTo: '',
                    supplier: '',
                    location: ''
                  });
                }}
                className="w-full bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsage.map((usageItem) => (
                <tr key={usageItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{usageItem.itemName}</div>
                      <div className="text-sm text-gray-500">{usageItem.category}</div>
                      <div className="text-sm text-gray-500 font-mono">ID: {usageItem.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usageItem.quantityUsed} {usageItem.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usageItem.purpose}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usageItem.usedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usageItem.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(usageItem.usageDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usageItem.remainingQuantity !== undefined ? `${usageItem.remainingQuantity} ${usageItem.unit}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsage.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No usage records found matching your criteria.
          </div>
        )}
      </div>

      {/* Notes Section */}
      {filteredUsage.some(usageItem => usageItem.notes) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Usage Notes</h2>
          <div className="space-y-3">
            {filteredUsage
              .filter(usageItem => usageItem.notes)
              .map(usageItem => (
                <div key={usageItem.id} className="border-l-4 border-green-400 bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-green-900">
                      {usageItem.itemName} - {usageItem.purpose}
                    </div>
                    <div className="text-sm text-green-700">
                      {new Date(usageItem.usageDate).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-green-800 mt-1">{usageItem.notes}</p>
                  <div className="text-xs text-green-600 mt-2">
                    Used by: {usageItem.usedBy} | Location: {usageItem.location}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Usage by Purpose Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Usage by Purpose</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purposes.map(purpose => {
            const purposeUsage = filteredUsage.filter(item => item.purpose === purpose);
            const totalQuantity = purposeUsage.reduce((sum, item) => sum + item.quantityUsed, 0);
            return (
              <div key={purpose} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">{purpose}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalQuantity}</p>
                <p className="text-sm text-gray-500">{purposeUsage.length} records</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Usage Modal */}
      <AddUsageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddUsage={handleAddUsage}
      />
    </div>
  );
};

export default Usage;