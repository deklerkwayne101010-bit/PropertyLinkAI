import { InventoryItem, Purchase, Usage, StockSummary, CategorySummary } from '../types/stock';

// Mock Inventory Data
export const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Portland Cement',
    category: 'Cement & Concrete',
    quantity: 150,
    unit: 'bags',
    price: 12.50,
    supplier: 'BuildCorp Materials',
    location: 'Main Warehouse - Section A',
    description: 'High-quality Portland cement for construction',
    lowStockThreshold: 100,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Steel Rebar',
    category: 'Steel & Metal',
    quantity: 200,
    unit: 'tons',
    price: 850.00,
    supplier: 'SteelWorks Ltd',
    location: 'Steel Yard - Section B',
    description: 'Grade 60 steel reinforcement bars',
    lowStockThreshold: 50,
    createdAt: '2025-01-10T14:20:00Z',
    updatedAt: '2025-01-10T14:20:00Z'
  },
  {
    id: '3',
    name: 'Clay Bricks',
    category: 'Building Materials',
    quantity: 5000,
    unit: 'pieces',
    price: 0.45,
    supplier: 'BrickMaster Supplies',
    location: 'Brick Storage - Section C',
    description: 'Standard clay bricks for construction',
    lowStockThreshold: 2000,
    createdAt: '2025-01-12T09:15:00Z',
    updatedAt: '2025-01-12T09:15:00Z'
  },
  {
    id: '4',
    name: 'PVC Pipes',
    category: 'Plumbing',
    quantity: 300,
    unit: 'meters',
    price: 8.50,
    supplier: 'PipeTech Solutions',
    location: 'Plumbing Warehouse',
    description: '4-inch diameter PVC drainage pipes',
    lowStockThreshold: 150,
    createdAt: '2025-01-08T16:45:00Z',
    updatedAt: '2025-01-08T16:45:00Z'
  },
  {
    id: '5',
    name: 'Electrical Wire',
    category: 'Electrical',
    quantity: 500,
    unit: 'rolls',
    price: 45.00,
    supplier: 'ElectroSupply Co',
    location: 'Electrical Storage',
    description: '14-gauge copper electrical wire',
    lowStockThreshold: 100,
    createdAt: '2025-01-14T11:00:00Z',
    updatedAt: '2025-01-14T11:00:00Z'
  },
  {
    id: '6',
    name: 'Timber Lumber',
    category: 'Building Materials',
    quantity: 200,
    unit: 'boards',
    price: 25.00,
    supplier: 'WoodWorks Timber',
    location: 'Lumber Yard',
    description: '2x4 treated pine lumber',
    lowStockThreshold: 75,
    createdAt: '2025-01-11T13:30:00Z',
    updatedAt: '2025-01-11T13:30:00Z'
  },
  {
    id: '7',
    name: 'Concrete Sand',
    category: 'Aggregates',
    quantity: 50,
    unit: 'tons',
    price: 35.00,
    supplier: 'Aggregate Plus',
    location: 'Sand Storage Area',
    description: 'Fine concrete sand for mixing',
    lowStockThreshold: 25,
    createdAt: '2025-01-09T15:20:00Z',
    updatedAt: '2025-01-09T15:20:00Z'
  },
  {
    id: '8',
    name: 'Safety Helmets',
    category: 'Tools & Equipment',
    quantity: 100,
    unit: 'pieces',
    price: 15.00,
    supplier: 'SafetyGear Pro',
    location: 'Equipment Storage',
    description: 'Hard hat safety helmets',
    lowStockThreshold: 50,
    createdAt: '2025-01-13T10:10:00Z',
    updatedAt: '2025-01-13T10:10:00Z'
  }
];

// Mock Purchase Data
export const mockPurchases: Purchase[] = [
  {
    id: '1',
    itemName: 'Portland Cement',
    category: 'Cement & Concrete',
    quantity: 200,
    unit: 'bags',
    unitPrice: 12.50,
    totalCost: 2500.00,
    supplier: 'BuildCorp Materials',
    purchaseDate: '2025-01-15',
    invoiceNumber: 'INV-2025-001',
    notes: 'Bulk cement for foundation work',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z'
  },
  {
    id: '2',
    itemName: 'Steel Rebar',
    category: 'Steel & Metal',
    quantity: 50,
    unit: 'tons',
    unitPrice: 850.00,
    totalCost: 42500.00,
    supplier: 'SteelWorks Ltd',
    purchaseDate: '2025-01-10',
    invoiceNumber: 'INV-2025-002',
    notes: 'Reinforcement for high-rise project',
    createdAt: '2025-01-10T14:20:00Z',
    updatedAt: '2025-01-10T14:20:00Z'
  },
  {
    id: '3',
    itemName: 'Clay Bricks',
    category: 'Building Materials',
    quantity: 10000,
    unit: 'pieces',
    unitPrice: 0.45,
    totalCost: 4500.00,
    supplier: 'BrickMaster Supplies',
    purchaseDate: '2025-01-12',
    invoiceNumber: 'INV-2025-003',
    notes: 'Bricks for residential construction',
    createdAt: '2025-01-12T09:15:00Z',
    updatedAt: '2025-01-12T09:15:00Z'
  },
  {
    id: '4',
    itemName: 'Safety Helmets',
    category: 'Tools & Equipment',
    quantity: 200,
    unit: 'pieces',
    unitPrice: 15.00,
    totalCost: 3000.00,
    supplier: 'SafetyGear Pro',
    purchaseDate: '2025-01-13',
    invoiceNumber: 'INV-2025-004',
    notes: 'Safety equipment for construction crew',
    createdAt: '2025-01-13T10:10:00Z',
    updatedAt: '2025-01-13T10:10:00Z'
  },
  {
    id: '5',
    itemName: 'Electrical Wire',
    category: 'Electrical',
    quantity: 100,
    unit: 'rolls',
    unitPrice: 45.00,
    totalCost: 4500.00,
    supplier: 'ElectroSupply Co',
    purchaseDate: '2025-01-14',
    invoiceNumber: 'INV-2025-005',
    notes: 'Wiring for commercial building',
    createdAt: '2025-01-14T11:00:00Z',
    updatedAt: '2025-01-14T11:00:00Z'
  }
];

// Mock Usage Data
export const mockUsage: Usage[] = [
  {
    id: '1',
    itemName: 'Portland Cement',
    category: 'Cement & Concrete',
    quantityUsed: 25,
    unit: 'bags',
    purpose: 'Foundation work',
    location: 'Construction Site A',
    usedBy: 'Mason Team',
    usageDate: '2025-01-15',
    remainingQuantity: 125,
    notes: 'Used for building foundations',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z'
  },
  {
    id: '2',
    itemName: 'Steel Rebar',
    category: 'Steel & Metal',
    quantityUsed: 5,
    unit: 'tons',
    purpose: 'Structural reinforcement',
    location: 'High-rise Project',
    usedBy: 'Steel Workers',
    usageDate: '2025-01-15',
    remainingQuantity: 195,
    notes: 'Reinforcement for concrete columns',
    createdAt: '2025-01-15T07:30:00Z',
    updatedAt: '2025-01-15T07:30:00Z'
  },
  {
    id: '3',
    itemName: 'Clay Bricks',
    category: 'Building Materials',
    quantityUsed: 500,
    unit: 'pieces',
    purpose: 'Wall construction',
    location: 'Residential Site B',
    usedBy: 'Bricklayers',
    usageDate: '2025-01-15',
    remainingQuantity: 4500,
    notes: 'Exterior wall construction',
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T11:00:00Z'
  },
  {
    id: '4',
    itemName: 'Safety Helmets',
    category: 'Tools & Equipment',
    quantityUsed: 10,
    unit: 'pieces',
    purpose: 'Worker safety',
    location: 'Construction Site A',
    usedBy: 'Site Foreman',
    usageDate: '2025-01-15',
    remainingQuantity: 90,
    notes: 'Daily safety equipment distribution',
    createdAt: '2025-01-15T06:00:00Z',
    updatedAt: '2025-01-15T06:00:00Z'
  },
  {
    id: '5',
    itemName: 'Electrical Wire',
    category: 'Electrical',
    quantityUsed: 5,
    unit: 'rolls',
    purpose: 'Electrical installation',
    location: 'Commercial Building',
    usedBy: 'Electricians',
    usageDate: '2025-01-15',
    remainingQuantity: 495,
    notes: 'Wiring for office spaces',
    createdAt: '2025-01-15T06:30:00Z',
    updatedAt: '2025-01-15T06:30:00Z'
  }
];

// Mock Summary Data
export const mockStockSummary: StockSummary = {
  totalItems: 8,
  totalValue: 2847.10,
  lowStockItems: 2,
  recentPurchases: 5,
  recentUsage: 5
};

export const mockCategorySummaries: CategorySummary[] = [
  {
    category: 'Cement & Concrete',
    itemCount: 1,
    totalValue: 1875.00,
    usageRate: 0.17
  },
  {
    category: 'Steel & Metal',
    itemCount: 1,
    totalValue: 170000.00,
    usageRate: 0.025
  },
  {
    category: 'Building Materials',
    itemCount: 2,
    totalValue: 12250.00,
    usageRate: 0.10
  },
  {
    category: 'Plumbing',
    itemCount: 1,
    totalValue: 2550.00,
    usageRate: 0.00
  },
  {
    category: 'Electrical',
    itemCount: 1,
    totalValue: 22500.00,
    usageRate: 0.01
  },
  {
    category: 'Aggregates',
    itemCount: 1,
    totalValue: 1750.00,
    usageRate: 0.00
  },
  {
    category: 'Tools & Equipment',
    itemCount: 1,
    totalValue: 1500.00,
    usageRate: 0.10
  }
];

// Helper functions for data manipulation
export const getInventoryValue = (): number => {
  return mockInventoryItems.reduce((total, item) => total + (item.quantity * item.price), 0);
};

export const getLowStockItems = (): InventoryItem[] => {
  return mockInventoryItems.filter(item => item.quantity < item.lowStockThreshold);
};


export const getRecentActivity = (days: number = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentPurchases = mockPurchases.filter(purchase =>
    new Date(purchase.purchaseDate) >= cutoffDate
  );

  const recentUsage = mockUsage.filter(usage =>
    new Date(usage.usageDate) >= cutoffDate
  );

  return {
    purchases: recentPurchases,
    usage: recentUsage,
    total: recentPurchases.length + recentUsage.length
  };
};