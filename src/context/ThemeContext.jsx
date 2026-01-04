import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState({
        themeColor: '#10B981',
        themeName: 'Emerald Slate',
        palette: ['#10B981', '#0F172A', '#F8FAFC']
    });

    // Monitor token changes to refetch theme on login
    const [currentToken, setCurrentToken] = useState(localStorage.getItem('pos_token'));

    useEffect(() => {
        // Watch for token changes
        const interval = setInterval(() => {
            const newToken = localStorage.getItem('pos_token');
            if (newToken !== currentToken) {
                setCurrentToken(newToken);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentToken]);

    useEffect(() => {
        const fetchAndApplyTheme = async () => {
            try {
                const token = localStorage.getItem('pos_token');
                if (!token) {
                    // Apply default theme
                    applyDefaultTheme();
                    return;
                }

                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const res = await axios.get(`${API_URL}/config/outlet`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data?.data) {
                    const data = res.data.data;

                    // Try to parse the full theme object from themePalette
                    if (data.themePalette) {
                        try {
                            const themeObject = JSON.parse(data.themePalette);

                            // Apply theme settings if available
                            if (themeObject.settings) {
                                applyThemeSettings(themeObject.settings);
                            }

                            setTheme({
                                themeColor: themeObject.settings?.['--color-primary'] || data.themeColor || '#10B981',
                                themeName: data.themeName || themeObject.name || 'Default',
                                palette: themeObject
                            });

                            console.log('[POS THEME] Applied tenant theme:', data.themeName);
                            return;
                        } catch (e) {
                            console.error('Failed to parse theme palette', e);
                        }
                    }

                    // Fallback to simple theme color
                    const simpleTheme = {
                        themeColor: data.themeColor || '#10B981',
                        themeName: data.themeName || 'Default',
                        palette: [data.themeColor || '#10B981']
                    };
                    setTheme(simpleTheme);

                    // Apply basic color
                    const root = document.documentElement;
                    root.style.setProperty('--color-primary', simpleTheme.themeColor);
                    root.style.setProperty('--color-primary-hover', simpleTheme.themeColor);

                    console.log('[POS THEME] Applied simple theme:', simpleTheme.themeName);
                }
            } catch (error) {
                console.error('Error fetching theme in POS:', error);
                applyDefaultTheme();
            }
        };

        fetchAndApplyTheme();
    }, [currentToken]);

    const applyThemeSettings = (settings) => {
        const root = document.documentElement;

        // Reset previous theme variables
        const variablesToReset = [
            '--bg-main', '--bg-surface', '--bg-sidebar', '--bg-header',
            '--text-main', '--text-muted', '--text-light',
            '--color-primary', '--color-primary-hover', '--color-secondary',
            '--status-success', '--status-warning', '--status-error', '--status-info',
            '--border-color', '--sidebar-active', '--sidebar-active-text', '--sidebar-text',
            '--pos-btn-pay', '--pos-btn-hold', '--pos-btn-save', '--pos-btn-cancel'
        ];
        variablesToReset.forEach(v => root.style.removeProperty(v));

        // Apply new theme settings
        Object.entries(settings).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    };

    const applyDefaultTheme = () => {
        const defaultSettings = {
            '--bg-main': '#F8FAFC',
            '--bg-surface': '#FFFFFF',
            '--bg-sidebar': '#0F172A',
            '--bg-header': '#FFFFFF',
            '--text-main': '#1E293B',
            '--text-muted': '#64748B',
            '--color-primary': '#10B981',
            '--color-primary-hover': '#059669',
            '--color-secondary': '#64748B',
            '--status-success': '#22C55E',
            '--status-warning': '#F59E0B',
            '--status-error': '#EF4444',
            '--status-info': '#3B82F6',
            '--border-color': '#E2E8F0',
            '--sidebar-active': 'rgba(16, 185, 129, 0.1)',
            '--sidebar-active-text': '#10B981',
            '--sidebar-text': '#94A3B8',
            '--pos-btn-pay': '#22C55E',
            '--pos-btn-hold': '#F59E0B',
            '--pos-btn-save': '#64748B',
            '--pos-btn-cancel': '#EF4444',
        };
        applyThemeSettings(defaultSettings);
        console.log('[POS THEME] Applied default theme');
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
