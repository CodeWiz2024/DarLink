import re

file_path = r'c:\xampp\htdocs\v pfe\DarLink-main\client\property-detail.html'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# CSS replacement
css_old = r'/\*\s*Property Gallery\s*\*/.*?@media \(max-width:\s*900px\)\s*\{[^\}]*\.reviews-card\s*\{\s*order:\s*4;\s*\}[^\}]*\}'

css_new = r"""/* Property Gallery Carousel */
        .gallery-wrap {
            position: relative;
            margin-bottom: 30px;
            height: 500px;
            border-radius: var(--radius-lg);
            overflow: hidden;
            background: var(--glass-bg);
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        .gallery-grid {
            display: flex;
            height: 100%;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            -ms-overflow-style: none;
            scroll-behavior: smooth;
        }
        .gallery-grid::-webkit-scrollbar { display: none; }
        
        .gallery-img-item {
            flex: 0 0 100%;
            height: 100%;
            scroll-snap-align: center;
            position: relative;
        }
        .gallery-img-item img {
            width: 100%; height: 100%; object-fit: cover; pointer-events: none;
        }
        
        .gallery-arrow {
            position: absolute; top: 50%; transform: translateY(-50%);
            background: rgba(255,255,255,0.85); color: #000;
            border: none; width: 44px; height: 44px; border-radius: 50%;
            font-size: 1.2rem; cursor: pointer; z-index: 10;
            display: flex; justify-content: center; align-items: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: 0.3s;
            backdrop-filter: blur(5px);
        }
        .gallery-arrow:hover { background: #fff; transform: translateY(-50%) scale(1.1); color: var(--primary); }
        .gallery-prev { left: 20px; }
        .gallery-next { right: 20px; }
        [dir="rtl"] .gallery-prev { left: auto; right: 20px; }
        [dir="rtl"] .gallery-next { right: auto; left: 20px; }
        
        .gallery-indicators {
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 8px; z-index: 10;
        }
        .gallery-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor:pointer; transition:all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .gallery-dot.active { background: #fff; width: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }

        /* Content Layout */
        .property-layout {
            display: grid;
            grid-template-columns: 1.8fr 1.2fr;
            gap: 30px;
        }

        @media (max-width: 900px) {
            .property-layout { display: flex; flex-direction: column; }
            .gallery-wrap { height: 350px; border-radius: 20px; }
            .gallery-arrow { display: none; } /* Mobile users swipe natively */
            
            .main-info, .sidebar { display: contents; }
            .info-card { order: 1; margin-bottom: 20px; }
            .booking-card { order: 2; margin-top: 0; margin-bottom: 20px; position: static; }
            .features-card { order: 3; margin-bottom: 20px; }
            .reviews-card { order: 4; }
        }"""

text = re.sub(css_old, css_new, text, flags=re.DOTALL)

# JS Replacement
js_old = r"""    // Gallery
    const gallery = document\.getElementById\('gallery'\);
.*?gallery\.innerHTML = `<div class="img-placeholder"><i class="fa-solid fa-house"></i></div>`;
    \}"""

js_new = r"""    // Gallery Carousel
    const gallery = document.getElementById('gallery');
    if (property.Images && property.Images.length > 0) {
        const getFullImg = (url) => url.startsWith('http') ? url : `${SERVER_URL}${url}`;
        
        let sliderHtml = `<div class="gallery-wrap" id="gallery">`;
        if(property.Images.length > 1) {
            const leftIcon = window.I18N && window.I18N.getCurrentLang() === 'ar' ? 'right' : 'left';
            const rightIcon = window.I18N && window.I18N.getCurrentLang() === 'ar' ? 'left' : 'right';
            sliderHtml += `
            <button class="gallery-arrow gallery-prev" onclick="scrollGallery(-1)"><i class="fa-solid fa-chevron-${leftIcon}"></i></button>
            <button class="gallery-arrow gallery-next" onclick="scrollGallery(1)"><i class="fa-solid fa-chevron-${rightIcon}"></i></button>
            <div class="gallery-indicators">`;
            property.Images.forEach((_, i) => {
                sliderHtml += `<div class="gallery-dot ${i===0 ? 'active':''}" onclick="scrollToGallery(${i})"></div>`;
            });
            sliderHtml += `</div>`;
        }
        
        sliderHtml += `<div class="gallery-grid" id="galleryScroll">`;
        property.Images.forEach(img => {
            sliderHtml += `<div class="gallery-img-item"><img src="${getFullImg(img.ImageURL)}"></div>`;
        });
        sliderHtml += `</div></div>`;
        
        // Setup scroll logic safely attached to window
        window.scrollGallery = function(dir) {
            const scroller = document.getElementById('galleryScroll');
            if(!scroller) return;
            const cw = scroller.clientWidth;
            let current = Math.floor((scroller.scrollLeft + (cw/2) * (document.dir==='rtl'?-1:1)) / cw);
            current = Math.abs(current);
            let nextIndex = current + dir;
            if(nextIndex < 0) nextIndex = property.Images.length - 1;
            if(nextIndex >= property.Images.length) nextIndex = 0;
            scrollToGallery(nextIndex);
        };
        
        window.scrollToGallery = function(idx) {
            const scroller = document.getElementById('galleryScroll');
            if(!scroller || !scroller.children[idx]) return;
            scroller.children[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            
            document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
                dot.className = i === idx ? 'gallery-dot active' : 'gallery-dot';
            });
        };
        
        gallery.outerHTML = sliderHtml;
        
        // Update dots on manual native swipe scroll
        setTimeout(() => {
            const scroller = document.getElementById('galleryScroll');
            if(scroller) {
                scroller.addEventListener('scroll', () => {
                    const cw = scroller.clientWidth;
                    let current = Math.abs(Math.round(scroller.scrollLeft / cw));
                    document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
                        dot.className = i === current ? 'gallery-dot active' : 'gallery-dot';
                    });
                });
            }
        }, 300);

    } else {
        gallery.outerHTML = `<div class="img-placeholder" id="gallery" style="height:350px; margin-bottom:30px; border-radius:20px;"><i class="fa-solid fa-house"></i></div>`;
    }"""

text = re.sub(js_old, js_new, text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Gallery carousel modified successfully!")
