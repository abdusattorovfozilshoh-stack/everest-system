const express = require('express');
const router = express.Router();
const db = require('../config/db');

// -- Teachers --
router.get('/', (req, res) => {
    db.all('SELECT * FROM teachers', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const { ism, fam, tel, login, pass } = req.body;
    db.run(`INSERT INTO teachers (ism, fam, tel, login, pass) VALUES (?, ?, ?, ?, ?)`, 
    [ism, fam, tel, login, pass], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ism, fam, tel, login, pass });
    });
});

router.put('/:id', (req, res) => {
    const { ism, fam, tel, login, pass } = req.body;
    db.run(`UPDATE teachers SET ism=?, fam=?, tel=?, login=?, pass=? WHERE id=?`, 
    [ism, fam, tel, login, pass, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Teacher updated' });
    });
});

router.delete('/:id', (req, res) => {
    const teacherId = req.params.id;

    db.serialize(() => {
        // 1. To'lovlarni o'chirish (o'qituvchining guruhlari bo'yicha)
        db.run(`DELETE FROM payments WHERE groupId IN (SELECT id FROM groups WHERE teacherId = ?)`, [teacherId]);

        // 2. Guruhlarni o'chirish
        db.run(`DELETE FROM groups WHERE teacherId = ?`, [teacherId]);

        // 3. O'qituvchini o'zini o'chirish
        db.run(`DELETE FROM teachers WHERE id = ?`, [teacherId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'O\'qituvchi va uning barcha ma\'lumotlari muvaffaqiyatli o\'chirildi' });
        });
    });
});

module.exports = router;
