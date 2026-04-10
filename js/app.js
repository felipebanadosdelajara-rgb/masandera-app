// ============================================================
// INIT — Restore session and render
// ============================================================
loadStorage();      // A1: restaurar datos guardados antes de cualquier render
restoreSession();
render();

// A7: exponer un namespace limpio para evitar colisiones futuras con CDNs.
// Los módulos de la app siguen usando los nombres cortos (DATA, STATE, PEDIDOS)
// porque están en los onclick inline de los templates. MasApp es el alias seguro.
window.MasApp = { DATA, STATE, PEDIDOS, AUDIT_LOG, saveStorage, clearStorage };
