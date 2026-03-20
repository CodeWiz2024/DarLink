// Dashboard Arabic Translations
window.I18N_MESSAGES = window.I18N_MESSAGES || {};

const dashboardTranslations = {
    // Topbar & Generic
    "dash-title-stats": { en: "Statistics", ar: "الإحصائيات" },
    "dash-subtitle-stats": { en: "Overview of your properties performance", ar: "نظرة عامة على أداء عقاراتك" },
    
    // Sidebar Labels
    "nav-management": { en: "Management", ar: "الإدارة" },
    "nav-account": { en: "Account", ar: "الحساب" },
    
    // Sidebar Links
    "link-add-property": { en: "Add New Property", ar: "إضافة عقار جديد" },
    "link-my-properties": { en: "My Properties", ar: "عقاراتي" },
    "link-bookings": { en: "Bookings", ar: "الحجوزات" },
    "link-statistics": { en: "Statistics", ar: "الإحصائيات" },
    "link-home": { en: "Back to Home", ar: "العودة للرئيسية" },
    "link-profile": { en: "Profile Settings", ar: "إعدادات الحساب" },
    "link-dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
    "link-logout": { en: "Log Out", ar: "تسجيل الخروج" },
    "theme-dark": { en: "Dark Mode", ar: "الوضع الداكن" },
    "theme-light": { en: "Light Mode", ar: "الوضع المضيء" },
    
    // Statistics Page Stats
    "stat-total-props": { en: "Total Properties", ar: "إجمالي العقارات" },
    "stat-active-props": { en: "Active", ar: "نشط" },
    "stat-inactive-props": { en: "Inactive", ar: "غير نشط" },
    "stat-total-bookings": { en: "Total Bookings", ar: "إجمالي الحجوزات" },
    "stat-props-type": { en: "Properties by Type", ar: "العقارات حسب النوع" },
    "stat-no-props": { en: "No properties yet", ar: "لا توجد عقارات بعد" },
    
    // My Properties Page
    "my-props-title": { en: "My Properties", ar: "عقاراتي" },
    "my-props-desc": { en: "Manage your vacation rental properties", ar: "إدارة عقارات الإيجار الخاصة بك" },
    "btn-add-new": { en: "Add New", ar: "إضافة جديد" },
    "loading-props": { en: "Loading your properties...", ar: "جاري تحميل عقاراتك..." },
    "no-props-yet": { en: "No Properties Yet", ar: "لا توجد عقارات حتى الآن" },
    "start-adding-prop": { en: "Start by adding your first property!", ar: "ابدأ بإضافة عقارك الأول!" },
    "action-activate": { en: "Activate", ar: "تفعيل" },
    "action-deactivate": { en: "Deactivate", ar: "إيقاف" },
    "action-edit": { en: "Edit", ar: "تعديل" },
    "action-packages": { en: "Packages", ar: "الباقات" },
    "action-messages": { en: "Messages", ar: "الرسائل" },
    "action-delete": { en: "Delete", ar: "حذف" },
    
    // Bookings Page
    "my-bk-title": { en: "My Bookings", ar: "حجوزاتي" },
    "my-bk-desc": { en: "Manage and review your renters", ar: "إدارة ومراجعة المستأجرين" },
    "loading-bk": { en: "Loading bookings...", ar: "جاري تحميل الحجوزات..." },
    "no-bk-yet": { en: "No Bookings Yet", ar: "لا توجد حجوزات حتى الآن" },
    "when-renters-bk": { en: "When renters book your properties, they'll appear here.", ar: "عندما يقوم المستأجرون بحجز عقاراتك، ستظهر هنا." },
    "bk-checkin": { en: "Check-in", ar: "تسجيل الدخول" },
    "bk-checkout": { en: "Check-out", ar: "تسجيل الخروج" },
    "bk-nights": { en: "Nights", ar: "الليالي" },
    "bk-total-price": { en: "Total Price", ar: "السعر الإجمالي" },
    "bk-view-profile": { en: "View Profile", ar: "عرض الملف الشخصي" },
    "bk-review": { en: "Review", ar: "تقييم" },
    "bk-reviewed": { en: "Reviewed", ar: "تم التقييم" },
    "review-renter-title": { en: "Review Renter", ar: "تقييم المستأجر" },
    "review-ph": { en: "Describe your experience with this renter...", ar: "صف تجربتك مع هذا المستأجر..." },
    "btn-cancel": { en: "Cancel", ar: "إلغاء" },
    "btn-submit-review": { en: "Submit Review", ar: "إرسال التقييم" }
};

// Merge into global I18N dictionary
Object.assign(window.I18N_MESSAGES, dashboardTranslations);
