import { useState, useEffect, useRef } from 'react';
import { REF } from '../types';
import { addExpense, updateExpense, loadData, suggestExpense, type Suggestion } from '../store';
import type { Expense } from '../types';
import { useLocale, refLabel, fill } from '../i18n';
import RichText from './RichText';
import { personasOf, repaySummary, serializePersonas, type Persona } from '../personas';

interface Props {
  isOpen: boolean;
  editExpense?: Expense | null;
  onClose: () => void;
  onSaved: () => void;
  presetProjectId?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function AddExpense({ isOpen, editExpense, onClose, onSaved, presetProjectId = '' }: Props) {
  const { t } = useLocale();
  const isEdit = !!editExpense;
  const today = new Date().toISOString().slice(0, 10);
  const projects = loadData().projects;

  const [date, setDate] = useState(today);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [proposito, setProposito] = useState('');
  const [metodo, setMetodo] = useState('Tarjeta');
  const [motivo, setMotivo] = useState('');
  const [tipo, setTipo] = useState('Puntual');
  const [proyectoId, setProyectoId] = useState('');
  const [showShared, setShowShared] = useState(false);
  const [ajeno, setAjeno] = useState(0);
  const [invitacion, setInvitacion] = useState(0);
  const [deudores, setDeudores] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [viaje, setViaje] = useState('');
  const [errors, setErrors] = useState<{ desc?: string; amount?: string }>({});
  const [sug, setSug] = useState<Suggestion | null>(null);
  const sugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sugTimer.current) clearTimeout(sugTimer.current);
    const q = desc.trim();
    if (!q || q.length < 3) { setSug(null); return; }
    sugTimer.current = setTimeout(() => {
      if (editExpense) { setSug(null); return; }
      const s = suggestExpense(q);
      setSug(s && (s.proposito || s.tipo || s.motivo || s.metodo !== 'Tarjeta') ? s : null);
    }, 300);
    return () => { if (sugTimer.current) clearTimeout(sugTimer.current); };
  }, [desc, editExpense]);

  const applySug = () => {
    if (!sug) return;
    setProposito(sug.proposito); setTipo(sug.tipo); setMotivo(sug.motivo); setMetodo(sug.metodo);
    if (sug.proyectoId) setProyectoId(sug.proyectoId);
    setSug(null);
  };

  useEffect(() => {
    if (editExpense) {
      setDate(editExpense.date);
      setDesc(editExpense.desc);
      setAmount(editExpense.amount);
      setProposito(editExpense.proposito);
      setMetodo(editExpense.metodo || 'Tarjeta');
      setMotivo(editExpense.motivo);
      setTipo(editExpense.tipo || 'Puntual');
      setProyectoId(editExpense.proyectoId || '');
      setAjeno(editExpense.ajeno || 0);
      setInvitacion(editExpense.invitacion ? 1 : 0);
      setDeudores(editExpense.deudores || '');
      // Incluye la migración lazy del flag global "devuelto" a cada deudor
      setPersonas(personasOf(editExpense));
      setViaje(editExpense.viaje || '');
      setShowShared(!!(editExpense.ajeno || editExpense.deudores || editExpense.devuelto === 'yes' || editExpense.viaje));
    } else {
      setDate(today);
      setDesc('');
      setAmount(0);
      setProposito('');
      setMetodo('Tarjeta');
      setMotivo('');
      setTipo('Puntual');
      setProyectoId(presetProjectId);
      setAjeno(0);
      setInvitacion(0);
      setDeudores('');
      setPersonas([]);
      setViaje('');
      setShowShared(false);
    }
    setErrors({});
  }, [editExpense, isOpen, presetProjectId]);

  if (!isOpen) return null;

  // "Me corresponde" se calcula solo (importe − partes que te deben), como en la plantilla
  const debtSum = personas.reduce((s2, x) => s2 + (x.r === 'deb' ? (Number(x.m) || 0) : 0), 0);
  const invSum = personas.reduce((s2, x) => s2 + (x.r === 'inv' ? (Number(x.m) || 0) : 0), 0);
  const ajenoEf = personas.length ? debtSum : ajeno;
  const meCorresponde = round2(Math.max(0, amount - ajenoEf));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { desc?: string; amount?: string } = {};
    if (!desc.trim()) errs.desc = t('error.descriptionRequired');
    const amt = Number(amount);
    if (!amt || amt <= 0 || !isFinite(amt)) errs.amount = t('error.amountPositive');
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const per = personas.filter(x => x.n.trim());
    const debtors = per.filter(x => x.r === 'deb');
    const allInv = per.length > 0 && per.every(x => x.r === 'inv');
    const repay = repaySummary(per);
    const data: any = {
      date, desc: desc.trim(), amount: round2(amt), proposito, metodo,
      motivo: motivo.trim(), tipo: tipo.trim(),
      ajeno: showShared ? Math.min(ajenoEf, round2(amt)) : 0,
      invitacion: allInv ? 1 : (invitacion ? 1 : 0),
      deudores: showShared ? (per.length ? debtors.map(x => x.n.trim()).join(', ') : deudores.trim()) : '',
      personas: per.length ? serializePersonas(per) : (editExpense?.personas || ''),
      deudaMetodo: showShared ? repay.deudaMetodo : 'Bizum',
      devuelto: showShared ? repay.devuelto : 'no',
      meCorresponde: showShared ? round2(Math.max(0, amt - (per.length ? debtSum : ajeno))) : round2(amt),
      viaje: showShared ? viaje.trim() : '',
      proyectoId,
    };

    if (isEdit && editExpense) {
      updateExpense(editExpense.id, data);
    } else {
      addExpense(data);
    }
    onSaved();
  };

  const upP = (i: number, patch: Partial<Persona>) => setPersonas(ps => ps.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const addP = () => setPersonas(ps => [...ps, { n: '', m: 0, r: 'deb', repaid: false, method: 'Bizum' }]);
  const delP = (i: number) => setPersonas(ps => ps.filter((_, k) => k !== i));
  const allInvited = () => setPersonas(ps => ps.map(x => ({ ...x, r: 'inv' as const })));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${isEdit ? 'modal-edit' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('expense.editLabel') : t('nav.newExpense')}</h2>
          <button className="modal-close" onClick={onClose} type="button" title={t('common.close')} aria-label={t('common.close')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <div className="form-section-title">{t('expense.general')}</div>
            <div className="form-row three">
              <div className="form-group required">
                <label>{t('common.date')}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group required">
                <label>{t('common.amountEur')}</label>
                <div className="amount-input-wrap">
                  <span className="cur">€</span>
                  <input
                    type="number" step="0.01" min="0.01" value={amount || ''}
                    onChange={e => setAmount(Number(e.target.value))}
                    placeholder="0,00" autoFocus={!isEdit}
                    className={errors.amount ? 'input-error' : ''}
                  />
                </div>
                {errors.amount && <span className="field-error">{errors.amount}</span>}
              </div>
              <div className="form-group">
                <label>{t('expense.type')}</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)}>
                  {REF.tipos.map(x => <option key={x} value={x}>{refLabel('types', x, t)}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group required" style={{ marginBottom: 12 }}>
              <label>{t('common.description')}</label>
              <input
                type="text" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder={t('expense.placeholder')} className={errors.desc ? 'input-error' : ''}
              />
              {errors.desc && <span className="field-error">{errors.desc}</span>}
              {sug && !errors.desc && (
                <div className="sug-bar">
                  <span className="sug-icon">✦</span>
                  <span className="sug-text">
                    {fill(t('expense.suggestion'), { m: sug.match })} <b>{sug.proposito ? refLabel('categories', sug.proposito, t) : '—'}</b> · {refLabel('types', sug.tipo, t)} · {sug.motivo ? refLabel('motives', sug.motivo, t) : t('expense.noMotive')} · {refLabel('methods', sug.metodo, t)}
                  </span>
                  <button type="button" className="btn sm" onClick={applySug}>{t('common.use')}</button>
                </div>
              )}
            </div>

            <div className="form-row three">
              <div className="form-group">
                <label>{t('expense.categoryPurpose')}</label>
                <select value={proposito} onChange={e => setProposito(e.target.value)}>
                  <option value="">{t('expense.chooseCategory')}</option>
                  {REF.propositos.map(p => <option key={p} value={p}>{refLabel('categories', p, t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('expense.motiveEvent')}</label>
                <select value={motivo} onChange={e => setMotivo(e.target.value)}>
                  <option value="">{t('common.none')}</option>
                  {REF.motivos.map(m => <option key={m} value={m}>{refLabel('motives', m, t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('expense.payMethod')}</label>
                <select value={metodo} onChange={e => setMetodo(e.target.value)}>
                  <option value="">—</option>
                  {REF.metodos.map(m => <option key={m} value={m}>{refLabel('methods', m, t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="invit-check" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <input type="checkbox" checked={!!invitacion} onChange={e => setInvitacion(e.target.checked ? 1 : 0)} />
                  {t('expense.invitationFull')}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>{t('expense.projectOptional')}</label>
              <select value={proyectoId} onChange={e => setProyectoId(e.target.value)}>
                <option value="">{t('expense.noProjectGeneral')}</option>
                {projects.map(p => <option key={p.id} value={p.id}>📁 {p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-section">
            <label className="toggle-row">
              <input
                type="checkbox" checked={showShared}
                onChange={e => setShowShared(e.target.checked)}
              />
              {t('expense.shared')}
            </label>

            {showShared && (
              <>
                {personas.length === 0 && (
                  <div className="hint" style={{ margin: '4px 0 10px' }}>
                    <RichText text={t('expense.sharedHint')} />
                  </div>
                )}
                {personas.map((p, i) => (
                  <div key={i} className="persona-row">
                    <div className="persona-line">
                      <input type="text" value={p.n} placeholder={t('common.name')} onChange={e => upP(i, { n: e.target.value })} />
                      <input type="number" step="0.01" min="0" value={p.m || ''} placeholder="0,00"
                        onChange={e => upP(i, { m: Math.max(0, Number(e.target.value)) })} />
                      <div className="role-toggle">
                        <button type="button" className={p.r === 'deb' ? 'on deb' : ''} onClick={() => upP(i, { r: 'deb' })}>{t('expense.owes')}</button>
                        <button type="button" className={p.r === 'inv' ? 'on inv' : ''} onClick={() => upP(i, { r: 'inv' })}>{t('expense.invited')}</button>
                      </div>
                      <button type="button" className="btn ghost x" onClick={() => delP(i)} title={t('common.remove')} aria-label={t('common.remove')}>✕</button>
                    </div>
                    {p.r === 'deb' && (
                      <div className="persona-repay">
                        <label>{t('expense.repaid')}</label>
                        <select value={p.repaid ? 'yes' : 'no'} onChange={e => upP(i, { repaid: e.target.value === 'yes', method: p.method || 'Bizum' })}>
                          <option value="no">{t('common.no')}</option>
                          <option value="yes">{t('common.yes')}</option>
                        </select>
                        <label>{t('expense.how')}</label>
                        <select value={p.method || 'Bizum'} onChange={e => upP(i, { method: e.target.value })}>
                          {REF.refundMethods.map(m => <option key={m} value={m}>{refLabel('methods', m, t)}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
                <div className="form-row" style={{ gap: 8, marginTop: 4 }}>
                  <button type="button" className="btn outline small" onClick={addP}>{t('expense.addPerson')}</button>
                  {personas.length > 0 && (
                    <>
                      <button type="button" className="btn outline small" onClick={allInvited}>{t('expense.inviteAll')}</button>
                      <button type="button" className="btn outline small" onClick={() => setPersonas(ps => ps.map(x => ({ ...x, r: 'deb' as const })))}>{t('expense.allOwe')}</button>
                    </>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('expense.trip')}</label>
                    <input type="text" value={viaje} onChange={e => setViaje(e.target.value)} placeholder={t('expense.tripName')} />
                  </div>
                </div>
                <div className="amount-preview">
                  <span>{t('expense.yourPart')}</span>
                  <span>{meCorresponde.toFixed(2).replace('.', ',')} €</span>
                  {invSum > 0 && (
                    <>
                      <span style={{ marginLeft: 14, color: 'var(--muted)' }}>{t('expense.invited')}</span>
                      <span style={{ color: '#10b981' }}>{invSum.toFixed(2).replace('.', ',')} €</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: 6 }}>
            <button type="submit" className="btn primary">
              {isEdit ? t('common.saveChanges') : t('expense.addBtn')}
            </button>
            <button type="button" className="btn outline" onClick={onClose}>{t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
