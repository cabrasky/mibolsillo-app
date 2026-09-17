import { Link } from 'react-router-dom';
import { IconChart, IconTarget, IconWallet, IconRefresh, IconCheck } from './Icons';
import { useAuth } from '../AuthContext';

const ITEMS = [
  { key: 'monthly', icon: <IconChart size={28} />, label: 'Resumen mensual', desc: 'Buckets + gráficas del mes', path: '/more/monthly' },
  { key: 'weekly', icon: <IconTarget size={28} />, label: 'Resumen semanal', desc: 'Presupuesto 50 €/semana', path: '/more/weekly' },
  { key: 'debts', icon: <IconWallet size={28} />, label: 'Deudas', desc: 'Gastos compartidos pendientes', path: '/more/debts' },
  { key: 'subs', icon: <IconRefresh size={28} />, label: 'Suscripciones', desc: 'Gestiona tus suscripciones', path: '/subs' },
  { key: 'sanity', icon: <IconCheck size={28} />, label: 'Sanidad financiera', desc: 'Ratios y alertas', path: '/more/sanity' },
];

export default function MoreMenu() {
  const { user, logout } = useAuth();
  return (
    <div className="more-grid">
      {ITEMS.map(item => (
        <Link key={item.key} to={item.path} className="more-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="more-icon">{item.icon}</div>
          <div className="more-label">{item.label}</div>
          <div className="more-desc">{item.desc}</div>
        </Link>
      ))}
      <Link to="/projects" className="more-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="more-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div className="more-label">Proyectos</div>
        <div className="more-desc">Desglose por proyecto</div>
      </Link>
      <Link to="/excel" className="more-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="more-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div className="more-label">Excel</div>
        <div className="more-desc">Plantilla, importar y exportar</div>
      </Link>
      <Link to="/help" className="more-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="more-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div className="more-label">Cómo se usa</div>
        <div className="more-desc">Guía rápida</div>
      </Link>
      <Link to="/developer" className="more-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="more-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </div>
        <div className="more-label">Desarrollador</div>
        <div className="more-desc">API y claves de acceso</div>
      </Link>
      <Link to="/categories" className="more-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="more-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div className="more-label">Categorías</div>
        <div className="more-desc">Crea y renombra las tuyas</div>
      </Link>
      <Link to="/profile" className="more-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="more-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div className="more-label">Perfil</div>
        <div className="more-desc">Cuenta y contraseña</div>
      </Link>
      {user?.is_admin && (
        <Link to="/admin" className="more-card admin-card" style={{ textDecoration: 'none' }}>
          <div className="more-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div className="more-label">Admin</div>
          <div className="more-desc">OAuth y SMTP</div>
        </Link>
      )}
      <button type="button" className="more-card admin-card" onClick={logout} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
        <div className="more-icon" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <div className="more-label">Cerrar sesión</div>
        <div className="more-desc">Salir de la cuenta</div>
      </button>
    </div>
  );
}
