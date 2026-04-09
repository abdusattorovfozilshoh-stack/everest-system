const Service = require('node-windows').Service;

// Everest Server xizmatini yaratish
const svc = new Service({
  name: 'EverestServer',
  description: 'Everest O\'quv Markazi Boshqaruv Tizimi Serveri',
  script: 'c:\\Users\\Fozilshox\\OneDrive\\Desktop\\EVEREST\\server.js',
  wait: 5,
  grow: .25,
  maxRestarts: 10
});

// "install" hodisasi — xizmat muvaffaqiyatli ro'yxatdan o'tganda
svc.on('install', function() {
  console.log('SUCCESS: EverestServer xizmati muvaffaqiyatli o\'rnatildi.');
  svc.start();
  console.log('Xizmat ishga tushirildi.');
});

// Xatoliklarni ushlash
svc.on('alreadyinstalled', function() {
  console.log('INFO: EverestServer xizmati allaqachon o\'rnatilgan.');
  svc.start();
});

svc.on('error', function(err) {
  console.error('ERROR: Xizmatni o\'rnatishda xatolik:', err);
});

console.log('Xizmatni o\'rnatish boshlanmoqda (Administrator huquqi talab qilinishi mumkin)...');
svc.install();
