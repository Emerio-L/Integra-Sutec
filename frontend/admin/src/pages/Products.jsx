import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    sku: '', name: '', description: '', category_id: '', brand_id: '',
    unit_price: '', cost_price: '', minimum_stock: 5,
  });

  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [prodRes, catRes, brRes] = await Promise.all([
        api.get('/products?limit=200'),
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
      setBrands(brRes.data.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ sku: '', name: '', description: '', category_id: '', brand_id: '', unit_price: '', cost_price: '', minimum_stock: 5 });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, description: p.description || '',
      category_id: p.category_id?._id || p.category_id,
      brand_id: p.brand_id?._id || p.brand_id,
      unit_price: p.unit_price, cost_price: p.cost_price,
      minimum_stock: p.minimum_stock,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      let saved;
      if (editing) {
        const res = await api.put(`/products/${editing._id}`, form);
        saved = res.data.data;
        toast.success('Producto actualizado');
      } else {
        const res = await api.post('/products', form);
        saved = res.data.data;
        toast.success('Producto creado — ahora puedes subir imágenes');
      }
      // Re-open in edit mode so user can add images immediately after creating
      if (!editing && saved) {
        setEditing(saved);
      } else {
        setShowModal(false);
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  }

  async function uploadImage(file) {
    if (!editing?._id) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/products/${editing._id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res.data.data;
      setEditing(updated);
      // Update in main list too
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      toast.success('Imagen subida');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteImage(imageUrl) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      const res = await api.delete(`/products/${editing._id}/images`, { data: { imageUrl } });
      const updated = res.data.data;
      setEditing(updated);
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      toast.success('Imagen eliminada');
    } catch { toast.error('Error al eliminar imagen'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Desactivar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto desactivado');
      loadData();
    } catch { toast.error('Error al desactivar'); }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  }

  function formatQ(n) { return `Q${Number(n).toFixed(2)}`; }
  function getMainImage(p) { return p.images && p.images.length > 0 ? `${API_BASE}${p.images[0]}` : null; }

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Productos</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Producto</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>Foto</th>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>
                  {getMainImage(p) ? (
                    <img
                      src={getMainImage(p)}
                      alt={p.name}
                      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--dark-100)' }}
                    />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--dark-50)', border: '1px dashed var(--dark-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      📦
                    </div>
                  )}
                </td>
                <td><span className="badge badge-gray">{p.sku}</span></td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.category_id?.name || '—'}</td>
                <td>{p.brand_id?.name || '—'}</td>
                <td style={{ fontWeight: 600 }}>{formatQ(p.unit_price)}</td>
                <td>
                  <span className={`badge ${p.current_stock <= p.minimum_stock ? 'badge-danger' : 'badge-success'}`}>
                    {p.current_stock}
                  </span>
                </td>
                <td>
                  <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)} style={{ marginRight: 6 }}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>×</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="9" className="empty-state">No hay productos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 680 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editing ? `Editar: ${editing.name}` : 'Nuevo Producto'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* ── Image Manager (only in edit mode) ── */}
                {editing && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        Fotos del Producto
                        <span style={{ fontWeight: 400, color: 'var(--dark-400)', marginLeft: 8 }}>
                          ({(editing.images || []).length} / 5)
                        </span>
                      </label>
                      {(editing.images || []).length < 5 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? 'Subiendo...' : '+ Agregar foto'}
                        </button>
                      )}
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files[0]) uploadImage(e.target.files[0]); }}
                    />

                    {/* Drag & Drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? 'var(--primary-500)' : 'var(--dark-200)'}`,
                        borderRadius: 12,
                        padding: '16px',
                        background: dragOver ? 'var(--primary-50)' : 'var(--dark-50)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: (editing.images || []).length === 0 ? 100 : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: (editing.images || []).length === 0 ? 'center' : 'flex-start',
                        justifyContent: (editing.images || []).length === 0 ? 'center' : 'flex-start',
                        gap: 12,
                      }}
                    >
                      {(editing.images || []).length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--dark-400)', pointerEvents: 'none' }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>Arrastra una foto aquí o haz clic</div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>JPG, PNG, WebP — máx. 5MB</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, pointerEvents: 'none' }}>
                          {(editing.images || []).map((img, idx) => (
                            <div
                              key={idx}
                              style={{ position: 'relative', pointerEvents: 'all' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={`${API_BASE}${img}`}
                                alt={`Foto ${idx + 1}`}
                                style={{
                                  width: 100,
                                  height: 100,
                                  objectFit: 'cover',
                                  borderRadius: 10,
                                  border: idx === 0 ? '2px solid var(--primary-500)' : '1px solid var(--dark-200)',
                                }}
                              />
                              {idx === 0 && (
                                <span style={{
                                  position: 'absolute', bottom: 4, left: 4,
                                  background: 'var(--primary-600)', color: 'white',
                                  fontSize: 10, fontWeight: 700, padding: '2px 6px',
                                  borderRadius: 6,
                                }}>Principal</span>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteImage(img)}
                                style={{
                                  position: 'absolute', top: -6, right: -6,
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: '#ef4444', border: '2px solid white',
                                  color: 'white', fontSize: 12, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  lineHeight: 1,
                                }}
                              >×</button>
                            </div>
                          ))}
                          {/* Add more button inside grid */}
                          {(editing.images || []).length < 5 && (
                            <div
                              style={{
                                width: 100, height: 100, borderRadius: 10,
                                border: '2px dashed var(--dark-300)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'var(--dark-400)', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', gap: 4,
                              }}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <span style={{ fontSize: 20 }}>+</span>
                              <span>Agregar</span>
                            </div>
                          )}
                        </div>
                      )}

                      {uploading && (
                        <div style={{ fontSize: 13, color: 'var(--primary-600)', fontWeight: 600, marginTop: 8 }}>
                          ⏳ Subiendo imagen...
                        </div>
                      )}
                    </div>

                    <p style={{ fontSize: 11, color: 'var(--dark-400)', marginTop: 6 }}>
                      La primera imagen se usará como foto principal. Máximo 5 fotos.
                    </p>
                  </div>
                )}

                {/* ── Form fields ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">SKU *</label>
                    <input className="form-input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select className="form-input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                      <option value="">Seleccionar</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marca *</label>
                    <select className="form-input" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} required>
                      <option value="">Seleccionar</option>
                      {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio unitario (Q) *</label>
                    <input type="number" step="0.01" className="form-input" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo (Q)</label>
                    <input type="number" step="0.01" className="form-input" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock mínimo</label>
                    <input type="number" className="form-input" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-input" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                {/* Note when creating */}
                {!editing && (
                  <p style={{ fontSize: 12, color: 'var(--dark-500)', background: 'var(--primary-50)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--primary-100)' }}>
                    💡 Después de crear el producto podrás agregar fotos desde este mismo formulario.
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {editing ? 'Cerrar' : 'Cancelar'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
