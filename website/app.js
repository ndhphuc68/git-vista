// GitVista Landing Page Interaction Scripts
(function (window, document, navigator, localStorage) {
  const STORAGE_KEY = 'gitvista_lang';

  // SVG Icons for platforms
  const ICONS = {
    windows: '<path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4h-13.051M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>',
    mac: '<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.91.04-2.02.61-2.67 1.38-.58.67-1.09 1.77-.95 2.82 1.02.08 2.05-.5 2.68-1.27z"/>',
    linux: '<path d="M12.003 2c-3.15 0-5.71 2.56-5.71 5.71 0 1.25.4 2.41 1.08 3.35C5.073 12.18 3.5 14.54 3.5 17.29c0 2.6 2.09 4.71 4.69 4.71h7.62c2.6 0 4.69-2.11 4.69-4.71 0-2.75-1.57-5.11-3.87-6.23.68-.94 1.08-2.1 1.08-3.35 0-3.15-2.56-5.71-5.71-5.71z"/>'
  };

  const DOWNLOAD_URLS = {
    windows: 'https://github.com/ndhphuc68/git-vista-/releases/latest/download/GitVista_0.1.0_x64-setup.exe',
    mac: 'https://github.com/ndhphuc68/git-vista-/releases/latest/download/GitVista_0.1.0_universal.dmg',
    linux: 'https://github.com/ndhphuc68/git-vista-/releases/latest/download/gitvista_0.1.0_amd64.deb'
  };

  let currentLang = 'en';
  let currentPlatform = 'windows';

  // 1. Detect Operating System
  function detectPlatform(uaString) {
    const ua = (uaString || (navigator && navigator.userAgent) || '').toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac') || ua.includes('darwin') || ua.includes('ipad') || ua.includes('iphone')) return 'mac';
    if (ua.includes('linux') || ua.includes('x11')) return 'linux';
    return 'windows';
  }

  // 2. Apply translations to all data-i18n nodes
  function setLanguage(lang) {
    currentLang = (lang === 'vi') ? 'vi' : 'en';
    if (localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, currentLang);
      } catch (e) {
        // LocalStorage disabled or unavailable
      }
    }

    const dict = (window.I18N_DATA && window.I18N_DATA[currentLang]) || {};

    // Update document lang
    if (document.documentElement) {
      document.documentElement.setAttribute('lang', currentLang);
    }

    // Update all text nodes with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update language toggle button label and flag
    const flagEl = document.getElementById('lang-flag');
    const labelEl = document.getElementById('lang-label');
    if (flagEl && labelEl) {
      if (currentLang === 'vi') {
        flagEl.textContent = '🇻🇳';
        labelEl.textContent = 'VI';
      } else {
        flagEl.textContent = '🇬🇧';
        labelEl.textContent = 'EN';
      }
    }

    // Re-apply platform button text in new language
    updatePrimaryDownloadButton();
  }

  // 3. Update Primary CTA Button based on detected OS
  function updatePrimaryDownloadButton() {
    const btn = document.getElementById('download-primary-btn');
    const textEl = document.getElementById('download-primary-text');
    const iconEl = document.getElementById('primary-os-icon');

    if (!btn || !textEl || !iconEl) return;

    btn.href = DOWNLOAD_URLS[currentPlatform] || DOWNLOAD_URLS.windows;
    iconEl.innerHTML = ICONS[currentPlatform] || ICONS.windows;

    const dict = (window.I18N_DATA && window.I18N_DATA[currentLang]) || {};

    if (currentPlatform === 'mac') {
      textEl.textContent = (currentLang === 'vi') ? 'Tải về cho macOS (.dmg)' : 'Download for macOS (.dmg)';
    } else if (currentPlatform === 'linux') {
      textEl.textContent = (currentLang === 'vi') ? 'Tải về cho Linux (.deb)' : 'Download for Linux (.deb)';
    } else {
      textEl.textContent = dict['hero.download_primary'] || 'Download for Windows';
    }
  }

  // 4. Initialize on DOM Load
  function init() {
    currentPlatform = detectPlatform();

    // Determine initial language: localStorage -> browser language -> en
    let savedLang = 'en';
    if (localStorage) {
      try {
        savedLang = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
    }

    if (!savedLang && navigator && navigator.language && navigator.language.startsWith('vi')) {
      savedLang = 'vi';
    }

    setLanguage(savedLang || 'en');
    updatePrimaryDownloadButton();

    // Attach toggle handler
    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        const nextLang = (currentLang === 'en') ? 'vi' : 'en';
        setLanguage(nextLang);
      });
    }
  }

  if (document && document.addEventListener) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Expose API for testing
  window.GitVistaWeb = {
    detectPlatform: detectPlatform,
    setLanguage: setLanguage,
    updatePrimaryDownloadButton: updatePrimaryDownloadButton,
    getLanguage: function () { return currentLang; },
    getPlatform: function () { return currentPlatform; }
  };

})(
  typeof window !== 'undefined' ? window : this,
  typeof document !== 'undefined' ? document : {},
  typeof navigator !== 'undefined' ? navigator : {},
  typeof localStorage !== 'undefined' ? localStorage : null
);
