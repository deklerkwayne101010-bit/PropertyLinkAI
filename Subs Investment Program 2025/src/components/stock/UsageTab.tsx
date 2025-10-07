import React, { useState, useMemo } from 'react';
import { Usage, FilterOptions } from '../../types/stock';
import { Plus, Search, Filter, Edit, Trash2, Activity, TrendingDown, Clock, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportUsageToExcel } from '../../utils/exportUtils';

interface UsageTabProps {
  usage: Usage[];
  onUpdate: (usage: Usage[]) => void;
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
}

const UsageTab: React.FC<UsageTabProps> = ({ usage, onUpdate, filters, onFilterChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUsage, setEditingUsage] = useState<Usage | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);

  // Filter usage based on current filters
  const filteredUsage = useMemo(() => {
    return usage.filter(item => {
      const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.usedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesLocation = !filters.location || item.location === filters.location;

      const usageDate = new Date(item.usageDate);
      const matchesDateFrom = !filters.dateFrom || usageDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || usageDate <= new Date(filters.dateTo);

      return matchesSearch && matchesCategory && matchesLocation && matchesDateFrom && matchesDateTo;
    });
  }, [usage, searchTerm, filters]);

  const categories = useMemo(() => {
    return Array.from(new Set(usage.map(item => item.category))).sort();
  }, [usage]);

  const locations = useMemo(() => {
    return Array.from(new Set(usage.map(item => item.location))).sort();
  }, [usage]);

  // Calculate summary statistics
  const totalUsage = filteredUsage.reduce((sum, item) => sum + item.quantityUsed, 0);
  const averageUsage = filteredUsage.length > 0 ? totalUsage / filteredUsage.length : 0;
  const mostUsedCategory = useMemo(() => {
    const categoryUsage = filteredUsage.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantityUsed;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryUsage).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  }, [filteredUsage]);

  const recentUsage = filteredUsage.filter(item => {
    const usageDate = new Date(item.usageDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return usageDate >= weekAgo;
  }).length;

  const handleAddUsage = (newUsage: Omit<Usage, 'id' | 'createdAt' | 'updatedAt'>) => {
    const usageItem: Usage = {
      ...newUsage,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onUpdate([...usage, usageItem]);
    setShowAddModal(false);
    toast.success('Usage record added successfully');
  };

  const handleEditUsage = (updatedUsage: Usage) => {
    const updatedUsageList = usage.map(item =>
      item.id === updatedUsage.id
        ? { ...updatedUsage, updatedAt: new Date().toISOString() }
        : item
    );
    onUpdate(updatedUsageList);
    setEditingUsage(null);
    toast.success('Usage record updated successfully');
  };

  const handleDeleteUsage = (id: string) => {
    if (confirm('Are you sure you want to delete this usage record?')) {
      onUpdate(usage.filter(item => item.id !== id));
      toast.success('Usage record deleted successfully');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ search: value });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Used</p>
              <p className="text-2xl font-bold text-orange-600">{totalUsage.toFixed(1)}</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Usage</p>
              <p className="text-2xl font-bold text-blue-600">{averageUsage.toFixed(1)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <p className="text-lg font-bold text-purple-600">{mostUsedCategory}</p>
            </div>
            <div className="text-2xl">🏆</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-green-600">{recentUsage}</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
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
              placeholder="Search usage records..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
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
            <span>Add Usage</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => onFilterChange({ category: e.target.value })}
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
                onChange={(e) => onFilterChange({ location: e.target.value })}
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
                onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  onFilterChange({ search: '', category: '', location: '', dateFrom: '', dateTo: '' });
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
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsage.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.quantityUsed} {item.unit}
                    </div>
                    {item.remainingQuantity && (
                      <div className="text-sm text-gray-500">
                        Remaining: {item.remainingQuantity}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.purpose}</div>
                    {item.notes && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.usageDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.usedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingUsage(item)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUsage(item.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

      {/* Add/Edit Modal would go here - simplified for now */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Usage Record</h3>
            <p className="text-gray-500">Modal implementation would go here...</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageTab;