import React from 'react';

const Transactions: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h2>
          <p className="text-gray-600">Your transaction history will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default Transactions;