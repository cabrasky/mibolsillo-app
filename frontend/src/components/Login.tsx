/* ── Login Page ─────────────────────────────────────────────────────────────── */
import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale, localizeError } from '../i18n';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
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
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <button className="btn google-btn" onClick={googleLogin}>
          Continuar con Google
        </button>
        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
        <p className="auth-link">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
      </div>
    </div>
  );
}
