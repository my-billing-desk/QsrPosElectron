import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('pos_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const QUEUE_KEY = 'offline_orders';
const MENU_ITEMS_KEY = 'cached_menu_items';
const MENU_CATS_KEY = 'cached_menu_cats';

// Helper to check online status (browser APIs are good but sometimes lie, we use try/catch on request mostly)
const isOnline = () => navigator.onLine;

export const request = {
    get: (url) => api.get(url),
    post: (url, data) => api.post(url, data),
};

export const orderService = {
    getAll: (params) => {
        const mode = localStorage.getItem('pos_mode');
        if (mode === 'offline' && window.electronAPI) {
            return orderService.getLocalOrders(params);
        }
        return api.get('/orders', { params }).catch(err => {
            if (window.electronAPI) return orderService.getLocalOrders(params);
            throw err;
        });
    },
    getOrders: (params) => {
        const mode = localStorage.getItem('pos_mode');
        if (mode === 'offline' && window.electronAPI) {
            return orderService.getLocalOrders(params);
        }
        // Online Mode: Try API, fallback to local if network down
        return api.get('/orders', { params }).catch(err => {
            console.warn('[OFFLINE] API failed, using local orders');
            if (window.electronAPI) return orderService.getLocalOrders(params);
            throw err;
        });
    },

    getLocalOrders: async (params) => {
        try {
            let localOrders = await window.electronAPI.getAllLocalOrders();

            // Client-side filtering to match API behavior
            if (params) {
                localOrders = localOrders.filter(o => {
                    // Status Filter
                    if (params.status && params.status !== 'All') {
                        // Map local 'queued'/'synced' to 'placed'/'completed' if needed, or just match exactly
                        // The UI expects 'placed', 'served', 'completed', 'cancelled'
                        // Locally we might have 'queued' (which effectively means placed)
                        const s = o.status === 'queued' || o.status === 'synced' ? 'placed' : o.status;
                        // If filter is 'placed', match 'queued'/'synced' too
                        if (params.status === 'placed' && (o.status === 'queued' || o.status === 'synced')) return true;
                        if (s !== params.status) return false;
                    }

                    // Type Filter
                    if (params.type && params.type !== 'All' && o.type !== params.type) return false;

                    // Order Number Search
                    if (params.orderNumber && !o.orderNumber?.includes(params.orderNumber)) return false;

                    // Customer Search
                    if (params.customerName) {
                        const search = params.customerName.toLowerCase();
                        const name = (o.customerName || '').toLowerCase();
                        const phone = (o.customerPhone || '').toLowerCase();
                        if (!name.includes(search) && !phone.includes(search)) return false;
                    }

                    return true;
                });
            }

            // Normalize status for UI
            localOrders = localOrders.map(o => ({
                ...o,
                // If status is 'queued' or 'synced', show as 'placed' for the user? Or keep as is?
                // The UI badge logic is: completed(green), cancelled(red), default(yellow)
                // 'queued' is yellow, reasonable.
                // But let's standardise if possible.
                // For now, passing raw status is safer as UI handles it.
            }));

            // Sort by Date Desc
            localOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return { data: localOrders };
        } catch (err) {
            console.error("Failed to fetch local orders", err);
            return { data: [] };
        }
    },

    createOrder: async (data) => {
        // Check Mode
        const mode = localStorage.getItem('pos_mode'); // 'online' or 'offline'
        const isOfflineMode = mode === 'offline';

        // If Offline Mode selected AND we are in Electron
        if (isOfflineMode && window.electronAPI) {
            const localOrder = {
                ...data,
                _tempId: Date.now(),
                isOffline: true,
                createdAt: new Date().toISOString(),
                status: 'queued' // Queued for sync
            };

            await window.electronAPI.saveOrder(localOrder);
            console.log('Order saved locally (Offline Mode)', localOrder);

            return {
                data: { ...localOrder, id: localOrder._tempId, status: 'completed' }
            };
        }

        // Online Mode (Default): Try API first
        try {
            const res = await api.post('/orders', data);

            // Should we save to local DB anyway as backup/cache?
            if (window.electronAPI) {
                // Save transparently as 'synced' so it appears in local history
                const syncedOrder = { ...res.data, status: 'synced', isOffline: false };
                await window.electronAPI.saveOrder(syncedOrder, 'synced');
            }
            return res;

        } catch (error) {
            // Network Failure Fallback
            if (!error.response && window.electronAPI) {
                console.log('Network Error: Fallback to Local DB');
                const localOrder = {
                    ...data,
                    _tempId: Date.now(),
                    isOffline: true,
                    createdAt: new Date().toISOString(),
                    status: 'queued'
                };
                await window.electronAPI.saveOrder(localOrder);
                return { data: { ...localOrder, id: localOrder._tempId, status: 'completed' } };
            }

            if (!error.response) {
                console.log('Network Error: Queuing order (Offline)');
                const offlineOrder = { ...data, _tempId: Date.now(), isOffline: true, createdAt: new Date().toISOString() };

                if (window.electronAPI) {
                    // Save to SQLite
                    await window.electronAPI.saveOrder(offlineOrder, 'queued');
                    return { data: { ...offlineOrder, id: `OFF-${offlineOrder._tempId}`, status: 'offline_queued' } };
                } else {
                    // Fallback to LocalStorage (Web)
                    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
                    queue.push(offlineOrder);
                    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
                    return { data: { ...offlineOrder, id: `OFF-${offlineOrder._tempId}`, status: 'offline_queued' } };
                }
            }
            throw error;
        }
    },

    syncOrders: (orders) => api.post('/orders/sync', orders),

    processQueue: async () => {
        let queue = [];
        if (window.electronAPI) {
            queue = await window.electronAPI.getQueuedOrders(); // From SQLite
            console.log('[SYNC] Found', queue.length, 'orders in local queue');
        } else {
            queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        }

        if (queue.length === 0) {
            console.log('[SYNC] Queue is empty');
            return { count: 0, success: true };
        }

        const failed = [];
        let successCount = 0;

        for (const order of queue) {
            try {
                console.log('[SYNC] Attempting to sync order:', order.orderNumber || order.id);
                const { _tempId, isOffline, ...orderData } = order;

                // Add tenantId explicitly if missing
                if (!orderData.tenantId) {
                    orderData.tenantId = localStorage.getItem('pos_tenant_id');
                }

                await api.post('/orders', orderData);
                console.log('[SYNC] Order synced successfully');

                if (window.electronAPI) {
                    await window.electronAPI.markOrderSynced(order.id || _tempId);
                }
                successCount++;
            } catch (err) {
                console.error('[SYNC] Failed to sync order:', order.orderNumber, err.response?.data || err.message);
                failed.push(order);
            }
        }

        if (!window.electronAPI) {
            // Update LocalStorage buffer with failed ones only
            localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
        }

        return { count: successCount, failed: failed.length };
    },

    getQueueLength: async () => {
        if (window.electronAPI) {
            const queue = await window.electronAPI.getQueuedOrders();
            return queue.length;
        }
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        return queue.length;
    },

    markKotPrinted: (id) => api.post('/orders/mark-kot-printed', { id })
};

const SETTINGS_KEY = 'cached_settings';

// ============================================
// LOCAL-FIRST MENU SERVICE
// Always reads from local DB, sync pulls from API
// ============================================

export const menuService = {
    // Online-First Default: Try API, fallback to local
    getItems: async () => {
        const mode = localStorage.getItem('pos_mode');
        if (mode === 'offline' && window.electronAPI) {
            // Explicit Offline Mode
            const tenantId = localStorage.getItem('pos_tenant_id');
            const localMenu = await window.electronAPI.getLocalMenu(tenantId);
            return { data: localMenu?.items || [] };
        }

        // Online Mode
        return api.get('/menu/items').catch(async (err) => {
            console.warn('API Failed, falling back to local menu', err);
            if (window.electronAPI) {
                const tenantId = localStorage.getItem('pos_tenant_id');
                const localMenu = await window.electronAPI.getLocalMenu(tenantId);
                if (localMenu?.items) return { data: localMenu.items };
            }
            // Fallback to cache if no electron or electron fail
            const cached = localStorage.getItem(MENU_ITEMS_KEY);
            if (cached) return { data: JSON.parse(cached) };
            throw err;
        });
    },

    getCategories: async () => {
        const mode = localStorage.getItem('pos_mode');
        if (mode === 'offline' && window.electronAPI) {
            const tenantId = localStorage.getItem('pos_tenant_id');
            const localMenu = await window.electronAPI.getLocalMenu(tenantId);
            return { data: localMenu?.categories || [] };
        }

        return api.get('/menu/categories').catch(async (err) => {
            console.warn('API Failed, falling back to local categories', err);
            if (window.electronAPI) {
                const tenantId = localStorage.getItem('pos_tenant_id');
                const localMenu = await window.electronAPI.getLocalMenu(tenantId);
                if (localMenu?.categories) return { data: localMenu.categories };
            }
            const cached = localStorage.getItem(MENU_CATS_KEY);
            if (cached) return { data: JSON.parse(cached) };
            throw err;
        });
    },

    // Sync function: Pulls from API and saves to local DB
    syncFromServer: async () => {
        const tenantId = localStorage.getItem('pos_tenant_id');
        if (!tenantId) throw new Error('No tenant configured');

        console.log('[SYNC] Fetching fresh data from server...');

        // Fetch from API
        const [catRes, itemRes] = await Promise.all([
            api.get('/menu/categories'),
            api.get('/menu/items')
        ]);

        const categories = catRes.data || [];
        const items = itemRes.data || [];

        // Save to localStorage (browser cache)
        localStorage.setItem(MENU_CATS_KEY, JSON.stringify(categories));
        localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(items));

        // Save to local SQLite database (Electron) - pass complete items for offline addon/variant support
        if (window.electronAPI) {
            await window.electronAPI.syncMenu({
                categories: categories,
                items: items, // Pass complete item objects with addons/variants
                tenantId: tenantId
            });
            console.log('[SYNC] Data saved to local SQLite database');
        }

        console.log('[SYNC] Sync complete:', categories.length, 'categories,', items.length, 'items');
        return { categories, items };
    }
};

export const specialNoteService = {
    getAll: () => api.get('/special-notes'),
    create: (data) => api.post('/special-notes', data),
};

export const configService = {
    getTables: () => api.get('/config/tables'),
};

export const outletService = {
    getConfig: () => api.get('/config/outlet'),
};

export const settingsService = {
    // Online-First Default for Settings
    getSettings: async () => {
        const mode = localStorage.getItem('pos_mode');

        // Explicit Offline Mode - Cache Only (Electron First)
        if (mode === 'offline') {
            if (window.electronAPI) {
                const tenantId = localStorage.getItem('pos_tenant_id');
                const localSettings = await window.electronAPI.getSettings(tenantId);
                return { data: localSettings };
            }
            // Fallback to localStorage
            const cached = localStorage.getItem(SETTINGS_KEY);
            return cached ? { data: JSON.parse(cached) } : { data: {} };
        }

        // Online Mode - Fetch live
        return api.get('/settings').then(async (res) => {
            // Check if we are in Electron to sync to SQLite
            if (window.electronAPI) {
                const tenantId = localStorage.getItem('pos_tenant_id');
                if (tenantId) {
                    await window.electronAPI.syncSettings({ settings: res.data, tenantId });
                }
            } else {
                // Web Fallback
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(res.data));
            }
            return res;
        }).catch(async (err) => {
            console.warn('Settings API failed, using cache', err);

            if (window.electronAPI) {
                const tenantId = localStorage.getItem('pos_tenant_id');
                const localSettings = await window.electronAPI.getSettings(tenantId);
                if (localSettings && Object.keys(localSettings).length > 0) return { data: localSettings };
            }

            const cached = localStorage.getItem(SETTINGS_KEY);
            return cached ? { data: JSON.parse(cached) } : { data: {} };
        });
    },

    // Sync settings from server
    syncFromServer: async () => {
        const res = await api.get('/settings');

        if (window.electronAPI) {
            const tenantId = localStorage.getItem('pos_tenant_id');
            if (tenantId) {
                await window.electronAPI.syncSettings({ settings: res.data, tenantId });
                console.log('[SYNC] Settings synced to SQLite');
            }
        } else {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(res.data));
            console.log('[SYNC] Settings synced to LocalStorage');
        }

        return res;
    }
};

export const authService = {
    login: async (credentials) => {
        console.log('[API_DEBUG] Attempting login to:', API_URL, 'with payload:', credentials);
        try {
            const res = await api.post('/auth/login', credentials);
            return res;
        } catch (error) {
            console.log('[API_DEBUG] Login error response:', error.response?.data);
            // Check for network error (offline)
            if (!error.response && window.electronAPI) {
                console.log('Backend unreachable, attempting offline login...');
                const localUser = await window.electronAPI.verifyLogin(credentials);
                if (localUser) {
                    return { data: { user: localUser, token: 'offline-token' } };
                }
            }
            throw error;
        }
    },
    syncUsers: () => api.get('/auth/sync-users'),
    initTerminal: (idOrSubdomain) => {
        console.log(`[API_DEBUG] Terminal Init for: "${idOrSubdomain}" to ${API_URL}`);
        return api.get(`/auth/init-terminal/${idOrSubdomain}`);
    },
    sendOTP: (tenantId) => api.post('/auth/send-otp', { tenantId }),
    verifyOTP: (tenantId, otp) => api.post('/auth/verify-otp', { tenantId, otp })
};

export const inventoryService = {
    getRawMaterials: () => api.get('/inventory/materials'),
    createRawMaterial: (data) => api.post('/inventory/materials', data),
    updateRawMaterial: (id, data) => api.put(`/inventory/materials/${id}`, data),
    deleteRawMaterial: (id) => api.delete(`/inventory/materials/${id}`),

    getRecipes: () => api.get('/inventory/recipes'),
    getRecipe: (params) => api.get('/inventory/recipe', { params }), // { itemId, variantId }
    saveRecipe: (data) => api.post('/inventory/recipes', data),

    // Procurement
    getSuppliers: () => api.get('/inventory/suppliers'),
    createSupplier: (data) => api.post('/inventory/suppliers', data),

    getPurchases: () => api.get('/inventory/purchases'),
    createPurchase: (data) => api.post('/inventory/purchases', data),

    getPurchaseOrders: () => api.get('/inventory/orders'),
    createPurchaseOrder: (data) => api.post('/inventory/orders', data),
    updatePurchaseOrder: (id, data) => api.put(`/inventory/orders/${id}`, data),

    getPurchaseReturns: () => api.get('/inventory/returns'),
    createPurchaseReturn: (data) => api.post('/inventory/returns', data),

    // Wastage
    getWastages: () => api.get('/inventory/wastage'),
    createWastage: (data) => api.post('/inventory/wastage', data),

    getStats: () => api.get('/inventory/stats'),
    updateClosingStock: (data) => api.post('/inventory/closing-stock', data),
    getClosingStockReport: () => api.get('/inventory/reports/closing-stock'),
    getStockSummaryReport: (params) => api.get('/inventory/reports/stock-summary', { params }), // New
    getOrderWiseConsumptionReport: (params) => api.get('/inventory/reports/order-consumption', { params }), // New
    getConsumptionSummaryReport: (params) => api.get('/inventory/reports/consumption-summary', { params }), // New
};

export default api;
