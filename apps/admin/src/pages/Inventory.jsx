import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [moveType, setMoveType] = useState('entry');
  const [form, setForm] = useState({ product_id: '', quantity: '', notes: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [movRes, alertRes, prodRes] = await Promise.all([
        api.get('/inventory/movements?limit=50'),
        api.get('/inventory/alerts'),
        api.get('/products?limit=200&status=active'),
      ]);
      setMovements(movRes.data.data);
      setAlerts(alertRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }

  function openMovement(type) {
    setMoveType(type);
    setForm({ product_id: '', quantity: '', notes: '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post(`/inventory/${moveType}`, {
        product_id: form.product_id,
        quantity: Number(form.quantity),
        notes: form.notes,
      });
      toast.success(`Movimiento de ${moveType === 'entry' ? 'entrada' : 'salida'} registrado`);
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar movimiento');
    }
  }

  const typeLabels = { entry: 'Entrada', exit: 'Salida', transfer: 'Transferencia', adjustment: 'Ajuste' };
  const typeColors = { entry: 'badge-success', exit: 'badge-danger', transfer: 'badge-info', adjustment: 'badge-warning' };

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Inventario</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => openMovement('entry')}>+ Entrada</button>
          <button className="btn btn-secondary" onClick={() => openMovement('exit')}>- Salida</button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card mb-6" style={{ border: '1px solid #fecaca', background: '#fef2f2', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <h3 style={{ fontWeight: 700, color: '#dc2626', fontSize: 15 }}>Alertas de Stock Crítico ({alerts.length})</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a._id}>
                  <td style={{ fontWeight: 600, color: '#dc2626' }}>{a.name}</td>
                  <td><span className="badge badge-gray">{a.sku}</span></td>
                  <td>{a.category_id?.name || '—'}</td>
                  <td><span className="badge badge-danger">{a.current_stock}</span></td>
                  <td>{a.minimum_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Movements History */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dark-100)' }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>Historial de Movimientos</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Stock Anterior</th>
              <th>Stock Nuevo</th>
              <th>Usuario</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m._id}>
                <td>{new Date(m.created_at).toLocaleDateString('es-GT')}</td>
                <td style={{ fontWeight: 600 }}>{m.product_id?.name || '—'}</td>
                <td><span className={`badge ${typeColors[m.movement_type]}`}>{typeLabels[m.movement_type]}</span></td>
                <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                <td>{m.previous_stock}</td>
                <td>{m.new_stock}</td>
                <td>{m.created_by?.name || '—'}</td>
                <td style={{ color: 'var(--dark-400)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes || '—'}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr><td colSpan="8" className="empty-state">No hay movimientos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Movement Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{moveType === 'entry' ? '📦 Entrada de Stock' : '📤 Salida de Stock'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Producto *</label>
                  <select className="form-input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required>
                    <option value="">Seleccionar producto</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — Stock: {p.current_stock}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad *</label>
                  <input type="number" min="1" className="form-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea className="form-input" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Referencia, orden de compra, etc." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={`btn ${moveType === 'entry' ? 'btn-primary' : 'btn-danger'}`}>
                  Registrar {moveType === 'entry' ? 'Entrada' : 'Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
