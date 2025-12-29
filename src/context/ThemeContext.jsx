import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/api';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const cached = localStorage.getItem('pos_theme_config');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(true);

    const applyTheme = useCallback((themeData) => {
        if (!themeData || !themeData.pos) return;

        const root = document.documentElement;
        const posTheme = themeData.pos;

        // Map POS theme keys to CSS variables
        const variableMap = {
            'background': '--pos-bg',
            'header': '--pos-header',
            'sidebar': '--pos-sidebar',
            'category_button': '--pos-cat-btn',
            'category_active': '--pos-cat-active',
            'category_active_text': '--pos-cat-active-text',
            'item_card': '--pos-item-card',
            'checkout_button': '--pos-checkout-btn',
            'checkout_button_text': '--pos-checkout-btn-text',
            'confirm_button': '--pos-confirm-btn',
            'confirm_button_text': '--pos-confirm-btn-text',
            'cancel_button': '--pos-cancel-btn',
            'cancel_button_text': '--pos-cancel-btn-text',
            'numpad_button': '--pos-numpad-btn',
            'numpad_text': '--pos-numpad-text'
        };

        Object.entries(variableMap).forEach(([key, varName]) => {
            if (posTheme[key]) {
                root.style.setProperty(varName, posTheme[key]);
            }
        });
    }, []);

    const fetchTheme = async () => {
        try {
            const res = await settingsService.syncFromServer();
            if (res.data.theme_config) {
                const themeData = JSON.parse(res.data.theme_config);
                setTheme(themeData);
                applyTheme(themeData);
                localStorage.setItem('pos_theme_config', JSON.stringify(themeData));
            }
        } catch (error) {
            console.error('Error fetching theme:', error);
            // Fallback to cache
            if (theme) applyTheme(theme);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTheme();
    }, []);

    // Also apply theme if we have it in state/cache immediately
    useEffect(() => {
        if (theme) applyTheme(theme);
    }, [theme, applyTheme]);

    return (
        <ThemeContext.Provider value={{ theme, refreshTheme: fetchTheme, loading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default ThemeContext;
