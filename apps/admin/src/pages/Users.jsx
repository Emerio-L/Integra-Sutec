import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLES = {
  admin:   { label: 'Administrador', cls: 'badge-danger',  desc: 'Acceso total' },
  manager: { label: 'Gerente',       cls: 'badge-primary', desc: 'Puede editar todo excepto usuarios' },
  seller:  { label: 'Vendedor',      cls: 'badge-success', desc: 'Puede ver productos y pedidos' },
  viewer:  { label: 'Visor',         cls: 'badge-gray',    desc: 'Solo lectura' },
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'seller' };

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null);   // null = create, obj = edit
  const [form, setForm]           = useState(EMPTY_FORM);
  const [pwModal, setPwModal]     = useState(null);   // user id for password change
  const [newPw, setNewPw]         = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(u) {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        // Update existing
        const update = { name: form.name, role: form.role, email: form.email };
        await api.patch(`/auth/users/${editUser._id}`, update);
        toast.success('Usuario actualizado');
      } else {
        // Create new
        await api.post('/auth/users', { name: form.name, email: form.email, password: form.password, role: form.role });
        toast.success('Usuario creado ✓');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function toggleStatus(u) {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/auth/users/${u._id}`, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Usuario activado' : 'Usuario desactivado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }

  async function handleDelete(u) {
    if (!confirm(`¿Eliminar al usuario "${u.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/auth/users/${u._id}`);
      toast.success('Usuario eliminado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/auth/users/${pwModal}/password`, { password: newPw });
      toast.success('Contraseña actualizada');
      setPwModal(null);
      setNewPw('');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="empty-state"><p>Cargando...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>Usuarios del Panel</h1>
          <p style={{ fontSize: 13, color: 'var(--dark-500)', marginTop: 4 }}>Solo administradores pueden gestionar usuarios.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Nuevo Usuario
        </button>
      </div>

      {/* Role legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(ROLES).map(([key, r]) => (
          <div key={key} style={{ background: 'white', border: '1px solid var(--dark-100)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${r.cls}`}>{r.label}</span>
            <span style={{ fontSize: 12, color: 'var(--dark-500)' }}>{r.desc}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ opacity: u.status === 'inactive' ? 0.55 : 1 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 13,
                    }}>
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      {u._id === me?._id && <div style={{ fontSize: 11, color: 'var(--primary-600)', fontWeight: 600 }}>Tú</div>}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--dark-600)' }}>{u.email}</td>
                <td><span className={`badge ${ROLES[u.role]?.cls}`}>{ROLES[u.role]?.label || u.role}</span></td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                    {u.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--dark-500)' }}>
                  {new Date(u.created_at).toLocaleDateString('es-GT')}
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️ Editar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setPwModal(u._id); setNewPw(''); }} title="Cambiar contraseña">🔑</button>
                  {u._id !== me?._id && (
                    <>
                      <button
                        className={`btn btn-sm ${u.status === 'active' ? 'btn-warning' : 'btn-secondary'}`}
                        onClick={() => toggleStatus(u)}
                        title={u.status === 'active' ? 'Desactivar' : 'Activar'}
                      >
                        {u.status === 'active' ? '⏸' : '▶'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)} title="Eliminar">×</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="6">
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <div className="empty-state-title">Sin usuarios</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#185fff,#104aeb)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 700, color: 'white' }}>
                  {editUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  {editUser ? `Editando: ${editUser.name}` : 'Completa los datos del nuevo usuario'}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Nombre completo *</label>
                <input className="form-input" type="text" required placeholder="Juan García"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              {/* Email — shown for both create and edit */}
              <div>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required placeholder="correo@empresa.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              {!editUser && (
                <div>
                  <label className="form-label">Contraseña * <span style={{ fontWeight: 400, color: 'var(--dark-400)' }}>(mínimo 6 caracteres)</span></label>
                  <input className="form-input" type="password" required minLength={6} placeholder="••••••••"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              )}

              <div>
                <label className="form-label">Rol</label>
                <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {Object.entries(ROLES).map(([key, r]) => (
                    <option key={key} value={key}>{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>

              {/* Role info */}
              <div style={{ background: '#eef6ff', border: '1px solid #d9eaff', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#1e3a8a' }}>
                <strong>{ROLES[form.role]?.label}:</strong> {ROLES[form.role]?.desc}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Guardando...' : editUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {pwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg,#185fff,#104aeb)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 700, color: 'white' }}>Cambiar Contraseña</div>
              <button onClick={() => setPwModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
            <form onSubmit={handlePasswordChange} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Nueva contraseña * <span style={{ fontWeight: 400, color: 'var(--dark-400)' }}>(mínimo 6 caracteres)</span></label>
                <input className="form-input" type="password" required minLength={6} placeholder="••••••••"
                  value={newPw} onChange={e => setNewPw(e.target.value)} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPwModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
