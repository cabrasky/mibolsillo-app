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
          <Link to="/" className="back-link">{t('common.backHome')}</Link>
        </div>
        <h1>Gastos App</h1>
        <h2>{t('auth.createAccount')}</h2>
        <form onSubmit={handleSubmit}>
          <label>{t('common.name')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          <label>{t('common.email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>{t('auth.password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          {error && <p className="error">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? t('auth.registering') : t('auth.register')}
          </button>
        </form>
        <p className="auth-link">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
