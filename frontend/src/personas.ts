import type { Expense } from './types';

// Personas de un gasto compartido (JSON "participants", claves en inglés):
// [{n: nombre, m: importe, r: 'deb'|'inv', repaid: bool, method: tipo devolución}]
export type Persona = { n: string; m: number; r: 'deb' | 'inv'; repaid: boolean; method: string };

const r2 = (n: number) => Math.round(n * 100) / 100;

export function parsePersonas(raw?: string | null): Persona[] {
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

export function serializePersonas(ps: Persona[]): string {
  return JSON.stringify(ps.map(p => ({ n: p.n.trim(), m: r2(Number(p.m) || 0), r: p.r, repaid: !!p.repaid, method: p.method || '' })));
}

// Personas de un gasto con fallback legacy: si no hay JSON se derivan de "deudores"
// repartiendo "ajeno", y el flag global "devuelto" se propaga a cada deudor.
export function personasOf(e: Pick<Expense, 'personas' | 'deudores' | 'ajeno' | 'devuelto' | 'deudaMetodo'>): Persona[] {
  let ps = e.personas ? parsePersonas(e.personas) : (() => {
    const raw = (e.deudores || '').trim();
    if (!raw) return [];
    const names = raw.split(/\s*(?:,|;|\s+y\s+|\s+e\s+)\s*/).map(x => x.trim()).filter(Boolean);
    if (!names.length) return [];
    const tot = Number(e.ajeno) || 0;
    const per = r2(tot / names.length);
    return names.map((n, i) => ({ n, m: i === names.length - 1 ? r2(tot - per * (names.length - 1)) : per, r: 'deb' as const, repaid: false, method: '' }));
  })();
  if (ps.length && e.devuelto === 'yes') {
    ps = ps.map(p => (p.r === 'deb' ? { ...p, repaid: true, method: p.method || e.deudaMetodo || 'Bizum' } : p));
  }
  return ps;
}

// Campos globales derivados de las devoluciones por persona (todos devueltos / primer método devuelto).
export function repaySummary(ps: Persona[]): { devuelto: 'yes' | 'no'; deudaMetodo: string } {
  const debtors = ps.filter(p => p.r === 'deb');
  const all = debtors.length > 0 && debtors.every(p => p.repaid);
  return { devuelto: all ? 'yes' : 'no', deudaMetodo: debtors.find(p => p.repaid)?.method || 'Bizum' };
}

// Deudores con devolución pendiente (para contadores/badges).
export function pendingDebtCount(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + personasOf(e).filter(p => p.r === 'deb' && !p.repaid && p.n.trim()).length, 0);
}
