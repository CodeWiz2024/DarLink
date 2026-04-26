// Simple client-side i18n for EN / AR
// Usage:
// 1) On each page, define window.I18N_MESSAGES = { key: { en: '...', ar: '...' }, ... }
// 2) Add data-i18n="key" to elements whose textContent should change.
// 3) Add data-i18n-placeholder="key" for inputs whose placeholder should change.
// 4) Include this file once (e.g. before other scripts).

(function () {
  const STORAGE_KEY = 'site_lang';
  const DEFAULT_LANG = 'ar';

  function getCurrentLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'ar' || stored === 'en' ? stored : DEFAULT_LANG;
  }

  function setDirAndLang(lang) {
    const dir = 'rtl'; // Direction fixed to RTL as per user request
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }

  function applyTranslations(lang) {
    const dict = window.I18N_MESSAGES || {};

    // Elements whose inner text should change
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const entry = dict[key];
      if (entry && entry[lang]) {
        el.textContent = entry[lang];
      }
    });

    // Placeholders (inputs, textareas...)
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const entry = dict[key];
      if (entry && entry[lang]) {
        el.setAttribute('placeholder', entry[lang]);
      }
    });
  }

  function updateLangButtons(lang) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'ar') {
      lang = DEFAULT_LANG;
    }

    localStorage.setItem(STORAGE_KEY, lang);
    setDirAndLang(lang);
    applyTranslations(lang);
    updateLangButtons(lang);
  }

  function handleLangButtonClicks() {
    document.addEventListener('click', (event) => {
      const btn = event.target.closest('.lang-btn');
      if (!btn) return;
      const lang = btn.getAttribute('data-lang');
      if (!lang) return;
      setLanguage(lang);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const initialLang = getCurrentLang();
    setDirAndLang(initialLang);
    applyTranslations(initialLang);
    updateLangButtons(initialLang);
    handleLangButtonClicks();
  });

  // Expose a tiny API for page scripts
  window.I18N = {
    getCurrentLang,
    setLanguage,
    applyTranslations: () => applyTranslations(getCurrentLang())
  };
})();

