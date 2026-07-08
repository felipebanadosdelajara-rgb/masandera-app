// ============================================================
// INIT — Restore session and render
// ============================================================
loadStorage();      // A1: restaurar datos guardados antes de cualquier render
ensurePilotUsers(); // garantizar que los usuarios/clientes del piloto existen
render();           // muestra login mientras Firebase Auth termina de inicializar

// Asegura que las cuentas del piloto Firebase y los perfiles de prueba estén
// en DATA después de loadStorage. Sin esto, snapshots viejos de localStorage
// podrían no incluirlos.
function ensurePilotUsers() {
  const pilotUsers = [
    { id:'u_rodrigo', nombre:'Rodrigo Alfaro', email:'rodrigo.alfaro.p@gmail.com', pass:null, rol:'gerente', activo:true },
    { id:'u_lamadre', nombre:'La Madre', email:'delacuadrajosefa@gmail.com', pass:null, rol:'cliente', clienteId:'c_lamadre', activo:true },
    { id:'u5', nombre:'La Madre Distribución (Demo)', email:'lamadre@cliente.cl', pass:null, rol:'cliente', clienteId:'c_demo_dist', activo:true },
    { id:'u_hornitos', nombre:'Los Hornitos de Curacaví', email:'hornitos@cliente.cl', pass:null, rol:'cliente', clienteId:'c_hornitos', activo:true },
  ];
  pilotUsers.forEach(u => {
    if (!DATA.usuarios.find(x => x.email.toLowerCase() === u.email.toLowerCase())) {
      DATA.usuarios.push(u);
    }
  });
  const pilotClientes = [
    { id:'c_lamadre', nombre:'La Madre', razonSocial:'', rut:'', tipo:'final',
      rubro:'Restaurant', giro:'', contacto:'Josefa De la Cuadra', telefono:'',
      direccion:'', ciudad:'Santiago', productosAsignados:[], activo:true },
    { id:'c_demo_dist', nombre:'La Madre Distribución (Demo)',
      razonSocial:'Distribuidora Demo Ltda.', rut:'77.111.111-1',
      tipo:'distribuidor', rubro:'Distribución', giro:'Distribución de alimentos',
      contacto:'María Demo', telefono:'+56 9 1111 1111',
      direccion:'Av. Demo 200', ciudad:'Santiago',
      productosAsignados:['p1','p2','p3','p13','p15','p17','p19','p28','p30','p31'],
      subClientes:[
        { id:'sc-demo1', nombre:'Café Central', razonSocial:'', rut:'', rubro:'Café', giro:'',
          contacto:'', direccion:'', ciudad:'Santiago', productosAsignados:['p1','p2','p13','p15'] },
        { id:'sc-demo2', nombre:'Sanguchería El Barrio', razonSocial:'', rut:'', rubro:'Sanguchería', giro:'',
          contacto:'', direccion:'', ciudad:'Santiago', productosAsignados:['p17','p28','p30','p31'] },
      ],
      activo:true },
    { id:'c_hornitos', nombre:'Los Hornitos de Curacaví',
      razonSocial:'', rut:'', tipo:'final',
      rubro:'Panadería', giro:'', contacto:'', telefono:'',
      direccion:'', ciudad:'Curacaví', productosAsignados:[], activo:true },
  ];
  pilotClientes.forEach(c => {
    if (!DATA.clientes.find(x => x.id === c.id)) DATA.clientes.push(c);
  });
  // Precios de los perfiles demo y del piloto (getPrecio no usa precioLista como fallback)
  const demoPrecios = [
    {cId:'c_demo_dist',pId:'p1',v:3500},{cId:'c_demo_dist',pId:'p2',v:3500},{cId:'c_demo_dist',pId:'p3',v:4100},
    {cId:'c_demo_dist',pId:'p13',v:800},{cId:'c_demo_dist',pId:'p15',v:1600},
    {cId:'c_demo_dist',pId:'p17',v:360},{cId:'c_demo_dist',pId:'p19',v:160},
    {cId:'c_demo_dist',pId:'p28',v:440},
    {cId:'c_demo_dist',pId:'p30',v:320},{cId:'c_demo_dist',pId:'p31',v:330},
  ];
  // Hornitos parte con precio de lista en todo el catálogo activo
  DATA.productos.filter(p => p.activo && p.precioLista > 0).forEach(p => {
    demoPrecios.push({ cId:'c_hornitos', pId:p.id, v:p.precioLista });
  });
  demoPrecios.forEach(p => {
    if (!DATA.precios.find(x => x.cId === p.cId && x.pId === p.pId)) DATA.precios.push(p);
  });

  // El Patio (demo) fue eliminado el 2026-07-08 — purgarlo de snapshots
  // viejos de localStorage para que no reaparezca en dispositivos del piloto.
  for (let i = DATA.usuarios.length - 1; i >= 0; i--) {
    if ((DATA.usuarios[i].email || '').toLowerCase() === 'elpatio@cliente.cl') DATA.usuarios.splice(i, 1);
  }
  for (let i = DATA.clientes.length - 1; i >= 0; i--) {
    if (DATA.clientes[i].id === 'c_demo_final') DATA.clientes.splice(i, 1);
  }
  for (let i = DATA.precios.length - 1; i >= 0; i--) {
    if (DATA.precios[i].cId === 'c_demo_final') DATA.precios.splice(i, 1);
  }
}

// Firebase Auth listener — única fuente de verdad sobre el estado de sesión.
// Dispara una vez al cargar (con o sin usuario) y luego en cada login/logout.
auth.onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    completeLogin(firebaseUser);
    startFirestoreSync();
  } else {
    handleLogout();
    stopFirestoreSync();
  }
});

// A7: exponer un namespace limpio para evitar colisiones futuras con CDNs.
// Los módulos de la app siguen usando los nombres cortos (DATA, STATE, PEDIDOS)
// porque están en los onclick inline de los templates. MasApp es el alias seguro.
window.MasApp = { DATA, STATE, PEDIDOS, AUDIT_LOG, saveStorage, clearStorage };
