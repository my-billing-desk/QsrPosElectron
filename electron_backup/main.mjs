import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Electron import:', electron);
console.log('Keys:', Object.keys(electron));
console.log('default keys:', electron.default ? Object.keys(electron.default) : 'no default');

const app = electron.app || electron.default?.app;
const BrowserWindow = electron.BrowserWindow || electron.default?.BrowserWindow;
const ipcMain = electron.ipcMain || electron.default?.ipcMain;

if (!ipcMain) console.error('CRITICAL: ipcMain is undefined!');


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IPC Handlers
ipcMain.handle('get-printers', async (event) => {
    return event.sender.getPrintersAsync();
});

ipcMain.handle('print-bill', async (event, { printerName, htmlContent }) => {
    const workerWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            contextIsolation: true
        }
    });

    await workerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    const options = {
        silent: true,
        deviceName: printerName
    };

    try {
        await workerWindow.webContents.print(options);
        // Give it a moment to send the print job before closing (though print() is callback based in some versions, promise in others)
        // In Electron 30, print is Promise.
        workerWindow.close();
        return { success: true };
    } catch (error) {
        workerWindow.close();
        console.error('Print failed:', error);
        throw error;
    }
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
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
        mainWindow.loadURL('http://localhost:5555').catch(e => console.log('Failed to load URL, is Vite running?'));
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
