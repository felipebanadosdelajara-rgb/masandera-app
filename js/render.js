// ============================================================
// RENDER ENGINE
// ============================================================

// Restore session on page load
function restoreSession() {
  const session = getSession();
  if (session) {
    const user = DATA.usuarios.find(u => u.id === session.userId);
    if (user && user.activo !== false) {
      STATE.user = user;
      STATE.page = user.rol;
    } else {
      clearSession();
    }
  }
}

// Destroy existing Chart.js instances before re-render
const _charts = {};
function destroyCharts() {
  Object.keys(_charts).forEach(k => { try { _charts[k].destroy(); } catch(e){} delete _charts[k]; });
}

function render() {
  destroyCharts();
  const app = document.getElementById('app');
  if (STATE.page === 'login') {
    app.innerHTML = renderLogin();
  } else {
    app.innerHTML = renderShell();
    // A1: persistir estado después de cada render autenticado
    saveStorage();
  }
  if (STATE.modal)           app.innerHTML += renderModal();
  if (STATE.editingOrderId)  app.innerHTML += renderEditModal();
  if (STATE.resetPassUserId) app.innerHTML += renderResetPasswordModal(); // A4
  if (STATE.notif)           app.innerHTML += renderNotif();
  bindEvents();
  // Init charts after DOM settles
  if (STATE.user?.rol === 'gerente' && STATE.tab === 4) { // Dashboard tab
    requestAnimationFrame(() => requestAnimationFrame(initDashboardCharts));
  }
}

// ============================================================
// LOGIN
// ============================================================
function renderLogin() {
  return `
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-logo">
        <div class="login-brand-icon">${ICON.wheat}</div>
        <span class="brand-name">La Masandera</span>
        <span class="brand-sub">Gestión de Pedidos</span>
      </div>
      <form id="loginForm">
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input class="form-input" type="email" id="loginEmail" placeholder="correo@ejemplo.cl" value="${STATE.loginEmail}" autocomplete="username">
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input class="form-input" type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password">
        </div>
        ${STATE.loginError ? `<p style="color:var(--status-rejected);font-size:13px;margin-bottom:12px;">⚠️ ${STATE.loginError}</p>` : ''}
        <button type="submit" class="btn btn-primary btn-full">Ingresar</button>
      </form>

      <div class="demo-creds">
        <h4>Accesos de demostración — clic para ingresar</h4>
        <div class="demo-cred-item" onclick="quickLogin('admin@masandera.cl','admin')">
          <div><div class="demo-cred-role">${icon('shield')} Gerente</div><div class="demo-cred-email">admin@masandera.cl</div></div>
          <span class="demo-pass">admin</span>
        </div>
        <div class="demo-cred-item" onclick="quickLogin('produccion@masandera.cl','prod')">
          <div><div class="demo-cred-role">${icon('gear')} Producción</div><div class="demo-cred-email">produccion@masandera.cl</div></div>
          <span class="demo-pass">prod</span>
        </div>
        <div class="demo-cred-item" onclick="quickLogin('lamadre@cliente.cl','pass')">
          <div><div class="demo-cred-role">${icon('building')} La Madre (Distribuidor)</div><div class="demo-cred-email">lamadre@cliente.cl</div></div>
          <span class="demo-pass">pass</span>
        </div>
        <div class="demo-cred-item" onclick="quickLogin('elpatio@cliente.cl','pass')">
          <div><div class="demo-cred-role">${icon('package')} El Patio (Cliente Final)</div><div class="demo-cred-email">elpatio@cliente.cl</div></div>
          <span class="demo-pass">pass</span>
        </div>
        <div class="demo-cred-item" onclick="quickLogin('facturacion@masandera.cl','fact')">
          <div><div class="demo-cred-role">${icon('receipt')} Facturación</div><div class="demo-cred-email">facturacion@masandera.cl</div></div>
          <span class="demo-pass">fact</span>
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================================
// HELPERS DE SHELL
// ============================================================

/** Devuelve el nombre de la sección activa para mostrar en topbar */
function getSectionName() {
  if (!STATE.user) return '';
  const maps = {
    cliente:     ['Nuevo Pedido', 'Mis Pedidos'],
    produccion:  ['Plan de Producción'],
    gerente:     ['Por Revisar', 'Plan de Producción', 'Historial', 'Facturación', 'Dashboard', 'Usuarios', 'Actividad', 'Catálogo', 'Clientes'],
    facturacion: ['Pendientes de Facturar', 'Historial Facturado'],
  };
  return maps[STATE.user.rol]?.[STATE.tab] || '';
}

/** Dropdown de notificaciones en topbar */
function renderNotifDropdown() {
  const notifs = getMyNotifications();
  return `
  <div class="notif-dropdown" onclick="event.stopPropagation()">
    <div class="notif-dropdown-header">
      <strong>Notificaciones</strong>
      ${notifs.length > 0
        ? `<button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:11px"
             onclick="markAllNotificationsRead()">Marcar todas ✓</button>`
        : ''}
    </div>
    ${notifs.length === 0
      ? `<div class="notif-empty">Sin notificaciones nuevas</div>`
      : notifs.slice(0, 8).map(n => `
          <div class="notif-item notif-item--${n.type}">
            <div class="notif-item-msg">${escapeHtml(n.message)}</div>
            <div class="notif-item-time">${new Date(n.timestamp).toLocaleString('es-CL')}</div>
            <button class="notif-item-dismiss" onclick="markNotificationRead('${n.id}')">✕</button>
          </div>`).join('')}
  </div>`;
}

// ============================================================
// SHELL
// ============================================================
function renderShell() {
  const u = STATE.user;
  const roleBadge = { gerente:'role-gerente', cliente:'role-cliente', produccion:'role-produccion', facturacion:'role-facturacion' }[u.rol] || 'role-cliente';
  const roleLabel  = { gerente:'Gerente', cliente:'Cliente', produccion:'Producción', facturacion:'Facturación' }[u.rol] || u.rol;
  const sectionName = getSectionName();
  const notifCount  = getMyNotifications().length;

  // ── Campana de notificaciones ──────────────────────────────
  const notifBell = `
    <div class="notif-wrap" id="notifWrap">
      <button class="notif-btn ${STATE.showNotifs ? 'active' : ''}"
        onclick="toggleNotifs()" title="Notificaciones">
        ${icon('bell')}${notifCount > 0 ? `<span class="notif-badge">${notifCount}</span>` : ''}
      </button>
      ${STATE.showNotifs ? `<div class="notif-overlay" onclick="closeNotifs()"></div>${renderNotifDropdown()}` : ''}
    </div>`;

  // ── Gerente: layout con sidebar ───────────────────────────
  if (u.rol === 'gerente') {
    const navItems = [
      { icon:'inbox',         label:'Por Revisar',      badge: PEDIDOS.filter(p => p.status==='enviado').length },
      { icon:'clipboardList', label:'Plan Producción',  badge: 0 },
      { icon:'history',       label:'Historial',        badge: 0 },
      { icon:'receipt',       label:'Facturación',      badge: 0 },
      { icon:'barChart',      label:'Dashboard',        badge: 0 },
      { icon:'users',         label:'Usuarios',         badge: 0 },
      { icon:'activity',      label:'Actividad',        badge: 0 },
      { icon:'tag',           label:'Catálogo',         badge: 0 },
      { icon:'building',      label:'Clientes',         badge: 0 },
    ];
    return `
    <div class="app-shell app-shell--sidebar">
      <nav class="topbar">
        <div class="topbar-brand">
          <span class="topbar-logo">${ICON.wheat}</span>
          <span class="brand-text">La Masandera</span>
          <span class="topbar-divider"></span>
          <span class="topbar-section">${navItems[STATE.tab]?.label || ''}</span>
        </div>
        <div class="topbar-right">
          ${notifBell}
          <div class="user-chip">
            <span class="user-name">${u.nombre}</span>
            <span class="user-role-badge ${roleBadge}">${roleLabel}</span>
          </div>
        </div>
      </nav>
      <div class="gerente-body">
        <aside class="sidebar">
          <nav class="sidebar-nav">
            ${navItems.map((t, i) => `
              <button class="sidebar-nav-item ${STATE.tab===i ? 'active' : ''}"
                onclick="setTab(${i})" title="${t.label}">
                <span class="sidebar-icon">${icon(t.icon)}</span>
                <span class="sidebar-label">${t.label}</span>
                ${t.badge > 0 ? `<span class="sidebar-badge">${t.badge}</span>` : ''}
              </button>`).join('')}
          </nav>
          <button class="sidebar-logout" onclick="doLogout()">
            ${icon('logOut')}<span class="sidebar-label">Salir</span>
          </button>
        </aside>
        <main class="gerente-main">
          ${renderGerente()}
        </main>
      </div>
    </div>`;
  }

  // ── Cliente / Producción / Facturación: layout centrado estándar ────────
  let content = '';
  if (u.rol === 'cliente')         content = renderCliente();
  else if (u.rol === 'produccion') content = renderProduccion();
  else if (u.rol === 'facturacion') content = renderFacturador();

  return `
  <div class="app-shell">
    <nav class="topbar">
      <div class="topbar-brand">
        <span class="topbar-logo">${ICON.wheat}</span>
        <span class="brand-text">La Masandera</span>
        ${sectionName
          ? `<span class="topbar-divider"></span><span class="topbar-section">${sectionName}</span>`
          : ''}
      </div>
      <div class="topbar-right">
        ${notifBell}
        <div class="user-chip">
          <span class="user-name">${u.nombre}</span>
          <span class="user-role-badge ${roleBadge}">${roleLabel}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="doLogout()">Salir</button>
      </div>
    </nav>
    <main class="main-content">
      ${content}
    </main>
  </div>`;
}
