const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Orphaned Groups:');
db.all('SELECT id, name, teacherId FROM groups WHERE teacherId IS NULL OR teacherId NOT IN (SELECT id FROM teachers)', [], (err, rows) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
