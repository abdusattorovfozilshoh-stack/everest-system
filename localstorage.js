/* ═══════════════════════════════════════════════════
   EVEREST O'QUV MARKAZI — Session Management Module
   Ushbu fayl foydalanuvchi seansini (login holatini) boshqaradi.
═══════════════════════════════════════════════════ */

const DB_KEYS = {
    session: 'everest_session',
    remember: 'everest_remember_login'
};

/* ═══ SESSION (Login holatini saqlash) ═══ */

function saveSession(user) {
    // sessionStorage — brauzer yopilsa o'chadi (xavfsizroq)
    sessionStorage.setItem(DB_KEYS.session, JSON.stringify(user));
}

function loadSession() {
    try {
        const raw = sessionStorage.getItem(DB_KEYS.session);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem(DB_KEYS.session);
}

/* ═══ SAHIFANI HIMOYALASH ═══ */

function requireAdmin() {
    const session = loadSession();
    if (!session || session.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function requireTeacher() {
    const session = loadSession();
    if (!session || session.role !== 'teacher') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

/**
 * Logout and redirect
 */
function logout() {
    clearSession();
    window.location.href = 'index.html';
}

// Global functions for backward compatibility
window.saveSession = saveSession;
window.loadSession = loadSession;
window.clearSession = clearSession;
window.requireAdmin = requireAdmin;
window.requireTeacher = requireTeacher;
window.logout = logout;