/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Mapping semantic names to CSS Variables
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                    shade: 'var(--color-primary-shade, var(--color-primary))',
                },
                secondary: 'var(--color-secondary)',
                main: 'var(--bg-main)',
                surface: 'var(--bg-surface)',
                sidebar: {
                    DEFAULT: 'var(--bg-sidebar)',
                    active: 'var(--sidebar-active)',
                    'active-text': 'var(--sidebar-active-text)',
                    text: 'var(--sidebar-text)',
                },
                header: 'var(--bg-header)',
                border: 'var(--border-color)',
                status: {
                    success: 'var(--status-success)',
                    warning: 'var(--status-warning)',
                    error: 'var(--status-error)',
                    info: 'var(--status-info)',
                }
            }
        },
    },
    plugins: [],
}
