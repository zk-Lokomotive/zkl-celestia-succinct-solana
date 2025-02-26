import { writable } from 'svelte/store';

// Get initial theme from localStorage if available
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme === 'dark';
};

function createThemeStore() {
  const { subscribe, set, update } = writable({
    isDark: getInitialTheme()
  });

  // Apply initial theme
  if (getInitialTheme()) {
    applyDarkTheme();
  } else {
    applyLightTheme();
  }

  function applyDarkTheme() {
    document.documentElement.style.setProperty('--main-bg-color', '#000000');
    document.documentElement.style.setProperty('--text-color', '#feffaf');
    document.documentElement.style.setProperty('--border-color', 'rgba(254, 255, 175, 0.3)');
    document.documentElement.style.setProperty('--hover-bg-color', 'rgba(254, 255, 175, 0.1)');
    document.documentElement.style.setProperty('--font-family', "'Space Grotesk', sans-serif");
    document.documentElement.style.setProperty('--font-stretch', 'expanded');
    document.documentElement.style.setProperty('--letter-spacing', '0.05em');
  }

  function applyLightTheme() {
    document.documentElement.style.setProperty('--main-bg-color', '#feffaf');
    document.documentElement.style.setProperty('--text-color', '#000000');
    document.documentElement.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.3)');
    document.documentElement.style.setProperty('--hover-bg-color', 'rgba(0, 0, 0, 0.05)');
    document.documentElement.style.setProperty('--font-family', "'Space Grotesk', sans-serif");
    document.documentElement.style.setProperty('--font-stretch', 'expanded');
    document.documentElement.style.setProperty('--letter-spacing', '0.05em');
  }

  return {
    subscribe,
    toggleDarkMode: () => update(store => {
      const isDark = !store.isDark;
      
      // Save theme preference
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Apply theme
      if (isDark) {
        applyDarkTheme();
      } else {
        applyLightTheme();
      }
      
      return { isDark };
    }),
    setDarkMode: (isDark) => {
      // Save theme preference
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Apply theme
      if (isDark) {
        applyDarkTheme();
      } else {
        applyLightTheme();
      }
      
      set({ isDark });
    }
  };
}

export const themeStore = createThemeStore();