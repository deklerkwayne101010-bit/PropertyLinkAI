import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { InventoryItem, FilterOptions } from '../types/stock';
import { mockInventoryItems } from '../data/mockStockData';
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertTriangle, Download, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportInventoryToExcel } from '../utils/exportUtils';

interface AddItemFormData {
  inventoryId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  supplier: string;
  location: string;
  description?: string;
  expiryDate?: string;
  lowStockThreshold: number;
}

const Inventory: React.FC = () => {
   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
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

  // Filter items based on current filters
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesSupplier = !filters.supplier || item.supplier === filters.supplier;
      const matchesLocation = !filters.location || item.location === filters.location;

      const matchesDateFrom = !filters.dateFrom || new Date(item.createdAt) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(item.createdAt) <= new Date(filters.dateTo);

      return matchesSearch && matchesCategory && matchesSupplier && matchesLocation && matchesDateFrom && matchesDateTo;
    });
  }, [inventoryItems, searchTerm, filters]);

  const categories = useMemo(() => {
    return Array.from(new Set(inventoryItems.map(item => item.category))).sort();
  }, [inventoryItems]);

  const suppliers = useMemo(() => {
    return Array.from(new Set(inventoryItems.map(item => item.supplier))).sort();
  }, [inventoryItems]);

  const locations = useMemo(() => {
    return Array.from(new Set(inventoryItems.map(item => item.location))).sort();
  }, [inventoryItems]);

  const lowStockItems = filteredItems.filter(item => item.quantity < item.lowStockThreshold);
  const expiringSoonItems = filteredItems.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return expiryDate <= weekFromNow;
  });

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setInventoryItems(items => items.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleAddItem = (data: AddItemFormData) => {
    const newItem: InventoryItem = {
      id: data.inventoryId,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      price: data.price,
      supplier: data.supplier,
      location: data.location,
      description: data.description,
      expiryDate: data.expiryDate,
      lowStockThreshold: data.lowStockThreshold,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInventoryItems(prev => [...prev, newItem]);
    setShowAddModal(false);
    toast.success('Item added successfully!');
  };

  // Add Item Modal Component
  const AddItemModal: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<AddItemFormData>();

    const onSubmit = (data: AddItemFormData) => {
      handleAddItem(data);
      reset();
    };

    const handleClose = () => {
      setShowAddModal(false);
      reset();
    };

    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose}></div>

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Inventory Item</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Inventory ID - Full Width at Top */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inventory ID *
                </label>
                <input
                  {...register('inventoryId', {
                    required: 'Inventory ID is required',
                    validate: (value) => {
                      const existingIds = inventoryItems.map(item => item.id.toLowerCase());
                      return !existingIds.includes(value.toLowerCase()) || 'This inventory ID already exists';
                    }
                  })}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., INV-001, PART-123"
                />
                {errors.inventoryId && <p className="mt-1 text-sm text-red-600">{errors.inventoryId.message}</p>}
                <p className="mt-1 text-xs text-gray-500">Enter a unique identifier for this inventory item</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    {...register('name', { required: 'Item name is required' })}
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter item name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price (R) *
                  </label>
                  <input
                    {...register('price', {
                      required: 'Unit price is required',
                      min: { value: 0.01, message: 'Price must be greater than 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
                </div>

                {/* Quantity in Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity in Stock *
                  </label>
                  <input
                    {...register('quantity', {
                      required: 'Quantity is required',
                      min: { value: 0, message: 'Quantity cannot be negative' }
                    })}
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <input
                    {...register('unit', { required: 'Unit is required' })}
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., kg, pieces, liters"
                  />
                  {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier *
                  </label>
                  <select
                    {...register('supplier', { required: 'Supplier is required' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                  {errors.supplier && <p className="mt-1 text-sm text-red-600">{errors.supplier.message}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <select
                    {...register('location', { required: 'Location is required' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select location</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold *
                  </label>
                  <input
                    {...register('lowStockThreshold', {
                      required: 'Low stock threshold is required',
                      min: { value: 0, message: 'Threshold must be 0 or greater' }
                    })}
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 50"
                  />
                  {errors.lowStockThreshold && <p className="mt-1 text-sm text-red-600">{errors.lowStockThreshold.message}</p>}
                  <p className="mt-1 text-xs text-gray-500">Alert when stock falls below this level</p>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    {...register('expiryDate')}
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item description (optional)"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your inventory items, track quantities, and monitor stock levels
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by ID, name, category, or supplier..."
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
            onClick={() => exportInventoryToExcel(filteredItems)}
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
            <span>Add Item</span>
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

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringSoonItems.length > 0) && (
        <div className="space-y-2">
          {lowStockItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">
                {lowStockItems.length} items are running low on stock
              </span>
            </div>
          )}
          {expiringSoonItems.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-orange-800">
                {expiringSoonItems.length} items are expiring soon
              </span>
            </div>
          )}
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventory ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity in Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R{item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </div>
                    {item.quantity < item.lowStockThreshold && (
                      <div className="text-xs text-yellow-600 font-medium">Low Stock</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Expiring Soon
                        </span>
                      )}
                      {item.quantity < item.lowStockThreshold && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                      )}
                      {item.quantity >= item.lowStockThreshold && (!item.expiryDate || new Date(item.expiryDate) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Good
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/stock-tracker/inventory/${item.id}`}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/stock-tracker/inventory/${item.id}/edit`}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Edit Item"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Item"
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
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items found matching your criteria.
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{filteredItems.length}</div>
            <div className="text-sm text-gray-500">Items Displayed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              R{filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Value</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
            <div className="text-sm text-gray-500">Low Stock Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{expiringSoonItems.length}</div>
            <div className="text-sm text-gray-500">Expiring Soon</div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && <AddItemModal />}
    </div>
  );
};

export default Inventory;