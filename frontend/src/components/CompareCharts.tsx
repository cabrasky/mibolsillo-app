import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts';
import type { Expense, Income } from '../types';

/* ── Comparativas de periodos superpuestos (meses / semanas / trimestres / años) ── */

const PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#8b5cf6'];
const MAX_SERIES = 6;
const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']; // lunes → domingo
const DIM_LABEL: Record<Dim, string> = { meses: 'Meses', semanas: 'Semanas', trimestres: 'Trimestres', anios: 'Años' };

type Dim = 'meses' | 'semanas' | 'trimestres' | 'anios';
type Metric = 'gasto' | 'ingreso' | 'balance';
const METRICS: { key: Metric; label: string }[] = [
  { key: 'gasto', label: 'Gastos' },
  { key: 'ingreso', label: 'Ingresos' },
  { key: 'balance', label: 'Balance' },
];

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
};
const eur = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pad = (n: number) => String(n).padStart(2, '0');

/** Parse 'YYYY-MM-DD' como fecha LOCAL (sin desfase de zona horaria). */
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Semana ISO-8601 (lunes→domingo). Devuelve año ISO + número de semana. */
function isoWeek(d: Date): { y: number; w: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (t.getUTCDay() + 6) % 7; // 0=lunes
  t.setUTCDate(t.getUTCDate() - dayNum + 3);
  const firstThursday = t.getTime();
  t.setUTCMonth(0, 1);
  if (t.getUTCDay() !== 4) t.setUTCMonth(0, 1 + ((4 - t.getUTCDay() + 7) % 7));
  return { y: t.getUTCFullYear(), w: 1 + Math.ceil((firstThursday - t.getTime()) / 604800000) };
}

/** Posición normalizada dentro del periodo (1-based): día / día-semana / semana-trimestre / mes. */
function posInPeriod(d: Date, dim: Dim): number {
  if (dim === 'meses') return d.getDate();
  if (dim === 'semanas') return (d.getDay() + 6) % 7 + 1;
  if (dim === 'trimestres') {
    const q = Math.floor(d.getMonth() / 3); // 0..3
    return Math.min(13, Math.max(1, isoWeek(d).w - q * 13));
  }
  return d.getMonth() + 1; // años
}

function periodKeyOf(dateStr: string, dim: Dim): string {
  const d = parseDate(dateStr);
  return periodKeyOfDate(d, dim);
}

function periodKeyOfDate(d: Date, dim: Dim): string {
  if (dim === 'meses') return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  if (dim === 'semanas') { const w = isoWeek(d); return `${w.y}-W${pad(w.w)}`; }
  if (dim === 'trimestres') return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
  return String(d.getFullYear()); // años
}

/** ¿El periodo está en curso (incompleto)? */
function isPartial(key: string, dim: Dim): boolean {
  return key === periodKeyOfDate(new Date(), dim);
}

function periodLabel(key: string, dim: Dim): string {
  if (dim === 'meses') {
    const [y, m] = key.split('-').map(Number);
    return `${SHORT_MONTHS[m - 1]} ${String(y).slice(2)}`;
  }
  if (dim === 'semanas') { const [y, w] = key.split('-W'); return `S${w}${y !== String(new Date().getFullYear()) ? ` ${y.slice(2)}` : ''}`; }
  if (dim === 'trimestres') { const [y, q] = key.split('-Q'); return `Q${q} ${String(y).slice(2)}`; }
  return key;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/**
 * Posiciones REALES dibujables de un periodo: su tamaño natural, o las ya
 * transcurridas si el periodo está en curso (lo futuro no existe → null).
 */
function periodLength(key: string, dim: Dim): number {
  const now = new Date();
  if (dim === 'meses') {
    const [y, m] = key.split('-').map(Number);
    return isPartial(key, dim) ? now.getDate() : daysInMonth(y, m);
  }
  if (dim === 'semanas') return isPartial(key, dim) ? (now.getDay() + 6) % 7 + 1 : 7;
  if (dim === 'trimestres') return isPartial(key, dim) ? posInPeriod(now, dim) : 13;
  return isPartial(key, dim) ? now.getMonth() + 1 : 12;
}

function xLabel(pos: number, dim: Dim): string {
  if (dim === 'meses') return String(pos);
  if (dim === 'semanas') return WEEKDAYS[pos - 1];
  if (dim === 'trimestres') return `S${pos}`;
  return SHORT_MONTHS[pos - 1];
}

const xTitle: Record<Dim, string> = {
  meses: 'Día del mes', semanas: 'Día de la semana', trimestres: 'Semana del trimestre', anios: 'Mes del año',
};
const defaultN: Record<Dim, number> = { meses: 3, semanas: 4, trimestres: 4, anios: 3 };
/** Máximo de chips (periodos con datos) que se ofrecen por dimensión, los más recientes. */
const MAX_OPTIONS: Record<Dim, number> = { meses: 18, semanas: 18, trimestres: 12, anios: 10 };

export default function PeriodCompare({ expenses, incomes }: { expenses: Expense[]; incomes: Income[] }) {
  const [dim, setDim] = useState<Dim>('meses');
  const [metric, setMetric] = useState<Metric>('gasto');
  const [sel, setSel] = useState<Partial<Record<Dim, string[]>>>({});

  // Periodos disponibles (con algún movimiento) ordenados del más reciente al más antiguo
  const candidates = useMemo(() => {
    const acc = (dates: string[]) => {
      const set = new Set<string>();
      dates.forEach(s => set.add(periodKeyOf(s, dim)));
      return [...set].sort().reverse().slice(0, MAX_OPTIONS[dim]);
    };
    return acc([...expenses.map(e => e.date), ...incomes.map(i => i.date)]);
  }, [expenses, incomes, dim]);

  const active = useMemo(() => {
    const saved = sel[dim];
    if (saved && saved.length) return saved.filter(k => candidates.includes(k));
    // Por defecto, periodos COMPLETOS (excluye el mes/semana/trimestre/año en curso,
    // que está incompleto y aplastaría la comparación). Si no hay suficientes, se rellenan.
    const complete = candidates.filter(k => !isPartial(k, dim));
    const base = complete.slice(0, defaultN[dim]);
    if (base.length < defaultN[dim]) {
      candidates.filter(k => isPartial(k, dim)).slice(0, defaultN[dim] - base.length).forEach(k => base.push(k));
    }
    return base;
  }, [sel, dim, candidates]);

  const toggle = (k: string) => {
    const cur = active;
    const next = cur.includes(k)
      ? cur.filter(x => x !== k)
      : cur.length >= MAX_SERIES ? cur : [...cur, k];
    setSel(s => ({ ...s, [dim]: next }));
  };

  const { seriesRows, totals, grand } = useMemo(() => {
    // Suma por (periodo, posición) para la métrica activa
    const acc = new Map<string, Map<number, number>>(); // periodoKey -> pos -> total
    const add = (key: string, d: Date, amount: number) => {
      if (!active.includes(key)) return;
      const pos = posInPeriod(d, dim);
      const m = acc.get(key) || new Map();
      m.set(pos, (m.get(pos) || 0) + amount);
      acc.set(key, m);
    };
    expenses.forEach(e => { if (metric !== 'ingreso') add(periodKeyOf(e.date, dim), parseDate(e.date), e.amount); });
    incomes.forEach(i => { if (metric !== 'gasto') add(periodKeyOf(i.date, dim), parseDate(i.date), i.amount); });

    // Filas del overlay (una por posición del eje X). Dentro del periodo, un día sin
    // gasto vale 0 (la curva se dibuja COMPLETA bajando a cero); solo queda null lo
    // que aún no ha ocurrido (periodo en curso) o no pertenece al periodo (mes de 30 días).
    const maxPos = dim === 'meses' ? 31 : dim === 'semanas' ? 7 : dim === 'trimestres' ? 13 : 12;
    const rows: Record<string, any>[] = [];
    for (let p = 1; p <= maxPos; p++) {
      const row: Record<string, any> = { x: xLabel(p, dim) };
      active.forEach(k => {
        const v = acc.get(k)?.get(p);
        row[k] = v !== undefined ? Math.round(v * 100) / 100 : (p <= periodLength(k, dim) ? 0 : null);
      });
      rows.push(row);
    }
    const totals = active.map(k => {
      const sum = [...(acc.get(k)?.values() || [])].reduce((s, v) => s + v, 0);
      return { key: k, label: periodLabel(k, dim), total: Math.round(sum * 100) / 100 };
    });
    const grand = totals.reduce((s, t) => s + t.total, 0);
    return { seriesRows: rows, totals, grand };
  }, [active, expenses, incomes, metric, dim]);

  const colorOf = (k: string) => PALETTE[active.indexOf(k) % PALETTE.length];
  const completeTotals = totals.filter(t => !isPartial(t.key, dim));
  const avg = completeTotals.length ? completeTotals.reduce((s, t) => s + t.total, 0) / completeTotals.length : 0;
  const anyPartial = totals.length > completeTotals.length;

  return (
    <div className="card">
      <h3>Comparativas de periodos</h3>

      {/* Dimensión */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {(Object.keys(DIM_LABEL) as Dim[]).map(d => (
          <button key={d} onClick={() => setDim(d)}
            style={{
              border: dim === d ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              background: dim === d ? 'var(--primary)' : 'transparent',
              color: dim === d ? '#fff' : 'var(--text)',
              borderRadius: 999, padding: '5px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 700,
            }}>{DIM_LABEL[d]}</button>
        ))}
      </div>

      {/* Métrica */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            style={{
              border: metric === m.key ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              background: metric === m.key ? 'var(--primary)' + '22' : 'transparent',
              color: 'var(--text)',
              borderRadius: 999, padding: '4px 12px', fontSize: 12.5, cursor: 'pointer', fontWeight: metric === m.key ? 700 : 500,
            }}>{m.label}</button>
        ))}
      </div>

      {/* Periodos a comparar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 }}>
        {candidates.map(k => {
          const on = active.includes(k);
          const partial = isPartial(k, dim);
          const label = periodLabel(k, dim) + (partial ? ' *' : '');
          return (
            <button key={k} onClick={() => toggle(k)}
              title={periodLabel(k, dim) + (partial ? ' — en curso (incompleto)' : '')}
              style={{
                border: on ? `1.5px solid ${colorOf(k)}` : '1px solid var(--border)',
                background: on ? colorOf(k) + '22' : 'transparent',
                color: on ? colorOf(k) : 'var(--muted)',
                borderRadius: 999, padding: '3px 11px', fontSize: 12, cursor: 'pointer', fontWeight: on ? 700 : 500,
              }}>{label}</button>
          );
        })}
        {candidates.length === 0 && <span className="muted" style={{ fontSize: 12 }}>Sin movimientos</span>}
      </div>
      {active.length >= MAX_SERIES && (
        <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>Máximo {MAX_SERIES} periodos visibles a la vez (desmarca alguno para añadir otro).</p>
      )}

      {active.length > 0 && (
        <>
          {/* Líneas superpuestas */}
          <div style={{ marginTop: 14 }}>
            <h4 style={{ fontSize: 13, marginBottom: 4 }}>Evolución superpuesta · por {xTitle[dim].toLowerCase()}</h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={seriesRows} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: 'var(--muted)' }} minTickGap={14} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickFormatter={(v: number) => eur(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [eur(Number(v) || 0), String(name)]} />
                {active.map(k => (
                  <Line key={k} type="monotone" dataKey={k} name={periodLabel(k, dim)}
                    stroke={colorOf(k)} strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Totales en barras */}
          <div style={{ marginTop: 14 }}>
            <h4 style={{ fontSize: 13, marginBottom: 4 }}>Totales por periodo</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={totals} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickFormatter={(v: number) => eur(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [eur(Number(v)), metric === 'balance' ? 'Balance' : metric === 'gasto' ? 'Gastos' : 'Ingresos']} cursor={{ fill: 'var(--border)', opacity: 0.25 }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {totals.map(t => <Cell key={t.key} fill={colorOf(t.key)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Totales numéricos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {totals.map(t => {
              const diff = avg !== 0 ? Math.round(((t.total - avg) / Math.abs(avg)) * 100) : 0;
              const partial = isPartial(t.key, dim);
              return (
                <div key={t.key} style={{ minWidth: 120, flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 99, background: colorOf(t.key), display: 'inline-block' }} />
                    {t.label}{partial ? ' *' : ''}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 3 }}>{eur(t.total)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {partial ? <span style={{ color: 'var(--warning)', fontWeight: 700 }}>en curso · incompleto</span> : totals.length > 1 && (
                      diff >= 0 ? <span style={{ color: '#10b981' }}>▲ {diff}%</span> : <span style={{ color: '#ef4444' }}>▼ {Math.abs(diff)}%</span>
                    )}
                    {!partial && totals.length > 1 && ' vs media'}
                  </div>
                </div>
              );
            })}
            {totals.length > 1 && (
              <div style={{ minWidth: 120, flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px', background: 'var(--surface2)' }}>
                <div style={{ fontWeight: 700, fontSize: 12.5 }}>Total conjunto</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 3 }}>{eur(grand)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {anyPartial ? `media (completos) ${eur(Math.round(avg * 100) / 100)}` : `media ${eur(Math.round(avg * 100) / 100)}`}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
