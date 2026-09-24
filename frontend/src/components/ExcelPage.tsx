import { useRef, useState } from 'react';
import { getToken } from '../api';
import { useLocale, localizeError } from '../i18n';

const P = { box: { border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--surface)', display: 'flex', flexDirection: 'column' as const, gap: 10 } };

export default function ExcelPage({ onImported }: { onImported?: () => void }) {
  const { t } = useLocale();
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = (kind: 'template' | 'export') => {
    const link = document.createElement('a');
    link.href = `/api/excel/${kind}?token=${encodeURIComponent(getToken() || '')}`;
    link.download = ''; document.body.appendChild(link); link.click(); link.remove();
  };

  const importFile = async (file: File) => {
    setBusy(true); setMsg({});
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/excel/import', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Error ${response.status}`);
      setMsg({ ok: `Imported ${data.creados} rows${data.duplicados ? ` (${data.duplicados} duplicates skipped)` : ''}.` });
      onImported?.();
    } catch (error) { setMsg({ err: localizeError(error, t) }); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
    <div style={P.box}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Excel</h2><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Importa y exporta tus gastos en formato .xlsx.</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="btn primary" onClick={() => download('template')}>Descargar plantilla</button><button type="button" className="btn outline" onClick={() => download('export')}>Exportar gastos</button><button type="button" className="btn outline" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'Importando…' : 'Importar .xlsx'}</button><input ref={fileRef} type="file" accept=".xlsx" hidden onChange={e => { const file = e.target.files?.[0]; if (file) importFile(file); }} /></div>{msg.ok && <div className="success">{msg.ok}</div>}{msg.err && <div className="error">{msg.err}</div>}</div>
  </div>;
}
