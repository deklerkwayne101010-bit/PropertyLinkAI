import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InventoryItem, Purchase, Usage, StockSummary } from '../types/stock';
import { mockInventoryItems, mockPurchases, mockUsage } from '../data/mockStockData';
import StockSummaryCards from './stock/StockSummaryCards';

const StockTracker: React.FC = () => {
  const inventoryItems = mockInventoryItems;
  const purchases = mockPurchases;
  const usage = mockUsage;

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

  const sections = [
    {
      name: 'Materials',
      href: '/stock-tracker/inventory',
      icon: '📦',
      description: 'Manage and track your construction materials',
      count: inventoryItems.length,
      color: 'blue'
    },
    {
      name: 'Purchases',
      href: '/stock-tracker/purchases',
      icon: '🛒',
      description: 'Record and track material purchases',
      count: purchases.length,
      color: 'green'
    },
    {
      name: 'Usage',
      href: '/stock-tracker/usage',
      icon: '📊',
      description: 'Monitor and analyze material usage',
      count: usage.length,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Materials Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your construction materials management system
        </p>
      </div>

      {/* Summary Cards */}
      <StockSummaryCards summary={summary} />

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link
            key={section.name}
            to={section.href}
            className={`block p-6 rounded-lg border border-gray-200 hover:border-${section.color}-300 hover:shadow-md transition-all duration-200 bg-white`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${section.color}-100 rounded-lg flex items-center justify-center`}>
                <span className="text-2xl">{section.icon}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${section.color}-100 text-${section.color}-800`}>
                {section.count}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{section.name}</h3>
            <p className="text-sm text-gray-600">{section.description}</p>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span>View details</span>
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inventoryItems.length}</div>
            <div className="text-sm text-gray-600">Total Materials</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{purchases.length}</div>
            <div className="text-sm text-gray-600">Recent Purchases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{usage.length}</div>
            <div className="text-sm text-gray-600">Usage Records</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTracker;