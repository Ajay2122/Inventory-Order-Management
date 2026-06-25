const orderService = require('../services/orderService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

exports.getOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAllOrders(req.query, {
    userId: req.user._id,
    role: req.user.role,
  });
  res.status(200).json({ success: true, ...result });
});

exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await orderService.getOrderById(req.params.id);
  if (req.user.role === 'viewer' && order.createdBy?.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to view this order', 403));
  }
  res.status(200).json({ success: true, order });
});

exports.createOrder = asyncHandler(async (req, res, next) => {
  const { customerName, customerEmail, items, notes } = req.body;

  if (!customerName || !customerName.trim()) {
    return next(new AppError('Customer name is required', 400));
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Order must contain at least one item', 400));
  }

  for (const item of items) {
    if (!item.productId) return next(new AppError('Each item must have a productId', 400));
    if (!item.quantity || Number(item.quantity) < 1) {
      return next(new AppError('Each item must have a quantity of at least 1', 400));
    }
  }

  const order = await orderService.createOrder({ customerName, customerEmail, items, notes, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Order created successfully', order });
});

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  const order = await orderService.updateOrderStatus(req.params.id, status);
  res.status(200).json({ success: true, message: `Order status updated to "${status}"`, order });
});
