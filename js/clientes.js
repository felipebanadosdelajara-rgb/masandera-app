// ============================================================
// CLIENTES — Gestión de clientes (gerente only)
// Tipos: 'final' | 'distribuidor' (con subClientes)
// ============================================================

// ── State helpers (fields live in STATE) ───────────────────
// STATE.clientMgmt = {
//   showForm: false,
//   editingClientId: null,      // null = crear nuevo
//   typeFilter: 'all',          // 'all'|'final'|'distribuidor'
//   expandedDistributor: null,  // clienteId con subClientes expandidos
//   showSubClientForm: null,    // clienteId padre para nuevo subCliente
//   editingSubClientId: null,   // { parentId, scId }
//   assigningProductsTo: null,  // { type:'client'|'subclient', clienteId, scId? }
// }
// Añadir a STATE en state.js tras bootstrapping aquí.

function getClientMgmt() {
  if (!STATE.clientMgmt) {
    STATE.clientMgmt = {
      showForm: false,
      editingClientId: null,
      typeFilter: 'all',
      expandedDistributor: null,
      showSubClientForm: null,
      editingSubClientId: null,
      assigningProductsTo: null,
    };
  }
  return STATE.clientMgmt;
}

// ============================================================
// RENDER PRINCIPAL
// ============================================================
function renderClientes() {
  const cm = getClientMgmt();
  const clientes = DATA.clientes.filter(c =>
    cm.typeFilter === 'all' || c.tipo === cm.typeFilter
  );

  return `
  <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
    <div>
      <h2>Gestión de Clientes</h2>
      <p>Administra clientes, distribuidores y sub-clientes. Asigna catálogos y precios por cliente.</p>
    </div>
    <button class="btn btn-primary btn-sm" onclick="abrirFormCliente(null)">+ Nuevo Cliente</button>
  </div>

  <!-- Filtro tipo -->
  <div class="tabs" style="margin-bottom:20px">
    ${[['all','Todos'],['final','Clientes Finales'],['distribuidor','Distribuidores']].map(([val,label]) => `
      <button class="tab-btn ${cm.typeFilter===val?'active':''}"
        onclick="setClientTypeFilter('${val}')">
        ${label}
        <span class="tab-badge" style="background:var(--bg-soft);color:var(--text-mid)">
          ${val==='all'?DATA.clientes.length:DATA.clientes.filter(c=>c.tipo===val).length}
        </span>
      </button>`).join('')}
  </div>

  ${cm.showForm ? renderFormCliente(cm.editingClientId) : ''}
  ${cm.assigningProductsTo ? renderAsignacionProductos(cm.assigningProductsTo) : ''}

  ${!clientes.length
    ? `<div class="empty-state"><span class="empty-icon">🏪</span><h3>Sin clientes</h3><p>Crea el primer cliente.</p></div>`
    : `<div class="dispatch-group">
        ${clientes.map(c => renderClienteRow(c, cm)).join('')}
      </div>`}`;
}

// ============================================================
// FILA DE CLIENTE
// ============================================================
function renderClienteRow(c, cm) {
  const pedidosCliente = PEDIDOS.filter(p => p.clienteId === c.id);
  const totalFacturado = pedidosCliente.filter(p => p.status==='facturado').reduce((s,p)=>s+p.total,0);
  const pendientes = pedidosCliente.filter(p => ['enviado','aprobado','en_produccion'].includes(p.status)).length;
  const isDistribuidor = c.tipo === 'distribuidor';
  const isExpanded = cm.expandedDistributor === c.id;

  return `
  <div class="cliente-row ${c.activo===false?'cliente-inactivo':''}">
    <div class="cliente-row-header">
      <div style="display:flex;align-items:center;gap:12px;flex:1">
        ${isDistribuidor
          ? `<button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:16px"
               onclick="toggleExpandDistributor('${c.id}')">${isExpanded?'▼':'▶'}</button>`
          : `<span style="width:34px;display:inline-block"></span>`}
        <div>
          <div style="font-weight:700;font-size:15px">
            ${escapeHtml(c.nombre)}
            <span class="status-badge ${c.tipo==='distribuidor'?'badge-aprobado':'badge-enviado'}" style="margin-left:6px;font-size:11px">
              ${c.tipo === 'distribuidor' ? '🏢 Distribuidor' : '🏪 Final'}
            </span>
            ${c.activo===false ? `<span class="status-badge badge-rechazado" style="margin-left:4px;font-size:10px">Inactivo</span>` : ''}
          </div>
          <div style="font-size:12px;color:var(--text-mid);margin-top:2px">
            ${escapeHtml(c.razonSocial || '')}
            ${c.rut ? ` · RUT: ${escapeHtml(c.rut)}` : ''}
            ${c.rubro ? ` · ${escapeHtml(c.rubro)}` : ''}
            ${c.ciudad ? ` · ${escapeHtml(c.ciudad)}` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:16px;align-items:center;flex-shrink:0">
        <div style="text-align:center;font-size:12px">
          <div style="font-weight:700;color:var(--primary)">${pendientes}</div>
          <div style="color:var(--text-light)">Pendientes</div>
        </div>
        <div style="text-align:center;font-size:12px">
          <div style="font-weight:700">${fmt(totalFacturado)}</div>
          <div style="color:var(--text-light)">Facturado</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="abrirAsignacionProductos('client','${c.id}')">📦 Catálogo</button>
          <button class="btn btn-ghost btn-sm" onclick="abrirFormCliente('${c.id}')">✏️ Editar</button>
          ${isDistribuidor ? `<button class="btn btn-ghost btn-sm" onclick="abrirFormSubCliente('${c.id}',null)">+ Sub-cliente</button>` : ''}
          ${c.activo!==false
            ? `<button class="btn btn-danger btn-sm" onclick="toggleClienteActivo('${c.id}',false)">Desactivar</button>`
            : `<button class="btn btn-success btn-sm" onclick="toggleClienteActivo('${c.id}',true)">Activar</button>`}
        </div>
      </div>
    </div>

    ${isDistribuidor && isExpanded && c.subClientes && c.subClientes.length > 0 ? `
    <div class="subclient-list">
      <div style="font-size:12px;font-weight:700;color:var(--text-mid);padding:8px 12px;border-bottom:1px solid var(--border)">
        Sub-clientes de ${escapeHtml(c.nombre)} (${c.subClientes.length})
      </div>
      ${c.subClientes.map(sc => renderSubClienteRow(c.id, sc, cm)).join('')}
    </div>` : ''}

    ${isDistribuidor && isExpanded && (!c.subClientes || !c.subClientes.length) ? `
    <div class="subclient-list" style="padding:16px;font-size:13px;color:var(--text-light);text-align:center">
      Sin sub-clientes. <button class="btn btn-ghost btn-sm" onclick="abrirFormSubCliente('${c.id}',null)">+ Agregar sub-cliente</button>
    </div>` : ''}

    ${cm.showSubClientForm === c.id ? renderFormSubCliente(c.id, cm.editingSubClientId) : ''}
  </div>`;
}

// ============================================================
// FILA DE SUB-CLIENTE
// ============================================================
function renderSubClienteRow(parentId, sc, cm) {
  return `
  <div class="subclient-row">
    <div style="flex:1">
      <div style="font-weight:600">${escapeHtml(sc.nombre)}</div>
      <div style="font-size:11px;color:var(--text-mid)">
        ${sc.razonSocial ? escapeHtml(sc.razonSocial) : ''}
        ${sc.rut ? ` · ${escapeHtml(sc.rut)}` : ''}
        ${sc.rubro ? ` · ${escapeHtml(sc.rubro)}` : ''}
        ${sc.ciudad ? ` · ${escapeHtml(sc.ciudad)}` : ''}
      </div>
    </div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-ghost btn-sm" onclick="abrirAsignacionProductos('subclient','${parentId}','${sc.id}')">📦</button>
      <button class="btn btn-ghost btn-sm" onclick="abrirFormSubCliente('${parentId}','${sc.id}')">✏️</button>
      <button class="btn btn-danger btn-sm" onclick="eliminarSubCliente('${parentId}','${sc.id}')">✕</button>
    </div>
  </div>`;
}

// ============================================================
// FORM: CREAR / EDITAR CLIENTE
// ============================================================
function renderFormCliente(editingId) {
  const c = editingId ? DATA.clientes.find(x => x.id === editingId) : null;
  const v = f => escapeHtml(c?.[f] || '');

  return `
  <div class="card" style="padding:24px;margin-bottom:24px;border:2px solid var(--primary-light)">
    <h3 style="margin-bottom:16px">${c ? `Editar cliente: ${c.nombre}` : 'Nuevo Cliente'}</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="form-group">
        <label class="form-label">Nombre comercial *</label>
        <input class="form-input" type="text" id="cNombre" placeholder="Ej: Restaurante El Patio" value="${v('nombre')}">
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de cliente *</label>
        <select class="form-select" id="cTipo">
          <option value="final"        ${(!c||c.tipo==='final')?'selected':''}>🏪 Cliente Final</option>
          <option value="distribuidor" ${c?.tipo==='distribuidor'?'selected':''}>🏢 Distribuidor</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Razón Social</label>
        <input class="form-input" type="text" id="cRazonSocial" placeholder="Ej: El Patio Gastronómico SpA" value="${v('razonSocial')}">
      </div>
      <div class="form-group">
        <label class="form-label">RUT</label>
        <input class="form-input" type="text" id="cRut" placeholder="76.123.456-7" value="${v('rut')}">
      </div>
      <div class="form-group">
        <label class="form-label">Giro</label>
        <input class="form-input" type="text" id="cGiro" placeholder="Ej: Restaurant" value="${v('giro')}">
      </div>
      <div class="form-group">
        <label class="form-label">Rubro</label>
        <select class="form-select" id="cRubro">
          <option value="">Seleccionar...</option>
          ${DATA.rubros.map(r => `<option value="${r}" ${c?.rubro===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Contacto</label>
        <input class="form-input" type="text" id="cContacto" placeholder="Nombre del contacto" value="${v('contacto')}">
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono</label>
        <input class="form-input" type="tel" id="cTelefono" placeholder="+56 9 1234 5678" value="${v('telefono')}">
      </div>
      <div class="form-group">
        <label class="form-label">Dirección</label>
        <input class="form-input" type="text" id="cDireccion" placeholder="Dirección completa" value="${v('direccion')}">
      </div>
      <div class="form-group">
        <label class="form-label">Ciudad</label>
        <input class="form-input" type="text" id="cCiudad" placeholder="Santiago" value="${v('ciudad')}">
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px">
      <button class="btn btn-primary btn-sm" onclick="guardarCliente('${editingId||''}')">
        ${c ? 'Guardar Cambios' : 'Crear Cliente'}
      </button>
      <button class="btn btn-ghost btn-sm" onclick="cerrarFormCliente()">Cancelar</button>
    </div>
  </div>`;
}

// ============================================================
// FORM: CREAR / EDITAR SUB-CLIENTE
// ============================================================
function renderFormSubCliente(parentId, editingScId) {
  const parent = DATA.clientes.find(c => c.id === parentId);
  const sc = editingScId ? parent?.subClientes?.find(x => x.id === editingScId) : null;
  const v = f => escapeHtml(sc?.[f] || '');

  return `
  <div class="card" style="padding:20px;margin:12px 0;border:2px dashed var(--primary-light);background:var(--bg-soft)">
    <h4 style="margin-bottom:12px">${sc ? 'Editar sub-cliente' : `Nuevo sub-cliente de ${parent?.nombre||''}`}</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="form-input" type="text" id="scNombre" placeholder="Ej: Café Central" value="${v('nombre')}">
      </div>
      <div class="form-group">
        <label class="form-label">Razón Social</label>
        <input class="form-input" type="text" id="scRazonSocial" placeholder="Ej: Café Central SpA" value="${v('razonSocial')}">
      </div>
      <div class="form-group">
        <label class="form-label">RUT</label>
        <input class="form-input" type="text" id="scRut" placeholder="77.234.567-8" value="${v('rut')}">
      </div>
      <div class="form-group">
        <label class="form-label">Rubro</label>
        <select class="form-select" id="scRubro">
          <option value="">Seleccionar...</option>
          ${DATA.rubros.map(r => `<option value="${r}" ${sc?.rubro===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Giro</label>
        <input class="form-input" type="text" id="scGiro" value="${v('giro')}">
      </div>
      <div class="form-group">
        <label class="form-label">Contacto</label>
        <input class="form-input" type="text" id="scContacto" value="${v('contacto')}">
      </div>
      <div class="form-group">
        <label class="form-label">Dirección</label>
        <input class="form-input" type="text" id="scDireccion" value="${v('direccion')}">
      </div>
      <div class="form-group">
        <label class="form-label">Ciudad</label>
        <input class="form-input" type="text" id="scCiudad" value="${v('ciudad')}">
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-top:12px">
      <button class="btn btn-primary btn-sm" onclick="guardarSubCliente('${parentId}','${editingScId||''}')">
        ${sc ? 'Guardar' : 'Crear Sub-cliente'}
      </button>
      <button class="btn btn-ghost btn-sm" onclick="cerrarFormSubCliente()">Cancelar</button>
    </div>
  </div>`;
}

// ============================================================
// FORM: ASIGNACIÓN DE PRODUCTOS (con precios especiales)
// ============================================================
function renderAsignacionProductos({ type, clienteId, scId }) {
  const cliente = getCliente(clienteId);
  const target = type === 'subclient' ? getSubCliente(clienteId, scId) : cliente;
  const assigned = target?.productosAsignados || [];
  const allProds = DATA.productos.filter(p => p.activo);
  // Prices always tied to parent client (even for subclients)
  const realCId = clienteId;

  // Group by tipo (like redesign.html)
  const tipos = [...new Set(allProds.map(p => p.tipo))];

  return `
  <div class="card" style="padding:24px;margin-bottom:24px;border:2px solid var(--primary-light)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div>
        <h3 style="margin-bottom:4px">Catálogo y precios</h3>
        <p style="font-size:13px;color:var(--text-mid)">
          ${type==='subclient'?`Sub-cliente: ${escapeHtml(target?.nombre||'')} (de ${escapeHtml(cliente?.nombre||'')})`:`Cliente: ${escapeHtml(cliente?.nombre||'')}`}
          — ${assigned.length} de ${allProds.length} productos asignados
        </p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="asignarTodosProductosToggle('${type}','${clienteId}','${scId||''}')">Todos</button>
        <button class="btn btn-ghost btn-sm" onclick="quitarTodosProductosToggle('${type}','${clienteId}','${scId||''}')">Ninguno</button>
        <button class="btn btn-primary btn-sm" onclick="cerrarAsignacionProductos()">${icon('check')} Listo</button>
      </div>
    </div>

    ${tipos.map(tipo => {
      const prods = allProds.filter(p => p.tipo === tipo);
      return `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-mid);margin-bottom:8px">${tipo}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:8px">
          ${prods.map(p => {
            const isAssigned = assigned.includes(p.id);
            const precioEspecial = DATA.precios.find(x => x.cId === realCId && x.pId === p.id);
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;border:1.5px solid ${isAssigned?'var(--primary)':'var(--border)'};background:${isAssigned?'var(--primary-faint)':'var(--surface)'};transition:all 0.15s">
              <div style="width:18px;height:18px;border-radius:4px;border:2px solid ${isAssigned?'var(--primary)':'var(--border)'};background:${isAssigned?'var(--primary)':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer"
                onclick="toggleProductAssignment('${type}','${clienteId}','${scId||''}','${p.id}')">
                ${isAssigned ? `<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:#fff;fill:none;stroke-width:3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
              </div>
              <div style="flex:1;min-width:0;cursor:pointer" onclick="toggleProductAssignment('${type}','${clienteId}','${scId||''}','${p.id}')">
                <div style="font-size:13px;font-weight:${isAssigned?'600':'400'};color:var(--text)">${escapeHtml(p.nombre)}</div>
                <div style="font-size:11px;color:var(--text-light)">Lista: ${fmt(p.precioLista || 0)}</div>
              </div>
              ${isAssigned ? `
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0" onclick="event.stopPropagation()">
                <span style="font-size:11px;color:var(--text-light);white-space:nowrap">Precio:</span>
                <input type="number" class="form-input" style="width:90px;padding:4px 8px;font-size:13px;font-weight:600;text-align:right"
                  value="${precioEspecial ? precioEspecial.v : ''}"
                  placeholder="${p.precioLista || ''}"
                  onchange="setSpecialPrice('${realCId}','${p.id}',this.value)"
                  onclick="event.stopPropagation()">
              </div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ============================================================
// ACCIONES DE ESTADO
// ============================================================
function setClientTypeFilter(val) {
  getClientMgmt().typeFilter = val;
  render();
}

function abrirFormCliente(editingId) {
  const cm = getClientMgmt();
  cm.showForm = true;
  cm.editingClientId = editingId;
  cm.showSubClientForm = null;
  cm.assigningProductsTo = null;
  render();
}

function cerrarFormCliente() {
  const cm = getClientMgmt();
  cm.showForm = false;
  cm.editingClientId = null;
  render();
}

function toggleExpandDistributor(clienteId) {
  const cm = getClientMgmt();
  cm.expandedDistributor = cm.expandedDistributor === clienteId ? null : clienteId;
  render();
}

function abrirFormSubCliente(parentId, scId) {
  const cm = getClientMgmt();
  cm.showSubClientForm = parentId;
  cm.editingSubClientId = scId;
  cm.expandedDistributor = parentId;
  cm.showForm = false;
  cm.assigningProductsTo = null;
  render();
}

function cerrarFormSubCliente() {
  const cm = getClientMgmt();
  cm.showSubClientForm = null;
  cm.editingSubClientId = null;
  render();
}

function abrirAsignacionProductos(type, clienteId, scId) {
  const cm = getClientMgmt();
  cm.assigningProductsTo = { type, clienteId, scId: scId || null };
  cm.showForm = false;
  cm.showSubClientForm = null;
  if (type === 'subclient') cm.expandedDistributor = clienteId;
  render();
}

function cerrarAsignacionProductos() {
  getClientMgmt().assigningProductsTo = null;
  render();
}

// ============================================================
// ACCIONES: GUARDAR
// ============================================================
function guardarCliente(editingId) {
  const nombre     = document.getElementById('cNombre')?.value.trim();
  const tipo       = document.getElementById('cTipo')?.value;
  const razonSocial= document.getElementById('cRazonSocial')?.value.trim();
  const rut        = document.getElementById('cRut')?.value.trim();
  const giro       = document.getElementById('cGiro')?.value.trim();
  const rubro      = document.getElementById('cRubro')?.value;
  const contacto   = document.getElementById('cContacto')?.value.trim();
  const telefono   = document.getElementById('cTelefono')?.value.trim();
  const direccion  = document.getElementById('cDireccion')?.value.trim();
  const ciudad     = document.getElementById('cCiudad')?.value.trim();

  if (!nombre) { showNotif('error', 'El nombre es obligatorio.'); return; }
  if (!tipo)   { showNotif('error', 'El tipo de cliente es obligatorio.'); return; }

  if (editingId) {
    const c = DATA.clientes.find(x => x.id === editingId);
    if (!c) return;
    Object.assign(c, { nombre, tipo, razonSocial, rut, giro, rubro, contacto, telefono, direccion, ciudad });
    if (tipo === 'distribuidor' && !c.subClientes) c.subClientes = [];
    logAction('client_updated', { clienteId: editingId, nombre });
    showNotif('success', `Cliente "${nombre}" actualizado.`);
  } else {
    const newId = 'c_' + Date.now().toString(36);
    const newCliente = {
      id: newId, nombre, tipo, razonSocial, rut, giro, rubro,
      contacto, telefono, direccion, ciudad,
      productosAsignados: DATA.productos.filter(p=>p.activo).map(p=>p.id),
      activo: true,
    };
    if (tipo === 'distribuidor') newCliente.subClientes = [];
    DATA.clientes.push(newCliente);
    logAction('client_created', { clienteId: newId, nombre, tipo });
    showNotif('success', `Cliente "${nombre}" creado correctamente.`);
  }

  cerrarFormCliente();
}

function guardarSubCliente(parentId, editingScId) {
  const nombre      = document.getElementById('scNombre')?.value.trim();
  const razonSocial = document.getElementById('scRazonSocial')?.value.trim();
  const rut         = document.getElementById('scRut')?.value.trim();
  const rubro       = document.getElementById('scRubro')?.value;
  const giro        = document.getElementById('scGiro')?.value.trim();
  const contacto    = document.getElementById('scContacto')?.value.trim();
  const direccion   = document.getElementById('scDireccion')?.value.trim();
  const ciudad      = document.getElementById('scCiudad')?.value.trim();

  if (!nombre) { showNotif('error', 'El nombre del sub-cliente es obligatorio.'); return; }

  const parent = DATA.clientes.find(c => c.id === parentId);
  if (!parent) return;
  if (!parent.subClientes) parent.subClientes = [];

  if (editingScId) {
    const sc = parent.subClientes.find(x => x.id === editingScId);
    if (sc) Object.assign(sc, { nombre, razonSocial, rut, rubro, giro, contacto, direccion, ciudad });
    logAction('subclient_updated', { parentId, scId: editingScId, nombre });
    showNotif('success', `Sub-cliente "${nombre}" actualizado.`);
  } else {
    const newScId = 'sc-' + Date.now().toString(36);
    parent.subClientes.push({
      id: newScId, nombre, razonSocial, rut, rubro, giro,
      contacto, direccion, ciudad,
      productosAsignados: parent.productosAsignados ? [...parent.productosAsignados] : [],
    });
    logAction('subclient_created', { parentId, nombre });
    showNotif('success', `Sub-cliente "${nombre}" creado.`);
  }

  cerrarFormSubCliente();
}

function eliminarSubCliente(parentId, scId) {
  const parent = DATA.clientes.find(c => c.id === parentId);
  if (!parent || !parent.subClientes) return;
  const sc = parent.subClientes.find(x => x.id === scId);
  if (!sc) return;
  parent.subClientes = parent.subClientes.filter(x => x.id !== scId);
  logAction('subclient_deleted', { parentId, scId, nombre: sc.nombre });
  showNotif('success', `Sub-cliente "${sc.nombre}" eliminado.`);
}

function toggleClienteActivo(clienteId, activo) {
  const c = DATA.clientes.find(x => x.id === clienteId);
  if (!c) return;
  c.activo = activo;
  logAction(activo ? 'client_activated' : 'client_deactivated', { clienteId, nombre: c.nombre });
  showNotif('success', `Cliente "${c.nombre}" ${activo ? 'activado' : 'desactivado'}.`);
}

// ============================================================
// ACCIONES: ASIGNACIÓN DE PRODUCTOS
// ============================================================

/** Toggles a product in the assigned list and re-renders the assignment panel */
function toggleProductAssignment(type, clienteId, scId, productId) {
  let target;
  if (type === 'subclient') {
    const parent = DATA.clientes.find(c => c.id === clienteId);
    target = parent?.subClientes?.find(x => x.id === scId);
  } else {
    target = DATA.clientes.find(x => x.id === clienteId);
  }
  if (!target) return;
  if (!target.productosAsignados) target.productosAsignados = [];
  const idx = target.productosAsignados.indexOf(productId);
  if (idx >= 0) {
    target.productosAsignados.splice(idx, 1);
  } else {
    target.productosAsignados.push(productId);
  }
  render();
}

/** Sets or removes a special price for a product/client combination */
function setSpecialPrice(clienteId, productId, value) {
  const v = parseInt(value);
  const existing = DATA.precios.findIndex(x => x.cId === clienteId && x.pId === productId);
  if (!v || v <= 0 || isNaN(v)) {
    if (existing >= 0) DATA.precios.splice(existing, 1);
  } else {
    if (existing >= 0) {
      DATA.precios[existing].v = v;
    } else {
      DATA.precios.push({ cId: clienteId, pId: productId, v });
    }
  }
  // No re-render needed — input keeps value
}

function asignarTodosProductosToggle(type, clienteId, scId) {
  const allIds = DATA.productos.filter(p => p.activo).map(p => p.id);
  let target;
  if (type === 'subclient') {
    const parent = DATA.clientes.find(c => c.id === clienteId);
    target = parent?.subClientes?.find(x => x.id === scId);
  } else {
    target = DATA.clientes.find(x => x.id === clienteId);
  }
  if (target) { target.productosAsignados = [...allIds]; render(); }
}

function quitarTodosProductosToggle(type, clienteId, scId) {
  let target;
  if (type === 'subclient') {
    const parent = DATA.clientes.find(c => c.id === clienteId);
    target = parent?.subClientes?.find(x => x.id === scId);
  } else {
    target = DATA.clientes.find(x => x.id === clienteId);
  }
  if (target) { target.productosAsignados = []; render(); }
}

// Keep old names as aliases in case they're called elsewhere
function asignarTodosProductos(type, clienteId, scId) { asignarTodosProductosToggle(type, clienteId, scId); }
function quitarTodosProductos(type, clienteId, scId) { quitarTodosProductosToggle(type, clienteId, scId); }

function guardarAsignacionProductos(type, clienteId, scId) {
  // No-op: assignments are saved immediately via toggleProductAssignment
  cerrarAsignacionProductos();
}
