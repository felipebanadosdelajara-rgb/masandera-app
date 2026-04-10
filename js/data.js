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

  // ⚠️ DATOS DE EJEMPLO — Actualizar precios reales en la sección "precios"
  productos: [
    // HOGAZAS (Masa Madre)
    { id:'p1',  sku:'MM-HOG-001', nombre:'Hogaza Blanca',          categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3200, descripcion:'Masa madre clásica, fermentación larga', activo:true },
    { id:'p2',  sku:'MM-HOG-002', nombre:'Hogaza Integral',         categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3200, descripcion:'Masa madre integral', activo:true },
    { id:'p3',  sku:'MM-HOG-003', nombre:'Hogaza Aceituna',         categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3500, descripcion:'Con aceitunas', activo:true },
    { id:'p4',  sku:'MM-HOG-004', nombre:'Hogaza Nuez',             categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3500, descripcion:'Con nueces', activo:true },
    { id:'p5',  sku:'MM-HOG-005', nombre:'Hogaza M.Grano',          categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3500, descripcion:'Multigranos', activo:true },
    { id:'p6',  sku:'MM-HOG-006', nombre:'Hogaza Sarraceno',        categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3800, descripcion:'Con trigo sarraceno', activo:true },
    { id:'p7',  sku:'MM-HOG-007', nombre:'Hogaza Morada',           categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3800, descripcion:'Con maíz morado', activo:true },
    { id:'p8',  sku:'MM-HOG-008', nombre:'Hogaza Ají',              categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3800, descripcion:'Con ají', activo:true },
    { id:'p9',  sku:'MM-HOG-009', nombre:'Hogaza 14x14',            categoria:'masa_madre', tipo:'Hogaza',    unidad:'unidad', precioLista:3800, descripcion:'Formato rectangular', activo:true },
    // PITAS (Masa Madre)
    { id:'p10', sku:'MM-PIT-001', nombre:'Pita Blanco',             categoria:'masa_madre', tipo:'Pita',      unidad:'unidad', precioLista:900,  descripcion:'Pita masa madre blanca', activo:true },
    { id:'p11', sku:'MM-PIT-002', nombre:'Pita Integral',           categoria:'masa_madre', tipo:'Pita',      unidad:'unidad', precioLista:900,  descripcion:'Pita masa madre integral', activo:true },
    // BAGUETTES (Masa Madre)
    { id:'p12', sku:'MM-BAG-001', nombre:'Baguette Blanco',         categoria:'masa_madre', tipo:'Baguette',  unidad:'unidad', precioLista:1100, descripcion:'Baguette masa madre', activo:true },
    { id:'p13', sku:'MM-BAG-002', nombre:'Baguette Integral',       categoria:'masa_madre', tipo:'Baguette',  unidad:'unidad', precioLista:1100, descripcion:'Baguette integral masa madre', activo:true },
    // PANES PEQUEÑOS (Masa Madre)
    { id:'p14', sku:'MM-PEQ-001', nombre:'Frica 80g',              categoria:'masa_madre', tipo:'Pequeño',   unidad:'unidad', precioLista:450,  descripcion:'Pan pequeño masa madre', activo:true },
    { id:'p15', sku:'MM-PEQ-002', nombre:'Hot Dog 80g',            categoria:'masa_madre', tipo:'Pequeño',   unidad:'unidad', precioLista:450,  descripcion:'Pan para hot dog masa madre', activo:true },
    { id:'p16', sku:'MM-PEQ-003', nombre:'Amasado 40g',            categoria:'masa_madre', tipo:'Pequeño',   unidad:'unidad', precioLista:380,  descripcion:'Pan amasado pequeño', activo:true },
    { id:'p17', sku:'MM-PEQ-004', nombre:'Amasado 40g Curacaribs', categoria:'masa_madre', tipo:'Pequeño',   unidad:'unidad', precioLista:380,  descripcion:'Amasado edición especial Curacaví', activo:true },
    { id:'p18', sku:'MM-PEQ-005', nombre:'Amasado 90g',            categoria:'masa_madre', tipo:'Pequeño',   unidad:'unidad', precioLista:450,  descripcion:'Pan amasado mediano', activo:true },
    { id:'p19', sku:'MM-PEQ-006', nombre:'Amasado 130g',           categoria:'masa_madre', tipo:'Pequeño',   unidad:'unidad', precioLista:550,  descripcion:'Pan amasado grande', activo:true },
    // PAN DE PAPA (Masa Madre)
    { id:'p20', sku:'MM-PAP-001', nombre:'Pan de Papa 40g',        categoria:'masa_madre', tipo:'Pan de Papa', unidad:'unidad', precioLista:400, descripcion:'Con papa, formato pequeño', activo:true },
    { id:'p21', sku:'MM-PAP-002', nombre:'Pan de Papa 70g',        categoria:'masa_madre', tipo:'Pan de Papa', unidad:'unidad', precioLista:500, descripcion:'Con papa, formato mediano', activo:true },
    { id:'p22', sku:'MM-PAP-003', nombre:'Pan de Papa 80g',        categoria:'masa_madre', tipo:'Pan de Papa', unidad:'unidad', precioLista:550, descripcion:'Con papa, formato grande', activo:true },
    { id:'p23', sku:'MM-PAP-004', nombre:'HotDog Papa 40g',        categoria:'masa_madre', tipo:'Pan de Papa', unidad:'unidad', precioLista:400, descripcion:'Hot dog de papa pequeño', activo:true },
    { id:'p24', sku:'MM-PAP-005', nombre:'HotDog Papa 80g',        categoria:'masa_madre', tipo:'Pan de Papa', unidad:'unidad', precioLista:550, descripcion:'Hot dog de papa grande', activo:true },
    // ESPECIALES (Masa Madre)
    { id:'p25', sku:'MM-ESP-001', nombre:'Frank',                  categoria:'masa_madre', tipo:'Especial',   unidad:'unidad', precioLista:600, descripcion:'Pan tipo frankfurt', activo:true },
    { id:'p26', sku:'MM-ESP-002', nombre:'Brisket',                categoria:'masa_madre', tipo:'Especial',   unidad:'unidad', precioLista:700, descripcion:'Pan para brisket', activo:true },
    // BRIOCHE
    { id:'p27', sku:'BR-BRI-001', nombre:'Burguer Brioche 30g',    categoria:'brioche',    tipo:'Brioche',    unidad:'unidad', precioLista:480, descripcion:'Pan brioche para hamburguesa pequeño', activo:true },
    { id:'p28', sku:'BR-BRI-002', nombre:'Burguer Brioche 40g',    categoria:'brioche',    tipo:'Brioche',    unidad:'unidad', precioLista:550, descripcion:'Pan brioche para hamburguesa', activo:true },
    // MOLDES (Masa Madre)
    { id:'p29', sku:'MM-MOL-001', nombre:'Molde 10x10 Blanco',     categoria:'masa_madre', tipo:'Molde',      unidad:'unidad', precioLista:2800, descripcion:'Pan de molde blanco', activo:true },
    { id:'p30', sku:'MM-MOL-002', nombre:'Molde 10x10 Integral',   categoria:'masa_madre', tipo:'Molde',      unidad:'unidad', precioLista:2800, descripcion:'Pan de molde integral', activo:true },
    { id:'p31', sku:'MM-MOL-003', nombre:'Molde 12x12',            categoria:'masa_madre', tipo:'Molde',      unidad:'unidad', precioLista:3200, descripcion:'Pan de molde formato grande', activo:true },
  ],

  clientes: [
    {
      id:'c1', nombre:'La Madre',
      razonSocial:'Inversiones González Ltda.', rut:'76.123.456-7',
      tipo:'distribuidor', rubro:'Distribución', giro:'Distribución de alimentos',
      contacto:'María González', telefono:'+56 9 1234 5678',
      direccion:'Av. Italia 1540', ciudad:'Santiago',
      productosAsignados:['p1','p2','p3','p4','p5','p10','p11','p12','p14','p16','p18','p25','p26','p27','p28','p29'],
      subClientes:[
        { id:'sc-m1', nombre:'Café Orgánico', razonSocial:'Café Orgánico SpA', rut:'77.234.567-8',
          rubro:'Café', giro:'Restaurant y Café', contacto:'Valentina Soto', telefono:'+56 9 4411 2233',
          direccion:'Manuel Montt 450', ciudad:'Providencia', productosAsignados:['p1','p2','p10','p27','p28'] },
        { id:'sc-m2', nombre:'Deli Market Express', razonSocial:'Deli Market Express Ltda.', rut:'78.345.678-9',
          rubro:'Sanguchería', giro:'Venta de alimentos preparados', contacto:'Andrés Pérez', telefono:'+56 9 5522 3344',
          direccion:'Los Leones 980', ciudad:'Providencia', productosAsignados:['p1','p12','p16','p18','p27'] },
        { id:'sc-m3', nombre:'Hotel Los Alerces', razonSocial:'Hotelería Los Alerces S.A.', rut:'79.456.789-0',
          rubro:'Hotel', giro:'Hotelería y turismo', contacto:'Claudia Fuentes', telefono:'+56 9 6633 4455',
          direccion:'Av. Apoquindo 3200', ciudad:'Las Condes', productosAsignados:['p1','p3','p4','p5','p25','p26','p29'] },
      ], activo:true
    },
    {
      id:'c2', nombre:'Restaurante El Patio',
      razonSocial:'El Patio Gastronómico SpA', rut:'76.987.654-3',
      tipo:'final', rubro:'Restaurant', giro:'Restaurant',
      contacto:'Pedro Rojas', telefono:'+56 9 8765 4321',
      direccion:'Calle Larga 220', ciudad:'Curacaví',
      productosAsignados:['p1','p12','p15','p25','p26','p27','p28'], activo:true
    },
    {
      id:'c3', nombre:'Café Las Flores',
      razonSocial:'Las Flores Café E.I.R.L.', rut:'76.555.123-4',
      tipo:'final', rubro:'Café', giro:'Café y pastelería',
      contacto:'Ana Martínez', telefono:'+56 9 5555 1234',
      direccion:'Plaza de Armas 15', ciudad:'Melipilla',
      productosAsignados:['p1','p2','p10','p12','p16','p27','p28'], activo:true
    },
    {
      id:'c4', nombre:'Hotel Boutique Vista',
      razonSocial:'Boutique Vista S.A.', rut:'76.777.888-9',
      tipo:'final', rubro:'Hotel', giro:'Hotelería',
      contacto:'Roberto Silva', telefono:'+56 9 7777 8888',
      direccion:'Camino Real 800', ciudad:'Santiago',
      productosAsignados:['p1','p3','p4','p10','p27','p28','p29','p31'], activo:true
    },
    {
      id:'c5', nombre:'Bistró 21',
      razonSocial:'Bistró 21 Ltda.', rut:'76.333.444-5',
      tipo:'final', rubro:'Restaurant', giro:'Restaurant',
      contacto:'Carmen López', telefono:'+56 9 3333 4444',
      direccion:'Merced 321', ciudad:'Santiago',
      productosAsignados:['p1','p12','p15','p25','p26','p27','p28'], activo:true
    },
    {
      id:'c6', nombre:'Distribuciones Sur',
      razonSocial:'Distribuciones Sur Ltda.', rut:'76.666.777-8',
      tipo:'distribuidor', rubro:'Distribución', giro:'Distribución mayorista',
      contacto:'Jorge Muñoz', telefono:'+56 9 6666 7777',
      direccion:'Av. Grecia 1200', ciudad:'Santiago',
      productosAsignados:['p1','p2','p12','p16','p27','p28'],
      subClientes:[
        { id:'sc1', nombre:'Sanguchería Don Tito', razonSocial:'Tito Ramos E.I.R.L.', rut:'12.345.678-9',
          rubro:'Sanguchería', giro:'Venta de alimentos', contacto:'Tito Ramos', telefono:'+56 9 7744 5566',
          direccion:'Irarrázaval 1500', ciudad:'Ñuñoa', productosAsignados:['p1','p12','p27','p28'] },
        { id:'sc2', nombre:'Café Central', razonSocial:'Café Central SpA', rut:'76.885.667-2',
          rubro:'Café', giro:'Café', contacto:'Laura Díaz', telefono:'+56 9 8855 6677',
          direccion:'Estado 240', ciudad:'Santiago Centro', productosAsignados:['p1','p2','p16'] },
      ], activo:true
    },
  ],

  // ⚠️ PRECIOS DE EJEMPLO — Reemplazar con precios reales por cliente
  precios: [
    // La Madre (cliente principal — precios mayoristas)
    {cId:'c1',pId:'p1',v:3200},{cId:'c1',pId:'p2',v:3200},{cId:'c1',pId:'p3',v:3500},
    {cId:'c1',pId:'p4',v:3500},{cId:'c1',pId:'p5',v:3500},{cId:'c1',pId:'p6',v:3800},
    {cId:'c1',pId:'p7',v:3800},{cId:'c1',pId:'p8',v:3800},{cId:'c1',pId:'p9',v:3800},
    {cId:'c1',pId:'p10',v:900},{cId:'c1',pId:'p11',v:900},
    {cId:'c1',pId:'p12',v:1100},{cId:'c1',pId:'p13',v:1100},
    {cId:'c1',pId:'p14',v:450},{cId:'c1',pId:'p15',v:450},
    {cId:'c1',pId:'p16',v:380},{cId:'c1',pId:'p17',v:380},{cId:'c1',pId:'p18',v:450},{cId:'c1',pId:'p19',v:550},
    {cId:'c1',pId:'p20',v:400},{cId:'c1',pId:'p21',v:500},{cId:'c1',pId:'p22',v:550},
    {cId:'c1',pId:'p23',v:400},{cId:'c1',pId:'p24',v:550},
    {cId:'c1',pId:'p25',v:600},{cId:'c1',pId:'p26',v:700},
    {cId:'c1',pId:'p27',v:480},{cId:'c1',pId:'p28',v:550},
    {cId:'c1',pId:'p29',v:2800},{cId:'c1',pId:'p30',v:2800},{cId:'c1',pId:'p31',v:3200},
    // El Patio (restaurante)
    {cId:'c2',pId:'p1',v:4200},{cId:'c2',pId:'p12',v:1400},
    {cId:'c2',pId:'p15',v:600},{cId:'c2',pId:'p18',v:600},
    {cId:'c2',pId:'p25',v:800},{cId:'c2',pId:'p26',v:900},
    {cId:'c2',pId:'p27',v:650},{cId:'c2',pId:'p28',v:750},
    // Café Las Flores
    {cId:'c3',pId:'p1',v:4500},{cId:'c3',pId:'p2',v:4500},
    {cId:'c3',pId:'p10',v:1200},{cId:'c3',pId:'p12',v:1500},
    {cId:'c3',pId:'p16',v:500},{cId:'c3',pId:'p18',v:650},
    {cId:'c3',pId:'p27',v:700},{cId:'c3',pId:'p28',v:800},
    // Hotel Boutique
    {cId:'c4',pId:'p1',v:5000},{cId:'c4',pId:'p3',v:5500},{cId:'c4',pId:'p4',v:5500},
    {cId:'c4',pId:'p10',v:1300},{cId:'c4',pId:'p12',v:1600},
    {cId:'c4',pId:'p27',v:750},{cId:'c4',pId:'p28',v:850},
    {cId:'c4',pId:'p29',v:3800},{cId:'c4',pId:'p31',v:4200},
    // Bistró 21
    {cId:'c5',pId:'p1',v:4800},{cId:'c5',pId:'p12',v:1500},
    {cId:'c5',pId:'p15',v:650},{cId:'c5',pId:'p25',v:850},{cId:'c5',pId:'p26',v:950},
    {cId:'c5',pId:'p27',v:700},{cId:'c5',pId:'p28',v:800},
    // Distribuciones Sur
    {cId:'c6',pId:'p1',v:3000},{cId:'c6',pId:'p2',v:3000},
    {cId:'c6',pId:'p12',v:1000},{cId:'c6',pId:'p16',v:350},
    {cId:'c6',pId:'p27',v:430},{cId:'c6',pId:'p28',v:500},
  ],

  usuarios: [
    { id:'u1', nombre:'Felipe Contreras', email:'admin@masandera.cl', pass:simpleHash('admin'), rol:'gerente', activo:true },
    { id:'u2', nombre:'Carlos Vega', email:'produccion@masandera.cl', pass:simpleHash('prod'), rol:'produccion', activo:true },
    { id:'u3', nombre:'La Madre', email:'lamadre@cliente.cl', pass:simpleHash('pass'), rol:'cliente', clienteId:'c1', activo:true },
    { id:'u4', nombre:'Pedro Rojas', email:'elpatio@cliente.cl', pass:simpleHash('pass'), rol:'cliente', clienteId:'c2', activo:true },
    { id:'u5', nombre:'Ana Martínez', email:'flores@cliente.cl', pass:simpleHash('pass'), rol:'cliente', clienteId:'c3', activo:true },
    { id:'u6', nombre:'Jorge Muñoz', email:'distrisur@cliente.cl', pass:simpleHash('pass'), rol:'cliente', clienteId:'c6', activo:true },
    { id:'u7', nombre:'Sandra Rojas', email:'facturacion@masandera.cl', pass:simpleHash('fact'), rol:'facturacion', activo:true },
  ],
};

// Pedidos iniciales de demostración
let PEDIDOS = [
  {
    id:'ORD-001', clienteId:'c1',
    items:[{pId:'p1',qty:120,price:3200},{pId:'p12',qty:80,price:1100},{pId:'p16',qty:200,price:380}],
    status:'enviado', fechaPedido:'2026-04-04', fechaDespacho:'2026-04-07',
    obs:'Entrega antes de las 8:00 AM por favor.', obsGerente:'', total:0
  },
  {
    id:'ORD-002', clienteId:'c2',
    items:[{pId:'p1',qty:15,price:4200},{pId:'p27',qty:30,price:650},{pId:'p25',qty:10,price:800}],
    status:'aprobado', fechaPedido:'2026-04-04', fechaDespacho:'2026-04-08',
    obs:'', obsGerente:'Aprobado. Verificar corteza hogaza.', total:0
  },
  {
    id:'ORD-003', clienteId:'c3',
    items:[{pId:'p1',qty:8,price:4500},{pId:'p10',qty:20,price:1200},{pId:'p28',qty:15,price:800}],
    status:'enviado', fechaPedido:'2026-04-04', fechaDespacho:'2026-04-09',
    obs:'', obsGerente:'', total:0
  },
  {
    id:'ORD-004', clienteId:'c1',
    items:[{pId:'p2',qty:80,price:3200},{pId:'p18',qty:150,price:450},{pId:'p27',qty:200,price:480}],
    status:'facturado', fechaPedido:'2026-03-28', fechaDespacho:'2026-04-01',
    obs:'', obsGerente:'Aprobado sin modificaciones.', fechaFacturacion:'2026-04-02', folio:'000001234', total:0
  },
];
// Historial ampliado para el dashboard
const HISTORIAL_EXTRA = [
  { id:'ORD-H01', clienteId:'c1', items:[{pId:'p1',qty:100,price:3200},{pId:'p12',qty:60,price:1100},{pId:'p16',qty:180,price:380}], status:'facturado', fechaPedido:'2026-03-07', fechaDespacho:'2026-03-10', fechaFacturacion:'2026-03-11', folio:'000001220', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H02', clienteId:'c2', items:[{pId:'p27',qty:25,price:650},{pId:'p25',qty:8,price:800}], status:'facturado', fechaPedido:'2026-03-07', fechaDespacho:'2026-03-11', fechaFacturacion:'2026-03-12', folio:'000001221', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H03', clienteId:'c1', items:[{pId:'p1',qty:120,price:3200},{pId:'p18',qty:140,price:450},{pId:'p27',qty:160,price:480}], status:'facturado', fechaPedido:'2026-03-14', fechaDespacho:'2026-03-17', fechaFacturacion:'2026-03-18', folio:'000001222', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H04', clienteId:'c3', items:[{pId:'p1',qty:10,price:4500},{pId:'p28',qty:18,price:800}], status:'facturado', fechaPedido:'2026-03-14', fechaDespacho:'2026-03-18', fechaFacturacion:'2026-03-19', folio:'000001223', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H05', clienteId:'c4', items:[{pId:'p1',qty:6,price:5000},{pId:'p27',qty:12,price:750},{pId:'p29',qty:4,price:3800}], status:'facturado', fechaPedido:'2026-03-16', fechaDespacho:'2026-03-18', fechaFacturacion:'2026-03-19', folio:'000001224', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H06', clienteId:'c1', items:[{pId:'p1',qty:130,price:3200},{pId:'p12',qty:70,price:1100},{pId:'p16',qty:200,price:380}], status:'facturado', fechaPedido:'2026-03-21', fechaDespacho:'2026-03-24', fechaFacturacion:'2026-03-25', folio:'000001225', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H07', clienteId:'c2', items:[{pId:'p1',qty:18,price:4200},{pId:'p25',qty:10,price:800},{pId:'p26',qty:6,price:900}], status:'facturado', fechaPedido:'2026-03-21', fechaDespacho:'2026-03-25', fechaFacturacion:'2026-03-26', folio:'000001226', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H08', clienteId:'c5', items:[{pId:'p27',qty:40,price:700},{pId:'p26',qty:8,price:950}], status:'facturado', fechaPedido:'2026-03-23', fechaDespacho:'2026-03-25', fechaFacturacion:'2026-03-26', folio:'000001227', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H09', clienteId:'c1', items:[{pId:'p1',qty:150,price:3200},{pId:'p18',qty:160,price:450},{pId:'p27',qty:190,price:480}], status:'facturado', fechaPedido:'2026-03-28', fechaDespacho:'2026-04-01', fechaFacturacion:'2026-04-02', folio:'000001228', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H10', clienteId:'c3', items:[{pId:'p1',qty:12,price:4500},{pId:'p10',qty:25,price:1200},{pId:'p28',qty:20,price:800}], status:'facturado', fechaPedido:'2026-03-28', fechaDespacho:'2026-04-02', fechaFacturacion:'2026-04-03', folio:'000001229', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H11', clienteId:'c4', items:[{pId:'p1',qty:8,price:5000},{pId:'p4',qty:5,price:5500},{pId:'p27',qty:14,price:750}], status:'facturado', fechaPedido:'2026-03-30', fechaDespacho:'2026-04-01', fechaFacturacion:'2026-04-03', folio:'000001230', obs:'', obsGerente:'OK', total:0 },
  { id:'ORD-H12', clienteId:'c5', items:[{pId:'p27',qty:35,price:700},{pId:'p25',qty:12,price:850}], status:'facturado', fechaPedido:'2026-03-30', fechaDespacho:'2026-04-02', fechaFacturacion:'2026-04-04', folio:'000001231', obs:'', obsGerente:'OK', total:0 },
];
HISTORIAL_EXTRA.forEach(p => { p.total = p.items.reduce((s,i) => s + i.qty*i.price, 0); });

PEDIDOS.forEach(p => { p.total = p.items.reduce((s,i) => s + i.qty*i.price, 0); });
PEDIDOS.push(...HISTORIAL_EXTRA);
