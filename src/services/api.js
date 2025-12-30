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
        // Local-First: Read from Electron DB
        if (window.electronAPI) {
            return orderService.getLocalOrders(params);
        }
        return api.get('/orders', { params });
    },
    getOrders: (params) => {
        if (window.electronAPI) {
            return orderService.getLocalOrders(params);
        }
        return api.get('/orders', { params });
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
        // Local-First: Always save to Electron Local DB if available
        if (window.electronAPI) {
            const localOrder = {
                ...data,
                _tempId: Date.now(),
                isOffline: true,
                createdAt: new Date().toISOString(),
                status: 'queued' // Queued for sync
            };

            await window.electronAPI.saveOrder(localOrder);
            console.log('Order saved locally (Local First)', localOrder);

            return {
                data: { ...localOrder, id: localOrder._tempId, status: 'completed' }
            };
        }

        // Web Fallback
        try {
            return await api.post('/orders', data);
        } catch (error) {
            if (!error.response) {
                console.log('Network Error: Queuing order');
                const offlineOrder = { ...data, _tempId: Date.now(), isOffline: true, createdAt: new Date().toISOString() };
                const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
                queue.push(offlineOrder);
                localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
                return { data: { ...offlineOrder, id: `OFF-${offlineOrder._tempId}`, status: 'offline_queued' } };
            }
            throw error;
        }
    },

    syncOrders: (orders) => api.post('/orders/sync', orders),

    processQueue: async () => {
        let queue = [];
        if (window.electronAPI) {
            queue = await window.electronAPI.getQueuedOrders();
        } else {
            queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        }

        if (queue.length === 0) return { count: 0, success: true };

        const failed = [];
        let successCount = 0;

        for (const order of queue) {
            try {
                const { _tempId, isOffline, ...orderData } = order;
                await api.post('/orders', orderData);

                if (window.electronAPI) {
                    await window.electronAPI.markOrderSynced(order.id || _tempId);
                }
                successCount++;
            } catch (err) {
                console.error('Failed to sync order', order, err);
                failed.push(order);
            }
        }

        if (!window.electronAPI) {
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
    // Always read from local database first
    getItems: async () => {
        const tenantId = localStorage.getItem('pos_tenant_id');

        // Try local SQLite database first (Electron)
        if (window.electronAPI && tenantId) {
            try {
                const localMenu = await window.electronAPI.getLocalMenu(tenantId);
                if (localMenu && localMenu.items && localMenu.items.length > 0) {
                    console.log('[LOCAL-FIRST] Loaded', localMenu.items.length, 'items from local SQLite database');
                    // Items are already complete objects from JSON storage
                    return { data: localMenu.items };
                }
            } catch (err) {
                console.warn('[LOCAL-FIRST] SQLite read failed:', err);
            }
        }

        // Fallback to localStorage cache
        const cached = localStorage.getItem(MENU_ITEMS_KEY);
        if (cached) {
            console.log('[LOCAL-FIRST] Loaded items from localStorage cache');
            return { data: JSON.parse(cached) };
        }

        console.warn('[LOCAL-FIRST] No local data found. Please sync.');
        return { data: [] };
    },


    getCategories: async () => {
        const tenantId = localStorage.getItem('pos_tenant_id');

        // Try local SQLite database first (Electron)
        if (window.electronAPI && tenantId) {
            try {
                const localMenu = await window.electronAPI.getLocalMenu(tenantId);
                if (localMenu && localMenu.categories && localMenu.categories.length > 0) {
                    console.log('[LOCAL-FIRST] Loaded categories from local SQLite database');
                    return { data: localMenu.categories };
                }
            } catch (err) {
                console.warn('[LOCAL-FIRST] SQLite read failed:', err);
            }
        }

        // Fallback to localStorage cache
        const cached = localStorage.getItem(MENU_CATS_KEY);
        if (cached) {
            console.log('[LOCAL-FIRST] Loaded categories from localStorage cache');
            return { data: JSON.parse(cached) };
        }

        console.warn('[LOCAL-FIRST] No local data found. Please sync.');
        return { data: [] };
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

export const outletService = {
    getConfig: () => api.get('/config/outlet'),
};

export const settingsService = {
    // Read from cache first, sync updates from server
    getSettings: async () => {
        const cached = localStorage.getItem(SETTINGS_KEY);
        if (cached) {
            console.log('[LOCAL-FIRST] Loaded settings from cache');
            return { data: JSON.parse(cached) };
        }
        // Return defaults if no cache
        console.warn('[LOCAL-FIRST] No cached settings, using defaults');
        return {
            data: {
                gst_mode: 'exclusive',
                gst_percentage: '5',
                accept_decimal: 'false'
            }
        };
    },

    // Sync settings from server
    syncFromServer: async () => {
        const res = await api.get('/settings');
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(res.data));
        console.log('[SYNC] Settings synced from server');
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
    }
};

export const inventoryService = {
    getStats: () => api.get('/inventory/stats'),
};

export default api;
