const APP_VERSION = "1.0.9";
window.APP_VERSION = APP_VERSION;
// main.js
// Behaviour for the landing screen: language switcher and work-in-progress modal handling.
(function () {
  const { detectInitialLang, setStoredLang, normaliseLang, applyDomTranslations, getStrings } = window.LobeliaI18n;
  const doc = document;
  const GRID_COLUMNS = 12;
  const GRID_ROWS = 20;

  // Inicializar elementos
  const elements = {
    // Botones de la interfaz
    aboutBtn: doc.getElementById('btn-about'),
    flagEs: doc.getElementById('lang-es'),
    flagEn: doc.getElementById('lang-en'),

    // Elementos del modal
    modal: doc.getElementById('wip-modal'),
    backdrop: doc.getElementById('wip-backdrop'),
    modalTitle: doc.getElementById('wip-title'),
    modalDesc: doc.getElementById('wip-desc'),
    okBtn: doc.getElementById('wip-ok'),
    layoutGrid: doc.getElementById('layout-grid')
  };

  // Depuración: verificar elementos
  console.log('Elementos del modal cargados:', {
    modal: !!elements.modal,
    backdrop: !!elements.backdrop,
    modalTitle: !!elements.modalTitle,
    modalDesc: !!elements.modalDesc,
    okBtn: !!elements.okBtn
  });
  const videoCards = Array.from(doc.querySelectorAll('.mini-card[data-video-slot]'));


  /**
   * Convierte una referencia de celda (ej: "A1") a posición de fila/columna
   * @param {string} ref - Referencia de celda (ej: "A1")
   * @returns {{row: number, col: number}} Objeto con fila y columna (0-based)
   */
  function convertGridRefToPosition(ref) {
    const match = ref.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return { row: 0, col: 0 };

    const [, colStr, rowStr] = match;
    const col = colStr.toUpperCase().split('').reduce((acc, char) =>
      acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
    const row = parseInt(rowStr, 10) - 1;

    return { row, col };
  }

  /**
   * Posiciona un elemento en la cuadrícula según las coordenadas especificadas
   * @param {HTMLElement} element - Elemento a posicionar
   * @param {string} gridArea - Coordenadas en formato "A1" o "A1:C3"
   * @param {number} [zIndex=10] - Nivel de apilamiento (z-index)
   */
  function positionInGrid(element, gridArea, zIndex = 10) {
    if (!element) return;

    // Convertir coordenadas a mayúsculas
    gridArea = (gridArea || '').toString().toUpperCase().trim();

    // Extraer coordenadas de inicio y fin
    const parts = gridArea.split(':');
    const start = (parts[0] || '').trim();
    const end = (parts[1] || parts[0] || '').trim();
    if (!start) {
      console.warn('positionInGrid: gridArea vacío/incorrecto, usando A1');
      return;
    }

    // Convertir coordenadas a posiciones de grid
    const startPos = convertGridRefToPosition(start);
    const endPos = end ? convertGridRefToPosition(end) : startPos;
    console.log('positionInGrid refs:', { gridArea, start, end, startPos, endPos });

    // Obtener el contenedor principal
    const app = document.querySelector('.app');
    if (!app) return;

    // Obtener dimensiones del contenedor (sin padding, ahora es 0)
    const rect = app.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // Calcular tamaño de cada celda
    const cellWidth = containerWidth / GRID_COLUMNS;
    const cellHeight = containerHeight / GRID_ROWS;

    // Calcular posición y tamaño del elemento
    const left = startPos.col * cellWidth;
    const top = startPos.row * cellHeight;
    const width = (endPos.col - startPos.col + 1) * cellWidth;
    const height = (endPos.row - startPos.row + 1) * cellHeight;

    // Aplicar estilos
    element.style.position = 'absolute';
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.zIndex = zIndex;

    // Log para debug
    console.log(`📍 ${gridArea}: ${width.toFixed(1)}×${height.toFixed(1)}px en (${left.toFixed(1)}, ${top.toFixed(1)})`);
  }

  // Función obsoleta, se mantiene por compatibilidad


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
      console.warn('Error al normalizar la URL del video:', error);
      return raw;
    }
  }

  // Funciones de depuración (desactivadas para producción)
  const debugLog = () => { };
  const debugWarn = () => { };
  const debugError = () => { };

  function applyVideoCard(card, data, index) {
    const fallbackTitle = 'Miniatura ' + (index + 1);
    const label = card.querySelector('.mini-card__label');

    debugLog(`Aplicando tarjeta ${index}:`, data);

    // Resetear la tarjeta
    card.href = '#';
    card.style.backgroundImage = '';
    card.classList.remove('is-loaded');

    if (!data || !Array.isArray(data) || data.length < 2) {
      debugLog(`  - Sin datos o formato incorrecto para la tarjeta ${index}`);
      if (label) {
        label.textContent = fallbackTitle;
        label.style.display = 'block';
      }
      return;
    }

    const rawTitle = (data[0] || '').trim();
    const rawUrl = (data[1] || '').trim();
    const cleanUrl = normaliseVideoUrl(rawUrl);
    const videoId = extractYouTubeId(cleanUrl);

    debugLog(`  - Procesando video ${index}:`, { rawTitle, rawUrl, cleanUrl, videoId });

    if (!cleanUrl || !videoId) {
      debugLog(`  - URL de video inválida para la tarjeta ${index}`);
      if (label) {
        label.textContent = fallbackTitle;
        label.style.display = 'block';
      }
      return;
    }

    // Configurar la miniatura de YouTube
    const thumb = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
    debugLog(`  - Miniatura para ${index}:`, thumb);

    card.href = cleanUrl;
    card.dataset.videoUrl = cleanUrl;
    card.setAttribute('title', rawTitle || fallbackTitle);

    // Limpiar contenido previo (si lo hubiera)
    const existingImg = card.querySelector('img');
    if (existingImg) {
      existingImg.remove();
    }

    // Crear y añadir el elemento <img>
    const img = doc.createElement('img');
    img.className = 'mini-card__thumb';
    img.src = thumb;
    img.alt = rawTitle || fallbackTitle;

    // Añadir listeners para saber si la imagen carga o no
    img.onload = () => {
      debugLog(`  - Imagen para tarjeta ${index} cargada correctamente.`);
      card.classList.add('is-loaded');
    };
    img.onerror = () => {
      debugError(`  - ERROR: No se pudo cargar la imagen para la tarjeta ${index} desde ${thumb}`);
      card.classList.remove('is-loaded');
    };

    card.prepend(img);

    // Configurar la etiqueta
    if (label) {
      label.textContent = rawTitle || fallbackTitle;
      // Mostrar la etiqueta solo cuando se hace hover
      label.style.opacity = '0';
      label.style.transition = 'opacity 0.2s ease';

      // Eliminar event listeners anteriores para evitar duplicados
      card.removeEventListener('mouseover', handleMouseOver);
      card.removeEventListener('mouseout', handleMouseOut);

      // Agregar nuevos event listeners
      function handleMouseOver() {
        label.style.opacity = '1';
      }

      function handleMouseOut() {
        label.style.opacity = '0';
      }

      card.addEventListener('mouseover', handleMouseOver);
      card.addEventListener('mouseout', handleMouseOut);
    }
  }

  async function loadFeaturedVideos() {
    if (!videoCards.length) return;

    try {
      const response = await fetch('videos.txt', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) throw new Error(`Error al cargar videos.txt: HTTP ${response.status}`);

      const textContent = await response.text();
      const lines = textContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const videoLines = [];
      const videoPattern = /^([^|]+?)\s*\|\s*(https?:\/\/[^\s]+)$/i;

      lines.forEach((line) => {
        const sanitizedLine = line.replace(/^\uFEFF/, '');
        const videoMatch = sanitizedLine.match(videoPattern);
        if (videoMatch && videoMatch[1] && videoMatch[2]) {
          videoLines.push([videoMatch[1].trim(), videoMatch[2].trim()]);
        }
      });

      // Aplicar videos a las tarjetas
      videoCards.forEach((card, index) => {
        const videoData = videoLines[index] || null;
        try {
          applyVideoCard(card, videoData, index);
        } catch (error) {
          applyVideoCard(card, null, index);
        }
      });
    } catch (error) {
      console.error('Error al cargar los videos:', error);
      if (videoCards) {
        videoCards.forEach((card, index) => {
          applyVideoCard(card, null, index);
        });
      }
    }
  }

  let currentLang = detectInitialLang();
  let lastFocus = null;

  function getActiveStrings() {
    const strings = getStrings(currentLang);
    console.log('Traducciones cargadas:', strings);
    console.log('Idioma actual:', currentLang);
    return strings;
  }

  function updateButtonImage() {
    const buttonImg = document.getElementById('btn-misiones-img');
    if (buttonImg) {
      const imageName = currentLang === 'es' ? 'Misiones matched.png' : 'Boton Matched.png';
      buttonImg.src = `images/${imageName}`;
    }

    const calendarImg = document.getElementById('btn-calendar-img');
    if (calendarImg) {
      const calImageName = currentLang === 'es' ? 'Calendario.png' : 'Events.png';
      calendarImg.src = `images/${calImageName}`;
    }
  }

  function refreshDomStrings() {
    const strings = getActiveStrings();
    applyDomTranslations(currentLang, doc);
    doc.title = strings.home_title;
    updateButtonImage();
    // Actualizar texto del botón Volver si existe en esta pantalla
    const backBtn = document.getElementById('btn-back');
    if (backBtn && strings.back) {
      backBtn.textContent = strings.back;
      backBtn.setAttribute('aria-label', strings.back);
    }
  }

  function switchLang(lang) {
    currentLang = normaliseLang(lang);
    setStoredLang(currentLang);
    refreshDomStrings();
  }

  function openModal(type) {
    const strings = getActiveStrings();

    // Depuración detallada
    console.group('=== Depuración de openModal ===');
    console.log('Tipo de modal:', type);
    console.log('Traducciones disponibles:', JSON.parse(JSON.stringify(strings)));

    // Mostrar el modal
    lastFocus = doc.activeElement;
    doc.documentElement.classList.add('modal-open');

    // Verificación de elementos
    const elementsExist = {
      modal: !!elements.modal,
      backdrop: !!elements.backdrop,
      modalTitle: !!elements.modalTitle,
      modalDesc: !!elements.modalDesc,
      okBtn: !!elements.okBtn
    };

    console.log('Elementos del modal:', elementsExist);

    if (!elementsExist.modal || !elementsExist.backdrop || !elementsExist.modalTitle || !elementsExist.modalDesc) {
      console.error('Error: Faltan elementos del modal');
      console.groupEnd();
      return;
    }

    // Mostrar el modal y el fondo
    elements.modal.removeAttribute('aria-hidden');
    elements.backdrop.removeAttribute('aria-hidden');

    // Obtener textos según el tipo de modal
    let title, description;

    if (type === 'about') {
      title = 'about_title' in strings ? strings.about_title : 'Acerca de';
      const today = (() => {
        try { return new Date().toLocaleDateString('es-ES'); } catch (_) { return ''; }
      })();
      description = 'about_body' in strings ? strings.about_body : `Versión actual: V${APP_VERSION}. Última actualización: ${today}.`;

      console.log('Contenido del modal "About":', { title, description });
      console.log('Propiedades de strings:', Object.keys(strings));
      console.log('¿Existe about_title?', 'about_title' in strings);
      console.log('¿Existe about_body?', 'about_body' in strings);
    } else if (type === 'google') {
      title = strings.modalTitleGoogle || 'Google';
      description = strings.modalDescGoogle || 'Google login';
    } else {
      title = strings.modalTitleGeneric || 'Information';
      description = strings.modalDescGeneric || 'Loading...';
    }

    // Aplicar los textos al modal
    console.log('Aplicando al modal:', { title, description });

    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = description;

    // Forzar actualización del DOM
    elements.modal.style.display = 'none';
    elements.modal.offsetHeight; // Trigger reflow
    elements.modal.style.display = '';

    // Enfocar el botón OK para accesibilidad
    if (elements.okBtn) {
      elements.okBtn.focus();
    }

    console.groupEnd(); // Cerrar grupo de depuración

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

  /**
   * Posiciona los elementos en la cuadrícula según las coordenadas definidas
   */
  function positionElements() {
    console.log('🎯 Posicionando elementos en la cuadrícula...');

    // --- Posiciones específicas para PaginaInicio.html ---

    // Posicionar la galería de miniaturas (izquierda)
    const miniGallery = document.querySelector('.mini-gallery');
    if (miniGallery) {
      positionInGrid(miniGallery, 'A9:F17', 10);
      console.log('✅ Mini-gallery posicionada en A9:F17');
    }

    // Posicionar Flyer (Sam Va Lentin)
    const flyerSection = document.querySelector('.flyer-action');
    if (flyerSection) {
      positionInGrid(flyerSection, 'A2:E9', 10);
      console.log('✅ Flyer posicionado en A2:E9');
    }

    // Posicionar botón Calculadora
    const calculatorAction = document.querySelector('.calculator-action');
    if (calculatorAction) {
      positionInGrid(calculatorAction, 'H8:L9', 11);
      console.log('✅ Calculadora posicionada en H8:L9');
    }

    // Posicionar botón About
    const aboutAction = document.querySelector('.about-action');
    if (aboutAction) {
      positionInGrid(aboutAction, 'I19:L20', 11);
      console.log('✅ About posicionado en I19:L20');
    }

    // Posicionar botón Calendario
    const calendarAction = document.querySelector('.calendar-action');
    if (calendarAction) {
      positionInGrid(calendarAction, 'H11:L12', 11);
      console.log('✅ Calendario posicionado en H11:L12');
    }

    // Posicionar la acción principal (Misiones Matched Play)
    const mainAction = document.querySelector('.main-action');
    if (mainAction) {
      positionInGrid(mainAction, 'H5:L6', 10);
      console.log('✅ Main-action posicionada en H5:L6');
    }

    // Posicionar banderas de idioma
    const flagEs = document.getElementById('lang-es');
    if (flagEs) {
      positionInGrid(flagEs, 'K1', 15);
      console.log('✅ Bandera española posicionada en K1');
    }

    const flagEn = document.getElementById('lang-en');
    if (flagEn) {
      positionInGrid(flagEn, 'L1', 15);
      console.log('✅ Bandera inglesa posicionada en L1');
    }

    // --- Posiciones específicas para SamVaLentin2026 ---
    const qrAction = document.querySelector('.qr-action');
    if (qrAction) {
      positionInGrid(qrAction, 'B5:D8', 11);
      console.log('✅ QR posicionado en B5:D8');
    }

    const amonsulAction = document.querySelector('.amonsul-action');
    if (amonsulAction) {
      positionInGrid(amonsulAction, 'H5:L6', 11);
      console.log('✅ Amonsul posicionado en H5:L6');
    }

    const regEsAction = document.querySelector('.reg-es-action');
    if (regEsAction) {
      positionInGrid(regEsAction, 'B12:D13', 11);
      console.log('✅ Reglamento ES posicionado en B12:D13');
    }

    const regCatAction = document.querySelector('.reg-cat-action');
    if (regCatAction) {
      positionInGrid(regCatAction, 'I12:K13', 11);
      console.log('✅ Reglament CAT posicionado en I12:K13');
    }

    // --- Posiciones específicas para CalculadoraEstadisticas.html ---
    const spellCalcAction = document.querySelector('.spell-calc-action');
    if (spellCalcAction) {
      positionInGrid(spellCalcAction, 'B4:F8', 11);
      console.log('✅ Lanzar Spell posicionado en B4:F8');
    }

    const resistCalcAction = document.querySelector('.resist-calc-action');
    if (resistCalcAction) {
      positionInGrid(resistCalcAction, 'H4:L8', 11);
      console.log('✅ Resistir Hechizo posicionado en H4:L8');
    }

    const duelCalcAction = document.querySelector('.duel-calc-action');
    if (duelCalcAction) {
      positionInGrid(duelCalcAction, 'B10:F14', 11);
      console.log('✅ Calculadora Duelo posicionada en B10:F14');
    }

    // Banderas para CalculadoraEstadisticas.html
    const flagEsCalc = document.getElementById('lang-es');
    if (flagEsCalc) {
      positionInGrid(flagEsCalc, 'K1', 15);
      console.log('✅ Bandera española posicionada en K1 (Calculadora)');
    }

    const flagEnCalc = document.getElementById('lang-en');
    if (flagEnCalc) {
      positionInGrid(flagEnCalc, 'L1', 15);
      console.log('✅ Bandera inglesa posicionada en L1 (Calculadora)');
    }
  }

  // Los botones de idioma y el botón inferior están posicionados con CSS
  // y no necesitan la cuadrícula

  // Modal PDF (como en MisionesMatched): abrir en flotante
  function openPdfModal(pdfHref) {
    if (!pdfHref) return;
    // Igual que en MisionesMatched: resolver a URL ABSOLUTA antes de pasar al visor
    const absolutePdfUrl = new URL(pdfHref, window.location.href).href;
    const viewer = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(absolutePdfUrl);
    const backdrop = doc.getElementById('pdf-backdrop');
    const frame = doc.getElementById('pdf-frame');
    const closeBtn = doc.getElementById('pdf-close');
    if (!backdrop || !frame) return;
    // Texto del botón de cerrar según idioma
    try {
      const strings = getActiveStrings();
      if (closeBtn && strings && strings.close) {
        closeBtn.textContent = strings.close;
        closeBtn.setAttribute('aria-label', strings.close);
      }
    } catch (_) { /* noop */ }
    frame.src = viewer;
    backdrop.style.display = 'flex';
    backdrop.setAttribute('aria-hidden', 'false');
    const onBackdrop = () => closePdfModal();
    const onClose = () => closePdfModal();
    backdrop.addEventListener('click', onBackdrop, { once: true });
    closeBtn?.addEventListener('click', onClose, { once: true });
    const modalCard = backdrop.querySelector('.modal-card');
    if (modalCard) {
      modalCard.addEventListener('click', (e) => e.stopPropagation(), { once: true });
    }
    doc.addEventListener('keydown', function escHandler(ev) {
      if (ev.key === 'Escape') { closePdfModal(); doc.removeEventListener('keydown', escHandler); }
    });
  }
  function closePdfModal() {
    const backdrop = doc.getElementById('pdf-backdrop');
    const frame = doc.getElementById('pdf-frame');
    if (!backdrop) return;
    backdrop.style.display = 'none';
    backdrop.setAttribute('aria-hidden', 'true');
    if (frame) setTimeout(() => { frame.src = 'about:blank'; }, 150);
  }

  function setupEventListeners() {
    // Language buttons
    if (elements.flagEs) {
      elements.flagEs.addEventListener('click', () => switchLang('es'));
    }
    if (elements.flagEn) {
      elements.flagEn.addEventListener('click', () => switchLang('en'));
    }

    // Modal buttons
    elements.aboutBtn?.addEventListener('click', () => openModal('about'));
    elements.okBtn?.addEventListener('click', closeModal);
    elements.backdrop?.addEventListener('click', closeModal);
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    });

    // WIP links
    doc.querySelectorAll('[data-wip]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        openModal(node.getAttribute('data-wip'));
      });
    });

    // Video cards (prevent navigation if no URL)
    videoCards.forEach((card) => {
      card.addEventListener('click', (event) => {
        if (!card.dataset.videoUrl || card.dataset.videoUrl === '#') {
          event.preventDefault();
        }
      });
    });

    // Flyer button - asegurar navegación
    const flyerBtn = document.querySelector('.flyer-action a');
    if (flyerBtn) {
      flyerBtn.addEventListener('click', (event) => {
        console.log('Flyer button clicked!');
        // No prevenir el comportamiento por defecto, dejar que navegue
      });
      console.log('✅ Flyer button listener attached');
    } else {
      console.log('❌ Flyer button not found');
    }

    // --- Listeners específicos del menú SamVaLentin2026 ---
    const backBtn = doc.getElementById('btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'PaginaInicio.html';
      });
      console.log('✅ Back button listener attached');
    }

    const whatsappBtn = doc.getElementById('btn-whatsapp');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', (e) => {
        const url = whatsappBtn.dataset.url || whatsappBtn.href;
        if (!url || url === '#') {
          e.preventDefault();
          console.warn('WhatsApp URL no configurada.');
        } else {
          // abrir en misma pestaña para apps móviles
          window.location.href = url;
        }
      });
    }

    const amonsulBtn = doc.getElementById('btn-amonsul');
    if (amonsulBtn) {
      amonsulBtn.addEventListener('click', (e) => {
        const url = amonsulBtn.dataset.url || amonsulBtn.href;
        if (!url || url === '#') {
          e.preventDefault();
          console.warn('Amonsul URL no configurada.');
        } else {
          window.open(url, '_blank', 'noopener');
        }
      });
    }

    const regEsBtn = doc.getElementById('btn-reg-es');
    if (regEsBtn) {
      regEsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pdf = regEsBtn.dataset.pdf;
        openPdfModal(pdf);
      });
    }

    const regCatBtn = doc.getElementById('btn-reg-cat');
    if (regCatBtn) {
      regCatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pdf = regCatBtn.dataset.pdf;
        openPdfModal(pdf);
      });
    }

    // --- Listeners específicos de CalculadoraEstadisticas.html ---
    const spellCalcBtn = doc.getElementById('btn-spell-calc');
    if (spellCalcBtn) {
      spellCalcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSpellCalculator();
      });
      console.log('✅ Spell Calculator button listener attached');
    }

    const resistCalcBtn = doc.getElementById('btn-resist-calc');
    if (resistCalcBtn) {
      resistCalcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openResistCalculator();
      });
      console.log('✅ Resist Calculator button listener attached');
    }

    // Modal spell calculator
    const spellCalcClose = doc.getElementById('spell-calc-close');
    const spellCalcBackdrop = doc.getElementById('spell-calc-backdrop');

    if (spellCalcClose) {
      spellCalcClose.addEventListener('click', closeSpellCalculator);
    }

    if (spellCalcBackdrop) {
      spellCalcBackdrop.addEventListener('click', closeSpellCalculator);
    }

    // Modal resist calculator
    const resistCalcClose = doc.getElementById('resist-calc-close');
    const resistCalcBackdrop = doc.getElementById('resist-calc-backdrop');

    if (resistCalcClose) {
      resistCalcClose.addEventListener('click', closeResistCalculator);
    }

    if (resistCalcBackdrop) {
      resistCalcBackdrop.addEventListener('click', closeResistCalculator);
    }

    // Controls for resist calculator
    const resistWillDecrease = doc.getElementById('resist-will-decrease');
    const resistWillIncrease = doc.getElementById('resist-will-increase');
    const resistWillPoints = doc.getElementById('resist-will-points');

    const rivalResultDecrease = doc.getElementById('rival-result-decrease');
    const rivalResultIncrease = doc.getElementById('rival-result-increase');
    const rivalSpellResult = doc.getElementById('rival-spell-result');

    const resistMightDecrease = doc.getElementById('resist-might-decrease');
    const resistMightIncrease = doc.getElementById('resist-might-increase');
    const resistMightPoints = doc.getElementById('resist-might-points');

    // Will controls for resist calculator
    if (resistWillDecrease && resistWillPoints) {
      resistWillDecrease.addEventListener('click', () => {
        const currentValue = parseInt(resistWillPoints.value) || 0;
        if (currentValue > 0) {
          resistWillPoints.value = currentValue - 1;
          updateResistCalculator();
        }
      });
    }

    if (resistWillIncrease && resistWillPoints) {
      resistWillIncrease.addEventListener('click', () => {
        const currentValue = parseInt(resistWillPoints.value) || 0;
        if (currentValue < 99) { // Límite práctico alto en lugar de 6
          resistWillPoints.value = currentValue + 1;
          updateResistCalculator();
        }
      });
    }

    // Rival result controls
    if (rivalResultDecrease && rivalSpellResult) {
      rivalResultDecrease.addEventListener('click', () => {
        const currentValue = parseInt(rivalSpellResult.value) || 2;
        if (currentValue > 2) {
          rivalSpellResult.value = currentValue - 1;
          updateResistCalculator();
        }
      });
    }

    if (rivalResultIncrease && rivalSpellResult) {
      rivalResultIncrease.addEventListener('click', () => {
        const currentValue = parseInt(rivalSpellResult.value) || 2;
        if (currentValue < 6) {
          rivalSpellResult.value = currentValue + 1;
          updateResistCalculator();
        }
      });
    }

    // Might controls for resist calculator
    if (resistMightDecrease && resistMightPoints) {
      resistMightDecrease.addEventListener('click', () => {
        const currentValue = parseInt(resistMightPoints.value) || 0;
        if (currentValue > 0) {
          resistMightPoints.value = currentValue - 1;
          updateResistCalculator();
        }
      });
    }

    if (resistMightIncrease && resistMightPoints) {
      resistMightIncrease.addEventListener('click', () => {
        const currentValue = parseInt(resistMightPoints.value) || 0;
        if (currentValue < 6) {
          resistMightPoints.value = currentValue + 1;
          updateResistCalculator();
        }
      });
    }

    // Input changes for resist calculator
    [resistWillPoints, rivalSpellResult, resistMightPoints].forEach(input => {
      if (input) {
        input.addEventListener('change', updateResistCalculator);
        input.addEventListener('input', updateResistCalculator);

        // Validación para solo permitir números
        input.addEventListener('keydown', (e) => {
          // Permitir: backspace, delete, tab, escape, enter
          if ([8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && (e.ctrlKey || e.metaKey)) ||
            (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
            (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) ||
            (e.keyCode === 88 && (e.ctrlKey || e.metaKey)) ||
            // Permitir: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
          }

          // Asegurar que solo sea números
          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
          }
        });

        // Validación al pegar
        input.addEventListener('paste', (e) => {
          e.preventDefault();
          const pastedData = e.clipboardData.getData('text');
          const numericData = pastedData.replace(/[^0-9]/g, '');
          document.execCommand('insertText', false, numericData);
        });
      }
    });

    // Magic resistance checkbox for resist calculator
    const resistMagicResistance = doc.getElementById('resist-magic-resistance');
    if (resistMagicResistance) {
      resistMagicResistance.addEventListener('change', updateResistCalculator);
    }

    // Might controls
    const mightDecrease = doc.getElementById('might-decrease');
    const mightIncrease = doc.getElementById('might-increase');
    const willDecrease = doc.getElementById('will-decrease');
    const willIncrease = doc.getElementById('will-increase');
    const difficultyDecrease = doc.getElementById('difficulty-decrease');
    const difficultyIncrease = doc.getElementById('difficulty-increase');
    const willPoints = doc.getElementById('will-points');
    const spellDifficulty = doc.getElementById('spell-difficulty');
    const mightPoints = doc.getElementById('might-points');

    // Will controls
    if (willDecrease && willPoints) {
      willDecrease.addEventListener('click', () => {
        const currentValue = parseInt(willPoints.value) || 0;
        if (currentValue > 0) {
          willPoints.value = currentValue - 1;
          updateSpellCalculator();
        }
      });
    }

    if (willIncrease && willPoints) {
      willIncrease.addEventListener('click', () => {
        const currentValue = parseInt(willPoints.value) || 0;
        if (currentValue < 99) { // Límite práctico alto en lugar de 6
          willPoints.value = currentValue + 1;
          updateSpellCalculator();
        }
      });
    }

    // Difficulty controls
    if (difficultyDecrease && spellDifficulty) {
      difficultyDecrease.addEventListener('click', () => {
        const currentValue = parseInt(spellDifficulty.value) || 2;
        if (currentValue > 2) {
          spellDifficulty.value = currentValue - 1;
          updateSpellCalculator();
        }
      });
    }

    if (difficultyIncrease && spellDifficulty) {
      difficultyIncrease.addEventListener('click', () => {
        const currentValue = parseInt(spellDifficulty.value) || 2;
        if (currentValue < 6) {
          spellDifficulty.value = currentValue + 1;
          updateSpellCalculator();
        }
      });
    }

    if (mightDecrease && mightPoints) {
      mightDecrease.addEventListener('click', () => {
        const currentValue = parseInt(mightPoints.value) || 0;
        if (currentValue > 0) {
          mightPoints.value = currentValue - 1;
          updateSpellCalculator();
        }
      });
    }

    if (mightIncrease && mightPoints) {
      mightIncrease.addEventListener('click', () => {
        const currentValue = parseInt(mightPoints.value) || 0;
        if (currentValue < 6) {
          mightPoints.value = currentValue + 1;
          updateSpellCalculator();
        }
      });
    }

    // Input changes
    [willPoints, spellDifficulty, mightPoints].forEach(input => {
      if (input) {
        input.addEventListener('change', updateSpellCalculator);
        input.addEventListener('input', updateSpellCalculator);

        // Validación para solo permitir números
        input.addEventListener('keydown', (e) => {
          // Permitir: backspace, delete, tab, escape, enter
          if ([8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && (e.ctrlKey || e.metaKey)) ||
            (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
            (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) ||
            (e.keyCode === 88 && (e.ctrlKey || e.metaKey)) ||
            // Permitir: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
          }

          // Asegurar que solo sea números
          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
          }
        });

        // Validación al pegar
        input.addEventListener('paste', (e) => {
          e.preventDefault();
          const pastedData = e.clipboardData.getData('text');
          const numericData = pastedData.replace(/[^0-9]/g, '');
          document.execCommand('insertText', false, numericData);
        });
      }
    });

    // Reposicionar elementos al cambiar el tamaño de la ventana
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        positionElements();
        if (typeof debugGridEnabled !== 'undefined' && debugGridEnabled) {
          buildDebugGrid();
        }
      }, 100);
    });
  }

  /**
   * Inicializa el diseño de la aplicación, posicionando los elementos en la cuadrícula
   */

  // --- Funciones para la Calculadora de Spells ---

  function openSpellCalculator() {
    const backdrop = document.getElementById('spell-calc-backdrop');
    const modal = document.getElementById('spell-calc-modal');

    if (backdrop && modal) {
      backdrop.style.display = 'block';
      backdrop.setAttribute('aria-hidden', 'false');
      modal.setAttribute('aria-hidden', 'false');
      updateSpellCalculator();
    }
  }

  function closeSpellCalculator() {
    const backdrop = document.getElementById('spell-calc-backdrop');
    const modal = document.getElementById('spell-calc-modal');

    if (backdrop && modal) {
      backdrop.style.display = 'none';
      backdrop.setAttribute('aria-hidden', 'true');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function calculateSpellProbability(willPoints, difficulty, mightPoints, hasMagicResistance) {
    const numDice = parseInt(willPoints) || 0;
    const targetValue = parseInt(difficulty) || 4;
    const might = parseInt(mightPoints) || 0;
    const magicResistance = hasMagicResistance || false;

    // Añadir dado extra por Resistencia Mágica si está activada
    const totalDice = numDice + (magicResistance ? 1 : 0);

    // Si no hay dados, probabilidad 0
    if (totalDice === 0) {
      return {
        totalProbability: 0,
        distribution: {}
      };
    }

    // Calcular probabilidad de éxito con múltiples dados
    // Con might, un dado puede mejorar su resultado en +might
    let singleDieSuccessProb = 0;

    // Para cada resultado posible del dado (1-6)
    for (let dieResult = 1; dieResult <= 6; dieResult++) {
      // Aplicar might al resultado más bajo posible
      const modifiedResult = Math.min(6, dieResult + might);

      // Si el resultado modificado es >= dificultad, es éxito
      if (modifiedResult >= targetValue) {
        singleDieSuccessProb += 1 / 6; // Cada resultado tiene 1/6 de probabilidad
      }
    }

    // Calcular probabilidad de que al menos un dado tenga éxito
    // 1 - probabilidad de que todos fallen
    const singleDieFailProb = 1 - singleDieSuccessProb;
    const totalFailProb = Math.pow(singleDieFailProb, totalDice);
    const totalSuccessProb = (1 - totalFailProb) * 100;

    // Calcular distribución por resultado (probabilidad de obtener cada valor o superior)
    const resultDistribution = {};
    for (let result = 1; result <= 6; result++) {
      let probability = 0;

      // Calcular probabilidad de obtener este resultado o superior
      for (let threshold = result; threshold <= 6; threshold++) {
        let thresholdProb = 0;

        // Para cada resultado original del dado
        for (let dieResult = 1; dieResult <= 6; dieResult++) {
          const modifiedResult = Math.min(6, dieResult + might);
          if (modifiedResult === threshold) {
            thresholdProb += 1 / 6;
          }
        }

        probability += thresholdProb;
      }

      // Probabilidad de que al menos un dado alcance este resultado o superior
      const atLeastOneSuccess = 1 - Math.pow(1 - probability, totalDice);
      resultDistribution[result] = atLeastOneSuccess * 100;
    }

    return {
      totalProbability: totalSuccessProb,
      distribution: resultDistribution
    };
  }

  function updateSpellCalculator() {
    const willPoints = document.getElementById('will-points').value;
    const spellDifficulty = document.getElementById('spell-difficulty').value;
    const mightPoints = document.getElementById('might-points').value;

    const result = calculateSpellProbability(willPoints, spellDifficulty, mightPoints, false);

    // Actualizar probabilidad principal
    const successRateElement = document.getElementById('success-rate');
    if (successRateElement) {
      successRateElement.textContent = result.totalProbability.toFixed(1) + '%';
    }

    // Actualizar desglose por resultado
    const breakdownElement = document.getElementById('result-breakdown');
    if (breakdownElement) {
      breakdownElement.innerHTML = '';

      for (let resultValue = 1; resultValue <= 6; resultValue++) {
        const prob = result.distribution[resultValue] || 0;
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
          <div class="result-value">${resultValue}+</div>
          <div class="result-probability">${prob.toFixed(1)}%</div>
        `;
        breakdownElement.appendChild(item);
      }
    }

    // Actualizar gráfico
    updateProbabilityChart(result.distribution);
  }

  function updateProbabilityChart(distribution) {
    const canvas = document.getElementById('probability-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Configuración del gráfico
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Obtener datos para el gráfico (solo dificultades 2+ a 6+)
    const thresholds = [2, 3, 4, 5, 6];
    const data = thresholds.map(t => distribution[t] || 0);
    const maxValue = Math.max(...data, 100); // Mínimo 100 para buena escala

    // Dibujar fondo y ejes
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);

    // Dibujar líneas de grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Etiquetas de porcentaje en el eje Y
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      const percentage = 100 - (100 / 5) * i;
      ctx.fillText(percentage + '%', padding - 5, y + 3);
    }

    // Dibujar barras
    const barWidth = chartWidth / thresholds.length * 0.6;
    const barSpacing = chartWidth / thresholds.length;

    thresholds.forEach((threshold, index) => {
      const value = data[index];
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + barSpacing * index + (barSpacing - barWidth) / 2;
      const y = height - padding - barHeight;

      // Color de la barra según umbral
      if (threshold <= 3) {
        ctx.fillStyle = '#4CAF50'; // Verde para fácil
      } else if (threshold === 4) {
        ctx.fillStyle = '#FF9800'; // Naranja para medio
      } else {
        ctx.fillStyle = '#F44336'; // Rojo para difícil
      }

      // Dibujar barra
      ctx.fillRect(x, y, barWidth, barHeight);

      // Etiqueta del umbral
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(threshold + '+', x + barWidth / 2, height - padding + 20);

      // Etiqueta de valor sobre la barra
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(value.toFixed(1) + '%', x + barWidth / 2, y - 5);
    });

    // Dibujar ejes principales
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Título del gráfico
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Probabilidad de Éxito por Dificultad', width / 2, 20);
  }

  // --- Funciones para la Calculadora de Resistir Spell ---

  function openResistCalculator() {
    const backdrop = document.getElementById('resist-calc-backdrop');
    const modal = document.getElementById('resist-calc-modal');

    if (backdrop && modal) {
      backdrop.style.display = 'block';
      backdrop.setAttribute('aria-hidden', 'false');
      modal.setAttribute('aria-hidden', 'false');
      updateResistCalculator();
    }
  }

  function closeResistCalculator() {
    const backdrop = document.getElementById('resist-calc-backdrop');
    const modal = document.getElementById('resist-calc-modal');

    if (backdrop && modal) {
      backdrop.style.display = 'none';
      backdrop.setAttribute('aria-hidden', 'true');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function calculateResistProbability(willPoints, rivalResult, mightPoints, hasMagicResistance) {
    const numDice = parseInt(willPoints) || 0;
    const targetValue = parseInt(rivalResult) || 4;
    const might = parseInt(mightPoints) || 0;
    const magicResistance = hasMagicResistance || false;

    // Añadir dado extra por Resistencia Mágica si está activada
    const totalDice = numDice + (magicResistance ? 1 : 0);

    // Si no hay dados, probabilidad 0
    if (totalDice === 0) {
      return {
        totalProbability: 0,
        distribution: {}
      };
    }

    // Calcular probabilidad de éxito con múltiples dados
    // Con might, un dado puede mejorar su resultado en +might
    let singleDieSuccessProb = 0;

    // Para cada resultado posible del dado (1-6)
    for (let dieResult = 1; dieResult <= 6; dieResult++) {
      // Aplicar might al resultado más bajo posible
      const modifiedResult = Math.min(6, dieResult + might);

      // Si el resultado modificado es >= dificultad del rival, es éxito
      if (modifiedResult >= targetValue) {
        singleDieSuccessProb += 1 / 6; // Cada resultado tiene 1/6 de probabilidad
      }
    }

    // Con múltiples dados, la probabilidad de éxito es 1 - probabilidad de que todos fallen
    const allFailProb = Math.pow(1 - singleDieSuccessProb, totalDice);
    const successProbability = (1 - allFailProb) * 100;

    // Calcular distribución por resultado (probabilidad de obtener cada valor o superior)
    const resultDistribution = {};
    for (let result = 1; result <= 6; result++) {
      let probability = 0;

      // Calcular probabilidad de obtener este resultado o superior
      for (let threshold = result; threshold <= 6; threshold++) {
        let thresholdProb = 0;

        // Para cada resultado original del dado
        for (let dieResult = 1; dieResult <= 6; dieResult++) {
          const modifiedResult = Math.min(6, dieResult + might);
          if (modifiedResult === threshold) {
            thresholdProb += 1 / 6;
          }
        }

        probability += thresholdProb;
      }

      // Probabilidad de que al menos un dado alcance este resultado o superior
      const atLeastOneSuccess = 1 - Math.pow(1 - probability, totalDice);
      resultDistribution[result] = atLeastOneSuccess * 100;
    }

    return {
      totalProbability: successProbability,
      distribution: resultDistribution
    };
  }

  function updateResistCalculator() {
    const resistWillPoints = document.getElementById('resist-will-points').value;
    const rivalSpellResult = document.getElementById('rival-spell-result').value;
    const resistMightPoints = document.getElementById('resist-might-points').value;
    const resistMagicResistance = document.getElementById('resist-magic-resistance').checked;

    const result = calculateResistProbability(resistWillPoints, rivalSpellResult, resistMightPoints, resistMagicResistance);

    // Actualizar probabilidad principal
    const resistSuccessRateElement = document.getElementById('resist-success-rate');
    if (resistSuccessRateElement) {
      resistSuccessRateElement.textContent = result.totalProbability.toFixed(1) + '%';
    }

    // Actualizar desglose por resultado
    const resistBreakdownElement = document.getElementById('resist-result-breakdown');
    if (resistBreakdownElement) {
      resistBreakdownElement.innerHTML = '';

      for (let resultValue = 1; resultValue <= 6; resultValue++) {
        const prob = result.distribution[resultValue] || 0;
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
          <div class="result-value">${resultValue}+</div>
          <div class="result-probability">${prob.toFixed(1)}%</div>
        `;
        resistBreakdownElement.appendChild(item);
      }
    }

    // Actualizar gráfico
    updateResistProbabilityChart(result.distribution);
  }

  function updateResistProbabilityChart(distribution) {
    const canvas = document.getElementById('resist-probability-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Configuración del gráfico
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Obtener datos para el gráfico (solo dificultades 2+ a 6+)
    const thresholds = [2, 3, 4, 5, 6];
    const data = thresholds.map(t => distribution[t] || 0);
    const maxValue = Math.max(...data, 100); // Mínimo 100 para buena escala

    // Dibujar fondo y ejes
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);

    // Dibujar líneas de grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Etiquetas de porcentaje en el eje Y
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      const percentage = 100 - (100 / 5) * i;
      ctx.fillText(percentage + '%', padding - 5, y + 3);
    }

    // Dibujar barras
    const barWidth = chartWidth / thresholds.length * 0.6;
    const barSpacing = chartWidth / thresholds.length;

    thresholds.forEach((threshold, index) => {
      const value = data[index];
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + barSpacing * index + (barSpacing - barWidth) / 2;
      const y = height - padding - barHeight;

      // Color de la barra según umbral (invertido para resistir)
      if (threshold <= 3) {
        ctx.fillStyle = '#F44336'; // Rojo para fácil de resistir
      } else if (threshold === 4) {
        ctx.fillStyle = '#FF9800'; // Naranja para medio
      } else {
        ctx.fillStyle = '#4CAF50'; // Verde para difícil de resistir
      }

      // Dibujar barra
      ctx.fillRect(x, y, barWidth, barHeight);

      // Etiqueta del umbral
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(threshold + '+', x + barWidth / 2, height - padding + 20);

      // Etiqueta de valor sobre la barra
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(value.toFixed(1) + '%', x + barWidth / 2, y - 5);
    });

    // Dibujar ejes principales
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Título del gráfico
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Probabilidad de Resistir por Dificultad', width / 2, 20);
  }

  // --- Funciones para la Calculadora de Duelo ---

  function openDuelCalculator() {
    const backdrop = document.getElementById('duel-calc-backdrop');
    const modal = document.getElementById('duel-calc-modal');

    if (backdrop && modal) {
      backdrop.style.display = 'block';
      backdrop.setAttribute('aria-hidden', 'false');
      modal.setAttribute('aria-hidden', 'false');
      updateDuelCalculator();
    }
  }

  function closeDuelCalculator() {
    const backdrop = document.getElementById('duel-calc-backdrop');
    const modal = document.getElementById('duel-calc-modal');

    if (backdrop && modal) {
      backdrop.style.display = 'none';
      backdrop.setAttribute('aria-hidden', 'true');
      modal.setAttribute('aria-hidden', 'true');
    }
  }



  function rollDice(count, rerollOnes = false) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
      let val = rollDie();
      if (val === 1 && rerollOnes) {
        val = rollDie();
      }
      rolls.push(val);
    }
    return rolls;
  }

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function applyPenalty(roll, isTwoHanded) {
    if (!isTwoHanded) return roll;
    if (roll === 6) return 6; // Natural 6 ignora penalizador
    return Math.max(1, roll - 1); // Mínimo 1
  }

  function getBestRoll(rolls, isTwoHanded) {
    let best = 0;
    for (let r of rolls) {
      const val = applyPenalty(r, isTwoHanded);
      if (val > best) best = val;
    }
    return best;
  }

  function updateDuelCalculator() {
    console.log('updateDuelCalculator called');
    // Obtener valores
    const friendly = {
      attacks: parseInt(document.getElementById('friendly-attacks').value) || 1,
      fv: parseInt(document.getElementById('friendly-fv').value) || 1,
      hasBanner: document.getElementById('friendly-banner').checked,
      twoHanded: document.getElementById('friendly-two-handed').checked,
      elven: document.getElementById('friendly-elven').checked
    };

    const enemy = {
      attacks: parseInt(document.getElementById('enemy-attacks').value) || 1,
      fv: parseInt(document.getElementById('enemy-fv').value) || 1,
      hasBanner: document.getElementById('enemy-banner').checked,
      twoHanded: document.getElementById('enemy-two-handed').checked,
      elven: document.getElementById('enemy-elven').checked
    };

    // Calcular
    // Nota: Pasamos rerollOnes a la función de simulación si decidimos implementarlo ahí
    // Por ahora, modifiquemos calculateDuelProbability para aceptar rerollOnes en el objeto
    // (Ya lo hace, pero necesitamos actualizar la llamada a rollDice dentro de la simulación)

    // Pequeño hack: redefinir calculateDuelProbability para usar rerollOnes correctamente
    // O mejor, actualizar la función calculateDuelProbability arriba para usar friendly.rerollOnes

    const result = calculateDuelProbability(friendly, enemy);

    // Actualizar UI
    document.getElementById('duel-win-rate').textContent = result.friendlyWin.toFixed(1) + '%';
    document.getElementById('duel-loss-rate').textContent = result.enemyWin.toFixed(1) + '%';
    document.getElementById('duel-draw-rate').textContent = result.draw.toFixed(1) + '%';
  }

  function calculateDuelProbability(friendly, enemy) {
    console.log('calculateDuelProbability called with:', friendly, enemy);
    const iterations = 200000;
    let friendlyWins = 0;
    let enemyWins = 0;
    let draws = 0;

    for (let i = 0; i < iterations; i++) {
      // Roll dice for both sides (no reroll 1s logic anymore)
      let friendlyRolls = rollDice(friendly.attacks, false);
      let enemyRolls = rollDice(enemy.attacks, false);

      // Apply Two-Handed penalty (-1 to duel roll), but natural 6 is always 6
      // If user checked 'twoHanded', we apply penalty.
      // Note: In MESBG, two-handed penalty is -1 to their Duel roll.
      // A natural 6 is still a 6? Rules say: "A roll of 6 is always a 6".
      // Usually implemented as: result = max(1, roll - 1). If roll is 6, it stays 6?
      // Actually rule is: "Two-handed weapons suffer -1 to their Duel roll... A natural 6 is always a 6."
      // So if roll is 6, result is 6. If roll is 1-5, result is roll-1.

      let friendlyBest = getBestRoll(friendlyRolls, friendly.twoHanded);
      let enemyBest = getBestRoll(enemyRolls, enemy.twoHanded);

      // Banner Reroll Logic (Simplified)
      // If losing or tied, and has banner, reroll one die (the lowest or just one)
      // We'll try to improve the best roll if it's not a 6.

      // Friendly Banner
      if (friendly.hasBanner && friendlyBest < 6) {
        // Check if we are losing or tied
        // Winning condition: (friendlyBest > enemyBest) or (friendlyBest == enemyBest && friendly.fv >= enemy.fv)
        // So we reroll if we are NOT winning comfortably? 
        // Standard banner: "A banner allows you to reroll a single D6 in a Duel roll."
        // Usually used if you are losing or tied.

        // Let's simulate a smart player: if current best is not winning, reroll one die.
        let currentlyWinning = (friendlyBest > enemyBest) || (friendlyBest === enemyBest && friendly.fv >= enemy.fv);

        if (!currentlyWinning) {
          // Reroll one die. We effectively add another die roll and take best.
          let extraRoll = rollDie();
          let extraBest = friendly.twoHanded ? applyPenalty(extraRoll, true) : extraRoll;
          if (extraBest > friendlyBest) {
            friendlyBest = extraBest;
          }
        }
      }

      // Enemy Banner
      if (enemy.hasBanner && enemyBest < 6) {
        let currentlyWinning = (enemyBest > friendlyBest) || (enemyBest === friendlyBest && enemy.fv >= friendly.fv);
        if (!currentlyWinning) {
          let extraRoll = rollDie();
          let extraBest = enemy.twoHanded ? applyPenalty(extraRoll, true) : extraRoll;
          if (extraBest > enemyBest) {
            enemyBest = extraBest;
          }
        }
      }

      // Compare Best Rolls
      if (friendlyBest > enemyBest) {
        friendlyWins++;
      } else if (enemyBest > friendlyBest) {
        enemyWins++;
      } else {
        // Tie on dice
        if (friendly.fv > enemy.fv) {
          friendlyWins++;
        } else if (enemy.fv > friendly.fv) {
          enemyWins++;
        } else {
          // Tie on FV too -> Roll off
          // Elven Weapon Logic
          // Standard: 1-3 Evil(Enemy), 4-6 Good(Friendly)
          // Friendly Elven: 1-2 Evil, 3-6 Good
          // Enemy Elven: 1-4 Evil, 5-6 Good
          // Both/Neither: Standard

          let winThreshold = 4; // Standard (4,5,6 wins for Good/Friendly)

          if (friendly.elven && !enemy.elven) {
            winThreshold = 3; // 3,4,5,6 wins
          } else if (!friendly.elven && enemy.elven) {
            winThreshold = 5; // 5,6 wins
          }

          let rollOff = rollDie();
          if (rollOff >= winThreshold) {
            friendlyWins++;
          } else {
            enemyWins++;
          }
        }
      }
    }

    let fWin = (friendlyWins / iterations) * 100;
    let eWin = (enemyWins / iterations) * 100;
    let dPct = (draws / iterations) * 100;

    // "Cosmetic" smoothing: Snap to 50% if within 49.75% - 50.25%
    // This avoids user confusion when stats are identical (variance noise)
    if (Math.abs(fWin - 50) < 0.25 && Math.abs(eWin - 50) < 0.25) {
      fWin = 50.0;
      eWin = 50.0;
    }

    return {
      friendlyWin: fWin,
      enemyWin: eWin,
      draw: dPct
    };
  }
  function init() {
    // Re-query video cards now that the DOM is ready
    console.log(`Encontrados ${videoCards.length} tarjetas de video.`);

    // Duel Calculator Listeners
    const btnDuelCalc = doc.getElementById('btn-duel-calc');
    const duelCalcClose = doc.getElementById('duel-calc-close');
    const duelCalcBackdrop = document.getElementById('duel-calc-backdrop');

    if (btnDuelCalc) {
      btnDuelCalc.addEventListener('click', (e) => {
        e.preventDefault();
        openDuelCalculator();
      });
    }

    if (duelCalcClose) {
      duelCalcClose.addEventListener('click', closeDuelCalculator);
    }

    if (duelCalcBackdrop) {
      duelCalcBackdrop.addEventListener('click', (e) => {
        if (e.target === duelCalcBackdrop) closeDuelCalculator();
      });
    }

    // Duel Calculator Inputs
    const duelInputs = [
      'friendly-attacks', 'friendly-fv',
      'enemy-attacks', 'enemy-fv'
    ];

    const duelCheckboxes = [
      'friendly-banner', 'friendly-two-handed', 'friendly-elven',
      'enemy-banner', 'enemy-two-handed', 'enemy-elven'
    ];

    duelInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', updateDuelCalculator);
        el.addEventListener('input', updateDuelCalculator);

        // Botones +/-
        const btnDec = document.getElementById(id + '-dec');
        const btnInc = document.getElementById(id + '-inc');

        if (btnDec) {
          btnDec.addEventListener('click', () => {
            let val = parseInt(el.value) || 0;
            if (val > parseInt(el.min)) {
              el.value = val - 1;
              updateDuelCalculator();
            }
          });
        }

        if (btnInc) {
          btnInc.addEventListener('click', () => {
            let val = parseInt(el.value) || 0;
            let max = el.max ? parseInt(el.max) : 100;
            if (val < max) {
              el.value = val + 1;
              updateDuelCalculator();
            }
          });
        }
      }
    });

    duelCheckboxes.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', updateDuelCalculator);
      }
    });

    // Posicionar elementos en la cuadrícula
    positionElements();

    refreshDomStrings();
    setupEventListeners();

    if (videoCards.length > 0) {
      loadFeaturedVideos();
    }
  }

  // --- App Initialization ---
  function startApp() {
    console.log('Iniciando aplicación...');
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', () => {
        console.log('DOM completamente cargado, inicializando...');
        init();
      });
    } else {
      console.log('DOM ya está listo, inicializando...');
      init();
    }
  }

  // Iniciar la aplicación con un pequeño retraso para asegurar que el DOM esté listo
  setTimeout(startApp, 100);
})();




