import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import { InventoryItem, Purchase } from '../types/stock';
import { mockInventoryItems } from '../data/mockStockData';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface PurchaseFormData {
  itemId: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
  invoiceNumber: string;
  notes: string;
}

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  onAddPurchase
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PurchaseFormData>();

  const selectedItemId = watch('itemId');
  const quantity = watch('quantity');
  const unitPrice = watch('unitPrice');

  const selectedItem = mockInventoryItems.find(item => item.id === selectedItemId);
  const totalCost = quantity && unitPrice ? quantity * unitPrice : 0;

  const onSubmit = (data: PurchaseFormData) => {
    if (!selectedItem) return;

    const purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'> = {
      itemName: selectedItem.name,
      category: selectedItem.category,
      quantity: Number(data.quantity),
      unit: selectedItem.unit,
      unitPrice: Number(data.unitPrice),
      totalCost: Number(totalCost),
      supplier: data.supplier,
      purchaseDate: data.purchaseDate,
      invoiceNumber: data.invoiceNumber || undefined,
      notes: data.notes || undefined
    };

    onAddPurchase(purchase);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Purchase</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item *
              </label>
              <select
                {...register('itemId', { required: 'Please select an item' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an item from inventory</option>
                {mockInventoryItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.category} (Current: {item.quantity} {item.unit})
                  </option>
                ))}
              </select>
              {errors.itemId && (
                <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('quantity', {
                  required: 'Quantity is required',
                  min: { value: 0.01, message: 'Quantity must be greater than 0' }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
              {selectedItem && (
                <p className="mt-1 text-xs text-gray-500">Unit: {selectedItem.unit}</p>
              )}
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price (R) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('unitPrice', {
                  required: 'Unit price is required',
                  min: { value: 0.01, message: 'Unit price must be greater than 0' }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter unit price"
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.unitPrice.message}</p>
              )}
            </div>

            {/* Total Cost Display */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Cost
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                <span className="text-lg font-semibold text-gray-900">
                  R{totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <input
                type="text"
                {...register('supplier', { required: 'Supplier is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter supplier name"
              />
              {errors.supplier && (
                <p className="mt-1 text-sm text-red-600">{errors.supplier.message}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date *
              </label>
              <input
                type="date"
                {...register('purchaseDate', { required: 'Purchase date is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.purchaseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.purchaseDate.message}</p>
              )}
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                {...register('invoiceNumber')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional invoice number"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional notes about this purchase"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Purchase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseModal;