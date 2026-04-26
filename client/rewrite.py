import codecs
import re

file_path = r'c:\xampp\htdocs\v pfe\DarLink-main\client\index.html'
with codecs.open(file_path, 'r', 'utf-8') as f:
    text = f.read()

# 1. Replace Style
text = re.sub(r'<style>.*?</style>', r'<link rel="stylesheet" href="index-premium.css">\n    <style>\n        /* Minimal inline for footer and remaining elements */\n        .site-footer{padding:40px 4%;background:var(--card-bg);border-top:1px solid var(--glass-border);;margin-top:0;} .footer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:30px;} .footer-section h3{font-family:var(--font-display);font-size:1.1rem;margin-bottom:15px;color:var(--text);} .footer-links{list-style:none;} .footer-links li{margin-bottom:10px;color:var(--muted);display:flex;align-items:center;gap:8px;} .footer-links a{color:var(--muted);text-decoration:none;transition:.3s;} .footer-links a:hover{color:var(--primary);} .social-links{display:flex;gap:12px;} .social-links a{width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.05);display:flex;align-items:center;justify-content:center;color:var(--text);transition:.3s;} .social-links a:hover{background:var(--primary);color:#fff;transform:translateY(-2px);} [data-theme="dark"] .social-links a{background:rgba(255,255,255,.05);}\n        /* Modal Overlay */ .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:1000;display:none;backdrop-filter:blur(5px);} .profile-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.9);background:var(--bg);padding:30px;border-radius:24px;z-index:1001;display:none;opacity:0;transition:all .3s;} .profile-modal.show{display:block;opacity:1;transform:translate(-50%,-50%) scale(1);} .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;} .modal-header h2{font-family:var(--font-display);font-size:1.3rem;} .modal-close{cursor:pointer;font-size:1.2rem;color:var(--muted);} .profile-pic-editor{position:relative;width:120px;height:120px;margin:0 auto 20px;} .big-avatar{width:100%;height:100%;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:3rem;font-weight:700;} .upload-btn-label{position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);background:var(--primary);color:#fff;padding:6px 12px;border-radius:20px;font-size:.75rem;font-weight:600;cursor:pointer;white-space:nowrap;} .modal-footer{display:flex;gap:10px;margin-top:20px;} .modal-footer a, .modal-footer button{flex:1;padding:10px;border-radius:12px;border:none;font-weight:600;cursor:pointer;text-align:center;} .modal-footer a{background:var(--primary-light);color:var(--primary);} .modal-footer button{background:var(--text);color:var(--bg);}\n        /* Sidebar */ .msg-toggle-btn{position:fixed;bottom:30px;right:30px;width:60px;height:60px;border-radius:50%;background:var(--primary);color:#fff;font-size:1.4rem;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;box-shadow:0 10px 30px rgba(94,93,240,.4);z-index:900;transition:.3s;} .msg-toggle-btn:hover{transform:scale(1.1);} .msg-badge{position:absolute;top:-5px;right:-5px;background:var(--accent);color:#fff;font-size:.7rem;font-weight:800;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;} .msg-sidebar{position:fixed;top:0;right:-400px;width:400px;height:100vh;background:var(--glass);backdrop-filter:blur(30px);border-left:1px solid var(--glass-border);z-index:1000;transition:.4s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.05);} .msg-sidebar.open{right:0;} .msg-view{flex:1;display:flex;flex-direction:column;} .msg-sidebar-header{padding:20px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;} .msg-list{flex:1;overflow-y:auto;padding:10px;} .conv-item{padding:12px;border-radius:12px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:.2s;} .conv-item:hover{background:var(--primary-light);} .conv-avatar{width:45px;height:45px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;} .conv-avatar-img{width:100%;height:100%;border-radius:50%;object-fit:cover;} .conv-info{flex:1;} .conv-name{display:block;font-weight:700;font-size:.95rem;} .conv-property{display:block;font-size:.8rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;} .conv-unread{background:var(--accent);color:#fff;font-size:.7rem;font-weight:800;padding:2px 6px;border-radius:10px;} .chat-header-user{display:flex;align-items:center;gap:10px;flex:1;} .chat-user-avatar{width:40px;height:40px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;} .chat-user-name{display:block;font-weight:700;font-size:.95rem;} .chat-user-rating{font-size:.75rem;color:var(--gold);} .back-to-list{cursor:pointer;padding:10px;margin-right:10px;border-radius:50%;background:var(--primary-light);color:var(--primary);} .chat-messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:10px;} .msg-bubble{max-width:75%;padding:10px 14px;border-radius:16px;font-size:.9rem;line-height:1.4;position:relative;} .msg-sent{align-self:flex-end;background:var(--primary);color:#fff;border-bottom-right-radius:4px;} .msg-received{align-self:flex-start;background:#fff;color:var(--text);border-bottom-left-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,.05);} .msg-time{display:block;font-size:.65rem;opacity:.7;margin-top:4px;text-align:right;} .chat-input-area{padding:15px;border-top:1px solid var(--glass-border);display:flex;gap:10px;} .chat-input{flex:1;padding:12px 16px;border-radius:20px;border:1px solid var(--glass-border);background:var(--card-bg);color:var(--text);font-family:var(--font-body);outline:none;transition:.2s;} .chat-input:focus{border-color:var(--primary);} .chat-send-btn{width:45px;height:45px;border-radius:50%;background:var(--primary);color:#fff;border:none;cursor:pointer;transition:.2s;} .chat-send-btn:hover{transform:scale(1.05);}\n    </style>', text, flags=re.DOTALL)

# HTML body blocks replacement
html_new = r"""<!-- NAVBAR -->
<nav class="navbar">
    <a class="darlink-logo blue small" href="index.html" style="display:flex; flex-direction:row; align-items:center; gap:8px; text-decoration:none;">
        <svg width="36" height="32" viewBox="0 0 110 100" fill="none">
            <path d="M55 8 L98 42 L98 92 L12 92 L12 42 Z" fill="none" stroke="#00d4ff" stroke-width="6" stroke-linejoin="round"/>
            <rect x="72" y="10" width="10" height="18" fill="none" stroke="#00d4ff" stroke-width="5.5"/>
            <path d="M55 22 L88 50 L88 88 L22 88 L22 50 Z" fill="none" stroke="#5aa8c0" stroke-width="5" stroke-linejoin="round"/>
            <path d="M32 88 L32 52 Q32 30 52 30 Q72 30 72 52 Q72 68 58 72 Q44 76 32 72" fill="none" stroke="#5aa8c0" stroke-width="5.5" stroke-linecap="round"/>
            <line x1="32" y1="88" x2="75" y2="88" stroke="#5aa8c0" stroke-width="5.5" stroke-linecap="round"/>
        </svg>
        <span style="color:#00d4ff; font-size:22px; font-weight:700;">DarLink</span>
    </a>
    <button class="nav-hamburger" id="navHamburger" onclick="toggleMobileNav()" aria-label="Menu">
        <span></span><span></span><span></span>
    </button>
    <div class="links" id="navLinks">
        <button class="mobile-close-btn" onclick="closeMobileNav()"><i class="fa-solid fa-times"></i></button>
        <button class="theme-btn" onclick="toggleTheme()" aria-label="Theme">
            <i class="fa-solid fa-moon" id="themeIcon"></i>
        </button>
        <a href="index.html" data-i18n="nav_home" onclick="closeMobileNav()"><i class="fa-solid fa-house"></i> Home</a>
        <a href="login.html" id="loginLink" data-i18n="nav_login" onclick="closeMobileNav()"><i class="fa-solid fa-right-to-bracket"></i> Login</a>
        <a href="Register.html" id="registerLink" class="primary" data-i18n="nav_register" onclick="closeMobileNav()"><i class="fa-solid fa-bolt"></i> Get Started</a>
        <div class="lang-switch">
            <button class="lang-btn" data-lang="en">EN</button>
            <button class="lang-btn" data-lang="ar">عربي</button>
        </div>
        <span id="userGreeting"></span>
    </div>
</nav>

<!-- HERO -->
<section class="hero">
    <div class="hero-inner">
        <h1 data-i18n="hero_title">Discover Your Perfect Gateway</h1>
        <p data-i18n="hero_subtitle">Algeria's most exquisite vacation rental platform. Stunning stays, instant booking, absolute trust.</p>
        
        <div class="hero-search-bar">
            <div class="hero-search-group">
                <label data-i18n="filter_wilaya">Destination</label>
                <select id="filterCity"><option value="" data-i18n="filter_all_wilayas">Anywhere</option></select>
            </div>
            <div class="hero-search-group">
                <label data-i18n="filter_type">Property Type</label>
                <select id="filterType">
                    <option value="" data-i18n="filter_all_types">All Spaces</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Room">Room</option>
                    <option value="Cottage">Cottage</option>
                </select>
            </div>
            <div class="hero-search-group">
                <label data-i18n="filter_rooms">Bedrooms</label>
                <select id="filterRooms">
                    <option value="">Any Size</option>
                    <option value="1">1 Room</option>
                    <option value="2">2 Rooms</option>
                    <option value="3">3+ Rooms</option>
                </select>
            </div>
            <div class="hero-search-group" style="display:none;">
                <input type="range" id="filterPrice" min="1000" max="50000" step="500" value="50000">
                <span id="priceOut">50000</span>
            </div>
            <button class="hero-search-btn" onclick="applyFilters()"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
    </div>
</section>

<!-- DASHBOARD QUICK BAR -->
<div class="quick-bar" id="dashQuickBar">
    <span class="quick-bar-title" data-i18n="dash_title">✨ Your Dashboard</span>
    <div class="quick-bar-actions" id="dashButtons"></div>
</div>

<!-- MAIN BODY -->
<div class="page-body" id="sections">
    <div class="content-area" id="contentArea" style="flex:1;">
        <div id="loadingState" style="text-align:center;padding:60px;color:var(--muted);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);display:block;margin-bottom:12px;"></i>
            Loading properties...
        </div>
    </div>
</div>
"""
text = re.sub(r'<!-- NAVBAR -->.*?<!-- FOOTER -->', html_new + '\n<!-- FOOTER -->', text, flags=re.DOTALL)

js_card = r"""function buildCard(p){
    const isOwner = currentUser && currentUser.UserType==='Owner' && currentUser.UserId===p.OwnerId;
    const isMine = isOwner;
    const imgUrl = p.MainImage ? (p.MainImage.startsWith('http') ? p.MainImage : SERVER_URL+p.MainImage) : null;
    const {display, original, label} = calcDisplayPrice(p);

    let labelHtml = '';
    const topLabels = [];
    if(p.IsFeatured) topLabels.push(`<span class="card-label label-featured"><i class="fa-solid fa-crown"></i> Premium</span>`);
    if(p.IsBoosted && !p.IsFeatured) topLabels.push(`<span class="card-label label-boosted"><i class="fa-solid fa-bolt"></i> Boosted</span>`);
    if(p.HasPromotion && label) topLabels.push(`<span class="card-label label-promo"><i class="fa-solid fa-percent"></i> ${label}</span>`);
    
    labelHtml = `<div class="card-labels"><div style="display:flex;gap:6px;flex-wrap:wrap">` + topLabels.join('') + `</div>`;
    if(isMine) labelHtml += `<span class="card-label" style="background:var(--text);color:var(--bg)"><i class="fa-solid fa-house-user"></i> Mine</span>`;
    labelHtml += `</div>`;

    const priceHtml = original
        ? `${Math.round(display).toLocaleString()} <span class="old-price">${Math.round(original).toLocaleString()}</span>`
        : Math.round(display).toLocaleString();

    const actionBtn = isMine
        ? `<button class="btn-manage-card" onclick="window.location.href='edit-property.html?id=${p.PropertyId}'"><i class="fa-solid fa-pen"></i> Edit Space</button>`
        : `<button class="btn-chat-card" onclick="openChat(event,${p.PropertyId},${p.OwnerId},'${(p.OwnerName||'Owner').replace(/\'/g,"\\'")}')"><i class="fa-solid fa-comment-dots"></i></button>`;

    return `
    <div class="prop-card" onclick="viewProperty(${p.PropertyId},${p.OwnerId})">
        <div class="prop-card-img">
            ${labelHtml}
            <div class="card-like-btn" onclick="event.stopPropagation();"><i class="fa-solid fa-heart"></i></div>
            ${imgUrl
                ? `<img src="${imgUrl}" alt="${p.Title}" loading="lazy">`
                : `<div class="prop-card-img-placeholder"><i class="fa-solid fa-image"></i></div>`}
        </div>
        <div class="prop-card-body">
            <div class="prop-card-title">${p.Title}</div>
            <div class="prop-card-loc"><i class="fa-solid fa-location-dot" style="color:var(--primary)"></i> ${p.City}, ${p.Wilaya}</div>
            <div class="prop-card-meta">
                <span><i class="fa-solid fa-bed"></i> ${p.NumofRooms}</span>
                <span><i class="fa-solid fa-building"></i> ${p.PropertyType}</span>
                ${p.AverageRating>0 ? `<span style="color:var(--gold)"><i class="fa-solid fa-star"></i> ${Number(p.AverageRating).toFixed(1)}</span>` : ''}
            </div>
            <div class="prop-card-price-row">
                <div class="prop-card-price">${priceHtml} <span class="unit">DZD / night</span></div>
            </div>
            <div class="prop-card-actions" onclick="event.stopPropagation()">
                <button class="btn-view-card" onclick="viewProperty(${p.PropertyId},${p.OwnerId})"><i class="fa-solid fa-arrow-right"></i> Details</button>
                ${actionBtn}
            </div>
        </div>
    </div>`;
}

function buildSection(id, icon, title, badgeCount, badgeColor, cards){
    return `
    <div class="section-block">
        <div class="section-header">
            <div class="section-label">
                <span style="font-size:1.6rem; transform:translateY(-2px); display:inline-block">${icon}</span> ${title}
                <span class="badge" style="background:${badgeColor};color:#fff">${badgeCount}</span>
            </div>
        </div>
        <div class="carousel-wrap">
            <button class="carousel-btn prev" disabled><i class="fa-solid fa-arrow-left"></i></button>
            <div class="carousel-track-outer">
                <div class="carousel-track" id="${id}-track">
                    ${cards.map(buildCard).join('')}
                </div>
            </div>
            <button class="carousel-btn next" ${cards.length<=1?'disabled':''}><i class="fa-solid fa-arrow-right"></i></button>
        </div>
    </div>`;
}
"""

start1 = text.find('function buildCard(p){')
if start1 != -1:
    end1 = text.find('/* ═══════════════════════ LOAD PROPERTIES ═══════════════════════ */', start1)
    if end1 != -1:
        text = text[:start1] + js_card + '\n\n' + text[end1:]

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(text)

print("Rewrote index.html successfully.")
