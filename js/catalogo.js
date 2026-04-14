// ============================================================
// CATÁLOGO — Gestión de productos (solo gerente)
// ============================================================

function renderCatalogo() {
  const { preciosClienteId } = STATE.catMgmt;
  const modoPrecios = !!preciosClienteId;

  return `
  <div class="page-header">
    <h2>Catálogo de Productos</h2>
    <p>Administra productos activos e inactivos. Configura precios especiales desde la sección Clientes.</p>
  </div>

  <!-- Tabs internos: Productos / Precios -->
  <div class="cat-mode-tabs" style="margin-bottom:24px">
    <button class="tab-btn ${!modoPrecios?'active':''}" onclick="STATE.catMgmt.preciosClienteId=null;render()">
      ${icon('tag')} Productos
    </button>
    <button class="tab-btn ${modoPrecios?'active':''}" onclick="STATE.catMgmt.preciosClienteId=STATE.catMgmt.preciosClienteId||DATA.clientes[0]?.id;render()">
      ${icon('receipt')} Precios por cliente
    </button>
  </div>

  ${modoPrecios ? renderGestionPrecios() : renderGestionProductos()}`;
}

// ────────────────────────────────────────────────────────────
// VISTA: Tabla de productos (estilo redesign.html)
// ────────────────────────────────────────────────────────────
function renderGestionProductos() {
  const tipos = [...new Set(DATA.productos.map(p => p.tipo))];
  const { productFilter, productCatFilter, showProductForm, editingProductId } = STATE;

  let filtered = [...DATA.productos];
  if (productFilter !== 'all') filtered = filtered.filter(p => p.tipo === productFilter);
  if (productCatFilter !== 'all') filtered = filtered.filter(p => p.categoria === productCatFilter);
  filtered.sort((a,b) => {
    if (a.activo !== false && b.activo === false) return -1;
    if (a.activo === false && b.activo !== false) return 1;
    if (a.tipo < b.tipo) return -1;
    if (a.tipo > b.tipo) return 1;
    return a.nombre.localeCompare(b.nombre);
  });

  const activos   = DATA.productos.filter(p => p.activo !== false).length;
  const inactivos = DATA.productos.length - activos;

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="abrirFormProducto(null)">
        ${icon('plus')} Nuevo Producto
      </button>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:12px;color:var(--text-light)">Tipo:</span>
        <select class="form-select" style="width:auto;padding:6px 12px;font-size:12px" onchange="STATE.productFilter=this.value;render()">
          <option value="all" ${productFilter==='all'?'selected':''}>Todos</option>
          ${tipos.map(t => `<option value="${t}" ${productFilter===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:12px;color:var(--text-light)">Categoría:</span>
        <select class="form-select" style="width:auto;padding:6px 12px;font-size:12px" onchange="STATE.productCatFilter=this.value;render()">
          <option value="all" ${productCatFilter==='all'?'selected':''}>Todas</option>
          <option value="masa_madre" ${productCatFilter==='masa_madre'?'selected':''}>Masa Madre</option>
          <option value="pan_tradicional" ${productCatFilter==='pan_tradicional'?'selected':''}>Pan Tradicional</option>
        </select>
      </div>
    </div>
    <div style="font-size:12px;color:var(--text-light)">${activos} activos · ${inactivos} inactivos · ${DATA.productos.length} total</div>
  </div>

  ${showProductForm ? renderFormProducto(editingProductId) : ''}

  <div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow);overflow-x:auto">
    <table class="fact-table">
      <thead><tr>
        <th>SKU</th>
        <th>Producto</th>
        <th>Tipo</th>
        <th>Categoría</th>
        <th>Unidad</th>
        <th style="text-align:right">Precio Lista</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr></thead>
      <tbody>
        ${filtered.map(p => {
          const inactivo = p.activo === false;
          return `<tr style="${inactivo?'opacity:0.55':''}">
            <td style="font-family:monospace;font-size:11px;color:var(--text-light);white-space:nowrap">${p.sku||'—'}</td>
            <td style="font-weight:600;color:var(--text)">${escapeHtml(p.nombre)}</td>
            <td style="font-weight:400;color:var(--text-mid)">${escapeHtml(p.tipo)}</td>
            <td><span class="cat-badge cat-${p.categoria}">${p.categoria==='pan_tradicional'?'Pan Tradicional':'Masa Madre'}</span></td>
            <td style="font-weight:400;color:var(--text-light)">${escapeHtml(p.unidad)}</td>
            <td style="text-align:right;font-family:var(--font-display);font-size:16px;font-weight:700">${fmt(p.precioLista||0)}</td>
            <td>
              <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;
                background:${inactivo?'var(--status-rejected-bg)':'var(--status-approved-bg)'};
                color:${inactivo?'var(--status-rejected)':'var(--status-approved)'}">
                ${inactivo ? icon('xCircle') : icon('checkCircle')} ${inactivo ? 'Inactivo' : 'Activo'}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-ghost btn-sm" onclick="abrirFormProducto('${p.id}')" title="Editar">${icon('edit')}</button>
                ${inactivo
                  ? `<button class="btn btn-ghost btn-sm" onclick="toggleProducto('${p.id}',true)" title="Activar" style="color:var(--status-approved)">${icon('checkCircle')}</button>`
                  : `<button class="btn btn-ghost btn-sm" onclick="toggleProducto('${p.id}',false)" title="Desactivar" style="color:var(--status-rejected)">${icon('xCircle')}</button>`
                }
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

// ────────────────────────────────────────────────────────────
// FORM: Crear / Editar producto
// ────────────────────────────────────────────────────────────
function renderFormProducto(editingId) {
  const prod = editingId ? DATA.productos.find(p => p.id === editingId) : null;
  const isEditing = !!prod;
  const tipos = [...new Set(DATA.productos.map(p => p.tipo))];

  return `
  <div class="card" style="padding:24px;margin-bottom:24px;border:2px solid var(--primary-light)">
    <h3 style="margin-bottom:4px">${isEditing ? `Editar producto: ${prod.nombre}` : 'Nuevo Producto'}</h3>
    ${isEditing && prod.sku
      ? `<div style="margin-bottom:16px;padding:6px 12px;background:var(--surface2);border-radius:6px;display:inline-flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:var(--text-light)">SKU:</span>
          <span style="font-family:monospace;font-weight:700;font-size:14px;color:var(--primary)">${prod.sku}</span>
        </div>`
      : `<div style="margin-bottom:16px;font-size:12px;color:var(--text-light)">${icon('info')} El SKU se generará automáticamente.</div>`
    }
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="form-input" type="text" id="prodNombre" placeholder="Ej: Hogaza Centeno" value="${escapeHtml(prod?.nombre||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Tipo * <span style="font-weight:400;font-size:11px;color:var(--text-light)">(selecciona o escribe)</span></label>
        <input class="form-input" type="text" id="prodTipo" placeholder="Ej: Hogaza, Pita…" value="${escapeHtml(prod?.tipo||'')}" list="tiposList">
        <datalist id="tiposList">${tipos.map(t=>`<option value="${escapeHtml(t)}">`).join('')}</datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <select class="form-select" id="prodCategoria">
          <option value="masa_madre" ${(!prod||prod.categoria==='masa_madre')?'selected':''}>Masa Madre</option>
          <option value="pan_tradicional" ${prod?.categoria==='pan_tradicional'?'selected':''}>Pan Tradicional</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Unidad de venta</label>
        <select class="form-select" id="prodUnidad">
          <option value="unidad" ${(!prod||prod.unidad==='unidad')?'selected':''}>Unidad</option>
          <option value="kg" ${prod?.unidad==='kg'?'selected':''}>Kilogramo</option>
          <option value="docena" ${prod?.unidad==='docena'?'selected':''}>Docena</option>
          <option value="bandeja" ${prod?.unidad==='bandeja'?'selected':''}>Bandeja</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Precio de lista (CLP) *</label>
        <input class="form-input" type="number" id="prodPrecio" placeholder="Ej: 3200" min="0" value="${prod?.precioLista||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <input class="form-input" type="text" id="prodDesc" placeholder="Breve descripción" value="${escapeHtml(prod?.descripcion||'')}">
      </div>
      ${isEditing ? `
      <div class="form-group">
        <label class="form-label">Estado</label>
        <select class="form-select" id="prodActivo">
          <option value="true"  ${prod.activo!==false?'selected':''}>Activo</option>
          <option value="false" ${prod.activo===false?'selected':''}>Inactivo</option>
        </select>
      </div>` : ''}
    </div>

    <!-- Corte de pedidos -->
    <div style="margin-top:20px;padding:16px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border-light)">
      <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em">
        ${icon('clock')} Corte de pedidos (opcional)
      </div>
      <p style="font-size:12px;color:var(--text-light);margin-bottom:12px">
        Define las horas de anticipación y la hora límite para aceptar pedidos de este SKU. El producto se bloquea si el cliente no pide con la anticipación requerida antes de la fecha de despacho.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group">
          <label class="form-label">Anticipación requerida</label>
          <select class="form-select" id="prodCorteAnticipacion">
            <option value="" ${!prod?.corteAnticipacion ? 'selected' : ''}>Sin corte</option>
            <option value="24" ${prod?.corteAnticipacion === 24 ? 'selected' : ''}>24 horas</option>
            <option value="48" ${prod?.corteAnticipacion === 48 ? 'selected' : ''}>48 horas</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Hora de corte</label>
          <input class="form-input" type="time" id="prodCorteHora" value="${prod?.corteHora || '07:00'}">
        </div>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-top:16px">
      <button class="btn btn-primary btn-sm" onclick="guardarProducto('${editingId||''}')">
        ${icon(isEditing?'check':'plus')} ${isEditing?'Guardar Cambios':'Crear Producto'}
      </button>
      <button class="btn btn-ghost btn-sm" onclick="cerrarFormProducto()">Cancelar</button>
    </div>
  </div>`;
}

// ────────────────────────────────────────────────────────────
// VISTA: Precios por cliente
// ────────────────────────────────────────────────────────────
function renderGestionPrecios() {
  const { preciosClienteId } = STATE.catMgmt;
  const clienteActivo = getCliente(preciosClienteId) || DATA.clientes[0];
  if (!clienteActivo) return '<p>No hay clientes registrados.</p>';

  const tipos = [...new Set(DATA.productos.map(p => p.tipo))];

  return `
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap">
    <label class="form-label" style="margin:0;white-space:nowrap">Cliente:</label>
    <select class="form-select" style="max-width:280px"
      onchange="STATE.catMgmt.preciosClienteId=this.value;render()">
      ${DATA.clientes.map(c =>
        `<option value="${c.id}" ${c.id===clienteActivo.id?'selected':''}>${escapeHtml(c.nombre)} — ${escapeHtml(c.ciudad||'')}</option>`
      ).join('')}
    </select>
    <button class="btn btn-primary btn-sm" onclick="savePreciosCliente('${clienteActivo.id}')">${icon('check')} Guardar precios</button>
    <span style="font-size:12px;color:var(--text-light)">* Precio 0 = sin precio especial (usa precio de lista)</span>
  </div>

  ${tipos.map(tipo => {
    const prods = DATA.productos.filter(p => p.tipo === tipo);
    return `
    <div class="dispatch-group" style="margin-bottom:20px">
      <div class="product-plan-row header">
        <span>${tipo}</span>
        <span>Categoría</span>
        <span>Precio ${escapeHtml(clienteActivo.nombre)}</span>
        <span style="color:var(--text-light);font-weight:400">Precio de Lista</span>
      </div>
      ${prods.map(prod => {
        const precioCliente = getPrecio(clienteActivo.id, prod.id);
        const inactivo = prod.activo === false;
        return `<div class="product-plan-row ${inactivo?'cat-prod-inactive':''}">
          <span style="font-weight:600${inactivo?';opacity:.5':''}">
            ${escapeHtml(prod.nombre)}${inactivo?' <em style="font-size:11px">(inactivo)</em>':''}
          </span>
          <span><span class="cat-badge cat-${prod.categoria}">${prod.categoria==='pan_tradicional'?'Pan Tradicional':'Masa Madre'}</span></span>
          <span>
            <div class="precio-input-wrap">
              <span class="precio-currency">$</span>
              <input class="precio-input" type="number" min="0" step="50"
                id="precio-${clienteActivo.id}-${prod.id}"
                value="${precioCliente}"
                onchange="setSpecialPrice('${clienteActivo.id}','${prod.id}',this.value)">
            </div>
          </span>
          <span style="font-size:13px;color:var(--text-light)">${prod.precioLista ? fmt(prod.precioLista) : '—'}</span>
        </div>`;
      }).join('')}
    </div>`;
  }).join('')}

  <div style="text-align:right;margin-top:8px">
    <button class="btn btn-primary" onclick="savePreciosCliente('${clienteActivo.id}')">${icon('check')} Guardar precios de ${escapeHtml(clienteActivo.nombre)}</button>
  </div>`;
}

// ────────────────────────────────────────────────────────────
// ACCIONES
// ────────────────────────────────────────────────────────────
function abrirFormProducto(editingId) {
  STATE.showProductForm = true;
  STATE.editingProductId = editingId || null;
  render();
}

function cerrarFormProducto() {
  STATE.showProductForm = false;
  STATE.editingProductId = null;
  render();
}

function guardarProducto(editingId) {
  const nombre     = document.getElementById('prodNombre')?.value.trim();
  const tipo       = document.getElementById('prodTipo')?.value.trim();
  const categoria  = document.getElementById('prodCategoria')?.value;
  const unidad     = document.getElementById('prodUnidad')?.value;
  const precioLista= parseInt(document.getElementById('prodPrecio')?.value) || 0;
  const descripcion= document.getElementById('prodDesc')?.value.trim() || '';
  const corteAnticipacionRaw = document.getElementById('prodCorteAnticipacion')?.value;
  const corteHora  = document.getElementById('prodCorteHora')?.value || '07:00';
  const corteAnticipacion = corteAnticipacionRaw !== '' && corteAnticipacionRaw !== undefined ? parseInt(corteAnticipacionRaw) : null;

  if (!nombre) { showNotif('error', 'El nombre del producto es obligatorio.'); return; }
  if (!tipo)   { showNotif('error', 'El tipo de producto es obligatorio.'); return; }
  if (precioLista <= 0) { showNotif('error', 'El precio de lista debe ser mayor a cero.'); return; }

  if (editingId) {
    const prod = DATA.productos.find(p => p.id === editingId);
    if (prod) {
      prod.nombre = nombre; prod.tipo = tipo; prod.categoria = categoria;
      prod.unidad = unidad; prod.precioLista = precioLista; prod.descripcion = descripcion;
      prod.corteAnticipacion = corteAnticipacion;
      prod.corteHora = corteAnticipacion !== null ? corteHora : null;
      const activoVal = document.getElementById('prodActivo')?.value;
      if (activoVal !== undefined) prod.activo = activoVal === 'true';
    }
    logAction('product_updated', { productId: editingId, nombre });
    showNotif('success', `Producto "${nombre}" actualizado.`);
  } else {
    if (DATA.productos.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
      showNotif('error', `Ya existe un producto con el nombre "${nombre}".`);
      return;
    }
    const newId = 'p_' + Date.now().toString(36);
    const sku   = generarSKU(categoria, tipo);
    DATA.productos.push({ id: newId, sku, nombre, tipo, categoria, unidad, precioLista, descripcion, activo: true,
      corteAnticipacion: corteAnticipacion, corteHora: corteAnticipacion !== null ? corteHora : null });
    // Precio de lista como precio especial para todos los clientes existentes
    DATA.clientes.forEach(c => DATA.precios.push({ cId: c.id, pId: newId, v: precioLista }));
    logAction('product_created', { nombre, sku });
    showNotif('success', `Producto "${nombre}" creado · SKU: ${sku} · ${fmt(precioLista)}.`);
  }

  cerrarFormProducto();
}

function toggleProducto(id, activate) {
  const prod = DATA.productos.find(p => p.id === id);
  if (!prod) return;
  prod.activo = activate;
  logAction(activate ? 'product_activated' : 'product_deactivated', { productId: id });
  showNotif(activate ? 'success' : 'error',
    activate ? `"${prod.nombre}" activado.` : `"${prod.nombre}" desactivado.`);
  render();
}

/** Genera un SKU automático basado en categoría y tipo */
function generarSKU(categoria, tipo) {
  const catCode  = categoria === 'pan_tradicional' ? 'PT' : 'MM';
  const tipoCode = tipo.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
  const existing = DATA.productos.filter(p => p.sku && p.sku.startsWith(catCode + '-' + tipoCode + '-'));
  const next     = String(existing.length + 1).padStart(3, '0');
  return `${catCode}-${tipoCode}-${next}`;
}

// Keep legacy alias so old onclick="doToggleProduct" in produccion still works
function doToggleProduct(pId) { toggleProducto(pId, !(DATA.productos.find(p=>p.id===pId)?.activo !== false)); render(); }
