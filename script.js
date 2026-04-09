/* ═══════════════════════════════════════════════════
   EVEREST O'QUV MARKAZI — Login sahifasi skripti
   Bog'liqlik: api.js, localstorage.js
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

    /* ── 1. ROLE SELECTOR ── */
    document.querySelectorAll('.role-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.role-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
        });
    });

    /* ── 2. PASSWORD TOGGLE ── */
    var toggleBtn = document.getElementById('togglePass');
    var passInput = document.getElementById('password');
    var eyeIcon = document.getElementById('eyeIcon');

    if (toggleBtn && passInput && eyeIcon) {
        toggleBtn.addEventListener('click', function () {
            var show = passInput.type === 'password';
            passInput.type = show ? 'text' : 'password';
            eyeIcon.innerHTML = show
                ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
                : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        });
    }

    /* ── 4. "ESLAB QOLISH" — oldingi loginni yuklash ── */
    var rememberCheck = document.getElementById('remember');
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    if (rememberCheck && usernameInput && passwordInput) {
        var savedLogin = localStorage.getItem('everest_remember_login');
        var savedPass = localStorage.getItem('everest_remember_pass');
        if (savedLogin) {
            usernameInput.value = savedLogin;
            rememberCheck.checked = true;
        }
        if (savedPass) {
            passwordInput.value = savedPass;
        }
    }

    /* ── 5. LOGIN FORMA ── */
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var userEl = document.getElementById('username');
            var passEl = document.getElementById('password');
            var uErr = document.getElementById('usernameErr');
            var pErr = document.getElementById('passwordErr');
            var loginBtn = document.getElementById('loginBtn');

            // Xatolarni tozalash
            [userEl, passEl].forEach(function (el) { if(el) el.classList.remove('error'); });
            [uErr, pErr].forEach(function (el) { if(el) el.classList.remove('show'); });

            // Validatsiya
            var valid = true;
            if (userEl && !userEl.value.trim()) {
                userEl.classList.add('error'); if(uErr) uErr.classList.add('show'); valid = false;
            }
            if (passEl && !passEl.value.trim()) {
                passEl.classList.add('error'); if(pErr) pErr.classList.add('show'); valid = false;
            }
            if (!valid) return;

            var role = (document.querySelector('.role-btn.active') || {}).dataset.role || 'admin';
            var enteredLogin = userEl.value.trim();
            var enteredPass = passEl.value.trim();

            // Loading spinner yoqish
            if(loginBtn) loginBtn.classList.add('loading');

            // API orqali kirish
            setTimeout(function () {
                API.login({ login: enteredLogin, pass: enteredPass, role: role })
                .then(function (result) {
                    if(loginBtn) loginBtn.classList.remove('loading');

                    if (result.success) {
                        if (rememberCheck && rememberCheck.checked) {
                            localStorage.setItem('everest_remember_login', enteredLogin);
                            localStorage.setItem('everest_remember_pass', enteredPass);
                        } else {
                            localStorage.removeItem('everest_remember_login');
                            localStorage.removeItem('everest_remember_pass');
                        }

                        if (typeof saveSession === 'function') {
                            saveSession(result.user);
                        }
                        showToast('✅ Xush kelibsiz! Yo\'naltirilmoqda...');
                        setTimeout(function () { window.location.href = result.user.redirect; }, 900);
                        return;
                    }

                    showToast('❌ Login yoki parol noto\'g\'ri');
                    if(passEl) {
                        passEl.classList.add('error');
                        passEl.focus();
                    }
                })
                .catch(function (error) {
                    if(loginBtn) loginBtn.classList.remove('loading');
                    console.error('Login error:', error);
                    showToast(error.message || '❌ Server bilan ulanishda xatolik. Iltimos, server ishlayotganini tekshiring.');
                });
            }, 400);
        });
    }

    /* ── 6. TOAST ── */
    function showToast(msg) {
        var t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 3500);
    }
    window.showToast = showToast;

    /* ── 7. SERVER STATUS CHECK ── */
    window.initStatusCheck = function() {
        var badge = document.getElementById('serverStatus');
        var text = document.getElementById('statusText');
        if (!badge || !text) return;

        async function updateStatus() {
            var isOnline = await window.checkHealth();
            badge.classList.remove('status-online', 'status-offline');
            
            if (isOnline) {
                badge.classList.add('status-online');
                text.textContent = 'Server Online';
            } else {
                badge.classList.add('status-offline');
                text.textContent = 'Server Offline';
            }
        }

        updateStatus();
        setInterval(updateStatus, 5000); // Har 5 soniyada tekshirish
    };
});

