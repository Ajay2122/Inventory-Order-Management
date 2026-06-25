const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/categories', productController.getCategories);

router
  .route('/')
  .get(protect, productController.getProducts)
  .post(protect, restrictTo('admin', 'manager'), productController.createProduct);

router
  .route('/:id')
  .get(protect, productController.getProduct)
  .put(protect, restrictTo('admin', 'manager'), productController.updateProduct)
  .delete(protect, restrictTo('admin'), productController.deleteProduct);

module.exports = router;
