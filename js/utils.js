// ============================================================
// UTILS
// ============================================================

/**
 * Escapa caracteres HTML peligrosos en strings de usuario.
 * Usar en TODOS los valores de entrada libre antes de inyectarlos en innerHTML.
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getPrecio(clienteId, productoId) {
  const p = DATA.precios.find(x => x.cId === clienteId && x.pId === productoId);
  if (p) return p.v;
  // Precio por defecto: usar precio de La Madre (c1) como base
  const base = DATA.precios.find(x => x.cId === 'c1' && x.pId === productoId);
  return base ? base.v : 0;
}
function getProductosCliente(clienteId) {
  const cliente = DATA.clientes.find(c => c.id === clienteId);
  if (!cliente || !cliente.productosAsignados || cliente.productosAsignados.length === 0) {
    return DATA.productos.filter(p => p.activo);
  }
  return DATA.productos.filter(p => p.activo && cliente.productosAsignados.includes(p.id));
}
function getSubCliente(clienteId, subClienteId) {
  const cliente = DATA.clientes.find(c => c.id === clienteId);
  if (!cliente || !cliente.subClientes) return null;
  return cliente.subClientes.find(sc => sc.id === subClienteId) || null;
}
function getProductosSubCliente(clienteId, subClienteId) {
  const sc = getSubCliente(clienteId, subClienteId);
  if (!sc) return getProductosCliente(clienteId);
  if (!sc.productosAsignados || sc.productosAsignados.length === 0) return getProductosCliente(clienteId);
  return DATA.productos.filter(p => p.activo && sc.productosAsignados.includes(p.id));
}
function getCliente(id) { return DATA.clientes.find(c => c.id === id); }
function getProducto(id) { return DATA.productos.find(p => p.id === id); }
function fmt(n) { return new Intl.NumberFormat('es-CL', {style:'currency',currency:'CLP'}).format(n); }
function fmtDate(d) {
  if (!d) return '-';
  const [y,m,day] = d.split('-');
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const dt = new Date(y, parseInt(m)-1, parseInt(day));
  return `${dias[dt.getDay()]} ${parseInt(day)} ${meses[parseInt(m)-1]}`;
}
function nextId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return 'ORD-' + ts + rand;
}
function statusLabel(s) {
  const map = {enviado:'Enviado',aprobado:'Aprobado',rechazado:'Rechazado',en_produccion:'En Producción',borrador:'Borrador',facturado:'Facturado'};
  return map[s] || s;
}
function statusIcon(s) {
  const map = {
    enviado: icon('clock'),
    aprobado: icon('check'),
    rechazado: icon('x'),
    en_produccion: icon('gear'),
    borrador: icon('edit'),
    facturado: icon('fileText'),
  };
  return map[s] || '';
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function getNextDespachos() {
  // Returns next 6 dispatch dates: Lun-Vie + Sáb (viernes cubre sáb y lunes)
  const today = new Date();
  const options = [];
  const targets = [1,2,3,4,5,6]; // Lun=1 a Sáb=6
  for (let i = 1; i <= 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (targets.includes(d.getDay())) {
      const str = d.toISOString().split('T')[0];
      options.push(str);
      if (options.length >= 6) break;
    }
  }
  return options;
}
