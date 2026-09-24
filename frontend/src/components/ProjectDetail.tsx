/* ── Desglose de un proyecto: todos los gastos que lo componen ─────────────── */
import { useParams, Link, useNavigate } from 'react-router-dom';
import { expenseCost } from '../types';
import { loadData, deleteExpense, updateExpense } from '../store';
import { IconArrowLeft, IconPlus, IconTrash } from './Icons';

interface Props {
  onRefresh: () => void;
  onEditExpense: (id: string) => void;
  onAddToProject: (projectId: string) => void;
}

export default function ProjectDetail({ onRefresh, onEditExpense, onAddToProject }: Props) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const data = loadData();
  const project = data.projects.find(p => p.id === id);
  const items = data.expenses
    .filter(e => e.proyectoId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!project) {
    return (
      <div className="card">
        <div className="empty">
          <p>Proyecto no encontrado</p>
          <Link to="/projects" className="btn outline">← Volver a Proyectos</Link>
        </div>
      </div>
    );
  }

  const total = items.reduce((s, e) => s + expenseCost(e), 0);
  const pending = items.filter(e => e.devuelto !== 'yes').reduce((s, e) => s + e.meCorresponde, 0);

  const handleUnlink = (expenseId: string) => {
    if (!confirm('Quitar este gasto del proyecto (pasa a uso general)?')) return;
    updateExpense(expenseId, { proyectoId: '' });
    onRefresh();
  };

  const handleDelete = (expenseId: string) => {
    if (!confirm('Eliminar este gasto?')) return;
    deleteExpense(expenseId);
    onRefresh();
  };

  return (
    <div>
      <div className="page-head">
        <button className="back-btn" onClick={() => navigate('/projects')} title="Volver a Proyectos">
          <IconArrowLeft size={18} />
        </button>
        <div>
          <div className="page-title">📁 {project.name}</div>
          <div className="page-sub">Desglose del proyecto · {items.length} elemento(s)</div>
        </div>
      </div>

      <div className="proj-hero">
        <div>
          <div style={{ fontSize: '.78rem', opacity: .85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Invertido en {project.name}
          </div>
          <div className="proj-total">{total.toFixed(2)} €</div>
          <div className="proj-meta">Pendiente por ti: {pending.toFixed(2)} €</div>
        </div>
        <button
          className="btn"
          onClick={() => onAddToProject(project.id)}
          style={{ background: 'rgba(255,255,255,.18)', color: '#fff', backdropFilter: 'blur(4px)', boxShadow: 'none' }}
        >
          <IconPlus size={16} /> Añadir gasto
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Elementos del proyecto</h3>
          <span className="card-total">{total.toFixed(2)} EUR</span>
        </div>
        {items.length === 0 ? (
          <div className="empty">
            <p>Este proyecto aún no tiene gastos. Añade el primero con el botón "Añadir gasto".</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Elemento</th><th>Proposito</th><th>Metodo</th><th>Importe</th><th></th></tr>
              </thead>
              <tbody>
                {items.map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>
                      <strong>{e.desc}</strong>
                      {e.motivo && <span className="td-meta">{e.motivo}</span>}
                    </td>
                    <td>{e.proposito ? <span className={`tag tag-${e.proposito.toLowerCase().replace(/[\/\s]/g, '')}`}>{e.proposito}</span> : '-'}</td>
                    <td className="td-muted">{e.metodo || '-'}</td>
                    <td className="td-amount">{e.amount.toFixed(2)} EUR</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn sm outline" onClick={() => onEditExpense(e.id)} title="Editar gasto">Editar</button>
                        <button className="btn sm outline" onClick={() => handleUnlink(e.id)} title="Quitar del proyecto">Quitar</button>
                        <button className="btn sm danger" onClick={() => handleDelete(e.id)} title="Eliminar"><IconTrash size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <p className="hint" style={{ color: 'var(--text-muted)', fontSize: '.78rem', padding: '0 4px' }}>
          Consejo: usa "Editar" para cambiar detalles del elemento o "Quitar" para sacarlo del proyecto sin borrarlo.
        </p>
      )}
    </div>
  );
}
