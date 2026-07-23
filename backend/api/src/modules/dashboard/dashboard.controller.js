const prisma = require('../../config/prisma');

const number = value => Number(value || 0);
async function salesSince(date) {
  const rows = await prisma.invoice.findMany({ where: { created_at: { gte: date } }, select: { total: true } });
  return { total: rows.reduce((sum, row) => sum + number(row.total), 0), count: rows.length };
}

async function getMetrics(req, res, next) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [today, month, year, recentInvoices, products, pendingQuotes, pendingInvoices, totalCustomers, totalProducts] = await Promise.all([
      salesSince(startOfDay), salesSince(startOfMonth), salesSince(startOfYear),
      prisma.invoice.findMany({ where: { created_at: { gte: sixMonthsAgo } }, select: { created_at: true, total: true, items: true } }),
      prisma.product.findMany({ where: { status: 'active' }, include: { category: true } }),
      prisma.quote.count({ where: { status: { in: ['draft', 'sent'] } } }),
      prisma.invoice.count({ where: { payment_status: 'pending' } }),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.product.count({ where: { status: 'active' } }),
    ]);
    const trendMap = new Map();
    const topMap = new Map();
    for (const invoice of recentInvoices) {
      const key = `${invoice.created_at.getFullYear()}-${invoice.created_at.getMonth() + 1}`;
      const trend = trendMap.get(key) || { _id: { year: invoice.created_at.getFullYear(), month: invoice.created_at.getMonth() + 1 }, total: 0, count: 0 };
      trend.total += number(invoice.total); trend.count += 1; trendMap.set(key, trend);
      if (invoice.created_at >= startOfMonth) for (const item of Array.isArray(invoice.items) ? invoice.items : []) {
        const top = topMap.get(item.product_name) || { _id: item.product_name, revenue: 0, quantity: 0 };
        top.revenue += number(item.subtotal); top.quantity += number(item.quantity); topMap.set(item.product_name, top);
      }
    }
    const categoryMap = new Map();
    for (const product of products) {
      const key = product.category.name;
      const item = categoryMap.get(key) || { _id: key, total_stock: 0, products_count: 0, total_value: 0 };
      item.total_stock += product.current_stock; item.products_count += 1; item.total_value += product.current_stock * number(product.cost_price);
      categoryMap.set(key, item);
    }
    res.json({ data: {
      sales: { today, month, year, trend: [...trendMap.values()].sort((a,b) => a._id.year-b._id.year || a._id.month-b._id.month) },
      inventory: { stockAlerts: products.filter(p => p.current_stock <= p.minimum_stock).length, byCategory: [...categoryMap.values()].sort((a,b) => b.total_value-a.total_value) },
      topProducts: [...topMap.values()].sort((a,b) => b.revenue-a.revenue).slice(0,10),
      counts: { pendingQuotes, pendingInvoices, totalCustomers, totalProducts },
    }});
  } catch (error) { next(error); }
}

module.exports = { getMetrics };
