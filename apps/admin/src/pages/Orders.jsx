import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

const STATUS = {
  pending:    { label: 'Pendiente',   cls: 'badge-danger'  },
  confirmed:  { label: 'Confirmado',  cls: 'badge-primary' },
  processing: { label: 'En proceso',  cls: 'badge-warning' },
  delivered:  { label: 'Entregado',   cls: 'badge-success' },
  cancelled:  { label: 'Cancelado',   cls: 'badge-gray'    },
};

const PAYMENT = {
  credit_card: { label: 'Tarjeta de Crédito', icon: '💳' },
  debit_card:  { label: 'Tarjeta de Débito',  icon: '🏦' },
  cash:        { label: 'Efectivo',            icon: '💵' },
};

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/orders${params}`);
      setOrders(res.data.data);
    } catch { toast.error('Error al cargar pedidos'); }
    finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Estado actualizado');
      load();
      if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }

  async function generateInvoice(order) {
    if (order.status !== 'delivered') {
      toast.error('El pedido debe estar marcado como Entregado para generar factura.');
      return;
    }
    setGenLoading(true);
    try {
      const res = await api.post(`/orders/${order._id}/invoice`);
      if (res.data.already_existed) {
        toast.success('Factura ya existía — abriendo PDF...');
      } else {
        toast.success(`Factura ${res.data.data.invoice_number} generada ✓`);
      }
      openPDF(order._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar factura');
    } finally {
      setGenLoading(false);
    }
  }

  function openPDF(orderId) {
    // Try to get the JWT stored by the admin's auth service
    const token = localStorage.getItem('accessToken')
      || localStorage.getItem('token')
      || sessionStorage.getItem('accessToken')
      || sessionStorage.getItem('token')
      || '';
    const url = `${API_BASE}/api/orders/${orderId}/invoice/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  }

  async function deleteOrder(id) {
    if (!confirm('¿Eliminar este pedido?')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Pedido eliminado');
      setSelected(null);
      load();
    } catch { toast.error('Error al eliminar'); }
  }

  function formatQ(n) { return `Q${Number(n).toFixed(2)}`; }

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Pedidos en Línea</h1>
          {pendingCount > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 13 }}>
              {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <select className="form-input" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
          value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmados</option>
          <option value="processing">En proceso</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* Table */}
        <div className="card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Pedido</th>
                <th>Cliente</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr
                  key={order._id}
                  style={{ cursor: 'pointer', background: selected?._id === order._id ? 'var(--primary-50)' : undefined }}
                  onClick={() => setSelected(selected?._id === order._id ? null : order)}
                >
                  <td><span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{order.order_number}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customer?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--dark-400)' }}>{order.customer?.email}</div>
                  </td>
                  <td>
                    <span>{PAYMENT[order.payment_method]?.icon}</span>{' '}
                    <span style={{ fontSize: 12 }}>{PAYMENT[order.payment_method]?.label}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{formatQ(order.total)}</td>
                  <td><span className={`badge ${STATUS[order.status]?.cls}`}>{STATUS[order.status]?.label}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--dark-500)' }}>{new Date(order.created_at).toLocaleDateString('es-GT')}</td>
                  <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                    {order.status === 'pending'    && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(order._id, 'confirmed')}>Confirmar</button>}
                    {order.status === 'confirmed'  && <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(order._id, 'processing')}>En proceso</button>}
                    {order.status === 'processing' && <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(order._id, 'delivered')}>Entregado</button>}
                    {order.status === 'delivered'  && (
                      <button className="btn btn-primary btn-sm" onClick={() => generateInvoice(order)} disabled={genLoading}
                        title="Generar factura PDF" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        📄 Factura
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(order._id)}>×</button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="7">
                  <div className="empty-state">
                    <div className="empty-state-icon">🛒</div>
                    <div className="empty-state-title">Sin pedidos</div>
                    <p>Los pedidos del catálogo web aparecerán aquí.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>Detalle del Pedido</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--dark-400)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status + Order number */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${STATUS[selected.status]?.cls}`}>{STATUS[selected.status]?.label}</span>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--dark-500)' }}>{selected.order_number}</span>
              </div>

              {/* Customer */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dark-400)', marginBottom: 8 }}>Cliente</div>
                {[
                  { k: 'Nombre',    v: selected.customer?.name },
                  { k: 'Email',     v: selected.customer?.email },
                  { k: 'Teléfono', v: selected.customer?.phone },
                  { k: 'Dirección', v: selected.customer?.address },
                  { k: 'NIT',       v: selected.customer?.nit },
                ].map(r => (
                  <div key={r.k} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--dark-400)', minWidth: 70 }}>{r.k}:</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--dark-800)' }}>{r.v || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Payment */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dark-400)', marginBottom: 6 }}>Pago</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{PAYMENT[selected.payment_method]?.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{PAYMENT[selected.payment_method]?.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--primary-600)', fontWeight: 600 }}>Contra entrega</div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dark-400)', marginBottom: 8 }}>Productos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selected.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--dark-50)', borderRadius: 10, padding: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--dark-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {item.image_url
                          ? <img src={`${API_BASE}${item.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '1.2rem' }}>📦</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark-800)' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--dark-400)' }}>{formatQ(item.unit_price)} × {item.quantity}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-700)' }}>{formatQ(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--dark-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 800, color: 'var(--primary-700)' }}>{formatQ(selected.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selected.customer?.notes && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dark-400)', marginBottom: 6 }}>Notas</div>
                  <p style={{ fontSize: 13, color: 'var(--dark-600)', background: 'var(--dark-50)', padding: 10, borderRadius: 8, margin: 0 }}>{selected.customer.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--dark-100)' }}>
                <a href={`mailto:${selected.customer?.email}`} className="btn btn-secondary btn-sm">📧 Email</a>
                {selected.status === 'pending'    && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(selected._id, 'confirmed')}>Confirmar</button>}
                {selected.status === 'confirmed'  && <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected._id, 'processing')}>En proceso</button>}
                {selected.status === 'processing' && <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected._id, 'delivered')}>Entregado</button>}
                {!['delivered', 'cancelled'].includes(selected.status) && (
                  <button className="btn btn-danger btn-sm" onClick={() => updateStatus(selected._id, 'cancelled')}>Cancelar</button>
                )}

                {/* Invoice section — only when delivered */}
                {selected.status === 'delivered' && (
                  <div style={{ width: '100%', marginTop: 4, background: 'linear-gradient(135deg,#eef6ff,#f0fdf6)', border: '1px solid #d9eaff', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-700)', marginBottom: 10 }}>📋 Facturación</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => generateInvoice(selected)}
                        disabled={genLoading}
                      >
                        {genLoading ? 'Generando...' : '🧾 Generar & Ver Factura'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openPDF(selected._id)}
                        title="Descargar PDF"
                      >
                        📄 PDF
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--dark-400)', margin: '8px 0 0' }}>
                      Al generar se crea la factura en el módulo Facturas y se abre el PDF automáticamente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
