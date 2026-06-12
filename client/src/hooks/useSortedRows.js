// Hook utilitaire : retourne une copie triee de `rows` selon un objet
// `sort` { col, dir } et un dict d'accessors par colonne.
// Tri locale-aware (fr + numeric) pour comparer prix, noms, dates...
export function useSortedRows(rows, sort, accessors) {
  if (!sort.col || !accessors[sort.col]) return rows;
  const get = accessors[sort.col];
  const dir = sort.dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb), 'fr', { numeric: true }) * dir;
  });
}
