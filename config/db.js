const path = require('path');
const fs = require('fs');

// ============================================================
// DATABASE WRAPPER
// Barcha routes callback-style ishlatadi: db.get(), db.all(), db.run()
// Bu fayl Neon.tech (PostgreSQL) yoki lokal SQLite ni avtomatik tanlaydi
// ============================================================

const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = !!DATABASE_URL;

let db;

if (isPostgres) {
    // ==========================================
    // NEON.TECH / PostgreSQL
    // ==========================================
    console.log('🐘 PostgreSQL (Neon.tech) ulanmoqda...');
    const { Pool } = require('pg');

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    pool.on('error', (err) => {
        console.error('🐘 Unexpected error on idle client', err);
        // Do not process.exit(1) here as it might be a temporary network issue
    });

    // Asynchronous initialization guarantee
    let initPromise = null;
    function ensureInit() {
        if (!initPromise) {
            initPromise = initPostgresDB(pool).catch(e => console.error("Init Error:", e));
        }
        return initPromise;
    }

    db = {
        isDummy: false,

        _convertQuery(query) {
            let i = 0;
            return query.replace(/\?/g, () => `$${++i}`);
        },

        all(query, params, cb) {
            ensureInit().then(() => {
                const pgQuery = this._convertQuery(query);
                pool.query(pgQuery, params || [])
                    .then(result => { if(cb) cb(null, result.rows); })
                    .catch(err => { console.error('PG all error:', err.message); if(cb) cb(err, []); });
            });
        },

        get(query, params, cb) {
            ensureInit().then(() => {
                const pgQuery = this._convertQuery(query);
                pool.query(pgQuery, params || [])
                    .then(result => { if(cb) cb(null, result.rows[0] || null); })
                    .catch(err => { console.error('PG get error:', err.message); if(cb) cb(err, null); });
            });
        },

        run(query, params, cb) {
            ensureInit().then(() => {
                let pgQuery = this._convertQuery(query);
                const isInsert = pgQuery.trim().toUpperCase().startsWith('INSERT');
                if (isInsert && !pgQuery.toUpperCase().includes('RETURNING')) {
                    pgQuery += ' RETURNING id';
                }

                pool.query(pgQuery, params || [])
                    .then(result => {
                        const lastID = isInsert && result.rows[0] ? result.rows[0].id : 0;
                        if (cb) cb.call({ lastID, changes: result.rowCount }, null);
                    })
                    .catch(err => { console.error('PG run error:', err.message, pgQuery); if (cb) cb(err); });
            });
        },

        serialize(cb) { if (cb) cb(); }
    };

} else {
    // ==========================================
    // LOKAL: SQLite
    // ==========================================
    const DB_NAME = 'db.sqlite';
    try {
        console.log('💾 Lokal: SQLite yuklanmoqda...');
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.resolve(__dirname, '..', DB_NAME);
        console.log('📂 Baza fayli:', dbPath);

        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ SQLite xatolik:', err.message);
            } else {
                console.log('✅ SQLite ulandi');
                db.run('PRAGMA foreign_keys = ON');
                initSQLiteDB(db);
            }
        });
        db.isDummy = false;
    } catch (e) {
        console.error('❌ SQLite yuklanmadi:', e.message);
        // Fallback — bo'sh dummy
        db = makeDummyDB();
    }
}

// ============================================================
// PostgreSQL jadvallarini yaratish
// ============================================================
async function initPostgresDB(pool) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                ism TEXT, fam TEXT, tel TEXT, login TEXT, pass TEXT
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                "teacherId" INTEGER,
                level TEXT, suffix TEXT, name TEXT,
                fee INTEGER, ts TEXT, te TEXT,
                days TEXT, students TEXT
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                "studentName" TEXT,
                "groupId" INTEGER,
                month TEXT, amount INTEGER, date TEXT,
                paid INTEGER DEFAULT 0
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                "adminLogin" TEXT, "adminPass" TEXT,
                "centerName" TEXT, "centerAddr" TEXT,
                "centerPhone" TEXT, "centerEmail" TEXT,
                "groupCapacity" INTEGER, courses TEXT,
                CHECK (id = 1)
            )
        `);
        console.log('✅ PostgreSQL jadvallar tayyor');
        await initDefaultData(pool);
    } catch (e) {
        console.error('❌ PostgreSQL init xatolik:', e.message);
    }
}

async function initDefaultData(pool) {
    try {
        const result = await pool.query('SELECT id FROM settings WHERE id = 1');
        if (result.rows.length === 0) {
            const defaultCourses = JSON.stringify([
                { key: 'Beginner', fee: 500000 },
                { key: 'Elementary', fee: 550000 },
                { key: 'Pre-IELTS', fee: 600000 },
                { key: 'Introduction', fee: 650000 },
                { key: 'Graduation', fee: 700000 }
            ]);
            await pool.query(
                `INSERT INTO settings (id, "adminLogin", "adminPass", "centerName", "centerAddr", "centerPhone", "centerEmail", "groupCapacity", courses) 
                 VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)`,
                ['admin', 'admin123', "Everest O'quv Markazi", 'Toshkent sh.', '+998 90 123 45 67', 'info@everest.uz', 15, defaultCourses]
            );
            console.log('✅ Default sozlamalar qo\'shildi (admin/admin123)');
        }
    } catch (e) {
        console.error('❌ Default data xatolik:', e.message);
    }
}

// ============================================================
// SQLite jadvallarini yaratish (lokal)
// ============================================================
function initSQLiteDB(dbInstance) {
    dbInstance.serialize(() => {
        dbInstance.run(`CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, ism TEXT, fam TEXT, tel TEXT, login TEXT, pass TEXT)`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, teacherId INTEGER, level TEXT, suffix TEXT, name TEXT, fee INTEGER, ts TEXT, te TEXT, days TEXT, students TEXT)`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, studentName TEXT, groupId INTEGER, month TEXT, amount INTEGER, date TEXT, paid INTEGER DEFAULT 0)`);
        dbInstance.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), adminLogin TEXT, adminPass TEXT, centerName TEXT, centerAddr TEXT, centerPhone TEXT, centerEmail TEXT, groupCapacity INTEGER, courses TEXT)`);

        const defaultCourses = JSON.stringify([
            { key: 'Beginner', fee: 500000 }, { key: 'Elementary', fee: 550000 },
            { key: 'Pre-IELTS', fee: 600000 }, { key: 'Introduction', fee: 650000 },
            { key: 'Graduation', fee: 700000 }
        ]);
        dbInstance.get('SELECT id FROM settings WHERE id = 1', [], (err, row) => {
            if (!row) {
                dbInstance.run(
                    `INSERT INTO settings (id, adminLogin, adminPass, centerName, centerAddr, centerPhone, centerEmail, groupCapacity, courses) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    ['admin', 'admin123', "Everest O'quv Markazi", 'Toshkent sh.', '+998 90 123 45 67', 'info@everest.uz', 15, defaultCourses]
                );
            }
        });
    });
}

// ============================================================
// Dummy DB (hech narsa ishlamasa)
// ============================================================
function makeDummyDB() {
    return {
        isDummy: true,
        all: (q, p, cb) => setTimeout(() => cb(null, []), 0),
        get: (q, p, cb) => setTimeout(() => cb(null, null), 0),
        run: (q, p, cb) => { if (cb) setTimeout(() => cb.call({ lastID: 0, changes: 0 }, null), 0); },
        serialize: (cb) => { if (cb) cb(); }
    };
}

module.exports = db;