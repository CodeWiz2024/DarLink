$files = Get-ChildItem -Path "c:\xampp\htdocs\PFE.2.0.0.0\client\*.html"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # 1. Replace Logo
    $content = $content -replace '<img src="img/darlink-logo.jpg"', '<img src="img/professional_logo.png"'
    
    # 2. Inject I18N script before lang.js
    $content = $content -replace '<script src="lang.js"></script>', '<script src="js/i18n-dashboard.js"></script>`n    <script src="lang.js"></script>'
    
    # 3. Sidebar data-i18n injections
    $content = $content -replace '<div class="side-nav-section-label">Management</div>', '<div class="side-nav-section-label" data-i18n="nav-management">Management</div>'
    $content = $content -replace '<div class="side-nav-section-label".*?>Account</div>', '<div class="side-nav-section-label" style="margin-top: 8px;" data-i18n="nav-account">Account</div>'
    
    $content = $content -replace 'Add New Property</a>', '<span data-i18n="link-add-property">Add New Property</span></a>'
    $content = $content -replace 'My Properties</a>', '<span data-i18n="link-my-properties">My Properties</span></a>'
    $content = $content -replace 'Bookings</a>', '<span data-i18n="link-bookings">Bookings</span></a>'
    $content = $content -replace 'Statistics</a>', '<span data-i18n="link-statistics">Statistics</span></a>'
    $content = $content -replace 'Back to Home</a>', '<span data-i18n="link-home">Back to Home</span></a>'
    $content = $content -replace 'Profile Settings</a>', '<span data-i18n="link-profile">Profile Settings</span></a>'
    $content = $content -replace 'Dashboard</a>', '<span data-i18n="link-dashboard">Dashboard</span></a>'
    
    $content = $content -replace '<span id="themeLabel">Dark Mode</span>', '<span id="themeLabel" data-i18n="theme-dark">Dark Mode</span>'
    $content = $content -replace 'Log Out</button>', '<span data-i18n="link-logout">Log Out</span></button>'
    
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}
