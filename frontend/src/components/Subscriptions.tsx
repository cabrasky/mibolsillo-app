import { useState, useMemo } from 'react';
import { REF } from '../types';
import { useLocale } from '../i18n';
import type { Subscription } from '../types';
import { addSubscription, updateSubscription, deleteSubscription, advanceSubscription, addExpense } from '../store';
import {
  IconPlus, IconX, IconEdit, IconTrash, IconCheckCircle
} from './Icons';

interface Props {
  subscriptions: Subscription[];
  onRefresh: () => void;
}

const CYCLE_LABELS: Record<string, string> = {
  weekly: '/semana',
  monthly: '/mes',
  quarterly: '/trimestre',
  yearly: '/ano',
};

const CYCLE_MONTH_FACTOR: Record<string, number> = {
  weekly: 4.33,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export default function SubscriptionsPage({ subscriptions, onRefresh }: Props) {
  const { t } = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'weekly' | 'quarterly'>('monthly');
  const [nextBilling, setNextBilling] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [metodo, setMetodo] = useState('Tarjeta');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const active = subscriptions.filter(s => s.active);
  const inactive = subscriptions.filter(s => !s.active);

  const totals = useMemo(() => {
    let monthly = 0;
    active.forEach(s => {
      monthly += s.amount * CYCLE_MONTH_FACTOR[s.billingCycle];
    });
    return { monthly, yearly: monthly * 12 };
  }, [active]);

  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return active
      .filter(s => {
        const d = new Date(s.nextBilling + 'T12:00:00');
        const diff = (d.getTime() - now.getTime()) / 86400000;
        return diff >= 0 && diff <= 30;
      })
      .sort((a, b) => a.nextBilling.localeCompare(b.nextBilling));
  }, [active]);

  const openNew = () => {
    setEditing(null);
    setName('');
    setAmount(0);
    setBillingCycle('monthly');
    setNextBilling(new Date().toISOString().slice(0, 10));
    setCategory('');
    setMetodo('Tarjeta');
    setNotes('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (s: Subscription) => {
    setEditing(s);
    setName(s.name);
    setAmount(s.amount);
    setBillingCycle(s.billingCycle);
    setNextBilling(s.nextBilling);
    setCategory(s.category);
    setMetodo(s.metodo || 'Tarjeta');
    setNotes(s.notes);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || amount <= 0) {
      setFormError(!name.trim() ? t('error.nameRequired') : t('error.amountPositive'));
      return;
    }
    setFormError('');
    if (editing) {
      updateSubscription(editing.id, { name: name.trim(), amount, billingCycle, nextBilling, category: category.trim(), metodo, notes: notes.trim() });
    } else {
      addSubscription({ name: name.trim(), amount, billingCycle, nextBilling, category: category.trim(), metodo, notes: notes.trim() });
    }
    setShowForm(false);
    onRefresh();
  };

  const handleMarkPaid = (s: Subscription) => {
    const today = new Date().toISOString().slice(0, 10);
    addExpense({
      date: today,
      desc: s.name + (s.category ? ` (${s.category})` : ''),
      amount: s.amount,
      proposito: REF.propositos.includes(s.category) ? s.category : 'Ocio',
      metodo: s.metodo || 'Tarjeta',
      motivo: '',
      tipo: 'Recurrente',
    });
    advanceSubscription(s);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Eliminar esta subscripcion?')) return;
    deleteSubscription(id);
    onRefresh();
  };

  const daysUntil = (dateStr: string): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T12:00:00');
    return Math.round((d.getTime() - now.getTime()) / 86400000);
  };

  return (
    <div>
      <div className="stats">
        <div className="stat">
          <div className="label">Subscripciones activas</div>
          <div className="value primary">{active.length}</div>
        </div>
        <div className="stat">
          <div className="label">Coste mensual</div>
          <div className="value negative">{totals.monthly.toFixed(2)} EUR</div>
        </div>
        <div className="stat">
          <div className="label">Coste anual</div>
          <div className="value negative">{totals.yearly.toFixed(2)} EUR</div>
        </div>
        <div className="stat">
          <div className="label">Proximos 30d</div>
          <div className="value warning">{upcoming.length}</div>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="card">
          <h3>Proximos cobros (30 dias)</h3>
          <div className="upcoming-grid">
            {upcoming.map(s => {
              const days = daysUntil(s.nextBilling);
              return (
                <div key={s.id} className={`upcoming-card ${days <= 3 ? 'urgent' : ''}`}>
                  <div className="upcoming-name">{s.name}</div>
                  <div className="upcoming-amount">{s.amount.toFixed(2)} EUR</div>
                  <div className="upcoming-meta">
                    {days === 0 ? 'Hoy' : days === 1 ? 'Manana' : `En ${days} dias`}
                    {' '}· {s.nextBilling}
                  </div>
                  <div className="upcoming-actions">
                    <button className="btn sm primary" onClick={() => handleMarkPaid(s)} title="Marcar como pagado">
                      <IconCheckCircle size={14} /> Pagado
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active list */}
      <div className="card">
        <div className="card-header">
          <h3>Subscripciones activas</h3>
          <button className="btn primary sm" onClick={openNew}>
            <IconPlus size={14} /> Nueva
          </button>
        </div>
        {active.length === 0 ? (
          <div className="empty">Sin subscripciones activas</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Importe</th>
                  <th>Ciclo</th>
                  <th>Proximo cobro</th>
                  <th>Categoria</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {active.map(s => {
                  const days = daysUntil(s.nextBilling);
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td style={{ fontWeight: 700 }}>{s.amount.toFixed(2)} EUR</td>
                      <td>{CYCLE_LABELS[s.billingCycle] || s.billingCycle}</td>
                      <td>
                        <span className={`pill ${days <= 3 ? 'pill-danger' : days <= 7 ? 'pill-warning' : 'pill-ok'}`}>
                          {days === 0 ? 'Hoy' : days === 1 ? 'Manana' : `${s.nextBilling} (${days}d)`}
                        </span>
                      </td>
                      <td style={{ fontSize: '.8rem' }}>{s.category || '-'}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn sm primary" onClick={() => handleMarkPaid(s)} title="Pagar ahora">
                            <IconCheckCircle size={14} />
                          </button>
                          <button className="btn sm outline" onClick={() => openEdit(s)} title="Editar">
                            <IconEdit size={14} />
                          </button>
                          <button className="btn sm outline" onClick={() => handleDelete(s.id)} title="Eliminar">
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inactive */}
      {inactive.length > 0 && (
        <div className="card">
          <h3>Inactivas / Canceladas</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Importe</th><th>Ciclo</th><th></th></tr>
              </thead>
              <tbody>
                {inactive.map(s => (
                  <tr key={s.id} style={{ opacity: 0.5 }}>
                    <td>{s.name}</td>
                    <td>{s.amount.toFixed(2)} EUR</td>
                    <td>{CYCLE_LABELS[s.billingCycle]}</td>
                    <td>
                      <button className="btn sm outline" onClick={() => updateSubscription(s.id, { active: true })}>Reactivar</button>
                      <button className="btn sm danger" onClick={() => handleDelete(s.id)}>
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar' : 'Nueva'} Subscripcion</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Netflix, Spotify..." autoFocus />
              </div>
              <div className="form-row three">
                <div className="form-group">
                  <label>Importe (EUR)</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Ciclo</label>
                  <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as any)}>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Proximo cobro</label>
                  <input type="date" value={nextBilling} onChange={e => setNextBilling(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoria (Proposito)</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Sin asignar</option>
                    {REF.propositos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Metodo de pago</label>
                  <select value={metodo} onChange={e => setMetodo(e.target.value)}>
                    {REF.metodos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notas</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              {formError && <p className="field-error">{formError}</p>}
              <div className="form-actions">
                <button type="submit" className="btn primary">{editing ? 'Guardar' : 'Anadir'}</button>
                <button type="button" className="btn outline" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
