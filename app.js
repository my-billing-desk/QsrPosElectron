const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const util = require('util');

const logPath = path.join(app.getPath('userData'), 'electron_debug.log');

function logToFile(...args) {
    const timestamp = new Date().toISOString();
    const message = util.format(...args);
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Ensure electron is loaded correctly
if (!app || !ipcMain) {
    logToFile('CRITICAL: Electron modules are undefined at top level!');
    // If it's a string (shadowing issue), we might able to find it elsewhere or it's a launch error
}

logToFile('App started process:', process.pid);

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
        mainWindow.loadURL('http://localhost:5569').catch(e => logToFile('Failed to load URL, is Vite running?'));
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
            .catch(e => logToFile('Failed to load index.html', e));

        // Setup console logging from renderer to main log file
        mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
            logToFile(`[RENDERER] ${message} (${sourceId}:${line})`);
        });

        mainWindow.webContents.openDevTools(); // Temporary for debugging
    }
}

const db = require('./db');

app.whenReady().then(() => {
    logToFile('App is ready');
    db.initDb();

    // Register IPC Handlers after ready
    ipcMain.handle('get-printers', async (event) => {
        try {
            const printers = await event.sender.getPrintersAsync();
            return printers;
        } catch (e) {
            logToFile('Failed to get printers:', e);
            return [];
        }
    });

    ipcMain.handle('print-bill', async (event, { printerName, htmlContent }) => {
        const workerWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                contextIsolation: true
            }
        });

        try {
            const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
            await workerWindow.loadURL(dataUrl);
            const options = {
                silent: true,
                printBackground: true,
                deviceName: printerName
            };
            await new Promise((resolve, reject) => {
                workerWindow.webContents.print(options, (success, failureReason) => {
                    if (success) resolve();
                    else reject(new Error(failureReason));
                });
            });
            setTimeout(() => workerWindow.close(), 1000);
            return { success: true };
        } catch (error) {
            logToFile('[PRINT] Print failed:', error);
            if (!workerWindow.isDestroyed()) workerWindow.close();
            throw error;
        }
    });

    // Database IPC Handlers
    ipcMain.handle('db-verify-login', async (event, credentials) => db.verifyLocalLogin(credentials));
    ipcMain.handle('db-sync-users', async (event, users) => db.saveUsers(users));
    ipcMain.handle('db-sync-menu', async (event, { categories, items, tenantId }) => db.syncMenu(categories, items, tenantId));
    ipcMain.handle('db-get-menu', async (event, tenantId) => db.getLocalMenu(tenantId));
    ipcMain.handle('db-save-order', async (event, order, status) => db.saveOrder(order, status));
    ipcMain.handle('db-get-queued-orders', async (event) => db.getQueuedOrders());
    ipcMain.handle('db-delete-order', async (event, id) => db.deleteLocalOrder(id));
    ipcMain.handle('db-mark-synced', async (event, id) => db.markOrderSynced(id));
    ipcMain.handle('db-get-all-orders', async (event) => db.getAllLocalOrders());
    ipcMain.handle('db-clear-local-data', async (event) => db.clearLocalData());
    ipcMain.handle('db-sync-settings', async (event, { settings, tenantId }) => db.saveSettings(settings, tenantId));
    ipcMain.handle('db-get-settings', async (event, tenantId) => db.getSettings(tenantId));

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
