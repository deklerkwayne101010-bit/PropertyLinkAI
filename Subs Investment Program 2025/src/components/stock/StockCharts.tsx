import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { InventoryItem, Purchase, Usage, CategorySummary } from '../../types/stock';

interface StockChartsProps {
  inventoryItems: InventoryItem[];
  purchases: Purchase[];
  usage: Usage[];
  categorySummaries: CategorySummary[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const StockCharts: React.FC<StockChartsProps> = ({
  inventoryItems,
  purchases,
  usage,
  categorySummaries
}) => {
  // Prepare data for inventory value by category chart
  const inventoryByCategory = categorySummaries.map(summary => ({
    category: summary.category,
    value: summary.totalValue,
    items: summary.itemCount
  }));

  // Prepare data for monthly purchases trend
  const monthlyPurchases = purchases.reduce((acc, purchase) => {
    const month = new Date(purchase.purchaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + (typeof purchase.totalCost === 'number' ? purchase.totalCost : 0);
    return acc;
  }, {} as Record<string, number>);

  const purchasesTrend = Object.entries(monthlyPurchases)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([month, total]) => ({ month, total }));

  // Prepare data for usage by category
  const usageByCategory = categorySummaries.map(summary => ({
    category: summary.category,
    usage: summary.usageRate * 100, // Convert to percentage
    items: summary.itemCount
  }));

  // Prepare data for inventory levels (current vs low stock threshold)
  const inventoryLevels = inventoryItems.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    current: item.quantity,
    threshold: item.lowStockThreshold,
    category: item.category
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inventory Value by Category */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Value by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={inventoryByCategory}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {inventoryByCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`R${Number(value).toFixed(2)}`, 'Value']} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Purchase Trend */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Purchase Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={purchasesTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value: any) => `R${value}`} />
            <Tooltip formatter={(value) => [`R${Number(value).toFixed(2)}`, 'Total Spent']} />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8884d8"
              strokeWidth={2}
              name="Purchase Amount"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Usage Rate by Category */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Rate by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={usageByCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis tickFormatter={(value: any) => `${value}%`} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Usage Rate']} />
            <Legend />
            <Bar dataKey="usage" fill="#82ca9d" name="Usage Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Levels */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Levels</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={inventoryLevels} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" fill="#0088FE" name="Current Stock" />
            <Bar dataKey="threshold" fill="#FF8042" name="Low Stock Threshold" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stock Summary Cards */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 lg:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inventoryItems.length}</div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              R{inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {inventoryItems.filter(item => item.quantity < item.lowStockThreshold).length}
            </div>
            <div className="text-sm text-gray-500">Low Stock Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              R{purchases.reduce((sum, purchase) => sum + (typeof purchase.totalCost === 'number' ? purchase.totalCost : 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Purchases</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCharts;