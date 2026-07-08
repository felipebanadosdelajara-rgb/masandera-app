// ============================================================
// FIRESTORE SYNC — sincronización en tiempo real con Firestore
//
// Motor genérico por entidad:
//  - Un listener onSnapshot por colección aplica los cambios
//    remotos sobre los datos locales (DATA / PEDIDOS / STATE).
//  - saveStorage() (storage.js) llama a pushFirestoreChanges(),
//    que sube los cambios locales con un diff por documento.
//  - Resolución de conflictos: last-write-wins por documento.
//  - Transición: en el primer snapshot lo remoto manda, pero los
//    items locales que Firestore nunca ha conocido (creados antes
//    de este sync o sin conexión) se conservan y se suben.
// ============================================================

let _syncStarted = false;
const _sync = {}; // name -> { unsub, ready, last: Map(docId -> json) }

// ── Entidades sincronizadas ─────────────────────────────────
// docId: cómo se identifica el documento en la colección.
// read/write: acceso a la estructura local (manteniendo referencias).
// fromDoc: reconstrucción del objeto desde el doc (default: doc.data()).
// seed: datos iniciales si la colección está vacía (default: read()).
const SYNC_ENTITIES = [
  { name: 'productos',
    docId: p => p.id,
    fromDoc: d => ({ id: d.id, ...d.data() }),
    read: () => DATA.productos,
    write: items => _replaceArray(DATA.productos, items),
    seed: () => SEED_PRODUCTOS },
  { name: 'clientes',
    docId: c => c.id,
    read: () => DATA.clientes,
    write: items => _replaceArray(DATA.clientes, items) },
  { name: 'usuarios',
    docId: u => u.id,
    read: () => DATA.usuarios,
    write: items => _replaceArray(DATA.usuarios, items) },
  { name: 'precios',
    docId: p => `${p.cId}__${p.pId}`,
    read: () => DATA.precios,
    write: items => _replaceArray(DATA.precios, items) },
  { name: 'pedidos',
    docId: p => p.id,
    read: () => PEDIDOS,
    write: items => _replaceArray(PEDIDOS, items) },
  { name: 'inventario',
    docId: i => i.id,
    read: () => INVENTARIO,
    write: items => _replaceArray(INVENTARIO, items) },
  { name: 'prodAjustes',
    docId: a => a.fecha,
    read: () => Object.entries(STATE.prodAjustes || {}).map(([fecha, ajustes]) => ({ fecha, ajustes })),
    write: items => {
      const obj = {};
      items.forEach(x => { obj[x.fecha] = x.ajustes || {}; });
      STATE.prodAjustes = obj;
    } },
];

// Entidades que ensurePilotUsers() debe re-inyectar tras aplicar remoto
const PILOT_ENTITIES = ['usuarios', 'clientes', 'precios'];

function startFirestoreSync() {
  if (_syncStarted) return;
  _syncStarted = true;
  SYNC_ENTITIES.forEach(e => {
    _sync[e.name] = { unsub: null, ready: false, last: new Map() };
    _sync[e.name].unsub = db.collection(e.name).onSnapshot(
      snap => _handleSnapshot(e, snap),
      err => {
        console.error(`[Firestore] Error sincronizando ${e.name}:`, err);
        showNotif?.('error', `Error al sincronizar ${e.name}. Revisa tu conexión.`);
      }
    );
  });
}

function stopFirestoreSync() {
  if (!_syncStarted) return;
  _syncStarted = false;
  Object.values(_sync).forEach(s => { if (s.unsub) s.unsub(); });
  Object.keys(_sync).forEach(k => delete _sync[k]);
}

// ── Aplicar snapshot remoto ─────────────────────────────────
function _handleSnapshot(e, snap) {
  const s = _sync[e.name];
  if (!s) return;

  // Primera vez y colección vacía → sembrar desde los datos locales
  if (!s.ready && snap.empty) {
    _seedEntity(e);
    return;
  }
  s.ready = true;

  const remote = new Map(); // docId -> objeto
  snap.forEach(doc => {
    const x = e.fromDoc ? e.fromDoc(doc) : doc.data();
    remote.set(e.docId(x), x);
  });

  // Merge: lo remoto manda, pero se conservan items locales que el
  // remoto nunca ha conocido (para subirlos en el próximo push).
  const merged = [...remote.values()];
  (e.read() || []).forEach(x => {
    const id = e.docId(x);
    if (!remote.has(id) && !s.last.has(id)) merged.push(x);
  });

  // s.last = estado remoto confirmado (base para diffs y borrados)
  s.last = new Map();
  remote.forEach((x, id) => s.last.set(id, stableStringify(x)));

  // ¿Difiere lo mergeado del estado local actual?
  const localMap = new Map();
  (e.read() || []).forEach(x => localMap.set(e.docId(x), stableStringify(x)));
  let changed = localMap.size !== merged.length;
  if (!changed) {
    for (const x of merged) {
      if (localMap.get(e.docId(x)) !== stableStringify(x)) { changed = true; break; }
    }
  }

  if (changed) {
    e.write(merged);
    // Reponer usuarios/clientes/precios del piloto y purgar demos eliminados
    if (PILOT_ENTITIES.includes(e.name) && typeof ensurePilotUsers === 'function') {
      ensurePilotUsers();
    }
  }

  // Subir de inmediato lo local que falte en el remoto (merge de transición,
  // inyecciones del piloto). No-op si no hay diferencias.
  pushFirestoreChanges();

  if (changed && STATE.user) render();
}

// ── Siembra inicial (colección vacía) ───────────────────────
async function _seedEntity(e) {
  const s = _sync[e.name];
  s.ready = true;
  const items = ((e.seed ? e.seed() : e.read()) || [])
    .map(x => JSON.parse(stableStringify(x))); // limpia undefined
  if (!items.length) return;
  console.log(`[Firestore] Sembrando ${items.length} docs en /${e.name}...`);
  items.forEach(x => s.last.set(e.docId(x), stableStringify(x)));
  try {
    for (let i = 0; i < items.length; i += 400) {
      const batch = db.batch();
      items.slice(i, i + 400).forEach(x => {
        batch.set(db.collection(e.name).doc(e.docId(x)), x);
      });
      await batch.commit();
    }
    console.log(`[Firestore] /${e.name} sembrado correctamente.`);
  } catch (err) {
    console.error(`[Firestore] Error al sembrar ${e.name}:`, err);
  }
}

// ── Subir cambios locales (diff por documento) ──────────────
// Llamado desde saveStorage() tras cada render autenticado y
// desde los snapshots. Solo escribe los documentos que cambiaron.
function pushFirestoreChanges() {
  if (!_syncStarted) return;
  SYNC_ENTITIES.forEach(e => {
    const s = _sync[e.name];
    if (!s || !s.ready) return;

    const current = new Map();
    (e.read() || []).forEach(x => current.set(e.docId(x), stableStringify(x)));

    const sets = [], dels = [];
    current.forEach((json, id) => { if (s.last.get(id) !== json) sets.push([id, json]); });
    s.last.forEach((_, id) => { if (!current.has(id)) dels.push(id); });
    if (!sets.length && !dels.length) return;

    s.last = current;
    const ops = [];
    sets.forEach(([id, json]) => ops.push(b => b.set(db.collection(e.name).doc(id), JSON.parse(json))));
    dels.forEach(id => ops.push(b => b.delete(db.collection(e.name).doc(id))));
    for (let i = 0; i < ops.length; i += 400) {
      const batch = db.batch();
      ops.slice(i, i + 400).forEach(op => op(batch));
      batch.commit().catch(err => {
        console.error(`[Firestore] Error subiendo cambios de ${e.name}:`, err);
        showNotif?.('error', `No se pudieron guardar cambios de ${e.name} en la nube.`);
      });
    }
  });
}

// ── Helpers ─────────────────────────────────────────────────

/** Reemplaza el contenido de un array manteniendo la referencia */
function _replaceArray(arr, items) {
  arr.length = 0;
  items.forEach(x => arr.push(x));
}

/**
 * JSON.stringify con claves ordenadas y sin undefined — necesario para
 * comparar objetos locales contra doc.data() (Firestore no garantiza
 * el orden de las claves) sin falsos positivos.
 */
function stableStringify(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x) ?? 'null';
  if (Array.isArray(x)) return '[' + x.map(v => stableStringify(v === undefined ? null : v)).join(',') + ']';
  const keys = Object.keys(x).filter(k => x[k] !== undefined).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
}
