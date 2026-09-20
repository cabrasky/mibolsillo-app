import { useState, useMemo, useRef, useCallback } from 'react';
import { REF, getMonth } from '../types';
import type { Expense } from '../types';
import { loadData } from '../store';
import { apiSendToCC, apiUploadExpensePhoto, apiDeleteExpensePhoto, fetchExpensePhotoUrl } from '../api';
import { IconSearch, IconEdit, IconTrash, IconCheckCircle, IconXCircle, IconCamera } from './Icons';

interface Props {
  expenses: Expense[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [ccRefs, setCcRefs] = useState<Record<string, string>>({});
  const [busyCc, setBusyCc] = useState<string | null>(null);
  const [filterProp, setFilterProp] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProj, setFilterProj] = useState('');

  // Foto del ticket (subir / ver / reemplazar / borrar)
  const [photoOpenId, setPhotoOpenId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState('');
  const [photoFlags, setPhotoFlags] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const hasPhoto = (id: string) => {
    if (photoFlags[id] !== undefined) return photoFlags[id];
    return !!expenses.find(e => e.id === id)?.hasPhoto;
  };

  // Limpia la URL blob anterior al cerrar
  const closePhoto = useCallback(() => {
    setPhotoUrl(p => { if (p) URL.revokeObjectURL(p); return null; });
    setPhotoOpenId(null); setPhotoErr('');
  }, []);

  const openPhoto = useCallback(async (e: Expense) => {
    setPhotoOpenId(e.id); setPhotoErr(''); setPhotoUrl(null);
    try {
      const res = await fetchExpensePhotoUrl(e.id);
      setPhotoUrl(res.url);
    } catch (err: any) {
      setPhotoErr(err?.message || 'Este gasto no tiene foto');
    }
  }, []);

  const onPickFile = useCallback(async (file: File | undefined) => {
    const id = photoOpenId;
    if (!id || !file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoErr('Solo jpeg/png/webp');
      return;
    }
    setPhotoBusy(true); setPhotoErr('');
    try {
      await apiUploadExpensePhoto(id, file, file.name, file.type);
      setPhotoFlags(p => ({ ...p, [id]: true }));
      // recargar la foto (ahora es la nueva)
      setPhotoUrl(p => { if (p) URL.revokeObjectURL(p); return null; });
      const res = await fetchExpensePhotoUrl(id);
      setPhotoUrl(res.url);
    } catch (err: any) {
      setPhotoErr(err?.message || 'No se pudo subir');
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [photoOpenId]);

  const deletePhoto = useCallback(async () => {
    const id = photoOpenId;
    if (!id) return;
    setPhotoBusy(true); setPhotoErr('');
    try {
      await apiDeleteExpensePhoto(id);
      setPhotoFlags(p => ({ ...p, [id]: false }));
      closePhoto();
    } catch (err: any) {
      setPhotoErr(err?.message || 'No se pudo borrar');
    } finally { setPhotoBusy(false); }
  }, [photoOpenId, closePhoto]);

  const projects = loadData().projects;
  const projectName = (id: string) => projects.find(p => p.id === id)?.name || '';

  const filtered = useMemo(() => {
    let list = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => e.desc.toLowerCase().includes(q) || e.motivo.toLowerCase().includes(q));
    }
    if (filterProp) list = list.filter(e => e.proposito === filterProp);
    if (filterMonth) list = list.filter(e => getMonth(e.date) === Number(filterMonth));
    if (filterProj === '__none__') list = list.filter(e => !e.proyectoId);
    else if (filterProj) list = list.filter(e => e.proyectoId === filterProj);
    return list;
  }, [expenses, search, filterProp, filterMonth, filterProj]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

      const personasOf = (e: Expense) => { try { const a = JSON.parse(e.personas || '[]'); return Array.isArray(a) ? a.filter((x: any) => x && x.n) : []; } catch { return []; } };
      const ccInfo = (e: Expense) => { const raw = ccRefs[e.id] || e.ref_cc || ''; try { const o = JSON.parse(raw); return o?.receipt?.url || o?.url || ''; } catch { return ''; } };
      const pushCc = async (e: Expense) => {
        setBusyCc(e.id);
        try {
          const r = await apiSendToCC(e.id);
          setCcRefs(prev => ({ ...prev, [e.id]: JSON.stringify(r) }));
        } catch (err: any) {
          alert(err?.message || 'No se pudo enviar a Cuentas Claras');
        } finally { setBusyCc(null); }
      };
  return (
    <div className="card">
      <div className="card-header">
        <h3>Gastos ({filtered.length})</h3>
        <span className="card-total">{total.toFixed(2)} EUR</span>
      </div>

      <div className="search-box">
        <div className="search-input-wrap">
          <IconSearch size={14} />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterProp} onChange={e => setFilterProp(e.target.value)}>
          <option value="">Todos</option>
          {REF.propositos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">Todos los meses</option>
          {REF.meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)}>
          <option value="">Todos los proyectos</option>
          <option value="__none__">Sin proyecto</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <IconSearch size={24} />
          <p>Sin resultados</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Descripcion</th><th>Importe</th><th>Proposito</th><th>Metodo</th><th>Deuda</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>
                    <strong>{e.desc}</strong>
                    {e.motivo && <span className="td-meta">{e.motivo}</span>}
                    {(!!e.invitacion || personasOf(e).length > 0) && (
                      <>
                        {!!e.invitacion && <span style={{ display: 'inline-block', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 999, padding: '1px 8px', fontSize: 11, marginLeft: 6 }} title="Invitación: pagado por ti sin devolución">Invitación</span>}
                        {personasOf(e).length > 0 && (ccInfo(e)
                          ? <a href={ccInfo(e)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: 999, padding: '1px 8px', fontSize: 11, marginLeft: 6, textDecoration: 'none' }}>En CC ↗</a>
                          : <button type="button" disabled={busyCc === e.id} onClick={() => pushCc(e)} style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: 999, padding: '1px 8px', fontSize: 11, marginLeft: 6, cursor: 'pointer' }}>{busyCc === e.id ? 'Enviando…' : 'Añadir a CC'}</button>)}
                      </>
                    )}
                    {e.proyectoId && <span className="td-meta">📁 {projectName(e.proyectoId)}</span>}
                  </td>
                  <td className="td-amount">{e.amount.toFixed(2)} EUR</td>
                  <td><span className={`tag tag-${e.proposito?.toLowerCase().replace(/[\/\s]/g, '')}`}>{e.proposito}</span></td>
                  <td className="td-muted">{e.metodo}</td>
                  <td className="td-icon">
                    {e.deudores ? (
                      e.devuelto === 'yes'
                        ? <IconCheckCircle size={14} className="icon-success" />
                        : <IconXCircle size={14} className="icon-danger" />
                    ) : <span className="td-muted">-</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn sm outline" onClick={() => openPhoto(e)} title={hasPhoto(e.id) ? 'Ver foto del ticket' : 'Añadir foto del ticket'}><IconCamera size={14} className={hasPhoto(e.id) ? 'icon-success' : undefined} /></button>
                      <button className="btn sm outline" onClick={() => onEdit(e.id)} title="Editar"><IconEdit size={14} /></button>
                      <button className="btn sm danger" onClick={() => onDelete(e.id)} title="Eliminar"><IconTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal foto del ticket ──────────────────────────── */}
      {photoOpenId && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closePhoto(); }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2>Foto del ticket</h2>
              <button className="modal-close" onClick={closePhoto} title="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              {photoErr && <p style={{ color: '#b91c1c', fontSize: 13, margin: '0 0 12px' }}>{photoErr}</p>}
              {photoUrl ? (
                <img src={photoUrl} alt="Ticket" style={{ maxWidth: '100%', maxHeight: '55vh', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              ) : (
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>Este gasto aún no tiene foto del ticket.</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => onPickFile(e.target.files?.[0])}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn sm" disabled={photoBusy} onClick={() => fileRef.current?.click()}>
                  {photoUrl ? 'Reemplazar foto' : 'Subir foto'}
                </button>
                {photoUrl && (
                  <button className="btn sm danger" disabled={photoBusy} onClick={() => { if (confirm('¿Borrar la foto del ticket?')) deletePhoto(); }}>
                    Borrar foto
                  </button>
                )}
                {photoBusy && <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>Procesando…</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
