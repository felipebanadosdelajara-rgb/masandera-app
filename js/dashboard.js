// ============================================================

function getDashData() {
  const { period, clienteId } = STATE.dash;
  const now = new Date();
  let desde = null;
  if (period === 'week')    { desde = new Date(now); desde.setDate(now.getDate() - 7); }
  else if (period === 'month')   { desde = new Date(now); desde.setDate(now.getDate() - 30); }
  else if (period === '3months') { desde = new Date(now); desde.setDate(now.getDate() - 90); }
  return PEDIDOS.filter(p => {
    if (['rechazado','borrador'].includes(p.status)) return false;
    if (clienteId !== 'all' && p.clienteId !== clienteId) return false;
    if (desde && new Date(p.fechaPedido) < desde) return false;
    return true;
  });
}

// Like getDashData but also filters to pedidos that contain a given product
function getDashDataWithProduct(productoId) {
  const base = getDashData();
  if (productoId === 'all') return base;
  return base.filter(p => p.items.some(i => i.pId === productoId));
}

function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1);
  const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${mon.getDate()} ${m[mon.getMonth()]}`;
}

function renderDashboard() {
  const data = getDashData();
  const { period, clienteId } = STATE.dash;

  // KPIs
  const totalVentas  = data.filter(p=>p.status==='facturado').reduce((s,p)=>s+p.total,0);
  const totalActivos = data.filter(p=>['aprobado','en_produccion'].includes(p.status)).reduce((s,p)=>s+p.total,0);
  const totalUnidades = data.reduce((s,p)=>s+p.items.reduce((ss,i)=>ss+i.qty,0),0);
  const ticketProm   = data.length ? Math.round(data.reduce((s,p)=>s+p.total,0)/data.length) : 0;
  const nPedidos     = data.length;

  return `
  <!-- FILTROS -->
  <div class="dash-filters">
    <label>Período:</label>
    ${[['all','Todo'],['month','Último mes'],['3months','Últimos 3 meses'],['week','Última semana']].map(([v,l])=>
      `<button class="dash-filter-btn ${period===v?'active':''}" onclick="setDashFilter('period','${v}')">${l}</button>`
    ).join('')}
    <div style="width:1px;height:20px;background:var(--border);margin:0 4px"></div>
    <label>Cliente:</label>
    <select class="dash-filter-select" onchange="setDashFilter('clienteId',this.value)">
      <option value="all" ${clienteId==='all'?'selected':''}>Todos los clientes</option>
      ${DATA.clientes.map(c=>`<option value="${c.id}" ${clienteId===c.id?'selected':''}>${c.nombre}</option>`).join('')}
    </select>
    <div style="width:1px;height:20px;background:var(--border);margin:0 4px"></div>
    <label>Producto:</label>
    <select class="dash-filter-select" onchange="setDashFilter('productoId',this.value)">
      <option value="all" ${STATE.dash.productoId==='all'?'selected':''}>Todos los productos</option>
      ${[...new Set(DATA.productos.map(p=>p.tipo))].map(tipo=>`
        <optgroup label="— ${tipo}">
          ${DATA.productos.filter(p=>p.tipo===tipo).map(p=>`
            <option value="${p.id}" ${STATE.dash.productoId===p.id?'selected':''}>${p.nombre}</option>
          `).join('')}
        </optgroup>`).join('')}
    </select>
  </div>

  <!-- KPIs -->
  <div class="dash-kpi-row">
    <div class="dash-kpi kpi-primary">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <span class="kpi-label">Total Facturado</span>
        <span style="color:var(--primary)">${icon('receipt')}</span>
      </div>
      <div class="kpi-value" style="font-size:22px">${fmt(totalVentas)}</div>
      <div class="kpi-sub">${data.filter(p=>p.status==='facturado').length} pedidos facturados</div>
    </div>
    <div class="dash-kpi kpi-blue">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <span class="kpi-label">En Producción</span>
        <span style="color:var(--status-approved)">${icon('gear')}</span>
      </div>
      <div class="kpi-value" style="font-size:22px">${fmt(totalActivos)}</div>
      <div class="kpi-sub">${data.filter(p=>['aprobado','en_produccion'].includes(p.status)).length} pedidos aprobados</div>
    </div>
    <div class="dash-kpi kpi-green">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <span class="kpi-label">Unidades Totales</span>
        <span style="color:var(--status-prod)">${icon('package')}</span>
      </div>
      <div class="kpi-value">${totalUnidades.toLocaleString('es-CL')}</div>
      <div class="kpi-sub">en ${nPedidos} pedidos</div>
    </div>
    <div class="dash-kpi kpi-gold">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <span class="kpi-label">Ticket Promedio</span>
        <span style="color:var(--status-prod)">${icon('barChart')}</span>
      </div>
      <div class="kpi-value" style="font-size:22px">${fmt(ticketProm)}</div>
      <div class="kpi-sub">por pedido</div>
    </div>
  </div>

  <!-- FILA 1: Ventas semanales + Categorías -->
  <div class="dash-charts-row wide">
    <div class="dash-chart-card">
      <div class="dash-chart-title">Ventas por Semana</div>
      <div class="dash-chart-sub">Monto total de pedidos agrupado por semana de inicio</div>
      <div class="chart-container tall"><canvas id="chartSemana"></canvas></div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-title">Distribución por Categoría</div>
      <div class="dash-chart-sub">Unidades vendidas: Brioche vs Masa Madre</div>
      <div class="chart-container"><canvas id="chartCategoria"></canvas></div>
    </div>
  </div>

  <!-- FILA 2: Clientes + Productos -->
  <div class="dash-charts-row">
    <div class="dash-chart-card">
      <div class="dash-chart-title">Ventas por Cliente</div>
      <div class="dash-chart-sub">Ranking por monto total (todos los estados activos)</div>
      ${renderClienteRanking(data)}
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-title">Top 8 Productos</div>
      <div class="dash-chart-sub">Por unidades pedidas</div>
      <div class="chart-container tall"><canvas id="chartProductos"></canvas></div>
    </div>
  </div>

  <!-- FILA 3: Consulta por Producto -->
  ${renderProductoBlock(data)}

  <!-- FILA 4: Tabla de últimos pedidos -->
  <div class="dash-chart-card" style="margin-top:0">
    <div class="dash-chart-title">Actividad Reciente</div>
    <div class="dash-chart-sub">Últimos 8 pedidos del período seleccionado</div>
    ${renderRecentTable(data)}
  </div>`;
}

function renderProductoBlock(data) {
  const { productoId } = STATE.dash;
  const prod = productoId !== 'all' ? getProducto(productoId) : null;

  if (!prod) {
    // Show top products ranking with bar chart placeholder
    const prodMap = {};
    data.forEach(p => p.items.forEach(i => { prodMap[i.pId] = (prodMap[i.pId]||0) + i.qty; }));
    const sorted = Object.entries(prodMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const max = sorted[0]?.[1] || 1;
    const colors = ['#C05A24','#2D4A3E','#2C6FBF','#C4862D','#7B5EA7','#C42D2D','#5A9E6F','#8B6914','#3A7BC8','#9E4719'];
    return `
    <div class="dash-chart-card" style="margin-bottom:20px">
      <div class="dash-chart-title">${icon('search')} Consulta por Producto</div>
      <div class="dash-chart-sub">Selecciona un producto en el filtro superior para ver su análisis detallado. Ranking general del período:</div>
      <div class="dash-ranking" style="margin-top:16px">
        ${sorted.map(([pId,qty],i)=>{
          const p2 = getProducto(pId);
          const catLabel = p2?.categoria === 'brioche' ? 'Brioche' : 'MM';
          return `<div class="dash-rank-row">
            <div class="dash-rank-num">${i+1}</div>
            <div class="dash-rank-name"><span class="cat-badge cat-${p2?.categoria}" style="font-size:10px;margin-right:4px">${catLabel}</span>${p2?p2.nombre:'?'}</div>
            <div class="dash-rank-bar-wrap">
              <div class="dash-rank-bar" style="width:${Math.round(qty/max*100)}%;background:${colors[i%colors.length]}"></div>
            </div>
            <div class="dash-rank-val">${qty.toLocaleString('es-CL')} uds</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // Specific product selected — full analysis
  const pedidosConProd = getDashDataWithProduct(productoId);
  const totalQty    = pedidosConProd.reduce((s,p)=>s+p.items.filter(i=>i.pId===productoId).reduce((ss,i)=>ss+i.qty,0),0);
  const totalMonto  = pedidosConProd.reduce((s,p)=>s+p.items.filter(i=>i.pId===productoId).reduce((ss,i)=>ss+i.qty*i.price,0),0);
  const nPedidos    = pedidosConProd.length;
  const avgQtyPedido = nPedidos ? Math.round(totalQty/nPedidos) : 0;

  // By client
  const byCliente = {};
  pedidosConProd.forEach(p=>{
    const qty = p.items.filter(i=>i.pId===productoId).reduce((s,i)=>s+i.qty,0);
    byCliente[p.clienteId] = (byCliente[p.clienteId]||0) + qty;
  });
  const clientesSorted = Object.entries(byCliente).sort((a,b)=>b[1]-a[1]);
  const maxC = clientesSorted[0]?.[1] || 1;
  const colors = ['#C05A24','#2D4A3E','#2C6FBF','#C4862D','#7B5EA7'];

  // By week
  const byWeek = {};
  pedidosConProd.forEach(p=>{
    const wk = getWeekLabel(p.fechaPedido);
    const qty = p.items.filter(i=>i.pId===productoId).reduce((s,i)=>s+i.qty,0);
    byWeek[wk] = (byWeek[wk]||0) + qty;
  });

  // Detail table
  const detalle = [...pedidosConProd].sort((a,b)=>b.id.localeCompare(a.id)).slice(0,10);

  return `
  <div class="dash-chart-card" style="margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <div class="dash-chart-title">${icon('search')} Consulta: ${prod.nombre}</div>
        <div class="dash-chart-sub">${prod.tipo} · <span class="cat-badge cat-${prod.categoria}" style="font-size:10px">${prod.categoria==='brioche'?'Brioche':'Masa Madre'}</span> · ${prod.unidad}</div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:24px;color:var(--primary)">${totalQty.toLocaleString('es-CL')}</div>
          <div style="font-size:11px;color:var(--text-light);font-weight:700;text-transform:uppercase">Unidades totales</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:24px;color:var(--secondary)">${fmt(totalMonto)}</div>
          <div style="font-size:11px;color:var(--text-light);font-weight:700;text-transform:uppercase">Monto total</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:24px;color:#2C6FBF">${nPedidos}</div>
          <div style="font-size:11px;color:var(--text-light);font-weight:700;text-transform:uppercase">Pedidos</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:24px;color:#C4862D">${avgQtyPedido}</div>
          <div style="font-size:11px;color:var(--text-light);font-weight:700;text-transform:uppercase">Prom. uds/pedido</div>
        </div>
      </div>
    </div>

    <div class="dash-charts-row" style="margin-bottom:20px">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text-mid);margin-bottom:12px">Unidades por cliente</div>
        <div class="dash-ranking">
          ${clientesSorted.map(([cId,qty],i)=>{
            const c = getCliente(cId);
            return `<div class="dash-rank-row">
              <div class="dash-rank-num">${i+1}</div>
              <div class="dash-rank-name">${c?c.nombre:cId}</div>
              <div class="dash-rank-bar-wrap">
                <div class="dash-rank-bar" style="width:${Math.round(qty/maxC*100)}%;background:${colors[i%colors.length]}"></div>
              </div>
              <div class="dash-rank-val">${qty} uds</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text-mid);margin-bottom:12px">Unidades por semana</div>
        <div class="chart-container tall"><canvas id="chartProdSemana"></canvas></div>
      </div>
    </div>

    <div style="font-size:13px;font-weight:700;color:var(--text-mid);margin-bottom:10px">Detalle de pedidos que incluyen este producto</div>
    <div style="overflow-x:auto">
    <table class="dash-recent-table">
      <thead><tr>
        <th>Pedido</th><th>Cliente</th><th>Fecha pedido</th><th>Despacho</th>
        <th style="text-align:right">Cantidad</th><th style="text-align:right">Precio unit.</th><th style="text-align:right">Subtotal</th><th>Estado</th>
      </tr></thead>
      <tbody>
        ${detalle.map(p=>{
          const c = getCliente(p.clienteId);
          const item = p.items.find(i=>i.pId===productoId);
          return `<tr>
            <td><strong>${p.id}</strong></td>
            <td>${c?c.nombre:'-'}</td>
            <td>${fmtDate(p.fechaPedido)}</td>
            <td>${fmtDate(p.fechaDespacho)}</td>
            <td style="text-align:right;font-weight:700">${item?item.qty:0}</td>
            <td style="text-align:right;color:var(--text-light)">${item?fmt(item.price):'-'}</td>
            <td style="text-align:right;font-weight:700">${item?fmt(item.qty*item.price):'-'}</td>
            <td><span class="status-badge badge-${p.status}">${statusIcon(p.status)} ${statusLabel(p.status)}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>`;
}

function renderClienteRanking(data) {
  const byCliente = {};
  DATA.clientes.forEach(c => { byCliente[c.id] = 0; });
  data.forEach(p => { byCliente[p.clienteId] = (byCliente[p.clienteId]||0) + p.total; });
  const sorted = DATA.clientes
    .map(c => ({ c, total: byCliente[c.id]||0 }))
    .filter(x => x.total > 0)
    .sort((a,b) => b.total - a.total);
  const max = sorted[0]?.total || 1;
  const colors = ['#C05A24','#2D4A3E','#2C6FBF','#C4862D','#7B5EA7'];
  return `<div class="dash-ranking" style="margin-top:12px">
    ${sorted.map((x,i) => `
    <div class="dash-rank-row">
      <div class="dash-rank-num">${i+1}</div>
      <div class="dash-rank-name">${x.c.nombre}</div>
      <div class="dash-rank-bar-wrap">
        <div class="dash-rank-bar" style="width:${Math.round(x.total/max*100)}%;background:${colors[i%colors.length]}"></div>
      </div>
      <div class="dash-rank-val">${fmt(x.total)}</div>
    </div>`).join('')}
  </div>`;
}

function renderRecentTable(data) {
  const recent = [...data].sort((a,b)=>b.id.localeCompare(a.id)).slice(0,8);
  if (!recent.length) return `<div class="empty-state"><div class="empty-state-icon">${ICON.clipboardList}</div><h3>Sin actividad</h3></div>`;
  return `<div style="overflow-x:auto;margin-top:12px">
  <table class="dash-recent-table">
    <thead><tr>
      <th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Despacho</th><th>Unidades</th><th style="text-align:right">Total</th><th>Estado</th>
    </tr></thead>
    <tbody>
    ${recent.map(p=>{
      const c = getCliente(p.clienteId);
      const uds = p.items.reduce((s,i)=>s+i.qty,0);
      return `<tr>
        <td><strong>${p.id}</strong></td>
        <td>${c?c.nombre:'-'}</td>
        <td>${fmtDate(p.fechaPedido)}</td>
        <td>${fmtDate(p.fechaDespacho)}</td>
        <td>${uds}</td>
        <td style="text-align:right;font-weight:700">${fmt(p.total)}</td>
        <td><span class="status-badge badge-${p.status}">${statusIcon(p.status)} ${statusLabel(p.status)}</span></td>
      </tr>`;
    }).join('')}
    </tbody>
  </table></div>`;
}

function setDashFilter(key, val) {
  STATE.dash[key] = val;
  render();
}

// ============================================================
// Chart.js initialization
// ============================================================
function initDashboardCharts() {
  const data = getDashData();
  const PALETTE = ['#C05A24','#2D4A3E','#2C6FBF','#C4862D','#7B5EA7','#C42D2D','#5A9E6F','#8B6914'];
  const defaults = {
    font: { family: 'DM Sans' },
    color: '#5A534B',
  };
  Chart.defaults.font.family = 'DM Sans';
  Chart.defaults.color = '#5A534B';

  // ── 1. Ventas por semana (bar) ──────────────────────────────
  const weekMap = {};
  data.forEach(p => {
    const wk = getWeekLabel(p.fechaPedido);
    weekMap[wk] = (weekMap[wk]||0) + p.total;
  });
  const weekKeys = Object.keys(weekMap).sort((a,b)=>{
    const toDate = s => {
      const [d,m] = s.split(' ');
      const ms = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return new Date(new Date().getFullYear(), ms.indexOf(m), parseInt(d));
    };
    return toDate(a) - toDate(b);
  });
  const cSemana = document.getElementById('chartSemana');
  if (cSemana) {
    _charts.semana = new Chart(cSemana, {
      type: 'bar',
      data: {
        labels: weekKeys,
        datasets: [{
          label: 'Ventas',
          data: weekKeys.map(k => weekMap[k]),
          backgroundColor: PALETTE[0] + 'CC',
          borderColor: PALETTE[0],
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { label: ctx => ' ' + fmt(ctx.raw) }
        }},
        scales: {
          y: { ticks: { callback: v => '$'+Math.round(v/1000)+'k' }, grid: { color: '#F0EDE5' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // ── 2. Donut Categorías ─────────────────────────────────────
  let brioQty = 0, mmQty = 0;
  data.forEach(p => p.items.forEach(i => {
    const prod = getProducto(i.pId);
    if (prod?.categoria === 'brioche') brioQty += i.qty; else mmQty += i.qty;
  }));
  const cCat = document.getElementById('chartCategoria');
  if (cCat) {
    _charts.cat = new Chart(cCat, {
      type: 'doughnut',
      data: {
        labels: ['Masa Madre', 'Brioche'],
        datasets: [{
          data: [mmQty, brioQty],
          backgroundColor: [PALETTE[1]+'DD', PALETTE[0]+'DD'],
          borderColor: ['#fff','#fff'],
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 13 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} uds` } }
        }
      }
    });
  }

  // ── Producto específico: unidades por semana ────────────────
  const { productoId } = STATE.dash;
  if (productoId !== 'all') {
    const pedProd = getDashDataWithProduct(productoId);
    const pwMap = {};
    pedProd.forEach(p => {
      const wk = getWeekLabel(p.fechaPedido);
      const qty = p.items.filter(i=>i.pId===productoId).reduce((s,i)=>s+i.qty,0);
      pwMap[wk] = (pwMap[wk]||0) + qty;
    });
    const pwKeys = Object.keys(pwMap).sort((a,b)=>{
      const toD = s => {
        const [d,m] = s.split(' ');
        const ms = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        return new Date(new Date().getFullYear(), ms.indexOf(m), parseInt(d));
      };
      return toD(a)-toD(b);
    });
    const cPS = document.getElementById('chartProdSemana');
    if (cPS) {
      _charts.prodSemana = new Chart(cPS, {
        type: 'line',
        data: {
          labels: pwKeys,
          datasets: [{
            label: 'Unidades',
            data: pwKeys.map(k=>pwMap[k]),
            borderColor: PALETTE[1],
            backgroundColor: PALETTE[1]+'22',
            pointBackgroundColor: PALETTE[1],
            tension: 0.3,
            fill: true,
            borderWidth: 2.5,
            pointRadius: 5,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${ctx.raw} unidades`}}},
          scales: {
            y: { grid:{color:'#F0EDE5'}, ticks:{stepSize:1} },
            x: { grid:{display:false} }
          }
        }
      });
    }
  }

  // ── 3. Top Productos (horizontal bar) ───────────────────────
  const prodMap = {};
  data.forEach(p => p.items.forEach(i => {
    prodMap[i.pId] = (prodMap[i.pId]||0) + i.qty;
  }));
  const sortedProds = Object.entries(prodMap)
    .sort((a,b)=>b[1]-a[1]).slice(0,8);
  const cProd = document.getElementById('chartProductos');
  if (cProd) {
    _charts.prods = new Chart(cProd, {
      type: 'bar',
      data: {
        labels: sortedProds.map(([id]) => {
          const p = getProducto(id);
          return p ? (p.nombre.length > 18 ? p.nombre.slice(0,16)+'…' : p.nombre) : id;
        }),
        datasets: [{
          label: 'Unidades',
          data: sortedProds.map(([,v]) => v),
          backgroundColor: sortedProds.map((_,i) => PALETTE[i % PALETTE.length] + 'CC'),
          borderColor:      sortedProds.map((_,i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1.5,
          borderRadius: 5,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { label: ctx => ` ${ctx.raw} unidades` }
        }},
        scales: {
          x: { grid: { color: '#F0EDE5' } },
          y: { grid: { display: false }, ticks: { font: { size: 12 } } }
        }
      }
    });
  }
}

