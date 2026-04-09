const path = require('path');
const fs = require('fs');

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const DB_NAME = 'db.sqlite';
const JSON_DB_NAME = 'db.json';

let db;

// --- DUMMY / JSON DB FOR VERCEL (To avoid native sqlite3 module crashes) ---
class JSONDatabase {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = { teachers: [], groups: [], payments: [], settings: [{ id: 1 }] };
        this.lastID = 0;
        this.load();
    }

    load() {
        if (fs.existsSync(this.filePath)) {
            try {
                this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            } catch (e) { console.error('JSON Load Error:', e); }
        }
    }

    save() {
        try { fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2)); } catch (e) {}
    }

    all(query, params, cb) {
        const table = this._getTable(query);
        setTimeout(() => cb(null, this.data[table] || []), 0);
    }

    get(query, params, cb) {
        const table = this._getTable(query);
        const list = this.data[table] || [];
        // Oddiy "id = 1" yoki "login = ?" filtrlash
        let result = list[0] || null;
        if (query.includes('id = 1')) result = list.find(x => x.id === 1);
        if (query.includes('login = ?')) {
            result = list.find(x => x.login === params[0] && (!params[1] || x.pass === params[1]));
        }
        setTimeout(() => cb(null, result), 0);
    }

    run(query, params, cb) {
        const table = this._getTable(query);
        if (query.toUpperCase().includes('INSERT')) {
            const newItem = { id: ++this.lastID };
            // Parametrlarni xaritalash (soddalashtirilgan)
            if (table === 'teachers') {
                ['ism', 'fam', 'tel', 'login', 'pass'].forEach((k, i) => newItem[k] = params[i]);
            } else if (table === 'groups') {
                ['teacherId', 'level', 'suffix', 'name', 'fee', 'ts', 'te', 'days', 'students'].forEach((k, i) => newItem[k] = params[i]);
            } else if (table === 'payments') {
                ['studentName', 'groupId', 'month', 'amount', 'date'].forEach((k, i) => newItem[k] = params[i]);
            }
            this.data[table].push(newItem);
            this.lastID = newItem.id;
        } else if (query.toUpperCase().includes('UPDATE')) {
            // Soddalashtirilgan Update (Settings uchun asosan)
            if (table === 'settings') {
                ['adminLogin', 'adminPass', 'centerName', 'centerAddr', 'centerPhone', 'centerEmail', 'groupCapacity', 'courses'].forEach((k, i) => this.data.settings[0][k] = params[i]);
            }
        }
        this.save();
        if (cb) setTimeout(() => cb.call({ lastID: this.lastID, changes: 1 }, null), 0);
    }

    serialize(cb) { cb(); }
    prepare(query) { return { run: (p, cb) => this.run(query, p, cb), finalize: () => {} }; }

    _getTable(q) {
        if (q.toLowerCase().includes('teachers')) return 'teachers';
        if (q.toLowerCase().includes('groups')) return 'groups';
        if (q.toLowerCase().includes('payments')) return 'payments';
        if (q.toLowerCase().includes('settings')) return 'settings';
        return 'teachers';
    }
}

// --- INITIALIZATION ---
if (isVercel) {
    console.log('--- VERCEL ENIRONMENT: Using JSON Database fallback ---');
    const jsonPath = path.join('/tmp', JSON_DB_NAME);
    db = new JSONDatabase(jsonPath);
    initDefaultData();
} else {
    // LOCAL: Use real SQLite
    try {
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.resolve(__dirname, '..', DB_NAME);
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) console.error('SQLite local error:', err);
            else {
                db.serialize(() => {
                    db.run('PRAGMA foreign_keys = ON');
                    initDB(db);
                });
            }
        });
    } catch (e) {
        console.error('Local SQLite load failed, falling back to JSON');
        db = new JSONDatabase(path.resolve(__dirname, '..', JSON_DB_NAME));
    }
}

function initDB(dbInstance) {
    dbInstance.serialize(() => {
        dbInstance.run(`CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, ism TEXT, fam TEXT, tel TEXT, login TEXT, pass TEXT)`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, teacherId INTEGER, level TEXT, suffix TEXT, name TEXT, fee INTEGER, ts TEXT, te TEXT, days TEXT, students TEXT)`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, studentName TEXT, groupId INTEGER, month TEXT, amount INTEGER, date TEXT, paid INTEGER DEFAULT 0)`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), adminLogin TEXT, adminPass TEXT, centerName TEXT, centerAddr TEXT, centerPhone TEXT, centerEmail TEXT, groupCapacity INTEGER, courses TEXT)`);
        initDefaultData();
    });
}

function initDefaultData() {
    const defaultCourses = JSON.stringify([
        { key: 'Beginner', fee: 500000 }, { key: 'Elementary', fee: 550000 }, { key: 'Pre-IELTS', fee: 600000 }, { key: 'Introduction', fee: 650000 }, { key: 'Graduation', fee: 700000 }
    ]);

    db.get('SELECT id FROM settings WHERE id = 1', [], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO settings (id, adminLogin, adminPass, centerName, centerAddr, centerPhone, centerEmail, groupCapacity, courses) VALUES (1, 'admin', 'admin123', 'Everest O''quv Markazi', 'Toshkent sh.', '+998 90 123 45 67', 'info@everest.uz', 15, ?)`, [defaultCourses]);
        }
    });
}

module.exports = db;