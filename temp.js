
        // 1. Session tekshirish
        if (!requireAdmin()) {
            // requireAdmin ichida yo'naltirish bor
        }

        /* ═══ DATA (API orqali yuklanadi) ═══ */
        const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        let teachers = [];
        let groups = [];
        let payments = [];

        let adminLogin = '';
        let adminPass = '';
        let centerInfo = { name: '', addr: '', phone: '', email: '' };
        let groupCapacity = 15;
        const COURSES = [
            { key: 'Beginner', fee: 500000 },
            { key: 'Elementary', fee: 550000 },
            { key: 'Pre-IELTS', fee: 600000 },
            { key: 'Introduction', fee: 650000 },
            { key: 'Graduation', fee: 700000 }
        ];
        const DEFAULT_SETTINGS = {
            adminLogin: 'admin',
            adminPass: 'admin123',
            centerName: 'Everest O\'quv Markazi',
            centerAddr: 'Toshkent sh., Chilonzor t.',
            centerPhone: '+998 90 123 45 67',
            centerEmail: 'info@everest.uz',
            groupCapacity: 15
        };

        let _editTeacherId = null, _activeGroupId = null, _payTarget = null, _activeStudentDetail = null;
        let _stuGroupFilter = 'all', _stuSearchFilter = '';

        /* ═══ INITIALIZATION ═══ */
        async function init() {
            try {
                // 1. Sozlamalarni yuklash
                const settings = await API.settings.get();
                if (settings) {
                    adminLogin = settings.adminLogin;
                    adminPass = settings.adminPass;
                    centerInfo = {
                        name: settings.centerName,
                        addr: settings.centerAddr,
                        phone: settings.centerPhone,
                        email: settings.centerEmail
                    };
                    groupCapacity = settings.groupCapacity;

                    // COURSES (doimiy arrayni yangilash)
                    COURSES.length = 0;
                    if (settings.courses) {
                        settings.courses.forEach(c => COURSES.push(c));
                    }
                }

                // 2. Ma'lumotlarni yuklash
                [teachers, groups, payments] = await Promise.all([
                    API.teachers.list(),
                    API.groups.list(),
                    API.payments.list()
                ]);

                // 3. UI yangilash
                renderAll();
                toast("✅ Ma'lumotlar yuklandi");
            } catch (err) {
                console.error("Init xatosi:", err);
                toast("❌ Ma'lumotlarni yuklashda xatolik: " + err.message);
            }
        }

        function renderAll() {
            renderTeachers();
            renderGroups();
            renderAllStudents();
            renderUnpaid();
            updateBadges();
            updateCenterUI();
        }

        function updateCenterUI() {
            document.title = centerInfo.name + " — Admin Panel";
            // Boshqa markaz nomi ko'rsatilgan joylar bo'lsa yangilash
        }

        function normalizeGroupName(name) {
            return (name || '').replace(/\u2014/g, '-').replace(/\s+/g, ' ').trim();
        }

        async function persistSettings() {
            try {
                const payload = {
                    adminLogin,
                    adminPass,
                    centerName: centerInfo.name,
                    centerAddr: centerInfo.addr,
                    centerPhone: centerInfo.phone,
                    centerEmail: centerInfo.email,
                    groupCapacity,
                    courses: COURSES
                };
                await API.settings.save(payload);
                // UI yangilash shart emas, chunki local o'zgaruvchilar allaqachon yangilangan
            } catch (err) {
                console.error("Sozlamalarni saqlashda xatolik:", err);
                toast("❌ Sozlamalar serverga saqlanmadi: " + err.message);
            }
        }

        function applySettings(settings) {
            const safe = settings || {};
            adminLogin = safe.adminLogin || DEFAULT_SETTINGS.adminLogin;
            adminPass = safe.adminPass || DEFAULT_SETTINGS.adminPass;
            centerInfo = {
                name: safe.centerName || DEFAULT_SETTINGS.centerName,
                addr: safe.centerAddr || DEFAULT_SETTINGS.centerAddr,
                phone: safe.centerPhone || DEFAULT_SETTINGS.centerPhone,
                email: safe.centerEmail || DEFAULT_SETTINGS.centerEmail
            };
            groupCapacity = safe.groupCapacity || DEFAULT_SETTINGS.groupCapacity;
            COURSES.forEach(function (course) {
                const saved = (safe.courses || []).find(function (item) { return item.key === course.key; });
                if (saved && Number.isFinite(saved.fee)) course.fee = saved.fee;
            });
            syncGroupFeesWithCourses();
        }

        function syncGroupFeesWithCourses() {
            groups.forEach(g => {
                const course = COURSES.find(c => c.key === g.level);
                if (course) g.fee = course.fee;
            });
        }

        function loadInitialData() {
            return Promise.all([
                apiRequest('/api/teachers'),
                apiRequest('/api/groups'),
                apiRequest('/api/payments'),
                apiRequest('/api/settings')
            ]).then(function (results) {
                teachers = results[0];
                groups = results[1].map(function (group) {
                    return Object.assign({}, group, { name: normalizeGroupName(group.name) });
                });
                payments = results[2];
                applySettings(results[3]);
            });
        }

        syncGroupFeesWithCourses();

        /* ═══ NAV ═══ */
        function goPage(name, el) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
            document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('on'));
            document.getElementById('pg-' + name).classList.add('on');
            if (el) el.classList.add('on');
            const T = {
                teachers: ["O'qituvchilar", "Ro'yxat va guruh boshqaruvi"],
                students: ["O'quvchilar", "Barcha o'quvchilar ro'yxati va to'lov holati"],
                unpaid: ["To'lanmaganlar", "To'lov amalga oshirmaganlar ro'yxati"],
                schedule: ["Dars jadvali", "Haftalik dars jadvali ko'rinishi"],
                reports: ["Hisobotlar", "Daromad va to'lov statistikasi"],
                notifications: ["Bildirishnomalar", "Tizim bildirishnomalari va ogohlantirishlar"],
                settings: ["Sozlamalar", "Tizim sozlamalari va konfiguratsiya"]
            };
            document.getElementById('tbTitle').textContent = T[name][0];
            document.getElementById('tbSub').textContent = T[name][1];
            if (name === 'teachers') renderTeachers();
            if (name === 'students') renderAllStudents('');
            if (name === 'unpaid') renderUnpaid();
            if (name === 'schedule') renderSchedule();
            if (name === 'reports') renderReports();
            if (name === 'notifications') renderNotifications();
            if (name === 'settings') renderSettings();
            updateBadges();
        }

        /* ═══ BADGES ═══ */
        function updateBadges() {
            document.getElementById('badgeTeachers').textContent = teachers.length;
            const totalStu = groups.reduce((a, g) => a + g.students.length, 0);
            document.getElementById('badgeStudents').textContent = totalStu;
            document.getElementById('badgeUnpaid').textContent = getUnpaidList().length;
        }

        /* ═══ UNPAID ═══ */
        function getUnpaidList() {
            const curMonthIdx = new Date().getMonth();
            const checkMonths = MONTHS.slice(Math.max(0, curMonthIdx - 1), curMonthIdx + 1);
            const list = [];
            groups.forEach(g => {
                if (!g || !g.students) return;
                g.students.forEach(s => {
                    const unpaidMonths = checkMonths.filter(month => {
                        const pay = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === month);
                        return !pay || !pay.paid;
                    });
                    if (unpaidMonths.length > 0) {
                        const teacher = teachers.find(t => t.id === g.teacherId);
                        const totalDebt = unpaidMonths.length * g.fee;
                        list.push({ student: s, group: g, teacher, unpaidMonths, totalDebt });
                    }
                });
            });
            return list;
        }

        /* ═══ RENDER TEACHERS ═══ */
        function renderTeachers(filter = '') {
            const list = teachers.filter(t => (t.ism + ' ' + t.fam + ' ' + t.login).toLowerCase().includes(filter.toLowerCase()));
            document.getElementById('tcCount').textContent = `— ${list.length} ta`;
            const grid = document.getElementById('teacherGrid');
            if (!list.length) { grid.innerHTML = `<div class="empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><p>O'qituvchi topilmadi</p></div>`; return; }
            grid.innerHTML = list.map(t => {
                const tGroups = groups.filter(g => g.teacherId === t.id);
                const initials = (t.ism[0] + (t.fam[0] || '')).toUpperCase();
                return `<div class="t-card">
            <div class="t-card-head">
                <div class="t-ava">${initials}</div>
                <div><div class="t-name">${t.ism} ${t.fam}</div><div class="t-phone">${t.tel}</div></div>
            </div>
            <div class="t-creds">
                <div class="cred-box cred-login"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>${t.login}</div>
                <div class="cred-box cred-pass"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>${t.pass}</div>
            </div>
            <div class="t-groups">
                ${tGroups.map(g => `<span class="t-group-tag" onclick="openGroupDetail(${g.id})"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>${g.name} <span style="opacity:.6">(${g.students.length})</span></span>`).join('')}
                <span class="t-group-tag add" onclick="openGroupModal(${t.id})"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Guruh qo'shish</span>
            </div>
            <div class="t-actions">
                <button class="btn-sm btn-edit" onclick="openTeacherModal(${t.id})">Tahrirlash</button>
                <button class="btn-sm btn-del" onclick="deleteTeacher(${t.id})">O'chirish</button>
            </div>
        </div>`;
            }).join('');
        }

        /* ═══ RENDER ALL STUDENTS ═══ */
        function renderAllStudents(search = '') {
            _stuSearchFilter = search;
            const month = currentMonth();
            let rows = [];
            groups.forEach(g => {
                const teacher = teachers.find(t => t.id === g.teacherId);
                g.students.forEach(s => {
                    if (search && !(s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search))) return;
                    const pay = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === month);
                    const paid = pay && pay.paid;
                    rows.push({ s, g, teacher, paid, pay });
                });
            });

            document.getElementById('stuAllCount').textContent = `— ${rows.length} ta`;
            const tbody = document.getElementById('stuAllBody');
            if (!rows.length) {
                tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>O'quvchi topilmadi</p></div></td></tr>`;
                return;
            }
            tbody.innerHTML = rows.map((row, i) => {
                const { s, g, teacher, paid, pay } = row;
                const ini = s.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                return `<tr>
            <td style="color:var(--muted);font-size:.82rem">${i + 1}</td>
            <td>
                <div style="display:flex;align-items:center;gap:9px">
                    <div class="stu-ava" style="width:32px;height:32px;font-size:.75rem">${ini}</div>
                    <div style="font-weight:600;font-size:.88rem">${s.name}</div>
                </div>
            </td>
            <td>
                <div style="display:flex;gap:5px">
                    <button class="btn-sm btn-view" onclick="openStudentDetail('${s.name}',${g.id})">Batafsil</button>
                    ${!paid ? `<button class="btn-sm btn-pay" onclick="openPayFromList('${s.name}',${g.id})">To'lov</button>` : ''}
                </div>
            </td>
        </tr>`;
            }).join('');
        }

        /* ═══ STUDENT DETAIL MODAL ═══ */
        function openStudentDetail(studentName, groupId) {
            _activeStudentDetail = { studentName, groupId };
            const g = groups.find(g => g.id === groupId);
            const s = g.students.find(s => s.name === studentName);
            const teacher = teachers.find(t => t.id === g.teacherId);
            document.getElementById('sdTitle').textContent = s.name;
            document.getElementById('sdSub').textContent = g.name;

            // Info grid
            const month = currentMonth();
            const pay = payments.find(p => p.groupId === groupId && p.studentName === studentName && p.month === month);
            const paid = pay && pay.paid;

            document.getElementById('sdInfoGrid').innerHTML = `
        <div style="background:var(--light);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div class="stu-detail-label">Telefon</div>
            <div class="stu-detail-val"><a href="tel:${s.phone}" style="color:var(--blue);text-decoration:none">${s.phone || '—'}</a></div>
        </div>
        <div style="background:var(--light);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div class="stu-detail-label">Guruh</div>
            <div class="stu-detail-val"><span style="font-weight:600">${g.name}</span></div>
        </div>
        <div style="background:var(--light);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div class="stu-detail-label">Daraja</div>
            <div class="stu-detail-val"><span class="badge b-gold">${g.level}</span></div>
        </div>
        <div style="background:var(--light);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div class="stu-detail-label">Dars vaqti</div>
            <div class="stu-detail-val" style="font-size:.85rem">${g.ts || ''}–${g.te || ''} · ${g.days?.join(', ') || ''}</div>
        </div>
        <div style="background:var(--light);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div class="stu-detail-label">O'qituvchi</div>
            <div class="stu-detail-val" style="font-size:.85rem">${teacher ? teacher.ism + ' ' + teacher.fam : '—'}</div>
        </div>
        <div style="background:var(--light);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div class="stu-detail-label">Joriy oy to'lovi (${month})</div>
            <div class="stu-detail-val">
                <span class="badge ${paid ? 'b-green' : 'b-red'}">${paid ? '✓ To\'lagan' : '✗ To\'lamagan'}</span>
            </div>
        </div>
    `;
            // To'lov tarixi
            const stuPays = payments.filter(p => p.groupId === groupId && p.studentName === studentName).sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
            const histEl = document.getElementById('sdPayHistory');
            if (!stuPays.length) {
                histEl.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:.85rem">Hali to'lov amalga oshirilmagan</div>`;
            } else {
                histEl.innerHTML = stuPays.map(p => `
            <div class="pay-history-row">
                <div>
                    <div class="pay-history-month">${p.month}</div>
                    <div class="pay-history-meta">${p.paid && p.date ? p.date : '—'}</div>
                </div>
                <div style="text-align:right">
                    <span class="badge ${p.paid ? 'b-green' : 'b-red'}">${p.paid ? '✓ To\'langan' : '✗ To\'lanmagan'}</span>
                    <div style="font-size:.78rem;font-weight:600;margin-top:3px;color:var(--navy)">${p.amount.toLocaleString()} so'm</div>
                </div>
            </div>`).join('');
            }

            // Default qiymatlar
            document.getElementById('sd-month').selectedIndex = new Date().getMonth();
            document.getElementById('sd-date').value = todayStr();
            document.getElementById('sd-amount').value = g.fee;

            openModal('ovStudentDetail');
        }

        function saveStudentPay() {
            if (!_activeStudentDetail) return;
            const { studentName, groupId } = _activeStudentDetail;
            const sel = document.getElementById('sd-month');
            const month = sel.options[sel.selectedIndex].text;
            const date = document.getElementById('sd-date').value;
            const amount = parseInt(document.getElementById('sd-amount').value) || 0;
            const existing = payments.find(p => p.groupId === groupId && p.studentName === studentName && p.month === month);

            const payload = { studentName, groupId, month, amount, date, paid: true };

            if (existing) {
                apiRequest('/api/payments/' + existing.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(() => {
                    Object.assign(existing, payload);
                    finishSaveStudentPay(studentName, groupId);
                }).catch(err => toast("❌ Xato: " + err.message));
            } else {
                apiRequest('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => {
                    payload.id = res.id;
                    payments.push(payload);
                    finishSaveStudentPay(studentName, groupId);
                }).catch(err => toast("❌ Xato: " + err.message));
            }
        }

        function finishSaveStudentPay(studentName, groupId) {
            toast('✅ To\'lov saqlandi');
            openStudentDetail(studentName, groupId);
            renderAllStudents(_stuSearchFilter);
            renderUnpaid();
            updateBadges();
        }

        function openPayFromList(studentName, groupId) {
            _payTarget = { studentName, groupId };
            const g = groups.find(g => g.id === groupId);
            document.getElementById('pvTitle').textContent = 'To\'lov qabul qilish';
            document.getElementById('pvSub').textContent = studentName + ' — ' + g.name;
            document.getElementById('pf-amount').value = g.fee;
            document.getElementById('pf-date').value = todayStr();
            document.getElementById('pf-month').selectedIndex = new Date().getMonth();
            openModal('ovPay');
        }

        /* ═══ RENDER UNPAID ═══ */
        function renderUnpaid() {
            const list = getUnpaidList();
            const totalDebtAll = list.reduce((s, i) => s + i.totalDebt, 0);
            document.getElementById('unpaidBannerTitle').textContent = `To'lov amalga oshirmaganlar — ${list.length} ta o'quvchi`;
            document.getElementById('unpaidBannerSub').textContent = `Umumiy qarzdorlik: ${totalDebtAll.toLocaleString()} so'm`;
            const tbody = document.getElementById('unpaidBody');
            if (!list.length) {
                tbody.innerHTML = `<tr><td colspan="5"><div class="empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>Barcha o'quvchilar to'lovni amalga oshirgan! 🎉</p></div></td></tr>`;
                return;
            }
            tbody.innerHTML = list.map((item, i) => {
                return `<tr>
                    <td style="color:var(--muted);font-size:.82rem">${i + 1}</td>
                    <td><div style="font-weight:600;font-size:.9rem">${item.student.name}</div><div style="font-size:.7rem;color:var(--muted);margin-top:2px">${item.group.name}</div></td>
                    <td><a href="tel:${item.student.phone}" style="color:var(--blue);font-size:.85rem;text-decoration:none">${item.student.phone || '—'}</a></td>
                    <td>
                        <div style="font-weight:700;color:var(--red);font-size:.92rem">${item.totalDebt.toLocaleString()} so'm</div>
                        <div style="font-size:.72rem;color:var(--muted)">${item.unpaidMonths.length} oy uchun</div>
                    </td>
                    <td style="text-align:right">
                        <div style="display:flex;justify-content:flex-end;gap:5px">
                            <button class="btn-sm btn-view" onclick="openStudentDetail('${item.student.name}',${item.group.id})">Batafsil</button>
                            <button class="btn-sm btn-pay" onclick="openPayFromUnpaid('${item.student.name}',${item.group.id})">To'lov ✓</button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

        /* ═══ TEACHER CRUD ═══ */
        function openTeacherModal(id = null) {
            _editTeacherId = id;
            document.getElementById('tmTitle').textContent = id ? "O'qituvchini tahrirlash" : "O'qituvchi qo'shish";
            if (id) { const t = teachers.find(t => t.id === id); sv('tf-ism', t.ism); sv('tf-fam', t.fam); sv('tf-tel', t.tel); sv('tf-login', t.login); sv('tf-pass', t.pass); }
            else { ['tf-ism', 'tf-fam', 'tf-tel', 'tf-login', 'tf-pass'].forEach(f => sv(f, '')); }
            openModal('ovTeacher');
        }
        function saveTeacher() {
            const ism = gv('tf-ism'), fam = gv('tf-fam'), tel = gv('tf-tel'), login = gv('tf-login'), pass = gv('tf-pass');
            if (!ism || !fam || !login || !pass) { toast("⚠️ Majburiy maydonlarni to'ldiring"); return; }
            const payload = { ism, fam, tel, login, pass };
            if (_editTeacherId) {
                apiRequest('/api/teachers/' + _editTeacherId, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(() => {
                    const t = teachers.find(t => t.id === _editTeacherId);
                    Object.assign(t, payload);
                    toast("✅ O'qituvchi yangilandi");
                    closeModal('ovTeacher'); renderTeachers(); updateBadges();
                }).catch(err => toast("❌ Xato: " + err.message));
            } else {
                apiRequest('/api/teachers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => {
                    payload.id = res.id;
                    teachers.push(payload);
                    toast("✅ O'qituvchi qo'shildi");
                    closeModal('ovTeacher'); renderTeachers(); updateBadges();
                }).catch(err => toast("❌ Xato: " + err.message));
            }
        }
        function deleteTeacher(id) {
            if (!confirm("O'qituvchini o'chirishni tasdiqlaysizmi?")) return;
            apiRequest('/api/teachers/' + id, { method: 'DELETE' }).then(() => {
                teachers = teachers.filter(t => t.id !== id);
                groups.forEach(g => { if (g.teacherId === id) g.teacherId = null; });
                toast("🗑️ O'qituvchi o'chirildi"); renderTeachers(); updateBadges();
            }).catch(err => toast("❌ Xato: " + err.message));
        }

        /* ═══ GROUP CRUD ═══ */
        function openGroupModal(teacherId) {
            const t = teachers.find(t => t.id === teacherId);
            document.getElementById('gmTitle').textContent = "Guruh qo'shish";
            document.getElementById('gmSub').textContent = t ? t.ism + ' ' + t.fam + ' uchun' : '';
            sv('gf-level', ''); sv('gf-suffix', ''); sv('gf-fee', '');
            document.getElementById('gf-ts').value = '';
            sv('gf-te', '');
            document.querySelectorAll('#groupDayPills .day-pill').forEach(d => d.classList.remove('on'));
            document.querySelectorAll('.day-preset-btn').forEach(b => b.classList.remove('on'));
            document.getElementById('dayCountHint').textContent = '0 kun tanlandi';
            document.getElementById('ovGroup').dataset.teacherId = teacherId;
            openModal('ovGroup');
        }

        function toggleGroupDay(el) {
            el.classList.toggle('on');
            document.querySelectorAll('.day-preset-btn').forEach(b => b.classList.remove('on'));
            const count = document.querySelectorAll('#groupDayPills .day-pill.on').length;
            const hint = document.getElementById('dayCountHint');
            if (count === 3) {
                hint.textContent = '✅ 3 kun tanlandi';
                hint.style.color = 'var(--green)';
            } else {
                hint.textContent = count + ' kun tanlandi (3 ta bo\'lishi kerak)';
                hint.style.color = count > 3 ? 'var(--red)' : 'var(--muted)';
            }
        }

        function setDayPreset(type) {
            document.querySelectorAll('#groupDayPills .day-pill').forEach(d => d.classList.remove('on'));
            document.querySelectorAll('.day-preset-btn').forEach(b => b.classList.remove('on'));
            const presets = {
                odd: ['Du', 'Ch', 'Ju'],
                even: ['Se', 'Pa', 'Sh']
            };
            presets[type].forEach(day => {
                const pill = document.querySelector(`#groupDayPills .day-pill[data-day="${day}"]`);
                if (pill) pill.classList.add('on');
            });
            event.currentTarget.classList.add('on');
            const hint = document.getElementById('dayCountHint');
            hint.textContent = '✅ 3 kun tanlandi';
            hint.style.color = 'var(--green)';
        }
        function onLevelChange() {
            const val = gv('gf-level');
            if (!val) { sv('gf-fee', ''); return; }
            document.getElementById('gf-fee').value = parseInt(val.split('|')[1]).toLocaleString() + " so'm";
        }
        function updateEndTime() {
            const ts = document.getElementById('gf-ts').value;
            const endMap = { '09:30': '11:30', '14:30': '16:30', '16:30': '18:30', '18:30': '20:30' };
            document.getElementById('gf-te').value = endMap[ts] || '';
        }
        function saveGroup() {
            const levelVal = gv('gf-level');
            if (!levelVal) { toast("⚠️ Kurs darajasini tanlang"); return; }
            const [level, feeStr] = levelVal.split('|');
            const fee = parseInt(feeStr);
            const suffix = gv('gf-suffix');
            const name = 'Ingliz tili — ' + level + (suffix ? ' (' + suffix + ')' : '');
            const ts = document.getElementById('gf-ts').value;
            if (!ts) { toast("⚠️ Dars vaqtini tanlang"); return; }
            const te = document.getElementById('gf-te').value;
            const days = [...document.querySelectorAll('#groupDayPills .day-pill.on')].map(d => d.dataset.day);
            if (days.length !== 3) { toast("⚠️ Aynan 3 ta kun tanlang"); return; }
            const teacherId = parseInt(document.getElementById('ovGroup').dataset.teacherId);

            const payload = { teacherId, level, suffix, name, fee, ts, te, days, students: [] };

            apiRequest('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(res => {
                payload.id = res.id;
                groups.push(payload);
                toast("✅ Guruh qo'shildi"); closeModal('ovGroup'); renderTeachers(); updateBadges();
                if (document.getElementById('pg-schedule').classList.contains('on')) renderSchedule();
            }).catch(err => toast("❌ Xato: " + err.message));
        }

        /* ═══ GROUP DETAIL ═══ */
        function openGroupDetail(gid) {
            _activeGroupId = gid;
            const g = groups.find(g => g.id === gid);
            const t = teachers.find(t => t.id === g.teacherId);
            document.getElementById('gdTitle').textContent = g.name;
            document.getElementById('gdMeta').textContent = (t ? t.ism + ' ' + t.fam + ' | ' : '') +
                (g.ts ? g.ts + '–' + g.te + ' | ' : '') +
                (g.days?.length ? g.days.join(', ') : '') +
                ' | ' + g.fee.toLocaleString() + " so'm/oy";
            sv('sf-name', ''); sv('sf-phone', '');
            renderStudents(); openModal('ovGroupDetail');
        }
        function renderStudents() {
            const g = groups.find(g => g.id === _activeGroupId);
            if (!g || !g.students) return;
            const month = currentMonth();
            const el = document.getElementById('stuList');
            if (!g.students.length) { el.innerHTML = `<div class="empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>Hali o'quvchi qo'shilmagan</p></div>`; return; }
            el.innerHTML = g.students.map(s => {
                const pay = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === month);
                const paid = pay && pay.paid;
                const ini = s.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                return `<div class="stu-row">
            <div class="stu-left">
                <div class="stu-ava">${ini}</div>
                <div><div class="stu-name">${s.name}</div><div class="stu-phone">${s.phone}</div></div>
            </div>
            <div class="stu-right">
                <span class="badge ${paid ? 'b-green' : 'b-red'}">${paid ? "✓ To'lagan" : "✗ To'lamagan"}</span>
                ${!paid ? `<button class="btn-sm btn-pay" onclick="openPayFromDetail('${s.name}')">To'lov</button>` : ''}
                <button class="btn-sm btn-view" onclick="openStudentDetail('${s.name}',${g.id})">Tarixi</button>
                <button class="btn-sm btn-del" onclick="removeStudent(${s.id})">✕</button>
            </div>
        </div>`;
            }).join('');
        }
        function addStudent() {
            const name = gv('sf-name'), phone = gv('sf-phone');
            if (!name) { toast("⚠️ Ism kiriting"); return; }
            const g = groups.find(g => g.id === _activeGroupId);
            const newId = (g.students[g.students.length - 1]?.id || 0) + 1;
            const studentEntry = { id: newId, name, phone };

            // Create a local copy to update
            const updatedStudents = [...g.students, studentEntry];

            apiRequest('/api/groups/' + g.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...g, students: updatedStudents })
            }).then(() => {
                g.students = updatedStudents;
                // Add initial payment record
                const payPayload = { studentName: name, groupId: _activeGroupId, month: currentMonth(), amount: g.fee, date: null, paid: false };
                apiRequest('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payPayload)
                }).then(res => {
                    payPayload.id = res.id;
                    payments.push(payPayload);
                    toast("✅ O'quvchi qo'shildi"); renderStudents(); updateBadges();
                });
                sv('sf-name', ''); sv('sf-phone', '');
            }).catch(err => toast("❌ Xato: " + err.message));
        }
        function removeStudent(sid) {
            if (!confirm("O'quvchini guruhdan o'chirishni tasdiqlaysizmi?")) return;
            const g = groups.find(g => g.id === _activeGroupId);
            const s = g.students.find(s => s.id === sid);
            if (!s) return;

            const updatedStudents = g.students.filter(st => st.id !== sid);

            apiRequest('/api/groups/' + g.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...g, students: updatedStudents })
            }).then(() => {
                payments = payments.filter(p => !(p.groupId === _activeGroupId && p.studentName === s.name));
                g.students = updatedStudents;
                toast("🗑️ O'quvchi o'chirildi"); renderStudents(); updateBadges();
            }).catch(err => toast("❌ Xato: " + err.message));
        }

        /* ═══ PAYMENTS ═══ */
        function openPayFromDetail(studentName) {
            _payTarget = { studentName, groupId: _activeGroupId };
            const g = groups.find(g => g.id === _activeGroupId);
            document.getElementById('pvTitle').textContent = "To'lov qabul qilish";
            document.getElementById('pvSub').textContent = studentName + ' — ' + g.name;
            document.getElementById('pf-amount').value = g.fee;
            document.getElementById('pf-date').value = todayStr();
            document.getElementById('pf-month').selectedIndex = new Date().getMonth();
            openModal('ovPay');
        }
        function openPayFromUnpaid(studentName, groupId) {
            _payTarget = { studentName, groupId, fromUnpaid: true };
            const g = groups.find(g => g.id === groupId);
            // Barcha to'lanmagan oylarni hisoblash
            const curMonthIdx = new Date().getMonth();
            const checkMonths = MONTHS.slice(0, curMonthIdx + 1);
            const unpaidMonths = checkMonths.filter(month => {
                const pay = payments.find(p => p.groupId === groupId && p.studentName === studentName && p.month === month);
                return !pay || !pay.paid;
            });
            const totalDebt = unpaidMonths.length * g.fee;
            _payTarget.unpaidMonths = unpaidMonths;
            document.getElementById('pvTitle').textContent = "To'lov qabul qilish";
            document.getElementById('pvSub').textContent = studentName + ' — ' + g.name + ' (' + unpaidMonths.length + ' oy uchun)';
            document.getElementById('pf-amount').value = totalDebt;
            document.getElementById('pf-date').value = todayStr();
            document.getElementById('pf-month').selectedIndex = new Date().getMonth();
            openModal('ovPay');
        }
        function confirmPay() {
            if (!_payTarget) return;
            const amount = parseInt(document.getElementById('pf-amount').value) || 0;
            const date = gv('pf-date');

            // Agar to'lamaganlar ro'yxatidan bo'lsa — barcha oylarni to'laymiz
            if (_payTarget.fromUnpaid && _payTarget.unpaidMonths && _payTarget.unpaidMonths.length > 0) {
                const monthsToPay = _payTarget.unpaidMonths;
                const perMonth = Math.floor(amount / monthsToPay.length) || 0;
                let completed = 0;
                monthsToPay.forEach(month => {
                    const existing = payments.find(p => p.groupId === _payTarget.groupId && p.studentName === _payTarget.studentName && p.month === month);
                    const payload = { studentName: _payTarget.studentName, groupId: _payTarget.groupId, month, amount: perMonth, date, paid: true };
                    if (existing) {
                        apiRequest('/api/payments/' + existing.id, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        }).then(() => {
                            Object.assign(existing, payload);
                            completed++;
                            if (completed === monthsToPay.length) finishConfirmPay();
                        }).catch(err => toast("❌ Xato: " + err.message));
                    } else {
                        apiRequest('/api/payments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        }).then(res => {
                            payload.id = res.id;
                            payments.push(payload);
                            completed++;
                            if (completed === monthsToPay.length) finishConfirmPay();
                        }).catch(err => toast("❌ Xato: " + err.message));
                    }
                });
                return;
            }

            // Oddiy bir oylik to'lov
            const sel = document.getElementById('pf-month');
            const month = sel.options[sel.selectedIndex].text;
            const existing = payments.find(p => p.groupId === _payTarget.groupId && p.studentName === _payTarget.studentName && p.month === month);
            const payload = { studentName: _payTarget.studentName, groupId: _payTarget.groupId, month, amount, date, paid: true };

            if (existing) {
                apiRequest('/api/payments/' + existing.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(() => {
                    Object.assign(existing, payload);
                    finishConfirmPay();
                }).catch(err => toast("❌ Xato: " + err.message));
            } else {
                apiRequest('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => {
                    payload.id = res.id;
                    payments.push(payload);
                    finishConfirmPay();
                }).catch(err => toast("❌ Xato: " + err.message));
            }
        }

        function finishConfirmPay() {
            toast("✅ To'lov saqlandi");
            closeModal('ovPay');
            renderStudents(); renderUnpaid(); renderAllStudents(_stuSearchFilter); updateBadges();
        }

        /* ═══ MODAL HELPERS ═══ */
        function openModal(id) { document.getElementById(id).classList.add('on'); }
        function closeModal(id) { document.getElementById(id).classList.remove('on'); }
        document.querySelectorAll('.overlay').forEach(o => {
            o.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('on'); });
        });

        /* ═══ UTILS ═══ */
        function gv(id) { return document.getElementById(id).value.trim(); }
        function sv(id, val) { document.getElementById(id).value = val; }
        function currentMonth() { return MONTHS[new Date().getMonth()]; }
        function todayStr() { return new Date().toISOString().split('T')[0]; }
        function toast(msg) {
            const t = document.getElementById('toast');
            t.textContent = msg; t.classList.add('on');
            clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2800);
        }

        /* ═══ SCHEDULE ═══ */
        const DAYS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
        const DAYS_FULL = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const TIME_SLOTS = ['09:30', '14:30', '16:30', '18:30'];

        function levelClass(level) {
            return level.toLowerCase().replace('-', '').replace(' ', '');
        }

        function populateSchFilters() {
            const sel = document.getElementById('schFilterTeacher');
            const cur = sel.value;
            sel.innerHTML = '<option value="">Barcha o\'qituvchilar</option>';
            teachers.forEach(t => {
                const o = document.createElement('option');
                o.value = t.id;
                o.textContent = t.ism + ' ' + t.fam;
                sel.appendChild(o);
            });
            sel.value = cur;
        }

        function renderSchedule() {
            populateSchFilters();
            const filterTeacher = document.getElementById('schFilterTeacher').value;
            const filterLevel = document.getElementById('schFilterLevel').value;

            const rawDow = (new Date().getDay() + 6) % 7; // 0=Du,...,6=Ya
            const todayDow = rawDow <= 5 ? rawDow : -1;   // Yakshanba(6) = dam, ajratilmaydi

            // Header
            const headerRow = document.getElementById('schHeaderRow');
            headerRow.innerHTML = `<div class="sch-time-col">Vaqt</div>` +
                DAYS_FULL.map((d, i) => `<div class="sch-day-head${i === todayDow ? ' today' : ''}">${d}<br><span style="font-size:.68rem;opacity:.55;font-weight:400">${DAYS_UZ[i]}</span></div>`).join('');

            // Filter groups
            let filteredGroups = groups.filter(g => {
                if (filterTeacher && g.teacherId != filterTeacher) return false;
                if (filterLevel && g.level !== filterLevel) return false;
                return true;
            });

            // Build grid: time slots x days
            const body = document.getElementById('schBody');
            body.innerHTML = '';

            TIME_SLOTS.forEach(slot => {
                // Time label
                const tlabel = document.createElement('div');
                tlabel.className = 'sch-time-label';
                tlabel.textContent = slot;
                body.appendChild(tlabel);

                DAYS_UZ.forEach((dayCode, di) => {
                    const cell = document.createElement('div');
                    cell.className = 'sch-cell' + (di === todayDow ? ' today-col' : '');

                    const lessonsHere = filteredGroups.filter(g => {
                        if (!g.days || !g.ts) return false;
                        return g.days.includes(dayCode) && g.ts === slot;
                    });

                    if (lessonsHere.length) {
                        lessonsHere.forEach(g => {
                            const teacher = teachers.find(t => t.id === g.teacherId);
                            const div = document.createElement('div');
                            div.className = 'sch-lesson ' + levelClass(g.level);
                            div.innerHTML = `
                                <div class="sch-lesson-level">${g.level}</div>
                                <div class="sch-lesson-time">${g.ts} – ${g.te}</div>
                                <div class="sch-lesson-teacher">${teacher ? teacher.ism + ' ' + teacher.fam : '—'}</div>
                                <div class="sch-lesson-count">👤 ${g.students.length} o'quvchi</div>
                            `;
                            div.onclick = (e) => showSchPopup(e, g);
                            cell.appendChild(div);
                        });
                    }
                    body.appendChild(cell);
                });
            });
        }

        function showSchPopup(e, g) {
            e.stopPropagation();
            const teacher = teachers.find(t => t.id === g.teacherId);
            const popup = document.getElementById('schPopup');
            document.getElementById('schPopupTitle').textContent = g.name;
            document.getElementById('schPopupBody').innerHTML = `
                <div class="sch-popup-row"><span class="sch-popup-label">Daraja</span><span class="sch-popup-val"><span class="badge b-gold">${g.level}</span></span></div>
                <div class="sch-popup-row"><span class="sch-popup-label">Vaqt</span><span class="sch-popup-val">${g.ts} – ${g.te}</span></div>
                <div class="sch-popup-row"><span class="sch-popup-label">Kunlar</span><span class="sch-popup-val">${g.days?.join(', ') || '—'}</span></div>
                <div class="sch-popup-row"><span class="sch-popup-label">O'qituvchi</span><span class="sch-popup-val">${teacher ? teacher.ism + ' ' + teacher.fam : '—'}</span></div>
                <div class="sch-popup-row"><span class="sch-popup-label">O'quvchilar</span><span class="sch-popup-val">${g.students.length} ta</span></div>
                <div class="sch-popup-row"><span class="sch-popup-label">To'lov</span><span class="sch-popup-val">${g.fee.toLocaleString()} so'm/oy</span></div>
            `;
            // Position popup near click
            const rect = e.target.closest('.sch-lesson').getBoundingClientRect();
            popup.style.top = (rect.bottom + 8 + window.scrollY) + 'px';
            popup.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';
            popup.classList.add('on');
        }

        function closeSchPopup() {
            document.getElementById('schPopup').classList.remove('on');
        }
        document.addEventListener('click', function (e) {
            const popup = document.getElementById('schPopup');
            if (!e.target.closest('.sch-lesson') && !e.target.closest('.sch-popup')) {
                popup.classList.remove('on');
            }
        });

        /* ═══ NOTIFICATIONS ═══ */
        let notifications = [];
        let _notifFilter = 'all';
        let _notifIdCounter = 100;

        function generateNotifications() {
            notifications = [];
            const now = new Date();
            const curMonth = currentMonth();

            // 1. To'lov eslatmalari — to'lamagan o'quvchilar
            const unpaidList = getUnpaidList();
            unpaidList.forEach((item, i) => {
                const minutesAgo = 5 + i * 12;
                const time = new Date(now.getTime() - minutesAgo * 60000);
                notifications.push({
                    id: _notifIdCounter++,
                    type: 'payment',
                    title: `${item.student.name} to'lov qilmagan`,
                    desc: `${item.group.name} — ${item.unpaidMonths.join(', ')} oylari uchun ${item.totalDebt.toLocaleString()} so'm qarzdor`,
                    time: time,
                    read: false,
                    studentName: item.student.name,
                    groupId: item.group.id
                });
            });

            // 2. Ogohlantirish — ko'p oylik qarzdorlar (2+ oy)
            unpaidList.filter(u => u.unpaidMonths.length >= 2).forEach((item, i) => {
                const time = new Date(now.getTime() - (30 + i * 20) * 60000);
                notifications.push({
                    id: _notifIdCounter++,
                    type: 'warning',
                    title: `⚠️ Yuqori qarzdorlik: ${item.student.name}`,
                    desc: `${item.unpaidMonths.length} oy davomida to'lov amalga oshirmagan! Umumiy qarz: ${item.totalDebt.toLocaleString()} so'm. Aloqaga chiqish tavsiya etiladi.`,
                    time: time,
                    read: false
                });
            });

            // 3. Guruh ma'lumotlari
            groups.forEach((g, i) => {
                if (g.students.length >= 3) {
                    const time = new Date(now.getTime() - (120 + i * 45) * 60000);
                    notifications.push({
                        id: _notifIdCounter++,
                        type: 'info',
                        title: `${g.name} guruhida ${g.students.length} ta o'quvchi`,
                        desc: `O'qituvchi: ${(() => { const t = teachers.find(t => t.id === g.teacherId); return t ? t.ism + ' ' + t.fam : 'Belgilanmagan'; })()}. Dars vaqti: ${g.ts}–${g.te}, ${g.days?.join(', ') || ''}`,
                        time: time,
                        read: true
                    });
                }
            });

            // 4. Muvaffaqiyatli to'lovlar
            const recentPaid = payments.filter(p => p.paid && p.date);
            recentPaid.slice(-3).forEach((p, i) => {
                const time = new Date(now.getTime() - (180 + i * 60) * 60000);
                const g = groups.find(g => g.id === p.groupId);
                notifications.push({
                    id: _notifIdCounter++,
                    type: 'success',
                    title: `${p.studentName} to'lov amalga oshirdi`,
                    desc: `${g ? g.name : ''} — ${p.month} oyi uchun ${p.amount.toLocaleString()} so'm to'landi`,
                    time: time,
                    read: true
                });
            });

            // 5. Tizim ma'lumotlari
            notifications.push({
                id: _notifIdCounter++,
                type: 'info',
                title: 'Tizimga xush kelibsiz!',
                desc: `Everest O'quv Markazi admin paneli. Jami: ${teachers.length} o'qituvchi, ${groups.reduce((a, g) => a + g.students.length, 0)} o'quvchi, ${groups.length} guruh.`,
                time: new Date(now.getTime() - 24 * 60 * 60000),
                read: true
            });

            // Vaqt bo'yicha saralash
            notifications.sort((a, b) => b.time - a.time);
        }

        function timeAgo(date) {
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);
            if (diff < 60) return 'Hozirgina';
            if (diff < 3600) return Math.floor(diff / 60) + ' daqiqa oldin';
            if (diff < 86400) return Math.floor(diff / 3600) + ' soat oldin';
            return Math.floor(diff / 86400) + ' kun oldin';
        }

        function getNotifIcon(type) {
            const icons = {
                payment: '💰',
                warning: '⚠️',
                info: 'ℹ️',
                success: '✅'
            };
            return icons[type] || '📌';
        }

        function getNotifTagLabel(type) {
            const labels = {
                payment: "To'lov",
                warning: 'Ogohlantirish',
                info: "Ma'lumot",
                success: 'Muvaffaqiyat'
            };
            return labels[type] || type;
        }

        function filterNotifs(filter, el) {
            _notifFilter = filter;
            document.querySelectorAll('.notif-filter-chip').forEach(c => c.classList.remove('on'));
            if (el) el.classList.add('on');
            renderNotifList();
        }

        function renderNotifications() {
            if (!notifications.length) generateNotifications();
            renderNotifStats();
            renderNotifFilterCounts();
            renderNotifList();
            updateNotifBadge();
        }

        function renderNotifStats() {
            const unread = notifications.filter(n => !n.read).length;
            const payCount = notifications.filter(n => n.type === 'payment').length;
            const warnCount = notifications.filter(n => n.type === 'warning').length;
            const total = notifications.length;

            document.getElementById('notifStats').innerHTML = `
                <div class="notif-stat-card">
                    <div class="notif-stat-icon gold">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <div>
                        <div class="notif-stat-num">${total}</div>
                        <div class="notif-stat-label">Jami bildirishnomalar</div>
                    </div>
                </div>
                <div class="notif-stat-card">
                    <div class="notif-stat-icon red">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div>
                        <div class="notif-stat-num">${unread}</div>
                        <div class="notif-stat-label">O'qilmagan</div>
                    </div>
                </div>
                <div class="notif-stat-card">
                    <div class="notif-stat-icon blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2472a4" stroke-width="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                    </div>
                    <div>
                        <div class="notif-stat-num">${payCount}</div>
                        <div class="notif-stat-label">To'lov eslatmalari</div>
                    </div>
                </div>
                <div class="notif-stat-card">
                    <div class="notif-stat-icon green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div>
                        <div class="notif-stat-num">${warnCount}</div>
                        <div class="notif-stat-label">Ogohlantirishlar</div>
                    </div>
                </div>
            `;
        }

        function renderNotifFilterCounts() {
            document.getElementById('nfAll').textContent = notifications.length;
            document.getElementById('nfPayment').textContent = notifications.filter(n => n.type === 'payment').length;
            document.getElementById('nfWarning').textContent = notifications.filter(n => n.type === 'warning').length;
            document.getElementById('nfInfo').textContent = notifications.filter(n => n.type === 'info').length;
            document.getElementById('nfSuccess').textContent = notifications.filter(n => n.type === 'success').length;
        }

        function renderNotifList() {
            let list = notifications;
            if (_notifFilter !== 'all') {
                list = list.filter(n => n.type === _notifFilter);
            }

            const el = document.getElementById('notifList');
            if (!list.length) {
                el.innerHTML = `
                    <div class="notif-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <p>Bildirishnoma topilmadi</p>
                        <div class="sub">Hozircha bu turdagi bildirishnomalar yo'q</div>
                    </div>
                `;
                return;
            }

            el.innerHTML = list.map((n, i) => `
                <div class="notif-card ${n.read ? '' : 'unread'}" style="animation-delay:${i * 0.04}s" id="notif-${n.id}">
                    <div class="notif-icon ${n.type}">${getNotifIcon(n.type)}</div>
                    <div class="notif-body">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-desc">${n.desc}</div>
                        <div class="notif-meta">
                            <span class="notif-time">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                ${timeAgo(n.time)}
                            </span>
                            <span class="notif-tag ${n.type}">${getNotifTagLabel(n.type)}</span>
                        </div>
                    </div>
                    <div class="notif-card-actions">
                        ${!n.read ? `<button class="notif-btn" onclick="markRead(${n.id})" title="O'qildi deb belgilash">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </button>` : ''}
                        <button class="notif-btn del" onclick="deleteNotif(${n.id})" title="O'chirish">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function markRead(id) {
            const n = notifications.find(n => n.id === id);
            if (n) n.read = true;
            renderNotifications();
            toast('✅ O\'qildi deb belgilandi');
        }

        function markAllRead() {
            notifications.forEach(n => n.read = true);
            renderNotifications();
            toast('✅ Barcha bildirishnomalar o\'qildi');
        }

        function deleteNotif(id) {
            notifications = notifications.filter(n => n.id !== id);
            renderNotifications();
            toast('🗑️ Bildirishnoma o\'chirildi');
        }

        function clearAllNotifs() {
            if (!confirm('Barcha bildirishnomalarni o\'chirishni tasdiqlaysizmi?')) return;
            notifications = [];
            renderNotifications();
            toast('🗑️ Barcha bildirishnomalar tozalandi');
        }

        function updateNotifBadge() {
            const unread = notifications.filter(n => !n.read).length;
            document.getElementById('badgeNotif').textContent = unread;
            const bellCount = document.getElementById('tbBellCount');
            bellCount.textContent = unread > 0 ? unread : '';
        }

        /* ═══ REPORTS ═══ */
        const HBAR_COLORS = ['gold', 'blue', 'green', 'purple', 'red'];

        function renderReports() {
            renderRepSummary();
            renderRepMonthlyChart();
            renderRepTeacherBars();
            renderRepGroupFill();
            renderRepPayEfficiency();
            renderRepDetailTable();
        }

        function getMonthlyRevenue() {
            const rev = {};
            MONTHS.forEach(m => rev[m] = 0);
            payments.filter(p => p.paid).forEach(p => {
                if (rev[p.month] !== undefined) rev[p.month] += p.amount;
            });
            return rev;
        }

        function renderRepSummary() {
            const totalStudents = groups.reduce((a, g) => a + g.students.length, 0);
            const totalPaid = payments.filter(p => p.paid).reduce((a, p) => a + p.amount, 0);
            const totalExpected = groups.reduce((a, g) => a + g.students.length * g.fee, 0);
            const curMonth = currentMonth();
            const curMonthPaid = payments.filter(p => p.paid && p.month === curMonth).reduce((a, p) => a + p.amount, 0);
            const curMonthExpected = groups.reduce((a, g) => a + g.students.length * g.fee, 0);
            const collectionRate = curMonthExpected > 0 ? Math.round((curMonthPaid / curMonthExpected) * 100) : 0;
            const unpaidCount = getUnpaidList().length;

            document.getElementById('repSummary').innerHTML = `
                <div class="rep-card gold">
                    <div class="rep-card-icon gold">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div class="rep-card-num">${totalPaid.toLocaleString()}</div>
                    <div class="rep-card-label">Jami yig'ilgan to'lov (so'm)</div>
                    <div class="rep-card-change up">📈 Barcha oylar</div>
                </div>
                <div class="rep-card green">
                    <div class="rep-card-icon green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                    </div>
                    <div class="rep-card-num">${curMonthPaid.toLocaleString()}</div>
                    <div class="rep-card-label">${curMonth} oyi daromadi</div>
                    <div class="rep-card-change ${collectionRate >= 50 ? 'up' : 'down'}">${collectionRate >= 50 ? '📈' : '📉'} ${collectionRate}% yig'ildi</div>
                </div>
                <div class="rep-card blue">
                    <div class="rep-card-icon blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2472a4" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                    </div>
                    <div class="rep-card-num">${totalStudents}</div>
                    <div class="rep-card-label">Jami o'quvchilar</div>
                    <div class="rep-card-change up">📊 ${groups.length} guruhda</div>
                </div>
                <div class="rep-card red">
                    <div class="rep-card-icon red">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div class="rep-card-num">${unpaidCount}</div>
                    <div class="rep-card-label">To'lov kutayotganlar</div>
                    <div class="rep-card-change down">⚠️ Diqqat talab etadi</div>
                </div>
            `;
        }

        function renderRepMonthlyChart() {
            const rev = getMonthlyRevenue();
            const maxVal = Math.max(...Object.values(rev), 1);
            const curMonthIdx = new Date().getMonth();
            const monthsToShow = MONTHS.slice(0, curMonthIdx + 1);

            document.getElementById('repMonthlyChart').innerHTML = monthsToShow.map((m, i) => {
                const val = rev[m];
                const pct = Math.max((val / maxVal) * 100, 3);
                const shortLabel = m.substring(0, 3);
                return `<div class="rep-bar-col">
                    <div class="rep-bar-val">${val > 0 ? (val / 1000000).toFixed(1) + 'M' : '0'}</div>
                    <div class="rep-bar" style="height:${pct}%;opacity:${i === curMonthIdx ? '1' : '.75'}" title="${m}: ${val.toLocaleString()} so'm"></div>
                    <div class="rep-bar-label">${shortLabel}</div>
                </div>`;
            }).join('');
        }

        function renderRepTeacherBars() {
            const teacherRevenue = teachers.map(t => {
                const tGroups = groups.filter(g => g.teacherId === t.id);
                const revenue = tGroups.reduce((sum, g) => {
                    const gPayments = payments.filter(p => p.groupId === g.id && p.paid);
                    return sum + gPayments.reduce((s, p) => s + p.amount, 0);
                }, 0);
                const studentCount = tGroups.reduce((s, g) => s + g.students.length, 0);
                return { name: t.ism + ' ' + t.fam, revenue, studentCount, groupCount: tGroups.length };
            }).sort((a, b) => b.revenue - a.revenue);

            const maxRev = Math.max(...teacherRevenue.map(t => t.revenue), 1);

            document.getElementById('repTeacherBars').innerHTML = teacherRevenue.map((t, i) => {
                const pct = Math.max((t.revenue / maxRev) * 100, 5);
                const color = HBAR_COLORS[i % HBAR_COLORS.length];
                return `<div class="rep-hbar-row">
                    <div class="rep-hbar-name">${t.name}</div>
                    <div class="rep-hbar-track">
                        <div class="rep-hbar-fill ${color}" style="width:${pct}%">${t.revenue > 0 ? (t.revenue / 1000000).toFixed(1) + 'M' : ''}</div>
                    </div>
                    <div class="rep-hbar-val">${t.revenue.toLocaleString()}</div>
                </div>`;
            }).join('') + `<div style="margin-top:12px;font-size:.75rem;color:var(--muted)">* so'm da ko'rsatilgan</div>`;
        }

        function renderRepGroupFill() {
            const el = document.getElementById('repGroupFill');
            el.innerHTML = groups.map(g => {
                const count = g.students.length;
                const pct = Math.min(Math.round((count / groupCapacity) * 100), 100);
                const level = pct >= 70 ? 'high' : pct >= 35 ? 'mid' : 'low';
                return `<div class="rep-progress-row">
                    <div class="rep-progress-info">
                        <div class="rep-progress-name">${g.level}${g.suffix ? ' (' + g.suffix + ')' : ''}</div>
                        <div class="rep-progress-meta">${count}/${groupCapacity} o'quvchi</div>
                    </div>
                    <div class="rep-progress-bar">
                        <div class="rep-progress-fill ${level}" style="width:${pct}%"></div>
                    </div>
                    <div class="rep-progress-pct" style="color:var(--${level === 'high' ? 'green' : level === 'mid' ? 'gold' : 'red'})">${pct}%</div>
                </div>`;
            }).join('');
        }

        function renderRepPayEfficiency() {
            const curMonth = currentMonth();
            const el = document.getElementById('repPayEfficiency');

            const courseStats = COURSES.map((c, i) => {
                const cGroups = groups.filter(g => g.level === c.key);
                const totalStudents = cGroups.reduce((s, g) => s + g.students.length, 0);
                const expected = totalStudents * c.fee;
                const collected = cGroups.reduce((sum, g) => {
                    return sum + payments.filter(p => p.groupId === g.id && p.paid && p.month === curMonth).reduce((s, p) => s + p.amount, 0);
                }, 0);
                const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;
                return { name: c.key, expected, collected, pct, students: totalStudents };
            }).filter(c => c.students > 0);

            el.innerHTML = courseStats.map((c, i) => {
                const color = HBAR_COLORS[i % HBAR_COLORS.length];
                const level = c.pct >= 70 ? 'high' : c.pct >= 35 ? 'mid' : 'low';
                return `<div class="rep-progress-row">
                    <div class="rep-progress-info">
                        <div class="rep-progress-name">${c.name}</div>
                        <div class="rep-progress-meta">${c.collected.toLocaleString()} / ${c.expected.toLocaleString()} so'm</div>
                    </div>
                    <div class="rep-progress-bar">
                        <div class="rep-progress-fill ${level}" style="width:${c.pct}%"></div>
                    </div>
                    <div class="rep-progress-pct" style="color:var(--${level === 'high' ? 'green' : level === 'mid' ? 'gold' : 'red'})">${c.pct}%</div>
                </div>`;
            }).join('') || '<div style="text-align:center;padding:20px;color:var(--muted)">Ma\'lumot topilmadi</div>';
        }

        function renderRepDetailTable() {
            const curMonth = currentMonth();
            const tbody = document.getElementById('repDetailBody');

            tbody.innerHTML = groups.map(g => {
                const teacher = teachers.find(t => t.id === g.teacherId);
                const stuCount = g.students.length;
                const expected = stuCount * g.fee;
                const collected = payments.filter(p => p.groupId === g.id && p.paid && p.month === curMonth).reduce((s, p) => s + p.amount, 0);
                const diff = collected - expected;
                const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;

                return `<tr style="border-bottom:1px solid var(--border)">
                    <td style="text-align:left">
                        <div style="font-weight:600">${g.name}</div>
                        <span class="badge b-gold" style="font-size:.68rem;margin-top:3px">${g.level}</span>
                    </td>
                    <td style="text-align:left;font-size:.83rem">${teacher ? teacher.ism + ' ' + teacher.fam : '—'}</td>
                    <td style="text-align:center">
                        <span style="font-weight:600">${stuCount}</span>
                        <span style="font-size:.73rem;color:var(--muted)">/${groupCapacity}</span>
                    </td>
                    <td style="text-align:center;font-size:.83rem">${g.fee.toLocaleString()}</td>
                    <td style="text-align:center;font-weight:600;color:var(--muted)">${expected.toLocaleString()}</td>
                    <td style="text-align:center;font-weight:600;color:var(--green)">${collected.toLocaleString()}</td>
                    <td style="text-align:center;font-weight:600;color:${diff >= 0 ? 'var(--green)' : 'var(--red)'}">${diff >= 0 ? '+' : ''}${diff.toLocaleString()}</td>
                    <td style="text-align:center">
                        <span class="badge ${pct >= 70 ? 'b-green' : pct >= 35 ? 'b-gold' : 'b-red'}" style="font-size:.75rem">${pct}%</span>
                    </td>
                </tr>`;
            }).join('');
        }

        /* ═══ SETTINGS ═══ */
        function renderSettings() {
            renderCoursePrices();
            document.getElementById('setAdminLogin').value = adminLogin;
            document.getElementById('setCenterName').value = centerInfo.name;
            document.getElementById('setCenterAddr').value = centerInfo.addr;
            document.getElementById('setCenterPhone').value = centerInfo.phone;
            document.getElementById('setCenterEmail').value = centerInfo.email;
            document.getElementById('setGroupCap').value = groupCapacity;
        }

        function renderCoursePrices() {
            document.getElementById('setCoursePrices').innerHTML = COURSES.map((c, i) => `
                <div class="set-row">
                    <div class="set-row-left">
                        <span class="badge b-gold">${c.key}</span>
                        <div>
                            <div class="set-row-name">Ingliz tili — ${c.key}</div>
                            <div class="set-row-meta">Joriy narx: ${c.fee.toLocaleString()} so'm/oy</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                        <input class="set-fee-input" type="number" id="setFee${i}" value="${c.fee}" min="0" step="10000" />
                        <span style="font-size:.78rem;color:var(--muted)">so'm</span>
                    </div>
                </div>
            `).join('');
        }

        function saveAdminProfile() {
            const login = document.getElementById('setAdminLogin').value.trim();
            const oldPass = document.getElementById('setAdminOldPass').value;
            const newPass = document.getElementById('setAdminNewPass').value;

            if (!login) { toast('❌ Login bo\'sh bo\'lishi mumkin emas'); return; }

            if (newPass) {
                if (oldPass !== adminPass) { toast('❌ Joriy parol noto\'g\'ri'); return; }
                if (newPass.length < 6) { toast('❌ Yangi parol kamida 6 ta belgidan iborat bo\'lsin'); return; }
                adminPass = newPass;
            }

            adminLogin = login;
            document.getElementById('setAdminOldPass').value = '';
            document.getElementById('setAdminNewPass').value = '';
            persistSettings();
            toast('✅ Admin profili saqlandi');
        }

        function saveCenterInfo() {
            centerInfo.name = document.getElementById('setCenterName').value.trim();
            centerInfo.addr = document.getElementById('setCenterAddr').value.trim();
            centerInfo.phone = document.getElementById('setCenterPhone').value.trim();
            centerInfo.email = document.getElementById('setCenterEmail').value.trim();
            persistSettings();
            toast('✅ Markaz ma\'lumotlari saqlandi');
        }

        function saveCoursePrices() {
            COURSES.forEach((c, i) => {
                const val = parseInt(document.getElementById('setFee' + i).value);
                if (!isNaN(val) && val >= 0) {
                    c.fee = val;
                    // Guruhlarni ham yangilash
                    groups.filter(g => g.level === c.key).forEach(g => { g.fee = val; });
                }
            });
            persistSettings();
            renderCoursePrices();
            toast('✅ Kurs narxlari yangilandi');
        }

        function saveGeneralSettings() {
            const cap = parseInt(document.getElementById('setGroupCap').value);
            if (!isNaN(cap) && cap > 0 && cap <= 50) {
                groupCapacity = cap;
                persistSettings();
            }
            toast('✅ Umumiy sozlamalar saqlandi');
        }



        document.addEventListener('DOMContentLoaded', function () {
            loadInitialData()
                .then(function () {
                    generateNotifications();
                    renderTeachers();
                    updateBadges();
                    updateNotifBadge();
                })
                .catch(function (err) {
                    generateNotifications();
                    renderTeachers();
                    updateBadges();
                    updateNotifBadge();
                    toast(err.message || 'Ma\'lumotlarni yuklab bo\'lmadi');
                });
        });
    