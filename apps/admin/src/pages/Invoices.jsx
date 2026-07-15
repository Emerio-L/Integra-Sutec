import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function formatQ(n) { return `Q${Number(n).toFixed(2)}`; }

const paymentLabels = { pending: 'Pendiente', paid: 'Pagada', partial: 'Parcial' };
const paymentColors = { pending: 'badge-warning', paid: 'badge-success', partial: 'badge-info' };
const methodLabels = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', credit: 'Crédito' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/invoices?limit=50');
      setInvoices(res.data.data);
    } catch { toast.error('Error al cargar facturas'); }
    finally { setLoading(false); }
  }

  async function updatePayment(id, payment_status) {
    try {
      await api.patch(`/invoices/${id}/payment`, { payment_status });
      toast.success('Estado de pago actualizado');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }

  function openPDF(id) {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    const base  = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
    const url   = `${base}/api/invoices/${id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  }

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Facturas</h1>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Factura</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado Pago</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id}>
                <td><span className="badge badge-info">{inv.invoice_number}</span></td>
                <td style={{ fontWeight: 600 }}>{inv.customer_id?.name || '—'}</td>
                <td style={{ fontWeight: 600 }}>{formatQ(inv.total)}</td>
                <td>{methodLabels[inv.payment_method] || inv.payment_method}</td>
                <td><span className={`badge ${paymentColors[inv.payment_status]}`}>{paymentLabels[inv.payment_status]}</span></td>
                <td>{new Date(inv.created_at).toLocaleDateString('es-GT')}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {inv.payment_status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => updatePayment(inv._id, 'paid')}>Marcar Pagada</button>}
                  {inv.payment_status === 'partial' && <button className="btn btn-primary btn-sm" onClick={() => updatePayment(inv._id, 'paid')}>Completar Pago</button>}
                  <button className="btn btn-secondary btn-sm" onClick={() => openPDF(inv._id)} title="Ver PDF">📄</button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan="7" className="empty-state">No hay facturas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
