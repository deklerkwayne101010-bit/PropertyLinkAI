import React, { useState, useMemo } from 'react';
import { Purchase, FilterOptions } from '../types/stock';
import { mockPurchases } from '../data/mockStockData';
import { Plus, Search, Filter, Download, FileText, Calendar, DollarSign, Package } from 'lucide-react';
import { exportPurchasesToExcel } from '../utils/exportUtils';
import AddPurchaseModal from './AddPurchaseModal';

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
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

  // Filter purchases based on current filters
  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const matchesSearch = purchase.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filters.category || purchase.category === filters.category;
      const matchesSupplier = !filters.supplier || purchase.supplier === filters.supplier;

      const matchesDateFrom = !filters.dateFrom || new Date(purchase.purchaseDate) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(purchase.purchaseDate) <= new Date(filters.dateTo);

      return matchesSearch && matchesCategory && matchesSupplier && matchesDateFrom && matchesDateTo;
    });
  }, [purchases, searchTerm, filters]);

  const categories = useMemo(() => {
    return Array.from(new Set(purchases.map(purchase => purchase.category))).sort();
  }, [purchases]);

  const suppliers = useMemo(() => {
    return Array.from(new Set(purchases.map(purchase => purchase.supplier))).sort();
  }, [purchases]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleAddPurchase = (purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `PUR-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPurchases(prev => [newPurchase, ...prev]);
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalPurchases = filteredPurchases.length;
    const totalValue = filteredPurchases.reduce((sum, purchase) => sum + (typeof purchase.totalCost === 'number' ? purchase.totalCost : 0), 0);
    const totalItems = filteredPurchases.reduce((sum, purchase) => sum + (typeof purchase.quantity === 'number' ? purchase.quantity : 0), 0);
    const avgCostPerItem = totalItems > 0 ? totalValue / totalItems : 0;

    return {
      totalPurchases,
      totalValue,
      totalItems,
      avgCostPerItem
    };
  }, [filteredPurchases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track and manage all purchase transactions and supplier information
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
              <p className="text-sm font-medium text-gray-500">Total Purchases</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalPurchases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">R{summary.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Cost/Item</p>
              <p className="text-2xl font-semibold text-gray-900">R{summary.avgCostPerItem.toFixed(2)}</p>
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
              placeholder="Search by item name, supplier, or invoice..."
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
            onClick={() => exportPurchasesToExcel(filteredPurchases)}
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
            <span>Add Purchase</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => handleFilterChange({ supplier: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
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

      {/* Purchases Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity & Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{purchase.itemName}</div>
                      <div className="text-sm text-gray-500">{purchase.category}</div>
                      <div className="text-sm text-gray-500 font-mono">ID: {purchase.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.quantity} {purchase.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R{typeof purchase.unitPrice === 'number' ? purchase.unitPrice.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R{typeof purchase.totalCost === 'number' ? purchase.totalCost.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.invoiceNumber || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No purchases found matching your criteria.
          </div>
        )}
      </div>

      {/* Notes Section */}
      {filteredPurchases.some(purchase => purchase.notes) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Purchase Notes</h2>
          <div className="space-y-3">
            {filteredPurchases
              .filter(purchase => purchase.notes)
              .map(purchase => (
                <div key={purchase.id} className="border-l-4 border-blue-400 bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-900">
                      {purchase.itemName} - {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-blue-700">
                      Invoice: {purchase.invoiceNumber}
                    </div>
                  </div>
                  <p className="text-sm text-blue-800 mt-1">{purchase.notes}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      <AddPurchaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPurchase={handleAddPurchase}
      />
    </div>
  );
};

export default Purchases;