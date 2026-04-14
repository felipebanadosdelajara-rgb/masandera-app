// ============================================================
// DATA — Datos de ejemplo (reemplazar con datos reales)
// ⚠️  NOTA DE ARQUITECTURA: DATA, STATE y PEDIDOS son variables
//     globales por diseño de esta SPA. Para evitar colisiones con
//     librerías futuras, se exponen también bajo window.MasApp
//     (asignado al final de app.js). No renombrar sin actualizar
//     todos los onclick inline de los templates HTML.
// ============================================================

// Simple hash for password storage (prototype only — Firebase Auth replaces this)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

const DATA = {
  rubros: ['Restaurant','Sanguchería','Hotel','Panadería','Café','Bar','Catering','Distribución','Otro'],

  // Catálogo actualizado — Abril 2026
  // corteAnticipacion: 24 o 48 (horas de anticipación para pedir)
  // corteHora: "HH:MM" en formato 24h (hora límite del día de corte)
  productos: [
    // HOGAZAS (Masa Madre) — 48h anticipación
    { id:'p1',  sku:'MM-HOG-001', nombre:'Hogaza Blanca',          categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3900, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p2',  sku:'MM-HOG-002', nombre:'Hogaza Integral',        categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3900, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p3',  sku:'MM-HOG-003', nombre:'Hogaza Aceituna',        categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4500, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p4',  sku:'MM-HOG-004', nombre:'Hogaza Nuez',            categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4500, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p5',  sku:'MM-HOG-005', nombre:'Hogaza M.Grano',         categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4500, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p6',  sku:'MM-HOG-006', nombre:'Hogaza Sarraceno',       categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4900, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p7',  sku:'MM-HOG-007', nombre:'Hogaza Morada',          categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4900, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p8',  sku:'MM-HOG-010', nombre:'Hogaza Avena',           categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4500, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p9',  sku:'MM-HOG-011', nombre:'Hogaza Higo Nuez',       categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4900, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p10', sku:'MM-HOG-008', nombre:'Hogaza Ají',             categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:4500, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    // MOLDES (Masa Madre) — 48h anticipación
    { id:'p11', sku:'MM-HOG-009', nombre:'Molde Masa Madre 14x14', categoria:'masa_madre', tipo:'Molde',     unidad:'unidad', precioLista:8500, descripcion:'Masa madre clásica, fermentación larga', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    { id:'p12', sku:'MM-MOL-004', nombre:'Molde Centeno',          categoria:'masa_madre', tipo:'Molde',     unidad:'unidad', precioLista:4900, descripcion:'Masa Madre de Centeno', activo:true, corteAnticipacion:48, corteHora:'07:00' },
    // PITAS (Pan Tradicional) — 24h anticipación
    { id:'p13', sku:'MM-PIT-001', nombre:'Pita Blanco',            categoria:'pan_tradicional', tipo:'Pita',      unidad:'unidad', precioLista:900,  descripcion:'Pan Pita', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p14', sku:'MM-PIT-002', nombre:'Pita Integral',          categoria:'pan_tradicional', tipo:'Pita',      unidad:'unidad', precioLista:900,  descripcion:'Pan Pita Integral', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    // BAGUETTES (Pan Tradicional) — 24h anticipación
    { id:'p15', sku:'MM-BAG-001', nombre:'Baguette Blanco',        categoria:'pan_tradicional', tipo:'Baguette',  unidad:'unidad', precioLista:1800, descripcion:'Baguette 22 centimetros', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    // CROISSANT (Pan Tradicional) — inactivo
    { id:'p16', sku:'PT-CRO-001', nombre:'Croissant',              categoria:'pan_tradicional', tipo:'Croissant', unidad:'unidad', precioLista:0,    descripcion:'Croissant', activo:false, corteAnticipacion:24, corteHora:'07:00' },
    // SANDWICHS (Pan Tradicional) — 24h anticipación
    { id:'p17', sku:'MM-PEQ-001', nombre:'Frica 80g',              categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:400,  descripcion:'Pan Sandwichs 11 diametro', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p18', sku:'MM-PEQ-002', nombre:'Hot Dog 80g',            categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:400,  descripcion:'Pan Hot Dog 18 centimetros', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    // MESA (Pan Tradicional) — 24h anticipación
    { id:'p19', sku:'MM-PEQ-003', nombre:'Amasado 40g',            categoria:'pan_tradicional', tipo:'Mesa',      unidad:'unidad', precioLista:180,  descripcion:'Pan de Mesa', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p20', sku:'MM-PEQ-004', nombre:'Amasado 40g Curacaribs', categoria:'pan_tradicional', tipo:'Mesa',      unidad:'unidad', precioLista:180,  descripcion:'Pan de Mesa', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    // SANDWICHS (Pan Tradicional) — 24h anticipación (cont.)
    { id:'p21', sku:'MM-PEQ-005', nombre:'Amasado 90g',            categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:300,  descripcion:'Pan amasado mediano', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p22', sku:'MM-PEQ-006', nombre:'Amasado 130g',           categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:400,  descripcion:'Pan amasado grande', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p23', sku:'MM-PAP-001', nombre:'Pan de Papa 40g',        categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:350,  descripcion:'Con papa, formato pequeño', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p24', sku:'MM-PAP-002', nombre:'Pan de Papa 70g',        categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:390,  descripcion:'Con papa, formato mediano', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p25', sku:'MM-PAP-003', nombre:'Pan de Papa 80g',        categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:410,  descripcion:'Con papa, formato grande', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p26', sku:'MM-PAP-004', nombre:'HotDog Papa 40g',        categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:350,  descripcion:'Hot dog de papa pequeño', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p27', sku:'MM-PAP-005', nombre:'HotDog Papa 80g',        categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:410,  descripcion:'Hot dog de papa grande', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p28', sku:'MM-ESP-001', nombre:'Frank',                   categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:490,  descripcion:'Pan tipo Hotdog', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p29', sku:'MM-ESP-002', nombre:'Brisket',                 categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:490,  descripcion:'Pan tipo Panini', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p30', sku:'BR-BRI-001', nombre:'Burguer Brioche 30g',     categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:350,  descripcion:'Pan de Mesa', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p31', sku:'BR-BRI-002', nombre:'Burguer Brioche 40g',     categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:360,  descripcion:'Pan brioche para hamburguesa', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p32', sku:'MM-MOL-001', nombre:'Molde 10x10 Blanco',      categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:2700, descripcion:'Pan de molde blanco', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p33', sku:'MM-MOL-002', nombre:'Molde 10x10 Integral',    categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:2700, descripcion:'Pan de molde integral', activo:true, corteAnticipacion:24, corteHora:'07:00' },
    { id:'p34', sku:'MM-MOL-003', nombre:'Molde 12x12',             categoria:'pan_tradicional', tipo:'Sandwichs', unidad:'unidad', precioLista:5000, descripcion:'Pan de molde formato grande', activo:true, corteAnticipacion:24, corteHora:'07:00' },
  ],

  // ── DATOS FICTICIOS — Prueba 1.0 ──
  // Un cliente de ejemplo para recorrer el flujo completo:
  // enviado → aprobado → en_producción → facturado
  clientes: [
    {
      id:'c1', nombre:'Cliente Demo',
      razonSocial:'Demo SpA', rut:'76.000.000-0',
      tipo:'final', rubro:'Restaurant', giro:'Venta de alimentos',
      contacto:'Juan Demo', telefono:'+56 9 0000 0000',
      direccion:'Calle Demo 100', ciudad:'Santiago',
      productosAsignados:['p1','p2','p3','p13','p15','p17','p19','p28','p30','p31'],
      activo:true
    },
  ],

  // Precios del cliente demo (usa precio de lista)
  precios: [
    {cId:'c1',pId:'p1',v:3900},{cId:'c1',pId:'p2',v:3900},{cId:'c1',pId:'p3',v:4500},
    {cId:'c1',pId:'p13',v:900},{cId:'c1',pId:'p15',v:1800},
    {cId:'c1',pId:'p17',v:400},{cId:'c1',pId:'p19',v:180},
    {cId:'c1',pId:'p28',v:490},
    {cId:'c1',pId:'p30',v:350},{cId:'c1',pId:'p31',v:360},
  ],

  usuarios: [
    { id:'u1', nombre:'Admin Demo', email:'admin@masandera.cl', pass:simpleHash('admin'), rol:'gerente', activo:true },
    { id:'u2', nombre:'Producción Demo', email:'produccion@masandera.cl', pass:simpleHash('prod'), rol:'produccion', activo:true },
    { id:'u3', nombre:'Cliente Demo', email:'cliente@demo.cl', pass:simpleHash('pass'), rol:'cliente', clienteId:'c1', activo:true },
    { id:'u4', nombre:'Facturación Demo', email:'facturacion@masandera.cl', pass:simpleHash('fact'), rol:'facturacion', activo:true },
  ],
};

// Pedido de demostración — en estado "enviado" para recorrer todo el flujo
let INVENTARIO = [];

let PEDIDOS = [
  {
    id:'ORD-001', clienteId:'c1',
    items:[{pId:'p1',qty:10,price:3900},{pId:'p30',qty:20,price:350},{pId:'p19',qty:50,price:180}],
    status:'enviado', fechaPedido:'2026-04-14', fechaDespacho:'2026-04-17',
    obs:'Pedido de prueba — recorrer flujo completo.', obsGerente:'', total:0
  },
];

PEDIDOS.forEach(p => { p.total = p.items.reduce((s,i) => s + i.qty*i.price, 0); });
