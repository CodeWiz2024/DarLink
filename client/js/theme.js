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
    applyTheme(getTheme());
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', initAll);
    else 
        initAll();

    function initAll() {
        applyTheme(getTheme());
        injectMobileNav();
    }

    function injectMobileNav() {
        if(document.querySelector('.mobile-bottom-nav')) return;
        var nav = document.createElement('div');
        nav.className = 'mobile-bottom-nav';
        
        var isOwner = false;
        try {
            var u = JSON.parse(localStorage.getItem('user'));
            if(u && u.UserType === 'Owner') isOwner = true;
        } catch(e){}

        var path = window.location.pathname.toLowerCase();
        
        nav.innerHTML = `
            <a href="index.html" class="${path.includes('index')?'active':''}">
                <i class="fa-solid fa-house"></i> <span>Home</span>
            </a>
            <a href="index.html#sections" onclick="if(window.toggleFilter) { window.toggleFilter(); return false; }">
                <i class="fa-solid fa-magnifying-glass"></i> <span>Search</span>
            </a>
            <a href="${isOwner?'my-property.html':'my-bookings.html'}" class="${path.includes('my-')?'active':''}">
                <i class="fa-solid ${isOwner?'fa-list':'fa-calendar-check'}"></i> <span>${isOwner?'Properties':'Bookings'}</span>
            </a>
            <a href="profile.html" class="${path.includes('profile')?'active':''}">
                <i class="fa-solid fa-user"></i> <span>Profile</span>
            </a>
        `;
        document.body.appendChild(nav);
    }
})();
