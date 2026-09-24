/* ── Register Page ──────────────────────────────────────────────────────────── */
import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale, localizeError } from '../i18n';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('error.passwordLength'));
      return;
    }
    setBusy(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(localizeError(err, t));
    }
    setBusy(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'left', marginBottom: 4 }}>
          <Link to="/" className="back-link">← Volver a la portada</Link>
        </div>
        <h1>Gastos App</h1>
        <h2>Crear cuenta</h2>
        <form onSubmit={handleSubmit}>
          <label>Nombre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          {error && <p className="error">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
