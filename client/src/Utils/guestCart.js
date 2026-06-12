// ============================================================
// Guest cart (utilisateur non connecte) - persiste dans localStorage
// Stocke un snapshot leger du produit pour affichage hors-ligne :
//   { product_id, quantity, snapshot: { name, price, image, stock, glycemic_index, ig_category, slug } }
// Le snapshot est rafraichi a l'ouverture du panier (donc les prix
// affiches restent corrects meme s'ils changent entre 2 visites).
//
// Cle localStorage : 'glycibio-guest-cart'
//   { items: [...], version: 1, updatedAt: <iso> }
// ============================================================

const STORAGE_KEY = 'glycibio-guest-cart';
const VERSION = 1;

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readRaw = () => {
  if (!isBrowser()) return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
};

const writeRaw = (data) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      version: VERSION,
      updatedAt: new Date().toISOString(),
    }));
    // Notifie les autres onglets / composants
    window.dispatchEvent(new CustomEvent('guest-cart-change'));
  } catch { /* quota / mode prive */ }
};

export const getGuestCart = () => readRaw().items;

export const getGuestCartCount = () => {
  return getGuestCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
};

export const clearGuestCart = () => {
  if (!isBrowser()) return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('guest-cart-change'));
};

// Snapshot minimal des champs produit utilises par le panier / l'affichage
const productSnapshot = (product) => ({
  name: product.name,
  price: product.price,
  image: product.image || null,
  stock: typeof product.stock === 'number' ? product.stock : null,
  glycemic_index: product.glycemic_index ?? null,
  ig_category: product.ig_category || null,
  slug: product.slug || null,
});

/**
 * Ajoute (ou incremente) un produit. Respecte la limite de stock si connue.
 * @returns {{ ok: boolean, message?: string, totalQty: number }}
 */
export const addGuestCartItem = (product, quantity = 1) => {
  if (!product || !product.id) return { ok: false, message: 'Produit invalide', totalQty: 0 };
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));

  const { items } = readRaw();
  const idx = items.findIndex((i) => i.product_id === product.id);
  const currentQty = idx >= 0 ? items[idx].quantity : 0;
  const newTotal = currentQty + qty;

  const stock = typeof product.stock === 'number' ? product.stock : null;
  if (stock !== null && newTotal > stock) {
    const remaining = Math.max(0, stock - currentQty);
    return {
      ok: false,
      message: remaining === 0
        ? `Stock insuffisant : vous avez deja le maximum (${stock}) dans votre panier.`
        : `Stock insuffisant : seulement ${remaining} unite(s) supplementaire(s) disponible(s).`,
      totalQty: currentQty,
    };
  }

  const snapshot = productSnapshot(product);
  if (idx >= 0) {
    items[idx] = { ...items[idx], quantity: newTotal, snapshot };
  } else {
    items.push({ product_id: product.id, quantity: newTotal, snapshot });
  }

  writeRaw({ items });
  return { ok: true, totalQty: newTotal };
};

/**
 * Met a jour la quantite d'un item (par product_id). Si quantity < 1, retire l'item.
 * @returns {{ ok: boolean, message?: string }}
 */
export const setGuestCartItemQuantity = (productId, quantity, stockHint) => {
  const { items } = readRaw();
  const idx = items.findIndex((i) => i.product_id === productId);
  if (idx < 0) return { ok: false, message: 'Article introuvable' };

  const qty = Math.floor(Number(quantity) || 0);
  if (qty < 1) {
    items.splice(idx, 1);
    writeRaw({ items });
    return { ok: true };
  }

  const stock = typeof stockHint === 'number' ? stockHint : items[idx].snapshot?.stock;
  if (typeof stock === 'number' && qty > stock) {
    return { ok: false, message: `Stock limite a ${stock} unite(s).` };
  }

  items[idx] = { ...items[idx], quantity: qty };
  writeRaw({ items });
  return { ok: true };
};

export const removeGuestCartItem = (productId) => {
  const { items } = readRaw();
  const next = items.filter((i) => i.product_id !== productId);
  writeRaw({ items: next });
  return { ok: true };
};

/**
 * Met a jour le snapshot d'un item (apres re-fetch produit cote API).
 * Utile pour rafraichir prix/stock a l'ouverture du panier.
 */
export const refreshGuestCartSnapshot = (productId, product) => {
  const { items } = readRaw();
  const idx = items.findIndex((i) => i.product_id === productId);
  if (idx < 0) return;
  items[idx] = { ...items[idx], snapshot: productSnapshot(product) };
  writeRaw({ items });
};
