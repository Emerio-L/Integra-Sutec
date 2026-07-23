import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

function formatQ(n) {
  return `Q${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const monthNames = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/metrics')
      .then((res) => setMetrics(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Cargando métricas...</p></div>;
  if (!metrics) return <div className="empty-state"><p>Error al cargar métricas</p></div>;

  const { sales, inventory, topProducts, counts } = metrics;

  const trendData = (sales.trend || []).map((t) => ({
    name: `${monthNames[t._id.month]} ${t._id.year}`,
    ventas: t.total,
    facturas: t.count,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="card stat-card">
          <div className="flex-between">
            <div>
              <div className="stat-card-value">{formatQ(sales.today?.total)}</div>
              <div className="stat-card-label">Ventas Hoy</div>
            </div>
            <div className="stat-card-icon" style={{ background: 'var(--primary-100)' }}>💰</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex-between">
            <div>
              <div className="stat-card-value">{formatQ(sales.month?.total)}</div>
              <div className="stat-card-label">Ventas del Mes</div>
            </div>
            <div className="stat-card-icon" style={{ background: '#dcfce7' }}>📈</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex-between">
            <div>
              <div className="stat-card-value" style={{ color: inventory.stockAlerts > 0 ? '#dc2626' : undefined }}>{inventory.stockAlerts}</div>
              <div className="stat-card-label">Alertas de Stock</div>
            </div>
            <div className="stat-card-icon" style={{ background: inventory.stockAlerts > 0 ? '#fee2e2' : 'var(--dark-100)' }}>⚠️</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex-between">
            <div>
              <div className="stat-card-value">{counts.pendingQuotes}</div>
              <div className="stat-card-label">Cotizaciones Pendientes</div>
            </div>
            <div className="stat-card-icon" style={{ background: '#fef3c7' }}>📋</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Sales Trend */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Tendencia de Ventas</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-100)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--dark-500)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--dark-500)' }} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatQ(v)} />
                <Area type="monotone" dataKey="ventas" stroke="var(--primary-600)" fill="url(#colorVentas)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>Sin datos de ventas aún</p>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Top Productos (Mes)</h3>
          {topProducts && topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-100)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--dark-500)' }} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="_id" type="category" width={120} tick={{ fontSize: 11, fill: 'var(--dark-600)' }} />
                <Tooltip formatter={(v) => formatQ(v)} />
                <Bar dataKey="revenue" fill="var(--primary-500)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>Sin productos vendidos este mes</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-4">
        <div className="card stat-card">
          <div className="stat-card-label" style={{ marginBottom: 4 }}>Ventas del Año</div>
          <div className="stat-card-value" style={{ fontSize: 22 }}>{formatQ(sales.year?.total)}</div>
          <div style={{ fontSize: 12, color: 'var(--dark-400)', marginTop: 4 }}>{sales.year?.count || 0} facturas</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label" style={{ marginBottom: 4 }}>Productos Activos</div>
          <div className="stat-card-value" style={{ fontSize: 22 }}>{counts.totalProducts}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label" style={{ marginBottom: 4 }}>Clientes Activos</div>
          <div className="stat-card-value" style={{ fontSize: 22 }}>{counts.totalCustomers}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label" style={{ marginBottom: 4 }}>Facturas Pendientes</div>
          <div className="stat-card-value" style={{ fontSize: 22, color: counts.pendingInvoices > 0 ? '#d97706' : undefined }}>{counts.pendingInvoices}</div>
        </div>
      </div>

      {/* Inventory by Category */}
      {inventory.byCategory && inventory.byCategory.length > 0 && (
        <div className="card mt-6" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dark-100)' }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>Inventario por Categoría</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Productos</th>
                <th>Stock Total</th>
                <th>Valor en Inventario</th>
              </tr>
            </thead>
            <tbody>
              {inventory.byCategory.map((cat) => (
                <tr key={cat._id}>
                  <td style={{ fontWeight: 600 }}>{cat._id}</td>
                  <td>{cat.products_count}</td>
                  <td>{cat.total_stock}</td>
                  <td style={{ fontWeight: 600 }}>{formatQ(cat.total_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
