const Product = require('../products/product.model');
const Invoice = require('../invoices/invoice.model');
const Quote = require('../quotes/quote.model');
const Customer = require('../customers/customer.model');

async function getMetrics(req, res, next) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Sales metrics
    const [salesToday, salesMonth, salesYear] = await Promise.all([
      Invoice.aggregate([
        { $match: { created_at: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { created_at: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { created_at: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
    ]);

    // Monthly sales trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const salesTrend = await Invoice.aggregate([
      { $match: { created_at: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } },
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Inventory alerts
    const stockAlerts = await Product.countDocuments({
      status: 'active',
      $expr: { $lte: ['$current_stock', '$minimum_stock'] },
    });

    // Top products by revenue
    const topProducts = await Invoice.aggregate([
      { $match: { created_at: { $gte: startOfMonth } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_name',
          revenue: { $sum: '$items.subtotal' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Inventory by category
    const inventoryByCategory = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          total_stock: { $sum: '$current_stock' },
          products_count: { $sum: 1 },
          total_value: { $sum: { $multiply: ['$current_stock', '$cost_price'] } },
        },
      },
      { $sort: { total_value: -1 } },
    ]);

    // Pending counts
    const [pendingQuotes, pendingInvoices, totalCustomers, totalProducts] = await Promise.all([
      Quote.countDocuments({ status: { $in: ['draft', 'sent'] } }),
      Invoice.countDocuments({ payment_status: 'pending' }),
      Customer.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'active' }),
    ]);

    res.json({
      data: {
        sales: {
          today: salesToday[0] || { total: 0, count: 0 },
          month: salesMonth[0] || { total: 0, count: 0 },
          year: salesYear[0] || { total: 0, count: 0 },
          trend: salesTrend,
        },
        inventory: {
          stockAlerts,
          byCategory: inventoryByCategory,
        },
        topProducts,
        counts: {
          pendingQuotes,
          pendingInvoices,
          totalCustomers,
          totalProducts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMetrics };
