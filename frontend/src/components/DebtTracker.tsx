import { useMemo } from 'react';
import type { Expense } from '../types';
import { updateExpense } from '../store';
import { IconCheckCircle, IconXCircle } from './Icons';

interface Props {
  expenses: Expense[];
}

type Persona = { n: string; m: number; r: 'deb' | 'inv'; repaid: boolean; method: string };

function parsePersonas(raw?: string): Persona[] {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw);
    if (!Array.isArray(a)) return [];
    return a.filter((x: any) => x && typeof x.n === 'string').map((x: any) => ({
      n: x.n, m: Number(x.m) || 0,
      r: x.r === 'inv' ? 'inv' as const : 'deb' as const,
      repaid: !!x.repaid,
      method: typeof x.method === 'string' ? x.method : '',
    }));
  } catch { return []; }
}

export default function DebtTracker({ expenses }: Props) {
  const shared = useMemo(() => expenses.filter(e => parsePersonas(e.personas).some(x => x.r === 'deb')), [expenses]);
  const debtorsOf = (e: Expense) => parsePersonas(e.personas).filter(x => x.r === 'deb');

  const countPending = shared.reduce((s, e) => s + debtorsOf(e).filter(x => !x.repaid).length, 0);
  const countRepaid = shared.reduce((s, e) => s + debtorsOf(e).filter(x => x.repaid).length, 0);
  const totalPending = shared.reduce((s, e) => s + debtorsOf(e).filter(x => !x.repaid).reduce((a, x) => a + (Number(x.m) || 0), 0), 0);
  const totalRepaid = shared.reduce((s, e) => s + debtorsOf(e).filter(x => x.repaid).reduce((a, x) => a + (Number(x.m) || 0), 0), 0);

  const toggle = (e: Expense, i: number) => {
    const p = parsePersonas(e.personas);
    if (i < 0 || i >= p.length) return;
    p[i].repaid = !p[i].repaid;
    const debtors = p.filter(x => x.r === 'deb');
    const allRepaid = debtors.length > 0 && debtors.every(x => x.repaid);
    const firstMethod = debtors.find(x => x.repaid)?.method || '';
    updateExpense(e.id, {
      personas: JSON.stringify(p.map(x => ({ n: x.n, m: Number(x.m) || 0, r: x.r, repaid: !!x.repaid, method: x.method || '' }))),
      devuelto: allRepaid ? 'yes' : 'no',
      deudaMetodo: firstMethod || 'Bizum',
    });
    window.location.reload();
  };

  return (
    <>
      <div className="stats">
        <div className="stat"><div className="label">Pendientes</div><div className="value negative">{countPending}</div></div>
        <div className="stat"><div className="label">Importe Pend.</div><div className="value negative">{totalPending.toFixed(2)} EUR</div></div>
        <div className="stat"><div className="label">Pagadas</div><div className="value positive">{countRepaid}</div></div>
        <div className="stat"><div className="label">Total Devuelto</div><div className="value positive">{totalRepaid.toFixed(2)} EUR</div></div>
      </div>
      {shared.length === 0 ? (
        <div className="card"><div className="empty">No hay deudas</div></div>
      ) : shared.map(e => {
        const p = parsePersonas(e.personas);
        return (
          <div key={e.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <strong>{e.desc}</strong>
              <span className="td-muted">{e.date}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Persona</th><th>Importe</th><th>Devuelto</th><th>Cómo</th><th></th></tr></thead>
                <tbody>
                  {p.map((x, i) => x.r === 'deb' ? (
                    <tr key={i}>
                      <td>{x.n}</td>
                      <td className="td-amount">{Number(x.m || 0).toFixed(2)} EUR</td>
                      <td>{x.repaid ? 'Sí' : 'No'}</td>
                      <td className="td-muted">{x.repaid ? (x.method || '—') : ''}</td>
                      <td>
                        <button className={`btn sm ${x.repaid ? 'outline' : 'primary'}`} onClick={() => toggle(e, i)}>
                          {x.repaid ? <IconXCircle size={14} /> : <IconCheckCircle size={14} />}
                          {x.repaid ? ' Desmarcar' : ' Pagado'}
                        </button>
                      </td>
                    </tr>
                  ) : null)}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
