const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

try {
    const isVercel = process.env.VERCEL === '1';
    const dbPath = isVercel 
        ? path.join('/tmp', 'db.sqlite') 
        : path.join(__dirname, '..', 'db.sqlite');
    
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Baza ulanishda xatolik:', err.message);
        } else {
            console.log('Baza muvaffaqiyatli ulandi:', dbPath);
        }
    });

    db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON');
        initDB();
    });
} catch (error) {
    console.error('CRITICAL: Baza yuklanishda jiddiy xatolik:', error);
    // Vercel crash bo'lmasligi uchun dummy object qaytarishimiz mumkin
    db = {
        get: (q, p, cb) => cb ? cb(new Error("Baza mavjud emas")) : (typeof p === 'function' && p(new Error("Baza mavjud emas"))),
        run: (q, p, cb) => cb ? cb(new Error("Baza mavjud emas")) : (typeof p === 'function' && p(new Error("Baza mavjud emas"))),
        all: (q, p, cb) => cb ? cb(new Error("Baza mavjud emas")) : (typeof p === 'function' && p(new Error("Baza mavjud emas"))),
        serialize: (cb) => cb(),
        prepare: () => ({ run: () => {}, finalize: () => {} })
    };
}

const DEFAULT_TEACHERS = [
    { ism: 'Aziza', fam: 'Karimova', tel: '+998901234567', login: 'aziza', pass: 'aziza123' },
    { ism: 'Jasur', fam: 'Toshmatov', tel: '+998911234567', login: 'jasur', pass: 'jas456' },
    { ism: 'Malika', fam: 'Yusupova', tel: '+998901112233', login: 'malika', pass: 'mal789' }
];

function initDB() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ism TEXT, fam TEXT, tel TEXT, login TEXT, pass TEXT
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacherId INTEGER, level TEXT, suffix TEXT, name TEXT, fee INTEGER,
                ts TEXT, te TEXT, days TEXT, students TEXT,
                FOREIGN KEY(teacherId) REFERENCES teachers(id)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                studentName TEXT, groupId INTEGER, month TEXT, amount INTEGER, date TEXT,
                paid INTEGER DEFAULT 0,
                FOREIGN KEY(groupId) REFERENCES groups(id)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                adminLogin TEXT, adminPass TEXT, centerName TEXT, centerAddr TEXT,
                centerPhone TEXT, centerEmail TEXT, groupCapacity INTEGER, courses TEXT
            );
        `);

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

    db.get('SELECT id FROM settings WHERE id = 1', (err, row) => {
        if (!row && !err) {
            db.run(`INSERT INTO settings (id, adminLogin, adminPass, centerName, centerAddr, centerPhone, centerEmail, groupCapacity, courses)
                    VALUES (1, 'admin', 'admin123', 'Everest O''quv Markazi', 'Toshkent sh., Chilonzor t.', '+998 90 123 45 67', 'info@everest.uz', 15, ?)`, [defaultCourses]);
        }
    });

    db.get('SELECT COUNT(*) AS count FROM teachers', (err, row) => {
        if (row && row.count === 0 && !err) {
            const stmt = db.prepare('INSERT INTO teachers (ism, fam, tel, login, pass) VALUES (?, ?, ?, ?, ?)');
            DEFAULT_TEACHERS.forEach(t => stmt.run(t.ism, t.fam, t.tel, t.login, t.pass));
            stmt.finalize();
        }
    });
}

module.exports = db;