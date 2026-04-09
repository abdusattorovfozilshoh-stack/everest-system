const path = require('path');
const fs = require('fs');

// Vercel yoki production muhitini aniqlash
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_NAME = 'db.sqlite';
const JSON_DB_NAME = 'db_data.json';

let db;

// ============================================================
// JSON DATABASE — Vercel (serverless) uchun
// ============================================================
class JSONDatabase {
    constructor(filePath) {
        this.filePath = filePath;
        this.isDummy = true;
        this._lastID = 0;
        this.data = {
            teachers: [],
            groups: [],
            payments: [],
            settings: []
        };
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf8');
                this.data = { ...this.data, ...JSON.parse(raw) };
                // lastID ni hisoblash
                ['teachers', 'groups', 'payments'].forEach(t => {
                    const ids = (this.data[t] || []).map(x => x.id || 0);
                    if (ids.length) this._lastID = Math.max(this._lastID, ...ids);
                });
            }
        } catch (e) {
            console.error('JSON DB load error:', e.message);
        }
    }

    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (e) {
            console.error('JSON DB save error:', e.message);
        }
    }

    // SELECT ko'p natija
    all(query, params, cb) {
        try {
            const table = this._getTable(query);
            let rows = [...(this.data[table] || [])];

            // teacherId bo'yicha filter
            if (query.includes('teacherId') && params && params[0]) {
                rows = rows.filter(r => String(r.teacherId) === String(params[0]));
            }

            setTimeout(() => cb(null, rows), 0);
        } catch (e) {
            setTimeout(() => cb(e, []), 0);
        }
    }

    // SELECT bitta natija
    get(query, params, cb) {
        try {
            const table = this._getTable(query);
            const list = this.data[table] || [];
            let result = null;

            if (query.includes('WHERE id = 1') || query.includes('where id = 1')) {
                result = list.find(x => x.id === 1) || null;
            } else if (query.includes('login = ?') && params) {
                if (params.length >= 2) {
                    result = list.find(x => x.login === params[0] && x.pass === params[1]) || null;
                } else {
                    result = list.find(x => x.login === params[0]) || null;
                }
            } else if (query.includes('adminLogin') && params) {
                result = list.find(x => x.adminLogin === params[0] && x.adminPass === params[1]) || null;
            } else if (query.includes('WHERE id = ?') && params) {
                result = list.find(x => x.id === params[0]) || null;
            } else if (query.includes('SELECT id FROM settings')) {
                result = list.find(x => x.id === 1) || null;
            } else {
                result = list[0] || null;
            }

            setTimeout(() => cb(null, result), 0);
        } catch (e) {
            setTimeout(() => cb(e, null), 0);
        }
    }

    // INSERT / UPDATE / DELETE
    run(query, params, cb) {
        try {
            const q = query.toUpperCase().trim();
            const table = this._getTable(query);

            if (q.startsWith('INSERT')) {
                const newItem = { id: ++this._lastID };
                if (table === 'teachers') {
                    ['ism', 'fam', 'tel', 'login', 'pass'].forEach((k, i) => newItem[k] = (params || [])[i]);
                } else if (table === 'groups') {
                    ['teacherId', 'level', 'suffix', 'name', 'fee', 'ts', 'te', 'days', 'students'].forEach((k, i) => newItem[k] = (params || [])[i]);
                } else if (table === 'payments') {
                    ['studentName', 'groupId', 'month', 'amount', 'date', 'paid'].forEach((k, i) => newItem[k] = (params || [])[i] ?? 0);
                } else if (table === 'settings') {
                    ['id', 'adminLogin', 'adminPass', 'centerName', 'centerAddr', 'centerPhone', 'centerEmail', 'groupCapacity', 'courses'].forEach((k, i) => newItem[k] = (params || [])[i]);
                    newItem.id = 1;
                }
                if (!this.data[table]) this.data[table] = [];
                this.data[table].push(newItem);
                this.save();
                if (cb) setTimeout(() => cb.call({ lastID: this._lastID, changes: 1 }, null), 0);

            } else if (q.startsWith('UPDATE')) {
                if (table === 'settings') {
                    let s = this.data.settings.find(x => x.id === 1);
                    if (!s) { s = { id: 1 }; this.data.settings.push(s); }
                    ['adminLogin', 'adminPass', 'centerName', 'centerAddr', 'centerPhone', 'centerEmail', 'groupCapacity', 'courses'].forEach((k, i) => s[k] = (params || [])[i]);
                } else if (table === 'teachers' && params) {
                    const idx = this.data[table].findIndex(x => x.id === params[params.length - 1]);
                    if (idx >= 0) {
                        ['ism', 'fam', 'tel', 'login', 'pass'].forEach((k, i) => this.data[table][idx][k] = params[i]);
                    }
                } else if (table === 'groups' && params) {
                    const idx = this.data[table].findIndex(x => x.id === params[params.length - 1]);
                    if (idx >= 0) {
                        ['teacherId', 'level', 'suffix', 'name', 'fee', 'ts', 'te', 'days', 'students'].forEach((k, i) => this.data[table][idx][k] = params[i]);
                    }
                } else if (table === 'payments' && params) {
                    const idx = this.data[table].findIndex(x => x.id === params[params.length - 1]);
                    if (idx >= 0) {
                        this.data[table][idx].paid = params[0];
                    }
                }
                this.save();
                if (cb) setTimeout(() => cb.call({ lastID: this._lastID, changes: 1 }, null), 0);

            } else if (q.startsWith('DELETE')) {
                const id = params && params[0];
                this.data[table] = (this.data[table] || []).filter(x => x.id !== id);
                this.save();
                if (cb) setTimeout(() => cb.call({ lastID: 0, changes: 1 }, null), 0);

            } else {
                // CREATE TABLE, PRAGMA, etc.
                if (cb) setTimeout(() => cb.call({ lastID: 0, changes: 0 }, null), 0);
            }
        } catch (e) {
            console.error('JSON DB run error:', e.message, query);
            if (cb) setTimeout(() => cb.call({ lastID: 0, changes: 0 }, e), 0);
        }
    }

    serialize(cb) { if (cb) cb(); }
    prepare(query) {
        return {
            run: (p, cb) => this.run(query, p, cb),
            finalize: () => {}
        };
    }

    _getTable(q) {
        const lq = q.toLowerCase();
        if (lq.includes('teacher')) return 'teachers';
        if (lq.includes('group')) return 'groups';
        if (lq.includes('payment')) return 'payments';
        if (lq.includes('setting')) return 'settings';
        return 'teachers';
    }
}

// ============================================================
// DATABASE INITIALIZATION
// ============================================================
if (isVercel) {
    console.log('🚀 Vercel muhiti: JSON Database ishlatilmoqda');
    const jsonPath = path.join('/tmp', JSON_DB_NAME);
    db = new JSONDatabase(jsonPath);
    initDefaultData();
} else {
    // Lokal: SQLite ishlatamiz
    try {
        console.log('💾 Lokal: SQLite yuklanmoqda...');
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.resolve(__dirname, '..', DB_NAME);
        console.log('📂 Baza fayli:', dbPath);

        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ SQLite ulanishda xatolik:', err.message);
                // Fallback JSON ga
                db = new JSONDatabase(path.resolve(__dirname, '..', JSON_DB_NAME));
                initDefaultData();
            } else {
                console.log('✅ SQLite muvaffaqiyatli ulandi');
                db.run('PRAGMA foreign_keys = ON');
                initDB(db);
            }
        });
    } catch (e) {
        console.error('❌ SQLite yuklay olmadi, JSON ga o\'tildi:', e.message);
        db = new JSONDatabase(path.resolve(__dirname, '..', JSON_DB_NAME));
        initDefaultData();
    }
}

function initDB(dbInstance) {
    dbInstance.serialize(() => {
        dbInstance.run(`CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ism TEXT, fam TEXT, tel TEXT, login TEXT, pass TEXT
        )`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacherId INTEGER, level TEXT, suffix TEXT, name TEXT,
            fee INTEGER, ts TEXT, te TEXT, days TEXT, students TEXT
        )`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentName TEXT, groupId INTEGER, month TEXT,
            amount INTEGER, date TEXT, paid INTEGER DEFAULT 0
        )`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            adminLogin TEXT, adminPass TEXT, centerName TEXT,
            centerAddr TEXT, centerPhone TEXT, centerEmail TEXT,
            groupCapacity INTEGER, courses TEXT
        )`);
        initDefaultData();
    });
}

function initDefaultData() {
    const defaultCourses = JSON.stringify([
        { key: 'Beginner', fee: 500000 },
        { key: 'Elementary', fee: 550000 },
        { key: 'Pre-IELTS', fee: 600000 },
        { key: 'Introduction', fee: 650000 },
        { key: 'Graduation', fee: 700000 }
    ]);

    db.get('SELECT id FROM settings WHERE id = 1', [], (err, row) => {
        if (!row) {
            db.run(
                `INSERT INTO settings (id, adminLogin, adminPass, centerName, centerAddr, centerPhone, centerEmail, groupCapacity, courses) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ['admin', 'admin123', 'Everest O\'quv Markazi', 'Toshkent sh.', '+998 90 123 45 67', 'info@everest.uz', 15, defaultCourses]
            );
        }
    });
}

module.exports = db;