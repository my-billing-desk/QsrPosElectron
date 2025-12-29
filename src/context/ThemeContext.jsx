import React, { createContext, useContext, useState, useEffect } from 'react';
import { outletService } from '../services/api';

const ThemeContext = createContext({
    themeColor: '#dc2626',
    themeName: 'Ruby Red',
    loading: true,
    refreshTheme: () => { },
});

// Helper to generate HSL variants from a hex color
function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
            default: h = 0;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function ThemeProvider({ children }) {
    const [themeColor, setThemeColor] = useState(() => {
        return localStorage.getItem('pos_theme_color') || '#dc2626';
    });
    const [themeName, setThemeName] = useState(() => {
        return localStorage.getItem('pos_theme_name') || 'Ruby Red';
    });
    const [loading, setLoading] = useState(true);

    const fetchTheme = async () => {
        try {
            const res = await outletService.getConfig();
            if (res.data.success && res.data.data) {
                const color = res.data.data.themeColor || '#dc2626';
                const name = res.data.data.themeName || 'Ruby Red';
                setThemeColor(color);
                setThemeName(name);
                localStorage.setItem('pos_theme_color', color);
                localStorage.setItem('pos_theme_name', name);
            }
        } catch (error) {
            console.error('Error fetching theme:', error);
            // Use cached values from localStorage (already set in initial state)
        } finally {
            setLoading(false);
        }
    };

    // Apply CSS variables when theme color changes
    useEffect(() => {
        const hsl = hexToHsl(themeColor);
        const root = document.documentElement;

        // Set primary color CSS variables
        root.style.setProperty('--color-primary', themeColor);
        root.style.setProperty('--color-primary-h', hsl.h);
        root.style.setProperty('--color-primary-s', `${hsl.s}%`);
        root.style.setProperty('--color-primary-l', `${hsl.l}%`);

        // Generate lighter and darker variants
        root.style.setProperty('--color-primary-50', `hsl(${hsl.h}, ${hsl.s}%, 95%)`);
        root.style.setProperty('--color-primary-100', `hsl(${hsl.h}, ${hsl.s}%, 90%)`);
        root.style.setProperty('--color-primary-200', `hsl(${hsl.h}, ${hsl.s}%, 80%)`);
        root.style.setProperty('--color-primary-300', `hsl(${hsl.h}, ${hsl.s}%, 70%)`);
        root.style.setProperty('--color-primary-400', `hsl(${hsl.h}, ${hsl.s}%, 60%)`);
        root.style.setProperty('--color-primary-500', themeColor);
        root.style.setProperty('--color-primary-600', `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 10, 10)}%)`);
        root.style.setProperty('--color-primary-700', `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 20, 5)}%)`);
        root.style.setProperty('--color-primary-800', `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 30, 5)}%)`);
        root.style.setProperty('--color-primary-900', `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 40, 5)}%)`);

    }, [themeColor]);

    // Fetch theme on mount and when tenant changes
    useEffect(() => {
        const tenantId = localStorage.getItem('pos_tenant_id');
        if (tenantId) {
            fetchTheme();
        } else {
            setLoading(false);
        }
    }, []);

    // Listen for storage changes (when theme is updated from admin panel)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'pos_theme_color' && e.newValue) {
                setThemeColor(e.newValue);
            }
            if (e.key === 'pos_theme_name' && e.newValue) {
                setThemeName(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const refreshTheme = () => {
        fetchTheme();
    };

    return (
        <ThemeContext.Provider value={{ themeColor, themeName, loading, refreshTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default ThemeContext;
