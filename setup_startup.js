const fs = require('fs');
const path = require('path');
const os = require('os');

// Windows Startup papkasi yo'lini aniqlash
const startupDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const projectDir = __dirname;
const batPath = path.join(projectDir, 'start_everest.bat');
const vbsPath = path.join(startupDir, 'everest_launcher.vbs');

// VBScript kontenti (serverni CMD oynasisiz, orqa fonda ishga tushiradi)
const vbsContent = `
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "${projectDir}"
WshShell.Run "cmd /c ""${batPath}""", 0, False
`.trim();


if (!fs.existsSync(startupDir)) {
    fs.mkdirSync(startupDir, { recursive: true });
}

try {
    fs.writeFileSync(vbsPath, vbsContent);
    console.log("SUCCESS: Everest serveri avtomatik ishga tushish uchun Windows Startup-ga qo'shildi.");
    console.log("Fayl yo'li: " + vbsPath);
} catch (err) {
    console.error("ERROR: Avtomatlashtirishda xatolik:", err);
    process.exit(1);
}
