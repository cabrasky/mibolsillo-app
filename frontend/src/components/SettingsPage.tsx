/* ── Configuración: preferencias, perfil y datos ─────────────────────────────
   Reúne lo que antes estaba suelto en la cabecera (idioma, tema, exportar CSV)
   y el perfil (nombre, avatar, contraseña). */
import { Link } from 'react-router-dom';
import type { Expense } from '../types';
import { useLocale } from '../i18n';
import { usePreferences } from '../PreferencesContext';
import { exportExpensesCsv } from '../exportCsv';
import PreferencesForm from './PreferencesForm';
import Profile from './Profile';
import { IconSettings, IconDownload } from './Icons';

export default function SettingsPage({ expenses }: { expenses: Expense[] }) {
  const { t } = useLocale();
  const prefs = usePreferences();

  return (
    <div className="settings-page">
      <section className="admin-section">
        <h3 className="h3-icon"><IconSettings size={18} />{t('settings.prefs')}</h3>
        <p className="hint">{t('settings.prefsHint')}</p>
        <PreferencesForm value={prefs} onChange={p => prefs.setPrefs(p)} />
      </section>

      <Profile />

      <section className="admin-section">
        <h3 className="h3-icon"><IconDownload size={18} />{t('settings.data')}</h3>
        <p className="hint">{t('settings.dataHint')}</p>
        <div className="row-actions">
          <button type="button" className="btn outline" onClick={() => exportExpensesCsv(expenses)}>
            <IconDownload size={16} />{t('common.exportCsv')}
          </button>
          <Link to="/excel" className="btn outline">{t('more.excel')}</Link>
        </div>
      </section>
    </div>
  );
}
