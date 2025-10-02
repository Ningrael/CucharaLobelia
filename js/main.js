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
  const videoCards = Array.from(doc.querySelectorAll('.mini-card[data-video-slot]'));

  function extractYouTubeId(source) {
    if (!source) return '';
    try {
      const url = new URL(source);
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.replace(/\//g, '').trim();
      }
      const idParam = url.searchParams.get('v');
      if (idParam) {
        return idParam;
      }
    } catch (error) {
      return '';
    }
    return '';
  }

  function normaliseVideoUrl(raw) {
    if (!raw) {
      return '';
    }
    try {
      const url = new URL(raw);
      url.searchParams.delete('feature');
      return url.toString();
    } catch (error) {
      return raw;
    }
  }

  function applyVideoCard(card, data, index) {
    const label = card.querySelector('.mini-card__label');
    const fallbackTitle = 'Miniatura ' + (index + 1);

    if (!data) {
      card.href = '#';
      delete card.dataset.videoUrl;
      card.removeAttribute('title');
      card.style.backgroundImage = '';
      card.classList.remove('is-loaded');
      if (label) {
        label.textContent = fallbackTitle;
      }
      return;
    }

    const rawTitle = (data[0] || '').trim();
    const rawUrl = (data[1] || '').trim();
    const cleanUrl = normaliseVideoUrl(rawUrl);
    const videoId = extractYouTubeId(cleanUrl);

    if (!cleanUrl || !videoId) {
      applyVideoCard(card, null, index);
      return;
    }

    const thumb = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
    card.href = cleanUrl;
    card.dataset.videoUrl = cleanUrl;
    card.setAttribute('title', rawTitle || fallbackTitle);
    card.style.backgroundImage = "url('" + thumb + "')";
    card.classList.add('is-loaded');
    if (label) {
      label.textContent = rawTitle || fallbackTitle;
    }
  }

  async function loadFeaturedVideos() {
    if (!videoCards.length) {
      return;
    }
    try {
      const response = await fetch('videos.txt', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const textContent = await response.text();
      const lines = textContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      videoCards.forEach((card, index) => {
        const entry = index < lines.length ? lines[index].split('|') : null;
        applyVideoCard(card, entry, index);
      });
    } catch (error) {
      videoCards.forEach((card, index) => applyVideoCard(card, null, index));
      console.warn('No se pudieron cargar las miniaturas de video:', error);
    }
  }

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

    videoCards.forEach((card) => {
      card.addEventListener('click', (event) => {
        if (!card.dataset.videoUrl) {
          event.preventDefault();
        }
      });
    });
    loadFeaturedVideos();

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
