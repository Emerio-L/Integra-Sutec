import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS = {
  new:     { label: 'Nuevo',      cls: 'badge-danger'  },
  read:    { label: 'Leído',      cls: 'badge-warning' },
  replied: { label: 'Respondido', cls: 'badge-success' },
};
const SUBJECT = {
  general:     'Consulta general',
  cotizacion:  'Solicitar cotización',
  soporte:     'Soporte técnico',
  partnership: 'Alianzas comerciales',
};

export default function Contacts() {
  const [messages, setMessages]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/contacts${params}`);
      setMessages(res.data.data);
    } catch { toast.error('Error al cargar mensajes'); }
    finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/contacts/${id}/status`, { status });
      toast.success('Estado actualizado');
      load();
      if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }

  async function deleteMsg(id) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Mensaje eliminado');
      if (selected?._id === id) setSelected(null);
      load();
    } catch { toast.error('Error al eliminar'); }
  }

  function openMessage(msg) {
    setSelected(msg);
    if (msg.status === 'new') updateStatus(msg._id, 'read');
  }

  const newCount = messages.filter(m => m.status === 'new').length;

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Mensajes de Contacto</h1>
          {newCount > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 13 }}>
              {newCount} nuevo{newCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <select className="form-input" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
          value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="new">Nuevos</option>
          <option value="read">Leídos</option>
          <option value="replied">Respondidos</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20 }}>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Nombre</th>
                <th>Asunto</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr
                  key={msg._id}
                  style={{
                    cursor: 'pointer',
                    background: selected?._id === msg._id ? 'var(--primary-50)' : msg.status === 'new' ? '#fffbeb' : undefined,
                    fontWeight: msg.status === 'new' ? 700 : 400,
                  }}
                  onClick={() => openMessage(msg)}
                >
                  <td><span className={`badge ${STATUS[msg.status]?.cls}`}>{STATUS[msg.status]?.label}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{msg.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--dark-400)' }}>{msg.email}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{SUBJECT[msg.subject] || msg.subject}</td>
                  <td style={{ fontSize: 12, color: 'var(--dark-500)' }}>{new Date(msg.created_at).toLocaleDateString('es-GT')}</td>
                  <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                    {msg.status !== 'replied' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus(msg._id, 'replied')}>✓ Respondido</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteMsg(msg._id)}>×</button>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr><td colSpan="5">
                  <div className="empty-state">
                    <div className="empty-state-icon">✉️</div>
                    <div className="empty-state-title">Sin mensajes</div>
                    <p>Los mensajes del formulario de contacto aparecerán aquí.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
            <div className="flex-between" style={{ marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>Mensaje</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--dark-400)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${STATUS[selected.status]?.cls}`}>{STATUS[selected.status]?.label}</span>
                <span style={{ fontSize: 12, color: 'var(--dark-400)' }}>{new Date(selected.created_at).toLocaleString('es-GT')}</span>
              </div>

              {[
                { k: 'Nombre',   v: selected.name },
                { k: 'Email',    v: selected.email },
                { k: 'Teléfono', v: selected.phone || '—' },
                { k: 'Empresa',  v: selected.company || '—' },
                { k: 'Asunto',   v: SUBJECT[selected.subject] || selected.subject },
              ].map(r => (
                <div key={r.k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--dark-400)', minWidth: 72 }}>{r.k}:</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark-800)' }}>{r.v}</span>
                </div>
              ))}

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dark-400)', marginBottom: 8 }}>Mensaje</div>
                <p style={{ fontSize: 13, color: 'var(--dark-700)', background: 'var(--dark-50)', padding: '12px 14px', borderRadius: 10, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selected.message}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--dark-100)' }}>
                <a href={`mailto:${selected.email}?subject=Re: ${SUBJECT[selected.subject] || selected.subject}`}
                  className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  📧 Responder por Email
                </a>
                {selected.status !== 'replied' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected._id, 'replied')}>
                    ✓ Marcar respondido
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
