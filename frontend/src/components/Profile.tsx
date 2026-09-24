/* ── Perfil: editar mi usuario (nombre, avatar) y cambiar contraseña ────────── */
import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { updateMe, changePassword } from '../api';
import { useLocale, localizeError } from '../i18n';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useLocale();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMsg(null);
      const updated = await updateMe({ name: name.trim() || undefined, avatar_url: avatarUrl.trim() });
      if (updated) {
        setName(updated.name);
        setAvatarUrl(updated.avatar_url);
        await refreshUser();
      }
      setMsg({ ok: true, text: 'Perfil guardado ✅' });
    } catch (e: any) {
      setMsg({ ok: false, text: localizeError(e, t) });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    try {
      setMsg(null);
      if (newPassword.length < 6) {
        setMsg({ ok: false, text: t('error.passwordLength') });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMsg({ ok: false, text: t('error.passwordMismatch') });
        return;
      }
      setSaving(true);
      const res = await changePassword(currentPassword, newPassword);
      setMsg({ ok: true, text: res.message + ' ✅' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMsg({ ok: false, text: localizeError(e, t) });
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Mi perfil</h2>
      </div>

      <div className="admin-section">
        <h3>👤 Datos personales</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" width={56} height={56} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border, rgba(0,0,0,.1))' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700 }}>
              {(user.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{user.email}{user.is_admin ? ' · admin' : ''}</div>
          </div>
        </div>
        <div className="auth-form">
          <label>Nombre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
          <label>Avatar (URL)</label>
          <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://... (opcional)" />
          <button className="btn primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>

      <div className="admin-section">
        <h3>🔑 Cambiar contraseña</h3>
        <div className="auth-form">
          <label>Contraseña actual</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Deja en blanco si solo entras con Google" autoComplete="current-password" />
          <label>Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          <label>Repetir nueva contraseña</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña" autoComplete="new-password" />
          <button className="btn primary" onClick={handleChangePassword} disabled={saving}>
            {saving ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
          <p className="hint" style={{ marginTop: 8 }}>
            Si entras con Google y no tienes contraseña, puedes crear una aquí (déjala en blanco la actual). El email no se puede cambiar.
          </p>
        </div>
      </div>

      {msg && <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p>}
    </div>
  );
}
