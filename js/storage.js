// ============================================================
// STORAGE — Persistencia con localStorage
// Versión: 1
// Guarda y restaura PEDIDOS, usuarios y el log de auditoría
// entre sesiones del navegador.
// ============================================================

const STORAGE_KEY = 'masandera_v3';

/**
 * Guarda el estado actual en localStorage.
 * Se llama automáticamente desde render() cuando hay un usuario activo.
 */
function saveStorage() {
  try {
    const snapshot = {
      v: 2,
      pedidos: PEDIDOS,
      usuarios: DATA.usuarios,
      clientes: DATA.clientes,
      productos: DATA.productos,
      precios: DATA.precios,
      auditLog: AUDIT_LOG.slice(0, 100), // guardar últimas 100 entradas
      inventario: INVENTARIO,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    // localStorage lleno o no disponible (p.ej. modo privado restrictivo)
    console.warn('[Masandera] No se pudo guardar en localStorage:', e.message);
  }
}

/**
 * Restaura el estado guardado desde localStorage.
 * Retorna true si se encontró y cargó un snapshot válido.
 * Se llama desde app.js antes de restoreSession().
 */
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const snap = JSON.parse(raw);
    if (!snap || snap.v !== 2) {
      // Versión incompatible — limpiar y empezar desde cero
      clearStorage();
      return false;
    }

    // Restaurar PEDIDOS
    if (Array.isArray(snap.pedidos) && snap.pedidos.length > 0) {
      PEDIDOS.length = 0;
      snap.pedidos.forEach(p => PEDIDOS.push(p));
    }

    // Restaurar usuarios (incluye los creados en sesiones anteriores)
    if (Array.isArray(snap.usuarios) && snap.usuarios.length > 0) {
      DATA.usuarios.length = 0;
      snap.usuarios.forEach(u => DATA.usuarios.push(u));
    }

    // Restaurar clientes (incluye subClientes, productosAsignados, tipo, datos tributarios)
    if (Array.isArray(snap.clientes) && snap.clientes.length > 0) {
      DATA.clientes.length = 0;
      snap.clientes.forEach(c => DATA.clientes.push(c));
    }

    // Restaurar catálogo de productos
    if (Array.isArray(snap.productos) && snap.productos.length > 0) {
      DATA.productos.length = 0;
      snap.productos.forEach(p => DATA.productos.push(p));
    }

    // Restaurar precios personalizados
    if (Array.isArray(snap.precios) && snap.precios.length > 0) {
      DATA.precios.length = 0;
      snap.precios.forEach(p => DATA.precios.push(p));
    }

    // Restaurar log de auditoría
    if (Array.isArray(snap.auditLog)) {
      AUDIT_LOG.length = 0;
      snap.auditLog.forEach(entry => AUDIT_LOG.push(entry));
    }

    // Restaurar inventario diario
    if (Array.isArray(snap.inventario)) {
      INVENTARIO.length = 0;
      snap.inventario.forEach(inv => INVENTARIO.push(inv));
    }

    return true;
  } catch (e) {
    console.warn('[Masandera] Error al cargar desde localStorage:', e.message);
    return false;
  }
}

/**
 * Borra todos los datos guardados (útil para resetear demo).
 */
function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}
