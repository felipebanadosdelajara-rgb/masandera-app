// ============================================================
// FACTURACION (vista gerente — tab 3)
// ============================================================
function renderFacturacion(facturadosAll) {
  const porFacturar = PEDIDOS.filter(p => p.status === 'aprobado')
    .sort((a,b) => a.fechaDespacho.localeCompare(b.fechaDespacho));
  const facturados  = facturadosAll; // already filtered by gerente.js (status==='facturado')
  const sinRut      = porFacturar.filter(p => { const c = getCliente(p.clienteId); return !c?.rut; });

  // KPI totals
  const netoPendiente  = porFacturar.reduce((s,p) => s + p.total, 0);
  const ivaPendiente   = Math.round(netoPendiente * 0.19);
  const totalPendiente = netoPendiente + ivaPendiente;
  const netoFact       = facturados.reduce((s,p) => s + p.total, 0);
  const totalFact      = Math.round(netoFact * 1.19);

  // Per-client breakdown of pending
  const porCliente = {};
  porFacturar.forEach(p => {
    const cId = p.clienteId;
    if (!porCliente[cId]) porCliente[cId] = { nombre: getCliente(cId)?.nombre||'?', neto: 0, count: 0 };
    porCliente[cId].neto  += p.total;
    porCliente[cId].count += 1;
  });
  const clienteRank = Object.entries(porCliente).sort((a,b) => b[1].neto - a[1].neto);

  const today = new Date(todayStr());
  const diasPromedio = porFacturar.length
    ? Math.round(porFacturar.reduce((s,p) => {
        const diff = (today - new Date(p.fechaDespacho)) / 86400000;
        return s + Math.max(0, diff);
      }, 0) / porFacturar.length)
    : 0;

  return `
  <!-- KPIs de facturación -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:28px">
    <div class="card" style="padding:18px 20px;border-left:4px solid ${porFacturar.length > 0 ? 'var(--status-pending)' : 'var(--status-approved)'}">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-light);margin-bottom:6px">Pendientes</div>
      <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:${porFacturar.length > 0 ? 'var(--status-pending)' : 'var(--status-approved)'}">${porFacturar.length}</div>
      <div style="font-size:12px;color:var(--text-light);margin-top:4px">pedido${porFacturar.length!==1?'s':''}</div>
    </div>
    <div class="card" style="padding:18px 20px;border-left:4px solid var(--status-pending)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-light);margin-bottom:6px">Neto por facturar</div>
      <div style="font-family:var(--font-display);font-size:22px;font-weight:700">${fmt(netoPendiente)}</div>
      <div style="font-size:12px;color:var(--text-light);margin-top:4px">+ IVA: ${fmt(ivaPendiente)} = <strong>${fmt(totalPendiente)}</strong></div>
    </div>
    <div class="card" style="padding:18px 20px;border-left:4px solid var(--status-approved)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-light);margin-bottom:6px">Facturado (total)</div>
      <div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--status-approved)">${fmt(netoFact)}</div>
      <div style="font-size:12px;color:var(--text-light);margin-top:4px">${facturados.length} pedidos · con IVA: ${fmt(totalFact)}</div>
    </div>
    <div class="card" style="padding:18px 20px;border-left:4px solid ${sinRut.length > 0 ? 'var(--status-rejected)' : 'var(--border)'}">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-light);margin-bottom:6px">Sin RUT registrado</div>
      <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:${sinRut.length > 0 ? 'var(--status-rejected)' : 'var(--status-approved)'}">${sinRut.length}</div>
      <div style="font-size:12px;color:var(--text-light);margin-top:4px">${sinRut.length > 0 ? 'clientes pendientes' : 'Todos con RUT OK'}</div>
    </div>
  </div>

  <!-- Resumen por cliente + alertas -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px">
    <div class="card" style="padding:20px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-mid);margin-bottom:14px">${icon('building')} Por facturar por cliente</div>
      ${clienteRank.length === 0
        ? `<div style="font-size:13px;color:var(--status-approved)">${icon('check')} Ninguno pendiente</div>`
        : clienteRank.map(([cId, d]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light)">
            <div>
              <div style="font-size:13px;font-weight:600">${d.nombre}</div>
              <div style="font-size:11px;color:var(--text-light)">${d.count} pedido${d.count!==1?'s':''}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:700">${fmt(d.neto)}</div>
              <div style="font-size:11px;color:var(--text-light)">c/IVA: ${fmt(Math.round(d.neto*1.19))}</div>
            </div>
          </div>`).join('')
      }
    </div>
    <div class="card" style="padding:20px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-mid);margin-bottom:14px">${icon('info')} Alertas de control</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${porFacturar.length === 0
          ? `<div style="display:flex;gap:10px;padding:10px;background:var(--status-approved-bg);border-radius:8px;border:1px solid var(--status-approved)">
              <span style="color:var(--status-approved)">${icon('check')}</span>
              <span style="font-size:13px;font-weight:600;color:var(--status-approved)">Facturación al día</span>
            </div>`
          : `<div style="display:flex;gap:10px;padding:10px;background:#fffbeb;border-radius:8px;border:1px solid #fcd34d">
              <span style="color:var(--status-pending)">${icon('inbox')}</span>
              <div><div style="font-size:13px;font-weight:600">${porFacturar.length} pedido${porFacturar.length!==1?'s':''} esperando factura</div>
              <div style="font-size:11px;color:var(--text-light)">Promedio ${diasPromedio} día${diasPromedio!==1?'s':''} desde despacho</div></div>
            </div>`
        }
        ${sinRut.length > 0
          ? `<div style="display:flex;gap:10px;padding:10px;background:var(--status-rejected-bg);border-radius:8px;border:1px solid var(--status-rejected)">
              <span style="color:var(--status-rejected)">${icon('xCircle')}</span>
              <div><div style="font-size:13px;font-weight:600;color:var(--status-rejected)">${sinRut.length} cliente${sinRut.length!==1?'s':''} sin RUT</div>
              <div style="font-size:11px;color:var(--text-light)">${sinRut.map(p=>getCliente(p.clienteId)?.nombre||'?').filter((v,i,a)=>a.indexOf(v)===i).join(', ')}</div></div>
            </div>`
          : `<div style="display:flex;gap:10px;padding:10px;background:var(--status-approved-bg);border-radius:8px;border:1px solid var(--status-approved)">
              <span style="color:var(--status-approved)">${icon('check')}</span>
              <span style="font-size:13px;color:var(--status-approved)">Todos los clientes tienen RUT</span>
            </div>`
        }
        ${facturados.filter(p => !p.folio).length > 0
          ? `<div style="display:flex;gap:10px;padding:10px;background:#fffbeb;border-radius:8px;border:1px solid #fcd34d">
              <span style="color:var(--status-pending)">${icon('receipt')}</span>
              <div><div style="font-size:13px;font-weight:600">${facturados.filter(p=>!p.folio).length} factura${facturados.filter(p=>!p.folio).length!==1?'s':''} sin folio DTE</div>
              <div style="font-size:11px;color:var(--text-light)">Marcadas como facturadas sin número de folio</div></div>
            </div>`
          : `<div style="display:flex;gap:10px;padding:10px;background:var(--status-approved-bg);border-radius:8px;border:1px solid var(--status-approved)">
              <span style="color:var(--status-approved)">${icon('check')}</span>
              <span style="font-size:13px;color:var(--status-approved)">Todos los folios DTE registrados</span>
            </div>`
        }
      </div>
    </div>
  </div>

  <!-- Pendientes de facturar -->
  <div style="margin-bottom:28px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-light);margin-bottom:12px">Pendientes de facturar</div>
    ${porFacturar.length === 0
      ? `<div class="empty-state" style="padding:24px 0"><div class="empty-state-icon">${ICON.checkCircle}</div><h3>Sin pendientes</h3><p>Todos los pedidos aprobados han sido facturados.</p></div>`
      : `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow)">
        <table class="fact-table" style="table-layout:fixed;width:100%">
          <colgroup>
            <col style="width:90px">
            <col>
            <col style="width:95px">
            <col style="width:45px">
            <col style="width:95px">
            <col style="width:105px">
            <col style="width:60px">
          </colgroup>
          <thead><tr>
            <th>Pedido</th>
            <th>Cliente / RUT</th>
            <th>Despacho</th>
            <th style="text-align:center">Días</th>
            <th style="text-align:right">Neto</th>
            <th style="text-align:right">Total c/IVA</th>
            <th></th>
          </tr></thead>
          <tbody>${porFacturar.map(p => {
            const c = getCliente(p.clienteId);
            const iva = Math.round(p.total * 0.19);
            const dias = Math.max(0, Math.floor((today - new Date(p.fechaDespacho)) / 86400000));
            const diasColor = dias > 5 ? 'var(--status-rejected)' : dias > 2 ? 'var(--status-pending)' : 'var(--status-approved)';
            return `<tr>
              <td style="font-weight:600;font-size:12px">${p.id}</td>
              <td>
                <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c?.nombre||'?'}</div>
                <div style="font-size:10px;font-family:monospace;color:var(--text-light)">${c?.rut || '<span style="color:var(--status-rejected)">Sin RUT</span>'}</div>
              </td>
              <td style="font-size:12px">${fmtDate(p.fechaDespacho)}</td>
              <td style="font-weight:700;color:${diasColor};text-align:center">${dias}d</td>
              <td style="text-align:right;font-size:13px">${fmt(p.total)}</td>
              <td style="text-align:right;font-weight:700;font-size:13px">${fmt(p.total + iva)}</td>
              <td style="text-align:center">
                <button class="btn btn-ghost btn-sm" style="padding:4px 8px" onclick="openModal('${p.id}')" title="Ver detalle">${icon('search')}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>`
    }
  </div>

  <!-- Historial facturado -->
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-light)">Historial facturado</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="exportarFacturacionPDF()">${icon('download')} PDF</button>
        <button class="btn btn-primary btn-sm" onclick="exportarFacturacionExcel()">${icon('download')} Excel</button>
      </div>
    </div>
    ${facturados.length === 0
      ? `<div class="empty-state" style="padding:24px 0"><div class="empty-state-icon">${ICON.receipt}</div><h3>Sin historial aún</h3><p>Los pedidos facturados aparecerán aquí.</p></div>`
      : `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow);overflow-x:auto">
        <table class="fact-table">
          <thead><tr>
            <th>Pedido</th><th>Cliente</th><th>RUT</th><th>Folio DTE</th>
            <th>Fecha Factura</th><th>Despacho</th>
            <th style="text-align:right">Neto</th><th style="text-align:right">Total c/IVA</th>
          </tr></thead>
          <tbody>${[...facturados].sort((a,b) => (b.fechaFacturacion||'').localeCompare(a.fechaFacturacion||'')).map(p => {
            const c = getCliente(p.clienteId);
            const iva = Math.round(p.total * 0.19);
            const sinFolio = !p.folio;
            return `<tr ${sinFolio ? 'style="background:#fffbeb"' : ''}>
              <td style="font-weight:600">${p.id}</td>
              <td>
                <div style="font-weight:600">${c?.nombre||'?'}</div>
                <div style="font-size:11px;color:var(--text-light)">${c?.razonSocial||''}</div>
              </td>
              <td style="font-family:monospace;font-size:12px">${c?.rut||'—'}</td>
              <td style="font-family:monospace;font-weight:700;color:${sinFolio ? 'var(--status-rejected)' : 'var(--primary)'}">${p.folio || `<span style="font-size:11px">Pendiente</span>`}</td>
              <td>${fmtDate(p.fechaFacturacion)}</td>
              <td>${fmtDate(p.fechaDespacho)}</td>
              <td style="text-align:right">${fmt(p.total)}</td>
              <td style="text-align:right;font-weight:700">${fmt(p.total+iva)}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>`
    }
  </div>`;
}

// ============================================================
// PDF Export for Invoicing
// ============================================================
function exportarFacturacionPDF() {
  const { period, clienteId } = STATE.factFilter;
  let facturados = PEDIDOS.filter(p => p.status === 'facturado');
  if (clienteId !== 'all') facturados = facturados.filter(p => p.clienteId === clienteId);
  if (period !== 'all') {
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const desde = new Date(now); desde.setDate(now.getDate() - days);
    facturados = facturados.filter(p => new Date(p.fechaFacturacion || p.fechaPedido) >= desde);
  }
  if (!facturados.length) { showNotif('error', 'No hay registros para exportar con los filtros actuales.'); return; }

  facturados.sort((a,b) => (b.fechaFacturacion||'').localeCompare(a.fechaFacturacion||''));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const primary  = [192, 90, 36];
  const secondary = [45, 74, 62];
  const totalMonto = facturados.reduce((s,p) => s+p.total, 0);
  const totalUds   = facturados.reduce((s,p) => s+p.items.reduce((ss,i)=>ss+i.qty,0), 0);

  // Header
  doc.setFontSize(22); doc.setTextColor(...primary);
  doc.text('LA MASANDERA', 105, 20, { align:'center' });
  doc.setFontSize(10); doc.setTextColor(155, 145, 136);
  doc.text('Panadería Artesanal · Curacaví', 105, 27, { align:'center' });

  doc.setFontSize(16); doc.setTextColor(...secondary);
  doc.text('Reporte de Facturación', 105, 40, { align:'center' });

  doc.setFontSize(10); doc.setTextColor(0,0,0);
  const periodoLabel = period === 'all' ? 'Todo el historial' : period === 'week' ? 'Última semana' : period === 'month' ? 'Último mes' : 'Últimos 3 meses';
  const clienteLabel = clienteId === 'all' ? 'Todos los clientes' : (getCliente(clienteId)?.nombre || clienteId);
  doc.text(`Período: ${periodoLabel} · Cliente: ${clienteLabel}`, 105, 49, { align:'center' });
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 105, 55, { align:'center' });

  doc.setDrawColor(...primary); doc.setLineWidth(0.5);
  doc.line(14, 60, 196, 60);

  // Table header
  let y = 70;
  doc.setFillColor(240, 237, 229);
  doc.rect(14, y-5, 182, 7, 'F');
  doc.setFontSize(8); doc.setTextColor(90, 83, 75);
  doc.text('N° Pedido', 16, y);
  doc.text('Cliente', 40, y);
  doc.text('Despacho', 90, y);
  doc.text('Facturado', 120, y);
  doc.text('Uds', 152, y);
  doc.text('Total', 182, y, { align:'right' });
  y += 8;

  doc.setTextColor(26, 23, 20); doc.setFontSize(9);
  facturados.forEach(p => {
    if (y > 270) { doc.addPage(); y = 20; }
    const c = getCliente(p.clienteId);
    const uds = p.items.reduce((s,i)=>s+i.qty,0);
    doc.text(p.id, 16, y);
    doc.text((c?.nombre || '-').slice(0,22), 40, y);
    doc.text(fmtDate(p.fechaDespacho), 90, y);
    doc.text(fmtDate(p.fechaFacturacion) || '-', 120, y);
    doc.text(String(uds), 152, y);
    doc.setFont(undefined,'bold');
    doc.text(fmt(p.total), 182, y, { align:'right' });
    doc.setFont(undefined,'normal');
    y += 6;
  });

  // Total line
  doc.setDrawColor(...primary); doc.line(14, y+2, 196, y+2); y += 10;
  doc.setFontSize(11); doc.setTextColor(...primary); doc.setFont(undefined,'bold');
  doc.text(`TOTAL: ${fmt(totalMonto)}`, 182, y, { align:'right' });
  doc.setFontSize(9); doc.setTextColor(155,145,136); doc.setFont(undefined,'normal');
  doc.text(`${facturados.length} pedidos · ${totalUds} unidades`, 16, y);

  // Desglose por cliente
  if (clienteId === 'all') {
    y += 16;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.setTextColor(...secondary); doc.setFont(undefined,'bold');
    doc.text('Desglose por cliente', 16, y); y += 8;
    doc.setFont(undefined,'normal');
    const porCliente = {};
    facturados.forEach(p => { porCliente[p.clienteId] = (porCliente[p.clienteId]||0) + p.total; });
    Object.entries(porCliente).sort((a,b)=>b[1]-a[1]).forEach(([cId, tot]) => {
      if (y > 275) { doc.addPage(); y = 20; }
      const c = getCliente(cId);
      doc.setFontSize(9); doc.setTextColor(26,23,20);
      doc.text(c?.nombre || cId, 20, y);
      doc.setFont(undefined,'bold');
      doc.text(fmt(tot), 182, y, { align:'right' });
      doc.setFont(undefined,'normal');
      y += 6;
    });
  }

  doc.setFontSize(7); doc.setTextColor(155,145,136);
  doc.text('La Masandera — Panadería Artesanal', 105, 289, { align:'center' });

  const filename = `Facturacion_LaMasandera_${todayStr()}.pdf`;
  doc.save(filename);
  logAction('invoicing_pdf_exported', { records: facturados.length, total: totalMonto });
  showNotif('success', `Reporte PDF descargado: ${filename}`);
}

// ============================================================
// Excel Export for Invoicing
// ============================================================
function exportarFacturacionExcel() {
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
    showNotif('error', 'No hay registros de facturación para exportar.');
    return;
  }

  const rows = facturados
    .sort((a,b) => (b.fechaFacturacion||'').localeCompare(a.fechaFacturacion||''))
    .map(p => {
      const cliente = getCliente(p.clienteId);
      const productos = p.items.map(i => {
        const prod = getProducto(i.pId);
        return `${prod ? prod.nombre : '?'} x${i.qty}`;
      }).join(', ');
      const unidades = p.items.reduce((s, i) => s + i.qty, 0);
      return {
        'N° Pedido': p.id,
        'Cliente': cliente ? cliente.nombre : '-',
        'RUT': cliente ? cliente.rut : '-',
        'Fecha Pedido': p.fechaPedido,
        'Fecha Despacho': p.fechaDespacho,
        'Fecha Facturación': p.fechaFacturacion || '-',
        'Productos': productos,
        'Unidades': unidades,
        'Total ($)': p.total,
      };
    });

  const totalMonto = rows.reduce((s, r) => s + r['Total ($)'], 0);
  const totalUds   = rows.reduce((s, r) => s + r['Unidades'], 0);
  rows.push({
    'N° Pedido': '', 'Cliente': '', 'RUT': '', 'Fecha Pedido': '',
    'Fecha Despacho': '', 'Fecha Facturación': 'TOTALES',
    'Productos': `${facturados.length} pedidos`, 'Unidades': totalUds, 'Total ($)': totalMonto,
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch:12 },{ wch:22 },{ wch:14 },{ wch:14 },
    { wch:14 },{ wch:16 },{ wch:40 },{ wch:10 },{ wch:14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Facturación');

  const filename = `Facturacion_LaMasandera_${todayStr()}.xlsx`;
  XLSX.writeFile(wb, filename);
  logAction('invoicing_exported', { records: facturados.length, total: totalMonto });
  showNotif('success', `Reporte de facturación descargado: ${filename}`);
}
