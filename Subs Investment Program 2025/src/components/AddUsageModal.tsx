import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import { InventoryItem, Usage as UsageType } from '../types/stock';
import { mockInventoryItems } from '../data/mockStockData';

interface AddUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUsage: (usage: Omit<UsageType, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface UsageFormData {
  itemId: string;
  quantityUsed: number;
  usageDate: string;
  purpose: string;
  location: string;
  usedBy: string;
  notes: string;
}

const AddUsageModal: React.FC<AddUsageModalProps> = ({
  isOpen,
  onClose,
  onAddUsage
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UsageFormData>();

  const selectedItemId = watch('itemId');
  const quantityUsed = watch('quantityUsed');

  const selectedItem = mockInventoryItems.find(item => item.id === selectedItemId);
  const remainingQuantity = selectedItem && quantityUsed ? selectedItem.quantity - quantityUsed : selectedItem?.quantity || 0;

  const onSubmit = (data: UsageFormData) => {
    if (!selectedItem) return;

    const usage: Omit<UsageType, 'id' | 'createdAt' | 'updatedAt'> = {
      itemName: selectedItem.name,
      category: selectedItem.category,
      quantityUsed: data.quantityUsed,
      unit: selectedItem.unit,
      purpose: data.purpose,
      location: data.location,
      usedBy: data.usedBy,
      usageDate: data.usageDate,
      remainingQuantity: remainingQuantity >= 0 ? remainingQuantity : undefined,
      notes: data.notes || undefined
    };

    onAddUsage(usage);
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
          <h2 className="text-xl font-semibold text-gray-900">Record Usage</h2>
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
                    {item.name} - {item.category} (Available: {item.quantity} {item.unit})
                  </option>
                ))}
              </select>
              {errors.itemId && (
                <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>
              )}
            </div>

            {/* Quantity Used */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Used *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('quantityUsed', {
                  required: 'Quantity used is required',
                  min: { value: 0.01, message: 'Quantity must be greater than 0' },
                  validate: (value) => {
                    if (selectedItem && value > selectedItem.quantity) {
                      return `Cannot use more than available quantity (${selectedItem.quantity} ${selectedItem.unit})`;
                    }
                    return true;
                  }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity used"
              />
              {errors.quantityUsed && (
                <p className="mt-1 text-sm text-red-600">{errors.quantityUsed.message}</p>
              )}
              {selectedItem && (
                <p className="mt-1 text-xs text-gray-500">Unit: {selectedItem.unit}</p>
              )}
            </div>

            {/* Remaining Quantity Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remaining Quantity
              </label>
              <div className={`border rounded-md px-3 py-2 ${
                remainingQuantity < 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-lg font-semibold ${
                  remainingQuantity < 0 ? 'text-red-900' : 'text-gray-900'
                }`}>
                  {remainingQuantity >= 0 ? `${remainingQuantity} ${selectedItem?.unit || ''}` : 'Insufficient stock'}
                </span>
                {remainingQuantity < 0 && (
                  <p className="text-xs text-red-600 mt-1">Warning: Over-usage detected</p>
                )}
              </div>
            </div>

            {/* Usage Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Date *
              </label>
              <input
                type="date"
                {...register('usageDate', { required: 'Usage date is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.usageDate && (
                <p className="mt-1 text-sm text-red-600">{errors.usageDate.message}</p>
              )}
            </div>

            {/* Used By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Used By *
              </label>
              <input
                type="text"
                {...register('usedBy', { required: 'Used by is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter person/staff name"
              />
              {errors.usedBy && (
                <p className="mt-1 text-sm text-red-600">{errors.usedBy.message}</p>
              )}
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose *
              </label>
              <select
                {...register('purpose', { required: 'Purpose is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select purpose</option>
                <option value="Daily operations">Daily operations</option>
                <option value="Special event">Special event</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Training">Training</option>
                <option value="Waste/Disposal">Waste/Disposal</option>
                <option value="Quality testing">Quality testing</option>
                <option value="Customer service">Customer service</option>
                <option value="Other">Other</option>
              </select>
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                {...register('location', { required: 'Location is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter usage location"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
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
                placeholder="Optional notes about this usage"
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
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record Usage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUsageModal;