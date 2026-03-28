// ============================================================
//  DarLink — Admin Dashboard Logic  |  admin.js
// ============================================================

const API = 'https://darlink-production.up.railway.app/api'
// ── Helpers ──────────────────────────────────────────────────

function badge(status) {
    const map = {
        Active:'bg', Confirmed:'bg', Completed:'bb',
        Inactive:'bgr', Blocked:'br', Cancelled:'br',
        Owner:'bb', Renter:'bg', Pending:'bo', Suspended:'bo', Banned:'br',
    };
    return `<span class="badge ${map[status]||'bgr'}">${status}</span>`;
}
function initials(name='U'){ return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }
function fmtDate(d){ return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }
function stars(n){ n=Math.round(n); return '★'.repeat(n)+'☆'.repeat(5-n); }

function toast(msg, type='success'){
    const colors={success:'#27c96f', warn:'#f09d3a', error:'#f04f4f'};
    const el=document.createElement('div');
    el.className='toast';
    el.style.background=colors[type]||colors.success;
    el.textContent=msg;
    document.body.appendChild(el);
    setTimeout(()=>el.classList.add('toast-hide'),2800);
    setTimeout(()=>el.remove(),3200);
}

async function apiFetch(path, opts={}){
    const res=await fetch(API+path,{headers:{'Content-Type':'application/json'},...opts});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function setHTML(id,h){ const el=document.getElementById(id); if(el) el.innerHTML=h; }
function val(id){ const el=document.getElementById(id); return el?el.value.trim():''; }

// ── Navigation ───────────────────────────────────────────────

const panelTitles = {
    overview:   'Dashboard <span>/ Overview</span>',
    users:      'Users <span>/ Management</span>',
    properties: 'Properties <span>/ Management</span>',
    bookings:   'Bookings <span>/ Oversight</span>',
    reviews:    'Reviews <span>/ Moderation</span>',
    banned:     'Banned <span>/ Users</span>',
};

const panelLoaders = {
    overview: loadOverview, users: loadUsers,
    properties: loadProperties, bookings: loadBookings,
    reviews: loadReviews, banned: loadBanned,
};

function nav(name, btn){
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('panel-'+name).classList.add('active');
    btn.classList.add('active');
    const t=document.getElementById('topTitle');
    if(t) t.innerHTML=panelTitles[name]||name;
    if(panelLoaders[name]) panelLoaders[name]();
}

// ── Auth ─────────────────────────────────────────────────────

function initAuth(){
    const admin=JSON.parse(localStorage.getItem('admin')||'null');
    const name=admin?admin.Name:'Admin';
    setText('adminName', name);
    setText('adminInitials', initials(name));
}
function logout(){ localStorage.removeItem('admin'); window.location.href='login.html'; }

// ── Overview ─────────────────────────────────────────────────

async function loadOverview(){
    try{
        const [users,props]=await Promise.all([apiFetch('/users'), apiFetch('/properties')]);
        setText('stat-users', users.length);
        setText('stat-props', props.length);
        setText('stat-owners', users.filter(u=>u.UserType==='Owner').length);
        setText('stat-renters', users.filter(u=>u.UserType==='Renter').length);
    } catch{}
    try{
        const bookings=await apiFetch('/bookings');
        setText('stat-bookings', bookings.length);
        setHTML('overview-bookings-body', bookings.length===0
            ? `<tr class="empty"><td colspan="6">No bookings yet</td></tr>`
            : bookings.slice(0,8).map(b=>`
                <tr>
                    <td class="fw">#${b.BookingId}</td>
                    <td>${b.RenterName||'User #'+b.UserId}</td>
                    <td>${b.PropertyTitle||'Property #'+b.PropertyId}</td>
                    <td>${fmtDate(b.StartDate)} → ${fmtDate(b.EndDate)}</td>
                    <td class="fw">${Number(b.TotalPrice).toLocaleString()} DZD</td>
                    <td>${badge(b.BookingStatus)}</td>
                </tr>`).join(''));
    } catch {
        setHTML('overview-bookings-body',`<tr class="empty"><td colspan="6">Could not load bookings — is server running?</td></tr>`);
    }
}

// ── Users ────────────────────────────────────────────────────

let allUsers=[], userTypeFilter='all';

async function loadUsers(){
    try{
        allUsers=await apiFetch('/users');
        renderUsers();
    } catch {
        setHTML('users-body',`<tr class="empty"><td colspan="7">Could not load users</td></tr>`);
    }
}

function renderUsers(){
    const search=val('userSearch').toLowerCase();
    const list=allUsers.filter(u=>{
        const notBanned=(u.AccountStatus||'Active')!=='Banned';
        const tOk=userTypeFilter==='all'||u.UserType===userTypeFilter;
        const sOk=!search||u.FullName.toLowerCase().includes(search)||u.Email.toLowerCase().includes(search);
        return notBanned&&tOk&&sOk;
    });
    setHTML('users-body', list.length===0
        ? `<tr class="empty"><td colspan="7">No users found</td></tr>`
        : list.map(u=>`
            <tr>
                <td>
                    <div class="uc">
                        <div class="av">${initials(u.FullName)}</div>
                        <div>
                            <div class="un">${u.FullName}</div>
                            <div class="uid">#${u.UserId}</div>
                        </div>
                    </div>
                </td>
                <td>${u.Email}</td>
                <td>${u.PhoneNumber||'—'}</td>
                <td>${badge(u.UserType)}</td>
                <td>
                    ${u.IDCardFrontPath
                        ?`<img class="id-img" src="${API.replace('/api','')}${u.IDCardFrontPath}" alt="ID"
                            onclick="openIDModal('${u.FullName}','${API.replace('/api','')}${u.IDCardFrontPath}')">`
                        :`<span class="no-id">No image</span>`}
                </td>
                <td>${badge(u.AccountStatus||'Active')}</td>
                <td>
                    <div class="acts">
                        <button class="ab ab-g" onclick="verifyUser(${u.UserId})">Verify</button>
                        <button class="ab ab-o" onclick="suspendUser(${u.UserId})">Suspend</button>
                        <button class="ab ab-r" onclick="banUser(${u.UserId})">Ban</button>
                    </div>
                </td>
            </tr>`).join(''));
}

function filterUsers(){ renderUsers(); }

function filterUserType(type, btn){
    userTypeFilter=type;
    document.querySelectorAll('#panel-users .pill').forEach(p=>p.classList.remove('on'));
    btn.classList.add('on');
    renderUsers();
}

async function verifyUser(id){
    try{ await apiFetch(`/users/${id}/status`,{method:'PUT',body:JSON.stringify({status:'Active'})}); loadUsers(); loadNotifications(); }
    catch{}
    toast(`✅ User #${id} verified`);
}
async function suspendUser(id){
    try{ await apiFetch(`/users/${id}/status`,{method:'PUT',body:JSON.stringify({status:'Suspended'})}); loadUsers(); loadNotifications(); }
    catch{}
    toast(`⚠️ User #${id} suspended`,'warn');
}
async function banUser(id){
    if(!confirm(`Ban user #${id}?`)) return;
    try{ await apiFetch(`/users/${id}/status`,{method:'PUT',body:JSON.stringify({status:'Banned'})}); loadUsers(); loadBanned(); loadNotifications(); }
    catch{}
    toast(`🚫 User #${id} banned`,'error');
}

// ── ID Modal ─────────────────────────────────────────────────

function openIDModal(name, url){
    document.getElementById('modal-title').textContent=`${name} — ID Card`;
    document.getElementById('modal-img').src=url;
    document.getElementById('idModal').classList.add('on');
}
function closeModal(){ document.getElementById('idModal').classList.remove('on'); }

// ── Properties ───────────────────────────────────────────────

let allProps=[], propStatusFilter='all';

async function loadProperties(){
    try{ allProps=await apiFetch('/admin/properties'); renderProps(); }
    catch{ setHTML('props-body',`<tr class="empty"><td colspan="8">Could not load properties</td></tr>`); }
}

function renderProps(){
    const search=val('propSearch').toLowerCase();
    const list=allProps.filter(p=>{
        const sOk=propStatusFilter==='all'||p.AvailabilityStatus===propStatusFilter;
        const qOk=!search||p.Title.toLowerCase().includes(search)||p.City.toLowerCase().includes(search);
        return sOk&&qOk;
    });
    setHTML('props-body', list.length===0
        ? `<tr class="empty"><td colspan="8">No properties found</td></tr>`
        : list.map(p=>`
            <tr>
                <td class="fw">${p.Title}</td>
                <td>📍 ${p.City}, ${p.Wilaya}</td>
                <td>${p.PropertyType}</td>
                <td>${Number(p.PricePerNight).toLocaleString()} DZD</td>
                <td>${p.NumofRooms}</td>
                <td>${p.OwnerName||'—'}</td>
                <td>${badge(p.AvailabilityStatus)}</td>
                <td>
                    <div class="acts">
                        <button class="ab ab-g" onclick="setPropStatus(${p.PropertyId},'Active')">Activate</button>
                        <button class="ab ab-r" onclick="setPropStatus(${p.PropertyId},'Blocked')">Block</button>
                    </div>
                </td>
            </tr>`).join(''));
}

function filterProperties(){ renderProps(); }

function filterPropStatus(status, btn){
    propStatusFilter=status;
    document.querySelectorAll('#panel-properties .pill').forEach(p=>p.classList.remove('on'));
    btn.classList.add('on');
    renderProps();
}

async function setPropStatus(id,status){
    try{ await apiFetch(`/properties/${id}/status`,{method:'PUT',body:JSON.stringify({status})}); loadProperties(); loadNotifications(); }
    catch{}
    toast(`Property #${id} → ${status}`);
}

// ── Bookings ─────────────────────────────────────────────────

let allBookings=[], bookingStatusFilter='all';

async function loadBookings(){
    try{ allBookings=await apiFetch('/bookings'); renderBookings(); }
    catch{ setHTML('bookings-body',`<tr class="empty"><td colspan="9">Could not load bookings</td></tr>`); }
}

function renderBookings(){
    const search=val('bookingSearch').toLowerCase();
    const list=allBookings.filter(b=>{
        const sOk=bookingStatusFilter==='all'||b.BookingStatus===bookingStatusFilter;
        const qOk=!search||String(b.BookingId).includes(search)||(b.PropertyTitle||'').toLowerCase().includes(search);
        return sOk&&qOk;
    });
    setHTML('bookings-body', list.length===0
        ? `<tr class="empty"><td colspan="9">No bookings found</td></tr>`
        : list.map(b=>`
            <tr>
                <td class="fw">#${b.BookingId}</td>
                <td>${b.RenterName||'User #'+b.UserId}</td>
                <td>${b.PropertyTitle||'Property #'+b.PropertyId}</td>
                <td>${fmtDate(b.StartDate)}</td>
                <td>${fmtDate(b.EndDate)}</td>
                <td>${b.LengthOfStay}</td>
                <td class="fw">${Number(b.TotalPrice).toLocaleString()} DZD</td>
                <td>${badge(b.BookingStatus)}</td>
                <td>
                    <div class="acts">
                        <button class="ab ab-r" onclick="cancelBooking(${b.BookingId})">Cancel</button>
                    </div>
                </td>
            </tr>`).join(''));
}

function filterBookings(){ renderBookings(); }

function filterBookingStatus(status, btn){
    bookingStatusFilter=status;
    document.querySelectorAll('#panel-bookings .pill').forEach(p=>p.classList.remove('on'));
    btn.classList.add('on');
    renderBookings();
}

async function cancelBooking(id){
    if(!confirm(`Cancel booking #${id}?`)) return;
    try{ await apiFetch(`/bookings/${id}/cancel`,{method:'PUT'}); loadBookings(); loadNotifications(); }
    catch{}
    toast(`Booking #${id} cancelled`,'error');
}

// ── Reviews ──────────────────────────────────────────────────

const demoReviews=[
    {PropertyReviewId:1,ReviewerName:'Karim Boudali',Rating:5,Comment:'Amazing property, super clean and comfortable. Highly recommended!',ReviewDate:'2026-01-15',PropertyId:3},
    {PropertyReviewId:2,ReviewerName:'Sara Amiri',Rating:2,Comment:'Quite different from the photos. Owner was unresponsive to messages.',ReviewDate:'2026-01-20',PropertyId:7},
    {PropertyReviewId:3,ReviewerName:'Youcef Benali',Rating:4,Comment:'Great location, cozy atmosphere. Will definitely book again next summer.',ReviewDate:'2026-02-01',PropertyId:2},
];

async function loadReviews(){
    let list;
    try{ list=await apiFetch('/reviews'); }
    catch{ list=demoReviews; }
    renderReviews(list);
}

function renderReviews(list){
    const container=document.getElementById('reviews-list');
    if(!list.length){ container.innerHTML=`<div style="color:var(--t3);padding:44px;text-align:center">No reviews yet</div>`; return; }
    container.innerHTML=list.map(r=>`
        <div class="rv" id="rv-${r.PropertyReviewId}">
            <div class="av">${initials(r.ReviewerName||'U')}</div>
            <div class="rv-body">
                <div class="rv-top">
                    <span class="rv-name">${r.ReviewerName||'User #'+r.UserId}</span>
                    <span class="rv-stars">${stars(r.Rating)}</span>
                    <span class="rv-meta">${r.Rating}/5 · ${fmtDate(r.ReviewDate)} · Property #${r.PropertyId}</span>
                </div>
                <div class="rv-txt">${r.Comment||'—'}</div>
            </div>
            <button class="ab ab-r" onclick="removeReview(${r.PropertyReviewId})">Remove</button>
        </div>`).join('');
}

async function removeReview(id){
    if(!confirm('Remove this review?')) return;
    try{ await apiFetch(`/reviews/${id}`,{method:'DELETE'}); loadReviews(); loadNotifications(); }
    catch{ document.getElementById(`rv-${id}`)?.remove(); }
    toast('Review removed','error');
}



// ── Banned Users ──────────────────────────────────────────────

async function loadBanned(){
    try{
        const users = await apiFetch('/users');
        const banned = users.filter(u => (u.AccountStatus||'Active') === 'Banned');

        // Update badge count on sidebar
        const badgeEl = document.getElementById('banned-count');
        if(badgeEl){
            badgeEl.textContent = banned.length;
            badgeEl.style.display = banned.length > 0 ? 'inline-flex' : 'none';
        }

        setHTML('banned-body', banned.length === 0
            ? `<tr class="empty"><td colspan="5">No banned users</td></tr>`
            : banned.map(u=>`
                <tr>
                    <td>
                        <div class="uc">
                            <div class="av" style="background:linear-gradient(135deg,var(--red),#c0392b)">${initials(u.FullName)}</div>
                            <div>
                                <div class="un">${u.FullName}</div>
                                <div class="uid">#${u.UserId}</div>
                            </div>
                        </div>
                    </td>
                    <td>${u.Email}</td>
                    <td>${u.PhoneNumber||'—'}</td>
                    <td>${badge(u.UserType)}</td>
                    <td>
                        <div class="acts">
                            <button class="ab ab-g" onclick="unbanUser(${u.UserId})">Unban</button>
                        </div>
                    </td>
                </tr>`).join(''));
    } catch {
        setHTML('banned-body',`<tr class="empty"><td colspan="5">Could not load banned users</td></tr>`);
    }
}

async function unbanUser(id){
    if(!confirm(`Unban user #${id}? They will be restored to Active.`)) return;
    try{ await apiFetch(`/users/${id}/status`,{method:'PUT',body:JSON.stringify({status:'Active'})}); loadBanned(); loadUsers(); loadNotifications(); }
    catch{}
    toast(`✅ User #${id} unbanned`,'success');
}



// ── Notifications ─────────────────────────────────────────────

function currentPanel() {
    const active = document.querySelector('.panel.active');
    return active ? active.id.replace('panel-', '') : '';
}

const badgePanelMap = {
    'notif-users': 'users',
    'notif-properties': 'properties',
    'notif-bookings': 'bookings',
    'notif-reviews': 'reviews',
    'banned-count': 'banned'
};

function updateBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    // Don't show badge if user is already viewing that panel
    if (count > 0 && currentPanel() !== badgePanelMap[id]) {
        el.textContent = count;
        el.style.display = 'inline-flex';
    } else {
        el.style.display = 'none';
    }
}

async function loadNotifications() {
    try {
        // Users — count suspended users (need attention)
        const users = await apiFetch('/users');
        const suspendedCount = users.filter(u => (u.AccountStatus||'Active') === 'Suspended').length;
        updateBadge('notif-users', suspendedCount);
        // Banned users badge
        const bannedCount = users.filter(u => (u.AccountStatus||'Active') === 'Banned').length;
        updateBadge('banned-count', bannedCount);
    } catch {}

    try {
        // Properties — count blocked + inactive
        const props = await apiFetch('/admin/properties');
        const propCount = props.filter(p => p.AvailabilityStatus === 'Blocked' || p.AvailabilityStatus === 'Inactive').length;
        updateBadge('notif-properties', propCount);
    } catch {}

    try {
        // Bookings — count confirmed bookings
        const bookings = await apiFetch('/bookings');
        const bookingCount = bookings.filter(b => b.BookingStatus === 'Confirmed').length;
        updateBadge('notif-bookings', bookingCount);
    } catch {}

    try {
        // Reviews — only count reviews from last 7 days
        const reviews = await apiFetch('/reviews');
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newReviews = reviews.filter(r => new Date(r.ReviewDate) >= weekAgo).length;
        updateBadge('notif-reviews', newReviews);
    } catch {}
}

function refreshCurrentPanel(){
    const active = document.querySelector('.panel.active');
    if(!active) return;
    const name = active.id.replace('panel-','');
    if(panelLoaders[name]) panelLoaders[name]();
    toast('🔄 Refreshed','success');
}



document.addEventListener('DOMContentLoaded',()=>{
    initAuth();
    loadOverview();
    loadNotifications();
});