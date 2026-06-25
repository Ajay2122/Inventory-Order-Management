import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { getProducts } from '../../services/productService';
import { formatCurrency } from '../../utils/helpers';
import { selectUser } from '../../store/authSlice';

const OrderForm = ({ onSubmit, loading }) => {
  const user = useSelector(selectUser);
  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      notes: '',
      items: [{ productId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { products } = await getProducts({ isActive: 'true', limit: 200 });
        setProducts(products);
      } catch {
        // handled by toast in parent
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const productOptions = products.map((p) => ({
    value: p._id,
    label: `${p.name} (${p.sku}) — Stock: ${p.stock} — ${formatCurrency(p.price)}`,
  }));

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      const product = products.find((p) => p._id === item.productId);
      if (product && item.quantity) {
        return sum + product.price * Number(item.quantity);
      }
      return sum;
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Customer Name"
          required
          placeholder="John Smith"
          error={errors.customerName?.message}
          {...register('customerName', { required: 'Customer name is required' })}
        />
        <Input
          label="Customer Email"
          type="email"
          placeholder="john@example.com"
          error={errors.customerEmail?.message}
          {...register('customerEmail', {
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
          })}
        />
      </div>

      {/* Order items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Order Items <span className="text-red-500">*</span></h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ productId: '', quantity: 1 })}
          >
            <PlusIcon className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => {
            const selectedProduct = products.find((p) => p._id === watchedItems[index]?.productId);
            return (
              <div key={field.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 space-y-2">
                  <Select
                    placeholder={fetchingProducts ? 'Loading products...' : 'Select product...'}
                    options={productOptions}
                    error={errors.items?.[index]?.productId?.message}
                    disabled={fetchingProducts}
                    {...register(`items.${index}.productId`, { required: 'Select a product' })}
                  />
                  {selectedProduct && (
                    <p className="text-xs text-gray-500">
                      Available stock: <span className={selectedProduct.stock < 5 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{selectedProduct.stock}</span>
                      {' · '}Unit price: <span className="font-medium">{formatCurrency(selectedProduct.price)}</span>
                    </p>
                  )}
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    error={errors.items?.[index]?.quantity?.message}
                    {...register(`items.${index}.quantity`, {
                      required: 'Required',
                      min: { value: 1, message: 'Min 1' },
                      max: selectedProduct
                        ? { value: selectedProduct.stock, message: `Max ${selectedProduct.stock}` }
                        : undefined,
                    })}
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex-shrink-0 p-2 h-9 mt-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order total preview */}
      {calculateTotal() > 0 && (
        <div className="flex justify-end">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-700">
              Estimated Total:{' '}
              <span className="font-bold text-blue-800 text-base">{formatCurrency(calculateTotal())}</span>
            </p>
            <p className="text-xs text-blue-500 mt-0.5">Final amount calculated by server</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          rows={2}
          placeholder="Optional order notes..."
          className="input resize-none"
          {...register('notes', { maxLength: { value: 500, message: 'Max 500 characters' } })}
        />
        {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <Button type="submit" loading={loading}>
          Place Order
        </Button>
      </div>
    </form>
  );
};

export default OrderForm;
