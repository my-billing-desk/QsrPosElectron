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
    getAll: (params) => api.get('/orders', { params }),
    getOrders: (params) => api.get('/orders', { params }),

    createOrder: async (data) => {
        if (!isOnline()) {
            console.log('Offline: Queuing order');
            const offlineOrder = { ...data, _tempId: Date.now(), isOffline: true, createdAt: new Date().toISOString() };

            if (window.electronAPI) {
                await window.electronAPI.saveOrder(offlineOrder);
            } else {
                const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
                queue.push(offlineOrder);
                localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            }

            return {
                data: { ...offlineOrder, id: `OFF-${offlineOrder._tempId}`, status: 'offline_queued' }
            };
        }

        try {
            return await api.post('/orders', data);
        } catch (error) {
            if (!error.response) {
                console.log('Network Error: Queuing order');
                const offlineOrder = { ...data, _tempId: Date.now(), isOffline: true, createdAt: new Date().toISOString() };

                if (window.electronAPI) {
                    await window.electronAPI.saveOrder(offlineOrder);
                } else {
                    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
                    queue.push(offlineOrder);
                    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
                }

                return {
                    data: { ...offlineOrder, id: `OFF-${offlineOrder._tempId}`, status: 'offline_queued' }
                };
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

export const menuService = {
    getItems: async () => {
        try {
            const res = await api.get('/menu/items');
            localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(res.data));
            return res;
        } catch (error) {
            console.warn('Fetch items failed, trying cache');
            const cached = localStorage.getItem(MENU_ITEMS_KEY);
            if (cached) return { data: JSON.parse(cached) };
            throw error;
        }
    },
    getCategories: async () => {
        try {
            const res = await api.get('/menu/categories');
            localStorage.setItem(MENU_CATS_KEY, JSON.stringify(res.data));
            return res;
        } catch (error) {
            console.warn('Fetch categories failed, trying cache');
            const cached = localStorage.getItem(MENU_CATS_KEY);
            if (cached) return { data: JSON.parse(cached) };
            throw error;
        }
    }
};

export const specialNoteService = {
    getAll: () => api.get('/special-notes'),
    create: (data) => api.post('/special-notes', data),
};

export const settingsService = {
    getSettings: () => api.get('/settings')
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

export default api;
