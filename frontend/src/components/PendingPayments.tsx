import { useMemo, useState } from 'react';
import type { Expense } from '../types';
import { REF } from '../types';
import { updateExpense } from '../store';
import { personasOf, repaySummary, serializePersonas, type Persona } from '../personas';
import { IconCheckCircle, IconXCircle } from './Icons';

interface Props {
  expenses: Expense[];
  onRefresh: () => void;
}

// Una deuda = un deudor dentro de un gasto compartido
type Item = { e: Expense; idx: number; p: Persona };
type Group = { name: string; items: Item[]; total: number };

const fmt = (n: number) => `${n.toFixed(2)} EUR`;
const sum = (l: Item[]) => l.reduce((s, x) => s + (Number(x.p.m) || 0), 0);

function byPerson(items: Item[]): Group[] {
  const m = new Map<string, Group>();
  items.forEach(it => {
    const key = it.p.n.trim().toLowerCase();
    const g = m.get(key) || { name: it.p.n.trim(), items: [], total: 0 };
    g.items.push(it); g.total += Number(it.p.m) || 0;
    m.set(key, g);
  });
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export default function PendingPayments({ expenses, onRefresh }: Props) {
  const [tab, setTab] = useState<'pending' | 'repaid'>('pending');
  const [pay, setPay] = useState<Item[] | null>(null);

  const all = useMemo(() => {
    const out: Item[] = [];
    expenses.forEach(e => personasOf(e).forEach((p, idx) => { if (p.r === 'deb' && p.n.trim()) out.push({ e, idx, p }); }));
    return out.sort((a, b) => b.e.date.localeCompare(a.e.date));
  }, [expenses]);
  const pending = all.filter(x => !x.p.repaid);
  const repaid = all.filter(x => x.p.repaid);
  const groups = byPerson(tab === 'pending' ? pending : repaid);

  // Aplica el cambio a los deudores afectados, guardando una sola vez cada gasto
  const apply = (items: Item[], patch: Partial<Persona>) => {
    const perExp = new Map<string, Item[]>();
    items.forEach(it => perExp.set(it.e.id, [...(perExp.get(it.e.id) || []), it]));
    perExp.forEach(list => {
      const e = list[0].e;
      const ps = personasOf(e).map((p, i) => (list.some(it => it.idx === i) ? { ...p, ...patch } : p));
      updateExpense(e.id, { personas: serializePersonas(ps), ...repaySummary(ps) });
    });
    setPay(null);
    onRefresh();
  };

  return (
    <>
      <div className="stats">
        <div className="stat"><div className="label">Pendientes</div><div className="value negative">{pending.length}</div></div>
        <div className="stat"><div className="label">Importe Pend.</div><div className="value negative">{fmt(sum(pending))}</div></div>
        <div className="stat"><div className="label">Pagados</div><div className="value positive">{repaid.length}</div></div>
        <div className="stat"><div className="label">Total Devuelto</div><div className="value positive">{fmt(sum(repaid))}</div></div>
      </div>

      <div className="pp-tabs">
        <button type="button" className={tab === 'pending' ? 'on' : ''} onClick={() => setTab('pending')}>Pendientes ({pending.length})</button>
        <button type="button" className={tab === 'repaid' ? 'on' : ''} onClick={() => setTab('repaid')}>Pagados ({repaid.length})</button>
      </div>

      {groups.length === 0 && (
        <div className="card"><div className="empty">{tab === 'pending' ? 'Nadie te debe nada 🎉' : 'Aún no hay devoluciones'}</div></div>
      )}
      {groups.map(g => (
        <div key={g.name} className="card">
          <div className="pp-head">
            <strong>{g.name}</strong>
            <span className={`pp-total ${tab === 'pending' ? 'negative' : 'positive'}`}>{fmt(g.total)}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Gasto</th><th>Importe</th>{tab === 'repaid' && <th>Cómo</th>}<th></th></tr></thead>
              <tbody>
                {g.items.map(it => (
                  <tr key={it.e.id + ':' + it.idx}>
                    <td className="td-muted">{it.e.date}</td>
                    <td>{it.e.desc}</td>
                    <td className="td-amount">{fmt(Number(it.p.m) || 0)}</td>
                    {tab === 'repaid' && <td className="td-muted">{it.p.method || '—'}</td>}
                    <td style={{ textAlign: 'right' }}>
                      {tab === 'pending' ? (
                        <button className="btn sm primary" onClick={() => setPay([it])}><IconCheckCircle size={14} /> Pagado</button>
                      ) : (
                        <button className="btn sm outline" onClick={() => apply([it], { repaid: false })}><IconXCircle size={14} /> Desmarcar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tab === 'pending' && g.items.length > 1 && (
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button className="btn sm outline" onClick={() => setPay(g.items)}>Todo pagado ({fmt(g.total)})</button>
            </div>
          )}
        </div>
      ))}

      {pay && (
        <div className="modal-overlay" onClick={() => setPay(null)}>
          <div className="modal modal-sm" onClick={ev => ev.stopPropagation()}>
            <div className="modal-header">
              <h2>¿Cómo te lo ha devuelto?</h2>
              <button className="modal-close" type="button" title="Cerrar" onClick={() => setPay(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="td-muted" style={{ marginTop: 0 }}>
                {pay[0].p.n.trim()} · {pay.length === 1 ? pay[0].e.desc : `${pay.length} gastos`} · {fmt(sum(pay))}
              </p>
              <div className="pp-methods">
                {REF.refundMethods.map(m => (
                  <button key={m} type="button" className="btn outline" onClick={() => apply(pay, { repaid: true, method: m })}>{m}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
