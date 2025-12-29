// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    printBill: (data) => ipcRenderer.invoke('print-bill', data),

    // Offline / SQLite
    verifyLogin: (creds) => ipcRenderer.invoke('db-verify-login', creds),
    syncUsers: (users) => ipcRenderer.invoke('db-sync-users', users),
    syncMenu: (data) => ipcRenderer.invoke('db-sync-menu', data),
    getLocalMenu: (tenantId) => ipcRenderer.invoke('db-get-menu', tenantId),
    saveOrder: (order, status) => ipcRenderer.invoke('db-save-order', order, status),
    deleteOrder: (id) => ipcRenderer.invoke('db-delete-order', id),
    getQueuedOrders: () => ipcRenderer.invoke('db-get-queued-orders'),
    markOrderSynced: (id) => ipcRenderer.invoke('db-mark-synced', id),
    getAllLocalOrders: () => ipcRenderer.invoke('db-get-all-orders')
});
