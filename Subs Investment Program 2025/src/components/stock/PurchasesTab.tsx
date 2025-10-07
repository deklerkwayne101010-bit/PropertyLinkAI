import React, { useState, useMemo } from 'react';
import { Purchase, FilterOptions } from '../../types/stock';
import { Plus, Search, Filter, Edit, Trash2, Receipt, TrendingUp, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportPurchasesToExcel } from '../../utils/exportUtils';

interface PurchasesTabProps {
  purchases: Purchase[];
  onUpdate: (purchases: Purchase[]) => void;
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
}

const PurchasesTab: React.FC<PurchasesTabProps> = ({ purchases, onUpdate, filters, onFilterChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);

  // Filter purchases based on current filters
  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const matchesSearch = purchase.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !filters.category || purchase.category === filters.category;
      const matchesSupplier = !filters.supplier || purchase.supplier === filters.supplier;

      const purchaseDate = new Date(purchase.purchaseDate);
      const matchesDateFrom = !filters.dateFrom || purchaseDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || purchaseDate <= new Date(filters.dateTo);

      return matchesSearch && matchesCategory && matchesSupplier && matchesDateFrom && matchesDateTo;
    });
  }, [purchases, searchTerm, filters]);

  const suppliers = useMemo(() => {
    return Array.from(new Set(purchases.map(purchase => purchase.supplier))).sort();
  }, [purchases]);

  const categories = useMemo(() => {
    return Array.from(new Set(purchases.map(purchase => purchase.category))).sort();
  }, [purchases]);

  // Calculate summary statistics
  const totalSpent = filteredPurchases.reduce((sum, purchase) => sum + (typeof purchase.totalCost === 'number' ? purchase.totalCost : 0), 0);
  const averageOrderValue = filteredPurchases.length > 0 ? totalSpent / filteredPurchases.length : 0;
  const topSupplier = useMemo(() => {
    const supplierTotals = filteredPurchases.reduce((acc, purchase) => {
      acc[purchase.supplier] = (acc[purchase.supplier] || 0) + (typeof purchase.totalCost === 'number' ? purchase.totalCost : 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(supplierTotals).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  }, [filteredPurchases]);

  const handleAddPurchase = (newPurchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => {
    const purchase: Purchase = {
      ...newPurchase,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onUpdate([...purchases, purchase]);
    setShowAddModal(false);
    toast.success('Purchase added successfully');
  };

  const handleEditPurchase = (updatedPurchase: Purchase) => {
    const updatedPurchases = purchases.map(purchase =>
      purchase.id === updatedPurchase.id
        ? { ...updatedPurchase, updatedAt: new Date().toISOString() }
        : purchase
    );
    onUpdate(updatedPurchases);
    setEditingPurchase(null);
    toast.success('Purchase updated successfully');
  };

  const handleDeletePurchase = (id: string) => {
    if (confirm('Are you sure you want to delete this purchase record?')) {
      onUpdate(purchases.filter(purchase => purchase.id !== id));
      toast.success('Purchase deleted successfully');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ search: value });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">R{totalSpent.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order</p>
              <p className="text-2xl font-bold text-blue-600">R{averageOrderValue.toFixed(2)}</p>
            </div>
            <Receipt className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Supplier</p>
              <p className="text-lg font-bold text-purple-600">{topSupplier}</p>
            </div>
            <div className="text-2xl">🏆</div>
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
              placeholder="Search purchases..."
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => onFilterChange({ supplier: e.target.value })}
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
                onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  onFilterChange({ search: '', category: '', supplier: '', dateFrom: '', dateTo: '' });
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
                  Quantity & Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                      {purchase.invoiceNumber && (
                        <div className="text-sm text-gray-500">Invoice: {purchase.invoiceNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {purchase.quantity} {purchase.unit}
                    </div>
                    <div className="text-sm text-gray-500">
                      R{typeof purchase.unitPrice === 'number' ? purchase.unitPrice.toFixed(2) : '0.00'} each
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      R{typeof purchase.totalCost === 'number' ? purchase.totalCost.toFixed(2) : '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingPurchase(purchase)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePurchase(purchase.id)}
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
        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No purchases found matching your criteria.
          </div>
        )}
      </div>

      {/* Add/Edit Modal would go here - simplified for now */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Purchase</h3>
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

export default PurchasesTab;