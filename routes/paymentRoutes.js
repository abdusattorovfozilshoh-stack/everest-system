const express = require('express');
const router = express.Router();
const db = require('../config/db');

// -- Payments --
router.get('/', (req, res) => {
    db.all('SELECT * FROM payments', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const payments = rows.map(r => ({ ...r, paid: r.paid === 1 }));
        res.json(payments);
    });
});

router.post('/', (req, res) => {
    const { studentName, groupId, month, amount, date, paid } = req.body;
    const paidInt = paid ? 1 : 0;
    db.run(`INSERT INTO payments (studentName, groupId, month, amount, date, paid) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
    [studentName, groupId, month, amount, date, paidInt], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

router.put('/:id', (req, res) => {
    const { studentName, groupId, month, amount, date, paid } = req.body;
    const paidInt = paid ? 1 : 0;
    db.run(`UPDATE payments SET studentName=?, groupId=?, month=?, amount=?, date=?, paid=? WHERE id=?`, 
    [studentName, groupId, month, amount, date, paidInt, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Payment updated' });
    });
});

router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM payments WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Payment deleted' });
    });
});

module.exports = router;
