const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getSummary = async ({ userId, role } = {}) => {
  const isViewer = role === 'viewer' && userId;
  const orderFilter = isViewer ? { createdBy: userId } : {};

  const [
    totalProducts,
    totalOrders,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    ordersByStatus,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(orderFilter),
    Order.countDocuments({ ...orderFilter, status: 'Pending' }),
    Product.find({ $expr: { $lte: ['$stock', '$reorderLevel'] }, isActive: true })
      .select('name sku stock reorderLevel category')
      .limit(10)
      .lean(),
    Order.find(orderFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerName totalAmount status createdAt')
      .lean(),
    Order.aggregate([
      ...(isViewer ? [{ $match: { createdBy: userId } }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const statusMap = { Pending: 0, Confirmed: 0, Cancelled: 0 };
  ordersByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

  return {
    totalProducts,
    totalOrders,
    pendingOrders,
    confirmedOrders: statusMap.Confirmed,
    cancelledOrders: statusMap.Cancelled,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentOrders,
  };
};
