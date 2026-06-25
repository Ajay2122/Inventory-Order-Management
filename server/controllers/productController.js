const productService = require('../services/productService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

exports.getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAllProducts(req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({ success: true, product });
});

exports.createProduct = asyncHandler(async (req, res, next) => {
  const { name, sku, category, price, stock, reorderLevel, isActive } = req.body;

  if (!name || !sku || !category || price === undefined || price === null) {
    return next(new AppError('Name, SKU, category, and price are required', 400));
  }
  if (Number(price) <= 0) {
    return next(new AppError('Price must be greater than 0', 400));
  }
  if (stock !== undefined && Number(stock) < 0) {
    return next(new AppError('Stock cannot be negative', 400));
  }

  const product = await productService.createProduct({
    name,
    sku,
    category,
    price: Number(price),
    stock: Number(stock) || 0,
    reorderLevel: Number(reorderLevel) || 10,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({ success: true, message: 'Product created successfully', product });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const allowed = ['name', 'sku', 'category', 'price', 'stock', 'reorderLevel', 'isActive'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }
  if (updates.price !== undefined && Number(updates.price) <= 0) {
    return next(new AppError('Price must be greater than 0', 400));
  }
  if (updates.stock !== undefined && Number(updates.stock) < 0) {
    return next(new AppError('Stock cannot be negative', 400));
  }

  const product = await productService.updateProduct(req.params.id, updates);
  res.status(200).json({ success: true, message: 'Product updated successfully', product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = productService.getCategories();
  res.status(200).json({ success: true, categories });
});
