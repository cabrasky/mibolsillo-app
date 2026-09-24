import { normText, refKeyOf } from './i18n';

// Color estable por categoría (propósito) para chips y etiquetas. Las clases
// cat-c0…cat-c7 están en App.css con variante de modo oscuro. Se asocia a la
// clave i18n de la categoría, así "Comida", "Food" y "comida" comparten color.
const FIXED: Record<string, number> = {
  'ref.categories.ai': 0,
  'ref.categories.drink': 1,
  'ref.categories.subscriptions': 2, 'ref.categories.savings': 2, 'ref.categories.pharmacy': 2,
  'ref.categories.leisure': 3,
  'ref.categories.food': 4, 'ref.categories.sport': 4,
  'ref.categories.charity': 5, 'ref.categories.products': 5,
  'ref.categories.stay': 6,
  'ref.categories.transport': 7,
};

export function catColor(name: string): string {
  const key = refKeyOf('categories', name);
  if (key && key in FIXED) return `cat-c${FIXED[key]}`;
  let h = 0;
  for (const ch of key || normText(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `cat-c${h % 8}`;
}
