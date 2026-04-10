// ============================================================
// CLIENTE
// ============================================================
function renderCliente() {
  const tabs = ['Nuevo Pedido','Mis Pedidos'];
  const cliente = getCliente(STATE.user.clienteId);
  const misPedidos = PEDIDOS.filter(p => p.clienteId === STATE.user.clienteId).sort((a,b) => b.id.localeCompare(a.id));
  const pendientes = misPedidos.filter(p => ['enviado'].includes(p.status));

  return `
  <div class="page-header">
    <h2>Bienvenido, ${cliente.nombre}</h2>
    <p>Realiza tus pedidos y consulta el estado de cada despacho.</p>
  </div>
  <div class="tabs">
    ${tabs.map((t,i) => `<button class="tab-btn ${STATE.tab===i?'active':''}" onclick="setTab(${i})">${t}${i===1&&pendientes.length>0?`<span class="tab-badge">${pendientes.length}</span>`:''}</button>`).join('')}
  </div>
  ${STATE.tab === 0 ? renderNuevoPedido() : renderMisPedidos(misPedidos)}`;
}

function renderNuevoPedido() {
  const cliente = getCliente(STATE.user.clienteId);
  const esDistribuidor = cliente?.tipo === 'distribuidor';
  const subClientes = esDistribuidor ? (cliente.subClientes || []) : [];

  // Si es distribuidor y no hay selección aún, pre-seleccionar "propio" (el mismo distribuidor)
  if (esDistribuidor && !STATE.draftSubClienteId) {
    STATE.draftSubClienteId = '__propio__';
  }

  // Determinar de quién son los productos
  // '__propio__' = pedido para el mismo distribuidor; 'sc-xxx' = pedido para sub-cliente
  const scActivo = esDistribuidor && STATE.draftSubClienteId !== '__propio__'
    ? subClientes.find(sc => sc.id === STATE.draftSubClienteId)
    : null;
  const productos = scActivo
    ? DATA.productos.filter(p => p.activo && (scActivo.productosAsignados || []).includes(p.id))
    : getProductosCliente(STATE.user.clienteId);

  // Group by tipo for display
  const tipos = [...new Set(productos.map(p => p.tipo))];
  const despachos = getNextDespachos();
  const draftItems = Object.entries(STATE.draft).filter(([,q]) => q > 0);
  const total = draftItems.reduce((s,[id,q]) => s + q * getPrecio(STATE.user.clienteId, id), 0);

  if (!STATE.draftFecha && despachos.length) STATE.draftFecha = despachos[0];

  const productGrid = (prods) => prods.map(p => {
    const price = getPrecio(STATE.user.clienteId, p.id);
    const qty = STATE.draft[p.id] || 0;
    // data-search y data-cat permiten filtrar el DOM sin re-render (evita perder foco)
    return `
    <div class="product-card ${qty>0?'has-qty':''}" id="card-${p.id}"
      data-search="${p.nombre.toLowerCase()} ${p.tipo.toLowerCase()} ${p.descripcion.toLowerCase()}"
      data-cat="${p.categoria}">
      <div class="product-card-header">
        <div>
          <div class="product-name">${p.nombre}</div>
          <div class="product-unit">${p.unidad}</div>
        </div>
        <span class="cat-badge cat-${p.categoria}">${p.categoria==='brioche'?'🧈 Brioche':'🌾 Masa Madre'}</span>
      </div>
      <div class="product-desc">${p.descripcion}</div>
      <div class="flex-between">
        <div class="product-price">${fmt(price)} <span>/ ${p.unidad}</span></div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty('${p.id}',-1)">−</button>
          <input class="qty-input" type="number" min="0" value="${qty}" onchange="setQty('${p.id}',this.value)" id="qty-${p.id}">
          <button class="qty-btn" onclick="changeQty('${p.id}',1)">+</button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
  ${esDistribuidor && subClientes.length ? `
  <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);padding:16px 20px;margin-bottom:20px">
    <div style="font-weight:600;font-size:12px;color:var(--text-mid);margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em">
      ${icon('users')} Selecciona el sub-cliente para este pedido
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
      <button
        class="btn ${STATE.draftSubClienteId === '__propio__' ? 'btn-primary' : 'btn-ghost'}"
        onclick="seleccionarSubCliente('__propio__')"
        style="font-size:13px;padding:8px 18px">
        ${icon('home','icon-xs')} ${escapeHtml(cliente.nombre)}
      </button>
      <div style="width:1px;height:28px;background:var(--border-light)"></div>
      ${subClientes.map(sc => `
        <button
          class="btn ${STATE.draftSubClienteId === sc.id ? 'btn-primary' : 'btn-ghost'}"
          onclick="seleccionarSubCliente('${sc.id}')"
          style="font-size:13px;padding:8px 18px">
          ${escapeHtml(sc.nombre)}
        </button>
      `).join('')}
    </div>
    ${scActivo ? `
    <div style="margin-top:12px;padding:10px 14px;background:var(--primary-light);border-radius:var(--radius-xs);font-size:12px;color:var(--text-mid);display:flex;gap:24px;flex-wrap:wrap">
      <span>${icon('fileText','icon-xs')} RUT: <strong>${scActivo.rut||'—'}</strong></span>
      <span>${icon('mapPin','icon-xs')} ${scActivo.ciudad||'—'}</span>
      <span>${icon('users','icon-xs')} ${scActivo.contacto||'—'}</span>
      ${scActivo.razonSocial ? `<span style="color:var(--text-light)">${scActivo.razonSocial}</span>` : ''}
    </div>` : `
    <div style="margin-top:12px;padding:10px 14px;background:var(--primary-light);border-radius:var(--radius-xs);font-size:12px;color:var(--text-mid)">
      ${icon('home','icon-xs')} Pedido directo para <strong>${escapeHtml(cliente.nombre)}</strong> — catálogo y precios propios del distribuidor
    </div>`}
  </div>` : ''}

  <div class="order-panel-wrap">
    <div>
      <div class="alert-info alert-box">
        ${icon('info')} <span>Los pedidos enviados antes del <strong>viernes</strong> se despachan el martes o jueves. Los enviados el <strong>lunes</strong> se despachan el miércoles o viernes.</span>
      </div>

      <!-- Barra de búsqueda y filtro de categoría -->
      <div class="catalog-filters">
        <div class="catalog-search-wrap">
          <span class="catalog-search-icon">${icon('search','icon-sm')}</span>
          <input class="catalog-search-input" type="text" placeholder="Buscar producto..."
            value="${escapeHtml(STATE.catalogSearch)}"
            oninput="filterCatalog(this.value, '${STATE.catalogCategory}')">
          ${STATE.catalogSearch ? `<button class="catalog-search-clear" onclick="filterCatalog('','${STATE.catalogCategory}')">✕</button>` : ''}
        </div>
        <div class="catalog-cat-btns">
          ${[['all','Todos'],['masa_madre','🌾 Masa Madre'],['brioche','🧈 Brioche']].map(([v,l]) =>
            `<button class="catalog-cat-btn ${STATE.catalogCategory===v?'active':''}"
              data-cat="${v}" onclick="filterCatalog('${escapeHtml(STATE.catalogSearch)}','${v}')">${l}</button>`
          ).join('')}
        </div>
      </div>

      <div id="productCatalog">
        ${tipos.map(tipo => {
          const prods = productos.filter(p => p.tipo === tipo);
          return `<div class="product-section" data-tipo="${tipo}">
            <p class="section-title">${tipo}</p>
            <div class="product-grid">${productGrid(prods)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="order-summary">
      <h3>Resumen del Pedido</h3>
      ${esDistribuidor ? `
      <div style="background:var(--primary-light);border-radius:var(--radius-xs);padding:10px 14px;margin-bottom:12px;font-size:13px">
        ${scActivo
          ? `${icon('users','icon-xs')} Para: <strong>${escapeHtml(scActivo.nombre)}</strong>
             <div style="font-size:11px;color:var(--text-light);margin-top:2px">${scActivo.razonSocial||''}</div>`
          : `${icon('home','icon-xs')} Para: <strong>${escapeHtml(cliente.nombre)}</strong>
             <div style="font-size:11px;color:var(--text-light);margin-top:2px">Pedido propio del distribuidor</div>`
        }
      </div>` : ''}
      ${draftItems.length === 0 ? `
        <div class="empty-summary">
          <span class="empty-icon">🛒</span>
          <p>Agrega productos para ver el resumen</p>
        </div>` : `
        <div class="summary-items">
          ${draftItems.map(([id,q]) => {
            const prod = getProducto(id);
            const price = getPrecio(STATE.user.clienteId, id);
            return `<div class="summary-item">
              <div><div class="item-name">${prod.nombre}</div><div class="item-qty">${q} ${prod.unidad}</div></div>
              <div class="item-price">${fmt(q*price)}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="summary-total">
          <span class="total-label">Total</span>
          <span class="total-amount">${fmt(total)}</span>
        </div>`}

      <div class="form-group mt-4">
        <label class="form-label">Fecha de despacho solicitada</label>
        <select class="form-select" id="draftFecha" onchange="STATE.draftFecha=this.value">
          ${despachos.map(d => `<option value="${d}" ${STATE.draftFecha===d?'selected':''}>${fmtDate(d)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Observaciones (opcional)</label>
        <textarea class="form-textarea" id="draftObs" placeholder="Ej: Entrega antes de las 8am…" onchange="STATE.draftObs=this.value">${STATE.draftObs}</textarea>
      </div>
      <button class="btn btn-primary btn-full" onclick="enviarPedido()" ${draftItems.length===0?'disabled style="opacity:.5;cursor:not-allowed"':''}>
        ${icon('send')} Enviar Pedido
      </button>
    </div>
  </div>`;
}

/** Renderiza la línea de tiempo de estados de un pedido */
function renderOrderTimeline(status) {
  const steps = [
    { key:'enviado',       label:'Enviado',    icn:'clock' },
    { key:'aprobado',      label:'Aprobado',   icn:'check' },
    { key:'en_produccion', label:'Producción', icn:'gear' },
    { key:'facturado',     label:'Facturado',  icn:'fileText' },
  ];
  const order = { enviado:0, aprobado:1, en_produccion:2, facturado:3, rechazado:-1 };
  const cur = order[status] ?? 0;

  if (status === 'rechazado') {
    return `<div class="order-timeline order-timeline--rejected">
      ${icon('xCircle')} <span>Pedido rechazado — contacta al gerente para más información.</span>
    </div>`;
  }
  return `
  <div class="order-timeline">
    ${steps.map((step, i) => `
      <div class="tl-step ${i < cur ? 'tl-done' : ''} ${i === cur ? 'tl-active' : ''}">
        <div class="tl-dot">${i < cur ? icon('check') : icon(step.icn)}</div>
        <div class="tl-label">${step.label}</div>
      </div>
      ${i < steps.length - 1 ? `<div class="tl-line ${i < cur ? 'tl-done' : ''}"></div>` : ''}
    `).join('')}
  </div>`;
}

function renderMisPedidos(pedidos) {
  if (!pedidos.length) return `<div class="empty-state"><div class="empty-state-icon">${ICON.clipboardList}</div><h3>Sin pedidos aún</h3><p>Tu historial de pedidos aparecerá aquí.</p></div>`;
  return `
  ${getMyNotifications().length > 0 ? `
  <div style="background:var(--status-approved-bg);border:1px solid var(--status-approved);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong style="color:var(--status-approved);">${icon('bell')} Notificaciones (${getMyNotifications().length})</strong>
      <button class="btn btn-ghost btn-sm" onclick="markAllNotificationsRead()">Marcar todas como leídas</button>
    </div>
    ${getMyNotifications().map(n => `
      <div style="background:white;padding:10px 14px;border-radius:6px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:13px;">${n.message}</span>
          <div style="font-size:11px;color:var(--text-light);margin-top:2px;">${new Date(n.timestamp).toLocaleString('es-CL')}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="markNotificationRead('${n.id}')" style="padding:4px 8px;font-size:11px;">✓</button>
      </div>
    `).join('')}
  </div>` : ''}
  <div class="order-list">
    ${pedidos.map(p => {
      const items = p.items.map(i => {
        const prod = getProducto(i.pId);
        return `<span class="item-pill">${prod?prod.nombre.split(' ').slice(0,2).join(' '):'?'} ×${i.qty}</span>`;
      }).join('');
      const sc = p.subClienteId ? (() => {
        const cli = getCliente(p.clienteId);
        return cli?.subClientes?.find(s => s.id === p.subClienteId);
      })() : null;
      return `<div class="order-card status-${p.status}" onclick="openModal('${p.id}')">
        <div class="order-card-header">
          <div class="order-card-meta">
            <span class="order-id">${p.id}</span>
            <span class="order-client">Pedido del ${fmtDate(p.fechaPedido)}${sc ? ` · <strong>${escapeHtml(sc.nombre)}</strong>` : ''}</span>
          </div>
          <span class="status-badge badge-${p.status}">${statusIcon(p.status)} ${statusLabel(p.status)}</span>
        </div>
        ${renderOrderTimeline(p.status)}
        <div class="order-items-preview">${items}</div>
        <div class="order-card-footer">
          <div class="order-total">${fmt(p.total)}</div>
          <div style="display:flex;gap:10px;align-items:center">
            <div class="dispatch-info">${icon('truck')} Despacho: ${fmtDate(p.fechaDespacho)}</div>
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();repetirPedido('${p.id}')">🔄 Repetir</button>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
