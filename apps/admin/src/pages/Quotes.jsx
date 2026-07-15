import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function formatQ(n) { return `Q${Number(n).toFixed(2)}`; }

const statusLabels = { draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada', expired: 'Expirada' };
const statusColors = { draft: 'badge-gray', sent: 'badge-info', approved: 'badge-success', rejected: 'badge-danger', expired: 'badge-warning' };

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/quotes?limit=50');
      setQuotes(res.data.data);
    } catch { toast.error('Error al cargar cotizaciones'); }
    finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/quotes/${id}/status`, { status });
      toast.success('Estado actualizado');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }

  function openPDF(id) {
    const token = localStorage.getItem('accessToken');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/quotes/${id}/pdf`;
    window.open(url, '_blank');
  }

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Cotizaciones</h1>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Válida Hasta</th>
              <th>Creada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q._id}>
                <td><span className="badge badge-info">{q.quote_number}</span></td>
                <td style={{ fontWeight: 600 }}>{q.customer_id?.name || '—'}</td>
                <td style={{ fontWeight: 600 }}>{formatQ(q.total)}</td>
                <td><span className={`badge ${statusColors[q.status]}`}>{statusLabels[q.status]}</span></td>
                <td>{q.valid_until ? new Date(q.valid_until).toLocaleDateString('es-GT') : '—'}</td>
                <td>{new Date(q.created_at).toLocaleDateString('es-GT')}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {q.status === 'draft' && <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(q._id, 'sent')}>Enviar</button>}
                  {q.status === 'sent' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus(q._id, 'approved')}>Aprobar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => updateStatus(q._id, 'rejected')}>Rechazar</button>
                    </>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => openPDF(q._id)} title="Ver PDF">📄</button>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr><td colSpan="7" className="empty-state">No hay cotizaciones</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
