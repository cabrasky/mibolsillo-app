/* ── Admin · Configuración: Google OAuth y SMTP ────────────────────────────── */
import { useState, useEffect } from 'react';
import { getOAuthConfig, updateOAuthConfig, getSmtpConfig, updateSmtpConfig } from '../../api';
import { useLocale, localizeError } from '../../i18n';
import { IconLock, IconMail, IconCheckCircle, IconAlertCircle } from '../Icons';

export default function AdminConfig() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // OAuth state
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [oauthEnabled, setOauthEnabled] = useState(false);

  // SMTP state
  const [smtpHost, setSmtpHost] = useState('mail.cabrasky.net');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Gastos App');
  const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);

  useEffect(() => { loadConfig(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConfig = async () => {
    try {
      setMsg(null);
      const [oauthData, smtpData] = await Promise.all([
        getOAuthConfig(),
        getSmtpConfig(),
      ]);
      const google = oauthData.configs.find(c => c.provider === 'google');
      if (google) {
        setClientId(google.client_id);
        setRedirectUri(google.redirect_uri);
        setOauthEnabled(google.enabled);
      }
      setSmtpHost(smtpData.host);
      setSmtpPort(smtpData.port);
      setSmtpUser(smtpData.user);
      setSmtpFromEmail(smtpData.from_email);
      setSmtpFromName(smtpData.from_name);
      setSmtpPasswordSet(smtpData.password_set);
    } catch (e: any) {
      setMsg({ ok: false, text: localizeError(e, t) });
    }
    setLoading(false);
  };

  const handleSaveOAuth = async () => {
    try {
      setSaving('oauth');
      setMsg(null);
      await updateOAuthConfig({
        provider: 'google',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        enabled: oauthEnabled,
      });
      setMsg({ ok: true, text: t('admin.oauthSaved') });
    } catch (e: any) {
      setMsg({ ok: false, text: localizeError(e, t) });
    }
    setSaving(null);
  };

  const handleSaveSmtp = async () => {
    try {
      setSaving('smtp');
      setMsg(null);
      await updateSmtpConfig({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        password: smtpPassword,
        from_email: smtpFromEmail,
        from_name: smtpFromName,
      });
      setSmtpPassword('');
      setSmtpPasswordSet(true);
      setMsg({ ok: true, text: t('admin.smtpSaved') });
    } catch (e: any) {
      setMsg({ ok: false, text: localizeError(e, t) });
    }
    setSaving(null);
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div className="adm-stack">
      <div className="admin-section">
        <h3 className="h3-icon"><IconLock size={18} />Google OAuth</h3>
        <p className="hint">
          {t('admin.oauthHintA')}{' '}
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console</a>.
          {' '}{t('admin.oauthHintB')} <code>{redirectUri || window.location.origin + '/api/auth/google/callback'}</code>
        </p>
        <div className="auth-form">
          <label>Client ID</label>
          <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Google OAuth Client ID" />
          <label>Client Secret</label>
          <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Google OAuth Client Secret" />
          <label>Redirect URI</label>
          <input type="text" value={redirectUri} onChange={e => setRedirectUri(e.target.value)} placeholder="https://gastos.cabrasky.net/api/auth/google/callback" />
          <label className="checkbox-label">
            <input type="checkbox" checked={oauthEnabled} onChange={e => setOauthEnabled(e.target.checked)} />
            {' '}{t('admin.oauthEnabled')}
          </label>
          <button className="btn primary" onClick={handleSaveOAuth} disabled={saving === 'oauth'}>
            {saving === 'oauth' ? t('common.saving') : t('admin.saveOauth')}
          </button>
        </div>
      </div>

      <div className="admin-section">
        <h3 className="h3-icon"><IconMail size={18} />{t('admin.smtpTitle')}</h3>
        <p className="hint">
          {t('admin.smtpHint')}
        </p>
        <div className="auth-form">
          <label>Host</label>
          <input type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="mail.cabrasky.net" />
          <label>{t('admin.port')}</label>
          <input type="number" value={smtpPort} onChange={e => setSmtpPort(Number(e.target.value))} placeholder="587" />
          <label>{t('admin.user')}</label>
          <input type="text" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="gastos@cabrasky.net" />
          <label>{t('auth.password')} {smtpPasswordSet && <span className="hint">{t('admin.passwordSet')}</span>}</label>
          <input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} placeholder={smtpPasswordSet ? t('admin.passwordKeepPh') : t('admin.smtpPasswordPh')} />
          <label>{t('admin.fromEmail')}</label>
          <input type="email" value={smtpFromEmail} onChange={e => setSmtpFromEmail(e.target.value)} placeholder="gastos@cabrasky.net" />
          <label>{t('admin.fromName')}</label>
          <input type="text" value={smtpFromName} onChange={e => setSmtpFromName(e.target.value)} placeholder="Gastos App" />
          <button className="btn primary" onClick={handleSaveSmtp} disabled={saving === 'smtp'}>
            {saving === 'smtp' ? t('common.saving') : t('admin.saveSmtp')}
          </button>
        </div>
      </div>

      {msg && <p className={`msg-line ${msg.ok ? 'success' : 'error'}`}>{msg.ok ? <IconCheckCircle size={16} /> : <IconAlertCircle size={16} />}{msg.text}</p>}
    </div>
  );
}
