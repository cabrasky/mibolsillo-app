import { useMemo, useRef, useState } from 'react';
import { expenseCost, REF, getMonth } from '../types';
import type { Expense } from '../types';
import { loadData } from '../store';
import { apiSendToCC, apiUploadExpensePhoto, apiDeleteExpensePhoto, fetchExpensePhotoUrl } from '../api';
import { useLocale, localizeError } from '../i18n';
import { IconSearch, IconEdit, IconTrash, IconCheckCircle, IconXCircle, IconCamera } from './Icons';

interface Props {
  expenses: Expense[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onEdit, onDelete }: Props) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [filterProp, setFilterProp] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProj, setFilterProj] = useState('');
  const [busyCc, setBusyCc] = useState<string | null>(null);
  const [ccRefs, setCcRefs] = useState<Record<string, string>>({});
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const projects = loadData().projects;

  const filtered = useMemo(() => expenses.filter(e => {
    const query = search.toLowerCase();
    return (!query || e.desc.toLowerCase().includes(query) || e.motivo.toLowerCase().includes(query))
      && (!filterProp || e.proposito === filterProp)
      && (!filterMonth || getMonth(e.date) === Number(filterMonth))
      && (!filterProj || (filterProj === '__none__' ? !e.proyectoId : e.proyectoId === filterProj));
  }).sort((a, b) => b.date.localeCompare(a.date)), [expenses, search, filterProp, filterMonth, filterProj]);

  const closePhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoId(null); setPhotoUrl(null); setPhotoError('');
  };

  const openPhoto = async (expense: Expense) => {
    setPhotoId(expense.id); setPhotoUrl(null); setPhotoError('');
    try { setPhotoUrl((await fetchExpensePhotoUrl(expense.id)).url); }
    catch (error) { setPhotoError(localizeError(error, t)); }
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!photoId || !file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError(t('error.photoUpload')); return;
    }
    setPhotoBusy(true); setPhotoError('');
    try {
      await apiUploadExpensePhoto(photoId, file, file.name, file.type);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoUrl((await fetchExpensePhotoUrl(photoId)).url);
    } catch (error) { setPhotoError(localizeError(error, t)); }
    finally { setPhotoBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const deletePhoto = async () => {
    if (!photoId) return;
    setPhotoBusy(true); setPhotoError('');
    try { await apiDeleteExpensePhoto(photoId); closePhoto(); }
    catch (error) { setPhotoError(localizeError(error, t)); }
    finally { setPhotoBusy(false); }
  };

  const pushCc = async (expense: Expense) => {
    setBusyCc(expense.id);
    try {
      const result = await apiSendToCC(expense.id);
      setCcRefs(prev => ({ ...prev, [expense.id]: JSON.stringify(result) }));
    }
    catch (error) { alert(localizeError(error, t)); }
    finally { setBusyCc(null); }
  };

  const projectName = (id: string) => projects.find(p => p.id === id)?.name || '';
  const total = filtered.reduce((sum, expense) => sum + expenseCost(expense), 0);
  const participants = (expense: Expense) => {
    try { const value = JSON.parse(expense.personas || '[]'); return Array.isArray(value) ? value.filter((p: any) => p?.n) : []; }
    catch { return []; }
  };
  const ccUrl = (expense: Expense) => {
    try { const value = JSON.parse(ccRefs[expense.id] || expense.ref_cc || ''); return value?.receipt?.url || value?.url || ''; }
    catch { return ''; }
  };

  return <div className="card">
    <div className="card-header"><h3>Gastos ({filtered.length})</h3><span className="card-total">{total.toFixed(2)} EUR</span></div>
    <div className="search-box">
      <div className="search-input-wrap"><IconSearch size={14} /><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <select value={filterProp} onChange={e => setFilterProp(e.target.value)}><option value="">Todos</option>{REF.propositos.map(p => <option key={p}>{p}</option>)}</select>
      <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}><option value="">Todos los meses</option>{REF.meses.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
      <select value={filterProj} onChange={e => setFilterProj(e.target.value)}><option value="">Todos los proyectos</option><option value="__none__">Sin proyecto</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    </div>
    {filtered.length === 0 ? <div className="empty"><IconSearch size={24} /><p>Sin resultados</p></div> : <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Descripcion</th><th>Importe</th><th>Proposito</th><th>Metodo</th><th>Deuda</th><th /></tr></thead><tbody>
      {filtered.map(expense => { const people = participants(expense); const url = ccUrl(expense); return <tr key={expense.id}>
        <td>{expense.date}</td><td><strong>{expense.desc}</strong>{expense.motivo && <span className="td-meta">{expense.motivo}</span>}{expense.invitacion ? <span className="td-meta">Invitación</span> : null}{expense.proyectoId && <span className="td-meta">📁 {projectName(expense.proyectoId)}</span>}{people.length > 0 && (url ? <a className="btn sm outline cc-action" href={url} target="_blank" rel="noreferrer">En CC ↗</a> : <button className="btn sm outline cc-action" type="button" onClick={() => pushCc(expense)} disabled={busyCc === expense.id}>{busyCc === expense.id ? 'Enviando…' : 'Añadir a CC'}</button>)}</td>
        <td className="td-amount">{expense.amount.toFixed(2)} EUR</td><td><span className="tag">{expense.proposito}</span></td><td className="td-muted">{expense.metodo}</td><td className="td-icon">{expense.deudores ? (expense.devuelto === 'yes' ? <IconCheckCircle className="icon-success" size={14} /> : <IconXCircle className="icon-danger" size={14} />) : '-'}</td>
        <td><div className="row-actions"><button className="btn sm outline" onClick={() => openPhoto(expense)} title="Foto"><IconCamera size={14} /></button><button className="btn sm outline" onClick={() => onEdit(expense.id)} title="Editar"><IconEdit size={14} /></button><button className="btn sm danger" onClick={() => onDelete(expense.id)} title="Eliminar"><IconTrash size={14} /></button></div></td>
      </tr>; })}
    </tbody></table></div>}
    {photoId && <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closePhoto(); }}><div className="modal modal-sm"><div className="modal-header"><h2>Foto del ticket</h2><button className="modal-close" onClick={closePhoto}>×</button></div><div className="modal-body">{photoError && <p className="error">{photoError}</p>}{photoUrl && <img src={photoUrl} alt="Ticket" style={{ maxWidth: '100%' }} />}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => uploadPhoto(e.target.files?.[0])} /><button className="btn sm" disabled={photoBusy} onClick={() => fileRef.current?.click()}>Subir foto</button>{photoUrl && <button className="btn sm danger" disabled={photoBusy} onClick={() => deletePhoto()}>Borrar foto</button>}</div></div></div>}
  </div>;
}
