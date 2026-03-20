/* الوضع الداكن - Dark Mode */
(function() {
    var STORAGE = 'site_theme';
    function getTheme() {
        return localStorage.getItem(STORAGE) || 'light';
    }
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        var btn = document.querySelector('.theme-btn');
        var icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-regular fa-moon';
        }
        if (btn) {
            btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }
    window.getTheme = getTheme;
    window.setTheme = function(theme) {
        localStorage.setItem(STORAGE, theme);
        applyTheme(theme);
    };
    window.toggleTheme = function() {
        var next = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(next);
    };
    applyTheme(getTheme());
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', function() { applyTheme(getTheme()); });
})();
