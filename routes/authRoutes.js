const express = require('express');
const router = express.Router();
const db = require('../config/db');

// -- Settings --
router.get('/settings', (req, res) => {
    db.get('SELECT * FROM settings WHERE id = 1', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.courses) {
            try { row.courses = JSON.parse(row.courses); } catch (e) { row.courses = []; }
        }
        res.json(row || {});
    });
});

router.put('/settings', (req, res) => {
    const { adminLogin, adminPass, centerName, centerAddr, centerPhone, centerEmail, groupCapacity, courses } = req.body;
    const coursesStr = JSON.stringify(courses || []);
    const query = `UPDATE settings SET adminLogin=?, adminPass=?, centerName=?, centerAddr=?, centerPhone=?, centerEmail=?, groupCapacity=?, courses=? WHERE id=1`;
    db.run(query, [adminLogin, adminPass, centerName, centerAddr, centerPhone, centerEmail, groupCapacity, coursesStr], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Settings updated' });
    });
});

// -- Login --
router.post('/login', (req, res) => {
    const { login, pass, role } = req.body;
    if (role === 'admin') {
        db.get('SELECT adminLogin, adminPass FROM settings WHERE id = 1', [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row && row.adminLogin === login && row.adminPass === pass) {
                return res.json({ success: true, user: { login, role: 'admin', redirect: 'admin.html' } });
            }
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        });
    } else if (role === 'teacher') {
        db.get('SELECT * FROM teachers WHERE login = ? AND pass = ?', [login, pass], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) {
                return res.json({ success: true, user: { login, role: 'teacher', teacherId: row.id, redirect: 'teacher.html' } });
            }
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        });
    } else {
        res.status(400).json({ success: false, message: 'Invalid role' });
    }
});

module.exports = router;
