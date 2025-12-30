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

        // Support granular pro settings
        if (themeData.settings) {
            Object.entries(themeData.settings).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
            return;
        }

        // Ensure themeData has a colors array if it's the professional palette format
        const colors = themeData.colors || themeData.palette;
        // ... (rest of existing logic)

        if (themeData.id === 'emerald_slate') {
            root.style.setProperty('--bg-main', '#F8FAFC');
            root.style.setProperty('--bg-surface', '#FFFFFF');
            root.style.setProperty('--bg-sidebar', '#0F172A');
            root.style.setProperty('--bg-header', '#FFFFFF');
            root.style.setProperty('--text-main', '#1E293B');
            root.style.setProperty('--text-muted', '#64748B');
            root.style.setProperty('--color-primary', '#10B981');
            root.style.setProperty('--color-primary-hover', '#059669');
            root.style.setProperty('--color-secondary', '#64748B');
            root.style.setProperty('--status-success', '#22C55E');
            root.style.setProperty('--status-warning', '#F59E0B');
            root.style.setProperty('--status-error', '#EF4444');
            root.style.setProperty('--border-color', '#E2E8F0');
        } else if (themeData.id === 'midnight_emerald') {
            root.style.setProperty('--bg-main', '#0F172A');
            root.style.setProperty('--bg-surface', '#1E293B');
            root.style.setProperty('--bg-sidebar', '#020617');
            root.style.setProperty('--bg-header', '#0F172A');
            root.style.setProperty('--text-main', '#F8FAFC');
            root.style.setProperty('--text-muted', '#94A3B8');
            root.style.setProperty('--color-primary', '#34D399');
            root.style.setProperty('--color-primary-hover', '#10B981');
            root.style.setProperty('--color-secondary', '#64748B');
            root.style.setProperty('--status-success', '#22C55E');
            root.style.setProperty('--status-warning', '#F59E0B');
            root.style.setProperty('--status-error', '#EF4444');
            root.style.setProperty('--border-color', '#334155');
        } else if (colors) {
            root.style.setProperty('--color-primary', colors[0]);
            root.style.setProperty('--bg-main', colors[2]);
            root.style.setProperty('--text-main', colors[1]);
            root.style.setProperty('--bg-surface', '#FFFFFF');
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
