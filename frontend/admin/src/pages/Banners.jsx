import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const EMPTY = { title: '', subtitle: '', mediaType: 'IMAGE', altText: '', isActive: true, displayOrder: 0, startsAt: '', endsAt: '', removeMobileImage: false, removeMobileVideo: false };
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 30 * 1024 * 1024;

function Preview({ banner, compact = false }) {
  const poster = banner.posterImageUrl || banner.desktopImageUrl;
  return <div className={`banner-preview ${compact ? 'compact' : ''}`}>
    {banner.mediaType === 'VIDEO' && banner.desktopVideoUrl
      ? <video src={banner.desktopVideoUrl} poster={poster} muted loop playsInline controls preload="metadata" />
      : banner.desktopImageUrl ? <img src={banner.desktopImageUrl} alt={banner.altText || ''} /> : <span>Sin contenido</span>}
  </div>;
}

export default function Banners() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState({});
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(null);
  const localPreview = useMemo(() => ({ ...form,
    desktopImageUrl: files.desktopImage ? URL.createObjectURL(files.desktopImage) : editing?.desktopImageUrl,
    desktopVideoUrl: files.desktopVideo ? URL.createObjectURL(files.desktopVideo) : editing?.desktopVideoUrl,
    posterImageUrl: files.posterImage ? URL.createObjectURL(files.posterImage) : editing?.posterImageUrl,
  }), [form, files, editing]);

  async function load() { try { const { data } = await api.get('/v1/admin/banners'); setItems(data.items || []); } catch (e) { toast.error(e.response?.data?.error || 'No fue posible cargar banners'); } }
  useEffect(() => { load(); }, []);
  function show(item = null) { setEditing(item); setForm(item ? { ...EMPTY, ...item, startsAt: item.startsAt?.slice(0,16) || '', endsAt: item.endsAt?.slice(0,16) || '' } : EMPTY); setFiles({}); setOpen(true); }
  function choose(name, selected) {
    if (!selected) return;
    const video = name.toLowerCase().includes('video');
    if (selected.size > (video ? MAX_VIDEO : MAX_IMAGE)) return toast.error(video ? 'El video supera 30 MB' : 'La imagen supera 8 MB');
    setFiles(v => ({ ...v, [name]: selected }));
  }
  async function save(e) {
    e.preventDefault();
    if (form.mediaType === 'IMAGE' && !files.desktopImage && !editing?.desktopImageUrl) return toast.error('Selecciona una imagen de escritorio');
    if (form.mediaType === 'VIDEO' && !files.desktopVideo && !editing?.desktopVideoUrl) return toast.error('Selecciona un video de escritorio');
    if (form.mediaType === 'VIDEO' && !files.posterImage && !editing?.posterImageUrl) return toast.error('Selecciona el poster obligatorio');
    const body = new FormData(); Object.entries(form).forEach(([k,v]) => body.append(k, v ?? '')); Object.entries(files).forEach(([k,v]) => body.append(k, v));
    setSaving(true);
    try { editing ? await api.put(`/v1/admin/banners/${editing.id}`, body) : await api.post('/v1/admin/banners', body); toast.success(editing ? 'Banner actualizado' : 'Banner creado'); setOpen(false); await load(); }
    catch (err) { toast.error(err.response?.data?.error || 'No fue posible guardar el banner'); }
    finally { setSaving(false); }
  }
  async function toggle(item) { try { await api.patch(`/v1/admin/banners/${item.id}/status`, { isActive: !item.isActive }); await load(); } catch { toast.error('No fue posible cambiar el estado'); } }
  async function remove(item) { if (!confirm(`¿Eliminar “${item.title}” y sus archivos?`)) return; try { await api.delete(`/v1/admin/banners/${item.id}`); toast.success('Banner eliminado'); await load(); } catch { toast.error('No fue posible eliminar'); } }

  return <>
    <div className="flex-between mb-6"><div><h1 className="page-title">Banner principal</h1><p className="page-description">Contenido del sitio · imágenes y videos almacenados en Cloudinary</p></div><button className="btn btn-primary" onClick={() => show()}>+ Nuevo banner</button></div>
    <div className="card banner-list"><table className="data-table"><thead><tr><th>Vista</th><th>Tipo</th><th>Título</th><th>Estado</th><th>Orden</th><th>Fechas</th><th>Acciones</th></tr></thead><tbody>
      {items.map(item => <tr key={item.id}><td><Preview banner={item} compact /></td><td><span className="badge badge-info">{item.mediaType === 'VIDEO' ? 'Video' : 'Imagen'}</span></td><td><strong>{item.title}</strong><small className="table-subtitle">{item.altText || 'Sin texto alternativo'}</small></td><td><button className={`badge status-button ${item.isActive ? 'badge-success' : 'badge-gray'}`} onClick={() => toggle(item)}>{item.isActive ? 'Activo' : 'Inactivo'}</button></td><td>{item.displayOrder}</td><td className="banner-dates">{item.startsAt ? new Date(item.startsAt).toLocaleDateString() : 'Inmediato'}<br/>{item.endsAt ? `hasta ${new Date(item.endsAt).toLocaleDateString()}` : 'sin fin'}</td><td><div className="banner-actions"><button className="btn btn-sm btn-secondary" onClick={() => setPreviewing(item)}>Ver</button><button className="btn btn-sm btn-secondary" onClick={() => show(item)}>Editar</button><button className="btn btn-sm btn-danger" onClick={() => remove(item)}>Eliminar</button></div></td></tr>)}
      {!items.length && <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-title">No hay banners configurados</div><p>La tienda continuará mostrando productos destacados como respaldo.</p></div></td></tr>}
    </tbody></table></div>
    {open && <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setOpen(false); }}><form className="modal-content banner-modal" onSubmit={save}><div className="modal-header"><h2>{editing ? 'Editar banner' : 'Nuevo banner'}</h2><button type="button" className="modal-close" disabled={saving} onClick={() => setOpen(false)}>×</button></div><div className="modal-body">
      <div className="grid-2"><label className="form-group"><span className="form-label">Título *</span><input className="form-input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="form-group"><span className="form-label">Tipo *</span><select className="form-input" value={form.mediaType} onChange={e=>setForm({...form,mediaType:e.target.value})}><option value="IMAGE">Imagen</option><option value="VIDEO">Video</option></select></label></div>
      <label className="form-group"><span className="form-label">Subtítulo</span><input className="form-input" value={form.subtitle || ''} onChange={e=>setForm({...form,subtitle:e.target.value})}/></label>
      <label className="form-group"><span className="form-label">Texto alternativo</span><input className="form-input" value={form.altText || ''} onChange={e=>setForm({...form,altText:e.target.value})}/></label>
      {form.mediaType === 'IMAGE' ? <><div className="grid-2"><FileField label="Imagen escritorio *" accept="image/jpeg,image/png,image/webp,image/avif" onChange={f=>choose('desktopImage',f)}/><FileField label="Imagen móvil (opcional)" accept="image/jpeg,image/png,image/webp,image/avif" onChange={f=>choose('mobileImage',f)}/></div>{editing?.mobileImageUrl && <button type="button" className="btn btn-sm btn-secondary" onClick={()=>setForm({...form,removeMobileImage:true})}>{form.removeMobileImage ? 'Imagen móvil se eliminará' : 'Eliminar imagen móvil'}</button>}</> : <><div className="grid-2"><FileField label="Video escritorio *" accept="video/mp4,video/webm,video/quicktime" onChange={f=>choose('desktopVideo',f)}/><FileField label="Video móvil (opcional)" accept="video/mp4,video/webm,video/quicktime" onChange={f=>choose('mobileVideo',f)}/></div>{editing?.mobileVideoUrl && <button type="button" className="btn btn-sm btn-secondary" onClick={()=>setForm({...form,removeMobileVideo:true})}>{form.removeMobileVideo ? 'Video móvil se eliminará' : 'Eliminar video móvil'}</button>}<FileField label="Imagen poster *" accept="image/jpeg,image/png,image/webp,image/avif" onChange={f=>choose('posterImage',f)}/><p className="upload-help">MP4 recomendado · 3–15 segundos · máximo 20 segundos y 30 MB.</p></>}
      <Preview banner={localPreview}/>
      <div className="grid-2 mt-4"><label className="form-group"><span className="form-label">Inicio (opcional)</span><input type="datetime-local" className="form-input" value={form.startsAt || ''} onChange={e=>setForm({...form,startsAt:e.target.value})}/></label><label className="form-group"><span className="form-label">Fin (opcional)</span><input type="datetime-local" className="form-input" value={form.endsAt || ''} onChange={e=>setForm({...form,endsAt:e.target.value})}/></label></div>
      <div className="grid-2"><label className="form-group"><span className="form-label">Orden</span><input type="number" className="form-input" value={form.displayOrder} onChange={e=>setForm({...form,displayOrder:e.target.value})}/></label><label className="check-field"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/> Banner activo</label></div>
    </div><div className="modal-footer"><button type="button" className="btn btn-secondary" disabled={saving} onClick={()=>setOpen(false)}>Cancelar</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Subiendo y procesando…' : 'Guardar banner'}</button></div></form></div>}
    {previewing && <div className="modal-overlay" onClick={()=>setPreviewing(null)}><div className="modal-content banner-modal" onClick={e=>e.stopPropagation()}><div className="modal-header"><h2>{previewing.title}</h2><button className="modal-close" onClick={()=>setPreviewing(null)}>×</button></div><div className="modal-body"><Preview banner={previewing}/></div></div></div>}
  </>;
}

function FileField({ label, accept, onChange }) { return <label className="form-group file-field"><span className="form-label">{label}</span><input type="file" className="form-input" accept={accept} onChange={e=>onChange(e.target.files?.[0])}/></label>; }
