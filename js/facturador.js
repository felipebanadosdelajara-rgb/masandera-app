// ============================================================
// FACTURADOR — Vista del rol facturacion
// ============================================================

function renderFacturador() {
  const pendientes = PEDIDOS.filter(p => ['aprobado', 'en_produccion'].includes(p.status));
  const facturados = PEDIDOS.filter(p => p.status === 'facturado');

  const tabs = [`${icon('receipt')} Pendientes de Facturar`, `${icon('history')} Historial Facturado`];

  return `
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon">${icon('receipt')}</div>
      <div class="stat-value">${pendientes.length}</div>
      <div class="stat-label">Por facturar</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">${icon('checkCircle')}</div>
      <div class="stat-value">${facturados.length}</div>
      <div class="stat-label">Facturados</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">${icon('barChart')}</div>
      <div class="stat-value" style="font-size:18px">${fmt(facturados.reduce((s,p)=>s+p.total,0))}</div>
      <div class="stat-label">Total facturado</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">${icon('clock')}</div>
      <div class="stat-value" style="font-size:18px">${fmt(pendientes.reduce((s,p)=>s+p.total,0))}</div>
      <div class="stat-label">Monto pendiente</div>
    </div>
  </div>

  <div class="tabs">
    ${tabs.map((t,i) => `
      <button class="tab-btn ${STATE.tab===i?'active':''}" onclick="setTab(${i})">
        ${t}${i===0&&pendientes.length>0?`<span class="tab-badge">${pendientes.length}</span>`:''}
      </button>`).join('')}
  </div>

  ${STATE.tab === 0 ? renderFacturadorPendientes(pendientes) : renderFacturadorHistorial(facturados)}`;
}

// ============================================================
// PENDIENTES DE FACTURAR
// ============================================================
function renderFacturadorPendientes(pendientes) {
  if (!pendientes.length) {
    return `<div class="empty-state">
      <div class="empty-state-icon">${ICON.checkCircle}</div>
      <h3>Sin pedidos pendientes</h3>
      <p>No hay pedidos aprobados o en producción esperando facturación.</p>
    </div>`;
  }

  return `
  <div class="page-header">
    <h2>Pendientes de Facturación</h2>
    <p>Ingresa el folio DTE y confirma la facturación de cada pedido. Los datos se exportan listos para Defontana.</p>
  </div>

  <div class="order-list">
    ${pendientes.sort((a,b) => a.fechaDespacho.localeCompare(b.fechaDespacho)).map(p => {
      const cliente = getCliente(p.clienteId);
      const iva = Math.round(p.total * 0.19);
      const neto = p.total - iva;
      const items = p.items.map(i => {
        const prod = getProducto(i.pId);
        return `<span class="item-pill">${prod ? prod.nombre.split(' ').slice(0,2).join(' ') : '?'} ×${i.qty}</span>`;
      }).join('');

      return `<div class="order-card status-${p.status}" id="fact-card-${p.id}">
        <div class="order-card-header">
          <div class="order-card-meta">
            <span class="order-id">${p.id}</span>
            <span class="order-client" style="font-weight:700">${cliente ? cliente.nombre : '?'}</span>
            ${cliente && cliente.rut ? `<span class="text-sm text-muted">RUT: ${cliente.rut}</span>` : ''}
          </div>
          <span class="status-badge badge-${p.status}">${statusIcon(p.status)} ${statusLabel(p.status)}</span>
        </div>

        ${cliente ? `
        <div style="background:var(--bg-soft);border-radius:8px;padding:12px;margin:8px 0;font-size:13px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div><strong>Razón Social:</strong> ${escapeHtml(cliente.razonSocial || cliente.nombre)}</div>
          <div><strong>Giro:</strong> ${escapeHtml(cliente.giro || '-')}</div>
          <div><strong>Dirección:</strong> ${escapeHtml(cliente.direccion || '-')}</div>
          <div><strong>Ciudad:</strong> ${escapeHtml(cliente.ciudad || '-')}</div>
        </div>` : ''}

        <div class="order-items-preview">${items}</div>

        <div style="background:var(--bg-soft);border-radius:8px;padding:10px 14px;margin:8px 0;display:flex;gap:24px;font-size:13px">
          <span>Neto: <strong>${fmt(neto)}</strong></span>
          <span>IVA 19%: <strong>${fmt(iva)}</strong></span>
          <span style="font-size:15px">Total: <strong style="color:var(--primary)">${fmt(p.total)}</strong></span>
          <span>Despacho: <strong>${fmtDate(p.fechaDespacho)}</strong></span>
        </div>

        <div class="order-card-footer" style="align-items:flex-end;gap:12px">
          <div style="flex:1">
            <label class="form-label" style="font-size:12px;margin-bottom:4px">Folio DTE (Factura Electrónica)</label>
            <input class="form-input" type="text" id="folio-${p.id}"
              placeholder="Ej: 000001234"
              value="${escapeHtml(p.folio || '')}"
              style="max-width:200px;font-family:monospace"
              oninput="this.value=this.value.replace(/[^0-9]/g,'')">
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="openModal('${p.id}')">Ver Detalle</button>
            <button class="btn btn-primary btn-sm" onclick="marcarFacturadoConFolio('${p.id}')">
              ${icon('receipt')} Confirmar Facturación
            </button>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ============================================================
// HISTORIAL FACTURADO
// ============================================================
function renderFacturadorHistorial(facturados) {
  const { period, clienteId } = STATE.factFilter;

  let filtrados = [...facturados];
  if (clienteId !== 'all') filtrados = filtrados.filter(p => p.clienteId === clienteId);
  if (period !== 'all') {
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const desde = new Date(now); desde.setDate(now.getDate() - days);
    filtrados = filtrados.filter(p => new Date(p.fechaFacturacion || p.fechaPedido) >= desde);
  }

  const totalMonto = filtrados.reduce((s, p) => s + p.total, 0);
  const hasFilter = period !== 'all' || clienteId !== 'all';

  return `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px">
    <div>
      <h3 style="font-size:18px;margin-bottom:2px">Historial de Facturación</h3>
      <p style="font-size:13px;color:var(--text-light)">${filtrados.length} pedido(s) · ${fmt(totalMonto)}</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" onclick="exportarDefontana()">${icon('download')} Exportar Defontana</button>
      <button class="btn btn-ghost btn-sm" onclick="exportarHistorialFacturadoPDF()">${icon('download')} PDF</button>
      <button class="btn btn-primary btn-sm" onclick="exportarHistorialFacturadoExcel()">${icon('download')} Excel</button>
    </div>
  </div>

  <!-- Filtros -->
  <div class="hist-filter-bar" style="margin-bottom:20px">
    <select class="dash-filter-select" onchange="setFactFilter('period',this.value)">
      <option value="all"     ${period==='all'?'selected':''}>Todo el historial</option>
      <option value="week"    ${period==='week'?'selected':''}>Última semana</option>
      <option value="month"   ${period==='month'?'selected':''}>Último mes</option>
      <option value="3months" ${period==='3months'?'selected':''}>Últimos 3 meses</option>
    </select>
    <select class="dash-filter-select" onchange="setFactFilter('clienteId',this.value)">
      <option value="all" ${clienteId==='all'?'selected':''}>Todos los clientes</option>
      ${DATA.clientes.map(c => `<option value="${c.id}" ${clienteId===c.id?'selected':''}>${escapeHtml(c.nombre)}</option>`).join('')}
    </select>
    ${hasFilter ? `<button class="btn btn-ghost btn-sm" onclick="clearFactFilter()">✕ Limpiar</button>` : ''}
    <span class="hist-count">${filtrados.length} pedido${filtrados.length!==1?'s':''}</span>
  </div>

  ${!filtrados.length ? `
    <div class="empty-state">
      <div class="empty-state-icon">${ICON.receipt}</div>
      <h3>Sin registros de facturación</h3>
      <p>Los pedidos confirmados como facturados aparecerán aquí.</p>
    </div>` : `

  <div style="background:var(--surface);border-radius:var(--radius);padding:24px;box-shadow:var(--shadow);overflow-x:auto">
    <table class="fact-table">
      <thead>
        <tr>
          <th>N° Pedido</th>
          <th>Folio DTE</th>
          <th>Cliente</th>
          <th>RUT</th>
          <th>Despacho</th>
          <th>Fecha Facturación</th>
          <th style="text-align:right">Neto</th>
          <th style="text-align:right">IVA</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${filtrados.sort((a,b)=>(b.fechaFacturacion||'').localeCompare(a.fechaFacturacion||'')).map(p => {
          const cliente = getCliente(p.clienteId);
          const iva = Math.round(p.total * 0.19);
          const neto = p.total - iva;
          return `<tr>
            <td><strong>${p.id}</strong></td>
            <td style="font-family:monospace">${p.folio ? escapeHtml(p.folio) : '<span style="color:var(--text-light)">—</span>'}</td>
            <td>${cliente ? escapeHtml(cliente.nombre) : '-'}</td>
            <td style="font-size:12px;color:var(--text-mid)">${cliente ? escapeHtml(cliente.rut || '-') : '-'}</td>
            <td>${fmtDate(p.fechaDespacho)}</td>
            <td>${fmtDate(p.fechaFacturacion) || '-'}</td>
            <td style="text-align:right">${fmt(neto)}</td>
            <td style="text-align:right;color:var(--text-mid)">${fmt(iva)}</td>
            <td style="text-align:right;font-weight:700;font-family:var(--font-display)">${fmt(p.total)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="fact-summary-row">
      <div>
        <div style="font-weight:700;font-size:14px">Totales</div>
        <div style="font-size:12px;color:var(--text-light)">${filtrados.length} pedidos</div>
      </div>
      <div style="display:flex;gap:24px;align-items:center">
        <span style="font-size:13px">Neto: <strong>${fmt(filtrados.reduce((s,p)=>s+(p.total-Math.round(p.total*0.19)),0))}</strong></span>
        <span style="font-size:13px">IVA: <strong>${fmt(filtrados.reduce((s,p)=>s+Math.round(p.total*0.19),0))}</strong></span>
        <div class="fact-summary-total">${fmt(totalMonto)}</div>
      </div>
    </div>
  </div>`}`;
}

// ============================================================
// ACCIÓN: Marcar facturado con folio DTE
// ============================================================
function marcarFacturadoConFolio(orderId) {
  const folioInput = document.getElementById('folio-' + orderId);
  const folio = folioInput ? folioInput.value.trim() : '';

  if (!folio) {
    showNotif('error', 'Ingresa el folio DTE antes de confirmar la facturación.');
    if (folioInput) folioInput.focus();
    return;
  }

  const p = PEDIDOS.find(x => x.id === orderId);
  if (!p) return;

  p.status = 'facturado';
  p.fechaFacturacion = todayStr();
  p.folio = folio;

  logAction('order_invoiced', { orderId, folio, total: p.total });

  const clientUser = DATA.usuarios.find(u => u.clienteId === p.clienteId && u.rol === 'cliente');
  if (clientUser) addNotification(clientUser.id,
    `Tu pedido ${orderId} ha sido facturado (Folio ${folio}). Total: ${fmt(p.total)}.`, 'info');

  // Notify gerentes
  DATA.usuarios
    .filter(u => u.rol === 'gerente' && u.activo !== false)
    .forEach(g => addNotification(g.id,
      `Pedido ${orderId} facturado por ${STATE.user.nombre}. Folio: ${folio} · ${fmt(p.total)}.`, 'info'));

  showNotif('success', `Pedido ${orderId} facturado con folio ${folio} — ${fmt(p.total)}`);
}

// ============================================================
// EXPORT: Defontana CSV
// ============================================================
function exportarDefontana() {
  const { period, clienteId } = STATE.factFilter;
  let facturados = PEDIDOS.filter(p => p.status === 'facturado');
  if (clienteId !== 'all') facturados = facturados.filter(p => p.clienteId === clienteId);
  if (period !== 'all') {
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const desde = new Date(now); desde.setDate(now.getDate() - days);
    facturados = facturados.filter(p => new Date(p.fechaFacturacion || p.fechaPedido) >= desde);
  }

  if (!facturados.length) {
    showNotif('error', 'No hay registros facturados para exportar.');
    return;
  }

  // Formato Defontana — una fila por ítem de cada pedido
  // Columnas estándar: TipoDTE, Folio, FechaEmision, RUTReceptor, RazonSocial, Giro, Direccion, Ciudad,
  //                    CodigoProducto, Descripcion, Cantidad, PrecioUnitario, MontoNeto, IVA, Total
  const rows = [];

  // Encabezado
  rows.push([
    'TipoDTE', 'Folio', 'FechaEmision', 'RUTReceptor', 'RazonSocial', 'GiroReceptor',
    'DireccionReceptor', 'CiudadReceptor', 'CodigoProducto', 'DescripcionProducto',
    'Cantidad', 'PrecioUnitario', 'MontoNeto', 'IVA', 'Total'
  ].join(';'));

  facturados.sort((a,b) => (a.fechaFacturacion||'').localeCompare(b.fechaFacturacion||'')).forEach(p => {
    const cliente = getCliente(p.clienteId);
    const rut = cliente?.rut || '';
    const razonSocial = (cliente?.razonSocial || cliente?.nombre || '').replace(/;/g, ',');
    const giro = (cliente?.giro || '').replace(/;/g, ',');
    const direccion = (cliente?.direccion || '').replace(/;/g, ',');
    const ciudad = (cliente?.ciudad || '').replace(/;/g, ',');
    const folio = p.folio || '';
    const fecha = p.fechaFacturacion || p.fechaPedido;

    p.items.forEach(item => {
      const prod = getProducto(item.pId);
      const precioUnit = item.price || getPrecio(p.clienteId, item.pId);
      const subtotal = item.qty * precioUnit;
      const subtotalNeto = Math.round(subtotal / 1.19);
      const ivaItem = subtotal - subtotalNeto;

      rows.push([
        '33',                    // Tipo DTE: Factura Electrónica
        folio,
        fecha,
        rut,
        razonSocial,
        giro,
        direccion,
        ciudad,
        prod?.sku || item.pId,
        (prod?.nombre || item.pId).replace(/;/g, ','),
        item.qty,
        precioUnit,
        subtotalNeto,
        ivaItem,
        subtotal
      ].join(';'));
    });
  });

  // BOM UTF-8 para compatibilidad con Excel chileno
  const bom = '\uFEFF';
  const csvContent = bom + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Defontana_LaMasandera_${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logAction('defontana_exported', { records: facturados.length });
  showNotif('success', `Archivo Defontana exportado: ${facturados.length} factura(s).`);
}

// ============================================================
// EXPORT: PDF Historial Facturado
// ============================================================
function exportarHistorialFacturadoPDF() {
  const { period, clienteId } = STATE.factFilter;
  let facturados = PEDIDOS.filter(p => p.status === 'facturado');
  if (clienteId !== 'all') facturados = facturados.filter(p => p.clienteId === clienteId);
  if (period !== 'all') {
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const desde = new Date(now); desde.setDate(now.getDate() - days);
    facturados = facturados.filter(p => new Date(p.fechaFacturacion || p.fechaPedido) >= desde);
  }

  if (!facturados.length) { showNotif('error', 'No hay registros para exportar.'); return; }

  facturados.sort((a,b) => (b.fechaFacturacion||'').localeCompare(a.fechaFacturacion||''));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const primary  = [139, 69, 19];
  const secondary = [101, 67, 33];
  const totalMonto = facturados.reduce((s,p) => s+p.total, 0);
  const totalNeto  = facturados.reduce((s,p) => s+(p.total-Math.round(p.total*0.19)), 0);
  const totalIVA   = totalMonto - totalNeto;

  // Header
  doc.setFontSize(22); doc.setTextColor(...primary);
  doc.text('LA MASANDERA', 105, 20, { align:'center' });
  doc.setFontSize(10); doc.setTextColor(155, 145, 136);
  doc.text('Panadería Artesanal · Curacaví', 105, 27, { align:'center' });
  doc.setFontSize(14); doc.setTextColor(...secondary);
  doc.text('Historial de Facturación', 105, 38, { align:'center' });

  doc.setFontSize(9); doc.setTextColor(0,0,0);
  const periodoLabel = period==='all'?'Todo':period==='week'?'Última semana':period==='month'?'Último mes':'Últimos 3 meses';
  const clienteLabel = clienteId==='all'?'Todos':(getCliente(clienteId)?.nombre||clienteId);
  doc.text(`Período: ${periodoLabel} · Cliente: ${clienteLabel} · Generado: ${new Date().toLocaleString('es-CL')}`, 105, 46, { align:'center' });

  doc.setDrawColor(...primary); doc.setLineWidth(0.5);
  doc.line(14, 52, 196, 52);

  // Table
  let y = 62;
  doc.setFillColor(240, 234, 224);
  doc.rect(14, y-5, 182, 7, 'F');
  doc.setFontSize(7); doc.setTextColor(90, 83, 75);
  doc.text('N° Pedido', 16, y);
  doc.text('Folio DTE', 38, y);
  doc.text('Cliente', 58, y);
  doc.text('RUT', 95, y);
  doc.text('Despacho', 120, y);
  doc.text('Facturado', 142, y);
  doc.text('Neto', 162, y, { align:'right' });
  doc.text('Total', 196, y, { align:'right' });
  y += 8;

  doc.setTextColor(26, 23, 20); doc.setFontSize(8);
  facturados.forEach(p => {
    if (y > 270) { doc.addPage(); y = 20; }
    const c = getCliente(p.clienteId);
    const neto = p.total - Math.round(p.total * 0.19);
    doc.text(p.id, 16, y);
    doc.text(p.folio || '—', 38, y);
    doc.text((c?.nombre||'-').slice(0,20), 58, y);
    doc.text((c?.rut||'-').slice(0,14), 95, y);
    doc.text(fmtDate(p.fechaDespacho), 120, y);
    doc.text(fmtDate(p.fechaFacturacion)||'-', 142, y);
    doc.text(fmt(neto), 162, y, { align:'right' });
    doc.setFont(undefined,'bold');
    doc.text(fmt(p.total), 196, y, { align:'right' });
    doc.setFont(undefined,'normal');
    y += 5.5;
  });

  // Totals
  doc.setDrawColor(...primary); doc.line(14, y+2, 196, y+2); y += 10;
  doc.setFontSize(9); doc.setTextColor(...primary); doc.setFont(undefined,'bold');
  doc.text(`Neto: ${fmt(totalNeto)}   IVA 19%: ${fmt(totalIVA)}   TOTAL: ${fmt(totalMonto)}`, 196, y, { align:'right' });

  doc.setFontSize(7); doc.setTextColor(155,145,136); doc.setFont(undefined,'normal');
  doc.text('La Masandera — Panadería Artesanal', 105, 289, { align:'center' });

  const filename = `Facturacion_LaMasandera_${todayStr()}.pdf`;
  doc.save(filename);
  logAction('invoicing_pdf_exported', { records: facturados.length });
  showNotif('success', `PDF descargado: ${filename}`);
}

// ============================================================
// EXPORT: Excel Historial Facturado
// ============================================================
function exportarHistorialFacturadoExcel() {
  const { period, clienteId } = STATE.factFilter;
  let facturados = PEDIDOS.filter(p => p.status === 'facturado');
  if (clienteId !== 'all') facturados = facturados.filter(p => p.clienteId === clienteId);
  if (period !== 'all') {
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const desde = new Date(now); desde.setDate(now.getDate() - days);
    facturados = facturados.filter(p => new Date(p.fechaFacturacion || p.fechaPedido) >= desde);
  }

  if (!facturados.length) { showNotif('error', 'No hay registros para exportar.'); return; }

  const rows = facturados
    .sort((a,b) => (b.fechaFacturacion||'').localeCompare(a.fechaFacturacion||''))
    .map(p => {
      const c = getCliente(p.clienteId);
      const neto = p.total - Math.round(p.total * 0.19);
      const iva  = Math.round(p.total * 0.19);
      return {
        'N° Pedido': p.id,
        'Folio DTE': p.folio || '',
        'Cliente': c?.nombre || '-',
        'Razón Social': c?.razonSocial || '-',
        'RUT': c?.rut || '-',
        'Fecha Despacho': p.fechaDespacho,
        'Fecha Facturación': p.fechaFacturacion || '-',
        'Neto ($)': neto,
        'IVA ($)': iva,
        'Total ($)': p.total,
      };
    });

  const totalMonto = rows.reduce((s,r) => s + r['Total ($)'], 0);
  const totalNeto  = rows.reduce((s,r) => s + r['Neto ($)'], 0);
  const totalIVA   = rows.reduce((s,r) => s + r['IVA ($)'], 0);
  rows.push({
    'N° Pedido':'','Folio DTE':'','Cliente':'','Razón Social':'','RUT':'',
    'Fecha Despacho':'','Fecha Facturación':'TOTALES',
    'Neto ($)': totalNeto, 'IVA ($)': totalIVA, 'Total ($)': totalMonto,
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    {wch:14},{wch:12},{wch:22},{wch:26},{wch:14},
    {wch:14},{wch:16},{wch:12},{wch:12},{wch:14},
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Facturación');

  const filename = `Facturacion_LaMasandera_${todayStr()}.xlsx`;
  XLSX.writeFile(wb, filename);
  logAction('invoicing_excel_exported', { records: facturados.length });
  showNotif('success', `Excel descargado: ${filename}`);
}
