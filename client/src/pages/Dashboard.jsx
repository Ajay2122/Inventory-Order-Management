import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { fetchSummary, selectSummary, selectDashboardLoading, selectDashboardError } from '../store/dashboardSlice';
import { selectUser } from '../store/authSlice';
import { formatCurrency, formatDate } from '../utils/helpers';
import { PageSpinner } from '../components/common/Spinner';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const StatCard = ({ title, value, Icon, color, subtitle, linkTo }) => {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  const card = (
    <div className={`card p-5 hover:shadow-md transition-shadow ${linkTo ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} border ${c.border}`}>
          <Icon className={`h-6 w-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );

  return linkTo ? <Link to={linkTo}>{card}</Link> : card;
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const summary = useSelector(selectSummary);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);

  useEffect(() => {
    dispatch(fetchSummary());
  }, [dispatch]);

  if (loading && !summary) return <PageSpinner />;
  if (error) return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-5 text-red-700 text-sm">{error}</div>
  );
  if (!summary) return null;

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{getGreeting()}, {firstName}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.role === 'viewer'
            ? "Here's a summary of your orders."
            : "Here's what's going on with your inventory today."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={summary.totalProducts}
          Icon={ArchiveBoxIcon}
          color="blue"
          linkTo="/products"
        />
        <StatCard
          title="Total Orders"
          value={summary.totalOrders}
          Icon={ClipboardDocumentListIcon}
          color="green"
          subtitle="all time"
          linkTo="/orders"
        />
        <StatCard
          title="Pending Orders"
          value={summary.pendingOrders}
          Icon={ClockIcon}
          color="yellow"
          subtitle="needs action"
          linkTo="/orders?status=Pending"
        />
        <StatCard
          title="Low Stock Items"
          value={summary.lowStockCount}
          Icon={ExclamationTriangleIcon}
          color="red"
          subtitle={summary.lowStockCount === 0 ? 'all good!' : 'needs restocking'}
        />
      </div>

      {/* Order status summary — quick numbers */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Order Status Breakdown</p>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-2xl font-bold text-yellow-500">{summary.pendingOrders}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pending</p>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <p className="text-2xl font-bold text-green-600">{summary.confirmedOrders}</p>
            <p className="text-xs text-gray-500 mt-0.5">Confirmed</p>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <p className="text-2xl font-bold text-red-500">{summary.cancelledOrders}</p>
            <p className="text-xs text-gray-500 mt-0.5">Cancelled</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-gray-400">Total orders</p>
            <p className="text-xl font-bold text-gray-700">{summary.totalOrders}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="section-title flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
              Low Stock
            </h2>
            <Link to="/products" className="text-xs text-blue-600 hover:underline">View all products</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {summary.lowStockProducts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">All products are well-stocked ✓</p>
            ) : (
              summary.lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.sku} · {product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-600">{product.stock}</span>
                    <span className="text-xs text-gray-400"> / {product.reorderLevel} min</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="section-title">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {summary.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No orders yet — create one to get started</p>
            ) : (
              summary.recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
