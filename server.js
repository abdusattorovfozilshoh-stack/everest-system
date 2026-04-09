const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Block access to sensitive files
app.use((req, res, next) => {
    const sensitiveFiles = ['db.sqlite', 'server.js', 'package.json', 'package-lock.json', '.git', '.env', 'README.md'];
    const file = path.basename(req.url.split('?')[0]);
    if (sensitiveFiles.includes(file) || file.endsWith('.sqlite')) {
        return res.status(403).send('<h1>403 Forbidden</h1><p>Sizda ushbu faylga kirish huquqi yo\'q.</p>');
    }
    next();
});

app.use(express.static(__dirname));

// Routes
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const groupRoutes = require('./routes/groupRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);

// Start server
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server http://localhost:${PORT} portida ishga tushdi.`);
    });
}

module.exports = app;
