/* ── Texto traducido con **negrita** y [enlaces](/ruta) ─────────────────── */
import { Fragment } from 'react';
import { Link } from 'react-router-dom';

const TOKEN = /\*\*(.+?)\*\*|\[(.+?)\]\((\/[^)]*)\)/g;

export default function RichText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] !== undefined ? <b>{m[1]}</b> : <Link to={m[3]}>{m[2]}</Link>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}
