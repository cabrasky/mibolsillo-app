/* ── Forgot Password Page ───────────────────────────────────────────────────── */
import { useState } from 'react';
import { forgotPassword } from '../api';
import { Link } from 'react-router-dom';
import { useLocale, localizeError } from '../i18n';

export default function ForgotPassword() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await forgotPassword(email);
      setMessage(t('auth.forgotSent'));
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
        <h2>{t('auth.recover')}</h2>
        <form onSubmit={handleSubmit}>
          <label>{t('common.email')}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder={t('auth.emailPh')}
          />
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? t('auth.sending') : t('auth.sendLink')}
          </button>
        </form>
        <p className="auth-link">
          <Link to="/login">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
