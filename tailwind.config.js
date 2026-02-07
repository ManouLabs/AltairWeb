/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['selector', '[class*="app-dark"]'],
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    plugins: [require('tailwindcss-primeui')],
    important: true,
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        },
        extend: {
            fontFamily: {
                manrope: ['Manrope', 'sans-serif']
            },
            colors: {
                codly: {
                    purple: {
                        50: '#f5f3ff',
                        100: '#ede9fe',
                        200: '#ddd6fe',
                        300: '#c4b5fd',
                        400: '#a78bfa',
                        500: '#7D2AE8',
                        600: '#6d23cc',
                        700: '#5b1dab',
                        800: '#4a1789',
                        900: '#3b1268',
                        950: '#2e1065'
                    },
                    cyan: {
                        50: '#ecfeff',
                        100: '#cffafe',
                        200: '#a5f3fc',
                        300: '#67e8f9',
                        400: '#22d3ee',
                        500: '#00C4CC',
                        600: '#0891b2',
                        700: '#0e7490',
                        800: '#155e75',
                        900: '#164e63',
                        950: '#083344'
                    }
                }
            },
            boxShadow: {
                glow: '0 10px 20px #2e235e12',
                'codly-card': '0 4px 24px rgba(125, 42, 232, 0.08)',
                'codly-hover': '0 8px 32px rgba(125, 42, 232, 0.16)'
            }
        }
    }
};
