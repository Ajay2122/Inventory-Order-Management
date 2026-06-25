import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  fetchOrders,
  placeOrder,
  changeOrderStatus,
  selectOrders,
  selectOrdersPagination,
  selectOrdersLoading,
  selectOrdersSubmitting,
} from '../store/ordersSlice';
import { selectIsManager, selectUser } from '../store/authSlice';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';
import { PageSpinner } from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import OrderForm from '../components/orders/OrderForm';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Cancelled'];

const OrderDetailModal = ({ order, isOpen, onClose, onStatusChange, isManager }) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    try {
      await onStatusChange(order._id, status);
      onClose();
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
            <p className="font-semibold text-gray-900 mt-1">{order.customerName}</p>
            {order.customerEmail && <p className="text-sm text-gray-500">{order.customerEmail}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Order Date</p>
            <p className="text-sm text-gray-800 mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>

        {order.notes && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{order.notes}</p>
          </div>
        )}

        {/* Order items */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Items</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Product</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Unit Price</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {item.productId?.name || 'Product Deleted'}
                      </p>
                      {item.productId?.sku && (
                        <p className="text-xs text-gray-400 font-mono">{item.productId.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Status update buttons */}
        {isManager && order.status !== 'Cancelled' && (
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600 self-center mr-auto">Update status:</p>
            {order.status === 'Pending' && (
              <Button
                variant="success"
                size="sm"
                loading={updatingStatus}
                onClick={() => handleStatusChange('Confirmed')}
              >
                Confirm Order
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              loading={updatingStatus}
              onClick={() => handleStatusChange('Cancelled')}
            >
              Cancel Order
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Orders = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  const orders = useSelector(selectOrders);
  const pagination = useSelector(selectOrdersPagination);
  const loading = useSelector(selectOrdersLoading);
  const submitting = useSelector(selectOrdersSubmitting);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const loadOrders = useCallback((page = 1) => {
    dispatch(fetchOrders({ status: statusFilter, search: debouncedSearch, page, limit: 10 }));
  }, [dispatch, statusFilter, debouncedSearch]);

  useEffect(() => { loadOrders(1); }, [loadOrders]);

  const handleCreate = async (data) => {
    const result = await dispatch(placeOrder(data));
    if (placeOrder.fulfilled.match(result)) {
      toast.success('Order placed successfully');
      setIsCreateOpen(false);
      loadOrders(1);
    } else {
      toast.error(result.payload || 'Failed to place order');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    const result = await dispatch(changeOrderStatus({ id: orderId, status }));
    if (changeOrderStatus.fulfilled.match(result)) {
      toast.success(`Order ${status.toLowerCase()} successfully`);
      loadOrders(pagination.page);
    } else {
      toast.error(result.payload || 'Status update failed');
    }
  };

  const openDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} order{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
        {user && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            New Order
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
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-44"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <PageSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description={search || statusFilter ? "Try clearing your filters." : "No orders yet — create the first one."}
            action={user && <Button onClick={() => setIsCreateOpen(true)}><PlusIcon className="h-4 w-4" />New Order</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Items</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      {order.customerEmail && (
                        <p className="text-xs text-gray-400">{order.customerEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-gray-700">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(order)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {isManager && order.status !== 'Cancelled' && (
                          <>
                            {order.status === 'Pending' && (
                              <button
                                onClick={() => handleStatusChange(order._id, 'Confirmed')}
                                disabled={submitting}
                                className="px-2 py-1 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(order._id, 'Cancelled')}
                              disabled={submitting}
                              className="px-2 py-1 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100">
            <Pagination pagination={pagination} onPageChange={loadOrders} />
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Order" size="xl">
        <OrderForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedOrder(null); }}
        onStatusChange={handleStatusChange}
        isManager={isManager}
      />
    </div>
  );
};

export default Orders;
