// ============================================================
// PRODUCCION — Plan de producción y empaque
// ============================================================
function renderProduccion() {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  const sub = STATE.prodSubTab || 0;

  return `
  <div class="page-header">
    <h2>Plan de Producción</h2>
    ${sub !== 2 ? `<p>Producción consolidada por SKU · Empaque por despacho y cliente.</p>` : ''}
  </div>

  <div class="tabs" style="margin-bottom:24px">
    <button class="tab-btn ${sub===0?'active':''}" onclick="STATE.prodSubTab=0;render()">
      ${icon('gear')} Producción
    </button>
    <button class="tab-btn ${sub===1?'active':''}" onclick="STATE.prodSubTab=1;render()">
      ${icon('package')} Empaque
    </button>
    <button class="tab-btn ${sub===2?'active':''}" onclick="STATE.prodSubTab=2;render()">
      ${icon('clipboardList')} Inventario
    </button>
  </div>

  ${sub === 0 ? renderProduccionSub(activos) : sub === 1 ? renderEmpaqueSub(activos) : renderInventarioSub()}`;
}

// ─── SUB-TAB: PRODUCCIÓN ─────────────────────────────────────
// Agrupado por fecha de ingreso del pedido (fechaPedido)
// Tabla: SKU | Descripción | Total Unidades requeridas
function renderProduccionSub(activos) {
  if (!activos.length) {
    return `<div class="empty-state"><div class="empty-state-icon">${ICON.clipboardList}</div><h3>Sin pedidos aprobados</h3><p>El gerente aún no ha aprobado pedidos.</p></div>`;
  }

  // Group by fechaPedido
  const byIngreso = {};
  activos.forEach(p => {
    if (!byIngreso[p.fechaPedido]) byIngreso[p.fechaPedido] = [];
    byIngreso[p.fechaPedido].push(p);
  });
  const fechas = Object.keys(byIngreso).sort();

  return `
  <div style="display:flex;justify-content:flex-end;gap:10px;margin-bottom:16px">
    <button class="btn btn-ghost btn-sm" onclick="imprimirTodoProduccion()">${icon('printer')} Imprimir todo</button>
    <button class="btn btn-primary btn-sm" onclick="generarPDFProduccionV2()">${icon('download')} Descargar PDF</button>
  </div>
  ${fechas.map(fecha => {
    const pedidos = byIngreso[fecha];
    // Aggregate SKU totals for this entry date
    const skuMap = {};
    pedidos.forEach(p => {
      p.items.forEach(item => {
        if (!skuMap[item.pId]) skuMap[item.pId] = 0;
        skuMap[item.pId] += item.qty;
      });
    });
    const skuEntries = Object.entries(skuMap).sort((a,b) => {
      const pa = getProducto(a[0]);
      const pb = getProducto(b[0]);
      if (pa?.categoria !== pb?.categoria) return pa?.categoria === 'masa_madre' ? -1 : 1;
      return (pa?.tipo||'').localeCompare(pb?.tipo||'');
    });
    const totalUnids = Object.values(skuMap).reduce((s,v)=>s+v,0);

    return `
    <div class="dispatch-group" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--primary-light);border-radius:var(--radius-sm) var(--radius-sm) 0 0">
        <div style="font-weight:700;font-size:14px">${icon('inbox')} Pedidos ingresados el ${fmtDate(fecha)}</div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="font-size:12px;color:var(--text-mid)">${pedidos.length} pedido${pedidos.length!==1?'s':''} · ${totalUnids} unidades</div>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:11px" onclick="imprimirFechaProduccion('${fecha}')">${icon('printer')} Imprimir</button>
        </div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border-light);border-top:none;border-radius:0 0 var(--radius-sm) var(--radius-sm);overflow-x:auto">
        <table class="fact-table">
          <thead><tr>
            <th>SKU</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th style="text-align:right">Total Unidades</th>
          </tr></thead>
          <tbody>
            ${skuEntries.map(([pId, qty]) => {
              const prod = getProducto(pId);
              return `<tr>
                <td style="font-family:monospace;font-size:11px;color:var(--text-light)">${prod?.sku||'—'}</td>
                <td style="font-weight:700">${prod?.nombre||'?'}</td>
                <td><span class="cat-badge cat-${prod?.categoria}">${prod?.categoria==='brioche'?'Brioche':'Masa Madre'}</span></td>
                <td style="font-size:12px;color:var(--text-light)">${prod?.descripcion||''}</td>
                <td style="text-align:right;font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--primary)">${qty}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div style="padding:10px 16px;text-align:right;font-size:13px;color:var(--text-light);border-top:1px solid var(--border-light)">
          Total: <strong>${totalUnids} unidades</strong> en ${pedidos.length} pedido${pedidos.length!==1?'s':''}
        </div>
      </div>
    </div>`;
  }).join('')}`;
}

// ─── SUB-TAB: EMPAQUE ─────────────────────────────────────────
// Agrupado por fecha de despacho (fechaDespacho, ascendente)
// Tabla: Cliente | Producto | Unidades
function renderEmpaqueSub(activos) {
  if (!activos.length) {
    return `<div class="empty-state"><div class="empty-state-icon">${ICON.package}</div><h3>Sin pedidos aprobados</h3><p>El gerente aún no ha aprobado pedidos.</p></div>`;
  }

  // Group by fechaDespacho
  const byDespacho = {};
  activos.forEach(p => {
    if (!byDespacho[p.fechaDespacho]) byDespacho[p.fechaDespacho] = [];
    byDespacho[p.fechaDespacho].push(p);
  });
  const fechas = Object.keys(byDespacho).sort(); // ascending dispatch date

  return `
  <div style="display:flex;justify-content:flex-end;gap:10px;margin-bottom:16px">
    <button class="btn btn-ghost btn-sm" onclick="imprimirTodoEmpaque()">${icon('printer')} Imprimir todo</button>
    <button class="btn btn-primary btn-sm" onclick="generarPDFEmpaque()">${icon('download')} Descargar PDF</button>
  </div>
  ${fechas.map(fecha => {
    const pedidos = byDespacho[fecha];
    const totalUnids = pedidos.reduce((s,p)=>s+p.items.reduce((ss,i)=>ss+i.qty,0),0);

    // Build per-client line items
    const lineas = [];
    pedidos.forEach(p => {
      const cliente = getCliente(p.clienteId);
      p.items.forEach(item => {
        const prod = getProducto(item.pId);
        lineas.push({
          clienteNombre: cliente?.nombre || '?',
          productoNombre: prod?.nombre || '?',
          sku: prod?.sku || '—',
          categoria: prod?.categoria || '',
          qty: item.qty,
          pedidoId: p.id,
        });
      });
    });
    // Sort by client name, then by producto nombre
    lineas.sort((a,b) => a.clienteNombre.localeCompare(b.clienteNombre) || a.productoNombre.localeCompare(b.productoNombre));

    return `
    <div class="dispatch-group" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--status-approved-bg);border-radius:var(--radius-sm) var(--radius-sm) 0 0;border:1px solid var(--status-approved)">
        <div style="font-weight:700;font-size:14px;color:var(--status-approved)">${icon('truck')} Despacho: ${fmtDate(fecha)}</div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="font-size:12px;color:var(--text-mid)">${pedidos.length} pedido${pedidos.length!==1?'s':''} · ${totalUnids} unidades</div>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:11px" onclick="imprimirFechaEmpaque('${fecha}')">${icon('printer')} Imprimir</button>
        </div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border-light);border-top:none;border-radius:0 0 var(--radius-sm) var(--radius-sm);overflow-x:auto">
        <table class="fact-table">
          <thead><tr>
            <th>Cliente</th>
            <th>SKU</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th style="text-align:right">Unidades</th>
            <th>Pedido</th>
          </tr></thead>
          <tbody>
            ${lineas.map(l => `<tr>
              <td style="font-weight:700">${escapeHtml(l.clienteNombre)}</td>
              <td style="font-family:monospace;font-size:11px;color:var(--text-light)">${l.sku}</td>
              <td>${escapeHtml(l.productoNombre)}</td>
              <td><span class="cat-badge cat-${l.categoria}">${l.categoria==='brioche'?'Brioche':'Masa Madre'}</span></td>
              <td style="text-align:right;font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--primary)">${l.qty}</td>
              <td style="font-size:11px;color:var(--text-light)">${l.pedidoId}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div style="padding:10px 16px;text-align:right;font-size:13px;color:var(--text-light);border-top:1px solid var(--border-light)">
          Total despacho: <strong>${totalUnids} unidades</strong>
        </div>
      </div>
    </div>`;
  }).join('')}`;
}

// ─── GERENTE: Plan Producción (tab 1) ─────────────────────────
function renderPlanProduccion() {
  return renderProduccion();
}

// ============================================================
// HELPERS: construir datos para impresión/PDF
// ============================================================
function _buildProduccionData(activos, soloFecha) {
  const byIngreso = {};
  activos.forEach(p => {
    if (!byIngreso[p.fechaPedido]) byIngreso[p.fechaPedido] = [];
    byIngreso[p.fechaPedido].push(p);
  });
  const fechas = Object.keys(byIngreso).sort().filter(f => !soloFecha || f === soloFecha);
  return { byIngreso, fechas };
}

function _buildEmpaqueData(activos, soloFecha) {
  const byDespacho = {};
  activos.forEach(p => {
    if (!byDespacho[p.fechaDespacho]) byDespacho[p.fechaDespacho] = [];
    byDespacho[p.fechaDespacho].push(p);
  });
  const fechas = Object.keys(byDespacho).sort().filter(f => !soloFecha || f === soloFecha);
  return { byDespacho, fechas };
}

// ─── CSS compartido para ventanas de impresión ─────────────────
function _printCSS() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin:0; padding:0; }
    body { font-family:'Outfit',sans-serif; font-size:12px; color:#1a1714; padding:20px; }
    .logo { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:700; color:#8B4513; }
    .subtitle { font-size:10px; color:#9b9188; margin-bottom:2px; }
    .header { border-bottom:2px solid #8B4513; padding-bottom:10px; margin-bottom:16px; }
    .header-row { display:flex; justify-content:space-between; align-items:flex-end; }
    .doc-title { font-size:16px; font-weight:700; color:#2d4a3e; }
    .date-label { font-size:11px; color:#6b5e52; }
    .group-header { background:#f5f0e8; padding:8px 12px; border-radius:4px 4px 0 0;
      display:flex; justify-content:space-between; align-items:center;
      font-weight:700; font-size:12px; color:#2d4a3e; margin-top:16px; }
    .group-count { font-size:10px; color:#6b5e52; font-weight:400; }
    table { width:100%; border-collapse:collapse; }
    th { background:#ede8de; font-size:10px; font-weight:600; text-transform:uppercase;
         letter-spacing:.04em; color:#6b5e52; padding:6px 10px; text-align:left; }
    td { padding:6px 10px; border-bottom:1px solid #f0ece4; }
    tr:last-child td { border-bottom:none; }
    .sku { font-family:monospace; font-size:10px; color:#9b9188; }
    .qty { text-align:right; font-size:18px; font-weight:700; color:#8B4513; font-family:'Cormorant Garamond',serif; }
    .badge { display:inline-block; padding:2px 7px; border-radius:10px; font-size:9px; font-weight:600; }
    .badge-mm { background:#e8f0ec; color:#2d4a3e; }
    .badge-br { background:#fdf3e8; color:#8B4513; }
    .total-row { padding:8px 12px; text-align:right; font-size:11px; color:#6b5e52;
      border:1px solid #e8e2d9; border-top:none; border-radius:0 0 4px 4px; }
    .total-row strong { color:#1a1714; }
    .footer { margin-top:24px; padding-top:8px; border-top:1px solid #e8e2d9;
      font-size:9px; color:#9b9188; text-align:center; }
    @media print { body { padding:10mm; } }`;
}

// ============================================================
// IMPRIMIR POR FECHA — Producción
// ============================================================
function imprimirFechaProduccion(fecha) {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  const { byIngreso, fechas } = _buildProduccionData(activos, fecha);
  if (!fechas.length) { showNotif('error', 'Sin datos para esa fecha.'); return; }
  _abrirVentanaImpresion(_htmlProduccionFecha(byIngreso, [fecha]));
}

function imprimirTodoProduccion() {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  if (!activos.length) { showNotif('error', 'No hay pedidos aprobados.'); return; }
  const { byIngreso, fechas } = _buildProduccionData(activos, null);
  _abrirVentanaImpresion(_htmlProduccionFecha(byIngreso, fechas));
}

function _htmlProduccionFecha(byIngreso, fechas) {
  const bloques = fechas.map(fecha => {
    const pedidos = byIngreso[fecha];
    const skuMap = {};
    pedidos.forEach(p => p.items.forEach(i => { skuMap[i.pId] = (skuMap[i.pId]||0) + i.qty; }));
    const entries = Object.entries(skuMap).sort((a,b) => {
      const pa = getProducto(a[0]); const pb = getProducto(b[0]);
      if (pa?.categoria !== pb?.categoria) return pa?.categoria === 'masa_madre' ? -1 : 1;
      return (pa?.tipo||'').localeCompare(pb?.tipo||'');
    });
    const total = Object.values(skuMap).reduce((s,v)=>s+v,0);
    const rows = entries.map(([pId, qty]) => {
      const prod = getProducto(pId);
      const badge = prod?.categoria === 'brioche'
        ? '<span class="badge badge-br">Brioche</span>'
        : '<span class="badge badge-mm">Masa Madre</span>';
      return `<tr>
        <td class="sku">${prod?.sku||'—'}</td>
        <td><strong>${prod?.nombre||'?'}</strong></td>
        <td>${badge}</td>
        <td style="font-size:11px;color:#6b5e52">${prod?.descripcion||''}</td>
        <td class="qty">${qty}</td>
      </tr>`;
    }).join('');
    return `
      <div class="group-header">
        Pedidos ingresados el ${fmtDate(fecha)}
        <span class="group-count">${pedidos.length} pedido${pedidos.length!==1?'s':''} · ${total} uds</span>
      </div>
      <table>
        <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Descripción</th><th style="text-align:right">Uds</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total-row">Total: <strong>${total} unidades</strong> en ${pedidos.length} pedido${pedidos.length!==1?'s':''}</div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Producción</title>
    <style>${_printCSS()}</style></head><body>
    <div class="header">
      <div class="header-row">
        <div><div class="logo">La Masandera</div><div class="subtitle">Panadería Artesanal · Curacaví</div></div>
        <div style="text-align:right"><div class="doc-title">Plan de Producción</div>
          <div class="date-label">Generado: ${new Date().toLocaleString('es-CL')}</div></div>
      </div>
    </div>
    ${bloques}
    <div class="footer">La Masandera — Panadería Artesanal · Uso interno</div>
    <script>window.onload=function(){window.print();}<\/script>
  </body></html>`;
}

// ============================================================
// IMPRIMIR POR FECHA — Empaque
// ============================================================
function imprimirFechaEmpaque(fecha) {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  const { byDespacho, fechas } = _buildEmpaqueData(activos, fecha);
  if (!fechas.length) { showNotif('error', 'Sin datos para esa fecha.'); return; }
  _abrirVentanaImpresion(_htmlEmpaqueFecha(byDespacho, [fecha]));
}

function imprimirTodoEmpaque() {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  if (!activos.length) { showNotif('error', 'No hay pedidos aprobados.'); return; }
  const { byDespacho, fechas } = _buildEmpaqueData(activos, null);
  _abrirVentanaImpresion(_htmlEmpaqueFecha(byDespacho, fechas));
}

function _htmlEmpaqueFecha(byDespacho, fechas) {
  const bloques = fechas.map(fecha => {
    const pedidos = byDespacho[fecha];
    const lineas = [];
    pedidos.forEach(p => {
      const cli = getCliente(p.clienteId);
      p.items.forEach(item => {
        const prod = getProducto(item.pId);
        lineas.push({
          clienteNombre: cli?.nombre||'?',
          productoNombre: prod?.nombre||'?',
          sku: prod?.sku||'—',
          categoria: prod?.categoria||'',
          qty: item.qty,
          pedidoId: p.id,
        });
      });
    });
    lineas.sort((a,b) => a.clienteNombre.localeCompare(b.clienteNombre) || a.productoNombre.localeCompare(b.productoNombre));
    const total = lineas.reduce((s,l)=>s+l.qty,0);
    const rows = lineas.map(l => {
      const badge = l.categoria === 'brioche'
        ? '<span class="badge badge-br">Brioche</span>'
        : '<span class="badge badge-mm">Masa Madre</span>';
      return `<tr>
        <td><strong>${escapeHtml(l.clienteNombre)}</strong></td>
        <td class="sku">${l.sku}</td>
        <td>${escapeHtml(l.productoNombre)}</td>
        <td>${badge}</td>
        <td class="qty">${l.qty}</td>
        <td style="font-size:10px;color:#9b9188">${l.pedidoId}</td>
      </tr>`;
    }).join('');
    return `
      <div class="group-header" style="background:#e8f0ec;color:#2d4a3e">
        Despacho: ${fmtDate(fecha)}
        <span class="group-count">${pedidos.length} pedido${pedidos.length!==1?'s':''} · ${total} uds</span>
      </div>
      <table>
        <thead><tr><th>Cliente</th><th>SKU</th><th>Producto</th><th>Categoría</th><th style="text-align:right">Uds</th><th>Pedido</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total-row">Total despacho: <strong>${total} unidades</strong></div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Empaque</title>
    <style>${_printCSS()}</style></head><body>
    <div class="header">
      <div class="header-row">
        <div><div class="logo">La Masandera</div><div class="subtitle">Panadería Artesanal · Curacaví</div></div>
        <div style="text-align:right"><div class="doc-title">Plan de Empaque</div>
          <div class="date-label">Generado: ${new Date().toLocaleString('es-CL')}</div></div>
      </div>
    </div>
    ${bloques}
    <div class="footer">La Masandera — Panadería Artesanal · Uso interno</div>
    <script>window.onload=function(){window.print();}<\/script>
  </body></html>`;
}

// ─── Abrir ventana de impresión ────────────────────────────────
function _abrirVentanaImpresion(html) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { showNotif('error', 'Permite ventanas emergentes para imprimir.'); return; }
  w.document.write(html);
  w.document.close();
}

// ============================================================
// PDF: Plan de Producción
// ============================================================
function generarPDFProduccionV2() {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  if (!activos.length) { showNotif('error', 'No hay pedidos aprobados.'); return; }

  const { byIngreso, fechas } = _buildProduccionData(activos, null);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const primary = [139, 69, 19];
  const secondary = [45, 74, 62];

  _pdfHeader(doc, 'Plan de Producción', primary, secondary);
  let y = 63;

  fechas.forEach(fecha => {
    const pedidos = byIngreso[fecha];
    const skuMap = {};
    pedidos.forEach(p => p.items.forEach(item => { skuMap[item.pId] = (skuMap[item.pId]||0) + item.qty; }));
    const entries = Object.entries(skuMap).sort((a,b) => {
      const pa = getProducto(a[0]); const pb = getProducto(b[0]);
      if (pa?.categoria !== pb?.categoria) return pa?.categoria === 'masa_madre' ? -1 : 1;
      return (pa?.tipo||'').localeCompare(pb?.tipo||'');
    });
    const total = Object.values(skuMap).reduce((s,v)=>s+v,0);

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setTextColor(...secondary); doc.setFont(undefined,'bold');
    doc.text(`Pedidos ingresados: ${fmtDate(fecha)}`, 14, y); y += 8;
    doc.setFont(undefined,'normal');

    doc.setFillColor(240, 237, 229);
    doc.rect(14, y-5, 182, 7, 'F');
    doc.setFontSize(8); doc.setTextColor(90,83,75);
    doc.text('SKU', 16, y); doc.text('Producto', 42, y); doc.text('Descripción', 100, y);
    doc.text('Uds', 186, y, { align:'right' });
    y += 7;

    doc.setTextColor(26,23,20); doc.setFontSize(9);
    entries.forEach(([pId, qty]) => {
      if (y > 275) { doc.addPage(); y = 20; }
      const prod = getProducto(pId);
      doc.text((prod?.sku||'—'), 16, y);
      doc.text((prod?.nombre||'?').slice(0,26), 42, y);
      doc.text((prod?.descripcion||'').slice(0,36), 100, y);
      doc.setFont(undefined,'bold'); doc.text(String(qty), 186, y, { align:'right' }); doc.setFont(undefined,'normal');
      y += 6;
    });

    // Total line
    doc.setDrawColor(220,210,196); doc.setLineWidth(0.3);
    doc.line(14, y, 196, y); y += 4;
    doc.setFontSize(8); doc.setTextColor(90,83,75);
    doc.text(`Total: ${total} unidades en ${pedidos.length} pedido${pedidos.length!==1?'s':''}`, 186, y, { align:'right' });
    y += 10;
  });

  _pdfFooter(doc);
  const filename = `Plan_Produccion_${todayStr()}.pdf`;
  doc.save(filename);
  logAction('production_pdf_generated', { totalPedidos: activos.length });
  showNotif('success', `Plan descargado: ${filename}`);
}

// ============================================================
// PDF: Plan de Empaque
// ============================================================
function generarPDFEmpaque() {
  const activos = PEDIDOS.filter(p => ['aprobado','en_produccion'].includes(p.status));
  if (!activos.length) { showNotif('error', 'No hay pedidos aprobados.'); return; }

  const { byDespacho, fechas } = _buildEmpaqueData(activos, null);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const primary = [139, 69, 19];
  const secondary = [45, 74, 62];

  _pdfHeader(doc, 'Plan de Empaque', primary, secondary);
  let y = 63;

  fechas.forEach(fecha => {
    const pedidos = byDespacho[fecha];
    const lineas = [];
    pedidos.forEach(p => {
      const cli = getCliente(p.clienteId);
      p.items.forEach(item => {
        const prod = getProducto(item.pId);
        lineas.push({ clienteNombre: cli?.nombre||'?', productoNombre: prod?.nombre||'?', sku: prod?.sku||'—', qty: item.qty });
      });
    });
    lineas.sort((a,b) => a.clienteNombre.localeCompare(b.clienteNombre) || a.productoNombre.localeCompare(b.productoNombre));
    const total = lineas.reduce((s,l)=>s+l.qty,0);

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setTextColor(...secondary); doc.setFont(undefined,'bold');
    doc.text(`Despacho: ${fmtDate(fecha)}`, 14, y); y += 8;
    doc.setFont(undefined,'normal');

    doc.setFillColor(232, 240, 236);
    doc.rect(14, y-5, 182, 7, 'F');
    doc.setFontSize(8); doc.setTextColor(90,83,75);
    doc.text('Cliente', 16, y); doc.text('SKU', 72, y); doc.text('Producto', 95, y); doc.text('Pedido', 160, y);
    doc.text('Uds', 186, y, { align:'right' });
    y += 7;

    doc.setTextColor(26,23,20); doc.setFontSize(9);
    lineas.forEach(l => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(l.clienteNombre.slice(0,24), 16, y);
      doc.text(l.sku, 72, y);
      doc.text(l.productoNombre.slice(0,26), 95, y);
      doc.setFont(undefined,'bold'); doc.text(String(l.qty), 186, y, { align:'right' }); doc.setFont(undefined,'normal');
      y += 6;
    });

    doc.setDrawColor(220,210,196); doc.setLineWidth(0.3);
    doc.line(14, y, 196, y); y += 4;
    doc.setFontSize(8); doc.setTextColor(90,83,75);
    doc.text(`Total despacho: ${total} unidades`, 186, y, { align:'right' });
    y += 10;
  });

  _pdfFooter(doc);
  const filename = `Plan_Empaque_${todayStr()}.pdf`;
  doc.save(filename);
  logAction('empaque_pdf_generated', { totalPedidos: activos.length });
  showNotif('success', `Plan descargado: ${filename}`);
}

// ─── PDF helpers ───────────────────────────────────────────────
function _pdfHeader(doc, titulo, primary, secondary) {
  doc.setFontSize(22); doc.setTextColor(...primary);
  doc.text('LA MASANDERA', 105, 20, { align:'center' });
  doc.setFontSize(10); doc.setTextColor(155, 145, 136);
  doc.text('Panadería Artesanal · Curacaví', 105, 27, { align:'center' });
  doc.setFontSize(16); doc.setTextColor(...secondary);
  doc.text(titulo, 105, 40, { align:'center' });
  doc.setFontSize(10); doc.setTextColor(0,0,0);
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 105, 48, { align:'center' });
  doc.setDrawColor(...primary); doc.setLineWidth(0.5);
  doc.line(14, 53, 196, 53);
}

function _pdfFooter(doc) {
  doc.setFontSize(7); doc.setTextColor(155,145,136);
  doc.text('La Masandera — Panadería Artesanal · Uso interno', 105, 289, { align:'center' });
}

// ─── Legacy aliases ────────────────────────────────────────────
function generarPDFProduccion(fecha) { generarPDFProduccionV2(); }

// ============================================================
// SUB-TAB: INVENTARIO DIARIO
// ============================================================
function renderInventarioSub() {
  const productos = DATA.productos.filter(p => p.activo);
  const tipos = [...new Set(productos.map(p => p.tipo))];

  // Inicializar fecha si está vacía
  if (!STATE.inventarioFecha) STATE.inventarioFecha = todayStr();

  const fechaActual = STATE.inventarioFecha;
  const registroExistente = getInventarioPorFecha(fechaActual);

  // Pre-cargar draft con registro existente si el draft está vacío y existe registro
  if (registroExistente && Object.keys(STATE.inventarioDraft).length === 0) {
    Object.assign(STATE.inventarioDraft, registroExistente.items);
  }

  // Historial de inventarios (solo lectura), más recientes primero
  const historial = [...INVENTARIO].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return `
  <!-- BARRA SUPERIOR: fecha + acciones (una sola fila) -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);padding:8px 14px">
    <label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-mid);white-space:nowrap">Fecha</label>
    <input class="form-input" type="date" value="${fechaActual}"
      onchange="setInventarioFecha(this.value)" style="width:155px;padding:4px 8px;font-size:13px">
    ${registroExistente
      ? `<span style="font-size:11px;color:var(--status-approved);font-weight:600;white-space:nowrap">${icon('check')} Editando registro</span>`
      : `<span style="font-size:11px;color:var(--text-light);white-space:nowrap">Nuevo registro</span>`}
    <button class="btn btn-ghost btn-sm" onclick="limpiarInventarioDraft()" style="margin-left:auto">${icon('x')} Limpiar</button>
    <button class="btn btn-primary btn-sm" onclick="guardarInventario()">${icon('check')} Guardar</button>
  </div>

  <!-- GRID DE PRODUCTOS (plano, sin separadores por tipo) -->
  <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:4px">
    ${productos.map(prod => {
      const qty = STATE.inventarioDraft[prod.id] !== undefined ? STATE.inventarioDraft[prod.id] : '';
      return `<div style="display:flex;align-items:center;gap:6px;background:var(--surface2);border-radius:5px;padding:5px 8px;border-left:2px solid ${prod.categoria==='brioche'?'#d97706':'var(--primary-light-border,#c49a6c)'}">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(prod.nombre)}">${escapeHtml(prod.nombre)}</div>
          <div style="font-size:9px;color:var(--text-light)">${prod.tipo}</div>
        </div>
        <input type="number" min="0" value="${qty}" placeholder="0"
          style="width:50px;text-align:right;padding:2px 4px;border:1px solid var(--border);border-radius:4px;font-size:12px;background:white"
          oninput="inventarioDraftSet('${prod.id}',this.value)">
      </div>`;
    }).join('')}
  </div>

  <!-- HISTORIAL (colapsable, solo lectura) -->
  <details style="background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);overflow:hidden">
    <summary style="padding:10px 16px;background:var(--surface2);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-mid);cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px">
      ${icon('clock')} Historial de registros
      <span style="margin-left:auto;font-size:10px;color:var(--text-light);font-weight:400">${historial.length} registro${historial.length!==1?'s':''} — clic para ver</span>
    </summary>
    ${historial.length === 0 ? `<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px">Sin registros previos.</div>` : `
    <div style="overflow-x:auto">
      <table class="fact-table" style="font-size:12px">
        <thead><tr>
          <th style="width:110px">Fecha</th>
          ${productos.filter(p => historial.some(inv => inv.items[p.id] > 0))
            .map(p => `<th style="text-align:right;white-space:nowrap">${escapeHtml(p.nombre)}</th>`).join('')}
          <th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>
          ${historial.map(inv => {
            const activeProd = productos.filter(p => historial.some(i => i.items[p.id] > 0));
            const total = Object.values(inv.items).reduce((s,v) => s + (v||0), 0);
            return `<tr>
              <td style="font-weight:600;white-space:nowrap">${fmtDate(inv.fecha)}</td>
              ${activeProd.map(p => {
                const q = inv.items[p.id] || 0;
                return `<td style="text-align:right;color:${q>0?'var(--text)':'var(--text-light)'}">${q > 0 ? q : '—'}</td>`;
              }).join('')}
              <td style="text-align:right;font-weight:700">${total}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  </details>
`;
}

function setInventarioFecha(fecha) {
  STATE.inventarioFecha = fecha;
  STATE.inventarioDraft = {};
  // Si hay registro para esa fecha, pre-cargar
  const reg = getInventarioPorFecha(fecha);
  if (reg) Object.assign(STATE.inventarioDraft, { ...reg.items });
  render();
}

function inventarioDraftSet(pId, val) {
  const n = parseInt(val, 10);
  if (!isNaN(n) && n >= 0) STATE.inventarioDraft[pId] = n;
  else delete STATE.inventarioDraft[pId];
}

function limpiarInventarioDraft() {
  STATE.inventarioDraft = {};
  render();
}

function guardarInventario() {
  const fecha = STATE.inventarioFecha || todayStr();
  const items = { ...STATE.inventarioDraft };
  const idx = INVENTARIO.findIndex(inv => inv.fecha === fecha);
  const registro = {
    id: 'INV-' + fecha,
    fecha,
    items,
    creadoPor: STATE.user?.email || '?',
    ts: new Date().toISOString(),
  };
  if (idx >= 0) INVENTARIO[idx] = registro;
  else INVENTARIO.push(registro);
  STATE.inventarioDraft = {};
  saveStorage();
  showNotif('success', 'Inventario guardado para ' + fmtDate(fecha));
  render();
}
