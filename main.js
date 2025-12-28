const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const util = require('util');

const logPath = path.join(__dirname, 'electron_debug.log');

function logToFile(...args) {
    const timestamp = new Date().toISOString();
    const message = util.format(...args);
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Debugging Electron load
const electronPkg = require('electron');
console.log('require("electron") value:', electronPkg);
try {
    console.log('require.resolve("electron"):', require.resolve('electron'));
} catch (e) { console.log('resolve failed', e); }

console.log('Electron module loaded type:', typeof app);
console.log('Process versions:', process.versions);
logToFile('App started');

// IPC Handlers
ipcMain.handle('get-printers', async (event) => {
    try {
        const printers = await event.sender.getPrintersAsync();
        logToFile('Printers found:', printers.length);
        return printers;
    } catch (e) {
        logToFile('Failed to get printers:', e);
        return [];
    }
});

ipcMain.handle('print-bill', async (event, { printerName, htmlContent }) => {
    logToFile(`[PRINT] Request received for printer: "${printerName}"`);
    logToFile(`[PRINT] Content length: ${htmlContent ? htmlContent.length : 0}`);

    const workerWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            contextIsolation: true
        }
    });

    try {
        // Fix spaces in data URL
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        await workerWindow.loadURL(dataUrl);
        logToFile('[PRINT] Worker window loaded content');

        // Check available printers to validate printerName
        const printers = await workerWindow.webContents.getPrintersAsync();
        const validPrinter = printers.find(p => p.name === printerName);

        if (printerName && !validPrinter) {
            logToFile(`[PRINT] Printer "${printerName}" not found in system. Available:`, JSON.stringify(printers.map(p => p.name)));
            logToFile('[PRINT] Falling back to system default printer.');
        }

        const options = {
            silent: false,
            printBackground: true,
            // margins: { marginType: 'default' } 
        };

        if (printerName && validPrinter) {
            options.deviceName = printerName;
        }

        logToFile('[PRINT] Calling print with options:', JSON.stringify(options));

        // Wrap print in a promise to handle the callback
        await new Promise((resolve, reject) => {
            workerWindow.webContents.print(options, (success, failureReason) => {
                if (success) {
                    logToFile('[PRINT] Print job completed successfully.');
                    resolve();
                } else {
                    logToFile('[PRINT] Print job failed:', failureReason);
                    reject(new Error(failureReason));
                }
            });
        });

        logToFile('[PRINT] Print command promise resolved');

        // workerWindow.close(); // Keep open for debug, or close after a delay?
        // setTimeout(() => workerWindow.close(), 1000); 
        return { success: true };
    } catch (error) {
        logToFile('[PRINT] Print failed with error:', error);
        // if (!workerWindow.isDestroyed()) workerWindow.close();
        throw error;
    }
});

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
        mainWindow.loadURL('http://localhost:5569').catch(e => console.log('Failed to load URL, is Vite running?'));
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

const db = require('./db');

app.whenReady().then(() => {
    db.initDb();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Database IPC Handlers
ipcMain.handle('db-verify-login', async (event, credentials) => {
    return await db.verifyLocalLogin(credentials);
});

ipcMain.handle('db-sync-users', async (event, users) => {
    return db.saveUsers(users);
});

ipcMain.handle('db-sync-menu', async (event, { categories, items, tenantId }) => {
    return db.syncMenu(categories, items, tenantId);
});

ipcMain.handle('db-get-menu', async (event, tenantId) => {
    return db.getLocalMenu(tenantId);
});

ipcMain.handle('db-save-order', async (event, order) => {
    return db.saveOrder(order);
});

ipcMain.handle('db-get-queued-orders', async (event) => {
    return db.getQueuedOrders();
});

ipcMain.handle('db-mark-synced', async (event, id) => {
    return db.markOrderSynced(id);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
