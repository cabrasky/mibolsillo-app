/* ── Desarrollador: API keys y acceso programático ─────────────────────────── */
import { useEffect, useState, useCallback } from 'react';
import {
  apiGetDeveloperStatus, apiToggleDeveloper,
  apiListApiKeys, apiCreateApiKey, apiRevokeApiKey,
  type ApiKeyItem,
} from '../api';

const B = { border: '1px solid var(--border)', borderRadius: 14, padding: 16, background: 'var(--surface)', marginBottom: 12 };
const H = { margin: '0 0 8px', fontSize: 15.5, fontWeight: 800 } as const;
const P = { lineHeight: 1.7, fontSize: 13.5, color: 'var(--text)' } as const;
const CODE: React.CSSProperties = {
  display: 'block', background: 'var(--bg, #0f1115)', color: '#e5e7eb',
  borderRadius: 8, padding: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace',
  overflowX: 'auto', whiteSpace: 'pre', margin: '6px 0 12px',
};

const BASE = 'https://mibolsillo.cabrasky.net/api';

export default function DeveloperPage() {
  const [isDev, setIsDev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [newName, setNewName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const st = await apiGetDeveloperStatus();
      setIsDev(st.is_developer);
      if (st.is_developer) setKeys(await apiListApiKeys());
    } catch (e: any) {
      setError(e.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    setBusy(true); setError(null);
    try {
      const st = await apiToggleDeveloper();
      setIsDev(st.is_developer);
      if (st.is_developer) setKeys(await apiListApiKeys());
    } catch (e: any) { setError(e.message || 'Error al cambiar el modo'); }
    finally { setBusy(false); }
  };

  const create = async () => {
    setBusy(true); setError(null); setCreatedKey(null);
    try {
      const created = await apiCreateApiKey(newName);
      setCreatedKey(created.key);
      setNewName('');
      setKeys(await apiListApiKeys());
    } catch (e: any) { setError(e.message || 'Error al crear la clave'); }
    finally { setBusy(false); }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revocar esta API key? Las aplicaciones que la usen dejarán de funcionar.')) return;
    setBusy(true); setError(null);
    try {
      await apiRevokeApiKey(id);
      setKeys(await apiListApiKeys());
    } catch (e: any) { setError(e.message || 'Error al revocar'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div style={{ maxWidth: 720 }}>
      <section style={B}>
        <h2 style={H}>Modo Desarrollador</h2>
        <p style={P}>
          Actívalo para crear <b>API keys</b> y acceder a tus datos de miBolsillo
          desde scripts, apps o herramientas externas (añadir/consultar gastos,
          ingresos, metas, etc.) sin usar la web.
        </p>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
            cursor: busy ? 'default' : 'pointer', fontWeight: 700, fontSize: 14,
            background: isDev ? 'var(--danger)' : 'var(--accent, #10b981)',
            color: '#fff',
          }}
        >
          {isDev ? 'Desactivar modo Desarrollador' : 'Activar modo Desarrollador'}
        </button>
      </section>

      {!isDev ? (
        <section style={B}>
          <p style={P}>
            Activa el modo Desarrollador para ver la documentación de la API y
            gestionar tus claves.
          </p>
        </section>
      ) : (
        <>
          <section style={B}>
            <h2 style={H}>Tus API keys</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre (p. ej. script de gastos)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              />
              <button type="button" onClick={create} disabled={busy}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent, #10b981)', color: '#fff', fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
                Crear
              </button>
            </div>

            {createdKey && (
              <div style={{ border: '1px solid var(--accent, #10b981)', borderRadius: 8, padding: 12, background: 'color-mix(in srgb, var(--accent, #10b981) 10%, transparent)', marginBottom: 12 }}>
                <b style={{ fontSize: 13.5 }}>Guarda esta clave ahora — no se volverá a mostrar:</b>
                <code style={{ ...CODE, wordBreak: 'break-all', whiteSpace: 'normal' }}>{createdKey}</code>
              </div>
            )}

            {keys.length === 0 && !createdKey && (
              <p style={P}>Aún no tienes API keys.</p>
            )}

            {keys.map((k) => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{k.name || 'Sin nombre'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted, #888)' }}>
                    <code>{k.prefix}…</code>
                    {k.revoked ? ' · revocada' : k.last_used_at ? ` · usada ${new Date(k.last_used_at).toLocaleDateString()}` : ' · sin uso'}
                  </div>
                </div>
                {!k.revoked && (
                  <button type="button" onClick={() => revoke(k.id)} disabled={busy}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: busy ? 'default' : 'pointer', fontWeight: 700, fontSize: 13 }}>
                    Revocar
                  </button>
                )}
              </div>
            ))}
          </section>

          <section style={B}>
            <h2 style={H}>Cómo usar la API</h2>
            <p style={P}>Todas las peticiones llevan la cabecera <code>X-API-Key</code> con tu clave. Base: <code>{BASE}</code>.</p>

            <p style={{ ...P, fontWeight: 700 }}>Añadir un gasto:</p>
            <code style={CODE}>{`curl -X POST ${BASE}/expenses \\
  -H "X-API-Key: mb_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"date":"2026-09-17","description":"Cine","amount":15.90}'`}</code>

            <p style={{ ...P, fontWeight: 700 }}>Consultar gastos del mes:</p>
            <code style={CODE}>{`curl -H "X-API-Key: mb_live_..." \\
  "${BASE}/expenses?month=9&year=2026"`}</code>

            <p style={{ ...P, fontWeight: 700 }}>Consultar ingresos / metas / suscripciones:</p>
            <code style={CODE}>{`curl -H "X-API-Key: mb_live_..." "${BASE}/incomes"
curl -H "X-API-Key: mb_live_..." "${BASE}/goals"
curl -H "X-API-Key: mb_live_..." "${BASE}/subscriptions"`}</code>

            <p style={P}>Endpoints disponibles: <code>expenses</code>, <code>incomes</code>, <code>goals</code>, <code>subscriptions</code>, <code>projects</code>, <code>categories</code> (GET/POST/PUT/DELETE). La documentación completa está en <code>docs/API.md</code> del repositorio.</p>
          </section>
        </>
      )}

      {error && <p style={{ ...P, color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
