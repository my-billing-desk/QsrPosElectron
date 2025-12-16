const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

// Debugging Electron load
console.log('Electron module loaded type:', typeof app);


// IPC Handlers
ipcMain.handle('get-printers', async (event) => {
    try {
        const printers = await event.sender.getPrintersAsync();
        console.log('Printers found:', printers.length);
        return printers;
    } catch (e) {
        console.error('Failed to get printers:', e);
        return [];
    }
});

ipcMain.handle('print-bill', async (event, { printerName, htmlContent }) => {
    console.log(`[PRINT] Request received for printer: "${printerName}"`);
    console.log(`[PRINT] Content length: ${htmlContent ? htmlContent.length : 0}`);

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
        console.log('[PRINT] Worker window loaded content');

        // Wait to ensure rendering
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay

        const options = {
            silent: false,
            deviceName: printerName,
            printBackground: true,
            margins: { marginType: 'printableArea' } // Use driver's printable area
        };

        // If no printer name provided, it will use default. Log this.
        if (!printerName) {
            console.warn('[PRINT] No printerName provided, using system default.');
            delete options.deviceName;
        }

        console.log('[PRINT] Calling print with options:', options);

        // Wrap print in a promise to handle the callback
        await new Promise((resolve, reject) => {
            workerWindow.webContents.print(options, (success, failureReason) => {
                if (success) {
                    console.log('[PRINT] Print job completed successfully.');
                    resolve();
                } else {
                    console.error('[PRINT] Print job failed:', failureReason);
                    reject(new Error(failureReason));
                }
            });
        });

        console.log('[PRINT] Print command promise resolved');

        // workerWindow.close(); // Keep open for debug, or close after a delay?
        // setTimeout(() => workerWindow.close(), 1000); 
        return { success: true };
    } catch (error) {
        console.error('[PRINT] Print failed with error:', error);
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

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
