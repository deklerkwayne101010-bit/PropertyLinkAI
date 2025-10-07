import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InventoryItem, Purchase, Usage, StockSummary, CategorySummary } from '../types/stock';
import { mockInventoryItems, mockPurchases, mockUsage, mockCategorySummaries } from '../data/mockStockData';
import StockSummaryCards from './stock/StockSummaryCards';
import StockCharts from './stock/StockCharts';

const Dashboard: React.FC = () => {
  const [inventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [purchases] = useState<Purchase[]>(mockPurchases);
  const [usage] = useState<Usage[]>(mockUsage);

  // Calculate summary statistics
  const summary: StockSummary = useMemo(() => {
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lowStockItems = inventoryItems.filter(item => item.quantity < item.lowStockThreshold).length;

    return {
      totalItems: inventoryItems.length,
      totalValue,
      lowStockItems,
      recentPurchases: purchases.length,
      recentUsage: usage.length
    };
  }, [inventoryItems, purchases, usage]);

  // Get recent activity
  const recentActivity = useMemo(() => {
    const recentPurchases = purchases.slice(0, 3);
    const recentUsage = usage.slice(0, 3);
    return { purchases: recentPurchases, usage: recentUsage };
  }, [purchases, usage]);

  // Get low stock alerts
  const lowStockAlerts = useMemo(() => {
    return inventoryItems.filter(item => item.quantity < item.lowStockThreshold).slice(0, 5);
  }, [inventoryItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Materials Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Summary Cards */}
      <StockSummaryCards summary={summary} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/stock-tracker/inventory"
          className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border border-blue-200 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📦</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">Manage Materials</h3>
              <p className="text-xs text-blue-700">View and edit materials</p>
            </div>
          </div>
        </Link>

        <Link
          to="/stock-tracker/purchases"
          className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border border-green-200 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🛒</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-900">Track Purchases</h3>
              <p className="text-xs text-green-700">Record material purchases</p>
            </div>
          </div>
        </Link>

        <Link
          to="/stock-tracker/usage"
          className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border border-purple-200 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-900">Track Usage</h3>
              <p className="text-xs text-purple-700">Monitor material usage</p>
            </div>
          </div>
        </Link>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-900">Alerts</h3>
              <p className="text-xs text-orange-700">{lowStockAlerts.length} low stock items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <StockCharts
        inventoryItems={inventoryItems}
        purchases={purchases}
        usage={usage}
        categorySummaries={mockCategorySummaries}
      />

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.purchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">🛒</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{purchase.itemName}</p>
                    <p className="text-xs text-gray-500">{purchase.purchaseDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">R{typeof purchase.totalCost === 'number' ? purchase.totalCost.toFixed(2) : '0.00'}</p>
                  <p className="text-xs text-gray-500">{purchase.quantity} {purchase.unit}</p>
                </div>
              </div>
            ))}
            {recentActivity.usage.map((usageItem) => (
              <div key={usageItem.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📊</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{usageItem.itemName}</p>
                    <p className="text-xs text-gray-500">{usageItem.usageDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{usageItem.quantityUsed} {usageItem.unit}</p>
                  <p className="text-xs text-gray-500">{usageItem.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Low Stock Alerts</h2>
          {lowStockAlerts.length > 0 ? (
            <div className="space-y-3">
              {lowStockAlerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-gray-500">Low stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>All items are well stocked</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;