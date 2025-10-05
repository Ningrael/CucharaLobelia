// i18n.js
// Shared translation dictionary and helpers for switching between Spanish and English.
(function (global) {
  const translations = {
    es: {
      missions: 'Misiones Matched Play',
      about: 'Acerca de',
      missions_2v2: 'Misiones 2vs2',
      tutorials: 'Tutoriales',
      calendars: 'Calendarios',
      stl: 'STL de inter\u00e9s',
      settings: 'Configuraci\u00f3n',
      contact: 'Contacta y reporta bugs',
      about_title: 'Información de la versión',
      about_body: 'Versión actual: V1.0.3. Última actualización: 5/10/2025.',
      google: 'Sesi\u00f3n Google',
      modalTitleGeneric: 'Funci\u00f3n en construcci\u00f3n',
      modalDescGeneric: 'Estamos trabajando en esta secci\u00f3n. Vuelve en un tiempo.',
      modalTitleGoogle: 'Login con Google',
      modalDescGoogle: 'El inicio de sesi\u00f3n con Google estar\u00e1 disponible pronto.',
      ok: 'OK',
      brand: '@cucharalobelia Misiones',
      random: 'Elegir Random',
      rounds: 'Rondas',
      generate: 'Generar',
      back: 'Volver',
      close: 'Cerrar',
      pdf_missing: 'Funci\u00f3n en construcci\u00f3n o PDF no encontrado',
      stepper_dec: 'Quitar ronda',
      stepper_inc: 'Agregar ronda',
      rounds_group: 'Rondas y generar',
      lang_es_aria: 'Cambiar idioma a Espa\u00f1ol',
      lang_en_aria: 'Cambiar idioma a Ingl\u00e9s',
      flag_es: 'Espa\u00f1ol',
      flag_en: 'English',
      home_title: 'La Cuchara de Lobelia \u2013 Inicio',
      missions_title: 'Misiones \\u2013 @cucharalobelia',
      missions_2v2_title: 'Misiones 2vs2 \\u2013 @cucharalobelia'
    },
    en: {
      missions: 'Matched Play Missions',
      about: 'About',
      missions_2v2: '2v2 Missions',
      tutorials: 'Tutorials',
      calendars: 'Calendars',
      stl: 'Interesting STL',
      settings: 'Settings',
      contact: 'Contact & report bugs',
      about_title: 'Version Information',
      about_body: 'Current version: V1.0.3. Last update: 5/10/2025.',
      google: 'Google Sign-in',
      modalTitleGeneric: 'Feature under construction',
      modalDescGeneric: 'We are working on this section. Please check back later.',
      modalTitleGoogle: 'Google Sign-in',
      modalDescGoogle: 'Google login will be available soon.',
      ok: 'OK',
      brand: '@cucharalobelia Missions',
      random: 'Pick Random',
      rounds: 'Rounds',
      generate: 'Generate',
      back: 'Back',
      close: 'Close',
      pdf_missing: 'Feature under construction or PDF not found',
      stepper_dec: 'Decrease rounds',
      stepper_inc: 'Increase rounds',
      rounds_group: 'Rounds and generate',
      lang_es_aria: 'Switch language to Spanish',
      lang_en_aria: 'Switch language to English',
      flag_es: 'Spanish',
      flag_en: 'English',
      home_title: 'La Cuchara de Lobelia \u2013 Home',
      missions_title: 'Missions \\u2013 @cucharalobelia',
      missions_2v2_title: '2v2 Missions \\u2013 @cucharalobelia'
    }
  };

  const supportedLangs = Object.keys(translations);

  function normaliseLang(value) {
    if (!value || typeof value !== 'string') {
      return 'es';
    }
    const lang = value.slice(0, 2).toLowerCase();
    return supportedLangs.includes(lang) ? lang : 'es';
  }

  function getStoredLang() {
    try {
      const raw = global.localStorage.getItem('lobelia_lang');
      return raw ? normaliseLang(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setStoredLang(lang) {
    try {
      global.localStorage.setItem('lobelia_lang', normaliseLang(lang));
    } catch (error) {
      /* storage blocked */
    }
  }

  function detectInitialLang() {
    const navigatorLang = global.navigator && (global.navigator.language || global.navigator.userLanguage);
    return normaliseLang(getStoredLang() || navigatorLang || 'es');
  }

  function getStrings(lang) {
    return translations[normaliseLang(lang)];
  }

  function applyDomTranslations(lang, doc = global.document) {
    if (!doc || !doc.documentElement) {
      return;
    }
    const strings = getStrings(lang);
    doc.documentElement.lang = normaliseLang(lang);

    doc.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (key && strings[key]) {
        node.textContent = strings[key];
      }
    });

    doc.querySelectorAll('[data-i18n-aria]').forEach((node) => {
      const key = node.getAttribute('data-i18n-aria');
      if (key && strings[key]) {
        node.setAttribute('aria-label', strings[key]);
      }
    });
  }

  global.LobeliaI18n = {
    translations,
    normaliseLang,
    getStoredLang,
    setStoredLang,
    detectInitialLang,
    getStrings,
    applyDomTranslations
  };
})(window);







