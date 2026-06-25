import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  fetchProducts,
  addProduct,
  editProduct,
  removeProduct,
  selectProducts,
  selectProductsPagination,
  selectProductsLoading,
  selectProductsSubmitting,
} from '../store/productsSlice';
import { selectIsManager, selectIsAdmin } from '../store/authSlice';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';
import { PageSpinner } from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ProductForm from '../components/products/ProductForm';

const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverages', 'Furniture', 'Stationery', 'Tools', 'Other'];

const Products = () => {
  const dispatch = useDispatch();
  const isManager = useSelector(selectIsManager);
  const isAdmin = useSelector(selectIsAdmin);
  const products = useSelector(selectProducts);
  const pagination = useSelector(selectProductsPagination);
  const loading = useSelector(selectProductsLoading);
  const submitting = useSelector(selectProductsSubmitting);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const loadProducts = useCallback((page = 1) => {
    dispatch(fetchProducts({ search: debouncedSearch, category, sortBy, sortOrder, page, limit: 10 }));
  }, [dispatch, debouncedSearch, category, sortBy, sortOrder]);

  useEffect(() => { loadProducts(1); }, [loadProducts]);

  const handleSubmit = async (data) => {
    const result = editingProduct
      ? await dispatch(editProduct({ id: editingProduct._id, data }))
      : await dispatch(addProduct(data));

    const succeeded = editingProduct
      ? editProduct.fulfilled.match(result)
      : addProduct.fulfilled.match(result);

    if (succeeded) {
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setIsFormOpen(false);
      setEditingProduct(null);
      loadProducts(pagination.page);
    } else {
      toast.error(result.payload || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(removeProduct(deletingProduct._id));
    if (removeProduct.fulfilled.match(result)) {
      toast.success('Product deleted successfully');
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      loadProducts(pagination.page);
    } else {
      toast.error(result.payload || 'Delete failed');
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const openDelete = (product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} product{pagination.total !== 1 ? 's' : ''} in the catalog</p>
        </div>
        {isManager && (
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-medium text-gray-400">
          <FunnelIcon className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split(':');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="input w-full sm:w-48"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="price:asc">Price: Low–High</option>
            <option value="price:desc">Price: High–Low</option>
            <option value="stock:asc">Stock: Low–High</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <PageSpinner />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={search || category ? "Try clearing your filters." : "Add your first product to get started."}
            action={isManager && <Button onClick={() => setIsFormOpen(true)}><PlusIcon className="h-4 w-4" />Add Product</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Reorder</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  {isManager && <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => {
                  const isLowStock = product.stock <= product.reorderLevel;
                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400">{formatDate(product.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{product.sku}</td>
                      <td className="px-4 py-3.5">
                        <Badge label={product.category} color="blue" />
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stock}
                        </span>
                        {isLowStock && (
                          <span className="ml-1 text-xs text-red-500">Low</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-500">{product.reorderLevel}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          label={product.isActive ? 'Active' : 'Inactive'}
                          color={product.isActive ? 'green' : 'gray'}
                        />
                      </td>
                      {isManager && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(product)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => openDelete(product)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100">
            <Pagination pagination={pagination} onPageChange={loadProducts} />
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <ProductForm
          key={editingProduct?._id || 'new'}
          initialData={editingProduct}
          onSubmit={handleSubmit}
          loading={submitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeletingProduct(null); }}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={submitting}
      />
    </div>
  );
};

export default Products;
