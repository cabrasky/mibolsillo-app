/* ── Proyectos: gastos enlazables a proyectos (NAS, homelab…) vs uso general ── */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n';
import { expenseCost } from '../types';
import type { Project } from '../types';
import { loadData, addProject, updateProject, deleteProject } from '../store';
import { IconPlus, IconX, IconEdit, IconTrash, IconArrowRight } from './Icons';

interface Props {
  onRefresh: () => void;
  onAddToProject: (projectId: string) => void;
}

export default function ProjectsPage({ onRefresh, onAddToProject }: Props) {
  const { t } = useLocale();
  const data = loadData();
  const projects = data.projects;
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const statsFor = (id: string) => {
    const list = data.expenses.filter(e => e.proyectoId === id);
    return { count: list.length, total: list.reduce((s, e) => s + expenseCost(e), 0) };
  };
  const generalTotal = data.expenses.filter(e => !e.proyectoId).reduce((s, e) => s + expenseCost(e), 0);

  const openNew = () => {
    setEditing(null); setName(''); setError(''); setShowForm(true);
  };

  const openEdit = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setEditing(p); setName(p.name); setError(''); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t('error.nameRequired')); return; }
    if (editing) {
      updateProject(editing.id, name.trim());
    } else {
      addProject(name.trim());
    }
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    const s = statsFor(p.id);
    const extra = s.count > 0 ? `\n\n⚠️ ${s.count} gasto(s) (${s.total.toFixed(2)} EUR) quedará(n) sin proyecto (uso general).` : '';
    if (!confirm(`Eliminar el proyecto "${p.name}"?${extra}`)) return;
    deleteProject(p.id);
    onRefresh();
  };

  const handleAddExpense = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    onAddToProject(p.id);
  };

  return (
    <div>
      <div className="stats">
        <div className="stat">
          <div className="label">Proyectos</div>
          <div className="value primary">{projects.length}</div>
        </div>
        <div className="stat">
          <div className="label">Gastos en proyectos</div>
          <div className="value">{data.expenses.filter(e => e.proyectoId).length}</div>
        </div>
        <div className="stat">
          <div className="label">Invertido en proyectos</div>
          <div className="value">{data.expenses.filter(e => e.proyectoId).reduce((s, e) => s + expenseCost(e), 0).toFixed(2)} EUR</div>
        </div>
        <div className="stat">
          <div className="label">Uso general</div>
          <div className="value">{generalTotal.toFixed(2)} EUR</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Proyectos ({projects.length})</h3>
          <button className="btn primary sm" onClick={openNew}>
            <IconPlus size={14} /> Nuevo proyecto
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty">
            <p>Sin proyectos todavía. Crea uno (p. ej. "NAS") y enlaza sus gastos al añadirlos.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Gastos</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const s = statsFor(p.id);
                  return (
                    <tr key={p.id} className="row-link" onClick={() => navigate(`/projects/${p.id}`)} title="Ver desglose">
                      <td>
                        <strong>📁 {p.name}</strong>
                        <span className="td-meta">Ver desglose →</span>
                      </td>
                      <td>{s.count}</td>
                      <td className="td-amount">{s.total.toFixed(2)} EUR</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn sm primary" onClick={e => handleAddExpense(e, p)} title="Añadir gasto a este proyecto">
                            <IconPlus size={14} /> Añadir gasto
                          </button>
                          <button className="btn sm outline" onClick={e => openEdit(e, p)} title="Renombrar"><IconEdit size={14} /></button>
                          <button className="btn sm outline" onClick={() => navigate(`/projects/${p.id}`)} title="Ver desglose"><IconArrowRight size={14} /></button>
                          <button className="btn sm danger" onClick={e => handleDelete(e, p)} title="Eliminar"><IconTrash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="hint" style={{ padding: '6px 4px 0', color: 'var(--text-muted)', fontSize: '.78rem' }}>
          Haz clic en un proyecto para ver el desglose de todo lo que lo compone. Los gastos sin
          proyecto son de uso general (auriculares, móvil…).
        </p>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Renombrar proyecto' : 'Nuevo proyecto'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)} type="button"><IconX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="NAS, Homelab, Bici..." autoFocus />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{error}</p>}
              <div className="form-actions">
                <button type="submit" className="btn primary">{editing ? 'Guardar' : 'Crear proyecto'}</button>
                <button type="button" className="btn outline" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
