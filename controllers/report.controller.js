const Order = require("../models/order.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");


function parseDateRange(query) {
  if (!query.startDate && !query.endDate) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const start = query.startDate ? new Date(query.startDate) : thirtyDaysAgo;
  const end = query.endDate ? new Date(query.endDate) : now;


  end.setHours(23, 59, 59, 999);

  return { start, end };
}


exports.getSalesReport = catchAsync(async (req, res, next) => {
  const dateRange = parseDateRange(req.query);

  let dateFilter = {};
  if (dateRange) {
    if (isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
      return next(new AppError("Invalid date range provided", 400));
    }
    dateFilter = { createdAt: { $gte: dateRange.start, $lte: dateRange.end } };
  }


  const revenueStats = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
        status: { $nin: ["canceledByUser", "canceledByAdmin", "rejected"] },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const revenue = revenueStats[0]?.totalRevenue ?? 0;
  const orderCount = revenueStats[0]?.totalOrders ?? 0;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;


  const topProducts = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
        status: { $nin: ["canceledByUser", "canceledByAdmin", "rejected"] },
      },
    },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.productId",
        unitsSold: { $sum: "$products.quantity" },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: "$product.name",
        unitsSold: 1,
      },
    },
  ]);


  const statusBreakdown = await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      ...(dateRange
        ? {
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
          }
        : {}),
      summary: {
        totalRevenue: revenue,
        totalOrders: orderCount,
        avgOrderValue,
      },
      topSellingProducts: topProducts,
      orderStatusBreakdown: statusBreakdown,
    },
  });
});
