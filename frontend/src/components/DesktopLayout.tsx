import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { expenseCost, getMonth } from '../types';
import type { Expense } from '../types';
import { useLocale } from '../i18n';
import { useAuth } from '../AuthContext';
import {
  IconPlus, IconList, IconTarget,
  IconTrendingUp, IconEuro, IconCalendar, IconRefresh, IconHome, IconGrid, IconUsers,
} from './Icons';
import { pendingDebtCount } from '../personas';

export type Tab = 'dashboard' | 'expenses' | 'incomes' | 'goals' | 'subs' | 'projects' | 'pending' | 'more';

function pathToTab(pathname: string): Tab | null {
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname === '/expenses') return 'expenses';
  if (pathname === '/incomes') return 'incomes';
  if (pathname === '/goals') return 'goals';
  if (pathname === '/subs') return 'subs';
  if (pathname === '/projects' || pathname.startsWith('/projects/')) return 'projects';
  if (pathname === '/pending') return 'pending';
  if (pathname === '/more' ||pathname.startsWith('/more/')) return 'more';
  return null;
}

const NAV_ITEMS: { key: Tab; icon: React.ReactNode; i18nKey: string; path: string }[] = [
  { key: 'dashboard', icon: <IconHome size={19} />, i18nKey: 'nav.dashboard', path: '/dashboard' },
  { key: 'expenses', icon: <IconList size={19} />, i18nKey: 'nav.expenses', path: '/expenses' },
  { key: 'incomes', icon: <IconTrendingUp size={19} />, i18nKey: 'nav.incomes', path: '/incomes' },
  { key: 'goals', icon: <IconTarget size={19} />, i18nKey: 'nav.goals', path: '/goals' },
  { key: 'subs', icon: <IconRefresh size={19} />, i18nKey: 'nav.subs', path: '/subs' },
  {
    key: 'projects', icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    ), i18nKey: 'nav.projects', path: '/projects',
  },
  { key: 'pending', icon: <IconUsers size={19} />, i18nKey: 'nav.debts', path: '/pending' },
  { key: 'more', icon: <IconGrid size={19} />, i18nKey: 'nav.more', path: '/more' },
];

const fmtEuro = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  children: React.ReactNode;
  expenses: Expense[];
  onAddClick: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  layout: 'desktop' | 'mobile';
  onLayoutChange: (l: 'desktop' | 'mobile') => void;
}

export default function DesktopLayout({
  children, expenses, onAddClick,
  dark, onToggleDark, onExportCSV, onExportJSON,
  layout, onLayoutChange,
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentTab = pathToTab(location.pathname);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const totalYear = expenses.filter(e => e.date?.startsWith(String(thisYear))).reduce((s, e) => s + expenseCost(e), 0);
    const thisMonthExps = expenses.filter(e => getMonth(e.date) === thisMonth && e.date?.startsWith(String(thisYear)));
    const totalMonth = thisMonthExps.reduce((s, e) => s + expenseCost(e), 0);
    const monthCount = thisMonthExps.length;
    const avgMonth = monthCount > 0 ? totalMonth / monthCount : 0;
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const weekSpent = expenses.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d >= weekAgo && d <= now;
    }).reduce((s, e) => s + expenseCost(e), 0);
    return { totalYear, totalMonth, monthCount, avgMonth, weekSpent };
  }, [expenses]);
  const pendingCount = useMemo(() => pendingDebtCount(expenses), [expenses]);
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="layout-desktop">
      <header className="desktop-header">
        <div className="header-brand">
          <img src="/logo.png" alt="miBolsillo" className="brand-logo" />
          <span className="header-title">miBolsillo</span>
        </div>
        <div className="header-stats">
          <div className="hs-item"><IconEuro size={13} /><span className="hs-label">{t('dashboard.thisMonth')}</span><span className="hs-value">{fmtEuro(stats.totalMonth)}</span></div>
          <div className="hs-item"><IconTrendingUp size={13} /><span className="hs-label">{t('monthly.totalYear')}</span><span className="hs-value">{fmtEuro(stats.totalYear)}</span></div>
          <div className="hs-item"><IconCalendar size={13} /><span className="hs-label">7d</span><span className="hs-value">{fmtEuro(stats.weekSpent)}</span></div>
        </div>
        <div className="header-actions">
          <button className="theme-btn" onClick={() => setLocale(locale === 'es' ? 'en' : locale === 'en' ? 'pt' : 'es')} title={t('lang.select')}>
            <span style={{ fontWeight: 700, fontSize: '.78rem' }}>{locale.toUpperCase()}</span>
          </button>
          <button className="layout-toggle-btn" onClick={() => onLayoutChange(layout === 'desktop' ? 'mobile' : 'desktop')} title={layout === 'desktop' ? t('nav.mobile') : t('nav.desktop')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
          <button className="theme-btn" onClick={onToggleDark} title={t('theme.toggle')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {dark ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
            </svg>
          </button>
          <button className="theme-btn" onClick={onExportCSV} title="CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button className="theme-btn" onClick={onExportJSON} title="JSON">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
        </div>
      </header>
      <div className="desktop-body">
        <nav className="desktop-sidebar">
          <div className="sidebar-section">
            <button className="btn primary sidebar-addbtn" onClick={onAddClick}>
              <IconPlus size={16} /> Nuevo gasto
            </button>
            <div className="sidebar-label">{t('nav.more')}</div>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                className={`sidebar-item ${currentTab === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}<span>{t(item.i18nKey)}</span>
                {item.key === 'pending' && pendingCount > 0 && <span className="sidebar-badge">{pendingCount}</span>}
              </button>
            ))}
          </div>
          <div className="sidebar-footer">
            {user && (
              <button className="user-card" onClick={() => navigate('/profile')} title="Mi perfil">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="user-avatar" />
                ) : (
                  <span className="user-avatar user-avatar-fallback">{(user.name || '?').charAt(0).toUpperCase()}</span>
                )}
                <span className="user-meta">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                </span>
              </button>
            )}
          </div>
        </nav>
        <main className="desktop-content">{children}</main>
      </div>
    </div>
  );
}
