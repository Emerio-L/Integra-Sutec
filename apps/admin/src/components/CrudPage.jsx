import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CrudPage({ title, endpoint, columns, formFields, renderBadge }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get(`/${endpoint}`);
      setItems(res.data.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  }

  function getInitialForm() {
    const init = {};
    formFields.forEach((f) => { init[f.name] = f.defaultValue || ''; });
    return init;
  }

  function openCreate() {
    setEditing(null);
    setForm(getInitialForm());
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    const f = {};
    formFields.forEach((field) => {
      const val = item[field.name];
      f[field.name] = val && typeof val === 'object' && val._id ? val._id : (val || '');
    });
    setForm(f);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/${endpoint}/${editing._id}`, form);
        toast.success('Actualizado correctamente');
      } else {
        await api.post(`/${endpoint}`, form);
        toast.success('Creado correctamente');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Desactivar este registro?')) return;
    try {
      await api.delete(`/${endpoint}/${id}`);
      toast.success('Desactivado');
      loadData();
    } catch { toast.error('Error'); }
  }

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>{title}</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col.key}>{col.label}</th>)}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                {columns.map((col) => (
                  <td key={col.key} style={col.style}>
                    {col.render ? col.render(item) : (typeof item[col.key] === 'object' && item[col.key]?.name ? item[col.key].name : item[col.key] || '—')}
                  </td>
                ))}
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)} style={{ marginRight: 6 }}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>×</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="empty-state">No hay registros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? `Editar ${title.slice(0, -1)}` : `Nuevo ${title.slice(0, -1)}`}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formFields.map((field) => (
                  <div className="form-group" key={field.name}>
                    <label className="form-label">{field.label} {field.required && '*'}</label>
                    {field.type === 'textarea' ? (
                      <textarea className="form-input" rows="3" value={form[field.name] || ''} onChange={(e) => updateField(field.name, e.target.value)} required={field.required} />
                    ) : field.type === 'select' ? (
                      <select className="form-input" value={form[field.name] || ''} onChange={(e) => updateField(field.name, e.target.value)} required={field.required}>
                        <option value="">Seleccionar</option>
                        {(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type={field.type || 'text'} className="form-input" value={form[field.name] || ''} onChange={(e) => updateField(field.name, e.target.value)} required={field.required} placeholder={field.placeholder} />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
