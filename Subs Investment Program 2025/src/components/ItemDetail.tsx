import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { InventoryItem } from '../types/stock';
import { mockInventoryItems } from '../data/mockStockData';
import { ArrowLeft, Edit, Trash2, AlertTriangle, Calendar, MapPin, Package, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find the item by ID
    const foundItem = mockInventoryItems.find(item => item.id === id);
    if (foundItem) {
      setItem(foundItem);
    }
    setLoading(false);
  }, [id]);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      // In a real app, this would make an API call
      toast.success('Item deleted successfully');
      navigate('/stock-tracker/inventory');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading item details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <Link
          to="/stock-tracker/inventory"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Link>
          <h1 className="text-2xl font-bold text-gray-900">Item Not Found</h1>
          <p className="mt-1 text-sm text-gray-600">
            The requested item could not be found.
          </p>
        </div>
      </div>
    );
  }

  const isLowStock = item.quantity < 50;
  const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const totalValue = item.quantity * item.price;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <Link
          to="/stock-tracker/inventory"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
            <p className="mt-1 text-sm text-gray-600">Inventory ID: {item.id}</p>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/stock-tracker/inventory/${item.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Item
            </button>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {(isLowStock || isExpiringSoon) && (
        <div className="space-y-2">
          {isLowStock && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
                <p className="text-sm text-yellow-700">
                  This item has only {item.quantity} {item.unit} remaining. Consider restocking soon.
                </p>
              </div>
            </div>
          )}
          {isExpiringSoon && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="text-sm font-medium text-orange-800">Expiration Alert</h3>
                <p className="text-sm text-orange-700">
                  This item expires on {new Date(item.expiryDate!).toLocaleDateString()}. Use soon to avoid waste.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Current Stock</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {item.quantity} {item.unit}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Unit Price</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                R{item.price.toFixed(2)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                R{totalValue.toFixed(2)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Location</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {item.location.split(' - ')[0]}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Item Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Item Name</dt>
              <dd className="text-sm text-gray-900 mt-1">{item.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900 mt-1">{item.category}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Supplier</dt>
              <dd className="text-sm text-gray-900 mt-1">{item.supplier}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="text-sm text-gray-900 mt-1">{item.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Unit of Measure</dt>
              <dd className="text-sm text-gray-900 mt-1">{item.unit}</dd>
            </div>
          </dl>
        </div>

        {/* Additional Details */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h2>
          <dl className="space-y-3">
            {item.expiryDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(item.expiryDate).toLocaleDateString()}
                  {isExpiringSoon && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Expiring Soon
                    </span>
                  )}
                </dd>
              </div>
            )}
            {item.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 mt-1">{item.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Date Added</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {new Date(item.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {new Date(item.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stock Status</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {isLowStock ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Low Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    In Stock
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>Activity tracking would show recent purchases, usage, and updates for this item.</p>
          <p className="text-sm">This feature would be implemented with a full backend system.</p>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;