import { useState, useEffect, useMemo, useRef } from 'react';
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
    unit_price: '', cost_price: '', current_stock: 0, minimum_stock: 5,
  });

  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const fileInputRef = useRef(null);
  const pendingPreviews = useMemo(() => pendingImages.map((file) => URL.createObjectURL(file)), [pendingImages]);

  useEffect(() => () => {
    pendingPreviews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [pendingPreviews]);

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
    setPendingImages([]);
    setForm({ sku: '', name: '', description: '', category_id: '', brand_id: '', unit_price: '', cost_price: '', current_stock: 0, minimum_stock: 5 });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setPendingImages([]);
    setForm({
      sku: p.sku || '', name: p.name, description: p.description || '',
      category_id: p.category_id?._id || p.category_id,
      brand_id: p.brand_id?._id || p.brand_id,
      unit_price: p.unit_price, cost_price: p.cost_price,
      current_stock: p.current_stock ?? 0, minimum_stock: p.minimum_stock,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSavingProduct(true);
    try {
      let saved;
      if (editing) {
        const { current_stock: _inventoryManagedByMovements, ...editableFields } = form;
        const res = await api.put(`/products/${editing._id}`, editableFields);
        saved = res.data.data;
        toast.success('Producto actualizado');
      } else {
        const res = await api.post('/products', form);
        saved = res.data.data;
        for (const image of pendingImages) saved = await uploadImage(image, saved) || saved;
        setPendingImages([]);
        toast.success(pendingImages.length ? 'Producto e imágenes creados correctamente' : 'Producto creado correctamente');
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
    } finally {
      setSavingProduct(false);
    }
  }

  async function uploadImage(file, target = editing) {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }
    if (!target?._id) {
      setPendingImages((current) => current.length >= 5 ? current : [...current, file]);
      toast.success('Imagen lista para subir al crear el producto');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/products/${target._id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res.data.data;
      setEditing(updated);
      // Update in main list too
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      toast.success('Imagen subida');
      return updated;
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

  async function handleFiles(fileList) {
    const available = editing ? Math.max(0, 5 - currentImages.length) : Math.max(0, 5 - pendingImages.length);
    const files = Array.from(fileList).slice(0, available);
    if (!files.length) return toast.error('Puedes agregar un máximo de 5 imágenes');
    let target = editing;
    for (const file of files) {
      target = await uploadImage(file, target) || target;
    }
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
    handleFiles(e.dataTransfer.files);
  }

  function formatQ(n) { return `Q${Number(n).toFixed(2)}`; }
  function mediaUrl(path) { return path ? (/^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`) : null; }
  function getMainImage(p) { return p.images && p.images.length > 0 ? mediaUrl(p.images[0]) : null; }
  const currentImages = editing?.images || [];

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
                <td><span className="badge badge-gray">{p.sku || '—'}</span></td>
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
            className="modal-content product-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header product-editor-header">
              <div>
                <span className="product-editor-eyebrow">{editing ? 'Gestión de catálogo' : 'Nuevo registro'}</span>
                <h2>{editing ? editing.name : 'Crear producto'}</h2>
                <p>Organiza la información y los recursos visuales del producto.</p>
              </div>
              <button className="product-editor-close" onClick={() => setShowModal(false)} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body product-editor-body">
                <section className="product-media-panel">
                  <div className="product-media-heading">
                    <div><span>Imágenes del producto</span><small>{editing ? `${currentImages.length} de 5 imágenes` : `${pendingImages.length} de 5 seleccionadas`}</small></div>
                    {(editing ? currentImages.length < 5 : pendingImages.length < 5) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Seleccionar</button>}
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
                  <div
                    className={`product-drop-zone ${dragOver ? 'dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {pendingPreviews.length ? (
                      <div className="product-image-gallery">
                        {pendingPreviews.map((preview, idx) => <div className={idx === 0 ? 'product-image-tile principal' : 'product-image-tile'} key={preview} onClick={(e) => e.stopPropagation()}>
                          <img src={preview} alt={`Imagen seleccionada ${idx + 1}`} />
                          {idx === 0 && <span>Principal</span>}
                          <button type="button" onClick={() => setPendingImages((items) => items.filter((_, index) => index !== idx))} aria-label={`Quitar foto ${idx + 1}`}>×</button>
                        </div>)}
                      </div>
                    ) : currentImages.length ? (
                      <div className="product-image-gallery">
                        {currentImages.map((img, idx) => (
                          <div className={idx === 0 ? 'product-image-tile principal' : 'product-image-tile'} key={img} onClick={(e) => e.stopPropagation()}>
                            <img src={mediaUrl(img)} alt={`Foto ${idx + 1}`} />
                            {idx === 0 && <span>Principal</span>}
                            <button type="button" onClick={() => deleteImage(img)} aria-label={`Eliminar foto ${idx + 1}`}>×</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="product-drop-empty">
                        <span className="product-upload-icon">↥</span>
                        <strong>Arrastra una o varias imágenes aquí</strong>
                        <small>o haz clic para seleccionarlas</small>
                        <em>JPG, PNG, WebP o AVIF · máximo 5 MB</em>
                      </div>
                    )}
                    {uploading && <div className="product-uploading">Procesando imagen…</div>}
                  </div>
                  {pendingImages.length > 0 && <button type="button" className="clear-pending-image" onClick={() => setPendingImages([])}>Quitar imágenes seleccionadas</button>}
                </section>

                {/* ── Form fields ── */}
                <div className="product-fields-grid">
                  <div className="form-group">
                    <label className="form-label">SKU <span className="optional-label">Opcional</span></label>
                    <input className="form-input" placeholder="Código interno, si aplica" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría <span className="optional-label">Opcional</span></label>
                    <select className="form-input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Sin categoría</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marca <span className="optional-label">Opcional</span></label>
                    <select className="form-input" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                      <option value="">Sin marca</option>
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
                    <label className="form-label">Existencias disponibles *</label>
                    <input type="number" min="0" className="form-input" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} readOnly={Boolean(editing)} required />
                    <small className="form-help">{editing ? 'Las existencias se actualizan desde Movimientos para conservar el historial.' : 'Cantidad inicial disponible para venta, por ejemplo 5 o 7.'}</small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alerta de stock mínimo</label>
                    <input type="number" min="0" className="form-input" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} />
                    <small className="form-help">Solo indica cuándo mostrar una alerta de inventario bajo.</small>
                  </div>
                </div>
                <div className="form-group product-description-field">
                  <label className="form-label">Descripción <span className="optional-label">Opcional</span></label>
                  <textarea className="form-input product-description-input" rows="4" placeholder="Describe beneficios, uso y características principales…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                {!editing && <p className="product-create-note">El producto y las imágenes seleccionadas se guardarán juntos. La primera será la imagen principal.</p>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {editing ? 'Cerrar' : 'Cancelar'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingProduct || uploading}>
                  {savingProduct ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
