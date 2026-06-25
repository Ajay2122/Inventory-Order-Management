import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverages', 'Furniture', 'Stationery', 'Tools', 'Other'];

const ProductForm = ({ initialData, onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      price: '',
      stock: '',
      reorderLevel: 10,
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        sku: initialData.sku,
        category: initialData.category,
        price: initialData.price,
        stock: initialData.stock,
        reorderLevel: initialData.reorderLevel,
        isActive: initialData.isActive,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Product Name"
            required
            placeholder="e.g. Wireless Keyboard"
            error={errors.name?.message}
            {...register('name', {
              required: 'Product name is required',
              maxLength: { value: 100, message: 'Max 100 characters' },
            })}
          />
        </div>

        <Input
          label="SKU"
          required
          placeholder="e.g. ELEC-WK-001"
          error={errors.sku?.message}
          {...register('sku', {
            required: 'SKU is required',
            pattern: { value: /^[A-Za-z0-9\-_]+$/, message: 'SKU: letters, numbers, hyphens, underscores only' },
            maxLength: { value: 30, message: 'Max 30 characters' },
          })}
        />

        <Select
          label="Category"
          required
          placeholder="Select category..."
          options={CATEGORIES}
          error={errors.category?.message}
          {...register('category', { required: 'Category is required' })}
        />

        <Input
          label="Price ($)"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          error={errors.price?.message}
          {...register('price', {
            required: 'Price is required',
            min: { value: 0.01, message: 'Price must be greater than 0' },
          })}
        />

        <Input
          label="Stock Quantity"
          type="number"
          min="0"
          required
          placeholder="0"
          error={errors.stock?.message}
          {...register('stock', {
            required: 'Stock is required',
            min: { value: 0, message: 'Stock cannot be negative' },
          })}
        />

        <Input
          label="Reorder Level"
          type="number"
          min="0"
          required
          placeholder="10"
          error={errors.reorderLevel?.message}
          {...register('reorderLevel', {
            required: 'Reorder level is required',
            min: { value: 0, message: 'Cannot be negative' },
          })}
        />

        <div className="sm:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('isActive')}
            />
            <span className="text-sm font-medium text-gray-700">Product is active</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="submit" loading={loading}>
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
