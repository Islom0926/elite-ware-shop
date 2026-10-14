const KEY = 'tma-shop:favorites';

function readAll(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeAll(ids: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // ignore persistence failures (e.g. private mode)
  }
}

export function isFavorite(productId: string): boolean {
  return readAll().has(productId);
}

export function toggleFavorite(productId: string): boolean {
  const ids = readAll();
  const next = !ids.has(productId);
  if (next) ids.add(productId);
  else ids.delete(productId);
  writeAll(ids);
  return next;
}
