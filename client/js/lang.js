/* ترجمة الموقع - عربي / فرنسي */
const LANG_STORAGE = 'site_lang';

const T = {
    ar: {
        nav_logo: 'كراء المنازل',
        nav_home: 'الرئيسية',
        nav_login: 'تسجيل الدخول',
        nav_register: 'إنشاء حساب',
        nav_dashboard: 'لوحة التحكم',
        nav_logout: 'تسجيل الخروج',
        or: 'أو',
        lang_ar: 'عربي',
        lang_fr: 'FR',
        // index
        index_title: 'المنازل المتوفرة للكراء',
        index_subtitle: 'تصفح العروض واختر ما يناسبك. تسجيل الدخول مطلوب فقط عند الرغبة في حجز منزل.',
        index_loading: 'جاري التحميل...',
        index_empty: 'لا توجد منازل متوفرة حالياً. عود لاحقاً.',
        index_btn_detail: 'عرض التفاصيل',
        index_error: 'حدث خطأ في تحميل البيانات.',
        index_hello: 'مرحباً،',
        // login
        login_title: 'تسجيل الدخول',
        login_email: 'البريد الإلكتروني',
        login_password: 'كلمة المرور',
        login_renter: 'مستأجر',
        login_owner: 'مالك',
        login_btn: 'دخول',
        login_select_type: 'اختر نوع الحساب (مستأجر أو مالك)',
        // register
        register_title: 'إنشاء حساب',
        register_fullname: 'الاسم الكامل',
        register_email: 'البريد الإلكتروني',
        register_phone: 'رقم الهاتف',
        register_idcard: 'رقم بطاقة الهوية',
        register_password: 'كلمة المرور',
        register_password_placeholder: 'أدخل كلمة المرور',
        register_usertype: 'نوع الحساب',
        register_select_type: 'اختر نوع الحساب',
        register_renter: 'مستأجر',
        register_owner: 'مالك',
        register_btn: 'تسجيل',
        // rent dashboard
        rent_title: 'مرحباً،',
        rent_subtitle: 'ابحث عن منزل واحجز إقامتك. انقر على "عرض التفاصيل" ثم اختر التواريخ لتأكيد الحجز.',
        rent_loading: 'جاري التحميل...',
        rent_btn_detail: 'عرض التفاصيل والحجز',
        rent_error: 'تعذر تحميل العروض.',
        // add home
        addhome_title: 'مرحباً،',
        addhome_subtitle: 'أضف عقارك لعرضه للمستأجرين.',
        addhome_form_title: 'إضافة منزل جديد',
        addhome_title_label: 'عنوان العقار',
        addhome_title_ph: 'مثال: شقة 3 غرف قرب البحر',
        addhome_desc: 'الوصف',
        addhome_desc_ph: 'وصف قصير (اختياري)',
        addhome_address: 'العنوان',
        addhome_address_ph: 'الشارع والرقم',
        addhome_city: 'المدينة',
        addhome_wilaya: 'الولاية',
        addhome_wilaya_ph: 'مثال: الجزائر',
        addhome_type: 'نوع العقار',
        addhome_type_select: 'اختر النوع',
        addhome_apt: 'شقة',
        addhome_house: 'منزل',
        addhome_room: 'غرفة',
        addhome_cottage: 'جنينة',
        addhome_price: 'السعر لليلة (د.ج)',
        addhome_rooms: 'عدد الغرف',
        addhome_image: 'صورة العقار (اختياري)',
        addhome_btn: 'إضافة العقار',
        addhome_success: 'تمت إضافة العقار بنجاح. سيظهر في الصفحة الرئيسية.',
        // property detail
        property_loading: 'جاري التحميل...',
        property_book_title: 'حجز هذا المنزل',
        property_login_required: 'يجب تسجيل الدخول لحجز المنزل.',
        property_start_date: 'تاريخ البداية',
        property_end_date: 'تاريخ النهاية',
        property_phone: 'رقم الهاتف',
        property_btn_book: 'تأكيد الحجز',
        property_no_desc: 'لا يوجد وصف.',
        property_per_night: 'د.ج / ليلة',
        property_error_id: 'معرف العقار غير صحيح.',
        property_error_load: 'تعذر تحميل التفاصيل.',
        property_choose_dates: 'اختر تاريخ البداية والنهاية',
        property_booking_ok: 'تم تأكيد الحجز بنجاح.',
        property_booking_done: 'تم الحجز بنجاح.',
        property_booking_fail: 'فشل الحجز',
        property_error_generic: 'حدث خطأ. حاول لاحقاً.'
    },
    fr: {
        nav_logo: 'Location de maisons',
        nav_home: 'Accueil',
        nav_login: 'Connexion',
        nav_register: 'Créer un compte',
        nav_dashboard: 'Tableau de bord',
        nav_logout: 'Déconnexion',
        or: 'ou',
        lang_ar: 'عربي',
        lang_fr: 'FR',
        index_title: 'Maisons disponibles à la location',
        index_subtitle: 'Parcourez les offres et choisissez. La connexion est requise uniquement pour réserver.',
        index_loading: 'Chargement...',
        index_empty: 'Aucune maison disponible pour le moment.',
        index_btn_detail: 'Voir les détails',
        index_error: 'Erreur de chargement des données.',
        index_hello: 'Bonjour,',
        login_title: 'Connexion',
        login_email: 'E-mail',
        login_password: 'Mot de passe',
        login_renter: 'Locataire',
        login_owner: 'Propriétaire',
        login_btn: 'Connexion',
        login_select_type: 'Choisissez le type de compte',
        register_title: 'Créer un compte',
        register_fullname: 'Nom complet',
        register_email: 'E-mail',
        register_phone: 'Téléphone',
        register_idcard: 'N° carte d\'identité',
        register_password: 'Mot de passe',
        register_password_placeholder: 'Entrez le mot de passe',
        register_usertype: 'Type de compte',
        register_select_type: 'Choisir le type',
        register_renter: 'Locataire',
        register_owner: 'Propriétaire',
        register_btn: 'S\'inscrire',
        rent_title: 'Bonjour,',
        rent_subtitle: 'Recherchez et réservez. Cliquez sur "Voir les détails" puis choisissez les dates.',
        rent_loading: 'Chargement...',
        rent_btn_detail: 'Voir détails et réserver',
        rent_error: 'Impossible de charger les offres.',
        addhome_title: 'Bonjour,',
        addhome_subtitle: 'Ajoutez votre bien pour le proposer aux locataires.',
        addhome_form_title: 'Ajouter un bien',
        addhome_title_label: 'Titre du bien',
        addhome_title_ph: 'Ex: Appartement 3 pièces près de la mer',
        addhome_desc: 'Description',
        addhome_desc_ph: 'Courte description (optionnel)',
        addhome_address: 'Adresse',
        addhome_address_ph: 'Rue et numéro',
        addhome_city: 'Ville',
        addhome_wilaya: 'Wilaya',
        addhome_wilaya_ph: 'Ex: Alger',
        addhome_type: 'Type de bien',
        addhome_type_select: 'Choisir le type',
        addhome_apt: 'Appartement',
        addhome_house: 'Maison',
        addhome_room: 'Chambre',
        addhome_cottage: 'Chalet',
        addhome_price: 'Prix par nuit (DA)',
        addhome_rooms: 'Nombre de chambres',
        addhome_image: 'Image du bien (optionnel)',
        addhome_btn: 'Ajouter le bien',
        addhome_success: 'Bien ajouté avec succès. Il apparaîtra sur la page d\'accueil.',
        property_loading: 'Chargement...',
        property_book_title: 'Réserver ce logement',
        property_login_required: 'Connectez-vous pour réserver.',
        property_start_date: 'Date d\'arrivée',
        property_end_date: 'Date de départ',
        property_phone: 'Téléphone',
        property_btn_book: 'Confirmer la réservation',
        property_no_desc: 'Aucune description.',
        property_per_night: ' DA / nuit',
        property_error_id: 'Identifiant du bien invalide.',
        property_error_load: 'Impossible de charger les détails.',
        property_choose_dates: 'Choisissez les dates d\'arrivée et de départ',
        property_booking_ok: 'Réservation confirmée.',
        property_booking_done: 'Réservation effectuée.',
        property_booking_fail: 'Échec de la réservation',
        property_error_generic: 'Une erreur s\'est produite.'
    }
};

function getLang() {
    return localStorage.getItem(LANG_STORAGE) || 'ar';
}

function setLang(lang) {
    localStorage.setItem(LANG_STORAGE, lang);
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'ar';
    document.documentElement.dir = lang === 'fr' ? 'ltr' : 'rtl';
    document.documentElement.setAttribute('data-lang', lang);
    applyLang();
}

function t(key) {
    const lang = getLang();
    return (T[lang] && T[lang][key]) || T.ar[key] || key;
}

function applyLang() {
    const lang = getLang();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = (T[lang] && T[lang][key]) || T.ar[key];
        if (text) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder !== undefined) el.placeholder = text;
            } else {
                el.textContent = text;
            }
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = (T[lang] && T[lang][key]) || T.ar[key];
        if (text) el.placeholder = text;
    });
    // Update lang buttons active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    if (typeof onLangChange === 'function') onLangChange();
}

document.addEventListener('DOMContentLoaded', function() {
    const lang = getLang();
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'ar';
    document.documentElement.dir = lang === 'fr' ? 'ltr' : 'rtl';
    document.documentElement.setAttribute('data-lang', lang);
    applyLang();
});
