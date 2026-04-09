const Service = require('node-windows').Service;

// Everest Server xizmatini o'chirish
const svc = new Service({
  name: 'EverestServer',
  script: 'c:\\Users\\Fozilshox\\OneDrive\\Desktop\\EVEREST\\server.js'
});

// "uninstall" hodisasi — xizmat o'chirib bo'linganda
svc.on('uninstall', function() {
  console.log('SUCCESS: EverestServer xizmati muvaffaqiyatli o\'chirildi.');
  console.log('Xizmat to\'liq to\'xtatildi.');
});

// Xatoliklarni ushlash
svc.on('error', function(err) {
  console.error('ERROR: Xizmatni o\'chirishda xatolik:', err);
});

console.log('Xizmatni o\'chirish boshlanmoqda (Administrator huquqi talab qilinishi mumkin)...');
svc.uninstall();
