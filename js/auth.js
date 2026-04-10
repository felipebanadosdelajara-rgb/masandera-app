// ============================================================
// AUTH — Authentication, Sessions, Permissions & Audit
// ============================================================

// simpleHash is defined in data.js (loaded first)

// Session management
const SESSION_KEY = 'masandera_session';

function saveSession(user) {
  const session = {
    userId: user.id,
    rol: user.rol,
    nombre: user.nombre,
    email: user.email,
    clienteId: user.clienteId || null,
    loginTime: new Date().toISOString(),
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch(e) { /* sessionStorage not available */ }
  return session;
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Check expiration
    if (new Date(session.expires) < new Date()) {
      clearSession();
      return null;
    }
    return session;
  } catch(e) { return null; }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
}

// Login attempt tracking (rate limiting)
const LOGIN_ATTEMPTS = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

function checkLoginAttempts(email) {
  const key = email.toLowerCase();
  const attempts = LOGIN_ATTEMPTS[key];
  if (!attempts) return { allowed: true, remaining: MAX_ATTEMPTS };

  // Check if lockout has expired
  if (attempts.lockedUntil && new Date() > new Date(attempts.lockedUntil)) {
    delete LOGIN_ATTEMPTS[key];
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (attempts.lockedUntil) {
    const minutesLeft = Math.ceil((new Date(attempts.lockedUntil) - new Date()) / 60000);
    return { allowed: false, remaining: 0, minutesLeft };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - attempts.count };
}

function recordLoginAttempt(email, success) {
  const key = email.toLowerCase();
  if (success) {
    delete LOGIN_ATTEMPTS[key];
    return;
  }

  if (!LOGIN_ATTEMPTS[key]) LOGIN_ATTEMPTS[key] = { count: 0 };
  LOGIN_ATTEMPTS[key].count++;

  if (LOGIN_ATTEMPTS[key].count >= MAX_ATTEMPTS) {
    LOGIN_ATTEMPTS[key].lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
  }
}

// Audit trail
let AUDIT_LOG = [];

function logAction(action, details = {}) {
  const entry = {
    id: 'AUD-' + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    userId: STATE.user?.id || 'system',
    userName: STATE.user?.nombre || 'Sistema',
    userRol: STATE.user?.rol || 'system',
    action,
    details,
  };
  AUDIT_LOG.unshift(entry);
  // Keep last 500 entries
  if (AUDIT_LOG.length > 500) AUDIT_LOG = AUDIT_LOG.slice(0, 500);
  return entry;
}

// ============================================================
// PERMISSIONS (RBAC)
// ============================================================
const PERMISSIONS = {
  gerente: {
    viewAllOrders: true,
    viewOwnOrders: true,
    createOrder: false,
    editOrder: true,
    approveOrder: true,
    rejectOrder: true,
    viewProductionPlan: true,
    generateProductionDoc: true,
    markInvoiced: true,
    viewInvoicing: true,
    viewDashboard: true,
    manageUsers: true,
    manageProducts: true,
    managePrices: true,
    viewAuditLog: true,
    exportData: true,
  },
  produccion: {
    viewAllOrders: false,
    viewOwnOrders: false,
    createOrder: false,
    editOrder: false,
    approveOrder: false,
    rejectOrder: false,
    viewProductionPlan: true,
    generateProductionDoc: true,
    markInvoiced: false,
    viewInvoicing: false,
    viewDashboard: false,
    manageUsers: false,
    manageProducts: false,
    managePrices: false,
    viewAuditLog: false,
    exportData: false,
  },
  cliente: {
    viewAllOrders: false,
    viewOwnOrders: true,
    createOrder: true,
    editOrder: false,
    approveOrder: false,
    rejectOrder: false,
    viewProductionPlan: false,
    generateProductionDoc: false,
    markInvoiced: false,
    viewInvoicing: false,
    viewDashboard: false,
    manageUsers: false,
    manageProducts: false,
    managePrices: false,
    viewAuditLog: false,
    exportData: false,
  },
  facturacion: {
    viewAllOrders: true,
    viewOwnOrders: false,
    createOrder: false,
    editOrder: false,
    approveOrder: false,
    rejectOrder: false,
    viewProductionPlan: false,
    generateProductionDoc: false,
    markInvoiced: true,
    viewInvoicing: true,
    viewDashboard: false,
    manageUsers: false,
    manageProducts: false,
    managePrices: false,
    viewAuditLog: false,
    exportData: true,
  },
};

function hasPermission(action) {
  if (!STATE.user) return false;
  const perms = PERMISSIONS[STATE.user.rol];
  return perms ? perms[action] === true : false;
}

function requirePermission(action) {
  if (!hasPermission(action)) {
    showNotif('error', 'No tienes permisos para realizar esta acción.');
    return false;
  }
  return true;
}

// ============================================================
// USER MANAGEMENT (Gerente only)
// ============================================================
function createUser(nombre, email, pass, rol, clienteId) {
  if (!requirePermission('manageUsers')) return null;

  // Validate
  if (!nombre || !email || !pass || !rol) {
    showNotif('error', 'Todos los campos son obligatorios.');
    return null;
  }
  if (pass.length < 8) {
    showNotif('error', 'La contraseña debe tener al menos 8 caracteres.');
    return null;
  }
  if (!['gerente', 'produccion', 'cliente', 'facturacion'].includes(rol)) {
    showNotif('error', 'Rol no válido.');
    return null;
  }
  if (rol === 'cliente' && !clienteId) {
    showNotif('error', 'Debe asignar un cliente al usuario.');
    return null;
  }
  // Check duplicate email
  if (DATA.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    showNotif('error', 'Ya existe un usuario con ese correo.');
    return null;
  }

  const newUser = {
    id: 'u_' + Date.now().toString(36),
    nombre,
    email: email.toLowerCase(),
    pass: simpleHash(pass),
    rol,
    activo: true,
    creadoPor: STATE.user.id,
    fechaCreacion: new Date().toISOString(),
  };
  if (clienteId) newUser.clienteId = clienteId;

  DATA.usuarios.push(newUser);
  logAction('user_created', { targetUser: newUser.id, email: newUser.email, rol });
  showNotif('success', `Usuario ${nombre} creado correctamente.`);
  return newUser;
}

function deactivateUser(userId) {
  if (!requirePermission('manageUsers')) return;
  const user = DATA.usuarios.find(u => u.id === userId);
  if (!user) return;
  if (user.id === STATE.user.id) {
    showNotif('error', 'No puedes desactivar tu propia cuenta.');
    return;
  }
  user.activo = false;
  logAction('user_deactivated', { targetUser: userId, email: user.email });
  showNotif('success', `Usuario ${user.nombre} desactivado.`);
  render();
}

function activateUser(userId) {
  if (!requirePermission('manageUsers')) return;
  const user = DATA.usuarios.find(u => u.id === userId);
  if (!user) return;
  user.activo = true;
  logAction('user_activated', { targetUser: userId, email: user.email });
  showNotif('success', `Usuario ${user.nombre} activado.`);
  render();
}

function resetUserPassword(userId, newPass) {
  if (!requirePermission('manageUsers')) return;
  if (!newPass || newPass.length < 8) {
    showNotif('error', 'La contraseña debe tener al menos 8 caracteres.');
    return;
  }
  const user = DATA.usuarios.find(u => u.id === userId);
  if (!user) return;
  user.pass = simpleHash(newPass);
  logAction('password_reset', { targetUser: userId, email: user.email });
  showNotif('success', `Contraseña de ${user.nombre} actualizada.`);
}

// ============================================================
// IN-APP NOTIFICATIONS
// ============================================================
function addNotification(targetUserId, message, type = 'info') {
  STATE.notifications.push({
    id: 'N' + Date.now().toString(36),
    targetUserId,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
  });
}

function getMyNotifications() {
  if (!STATE.user) return [];
  return STATE.notifications.filter(n => n.targetUserId === STATE.user.id && !n.read);
}

function markNotificationRead(notifId) {
  const n = STATE.notifications.find(x => x.id === notifId);
  if (n) n.read = true;
  render();
}

function markAllNotificationsRead() {
  STATE.notifications.forEach(n => {
    if (n.targetUserId === STATE.user?.id) n.read = true;
  });
  render();
}
