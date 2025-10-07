import React from 'react';

const Watchlist: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Watchlist</h1>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👁️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Watchlist Items</h2>
          <p className="text-gray-600">Add stocks to your watchlist to track their performance</p>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;