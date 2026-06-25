const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

router
  .route('/')
  .get(protect, orderController.getOrders)
  .post(protect, orderController.createOrder);

router.get('/:id', protect, orderController.getOrder);
router.put('/:id/status', protect, restrictTo('admin', 'manager'), orderController.updateOrderStatus);

module.exports = router;
