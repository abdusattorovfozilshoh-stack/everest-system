const express = require('express');
const router = express.Router();
const db = require('../config/db');

// -- Groups --
router.get('/', (req, res) => {
    db.all('SELECT * FROM groups', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const groups = rows.map(r => ({
            ...r,
            days: JSON.parse(r.days || '[]'),
            students: JSON.parse(r.students || '[]')
        }));
        res.json(groups);
    });
});

router.post('/', (req, res) => {
    const { teacherId, level, suffix, name, fee, ts, te, days, students } = req.body;
    const daysStr = JSON.stringify(days || []);
    const studentsStr = JSON.stringify(students || []);
    db.run(`INSERT INTO groups (teacherId, level, suffix, name, fee, ts, te, days, students) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [teacherId, level, suffix, name, fee, ts, te, daysStr, studentsStr], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

router.put('/:id', (req, res) => {
    const { teacherId, level, suffix, name, fee, ts, te, days, students } = req.body;
    const daysStr = JSON.stringify(days || []);
    const studentsStr = JSON.stringify(students || []);
    db.run(`UPDATE groups SET teacherId=?, level=?, suffix=?, name=?, fee=?, ts=?, te=?, days=?, students=? WHERE id=?`, 
    [teacherId, level, suffix, name, fee, ts, te, daysStr, studentsStr, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Group updated' });
    });
});

router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM groups WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Group deleted' });
    });
});

module.exports = router;

