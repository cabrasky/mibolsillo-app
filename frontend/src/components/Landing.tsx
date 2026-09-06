/* ── Landing pública (no autenticados) ────────────────────────────────────── */
import { Link } from 'react-router-dom';
import { IconDownload, IconGrid, IconList, IconRefresh, IconSmartphone, IconTarget, IconWallet } from './Icons';

const APK_URL = '/apk/mibolsillo-1.0.0.apk';

const col = {
  primary: 'var(--primary-strong)',
  text: 'var(--text)',
  muted: 'var(--text-muted)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  border: 'var(--border)',
  bg: 'var(--bg)',
  ok: 'var(--ok, #059669)',
};

const FEATURES = [
  { icon: 'list', title: 'El modelo de tu Excel', desc: 'Categorías reales (Ocio, Comida, Bebida…), motivos, tipos y buckets Fijo/Puntual/Viajes/Inversión calculados solos.' },
  { icon: 'grid', title: 'Gastos por proyectos', desc: 'Crea proyectos (NAS, homelab…) y enlaza sus compras. Desglose del coste total de cada uno vs. uso general.' },
  { icon: 'refresh', title: 'Suscripciones con un toque', desc: 'Netflix, gimnasio… marca "Pagado" y registra el gasto y avanza el ciclo automáticamente.' },
  { icon: 'target', title: 'Metas de ahorro', desc: 'Viajes, fondo de emergencia… con progreso y aportaciones rápidas.' },
  { icon: 'wallet', title: 'Tuyo, en tu servidor', desc: 'Sin nubes de terceros: tus datos viven en tu propio servidor. Web y app móvil sincronizados al instante.' },
  { icon: 'phone', title: 'En tu bolsillo', desc: 'App Android nativa (APK) con el mismo aspecto y datos que la web. Y en cualquier navegador.' },
  { icon: 'refresh', title: 'Conectado a Cuentas Claras', desc: '¿Gasto compartido? Envíalo a Cuentas Claras con un toque y gestiona el reparto entre amigos sin salir de tu flujo.' },
];

export default function Landing() {
  return (
    <div style={{ backgroundColor: col.bg, minHeight: '100vh', color: col.text }}>
      {/* Header */}
      <header style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="miBolsillo" style={{ width: 26, height: 26, borderRadius: 8 }} />
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>miBolsillo</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/register" style={{ textDecoration: 'none', color: col.text, fontWeight: 700, fontSize: 14, padding: '8px 12px' }}>Crear cuenta</Link>
          <Link to="/login" className="btn primary" style={{ textDecoration: 'none', padding: '9px 18px', borderRadius: 12 }}>Entrar</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 22px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30, alignItems: 'center' }}>
        <div>
          <span style={{ display: 'inline-block', backgroundColor: 'var(--primary-light)', color: col.primary, fontWeight: 800, fontSize: 12, padding: '5px 12px', borderRadius: 999, marginBottom: 16, letterSpacing: .3 }}>
            Control de gastos personal · self-hosted
          </span>
          <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.08, margin: '0 0 14px' }}>
            Todo tu dinero,<br />claro y <span style={{ color: col.primary }}>en casa</span>.
          </h1>
          <p style={{ color: col.muted, fontSize: 16, lineHeight: 1.55, margin: '0 0 22px', maxWidth: 460 }}>
            Anota cada gasto como se lo dirías a tu Excel: categoría, motivo, método… y la app lo clasifica sola en Fijo, Puntual, Viajes e Inversión. Web + app Android sincronizadas.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href={APK_URL} className="btn primary" style={{ textDecoration: 'none', padding: '13px 22px', borderRadius: 14, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconSmartphone size={18} /> Descargar app Android
            </a>
            <Link to="/login" style={{ textDecoration: 'none', padding: '13px 22px', borderRadius: 14, fontSize: 15, fontWeight: 800, color: col.text, border: '1.5px solid var(--border-strong)' }}>
              Abrir la web app →
            </Link>
          </div>
          <p style={{ color: col.muted, fontSize: 12.5, marginTop: 12 }}>Requiere Android 8+ · APK directo (no está en Google Play) · tus datos nunca salen de tu servidor</p>
        </div>

        {/* Mock de la app */}
        <div style={{ perspective: 1200 }}>
          <div style={{ backgroundColor: col.surface, border: `1px solid ${col.border}`, borderRadius: 24, padding: 18, boxShadow: '0 24px 60px rgba(6,78,59,.14)', transform: 'rotateY(-6deg) rotateX(2deg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="brand-logo" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15 }}>€</div>
                <span style={{ fontWeight: 800, letterSpacing: '-.3px' }}>miBolsillo</span>
              </div>
              <span style={{ fontSize: 11, color: col.muted }}>Septiembre 2026</span>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', borderRadius: 16, padding: 14, color: '#fff', marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: .85, fontWeight: 700 }}>Balance del mes</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>+326,41 €</div>
            </div>
            {[
              { d: 'Inversión S&P500', c: 'Ahorro/Inversión', a: '450,00 €', neg: true },
              { d: 'Energética y chuches (c. Juan)', c: 'Comida', a: '3,50 €', neg: true },
              { d: 'Coca-Cola 25 años Yambo', c: 'Bebida', a: '2,90 €', neg: true },
              { d: 'Nómina', c: 'Ingreso', a: '800,00 €', neg: false },
            ].map(r => (
              <div key={r.d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${col.border}` }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.d}</div>
                  <div style={{ fontSize: 11, color: col.muted }}>{r.c}</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 13.5, color: r.neg ? col.text : col.ok }}>{r.a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 22px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', textAlign: 'center', marginBottom: 28 }}>Simple por fuera, potente por dentro</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {FEATURES.map(f => {
            const Icon = { list: IconList, grid: IconGrid, refresh: IconRefresh, target: IconTarget, wallet: IconWallet, phone: IconSmartphone }[f.icon] as any;
            return (
              <div key={f.title} style={{ backgroundColor: col.surface, border: `1px solid ${col.border}`, borderRadius: 18, padding: 18 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 13, backgroundColor: 'var(--primary-light)', color: col.primary, marginBottom: 12 }}>
                  <Icon size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: col.muted, fontSize: 13.5, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Descarga */}
      <section id="descarga" style={{ maxWidth: 760, margin: '0 auto', padding: '0 22px 60px' }}>
        <div style={{ background: 'linear-gradient(140deg, #0f766e, #0d9488 60%, #0891b2)', borderRadius: 26, padding: '34px 28px', color: '#fff', textAlign: 'center' }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 22, backgroundColor: "rgba(255,255,255,.16)", color: "#fff", marginBottom: 10 }}><IconSmartphone size={36} /></div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-.8px' }}>Descarga la app Android</h2>
          <p style={{ opacity: .9, fontSize: 14.5, margin: '0 auto 20px', maxWidth: 460, lineHeight: 1.5 }}>
            La misma experiencia que la web en tu móvil: gastos, proyectos, suscripciones y metas sincronizados con tu servidor.
          </p>
          <a
            href={APK_URL}
            download
            style={{ display: 'inline-block', backgroundColor: '#fff', color: '#0f766e', fontWeight: 800, padding: '14px 26px', borderRadius: 14, fontSize: 15.5, textDecoration: 'none' }}
          >
            <IconDownload size={18} /> Descargar el APK de miBolsillo
          </a>
          <div style={{ marginTop: 14, fontSize: 12.5, opacity: .85, lineHeight: 1.7 }}>
            Versión 1.0.0 · ~40 MB · Android 8+<br />
            Al instalar, permite «fuentes desconocidas» (solo esta vez) · actualizaciones: descarga el nuevo APK y reinstala encima
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${col.border}`, padding: '22px', textAlign: 'center', color: col.muted, fontSize: 13 }}>
        miBolsillo · control de gastos personal · hecho en casa (cabrasky.net) · <Link to="/login" style={{ color: col.primary, fontWeight: 700, textDecoration: 'none' }}>Iniciar sesión</Link>
      </footer>
    </div>
  );
}
