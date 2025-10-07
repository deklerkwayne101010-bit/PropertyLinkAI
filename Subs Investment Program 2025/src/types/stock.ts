// Stock Tracker Type Definitions

export interface InventoryItem {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  supplier: string;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Usage {
  id: string;
  itemName: string;
  category: string;
  quantityUsed: number;
  unit: string;
  purpose: string;
  location: string;
  usedBy: string;
  usageDate: string;
  remainingQuantity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  recentPurchases: number;
  recentUsage: number;
}

export interface CategorySummary {
  category: string;
  itemCount: number;
  totalValue: number;
  usageRate: number;
}

export type TabType = 'inventory' | 'purchases' | 'usage';

export interface FilterOptions {
  search: string;
  category: string;
  dateFrom?: string;
  dateTo?: string;
  supplier?: string;
  location?: string;
}