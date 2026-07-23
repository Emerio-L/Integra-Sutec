import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusLabels = { new: 'Nueva', reviewed: 'Revisada', converted: 'Convertida', dismissed: 'Descartada' };
const statusColors = { new: 'badge-danger', reviewed: 'badge-warning', converted: 'badge-success', dismissed: 'badge-gray' };

const categoryLabels = {
  computadoras: 'Computadoras y Laptops',
  redes: 'Redes y Conectividad',
  impresoras: 'Impresoras y Escáneres',
  almacenamiento: 'Almacenamiento',
  accesorios: 'Accesorios',
  software: 'Software y Licencias',
  servidores: 'Servidores',
  seguridad: 'Seguridad',
  otro: 'Otro',
};

export default function QuoteRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { loadData(); }, [filterStatus]);

  async function loadData() {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/quote-requests${params}`);
      setRequests(res.data.data);
    } catch {
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/quote-requests/${id}/status`, { status });
      toast.success('Estado actualizado');
      loadData();
      if (selected?._id === id) setSelected((prev) => ({ ...prev, status }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  }

  async function deleteRequest(id) {
    if (!confirm('¿Eliminar esta solicitud?')) return;
    try {
      await api.delete(`/quote-requests/${id}`);
      toast.success('Solicitud eliminada');
      setSelected(null);
      loadData();
    } catch {
      toast.error('Error al eliminar');
    }
  }

  const newCount = requests.filter((r) => r.status === 'new').length;

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Solicitudes del Sitio Web</h1>
          {newCount > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 13 }}>
              {newCount} nueva{newCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Filter */}
        <select
          className="form-input"
          style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="new">Nuevas</option>
          <option value="reviewed">Revisadas</option>
          <option value="converted">Convertidas</option>
          <option value="dismissed">Descartadas</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* Table */}
        <div className="card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req._id}
                  style={{ cursor: 'pointer', background: selected?._id === req._id ? 'var(--primary-50)' : undefined }}
                  onClick={() => setSelected(selected?._id === req._id ? null : req)}
                >
                  <td><span className={`badge ${statusColors[req.status]}`}>{statusLabels[req.status]}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{req.company}</div>
                    <div style={{ fontSize: 12, color: 'var(--dark-400)' }}>NIT: {req.nit}</div>
                  </td>
                  <td>
                    <div>{req.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--dark-400)' }}>{req.email}</div>
                  </td>
                  <td>{categoryLabels[req.category] || req.category || '—'}</td>
                  <td>{new Date(req.created_at).toLocaleDateString('es-GT')}</td>
                  <td onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                    {req.status === 'new' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(req._id, 'reviewed')}>
                        Marcar revisada
                      </button>
                    )}
                    {req.status === 'reviewed' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus(req._id, 'converted')}>
                        Convertida
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteRequest(req._id)}>×</button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">Sin solicitudes</div>
                      <p>Las solicitudes del formulario web aparecerán aquí.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>Detalle de Solicitud</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--dark-400)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span className={`badge ${statusColors[selected.status]}`}>{statusLabels[selected.status]}</span>
              </div>

              {[
                { label: 'Empresa', value: selected.company },
                { label: 'NIT', value: selected.nit },
                { label: 'Nombre', value: selected.name },
                { label: 'Cargo', value: selected.position || '—' },
                { label: 'Email', value: selected.email },
                { label: 'Teléfono', value: selected.phone },
                { label: 'Categoría', value: categoryLabels[selected.category] || selected.category || '—' },
                { label: 'Fecha límite', value: selected.deadline ? new Date(selected.deadline).toLocaleDateString('es-GT') : '—' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--dark-400)', letterSpacing: '0.05em' }}>{item.label}</span>
                  <span style={{ fontSize: 14, color: 'var(--dark-800)', fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}

              <div>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--dark-400)', letterSpacing: '0.05em' }}>Detalle de Productos</span>
                <p style={{ marginTop: 6, fontSize: 13, color: 'var(--dark-700)', lineHeight: 1.6, background: 'var(--dark-50)', padding: 12, borderRadius: 10, border: '1px solid var(--dark-100)' }}>
                  {selected.details}
                </p>
              </div>

              {selected.notes && (
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--dark-400)', letterSpacing: '0.05em' }}>Notas</span>
                  <p style={{ marginTop: 6, fontSize: 13, color: 'var(--dark-700)', lineHeight: 1.6 }}>{selected.notes}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--dark-100)', flexWrap: 'wrap' }}>
                <a href={`mailto:${selected.email}`} className="btn btn-primary btn-sm">
                  📧 Responder por Email
                </a>
                {selected.status === 'new' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected._id, 'reviewed')}>
                    Marcar revisada
                  </button>
                )}
                {selected.status === 'reviewed' && (
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(selected._id, 'converted')}>
                    Marcar convertida
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => deleteRequest(selected._id)}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
