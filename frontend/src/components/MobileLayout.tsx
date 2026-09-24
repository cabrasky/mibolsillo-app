import { useLocation, useNavigate } from 'react-router-dom';
import { IconPlus, IconList, IconTrendingUp, IconEuro, IconGrid, IconHome, IconArrowLeft } from './Icons';
import { useLocale, nextLocale } from '../i18n';

type BottomTab = 'dashboard' | 'expenses' | 'incomes' | 'goals' | 'more';

const BOTTOM_NAV: { key: BottomTab; icon: React.ReactNode; i18nKey: string; path: string }[] = [
  { key: 'dashboard', icon: <IconHome size={20} />, i18nKey: 'nav.dashboard', path: '/dashboard' },
  { key: 'expenses', icon: <IconList size={20} />, i18nKey: 'nav.expenses', path: '/expenses' },
  { key: 'incomes', icon: <IconTrendingUp size={20} />, i18nKey: 'nav.incomes', path: '/incomes' },
  { key: 'goals', icon: <IconEuro size={20} />, i18nKey: 'nav.goals', path: '/goals' },
  { key: 'more', icon: <IconGrid size={20} />, i18nKey: 'nav.more', path: '/more' },
];

// Map paths to header i18n keys and bottom tab
const PATH_INFO: Record<string, { i18nKey: string; parentTab?: BottomTab; titleKey?: string }> = {
  '/dashboard': { i18nKey: 'nav.dashboard' },
  '/expenses': { i18nKey: 'nav.expenses' },
  '/incomes': { i18nKey: 'nav.incomes' },
  '/goals': { i18nKey: 'nav.goals' },
  '/more': { i18nKey: 'nav.more' },
  '/projects': { i18nKey: 'nav.more', titleKey: 'nav.projects', parentTab: 'more' },
  '/profile': { i18nKey: 'nav.more', titleKey: 'more.profile', parentTab: 'more' },
  '/admin': { i18nKey: 'nav.more', titleKey: 'more.admin', parentTab: 'more' },
  '/subs': { i18nKey: 'nav.more', titleKey: 'nav.subs', parentTab: 'more' },
  '/categories': { i18nKey: 'nav.more', titleKey: 'more.categories', parentTab: 'more' },
  '/excel': { i18nKey: 'nav.more', titleKey: 'more.excel', parentTab: 'more' },
  '/help': { i18nKey: 'nav.more', titleKey: 'more.help', parentTab: 'more' },
  '/developer': { i18nKey: 'nav.more', titleKey: 'more.developer', parentTab: 'more' },
  '/more/monthly': { i18nKey: 'nav.monthly', parentTab: 'more' },
  '/more/weekly': { i18nKey: 'nav.weekly', parentTab: 'more' },
  '/pending': { i18nKey: 'nav.debts', parentTab: 'more' },
  '/more/subs': { i18nKey: 'nav.subs', parentTab: 'more' },
  '/more/sanity': { i18nKey: 'nav.check', parentTab: 'more' },
};

const MORE_SUBPATHS = ['/more/monthly', '/more/weekly', '/pending','/more/subs', '/more/sanity'];

function getPathInfo(pathname: string) {
  // Exact match first, then try prefix
  if (PATH_INFO[pathname]) return PATH_INFO[pathname];
  if (pathname.startsWith('/more/')) return PATH_INFO['/more'];
  if (pathname.startsWith('/projects')) return { i18nKey: 'nav.more', titleKey: 'nav.projects', parentTab: 'more' as BottomTab };
  return PATH_INFO['/dashboard'];
}

function currentBottomTab(pathname: string): BottomTab {
  const info = getPathInfo(pathname);
  return info.parentTab || pathname.replace('/', '') as BottomTab;
}

interface Props {
  onAddClick: () => void;
  children: React.ReactNode;
  dark: boolean;
  onToggleDark: () => void;
  layout: 'desktop' | 'mobile';
  onLayoutChange: (l: 'desktop' | 'mobile') => void;
}

export default function MobileLayout({
  onAddClick, children,
  dark, onToggleDark, layout, onLayoutChange,
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const info = getPathInfo(location.pathname);
  const activeTab = currentBottomTab(location.pathname);
  const isMoreSub = MORE_SUBPATHS.includes(location.pathname);
  const showBack = isMoreSub || location.pathname.startsWith('/projects') || ['/profile', '/admin', '/subs', '/categories', '/excel', '/help', '/developer'].includes(location.pathname);
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="layout-mobile">
      <header className="mobile-header">
        <div className="mobile-header-left">
          {showBack && (
            <button className="back-btn" onClick={() => navigate('/more')} title={t('common.back')} aria-label={t('common.back')}>
              <IconArrowLeft size={18} />
            </button>
          )}
          <img src="/logo.png" alt="miBolsillo" style={{ width: 26, height: 26, borderRadius: 8 }} />
          <span className="mobile-header-title">{t(info.titleKey || info.i18nKey)}</span>
        </div>
        <div className="mobile-header-right">
          <button className="theme-btn" onClick={() => setLocale(nextLocale(locale))} title={t('lang.select')} aria-label={t('lang.select')}>
            <span style={{fontWeight:700,fontSize:'.75rem'}}>{locale.toUpperCase()}</span>
          </button>
          <button className="theme-btn" onClick={() => onLayoutChange(layout === 'desktop' ? 'mobile' : 'desktop')} title={t('nav.desktop')} aria-label={t('nav.desktop')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
          <button className="theme-btn" onClick={onToggleDark} title={t('theme.toggle')} aria-label={t('theme.toggle')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {dark ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></> : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
            </svg>
          </button>
        </div>
      </header>
      <main className="mobile-content">{children}</main>
      <nav className="mobile-bottom-nav">
        <div className="bottom-nav-scroll">
        {BOTTOM_NAV.map(item => (
          <button
            key={item.key}
            className={`bottom-nav-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}<span>{t(item.i18nKey)}</span>
          </button>
        ))}
        </div>
      </nav>
      <button className="mobile-fab" onClick={onAddClick} title={t('expense.add')}><IconPlus size={20} />{t('nav.newExpense')}</button>
    </div>
  );
}
