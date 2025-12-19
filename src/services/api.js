import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
});

export const request = {
    get: (url) => api.get(url),
    post: (url, data) => api.post(url, data),
};

export const orderService = {
    getAll: (params) => api.get('/orders', { params }), // Renamed to Match Web Admin convention or keep getOrders but with params
    getOrders: (params) => api.get('/orders', { params }), // Keeping this for backward compatibility if used
    createOrder: (data) => api.post('/orders', data),
    syncOrders: (orders) => api.post('/orders/sync', orders)
};

export const menuService = {
    getItems: () => api.get('/menu/items'),
    getCategories: () => api.get('/menu/categories')
};

export const specialNoteService = {
    getAll: () => api.get('/special-notes'),
    create: (data) => api.post('/special-notes', data),
};

export const settingsService = {
    getSettings: () => api.get('/settings')
};

export default api;
