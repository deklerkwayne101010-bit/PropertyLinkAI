import React from 'react';
import { StockSummary } from '../../types/stock';

interface StockSummaryCardsProps {
  summary: StockSummary;
}

const StockSummaryCards: React.FC<StockSummaryCardsProps> = ({ summary }) => {
  const cards = [
    {
      title: 'Total Items',
      value: summary.totalItems,
      icon: '📦',
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Value',
      value: `R${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Low Stock Items',
      value: summary.lowStockItems,
      icon: '⚠️',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Recent Purchases',
      value: summary.recentPurchases,
      icon: '🛒',
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Recent Usage',
      value: summary.recentUsage,
      icon: '📊',
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div key={index} className={`${card.bgColor} rounded-lg p-4 border border-gray-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
            <div className={`text-2xl ${card.textColor}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockSummaryCards;