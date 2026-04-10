// ============================================================
// MODAL — Ver detalle del pedido
// ============================================================
function renderModal() {
  const p = PEDIDOS.find(x => x.id === STATE.modal);
  if (!p) return '';
  const cliente = getCliente(p.clienteId);
  const isGerente = STATE.user?.rol === 'gerente';

  return `
  <div class="modal-overlay" onclick="closeModalIfBg(event)">
    <div class="modal" id="theModal">
      <div class="modal-header">
        <div>
          <div style="font-size:12px;color:var(--text-light);font-weight:600;margin-bottom:4px">${p.id}</div>
          <h3>${cliente?cliente.nombre:'Pedido'}</h3>
        </div>
        <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Información del pedido</div>
        <div class="info-row"><span class="info-label">Estado</span><span><span class="status-badge badge-${p.status}">${statusIcon(p.status)} ${statusLabel(p.status)}</span></span></div>
        <div class="info-row"><span class="info-label">Fecha pedido</span><span class="info-value">${fmtDate(p.fechaPedido)}</span></div>
        <div class="info-row"><span class="info-label">Fecha despacho</span><span class="info-value">${fmtDate(p.fechaDespacho)}</span></div>
        ${p.fechaFacturacion ? `<div class="info-row"><span class="info-label">Fecha facturación</span><span class="info-value">${icon('receipt')} ${fmtDate(p.fechaFacturacion)}</span></div>` : ''}
        ${p.folio ? `<div class="info-row"><span class="info-label">Folio DTE</span><span class="info-value" style="font-family:monospace">${escapeHtml(p.folio)}</span></div>` : ''}
        ${cliente ? `<div class="info-row"><span class="info-label">Cliente</span><span class="info-value">${escapeHtml(cliente.nombre)}</span></div>` : ''}
        ${cliente ? `<div class="info-row"><span class="info-label">Ciudad</span><span class="info-value">${escapeHtml(cliente.ciudad || '')}</span></div>` : ''}
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Productos</div>
        ${p.items.map(item => {
          const prod = getProducto(item.pId);
          return `<div class="modal-item-row">
            <div>
              <div style="font-weight:600">${prod?prod.nombre:'?'}</div>
              <div style="font-size:12px;color:var(--text-light)">${item.qty} ${prod?prod.unidad:''}</div>
            </div>
            <div style="font-weight:700">${fmt(item.qty*item.price)}</div>
          </div>`;
        }).join('')}
        <div class="modal-total-row">
          <span>Total pedido</span>
          <span class="total-num">${fmt(p.total)}</span>
        </div>
      </div>

      ${p.obs ? `<div class="modal-section"><div class="modal-section-title">Observaciones del cliente</div><div style="background:var(--surface2);padding:12px;border-radius:8px;font-size:14px">${icon('info')} ${escapeHtml(p.obs)}</div></div>` : ''}
      ${p.obsGerente ? `<div class="modal-section"><div class="modal-section-title">Nota de gerencia</div><div style="background:var(--status-approved-bg);padding:12px;border-radius:8px;font-size:14px;color:var(--secondary)">${icon('checkCircle')} ${escapeHtml(p.obsGerente)}</div></div>` : ''}

      ${isGerente && p.status === 'enviado' ? `
      <div class="modal-section">
        <div class="modal-section-title">Nota de gerencia (opcional)</div>
        <textarea class="form-textarea" id="modalObs" placeholder="Comentario para el cliente..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-success" onclick="aprobarDesdeModal('${p.id}')">${icon('check')} Aprobar</button>
        <button class="btn btn-secondary" onclick="closeModal();startEditOrder('${p.id}')">${icon('edit')} Editar</button>
        <button class="btn btn-danger" onclick="rechazarDesdeModal('${p.id}')">${icon('x')} Rechazar</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>`
      : isGerente && p.status === 'aprobado' ? `
      <div class="modal-actions">
        <button class="btn btn-produccion" onclick="closeModal();marcarEnProduccion('${p.id}')">${icon('gear')} En Producción</button>
        <button class="btn btn-facturar" onclick="closeModal();marcarFacturado('${p.id}')">${icon('receipt')} Facturar</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
      </div>`
      : isGerente && p.status === 'en_produccion' ? `
      <div class="modal-actions">
        <button class="btn btn-facturar" onclick="closeModal();marcarFacturado('${p.id}')">${icon('receipt')} Facturar</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
      </div>` : `
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
      </div>`}
    </div>
  </div>`;
}

// ============================================================
// MODAL EDICIÓN — Gerente modifica cantidades del pedido
// ============================================================
function renderEditModal() {
  if (!STATE.editingOrderId) return '';
  const p = PEDIDOS.find(x => x.id === STATE.editingOrderId);
  if (!p) return '';
  const cliente = getCliente(p.clienteId);
  const productos = getProductosCliente(p.clienteId);

  const editTotal = Object.entries(STATE.editItems)
    .filter(([,q]) => q > 0)
    .reduce((s,[pId,q]) => {
      const price = getPrecio(p.clienteId, pId);
      return s + q * (price || 0);
    }, 0);

  const tipos = [...new Set(productos.map(x => x.tipo))];

  return `
  <div class="modal-overlay" onclick="closeEditIfBg(event)">
    <div class="modal" id="editModal" style="max-width:720px">
      <div class="modal-header">
        <div>
          <div style="font-size:12px;color:var(--primary);font-weight:700;margin-bottom:4px">${icon('edit')} EDITANDO PEDIDO</div>
          <h3>${p.id} — ${cliente ? escapeHtml(cliente.nombre) : ''}</h3>
          <div style="font-size:13px;color:var(--text-light)">Modifica las cantidades y guarda los cambios antes de aprobar.</div>
        </div>
        <button class="modal-close" onclick="cancelEdit()">${icon('x')}</button>
      </div>

      <div style="max-height:50vh;overflow-y:auto;padding-right:4px">
        ${tipos.map(tipo => {
          const prods = productos.filter(x => x.tipo === tipo);
          return `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-light);margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border)">${tipo}</div>
            ${prods.map(prod => {
              const qty   = STATE.editItems[prod.id] || 0;
              const price = getPrecio(p.clienteId, prod.id) || 0;
              return `<div class="edit-prod-row">
                <div>
                  <div class="edit-prod-name">${prod.nombre}</div>
                  <div class="edit-prod-price">${fmt(price)} / ${prod.unidad}${qty>0?` · subtotal: ${fmt(qty*price)}`:''}</div>
                </div>
                <div class="edit-qty-wrap">
                  <button class="edit-qty-btn" onclick="editQty('${prod.id}',-1)">−</button>
                  <input class="edit-qty-input" type="number" min="0" value="${qty}"
                    onchange="editQtySet('${prod.id}',this.value)" id="eqty-${prod.id}">
                  <button class="edit-qty-btn" onclick="editQty('${prod.id}',1)">+</button>
                </div>
              </div>`;
            }).join('')}
          </div>`;
        }).join('')}
      </div>

      <div style="border-top:2px solid var(--text);padding:14px 0;display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <span style="font-weight:700">Nuevo total del pedido</span>
        <span style="font-family:var(--font-display);font-size:22px;color:var(--primary)">${fmt(editTotal)}</span>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" onclick="saveEditOrder()">${icon('check')} Guardar Cambios</button>
        <button class="btn btn-success" onclick="saveAndApprove()">${icon('checkCircle')} Guardar y Aprobar</button>
        <button class="btn btn-ghost" onclick="cancelEdit()">Cancelar</button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// MODAL RESET DE CONTRASEÑA
// ============================================================
function renderResetPasswordModal() {
  if (!STATE.resetPassUserId) return '';
  const user = DATA.usuarios.find(u => u.id === STATE.resetPassUserId);
  if (!user) return '';
  return `
  <div class="modal-overlay" onclick="if(event.target===this)cancelResetPassword()">
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <div>
          <h3>${icon('key')} Restablecer contraseña</h3>
          <div style="font-size:13px;color:var(--text-light);margin-top:4px">
            ${escapeHtml(user.nombre)} &middot; ${escapeHtml(user.email)}
          </div>
        </div>
        <button class="modal-close" onclick="cancelResetPassword()">${icon('x')}</button>
      </div>
      <div class="modal-section">
        <label class="form-label">Nueva contraseña <span style="color:var(--text-light)">(mín. 8 caracteres)</span></label>
        <input class="form-input" type="password" id="resetPassInput"
          placeholder="••••••••" minlength="8" autocomplete="new-password"
          onkeydown="if(event.key==='Enter')doResetPassword()">
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="doResetPassword()">${icon('check')} Guardar contraseña</button>
        <button class="btn btn-ghost" onclick="cancelResetPassword()">Cancelar</button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// NOTIFICATION TOAST
// ============================================================
function renderNotif() {
  if (!STATE.notif) return '';
  return `<div class="notification ${STATE.notif.type==='error'?'error':''}">
    ${STATE.notif.type==='success' ? ICON.checkCircle : ICON.xCircle} ${STATE.notif.msg}
  </div>`;
}
