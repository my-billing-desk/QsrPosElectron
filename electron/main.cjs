const electronObj = require('electron');
console.log('Electron require result:', electronObj);
console.log('Type of electron result:', typeof electronObj);
console.log('Keys:', Object.keys(electronObj));

const { app, BrowserWindow } = electronObj;
const path = require('path');

if (!app) {
    console.error('CRITICAL: app is undefined!');
    process.exit(1);
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#ffffff',
            symbolColor: '#000000',
            height: 35
        }
    });

    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        // Wait a bit for Vite to be ready if running directly, or just fail to load
        mainWindow.loadURL('http://localhost:5174').catch(e => console.log('Failed to load URL, is Vite running?'));
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
