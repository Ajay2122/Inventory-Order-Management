const Product = require('../models/Product');
const AppError = require('../utils/AppError');

const VALID_SORT_FIELDS = ['name', 'price', 'stock', 'createdAt', 'category'];
const VALID_SORT_ORDERS = ['asc', 'desc'];

exports.getAllProducts = async (query) => {
  const {
    search = '',
    category = '',
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = query;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) filter.category = category;

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const safeSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = VALID_SORT_ORDERS.includes(sortOrder) ? sortOrder : 'desc';
  const sortOption = { [safeSortBy]: safeSortOrder === 'asc' ? 1 : -1 };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

exports.getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

exports.createProduct = async (data) => {
  const existingSku = await Product.findOne({ sku: data.sku.toUpperCase() });
  if (existingSku) {
    throw new AppError(`SKU "${data.sku.toUpperCase()}" already exists. SKUs must be unique.`, 400);
  }
  return Product.create(data);
};

exports.updateProduct = async (id, data) => {
  if (data.sku) {
    const existingSku = await Product.findOne({
      sku: data.sku.toUpperCase(),
      _id: { $ne: id },
    });
    if (existingSku) {
      throw new AppError(`SKU "${data.sku.toUpperCase()}" already exists. SKUs must be unique.`, 400);
    }
  }

  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!product) throw new AppError('Product not found', 404);
  return product;
};

exports.deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

exports.getCategories = () => {
  return ['Electronics', 'Clothing', 'Food & Beverages', 'Furniture', 'Stationery', 'Tools', 'Other'];
};
