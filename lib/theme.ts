export const THEME_STORAGE_KEY = 'theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

// Runs inline before hydration so the saved theme class is on <html> before first paint
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('${DARK_QUERY}').matches?'dark':'light'}document.documentElement.classList.add(t)}catch(e){}})()`;
