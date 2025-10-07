import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StockTracker from './components/StockTracker';
import Inventory from './components/Inventory';
import ItemDetail from './components/ItemDetail';
import ItemEdit from './components/ItemEdit';
import Purchases from './components/Purchases';
import Usage from './components/Usage';
import Settings from './components/Settings';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock-tracker" element={<StockTracker />} />
          <Route path="/stock-tracker/inventory" element={<Inventory />} />
          <Route path="/stock-tracker/inventory/:id" element={<ItemDetail />} />
          <Route path="/stock-tracker/inventory/:id/edit" element={<ItemEdit />} />
          <Route path="/stock-tracker/inventory/add" element={<ItemEdit />} />
          <Route path="/stock-tracker/purchases" element={<Purchases />} />
          <Route path="/stock-tracker/usage" element={<Usage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
};

export default App;