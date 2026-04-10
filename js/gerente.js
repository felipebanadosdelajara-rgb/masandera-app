// ============================================================
// GERENTE
// ============================================================
function renderGerente() {
  const porRevisar     = PEDIDOS.filter(p => p.status === 'enviado');
  const aprobados      = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  const facturados     = PEDIDOS.filter(p => p.status === 'facturado');
  const totalUnits     = porRevisar.reduce((s,p) => s + p.items.reduce((ss,i) => ss + i.qty, 0), 0);
  const totalFacturado = facturados.reduce((s,p) => s + p.total, 0);

  // Navegación solo visible en móvil (en desktop la maneja el sidebar de render.js)
  const mobileTabLabels = [
    `${icon('inbox')} Revisar`, `${icon('clipboardList')} Producción`, `${icon('history')} Historial`,
    `${icon('receipt')} Facturar`, `${icon('barChart')} Dashboard`, `${icon('users')} Usuarios`,
    `${icon('activity')} Actividad`, `${icon('tag')} Catálogo`, `${icon('building')} Clientes`
  ];

  return `
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon">${icon('inbox')}</div>
      <div class="stat-value">${porRevisar.length}</div>
      <div class="stat-label">Por revisar</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">${icon('gear')}</div>
      <div class="stat-value">${aprobados.length}</div>
      <div class="stat-label">En producción</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">${icon('package')}</div>
      <div class="stat-value">${totalUnits}</div>
      <div class="stat-label">Unidades pend.</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">${icon('receipt')}</div>
      <div class="stat-value" style="font-size:22px">${fmt(totalFacturado)}</div>
      <div class="stat-label">Total facturado</div>
    </div>
  </div>

  <!-- Tabs solo para móvil — en desktop el sidebar reemplaza esto -->
  <div class="tabs tabs--mobile-only">
    ${mobileTabLabels.map((t,i) => `
      <button class="tab-btn ${STATE.tab===i?'active':''}" onclick="setTab(${i})">
        ${t}${i===0&&porRevisar.length>0?`<span class="tab-badge">${porRevisar.length}</span>`:''}
      </button>`).join('')}
  </div>

  ${STATE.tab===0 ? renderRevisar(porRevisar)
  : STATE.tab===1 ? renderPlanProduccion()
  : STATE.tab===2 ? renderHistorial()
  : STATE.tab===3 ? renderFacturacion(facturados)
  : STATE.tab===4 ? renderDashboard()
  : STATE.tab===5 ? renderUsuarios()
  : STATE.tab===6 ? renderActivityLog()
  : STATE.tab===7 ? renderCatalogo()
  : renderClientes()}`;
}

function renderRevisar(pedidos) {
  if (!pedidos.length) return `<div class="empty-state"><div class="empty-state-icon">${ICON.checkCircle}</div><h3>Todo al día</h3><p>No hay pedidos pendientes de revisión.</p></div>`;
  return `
  <div class="order-list">
    ${pedidos.map(p => {
      const cliente = getCliente(p.clienteId);
      const items = p.items.map(i => {
        const prod = getProducto(i.pId);
        return `<span class="item-pill">${prod?prod.nombre.split(' ').slice(0,2).join(' '):'?'} ×${i.qty}</span>`;
      }).join('');
      const confirmingThis = STATE.confirmAction?.id === p.id && STATE.confirmAction?.type === 'reject';
      return `<div class="order-card status-${p.status}">
        <div class="order-card-header">
          <div class="order-card-meta">
            <span class="order-id">${p.id}</span>
            <span class="order-client">${cliente?cliente.nombre:'?'}</span>
            <span class="order-date">Pedido: ${fmtDate(p.fechaPedido)}</span>
          </div>
          <span class="status-badge badge-${p.status}">${statusIcon(p.status)} ${statusLabel(p.status)}</span>
        </div>
        <div class="order-items-preview">${items}</div>
        ${p.obs ? `<div class="order-obs">${icon('info')} ${escapeHtml(p.obs)}</div>` : ''}
        ${confirmingThis ? `
        <div class="confirm-inline">
          <span class="confirm-icon">${icon('info')}</span>
          <span class="confirm-text">¿Confirmar rechazo de <strong>${p.id}</strong>?</span>
          <input class="form-input confirm-reason" type="text" id="confirmReason_${p.id}"
            placeholder="Motivo del rechazo (opcional)"
            onkeydown="if(event.key==='Enter')executeConfirmAction('${p.id}')">
          <button class="btn btn-danger btn-sm" onclick="executeConfirmAction('${p.id}')">Sí, rechazar</button>
          <button class="btn btn-ghost btn-sm" onclick="cancelConfirmAction()">Cancelar</button>
        </div>` : ''}
        <div class="order-card-footer">
          <div class="order-total">${fmt(p.total)}</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <div class="dispatch-info">${icon('truck')} ${fmtDate(p.fechaDespacho)}</div>
            <button class="btn btn-success btn-sm" onclick="aprobarPedido('${p.id}')">${icon('check')} Aprobar</button>
            <button class="btn btn-ghost btn-sm" onclick="openModal('${p.id}')">${icon('eye')} Ver</button>
            <button class="btn btn-secondary btn-sm" onclick="startEditOrder('${p.id}')">${icon('edit')} Editar</button>
            ${confirmingThis
              ? `<button class="btn btn-danger btn-sm active-confirm" onclick="cancelConfirmAction()">${icon('x')} Cancelar</button>`
              : `<button class="btn btn-danger btn-sm" onclick="setConfirmAction('reject','${p.id}')">${icon('x')} Rechazar</button>`}
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderPlanProduccion() {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  if (!activos.length) return `<div class="empty-state"><span class="empty-icon">📋</span><h3>Sin pedidos aprobados</h3><p>Aprueba pedidos para generar el plan.</p></div>`;

  // Group by dispatch date
  const byDate = {};
  activos.forEach(p => {
    if (!byDate[p.fechaDespacho]) byDate[p.fechaDespacho] = [];
    byDate[p.fechaDespacho].push(p);
  });

  const dateKeys = Object.keys(byDate).sort();

  return `
  <div style="display:flex;justify-content:flex-end;gap:10px;margin-bottom:16px;">
    <button class="btn btn-ghost btn-sm" onclick="window.print()">${icon('printer')} Imprimir Plan</button>
    ${dateKeys.map(f => `<button class="btn btn-primary btn-sm" onclick="generarPDFProduccion('${f}')">${icon('download')} PDF ${fmtDate(f)}</button>`).join("")}
  </div>
  ${dateKeys.map(fecha => {
    const pedidosDelDia = byDate[fecha];
    // Consolidate by product
    const consolidated = {};
    pedidosDelDia.forEach(p => {
      p.items.forEach(item => {
        if (!consolidated[item.pId]) consolidated[item.pId] = { total: 0, clientes: [] };
        consolidated[item.pId].total += item.qty;
        const c = getCliente(p.clienteId);
        consolidated[item.pId].clientes.push(`${c?c.nombre:'?'} ×${item.qty}`);
      });
    });
    const prodIds = Object.keys(consolidated);
    const totalUds = prodIds.reduce((s,id) => s + consolidated[id].total, 0);

    return `<div class="dispatch-group">
      <div class="dispatch-group-header">
        <div>
          <div class="dispatch-day">Despacho ${fmtDate(fecha)}</div>
          <div class="dispatch-date-info">${pedidosDelDia.length} pedido(s) — ${totalUds} unidades totales</div>
        </div>
        <span class="status-badge badge-aprobado">✅ Listo para Producción</span>
      </div>
      <div class="product-plan-row header">
        <span>Producto</span>
        <span>Categoría</span>
        <span>Unidades</span>
        <span class="col-total">Clientes</span>
      </div>
      ${prodIds.map(pId => {
        const prod = getProducto(pId);
        const data = consolidated[pId];
        return `<div class="product-plan-row">
          <span style="font-weight:600">${prod?prod.nombre:'?'}</span>
          <span><span class="cat-badge cat-${prod?prod.categoria:''}">${prod&&prod.categoria==='brioche'?'Brioche':'Masa Madre'}</span></span>
          <span class="product-qty-big">${data.total}</span>
          <span class="text-sm text-muted col-total">${data.clientes.join(', ')}</span>
        </div>`;
      }).join('')}
    </div>`;
  }).join('')}`;
}

function renderUsuarios() {
  return `
  <div class="page-header">
    <h2>Gestión de Usuarios</h2>
    <p>Administra los accesos al sistema.</p>
  </div>

  <div style="margin-bottom:24px">
    <button class="btn btn-primary btn-sm" onclick="STATE.showCreateUser=true;render();">${icon('userPlus')} Crear Usuario</button>
  </div>

  ${STATE.showCreateUser ? renderCreateUserForm() : ''}

  <div class="dispatch-group">
    <div class="product-plan-row header">
      <span>Nombre</span><span>Correo</span><span>Rol</span><span>Estado</span><span>Acciones</span>
    </div>
    ${DATA.usuarios.map(u => `
      <div class="product-plan-row">
        <span style="font-weight:700">${u.nombre}</span>
        <span class="text-sm">${u.email}</span>
        <span><span class="status-badge role-${u.rol}">${u.rol === 'gerente' ? 'Gerente' : u.rol === 'produccion' ? 'Producción' : u.rol === 'facturacion' ? 'Facturación' : 'Cliente'}</span></span>
        <span><span class="status-badge ${u.activo !== false ? 'status-aprobado' : 'status-rechazado'}">${u.activo !== false ? 'Activo' : 'Inactivo'}</span></span>
        <span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          ${u.id !== STATE.user.id ? (u.activo !== false
            ? (STATE.confirmAction?.id === u.id && STATE.confirmAction?.type === 'deactivate'
                ? `<span class="confirm-inline-sm">
                    ⚠️ ¿Desactivar?
                    <button class="btn btn-danger btn-sm" onclick="executeConfirmAction('${u.id}')">Sí</button>
                    <button class="btn btn-ghost btn-sm" onclick="cancelConfirmAction()">No</button>
                   </span>`
                : `<button class="btn btn-danger btn-sm" onclick="setConfirmAction('deactivate','${u.id}')">Desactivar</button>`)
            : `<button class="btn btn-success btn-sm" onclick="activateUser('${u.id}')">Activar</button>`)
          : '<span class="text-sm text-muted">Tú</span>'}
          <button class="btn btn-ghost btn-sm" onclick="promptResetPassword('${u.id}')" title="Cambiar contraseña">${icon('key')}</button>
        </span>
      </div>
    `).join('')}
  </div>`;
}

function renderCreateUserForm() {
  return `
  <div class="card" style="padding:24px;margin-bottom:24px;border:2px solid var(--primary-light);">
    <h3 style="margin-bottom:16px;">Crear Nuevo Usuario</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="form-group">
        <label class="form-label">Nombre completo</label>
        <input class="form-input" type="text" id="newUserNombre" placeholder="Nombre del usuario">
      </div>
      <div class="form-group">
        <label class="form-label">Correo electrónico</label>
        <input class="form-input" type="email" id="newUserEmail" placeholder="correo@ejemplo.cl">
      </div>
      <div class="form-group">
        <label class="form-label">Contraseña (mín. 8 caracteres)</label>
        <input class="form-input" type="password" id="newUserPass" placeholder="••••••••">
      </div>
      <div class="form-group">
        <label class="form-label">Rol</label>
        <select class="form-select" id="newUserRol" onchange="document.getElementById('newUserClienteWrap').style.display=this.value==='cliente'?'block':'none'">
          <option value="">Seleccionar rol...</option>
          <option value="gerente">Gerente</option>
          <option value="produccion">Encargado de Producción</option>
          <option value="facturacion">Facturación</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>
      <div class="form-group" id="newUserClienteWrap" style="display:none">
        <label class="form-label">Cliente asociado</label>
        <select class="form-select" id="newUserCliente">
          <option value="">Seleccionar cliente...</option>
          ${DATA.clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;">
      <button class="btn btn-primary btn-sm" onclick="doCreateUser()">Crear Usuario</button>
      <button class="btn btn-ghost btn-sm" onclick="STATE.showCreateUser=false;render();">Cancelar</button>
    </div>
  </div>`;
}

function renderActivityLog() {
  return `
  <div class="page-header">
    <h2>Registro de Actividad</h2>
    <p>Últimas acciones realizadas en el sistema.</p>
  </div>
  ${AUDIT_LOG.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">${ICON.activity}</div><h3>Sin actividad registrada</h3><p>Las acciones aparecerán aquí.</p></div>` : `
  <div class="dispatch-group">
    <div class="product-plan-row header">
      <span>Fecha</span><span>Usuario</span><span>Acción</span><span>Detalle</span>
    </div>
    ${AUDIT_LOG.slice(0, 50).map(e => `
      <div class="product-plan-row">
        <span class="text-sm">${new Date(e.timestamp).toLocaleString('es-CL')}</span>
        <span class="text-sm" style="font-weight:600">${e.userName}</span>
        <span class="text-sm">${formatAuditAction(e.action)}</span>
        <span class="text-sm text-muted">${formatAuditDetails(e)}</span>
      </div>
    `).join('')}
  </div>`}`;
}

function formatAuditAction(action) {
  const map = {
    'login': `${icon('key')} Inicio de sesión`,
    'logout': `${icon('logOut')} Cierre de sesión`,
    'order_created': `${icon('package')} Pedido creado`,
    'order_approved': `${icon('check')} Pedido aprobado`,
    'order_rejected': `${icon('x')} Pedido rechazado`,
    'order_edited': `${icon('edit')} Pedido editado`,
    'order_edited_approved': `${icon('checkCircle')} Editado y aprobado`,
    'order_invoiced': `${icon('receipt')} Pedido facturado`,
    'order_in_production': `${icon('gear')} En producción`,
    'user_created': `${icon('userPlus')} Usuario creado`,
    'user_deactivated': `${icon('xCircle')} Usuario desactivado`,
    'user_activated': `${icon('checkCircle')} Usuario activado`,
    'password_reset': `${icon('key')} Contraseña restablecida`,
    'client_created': `${icon('building')} Cliente creado`,
    'client_updated': `${icon('edit')} Cliente actualizado`,
    'product_created': `${icon('tag')} Producto creado`,
    'prices_updated': `${icon('receipt')} Precios actualizados`,
    'defontana_exported': `${icon('download')} Exportar Defontana`,
  };
  return map[action] || action;
}

function formatAuditDetails(entry) {
  const d = entry.details;
  if (d.orderId) return `Pedido: ${d.orderId}`;
  if (d.email && d.targetUser) return `${d.email}`;
  if (d.email) return d.email;
  return '';
}

function renderHistorial() {
  const { search, status, clienteId } = STATE.historialFilter;

  let todos = [...PEDIDOS].sort((a,b) => b.fechaPedido.localeCompare(a.fechaPedido) || b.id.localeCompare(a.id));

  if (search) {
    const q = search.toLowerCase();
    todos = todos.filter(p =>
      p.id.toLowerCase().includes(q) ||
      (getCliente(p.clienteId)?.nombre || '').toLowerCase().includes(q)
    );
  }
  if (status !== 'all') todos = todos.filter(p => p.status === status);
  if (clienteId !== 'all') todos = todos.filter(p => p.clienteId === clienteId);

  const hasFilters = search || status !== 'all' || clienteId !== 'all';

  return `
  <div class="hist-filter-bar">
    <div class="hist-search-wrap">
      <span class="hist-search-icon">${icon('search','icon-sm')}</span>
      <input class="hist-search-input" type="text" placeholder="Buscar por ID o cliente..."
        value="${escapeHtml(search)}"
        oninput="setHistorialFilter('search',this.value)">
      ${search ? `<button class="hist-search-clear" onclick="setHistorialFilter('search','')">✕</button>` : ''}
    </div>
    <select class="dash-filter-select" onchange="setHistorialFilter('status',this.value)">
      <option value="all"          ${status==='all'?'selected':''}>Todos los estados</option>
      <option value="enviado"      ${status==='enviado'?'selected':''}>Enviado</option>
      <option value="aprobado"     ${status==='aprobado'?'selected':''}>Aprobado</option>
      <option value="en_produccion"${status==='en_produccion'?'selected':''}>En Producción</option>
      <option value="rechazado"    ${status==='rechazado'?'selected':''}>Rechazado</option>
      <option value="facturado"    ${status==='facturado'?'selected':''}>Facturado</option>
    </select>
    <select class="dash-filter-select" onchange="setHistorialFilter('clienteId',this.value)">
      <option value="all" ${clienteId==='all'?'selected':''}>Todos los clientes</option>
      ${DATA.clientes.map(c => `<option value="${c.id}" ${clienteId===c.id?'selected':''}>${escapeHtml(c.nombre)}</option>`).join('')}
    </select>
    ${hasFilters ? `<button class="btn btn-ghost btn-sm" onclick="clearHistorialFilter()">✕ Limpiar</button>` : ''}
    <span class="hist-count">${todos.length} pedido${todos.length!==1?'s':''}</span>
  </div>

  ${!todos.length
    ? `<div class="empty-state"><div class="empty-state-icon">${ICON.search}</div><h3>Sin resultados</h3><p>Ajusta los filtros para encontrar pedidos.</p></div>`
    : `<div class="order-list">
    ${todos.map(p => {
      const cliente = getCliente(p.clienteId);
      const items = p.items.map(i => {
        const prod = getProducto(i.pId);
        return `<span class="item-pill">${prod?prod.nombre.split(' ').slice(0,2).join(' '):'?'} ×${i.qty}</span>`;
      }).join('');
      const puedeFacturar = ['aprobado','en_produccion'].includes(p.status);
      return `<div class="order-card status-${p.status}">
        <div class="order-card-header" onclick="openModal('${p.id}')" style="cursor:pointer">
          <div class="order-card-meta">
            <span class="order-id">${p.id}</span>
            <span class="order-client">${cliente?cliente.nombre:'?'}</span>
            <span class="order-date">Pedido: ${fmtDate(p.fechaPedido)}</span>
          </div>
          <span class="status-badge badge-${p.status}">${statusIcon(p.status)} ${statusLabel(p.status)}</span>
        </div>
        <div class="order-items-preview">${items}</div>
        <div class="order-card-footer">
          <div class="order-total">${fmt(p.total)}</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <div class="dispatch-info">${icon('truck')} ${fmtDate(p.fechaDespacho)}</div>
            ${p.status==='facturado' ? `<span style="font-size:13px;color:var(--text-light)">Fact: ${fmtDate(p.fechaFacturacion)}</span>` : ''}
            ${p.status === 'aprobado' ? `<button class="btn btn-sm btn-produccion"
              onclick="event.stopPropagation();marcarEnProduccion('${p.id}')">${icon('gear')} En Producción</button>` : ''}
            ${puedeFacturar ? `<button class="btn btn-sm btn-facturar"
              onclick="event.stopPropagation();marcarFacturado('${p.id}')">${icon('receipt')} Facturar</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`}`;
}

