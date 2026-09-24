import { useMemo } from 'react';
import { REF, expenseCost, getMonth, bucketOf } from '../types';
import type { Expense } from '../types';

interface Props {
  expenses: Expense[];
}

export default function MonthlySummary({ expenses }: Props) {
  const months = useMemo(() => {
    return REF.meses.map((name, i) => {
      const m = i + 1;
      const exps = expenses.filter(e => getMonth(e.date) === m);
      const total = exps.reduce((s, e) => s + expenseCost(e), 0);
      const fijo = exps.filter(e => bucketOf(e) === 'fijo').reduce((s, e) => s + expenseCost(e), 0);
      const puntual = exps.filter(e => bucketOf(e) === 'puntual').reduce((s, e) => s + expenseCost(e), 0);
      const viajes = exps.filter(e => bucketOf(e) === 'viajes').reduce((s, e) => s + expenseCost(e), 0);
      const inversion = exps.filter(e => bucketOf(e) === 'inversion').reduce((s, e) => s + expenseCost(e), 0);
      const vida = fijo + puntual + viajes;
      return { name, total, fijo, puntual, viajes, vida, inversion, count: exps.length };
    });
  }, [expenses]);

  const grandTotal = months.reduce((s, m) => s + m.total, 0);
  const avg = grandTotal / 12;

  const totals = {
    fijo: months.reduce((s, m) => s + m.fijo, 0),
    puntual: months.reduce((s, m) => s + m.puntual, 0),
    viajes: months.reduce((s, m) => s + m.viajes, 0),
    vida: months.reduce((s, m) => s + m.vida, 0),
    inversion: months.reduce((s, m) => s + m.inversion, 0),
  };

  return (
    <>
      <div className="stats">
        <div className="stat"><div className="label">Total Año</div><div className="value primary">{grandTotal.toFixed(2)} EUR</div></div>
        <div className="stat"><div className="label">Media Mensual</div><div className="value">{avg.toFixed(2)} EUR</div></div>
        <div className="stat"><div className="label">Gastos</div><div className="value">{expenses.length}</div></div>
        <div className="stat"><div className="label">Gasto Promedio</div><div className="value">{expenses.length ? (grandTotal / expenses.length).toFixed(2) : '0.00'} EUR</div></div>
      </div>

      <div className="card">
        <h3>Resumen Mensual</h3>
        <div className="table-wrap">
          <table className="table-compact">
            <thead>
              <tr><th>Mes</th><th>Fijo</th><th>Puntual</th><th>Viajes</th><th>N.Vida</th><th>Inversion</th><th>Total</th><th>#</th></tr>
            </thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={i}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.fijo.toFixed(2)}</td>
                  <td>{m.puntual.toFixed(2)}</td>
                  <td>{m.viajes.toFixed(2)}</td>
                  <td>{m.vida.toFixed(2)}</td>
                  <td>{m.inversion.toFixed(2)}</td>
                  <td className="td-amount">{m.total.toFixed(2)}</td>
                  <td>{m.count}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total</td>
                <td>{totals.fijo.toFixed(2)}</td>
                <td>{totals.puntual.toFixed(2)}</td>
                <td>{totals.viajes.toFixed(2)}</td>
                <td>{totals.vida.toFixed(2)}</td>
                <td>{totals.inversion.toFixed(2)}</td>
                <td className="td-amount">{grandTotal.toFixed(2)}</td>
                <td>{expenses.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Distribucion</h3>
        <div className="bar-list">
          {[
            { label: 'Fijo', val: totals.fijo, color: '#dfe6e9' },
            { label: 'Puntual', val: totals.puntual, color: '#ffeaa7' },
            { label: 'Viajes', val: totals.viajes, color: '#74b9ff' },
            { label: 'Nivel de Vida', val: totals.vida, color: '#55efc4' },
            { label: 'Inversion', val: totals.inversion, color: '#a29bfe' },
          ].map(({ label, val, color }) => {
            const pct = grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(1) : 0;
            return (
              <div key={label} className="bar-row">
                <span className="bar-label">{label}</span>
                <div className="progress-wrap">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="bar-value">{val.toFixed(2)} EUR ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
