// ============================================================
// EVENT HANDLERS
// ============================================================
function bindEvents() {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      doLogin(email, pass);
    });
  }
}

function doLogin(email, pass) {
  // Rate limiting check
  const attempts = checkLoginAttempts(email);
  if (!attempts.allowed) {
    STATE.loginError = `Demasiados intentos. Intenta en ${attempts.minutesLeft} minuto(s).`;
    STATE.loginEmail = email;
    render();
    return;
  }

  const user = DATA.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === simpleHash(pass));
  if (!user) {
    recordLoginAttempt(email, false);
    const remaining = checkLoginAttempts(email).remaining;
    STATE.loginError = remaining > 0
      ? `Correo o contraseña incorrectos. ${remaining} intento(s) restante(s).`
      : `Demasiados intentos. Intenta en ${LOCKOUT_MINUTES} minutos.`;
    STATE.loginEmail = email;
    render();
    return;
  }

  // Check if user is active
  if (user.activo === false) {
    STATE.loginError = 'Tu cuenta ha sido desactivada. Contacta al administrador.';
    STATE.loginEmail = email;
    render();
    return;
  }

  recordLoginAttempt(email, true);
  saveSession(user);
  logAction('login', { email: user.email });

  STATE.user = user;
  STATE.page = user.rol;
  STATE.tab = 0;
  STATE.loginError = '';
  render();
}

function quickLogin(email, pass) {
  doLogin(email, pass);
}

function doLogout() {
  logAction('logout', { email: STATE.user?.email });
  clearSession();
  STATE.user = null;
  STATE.page = 'login';
  STATE.tab = 0;
  STATE.draft = {};
  STATE.draftFecha = '';
  STATE.draftObs = '';
  STATE.modal = null;
  render();
}

function setTab(i) {
  STATE.tab = i;
  STATE.showNotifs = false;
  STATE.confirmAction = null;
  render();
}

function changeQty(pId, delta) {
  const current = STATE.draft[pId] || 0;
  const newVal = Math.max(0, current + delta);
  STATE.draft[pId] = newVal;
  render();
}

function setQty(pId, val) {
  STATE.draft[pId] = Math.max(0, parseInt(val) || 0);
  // No re-render to avoid losing focus
}

function enviarPedido() {
  if (!requirePermission('createOrder')) return;
  
  const items = Object.entries(STATE.draft)
    .filter(([,q]) => q > 0)
    .map(([pId, qty]) => ({
      pId,
      qty,
      price: getPrecio(STATE.user.clienteId, pId)
    }));

  if (!items.length) {
    showNotif('error', 'Debes agregar al menos un producto al pedido.');
    return;
  }

  const nuevoObs = document.getElementById('draftObs')?.value || STATE.draftObs;
  const fecha = document.getElementById('draftFecha')?.value || STATE.draftFecha;

  if (!fecha) {
    showNotif('error', 'Debes seleccionar una fecha de despacho.');
    return;
  }

  // Validate date is not in the past
  if (fecha < todayStr()) {
    showNotif('error', 'La fecha de despacho no puede ser anterior a hoy.');
    return;
  }

  const pedido = {
    id: nextId(),
    clienteId: STATE.user.clienteId,
    items,
    status: 'enviado',
    fechaPedido: todayStr(),
    fechaDespacho: fecha,
    obs: nuevoObs,
    obsGerente: '',
    total: items.reduce((s,i) => s + i.qty*i.price, 0)
  };

  PEDIDOS.unshift(pedido);
  logAction('order_created', { orderId: pedido.id, clienteId: pedido.clienteId, total: pedido.total });
  // Notificar a todos los gerentes activos
  DATA.usuarios
    .filter(u => u.rol === 'gerente' && u.activo !== false)
    .forEach(g => addNotification(g.id,
      `Nuevo pedido ${pedido.id} de ${getCliente(pedido.clienteId)?.nombre || pedido.clienteId} — ${fmt(pedido.total)}.`, 'info'));
  
  STATE.draft = {};
  STATE.draftFecha = '';
  STATE.draftObs = '';
  STATE.tab = 1;
  showNotif('success', `Pedido ${pedido.id} enviado correctamente (${fmt(pedido.total)}). El gerente lo revisará pronto.`);
}

function aprobarPedido(id) {
  if (!requirePermission('approveOrder')) return;
  const p = PEDIDOS.find(x => x.id === id);
  if (p) { p.status = 'aprobado'; p.obsGerente = 'Aprobado.'; }
  logAction('order_approved', { orderId: id });
  // Notify client
  const clientUser = DATA.usuarios.find(u => u.clienteId === p.clienteId && u.rol === 'cliente');
  if (clientUser) addNotification(clientUser.id, `Tu pedido ${id} ha sido aprobado y enviado a producción.`, 'success');
  showNotif('success', `Pedido ${id} aprobado y enviado a producción.`);
}

function rechazarPedido(id) {
  if (!requirePermission('rejectOrder')) return;
  const p = PEDIDOS.find(x => x.id === id);
  if (p) p.status = 'rechazado';
  logAction('order_rejected', { orderId: id });
  const clientUser = DATA.usuarios.find(u => u.clienteId === p.clienteId && u.rol === 'cliente');
  if (clientUser) addNotification(clientUser.id, `Tu pedido ${id} ha sido rechazado. Contacta al gerente para más información.`, 'error');
  showNotif('error', `Pedido ${id} rechazado. Se notificará al cliente.`);
}

function aprobarDesdeModal(id) {
  if (!requirePermission('approveOrder')) return;
  const obs = document.getElementById('modalObs')?.value || '';
  const p = PEDIDOS.find(x => x.id === id);
  if (p) { p.status = 'aprobado'; p.obsGerente = obs || 'Aprobado.'; }
  logAction('order_approved', { orderId: id, note: obs });
  const clientUser = DATA.usuarios.find(u => u.clienteId === p.clienteId && u.rol === 'cliente');
  if (clientUser) addNotification(clientUser.id, `Tu pedido ${id} ha sido aprobado y enviado a producción.`, 'success');
  STATE.modal = null;
  showNotif('success', `Pedido ${id} aprobado y enviado a producción.`);
}

function rechazarDesdeModal(id) {
  if (!requirePermission('rejectOrder')) return;
  const obs = document.getElementById('modalObs')?.value || '';
  const p = PEDIDOS.find(x => x.id === id);
  if (p) { p.status = 'rechazado'; p.obsGerente = obs; }
  logAction('order_rejected', { orderId: id, note: obs });
  const clientUser = DATA.usuarios.find(u => u.clienteId === p.clienteId && u.rol === 'cliente');
  if (clientUser) addNotification(clientUser.id, `Tu pedido ${id} ha sido rechazado. Contacta al gerente para más información.`, 'error');
  STATE.modal = null;
  showNotif('error', `Pedido ${id} rechazado.`);
}

function openModal(id) {
  STATE.modal = id;
  render();
}

function closeModal() {
  STATE.modal = null;
  render();
}

function closeModalIfBg(e) {
  if (e.target === e.currentTarget) closeModal();
}

// ===== EDICIÓN DE PEDIDO =====
function startEditOrder(orderId) {
  if (!requirePermission('editOrder')) return;
  const p = PEDIDOS.find(x => x.id === orderId);
  if (!p) return;
  // Pre-fill edit state with current order items
  const items = {};
  p.items.forEach(i => { items[i.pId] = i.qty; });
  // Also load all products of this client with 0
  getProductosCliente(p.clienteId).forEach(prod => {
    if (!(prod.id in items)) items[prod.id] = 0;
  });
  STATE.editingOrderId = orderId;
  STATE.editItems = items;
  STATE.modal = null;
  render();
}

function editQty(pId, delta) {
  STATE.editItems[pId] = Math.max(0, (STATE.editItems[pId] || 0) + delta);
  render();
}

function editQtySet(pId, val) {
  STATE.editItems[pId] = Math.max(0, parseInt(val) || 0);
  // No re-render, just update state quietly
}

function saveEditOrder() {
  const p = PEDIDOS.find(x => x.id === STATE.editingOrderId);
  if (!p) return;
  // Sync any manually-typed values from inputs
  getProductosCliente(p.clienteId).forEach(prod => {
    const input = document.getElementById('eqty-' + prod.id);
    if (input) STATE.editItems[prod.id] = Math.max(0, parseInt(input.value) || 0);
  });
  // Build new items array (only qty > 0)
  const newItems = Object.entries(STATE.editItems)
    .filter(([,q]) => q > 0)
    .map(([pId, qty]) => ({
      pId,
      qty,
      price: getPrecio(p.clienteId, pId) || 0
    }));
  if (!newItems.length) {
    showNotif('error', 'El pedido debe tener al menos un producto con cantidad mayor a cero.');
    return;
  }
  p.items = newItems;
  p.total = newItems.reduce((s,i) => s + i.qty*i.price, 0);
  logAction('order_edited', { orderId: STATE.editingOrderId });
  STATE.editingOrderId = null;
  STATE.editItems = {};
  showNotif('success', `Pedido ${p.id} actualizado correctamente.`);
}

function saveAndApprove() {
  const orderId = STATE.editingOrderId;
  saveEditOrder();
  if (!STATE.editingOrderId) { // saveEditOrder cleared it = success
    const p = PEDIDOS.find(x => x.id === orderId);
    if (p) { p.status = 'aprobado'; p.obsGerente = p.obsGerente || 'Aprobado con ajuste de cantidades.'; }
    logAction('order_edited_approved', { orderId });
    showNotif('success', `Pedido ${orderId} guardado y aprobado.`);
  }
}

function cancelEdit() {
  STATE.editingOrderId = null;
  STATE.editItems = {};
  render();
}

function closeEditIfBg(e) {
  if (e.target === e.currentTarget) cancelEdit();
}

// ===== REPEAT ORDER =====
function repetirPedido(orderId) {
  const original = PEDIDOS.find(p => p.id === orderId);
  if (!original) return;
  // Load items into draft
  STATE.draft = {};
  original.items.forEach(item => {
    STATE.draft[item.pId] = item.qty;
  });
  STATE.draftFecha = '';
  STATE.draftObs = '';
  STATE.tab = 0; // Switch to "Nuevo Pedido" tab
  showNotif('success', `Pedido ${orderId} cargado. Revisa cantidades y selecciona fecha de despacho.`);
}

// ===== FACTURACIÓN =====
function marcarFacturado(orderId) {
  if (!requirePermission('markInvoiced')) return;
  const p = PEDIDOS.find(x => x.id === orderId);
  if (!p) return;
  p.status = 'facturado';
  p.fechaFacturacion = todayStr();
  logAction('order_invoiced', { orderId, total: p.total });
  const clientUser = DATA.usuarios.find(u => u.clienteId === p.clienteId && u.rol === 'cliente');
  if (clientUser) addNotification(clientUser.id, `Tu pedido ${orderId} ha sido facturado por ${fmt(p.total)}.`, 'info');
  showNotif('success', `Pedido ${orderId} marcado como Facturado — ${fmt(p.total)}`);
}

let _notifTimer = null;
function showNotif(type, msg) {
  if (_notifTimer) { clearTimeout(_notifTimer); _notifTimer = null; }
  STATE.notif = { type, msg };
  render();
  _notifTimer = setTimeout(() => {
    STATE.notif = null;
    _notifTimer = null;
    render();
  }, 4500);
}

// ===== USER MANAGEMENT ACTIONS =====
function doCreateUser() {
  const nombre = document.getElementById('newUserNombre')?.value.trim();
  const email = document.getElementById('newUserEmail')?.value.trim();
  const pass = document.getElementById('newUserPass')?.value;
  const rol = document.getElementById('newUserRol')?.value;
  const clienteId = document.getElementById('newUserCliente')?.value;

  const result = createUser(nombre, email, pass, rol, clienteId || null);
  if (result) {
    STATE.showCreateUser = false;
    render();
  }
}

function promptResetPassword(userId) {
  STATE.resetPassUserId = userId;
  render();
}

function doResetPassword() {
  const input = document.getElementById('resetPassInput');
  const newPass = input ? input.value : '';
  if (!newPass || newPass.length < 8) {
    showNotif('error', 'La contraseña debe tener al menos 8 caracteres.');
    return;
  }
  resetUserPassword(STATE.resetPassUserId, newPass);
  STATE.resetPassUserId = null;
  render();
}

function cancelResetPassword() {
  STATE.resetPassUserId = null;
  render();
}

// ============================================================
// GRUPO 1: Notificaciones, filtros historial, confirmaciones
// ============================================================

function toggleNotifs() {
  STATE.showNotifs = !STATE.showNotifs;
  render();
}

function closeNotifs() {
  if (STATE.showNotifs) { STATE.showNotifs = false; render(); }
}

function setHistorialFilter(key, val) {
  STATE.historialFilter[key] = val;
  render();
}

function clearHistorialFilter() {
  STATE.historialFilter = { search:'', status:'all', clienteId:'all' };
  render();
}

function setConfirmAction(type, id) {
  STATE.confirmAction = { type, id };
  render();
}

function cancelConfirmAction() {
  STATE.confirmAction = null;
  render();
}

function executeConfirmAction(id) {
  const action = STATE.confirmAction;
  if (!action || action.id !== id) return;

  if (action.type === 'reject') {
    const input = document.getElementById('confirmReason_' + id);
    const motivo = input ? input.value.trim() : '';
    const p = PEDIDOS.find(x => x.id === id);
    if (!requirePermission('rejectOrder')) { STATE.confirmAction = null; render(); return; }
    if (p) { p.status = 'rechazado'; p.obsGerente = motivo || 'Pedido rechazado.'; }
    logAction('order_rejected', { orderId: id, note: motivo });
    const clientUser = DATA.usuarios.find(u => u.clienteId === p?.clienteId && u.rol === 'cliente');
    if (clientUser) addNotification(clientUser.id,
      `Tu pedido ${id} fue rechazado.${motivo ? ' Motivo: ' + motivo : ''}`, 'error');
    showNotif('error', `Pedido ${id} rechazado.`);
  }

  if (action.type === 'deactivate') {
    deactivateUser(id);
  }

  STATE.confirmAction = null;
  render();
}

// ============================================================
// GRUPO 2: Catálogo de productos (filtro DOM sin re-render)
// ============================================================

/**
 * Filtra las tarjetas de productos sin re-renderizar el DOM completo.
 * Esto preserva el foco del input de búsqueda.
 */
function filterCatalog(search, cat) {
  STATE.catalogSearch   = search || '';
  STATE.catalogCategory = cat   || 'all';
  const q = STATE.catalogSearch.toLowerCase();

  // Actualizar estado visual de botones de categoría
  document.querySelectorAll('.catalog-cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });

  // Limpiar botón (mostrar/ocultar)
  const clearBtn = document.querySelector('.catalog-search-clear');
  if (clearBtn) clearBtn.style.display = search ? '' : 'none';

  // Mostrar/ocultar tarjetas de producto
  document.querySelectorAll('.product-card[data-search]').forEach(card => {
    const matchesCat    = cat === 'all' || card.dataset.cat === cat;
    const matchesSearch = !q || card.dataset.search.includes(q);
    card.style.display  = (matchesCat && matchesSearch) ? '' : 'none';
  });

  // Mostrar/ocultar secciones enteras si todos sus productos están ocultos
  document.querySelectorAll('.product-section').forEach(section => {
    const anyVisible = [...section.querySelectorAll('.product-card')]
      .some(c => c.style.display !== 'none');
    section.style.display = anyVisible ? '' : 'none';
  });
}

// ============================================================
// GRUPO 3: Flujo de estados completo
// ============================================================

function marcarEnProduccion(orderId) {
  if (!requirePermission('approveOrder')) return;
  const p = PEDIDOS.find(x => x.id === orderId);
  if (!p || p.status !== 'aprobado') return;
  p.status = 'en_produccion';
  logAction('order_in_production', { orderId });
  const clientUser = DATA.usuarios.find(u => u.clienteId === p.clienteId && u.rol === 'cliente');
  if (clientUser) addNotification(clientUser.id, `Tu pedido ${orderId} está en producción. ⚙️`, 'info');
  showNotif('success', `Pedido ${orderId} marcado como En Producción.`);
}

// ============================================================
// GRUPO 4: Filtros Facturación
// ============================================================

function setFactFilter(key, val) {
  STATE.factFilter[key] = val;
  render();
}

function clearFactFilter() {
  STATE.factFilter = { period: 'all', clienteId: 'all' };
  render();
}

// ============================================================
// GRUPO 5: Gestión de catálogo y precios
// ============================================================

function doAddProduct() {
  const nombre    = document.getElementById('newProdNombre')?.value.trim();
  const tipo      = document.getElementById('newProdTipo')?.value.trim();
  const categoria = document.getElementById('newProdCategoria')?.value;
  const unidad    = document.getElementById('newProdUnidad')?.value.trim() || 'unidad';
  const desc      = document.getElementById('newProdDesc')?.value.trim() || '';

  if (!nombre || !tipo || !categoria) {
    showNotif('error', 'Nombre, tipo y categoría son obligatorios.');
    return;
  }
  const newId = 'p_' + Date.now().toString(36);
  DATA.productos.push({ id: newId, nombre, tipo, categoria, unidad, descripcion: desc, activo: true });
  // Precio 0 para todos los clientes como punto de partida
  DATA.clientes.forEach(c => DATA.precios.push({ cId: c.id, pId: newId, v: 0 }));
  logAction('product_created', { nombre });
  STATE.catMgmt.showForm = false;
  showNotif('success', `Producto "${nombre}" creado. Configura los precios por cliente.`);
}

function doToggleProduct(pId) {
  const prod = DATA.productos.find(x => x.id === pId);
  if (!prod) return;
  prod.activo = prod.activo === false ? true : false;
  logAction(prod.activo ? 'product_activated' : 'product_deactivated', { productId: pId });
  showNotif('success', `Producto ${prod.activo ? 'activado' : 'desactivado'}.`);
}

function savePreciosCliente(clienteId) {
  DATA.productos.forEach(prod => {
    const input = document.getElementById(`precio-${clienteId}-${prod.id}`);
    if (!input) return;
    const val = parseInt(input.value) || 0;
    const entry = DATA.precios.find(x => x.cId === clienteId && x.pId === prod.id);
    if (entry) entry.v = val;
    else DATA.precios.push({ cId: clienteId, pId: prod.id, v: val });
  });
  logAction('prices_updated', { clienteId });
  showNotif('success', `Precios guardados para ${getCliente(clienteId)?.nombre}.`);
  saveStorage();
}

