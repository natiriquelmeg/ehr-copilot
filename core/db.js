// Base local (IndexedDB). Sin dependencias de Chrome ni de ninguna ficha,
// para poder reutilizarla en una app standalone.
const DB_NAME = 'ehr-copilot';
const DB_VERSION = 1;
const STORES = ['indicaciones', 'medicamentos'];

let dbPromise;
function open() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const s of STORES) {
        if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result.result ?? result);
    t.onerror = () => reject(t.error);
  });
}

export const db = {
  list: (store) => tx(store, 'readonly', (s) => s.getAll()),
  get: (store, id) => tx(store, 'readonly', (s) => s.get(id)),
  async put(store, item) {
    const row = { ...item, id: item.id ?? crypto.randomUUID(), updatedAt: Date.now() };
    await tx(store, 'readwrite', (s) => s.put(row));
    return row;
  },
  remove: (store, id) => tx(store, 'readwrite', (s) => s.delete(id)),

  async exportAll() {
    const out = { version: 1, exportedAt: new Date().toISOString() };
    for (const s of STORES) out[s] = await this.list(s);
    return out;
  },
  async importAll(data) {
    for (const s of STORES) for (const item of data[s] ?? []) await this.put(s, item);
  },
};

export { STORES };
