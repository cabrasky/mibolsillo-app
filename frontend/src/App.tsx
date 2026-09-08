import { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { loadData, deleteExpense, loadAllFromServer } from './store';
import AddExpense from './components/AddExpense';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import IncomesPage from './components/Incomes';
import GoalsPage from './components/Goals';
import MoreMenu from './components/MoreMenu';
import MonthlySummary from './components/MonthlySummary';
import ProjectsPage from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import WeeklyBudget from './components/WeeklyBudget';
import DebtTracker from './components/DebtTracker';
import SanityCheck from './components/SanityCheck';
import SubscriptionsPage from './components/Subscriptions';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminPanel from './components/AdminPanel';
import Landing from './components/Landing';
import CategoriesPage from './components/CategoriesPage';
import ExcelPage from './components/ExcelPage';
import HelpPage from './components/HelpPage';
import { MonthlyChart, CashFlowChart, BalanceEvolution, IncomeExpenseComparison, SankeyChart, DailyTrendCharts, CategoryFilter, CategoryCompare, CAT_COLORS } from './components/Charts';
import PeriodCompare from './components/CompareCharts';
import './App.css';

const LAYOUT_BREAK = 1024;
const LAYOUT_PIN = 'gastos_layout_pin';
const autoLayout = (): 'desktop' | 'mobile' => (window.innerWidth < LAYOUT_BREAK ? 'mobile' : 'desktop');

function getSavedLayout(): 'desktop' | 'mobile' {
  const v = localStorage.getItem(LAYOUT_PIN);
  if (v === 'mobile' || v === 'desktop') return v;
  return autoLayout();
}

function MonthlyCharts({ expenses, incomes }: { expenses: any[]; incomes: any[] }) {
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach((e: any) => m.set(e.proposito, (m.get(e.proposito) || 0) + e.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [expenses]);
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = selected.length ? expenses.filter((e: any) => selected.includes(e.proposito)) : expenses;
  const selCats = (selected.length ? selected : cats).map((name: string, i: number) => ({
    name, color: CAT_COLORS[cats.indexOf(name) % CAT_COLORS.length] || CAT_COLORS[i % CAT_COLORS.length],
  }));
  return (
    <>
      <CategoryFilter cats={cats.map((name: string, i: number) => ({ name, color: CAT_COLORS[i % CAT_COLORS.length] }))}
        selected={selected} onChange={setSelected} />
      {selCats.length > 0 && <CategoryCompare expenses={expenses} cats={selCats} />}
      <CashFlowChart expenses={filtered} incomes={incomes} />
      <SankeyChart expenses={filtered} incomes={incomes} />
      <BalanceEvolution expenses={filtered} incomes={incomes} />
      <MonthlyChart expenses={filtered} />
      <DailyTrendCharts expenses={filtered} />
      <MonthlySummary expenses={filtered} />
      <IncomeExpenseComparison expenses={filtered} incomes={incomes} />
      <PeriodCompare expenses={filtered} incomes={incomes} />
    </>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [layout, setLayout] = useState<'desktop' | 'mobile'>(getSavedLayout);
  const [data, setData] = useState(() => loadData());
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPresetProject, setAddPresetProject] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('gastos_dark') === 'true');
  const [weeklyGoal, setWeeklyGoal] = useState(() => Number(localStorage.getItem('gastos_goal')) || 50);

  const handleLayoutChange = (l: 'desktop' | 'mobile') => {
    setLayout(l);
    try { localStorage.setItem(LAYOUT_PIN, l); } catch { /* ignore */ }
  };
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('gastos_dark', dark ? 'true' : 'false');
  }, [dark]);
  // Auto-adaptación del layout al cambiar el tamaño de la pantalla (salvo pin manual)
  useEffect(() => {
    const onResize = () => {
      if (localStorage.getItem(LAYOUT_PIN)) return;
      setLayout(autoLayout());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => { localStorage.setItem('gastos_goal', String(weeklyGoal)); }, [weeklyGoal]);

  const refresh = useCallback(() => { setData(loadData()); setEditId(null); }, []);

  const handleDelete = (id: string) => {
    if (!confirm('Eliminar este gasto?')) return;
    deleteExpense(id);
    refresh();
  };

  const openAddFor = (projectId: string) => { setEditId(null); setAddPresetProject(projectId); setShowAddModal(true); };
  const handleAddClick = () => openAddFor('');
  const handleEdit = (id: string) => { setEditId(id); setAddPresetProject(''); setShowAddModal(true); };
  const handleCloseAdd = () => { setShowAddModal(false); setEditId(null); setAddPresetProject(''); };
  const handleSave = () => { refresh(); setShowAddModal(false); setEditId(null); setAddPresetProject(''); };

  // Al entrar con sesión, cargar todos los datos del servidor (multi-dispositivo)
  const [serverSynced, setServerSynced] = useState(false);
  useEffect(() => {
    if (user && !serverSynced) {
      setServerSynced(true);
      loadAllFromServer().then(ok => { if (ok) refresh(); });
    }
  }, [user, serverSynced, refresh]);

  const handleExportCSV = () => {
    const now = new Date();
    const headers = ['Fecha','Descripcion','Importe','Proposito','Motivo','Tipo','Metodo','Gasto Ajeno','Deudores','Metodo Devolucion','Devuelto','Me Corresponde','Viaje'];
    const rows = [headers];
    data.expenses.forEach((e: any) => {
      rows.push([e.date, e.desc, String(e.amount), e.proposito, e.motivo, e.tipo, e.metodo, String(e.ajeno), e.deudores, e.deudaMetodo, e.devuelto, String(e.meCorresponde), e.viaje]);
    });
    const csv = rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gastos_${now.getFullYear()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gastos_${new Date().getFullYear()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const editExpense = editId ? data.expenses.find((e: any) => e.id === editId) || null : null;

  const sharedLayoutProps = {
    dark, onToggleDark: () => setDark((d: boolean) => !d),
    onExportCSV: handleExportCSV, onExportJSON: handleExportJSON,
    layout, onLayoutChange: handleLayoutChange,
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/logo.png" alt="miBolsillo" className="brand-logo" />
        <h2>miBolsillo</h2>
        <div className="loading-spinner" />
      </div>
    );
  }

  // Auth routes (always accessible)
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Main app routes
  const routes = (
    <Routes>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <Dashboard expenses={data.expenses} incomes={data.incomes} goals={data.goals} subscriptions={data.subscriptions} />
      } />
      <Route path="/expenses" element={
        <ExpenseList expenses={data.expenses} onEdit={handleEdit} onDelete={handleDelete} />
      } />
      <Route path="/incomes" element={
        <IncomesPage incomes={data.incomes} onRefresh={refresh} />
      } />
      <Route path="/goals" element={
        <GoalsPage goals={data.goals} onRefresh={refresh} />
      } />
      <Route path="/subs" element={
        <SubscriptionsPage subscriptions={data.subscriptions} onRefresh={refresh} />
      } />
      <Route path="/more" element={<MoreMenu />} />
      <Route path="/more/monthly" element={
        <MonthlyCharts expenses={data.expenses} incomes={data.incomes} />
      } />
      <Route path="/more/weekly" element={
        <WeeklyBudget expenses={data.expenses} weeklyGoal={weeklyGoal} onGoalChange={setWeeklyGoal} />
      } />
      <Route path="/more/debts" element={
        <DebtTracker expenses={data.expenses} />
      } />
      <Route path="/more/subs" element={
        <SubscriptionsPage subscriptions={data.subscriptions} onRefresh={refresh} />
      } />
      <Route path="/more/sanity" element={
        <SanityCheck expenses={data.expenses} />
      } />
      <Route path="/admin" element={
        <AdminPanel />
      } />
      <Route path="/profile" element={
        <Profile />
      } />
      <Route path="/categories" element={
        <CategoriesPage expenses={data.expenses} incomes={data.incomes} subscriptions={data.subscriptions} />
      } />
      <Route path="/excel" element={<ExcelPage onImported={refresh} />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/projects" element={
        <ProjectsPage onRefresh={refresh} onAddToProject={openAddFor} />
      } />
      <Route path="/projects/:id" element={
        <ProjectDetail onRefresh={refresh} onEditExpense={handleEdit} onAddToProject={openAddFor} />
      } />
    </Routes>
  );

  if (layout === 'desktop') {
    return (
      <DesktopLayout
        expenses={data.expenses}
        onAddClick={handleAddClick}
        {...sharedLayoutProps}
      >
        {routes}
        <AddExpense isOpen={showAddModal} editExpense={editExpense} onClose={handleCloseAdd} onSaved={handleSave} presetProjectId={addPresetProject} />
      </DesktopLayout>
    );
  }

  return (
    <>
      <MobileLayout
        onAddClick={handleAddClick}
        {...sharedLayoutProps}
      >
        {routes}
      </MobileLayout>
      <AddExpense isOpen={showAddModal} editExpense={editExpense} onClose={handleCloseAdd} onSaved={handleSave} presetProjectId={addPresetProject} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
