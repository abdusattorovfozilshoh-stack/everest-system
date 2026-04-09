const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('../config/db');

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

// Vercel'da statik fayllar avtomatik xizmat qilinadi, 
// lekin lokalda ishlashi uchun root papkani ko'rsatamiz.
app.use(express.static(path.join(__dirname, '..')));

// Routes
const authRoutes = require('../routes/authRoutes');
const teacherRoutes = require('../routes/teacherRoutes');
const groupRoutes = require('../routes/groupRoutes');
const paymentRoutes = require('../routes/paymentRoutes');

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        dbAvailable: !!db && !db.isDummy
    });
});

app.use('/api', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ 
        error: 'Ichki server xatosi', 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server (Lokal uchun)
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server http://localhost:${PORT} portida ishga tushdi.`);
    });
}

module.exports = app;
