const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../middleware/asyncHandler');

exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary({
    userId: req.user._id,
    role: req.user.role,
  });
  res.status(200).json({ success: true, summary });
});
