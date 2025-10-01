const APP_VERSION = "1.0.0";
window.APP_VERSION = APP_VERSION;
// main.js
// Behaviour for the landing screen: language switcher and work-in-progress modal handling.
(function () {
  const { detectInitialLang, setStoredLang, normaliseLang, applyDomTranslations, getStrings } = window.LobeliaI18n;
  const doc = document;

  const elements = {
    aboutBtn: doc.getElementById('btn-about'),
    flagEs: doc.getElementById('lang-es'),
    flagEn: doc.getElementById('lang-en'),
    modal: doc.getElementById('wip-modal'),
    backdrop: doc.getElementById('wip-backdrop'),
    okBtn: doc.getElementById('wip-ok'),
    modalTitle: doc.getElementById('wip-title'),
    modalDesc: doc.getElementById('wip-desc')
  };

  let currentLang = detectInitialLang();
  let lastFocus = null;

  function getActiveStrings() {
    return getStrings(currentLang);
  }

  function refreshDomStrings() {
    const strings = getActiveStrings();
    applyDomTranslations(currentLang, doc);
    doc.title = strings.home_title;
  }

  function switchLang(lang) {
    currentLang = normaliseLang(lang);
    setStoredLang(currentLang);
    refreshDomStrings();
  }

  function openModal(type) {
    const strings = getActiveStrings();
    lastFocus = doc.activeElement;
    doc.documentElement.classList.add('modal-open');
    elements.modal.removeAttribute('aria-hidden');
    elements.backdrop.removeAttribute('aria-hidden');

    if (type === 'google') {
      elements.modalTitle.textContent = strings.modalTitleGoogle;
      elements.modalDesc.textContent = strings.modalDescGoogle;
    } else if (type === 'about') {
      elements.modalTitle.textContent = strings.about_title || strings.modalTitleGeneric;
      const body = strings.about_body || strings.modalDescGeneric || '';
      elements.modalDesc.textContent = body.replace('{version}', APP_VERSION);
    } else {
      elements.modalTitle.textContent = strings.modalTitleGeneric;
      elements.modalDesc.textContent = strings.modalDescGeneric;
    }

    elements.okBtn.focus();
  }

  function closeModal() {
    doc.documentElement.classList.remove('modal-open');
    elements.modal.setAttribute('aria-hidden', 'true');
    elements.backdrop.setAttribute('aria-hidden', 'true');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  function bindWorkInProgressHandlers() {
    doc.querySelectorAll('[data-wip]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        openModal(node.getAttribute('data-wip'));
      });
    });
  }

  function bindLanguageButtons() {
    if (elements.flagEs) {
      elements.flagEs.addEventListener('click', () => switchLang('es'));
    }
    if (elements.flagEn) {
      elements.flagEn.addEventListener('click', () => switchLang('en'));
    }
  }

  function init() {
    refreshDomStrings();
    bindLanguageButtons();
    bindWorkInProgressHandlers();
    elements.aboutBtn?.addEventListener('click', () => openModal('about'));

    elements.okBtn?.addEventListener('click', closeModal);
    elements.backdrop?.addEventListener('click', closeModal);
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();





