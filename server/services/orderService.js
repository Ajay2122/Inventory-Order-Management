const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

exports.getAllOrders = async (query, { userId, role } = {}) => {
  const {
    status = '',
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.customerName = { $regex: search, $options: 'i' };
  if (role === 'viewer' && userId) filter.createdBy = userId;

  const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('items.productId', 'name sku category')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

exports.getOrderById = async (id) => {
  const order = await Order.findById(id).populate('items.productId', 'name sku category price');
  if (!order) throw new AppError('Order not found', 404);
  return order;
};

exports.createOrder = async (data) => {
  const { customerName, customerEmail, items, notes, createdBy } = data;

  if (!items || items.length === 0) {
    throw new AppError('Order must contain at least one item', 400);
  }

  // 1. Fetch all referenced products in one query
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  const productMap = {};
  products.forEach((p) => { productMap[p._id.toString()] = p; });

  // 2. Validate stock for every item before touching anything
  const stockErrors = [];
  const enrichedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = productMap[item.productId.toString()];
    if (!product) {
      stockErrors.push(`Product "${item.productId}" not found or is inactive.`);
      continue;
    }
    if (product.stock < item.quantity) {
      stockErrors.push(
        `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available: ${product.stock}, Requested: ${item.quantity}.`
      );
      continue;
    }
    totalAmount += product.price * item.quantity;
    enrichedItems.push({ productId: product._id, quantity: item.quantity, price: product.price });
  }

  if (stockErrors.length > 0) throw new AppError(stockErrors.join(' | '), 400);

  // 3. Atomically deduct stock one product at a time using a conditional update.
  //    findOneAndUpdate with { stock: { $gte: qty } } is atomic at the document level —
  //    no replica set required. If it returns null the stock changed between our read and
  //    write (race condition), so we roll back what we already decremented.
  const deducted = [];
  try {
    for (const item of enrichedItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        throw new AppError(
          `Stock depleted for a product while placing your order. Please try again.`,
          409
        );
      }
      deducted.push({ productId: item.productId, quantity: item.quantity });
    }

    // 4. Persist the order
    const order = await Order.create({
      customerName,
      customerEmail,
      items: enrichedItems,
      totalAmount,
      notes,
      status: 'Pending',
      createdBy,
    });

    return order.populate('items.productId', 'name sku category');
  } catch (err) {
    // Manual rollback: restore stock for every item that was already decremented
    for (const d of deducted) {
      await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
    }
    throw err;
  }
};

exports.updateOrderStatus = async (id, status) => {
  const validStatuses = ['Pending', 'Confirmed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found', 404);

  if (order.status === 'Cancelled') {
    throw new AppError('Cannot update a cancelled order.', 400);
  }
  if (order.status === status) {
    throw new AppError(`Order is already "${status}".`, 400);
  }

  // Restore stock atomically when cancelling (atomic $inc per document, no transaction needed)
  if (status === 'Cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }
    order.cancelledAt = new Date();
  }

  if (status === 'Confirmed') {
    order.confirmedAt = new Date();
  }

  order.status = status;
  await order.save();

  return order.populate('items.productId', 'name sku category');
};
