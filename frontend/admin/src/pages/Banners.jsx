import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const DEFAULT_MEDIA = { mediaType: 'IMAGE', title: 'Banner principal', isActive: true, displayOrder: 0 };
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 30 * 1024 * 1024;

function Preview({ media }) {
  const poster = media.posterImageUrl || media.desktopImageUrl;
  return <div className="banner-preview simple-banner-preview">
    {media.mediaType === 'VIDEO' && media.desktopVideoUrl
      ? <video src={media.desktopVideoUrl} poster={poster} muted loop playsInline controls preload="metadata" />
      : media.desktopImageUrl
        ? <img src={media.desktopImageUrl} alt="Vista previa del banner" />
        : <div className="banner-preview-empty"><strong>Vista previa</strong><span>Selecciona una imagen o video</span></div>}
  </div>;
}

export default function Banners() {
  const [current, setCurrent] = useState(null);
  const [type, setType] = useState('IMAGE');
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/v1/admin/banners').then(({ data }) => {
      const first = data.items?.[0] || null;
      setCurrent(first);
      setType(first?.mediaType || 'IMAGE');
    }).catch(error => toast.error(error.response?.data?.error || 'No fue posible cargar el contenido actual'))
      .finally(() => setLoading(false));
  }, []);

  const preview = useMemo(() => ({ ...current, mediaType: type,
    desktopImageUrl: files.desktopImage ? URL.createObjectURL(files.desktopImage) : current?.desktopImageUrl,
    desktopVideoUrl: files.desktopVideo ? URL.createObjectURL(files.desktopVideo) : current?.desktopVideoUrl,
    posterImageUrl: files.posterImage ? URL.createObjectURL(files.posterImage) : current?.posterImageUrl,
  }), [current, type, files]);

  function selectFile(name, selected) {
    if (!selected) return;
    const isVideo = name.toLowerCase().includes('video');
    if (selected.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) {
      toast.error(isVideo ? 'El video supera el máximo de 30 MB' : 'La imagen supera el máximo de 8 MB');
      return;
    }
    setFiles(previous => ({ ...previous, [name]: selected }));
  }

  function changeType(nextType) {
    setType(nextType);
    setFiles({});
  }

  async function save(event) {
    event.preventDefault();
    if (type === 'IMAGE' && !files.desktopImage && !(current?.mediaType === 'IMAGE' && current.desktopImageUrl)) {
      return toast.error('Selecciona la imagen del banner');
    }
    if (type === 'VIDEO' && !files.desktopVideo && !(current?.mediaType === 'VIDEO' && current.desktopVideoUrl)) {
      return toast.error('Selecciona el video del banner');
    }
    if (type === 'VIDEO' && !files.posterImage && !current?.posterImageUrl) {
      return toast.error('Selecciona una imagen de portada para el video');
    }

    const body = new FormData();
    Object.entries({ ...DEFAULT_MEDIA, mediaType: type }).forEach(([key, value]) => body.append(key, value));
    Object.entries(files).forEach(([key, value]) => body.append(key, value));
    setSaving(true);
    try {
      const { data } = current
        ? await api.put(`/v1/admin/banners/${current.id}`, body, { headers: { 'Content-Type': undefined } })
        : await api.post('/v1/admin/banners', body, { headers: { 'Content-Type': undefined } });
      setCurrent(data.item);
      setFiles({});
      toast.success('Contenido del banner actualizado');
    } catch (error) {
      toast.error(error.response?.data?.error || 'No fue posible actualizar el banner');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card simple-banner-card">Cargando contenido actual…</div>;

  return <div className="simple-banner-page">
    <div className="mb-6">
      <h1 className="page-title">Imagen o video del banner</h1>
      <p className="page-description">Cambia aquí el contenido visual que aparece en la portada.</p>
    </div>

    <form className="card simple-banner-card" onSubmit={save}>
      <div className="media-type-picker" role="radiogroup" aria-label="Tipo de contenido">
        <button type="button" className={type === 'IMAGE' ? 'active' : ''} onClick={() => changeType('IMAGE')}>
          <span className="media-type-icon">▧</span><strong>Imagen</strong><small>JPG, PNG, WebP o AVIF</small>
        </button>
        <button type="button" className={type === 'VIDEO' ? 'active' : ''} onClick={() => changeType('VIDEO')}>
          <span className="media-type-icon">▶</span><strong>Video</strong><small>MP4 recomendado</small>
        </button>
      </div>

      {type === 'IMAGE' ? <div className="simple-upload-grid">
        <FileField label="Imagen principal" help="Obligatoria · máximo 8 MB" accept="image/jpeg,image/png,image/webp,image/avif" selected={files.desktopImage} onChange={file => selectFile('desktopImage', file)} />
        <FileField label="Imagen para celular" help="Opcional" accept="image/jpeg,image/png,image/webp,image/avif" selected={files.mobileImage} onChange={file => selectFile('mobileImage', file)} />
      </div> : <div className="simple-upload-grid">
        <FileField label="Video principal" help="Obligatorio · máximo 20 segundos y 30 MB" accept="video/mp4,video/webm,video/quicktime" selected={files.desktopVideo} onChange={file => selectFile('desktopVideo', file)} />
        <FileField label="Portada del video" help="Obligatoria · se muestra mientras carga" accept="image/jpeg,image/png,image/webp,image/avif" selected={files.posterImage} onChange={file => selectFile('posterImage', file)} />
        <FileField label="Video para celular" help="Opcional" accept="video/mp4,video/webm,video/quicktime" selected={files.mobileVideo} onChange={file => selectFile('mobileVideo', file)} />
      </div>}

      <Preview media={preview} />

      <div className="simple-banner-footer">
        <p>{current ? 'El nuevo archivo reemplazará el contenido actual.' : 'Al guardar se configurará el banner automáticamente.'}</p>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Subiendo y procesando…' : 'Guardar y publicar'}</button>
      </div>
    </form>
  </div>;
}

function FileField({ label, help, accept, selected, onChange }) {
  return <label className="simple-file-field">
    <strong>{label}</strong><span>{help}</span>
    <input type="file" accept={accept} onChange={event => onChange(event.target.files?.[0])} />
    <em>{selected ? selected.name : 'Seleccionar archivo'}</em>
  </label>;
}
