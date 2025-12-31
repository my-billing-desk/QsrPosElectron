import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState({
        themeColor: '#fa8072',
        themeName: 'Coral',
        palette: ['#fa8072', '#ff8c69', '#ff9c7d', '#ffac91', '#ffbca5']
    });

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const token = localStorage.getItem('pos_token');
                if (!token) return;

                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const res = await axios.get(`${API_URL}/config/outlet`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data?.data) {
                    const data = res.data.data;
                    let palette = ['#fa8072', '#ff8c69', '#ff9c7d', '#ffac91', '#ffbca5'];
                    if (data.themePalette) {
                        try {
                            palette = JSON.parse(data.themePalette);
                        } catch (e) {
                            console.error('Failed to parse palette', e);
                        }
                    } else if (data.themeColor) {
                        palette = [data.themeColor, data.themeColor, data.themeColor, data.themeColor, data.themeColor];
                    }

                    const newTheme = {
                        themeColor: data.themeColor || '#fa8072',
                        themeName: data.themeName || 'Coral',
                        palette: palette
                    };
                    setTheme(newTheme);
                    applyTheme(newTheme.palette);
                }
            } catch (error) {
                console.error('Error fetching theme in POS:', error);
            }
        };

        fetchTheme();
    }, []);

    const applyTheme = (themeData) => {
        const root = document.documentElement;

        // Reset any existing override variables to prevent leakage between themes
        const variablesToReset = [
            '--bg-main', '--bg-surface', '--bg-sidebar', '--bg-header',
            '--text-main', '--text-muted', '--text-light',
            '--color-primary', '--color-primary-hover', '--color-secondary',
            '--status-success', '--status-warning', '--status-error', '--status-info',
            '--border-color', '--sidebar-active', '--sidebar-active-text', '--sidebar-text',
            '--pos-btn-pay', '--pos-btn-hold', '--pos-btn-save', '--pos-btn-cancel'
        ];
        variablesToReset.forEach(v => root.style.removeProperty(v));

        // 1. Support granular pro settings (Preferred)
        if (themeData.settings) {
            Object.entries(themeData.settings).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
            return;
        }

        // 2. Support fixed theme IDs (Legacy Compatibility)
        if (themeData.id === 'emerald_slate') {
            const defaults = {
                '--bg-main': '#F8FAFC', '--bg-surface': '#FFFFFF', '--bg-sidebar': '#0F172A',
                '--bg-header': '#FFFFFF', '--text-main': '#1E293B', '--text-muted': '#64748B',
                '--color-primary': '#10B981', '--color-primary-hover': '#059669', '--color-secondary': '#64748B',
                '--status-success': '#22C55E', '--status-warning': '#F59E0B', '--status-error': '#EF4444',
                '--sidebar-active': 'rgba(16, 185, 129, 0.1)', '--sidebar-active-text': '#10B981',
                '--sidebar-text': '#94A3B8', '--border-color': '#E2E8F0'
            };
            Object.entries(defaults).forEach(([k, v]) => root.style.setProperty(k, v));
            return;
        }

        // 3. Fallback for color arrays
        const colors = themeData.colors || themeData.palette || (Array.isArray(themeData) ? themeData : null);

        if (Array.isArray(colors)) {
            root.style.setProperty('--color-primary', colors[0] || '#fa8072');
            root.style.setProperty('--bg-sidebar', colors[1] || '#020617');
            root.style.setProperty('--bg-main', colors[2] || '#0F172A');
            root.style.setProperty('--color-primary-hover', colors[0]);
            root.style.setProperty('--sidebar-active-text', colors[0]);
        }
    };

    return (
        <ThemeContext.Provider value={{ ...theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
