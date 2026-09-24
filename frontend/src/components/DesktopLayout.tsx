import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Expense } from '../types';
import { useLocale, nextLocale } from '../i18n';
import { useAuth } from '../AuthContext';
import {
  IconPlus, IconList, IconTarget,
  IconTrendingUp, IconRefresh, IconHome, IconGrid, IconUsers,
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

  const pendingCount = useMemo(() => pendingDebtCount(expenses), [expenses]);
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="layout-desktop">
      <nav className="desktop-sidebar" aria-label={t('nav.main')}>
        <div className="header-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4fd1ae" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h13a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a2 2 0 0 1-2-2V7z" /><path d="M4 7l11-3v3" /><circle cx="16" cy="13.5" r="1.2" /></svg>
          </span>
          <span className="header-title">miBolsillo</span>
        </div>
        <button className="btn primary sidebar-addbtn" onClick={onAddClick}>
          <IconPlus size={18} /> {t('nav.newExpense')}
        </button>
        <div className="sidebar-section">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`sidebar-item ${currentTab === item.key ? 'active' : ''}`}
              aria-current={currentTab === item.key ? 'page' : undefined}
              onClick={() => navigate(item.path)}
            >
              {item.icon}<span>{t(item.i18nKey)}</span>
              {item.key === 'pending' && pendingCount > 0 && <span className="sidebar-badge">{pendingCount}</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          {user && (
            <button className="user-card" onClick={() => navigate('/profile')} title={t('nav.profile')}>
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
      <div className="desktop-main">
        <header className="desktop-header">
          <div className="header-actions">
            <button className="theme-btn" onClick={() => setLocale(nextLocale(locale))} title={t('lang.select')} aria-label={t('lang.select')}>
              {locale.toUpperCase()}
            </button>
            <button className="layout-toggle-btn" onClick={() => onLayoutChange(layout === 'desktop' ? 'mobile' : 'desktop')} title={layout === 'desktop' ? t('nav.mobile') : t('nav.desktop')} aria-label={layout === 'desktop' ? t('nav.mobile') : t('nav.desktop')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
            </button>
            <button className="theme-btn" onClick={onToggleDark} title={t('theme.toggle')} aria-label={t('theme.toggle')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {dark ? <><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></> : <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
              </svg>
            </button>
            <button className="theme-btn" onClick={onExportCSV} title={t('common.exportCsv')} aria-label={t('common.exportCsv')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
            </button>
            <button className="theme-btn" onClick={onExportJSON} title={t('common.backupJson')} aria-label={t('common.backupJson')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></svg>
            </button>
          </div>
        </header>
        <main className="desktop-content">{children}</main>
      </div>
    </div>
  );
}
