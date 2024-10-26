// stores/useThemeStore.js
import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
    state: () => ({
        isDarkMode: localStorage.getItem('darkMode') === 'true' // Get the saved state from localStorage
    }),
    actions: {
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode;
            localStorage.setItem('darkMode', this.isDarkMode); // Save the state in localStorage
        },
        setDarkMode(value) {
            this.isDarkMode = value;
            localStorage.setItem('darkMode', value); // Save the state in localStorage
        }
    }
});
