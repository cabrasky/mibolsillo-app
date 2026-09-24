import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Expense, Income, Goal, Subscription } from '../types';
import { expenseCost, getMonth } from '../types';
import { useLocale } from '../i18n';
import { IconArrowUpRight } from './Icons';

interface Props {
  expenses: Expense[];
  incomes: Income[];
  goals: Goal[];
  subscriptions: Subscription[];
}

export default function Dashboard({ expenses, incomes, goals, subscriptions }: Props) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((s, e) => s + expenseCost(e), 0);
    const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0);
    const balance = totalIncomes - totalExpenses;

    const monthExpenses = expenses
      .filter(e => getMonth(e.date) === thisMonth && e.date.startsWith(String(thisYear)))
      .reduce((s, e) => s + expenseCost(e), 0);
    const monthIncomes = incomes
      .filter(i => getMonth(i.date) === thisMonth && i.date.startsWith(String(thisYear)))
      .reduce((s, i) => s + i.amount, 0);

    const activeSubs = subscriptions.filter(s => s.active);
    const subMonthly = activeSubs.reduce((s, sub) => {
      const factor: Record<string, number> = { weekly: 4.33, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
      return s + sub.amount * (factor[sub.billingCycle] || 0);
    }, 0);

    const goalTotal = goals.reduce((s, g) => s + g.targetAmount, 0);
    const goalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const weekExpenses = expenses.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d >= weekAgo && d <= now;
    }).reduce((s, e) => s + expenseCost(e), 0);

    return {
      totalExpenses, totalIncomes, balance, monthExpenses, monthIncomes,
      monthBalance: monthIncomes - monthExpenses,
      weekExpenses, subMonthly, goalTotal, goalSaved,
      goalPct: goalTotal > 0 ? Math.min(100, (goalSaved / goalTotal) * 100) : 0,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    };
  }, [expenses, incomes, goals, subscriptions, thisMonth, thisYear, now]);

  const recentExpenses = useMemo(() =>
    [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [expenses]
  );

  const upcomingSubs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return subscriptions
      .filter(s => s.active)
      .map(s => {
        const d = new Date(s.nextBilling + 'T12:00:00');
        const days = Math.round((d.getTime() - today.getTime()) / 86400000);
        return { ...s, days };
      })
      .filter(s => s.days >= 0 && s.days <= 15)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [subscriptions]);

  return (
    <div className="dashboard">
      {/* Balance hero */}
      <div className={`balance-hero ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
        <div className="balance-label">{t('dashboard.balance')}</div>
        <div className="balance-amount">
          {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(2)}
          <span className="balance-currency"> EUR</span>
        </div>
        <div className="balance-sub">
          {stats.totalIncomes.toFixed(0)} {t('dashboard.earned')} · {stats.totalExpenses.toFixed(0)} {t('dashboard.spent')}
        </div>
      </div>

      {/* Monthly snapshot */}
      <div className="card">
        <h3>{t('dashboard.thisMonth')} ({t(`ref.months.${thisMonth}`)})</h3>
        <div className="month-snapshot">
          <div className="ms-item">
            <span className="ms-label">{t('dashboard.incomes')}</span>
            <span className="ms-value positive">+{stats.monthIncomes.toFixed(2)}</span>
          </div>
          <div className="ms-item">
            <span className="ms-label">{t('dashboard.expenses')}</span>
            <span className="ms-value negative">-{stats.monthExpenses.toFixed(2)}</span>
          </div>
          <div className="ms-item ms-total">
            <span className="ms-label">{t('dashboard.balanceLabel')}</span>
            <span className={`ms-value ${stats.monthBalance >= 0 ? 'positive' : 'negative'}`}>
              {stats.monthBalance >= 0 ? '+' : ''}{stats.monthBalance.toFixed(2)}
            </span>
          </div>
        </div>
        {stats.monthIncomes > 0 && (
          <div className="progress-wrap" style={{ height: 10, marginTop: 8 }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (stats.monthExpenses / stats.monthIncomes) * 100)}%`,
                background: stats.monthExpenses > stats.monthIncomes ? 'var(--danger)' : 'var(--warning)'
              }}
            />
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="stats">
        <div className="stat" onClick={() => navigate('/expenses')}>
          <div className="label">{t('dashboard.expenses')}</div>
          <div className="value negative">{stats.expenseCount}</div>
        </div>
        <div className="stat" onClick={() => navigate('/incomes')}>
          <div className="label">{t('dashboard.incomes')}</div>
          <div className="value positive">{stats.incomeCount}</div>
        </div>
        <div className="stat" onClick={() => navigate('/goals')}>
          <div className="label">{t('dashboard.goals')}</div>
          <div className="value primary">{goals.length}</div>
        </div>
        <div className="stat" onClick={() => navigate('/subs')}>
          <div className="label">{t('dashboard.subsMonth')}</div>
          <div className="value warning">{stats.subMonthly.toFixed(0)} EUR</div>
        </div>
      </div>

      {/* Goals progress */}
      {goals.length > 0 && (
        <div className="card clickable" onClick={() => navigate('/goals')}>
          <div className="card-header">
            <h3>{t('dashboard.goalProgress')}</h3>
            <IconArrowUpRight size={16} />
          </div>
          <div className="progress-wrap" style={{ height: 12 }}>
            <div className={`progress-fill ${stats.goalPct >= 100 ? 'success' : ''}`} style={{ width: `${stats.goalPct}%` }} />
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
            {stats.goalSaved.toFixed(0)} / {stats.goalTotal.toFixed(0)} EUR ({stats.goalPct.toFixed(0)}%)
          </div>
        </div>
      )}

      {/* Cash flow summary */}
      <div className="card clickable" onClick={() => navigate('/more/monthly')}>
        <div className="card-header">
          <h3>{t('dashboard.cashFlow')}</h3>
          <IconArrowUpRight size={16} />
        </div>
        <div className="month-snapshot">
          <div className="ms-item">
            <span className="ms-label">{t('dashboard.incomes')}</span>
            <span className="ms-value positive">+{stats.monthIncomes.toFixed(0)}</span>
          </div>
          <div className="ms-item">
            <span className="ms-label">{t('dashboard.expenses')}</span>
            <span className="ms-value negative">-{stats.monthExpenses.toFixed(0)}</span>
          </div>
          <div className="ms-item ms-total">
            <span className="ms-label">{t('dashboard.balanceLabel')}</span>
            <span className={`ms-value ${stats.monthBalance >= 0 ? 'positive' : 'negative'}`}>
              {stats.monthBalance >= 0 ? '+' : ''}{stats.monthBalance.toFixed(0)}
            </span>
          </div>
        </div>
        {stats.monthIncomes > 0 && (
          <div className="progress-wrap" style={{ height: 8, marginTop: 4 }}>
            <div className="progress-fill" style={{
              width: `${Math.min(100, (stats.monthExpenses / stats.monthIncomes) * 100)}%`,
              background: stats.monthExpenses > stats.monthIncomes ? 'var(--danger)' : 'var(--warning)'
            }} />
          </div>
        )}
        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
          {stats.monthIncomes > 0
            ? `${((stats.monthExpenses / stats.monthIncomes) * 100).toFixed(0)}% ${t('dashboard.spent')}`
            : t('income.noData')}
        </div>
      </div>

      {/* Recent expenses */}
      {recentExpenses.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>{t('dashboard.recentExpenses')}</h3>
            <button className="btn sm outline" onClick={() => navigate('/expenses')}>{t('dashboard.viewAll')}</button>
          </div>
          <div className="recent-list">
            {recentExpenses.map(e => (
              <div key={e.id} className="recent-item">
                <div className="recent-left">
                  <span className="recent-date">{e.date?.slice(5)}</span>
                  <span className="recent-desc">{e.desc}</span>
                </div>
                <span className="recent-amount">{e.amount.toFixed(2)} EUR</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming subscriptions */}
      {upcomingSubs.length > 0 && (
        <div className="card clickable" onClick={() => navigate('/subs')}>
          <div className="card-header">
            <h3>{t('dashboard.upcomingCharges')}</h3>
            <IconArrowUpRight size={16} />
          </div>
          {upcomingSubs.map(s => (
            <div key={s.id} className="recent-item">
              <div className="recent-left">
                <span className={`recent-date ${s.days <= 3 ? 'urgent' : ''}`}>
                  {s.days === 0 ? t('dashboard.today') : s.days === 1 ? t('dashboard.tomorrow') : `${s.days}${t('dashboard.days')}`}
                </span>
                <span className="recent-desc">{s.name}</span>
              </div>
              <span className="recent-amount">{s.amount.toFixed(2)} EUR</span>
            </div>
          ))}
        </div>
      )}

      {/* Week spend */}
      <div className="card">
        <h3>{t('dashboard.weekSpent')}</h3>
        <div className="balance-sub" style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>
          {stats.weekExpenses.toFixed(2)} EUR
        </div>
      </div>
    </div>
  );
}
