// ============================================================
// FIRESTORE SYNC — sincronización en tiempo real con Firestore
// Cada entidad tiene su par start/stop. start* suscribe al
// listener; stop* desuscribe (al hacer logout).
// ============================================================

let _syncStarted = false;

function startFirestoreSync() {
  if (_syncStarted) return;
  _syncStarted = true;
  startProductosSync();
  // Próximos milestones: clientes, pedidos, precios, inventario, auditLog
}

function stopFirestoreSync() {
  if (!_syncStarted) return;
  _syncStarted = false;
  stopProductosSync();
}

// ============================================================
// PRODUCTOS — colección /productos/{id}
// ============================================================
let _unsubProductos = null;

function startProductosSync() {
  if (_unsubProductos) return;
  _unsubProductos = db.collection('productos').onSnapshot(
    (snap) => {
      // Si está vacía la primera vez, sembrar desde SEED_PRODUCTOS
      if (snap.empty) {
        seedProductos();
        return;
      }
      // Reemplazar contenido de DATA.productos manteniendo la referencia
      DATA.productos.length = 0;
      snap.forEach(doc => {
        DATA.productos.push({ id: doc.id, ...doc.data() });
      });
      // Re-render si la app ya está montada con un usuario
      if (STATE.user) render();
    },
    (err) => {
      console.error('[Firestore] Error sincronizando productos:', err);
      showNotif?.('error', 'Error al sincronizar el catálogo. Revisa tu conexión.');
    }
  );
}

function stopProductosSync() {
  if (_unsubProductos) {
    _unsubProductos();
    _unsubProductos = null;
  }
}

async function seedProductos() {
  if (!Array.isArray(SEED_PRODUCTOS) || SEED_PRODUCTOS.length === 0) {
    console.warn('[Firestore] SEED_PRODUCTOS vacío — no hay nada que sembrar.');
    return;
  }
  console.log(`[Firestore] Sembrando ${SEED_PRODUCTOS.length} productos iniciales...`);
  const batch = db.batch();
  SEED_PRODUCTOS.forEach(p => {
    const { id, ...rest } = p;
    batch.set(db.collection('productos').doc(id), rest);
  });
  try {
    await batch.commit();
    console.log('[Firestore] Catálogo sembrado correctamente.');
  } catch (err) {
    console.error('[Firestore] Error al sembrar productos:', err);
  }
}
