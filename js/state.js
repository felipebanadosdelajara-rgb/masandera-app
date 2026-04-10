// ============================================================
// STATE
// ============================================================

let STATE = {
  user: null,
  page: 'login',
  tab: 0,
  draft: {},              // { pId: qty } — cliente new order
  draftFecha: '',
  draftObs: '',
  modal: null,            // order id in view/review modal
  editingOrderId: null,   // order id being edited by gerente
  editItems: {},          // { pId: qty } — copy being edited
  dash: { period:'all', clienteId:'all', productoId:'all' },
  notif: null,
  loginEmail: '',
  loginPass: '',
  loginError: '',
  showCreateUser: false,
  notifications: [],      // in-app notifications for the user
  resetPassUserId: null,  // userId con reset de contraseña pendiente

  // ── Grupo 1: UX ────────────────────────────────────────────
  showNotifs: false,                                // campana de notificaciones abierta
  historialFilter: { search:'', status:'all', clienteId:'all' }, // filtros historial
  confirmAction: null,   // { type:'reject'|'deactivate', id } — acción pendiente de confirmar

  // ── Grupo 2: Catálogo ──────────────────────────────────────
  catalogSearch: '',     // búsqueda en catálogo de productos del cliente
  catalogCategory: 'all', // categoría activa ('all'|'masa_madre'|'brioche')

  // ── Grupo 4: Facturación filtros ───────────────────────────
  factFilter: { period: 'all', clienteId: 'all' },

  // ── Grupo 5: Gestión de catálogo y precios ─────────────────
  catMgmt: {
    showForm: false,           // formulario de nuevo producto visible
    preciosClienteId: null,    // cliente seleccionado para editar precios
  },
  showProductForm: false,      // producto: form abierto
  editingProductId: null,      // producto: id en edición (null = nuevo)
  productFilter: 'all',        // producto: filtro tipo
  productCatFilter: 'all',     // producto: filtro categoría
  prodSubTab: 0,               // 0=Producción 1=Empaque

  // ── Gestión de clientes ────────────────────────────────────
  clientMgmt: {
    showForm: false,
    editingClientId: null,
    typeFilter: 'all',
    expandedDistributor: null,
    showSubClientForm: null,
    editingSubClientId: null,
    assigningProductsTo: null,
  },
};
