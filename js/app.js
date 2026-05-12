// ============================================================
// INIT — Restore session and render
// ============================================================
loadStorage();      // A1: restaurar datos guardados antes de cualquier render
ensurePilotUsers(); // garantizar que los usuarios/clientes del piloto existen
render();           // muestra login mientras Firebase Auth termina de inicializar

// Asegura que las cuentas del piloto Firebase estén en DATA después de loadStorage.
// Sin esto, snapshots viejos de localStorage podrían no incluirlas.
function ensurePilotUsers() {
  const pilotUsers = [
    { id:'u_rodrigo', nombre:'Rodrigo Alfaro', email:'rodrigo.alfaro.p@gmail.com', pass:null, rol:'gerente', activo:true },
    { id:'u_lamadre', nombre:'La Madre', email:'delacuadrajosefa@gmail.com', pass:null, rol:'cliente', clienteId:'c_lamadre', activo:true },
  ];
  pilotUsers.forEach(u => {
    if (!DATA.usuarios.find(x => x.email.toLowerCase() === u.email.toLowerCase())) {
      DATA.usuarios.push(u);
    }
  });
  const pilotClientes = [
    { id:'c_lamadre', nombre:'La Madre', razonSocial:'', rut:'', tipo:'final',
      rubro:'Restaurant', giro:'', contacto:'Josefa De la Cuadra', telefono:'',
      direccion:'', ciudad:'Santiago', productosAsignados:[], activo:true }
  ];
  pilotClientes.forEach(c => {
    if (!DATA.clientes.find(x => x.id === c.id)) DATA.clientes.push(c);
  });
}

// Firebase Auth listener — única fuente de verdad sobre el estado de sesión.
// Dispara una vez al cargar (con o sin usuario) y luego en cada login/logout.
auth.onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    completeLogin(firebaseUser);
  } else {
    handleLogout();
  }
});

// A7: exponer un namespace limpio para evitar colisiones futuras con CDNs.
// Los módulos de la app siguen usando los nombres cortos (DATA, STATE, PEDIDOS)
// porque están en los onclick inline de los templates. MasApp es el alias seguro.
window.MasApp = { DATA, STATE, PEDIDOS, AUDIT_LOG, saveStorage, clearStorage };
