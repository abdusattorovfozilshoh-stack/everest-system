
                    /* ═══ SESSION ═══ */
                    if (!requireTeacher()) {
                        // Redirect happens inside requireTeacher
                    }

                    /* ═══ DATA ═══ */
                    const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                    const DAYS_FULL = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
                    const DAYS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
                    const TIME_SLOTS = ['09:30', '14:30', '16:30', '18:30'];

                    let allTeachers = [];
                    let allGroups = [];
                    let myGroups = [];
                    let payments = [];
                    let ME = { id: null, ism: '', fam: '' };
                    let attendance = JSON.parse(localStorage.getItem('ev_attendance') || '{}');

                    /* ═══ INITIALIZATION ═══ */
                    async function init() {
                        try {
                            const session = loadSession();
                            if (!session || session.role !== 'teacher' || !session.teacherId) {
                                window.location.href = 'index.html';
                                return;
                            }
                            ME.id = session.teacherId;

                            // Load Data
                            [allTeachers, allGroups, payments] = await Promise.all([
                                API.teachers.list(),
                                API.groups.list(),
                                API.payments.list()
                            ]);

                            myGroups = allGroups.filter(g => Number(g.teacherId) === Number(ME.id));

                            fillTeacherShell();
                            renderGroupPage();
                            updateBadges();
                            toast("✅ Xush kelibsiz!");
                        } catch (err) {
                            console.error("Init error:", err);
                            toast("❌ Xatolik: " + err.message);
                        }
                    }

                    function fillTeacherShell() {
                        document.getElementById('tbDate').textContent = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        const t = allTeachers.find(t => t.id === ME.id);
                        if (t) {
                            ME.ism = t.ism; ME.fam = t.fam;
                            document.getElementById('sbName').textContent = t.ism + ' ' + t.fam;
                            document.getElementById('sbAvatar').textContent = (t.ism[0] + (t.fam[0] || '')).toUpperCase();
                        }
                        // Group Filter
                        const sel = document.getElementById('filterGroup');
                        if (sel) {
                            sel.innerHTML = '<option value="">Barcha guruhlar</option>';
                            myGroups.forEach(g => {
                                const o = document.createElement('option');
                                o.value = g.id;
                                o.textContent = g.name.replace('Ingliz tili — ', '').replace('Ingliz tili - ', '');
                                sel.appendChild(o);
                            });
                        }
                    }

                    /* ═══ NAVIGATION ═══ */
                    function goPage(name, el) {
                        document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
                        document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('on'));
                        document.getElementById('pg-' + name).classList.add('on');
                        if (el) el.classList.add('on');

                        const titles = {
                            groups: ["Mening guruhlarim", "Guruhlar va o'quvchilar boshqaruvi"],
                            students: ["O'quvchilar ro'yxati", "Barcha o'quvchilaringiz va to'lov holati"],
                            schedule: ["Dars jadvali", "Haftalik dars jadvalingiz"],
                            attendance: ["Davomat", "O'quvchilar davomatini belgilash"],
                            stats: ["Statistika", "Guruh va o'quvchilar tahlili"],
                            profile: ["Profilim", "Shaxsiy ma'lumotlar va sozlamalar"]
                        };
                        document.getElementById('tbTitle').textContent = titles[name][0];
                        document.getElementById('tbSub').textContent = titles[name][1];

                        if (name === 'groups') renderGroupPage();
                        if (name === 'students') renderStudents();
                        if (name === 'schedule') renderSchedule();
                        if (name === 'attendance') initAttendance();
                        if (name === 'stats') renderStats2();
                        if (name === 'profile') renderProfile();
                    }

                    /* ═══ ATTENDANCE ═══ */
                    function saveAttendance() {
                        try { localStorage.setItem('ev_attendance', JSON.stringify(attendance)); } catch (e) { }
                    }

                    function initAttendance() {
                        const sel = document.getElementById('attGroupSel');
                        if (sel) {
                            sel.innerHTML = '<option value="">— Guruh tanlang —</option>';
                            myGroups.forEach(g => {
                                const o = document.createElement('option');
                                o.value = g.id;
                                o.textContent = g.name.replace('Ingliz tili — ', '').replace('Ingliz tili - ', '');
                                sel.appendChild(o);
                            });
                        }
                        const dateInput = document.getElementById('attDate');
                        if (dateInput) dateInput.value = todayStr();
                        renderAttendance();
                    }

                    function renderAttendance() {
                        const gid = document.getElementById('attGroupSel').value;
                        const date = document.getElementById('attDate').value;
                        const cont = document.getElementById('attContent');
                        if (!cont) return;
                        if (!gid) {
                            cont.innerHTML = `<div class="empty"><p>Guruh tanlang</p></div>`;
                            return;
                        }
                        const g = myGroups.find(g => g.id == gid);
                        if (!g) return;
                        const key = `${gid}_${date}`;
                        if (!attendance[key]) attendance[key] = {};
                        const rec = attendance[key];
                        const total = g.students.length;
                        const pres = g.students.filter(s => rec[s.name] === 'present').length;
                        const abs = g.students.filter(s => rec[s.name] === 'absent').length;
                        const late = g.students.filter(s => rec[s.name] === 'late').length;

                        cont.innerHTML = `
                <div class="att-card">
                    <div class="att-card-head">
                        <div>
                            <div class="att-card-title">${g.name.replace('Ingliz tili — ', '').replace('Ingliz tili - ', '')}</div>
                            <div class="att-card-meta">${date} &nbsp;·&nbsp; ${g.ts} – ${g.te}</div>
                        </div>
                        <div class="att-summary">
                            <span class="att-sum-chip" style="background:var(--green-bg);color:var(--green)">✓ ${pres}</span>
                            <span class="att-sum-chip" style="background:var(--red-bg);color:var(--red)">✗ ${abs}</span>
                            <span class="att-sum-chip" style="background:var(--gold-bg);color:#8a6a1a">⏰ ${late}</span>
                        </div>
                    </div>
                    <div class="att-grid" id="attGrid"></div>
                </div>`;

                        const grid = document.getElementById('attGrid');
                        if (grid) {
                            grid.innerHTML = g.students.map(s => {
                                const st = rec[s.name] || '';
                                const ini = s.name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
                                return `<div class="att-row">
                        <div class="att-ava">${ini}</div>
                        <div class="att-name">${s.name}</div>
                        <div class="att-btns">
                            <button class="att-btn ${st === 'present' ? 'present' : ''}" onclick="markAtt('${key}','${s.name}','present')">✓</button>
                            <button class="att-btn ${st === 'absent' ? 'absent' : ''}" onclick="markAtt('${key}','${s.name}','absent')">✗</button>
                            <button class="att-btn ${st === 'late' ? 'late' : ''}" onclick="markAtt('${key}','${s.name}','late')">⏰</button>
                        </div>
                    </div>`;
                            }).join('');
                        }
                    }

                    function markAtt(key, studentName, status) {
                        if (!attendance[key]) attendance[key] = {};
                        attendance[key][studentName] = attendance[key][studentName] === status ? '' : status;
                        saveAttendance();
                        renderAttendance();
                    }

                    /* ═══ STATS ═══ */
                    function renderStats2() {
                        const m = curMonth();
                        const totalStu = myGroups.reduce((a, g) => a + g.students.length, 0);
                        const paidCount = myGroups.reduce((a, g) => a + g.students.filter(s => {
                            const p = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === m);
                            return p && p.paid;
                        }).length, 0);
                        drawDonut(paidCount, totalStu - paidCount, totalStu);

                        // Bar Chart
                        const barEl = document.getElementById('groupBarChart');
                        if (barEl) {
                            barEl.innerHTML = myGroups.map(g => {
                                const paid = g.students.filter(s => {
                                    const p = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === m);
                                    return p && p.paid;
                                }).length;
                                const pct = g.students.length ? Math.round(paid / g.students.length * 100) : 0;
                                return `<div class="bar-row">
                        <div class="bar-label">${g.name.split('—')[1] || g.name}</div>
                        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${pct > 70 ? 'var(--green)' : 'var(--gold)'}"></div></div>
                        <div class="bar-pct">${pct}%</div>
                    </div>`;
                            }).join('');
                        }
                    }

                    function drawDonut(paid, unpaid, total) {
                        const svg = document.getElementById('donutSvg');
                        if (!svg) return;
                        const r = 40, circ = 2 * Math.PI * r;
                        const pct = total ? paid / total : 0;
                        const offset = circ * (1 - pct);
                        svg.innerHTML = `
                <circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--light)" stroke-width="12"/>
                <circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--green)" stroke-width="12" 
                    stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 55 55)"/>
                <text x="55" y="60" text-anchor="middle" font-size="16" font-weight="700">${total}</text>`;
                        const legend = document.getElementById('donutLegend');
                        if (legend) {
                            legend.innerHTML = `
                    <div class="legend-item"><span>To'lagan: ${paid}</span></div>
                    <div class="legend-item"><span>To'lamagan: ${unpaid}</span></div>`;
                        }
                    }

                    /* ═══ PROFILE ═══ */
                    function renderProfile() {
                        const t = allTeachers.find(t => t.id === ME.id);
                        if (!t) return;
                        document.getElementById('profName').textContent = t.ism + ' ' + t.fam;
                        document.getElementById('profTel').textContent = t.tel || '—';
                        document.getElementById('profLogin').textContent = t.login || '—';
                        document.getElementById('profAvatar').textContent = (t.ism[0] + (t.fam[0] || '')).toUpperCase();
                    }

                    async function changePassword() {
                        const np = document.getElementById('newPass').value.trim();
                        const cp = document.getElementById('confirmPass').value.trim();
                        if (!np || np !== cp) { toast("❌ Parol noto'g'ri"); return; }
                        try {
                            const t = allTeachers.find(x => x.id === ME.id);
                            await API.teachers.update(ME.id, { ...t, pass: np });
                            toast("✅ Parol yangilandi");
                            document.getElementById('newPass').value = '';
                            document.getElementById('confirmPass').value = '';
                        } catch (e) { toast("❌ Xatolik"); }
                    }

                    /* ═══ RENDER PAGES ═══ */
                    function renderGroupPage() {
                        renderTodayBanner();
                        renderStats();
                        renderGroupGrid();
                    }

                    function renderTodayBanner() {
                        const dow = (new Date().getDay() + 6) % 7;
                        const code = DAYS_UZ[dow];
                        const todays = myGroups.filter(g => g.days.includes(code));
                        document.getElementById('todayBannerSub').textContent = todays.length ? `${todays.length} ta dars bor` : "Bugun dars yo'q";
                        document.getElementById('todayLessons').innerHTML = todays.map(g => `
                <div class="today-chip">
                    <div class="today-chip-name">${g.name.split('—')[1] || g.name}</div>
                    <div class="today-chip-time">${g.ts} - ${g.te}</div>
                </div>`).join('');
                    }

                    function renderStats() {
                        const m = curMonth();
                        const totalStu = myGroups.reduce((a, g) => a + g.students.length, 0);
                        const paidCount = myGroups.reduce((a, g) => a + g.students.filter(s => {
                            const p = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === m);
                            return p && p.paid;
                        }).length, 0);
                        const el = document.getElementById('groupStats');
                        if (el) {
                            el.innerHTML = `
                    <div class="stat-card"><h5>Guruhlar</h5><h3>${myGroups.length}</h3></div>
                    <div class="stat-card"><h5>O'quvchilar</h5><h3>${totalStu}</h3></div>
                    <div class="stat-card"><h5>To'laganlar</h5><h3>${paidCount}</h3></div>
                `;
                        }
                    }

                    function renderGroupGrid() {
                        const m = curMonth();
                        const grid = document.getElementById('groupGrid');
                        if (grid) {
                            grid.innerHTML = myGroups.map(g => {
                                const paid = g.students.filter(s => {
                                    const p = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === m);
                                    return p && p.paid;
                                }).length;
                                return `<div class="g-card" onclick="openGroupDetail(${g.id})">
                        <div class="g-name">${g.name}</div>
                        <div class="g-meta">${g.ts} | ${g.days.join(', ')}</div>
                        <div class="g-footer">${paid}/${g.students.length} to'lagan</div>
                    </div>`;
                            }).join('');
                        }
                    }

                    function openGroupDetail(gid) {
                        const g = allGroups.find(g => g.id === gid);
                        const m = curMonth();
                        document.getElementById('gdTitle').textContent = g.name;
                        const body = document.getElementById('gdBody');
                        if (body) {
                            body.innerHTML = g.students.map(s => {
                                const p = payments.find(p => p.groupId === gid && p.studentName === s.name && p.month === m);
                                return `<div class="stu-row">
                        <span>${s.name}</span>
                        <span class="badge ${p && p.paid ? 'b-green' : 'b-red'}">${p && p.paid ? 'To\'lagan' : 'To\'lamagan'}</span>
                    </div>`;
                            }).join('');
                        }
                        openModal('ovGroup');
                    }

                    function renderStudents(search = '') {
                        const m = curMonth();
                        const body = document.getElementById('stuBody');
                        if (!body) return;
                        let rows = [];
                        myGroups.forEach(g => {
                            g.students.forEach(s => {
                                if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return;
                                const p = payments.find(p => p.groupId === g.id && p.studentName === s.name && p.month === m);
                                rows.push({ s, g, paid: p && p.paid });
                            });
                        });
                        body.innerHTML = rows.map((r, i) => `<tr>
                <td>${i + 1}</td>
                <td>${r.s.name}</td>
                <td>${r.g.name}</td>
                <td><span class="badge ${r.paid ? 'b-green' : 'b-red'}">${r.paid ? 'To\'lagan' : 'To\'lamagan'}</span></td>
            </tr>`).join('');
                    }

                    function renderSchedule() {
                        const body = document.getElementById('schBody');
                        if (!body) return;
                        body.innerHTML = '';
                        TIME_SLOTS.forEach(slot => {
                            const rowLabel = document.createElement('div');
                            rowLabel.className = 'sch-time-label';
                            rowLabel.textContent = slot;
                            body.appendChild(rowLabel);

                            DAYS_UZ.forEach(day => {
                                const cell = document.createElement('div');
                                cell.className = 'sch-cell';
                                myGroups.filter(g => g.ts === slot && g.days.includes(day)).forEach(g => {
                                    const div = document.createElement('div');
                                    div.className = 'sch-lesson';
                                    div.textContent = g.name.split('—')[1] || g.level;
                                    cell.appendChild(div);
                                });
                                body.appendChild(cell);
                            });
                        });
                    }

                    /* ═══ UTILS ═══ */
                    function curMonth() { return MONTHS[new Date().getMonth()]; }
                    function todayStr() { return new Date().toISOString().split('T')[0]; }
                    function openModal(id) {
                        const m = document.getElementById(id);
                        if (m) m.classList.add('on');
                    }
                    function closeModal(id) {
                        const m = document.getElementById(id);
                        if (m) m.classList.remove('on');
                    }
                    function toast(msg) {
                        const t = document.getElementById('toast');
                        if (t) {
                            t.textContent = msg; t.classList.add('on');
                            setTimeout(() => t.classList.remove('on'), 3000);
                        }
                    }
                    function updateBadges() {
                        const bg = document.getElementById('badgeGroups');
                        const bs = document.getElementById('badgeStudents');
                        if (bg) bg.textContent = myGroups.length;
                        if (bs) bs.textContent = myGroups.reduce((a, g) => a + g.students.length, 0);
                    }

                    window.onload = init;

                    document.querySelectorAll('.overlay').forEach(o => {
                        o.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('on'); });
                    });
                