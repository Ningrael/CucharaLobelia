const APP_VERSION = "1.0.3";
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
  let debugGridEnabled = false;

  function buildDebugGrid() {
    const grid = elements.layoutGrid;
    if (!grid) return;
    
    // Limpiar contenido existente
    grid.innerHTML = '';
    
    const GRID_COLUMNS = 12; // A-L
    const GRID_ROWS = 20;    // 1-20
    const letters = 'ABCDEFGHIJKL';
    
    // Crear celdas
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLUMNS; col++) {
        const cell = document.createElement('div');
        cell.className = 'layout-grid__cell';
        cell.textContent = letters[col] + (row + 1);
        grid.appendChild(cell);
      }
    }
  }

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
    gridArea = gridArea.toUpperCase();
    
    // Extraer coordenadas de inicio y fin
    const [start, end = start] = gridArea.split(':');
    
    // Convertir coordenadas a posiciones de grid
    const startPos = convertGridRefToPosition(start);
    const endPos = end ? convertGridRefToPosition(end) : startPos;
    
    // Obtener el contenedor principal
    const app = document.querySelector('.app');
    if (!app) return;
    
    // Obtener dimensiones del contenedor
    const rect = app.getBoundingClientRect();
    const padding = parseInt(window.getComputedStyle(app).paddingLeft) || 18;
    
    // Calcular dimensiones útiles (sin padding)
    const usableWidth = rect.width - (padding * 2);
    const usableHeight = rect.height - (padding * 2);
    
    // Calcular tamaño de cada celda
    const cellWidth = usableWidth / GRID_COLUMNS;
    const cellHeight = usableHeight / GRID_ROWS;
    
    // Calcular posición y tamaño del elemento
    const left = startPos.col * cellWidth + padding;
    const top = startPos.row * cellHeight + padding;
    const width = (endPos.col - startPos.col + 1) * cellWidth;
    const height = (endPos.row - startPos.row + 1) * cellHeight;
    
    // Aplicar estilos
    element.style.position = 'absolute';
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.zIndex = zIndex;
  }

  // Función obsoleta, se mantiene por compatibilidad
  function updateGridMetrics() {
    // Esta función ya no es necesaria con la nueva implementación
    // Se mantiene por compatibilidad
  }

  function applyDebugGridState(enabled) {
    if (!elements.layoutGrid) return;
    
    if (enabled) {
      buildDebugGrid();
      elements.layoutGrid.classList.add('is-visible');
      // Asegurar que se ajuste al redimensionar
      window.addEventListener('resize', buildDebugGrid);
    } else {
      elements.layoutGrid.classList.remove('is-visible');
      window.removeEventListener('resize', buildDebugGrid);
    }
  }

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

  // Variable global para controlar la depuración
  let debugMode = false;

  function debugLog(...args) {
    if (debugMode) {
      console.log(...args);
    }
  }

  function debugWarn(...args) {
    if (debugMode) {
      console.warn(...args);
    }
  }

  function debugError(...args) {
    if (debugMode) {
      console.error(...args);
    } else {
      // En producción, solo mostramos errores críticos
      console.error(...args);
    }
  }

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
    debugLog('Iniciando carga de videos...');
    debugLog(`Número de tarjetas de video encontradas: ${window.videoCards.length}`);
    
    if (!window.videoCards.length) {
      debugError('ERROR: No se encontraron tarjetas de video en el DOM');
      return;
    }
    
    try {
      debugLog('Solicitando videos.txt...');
      const response = await fetch('videos.txt', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      debugLog('Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        redirected: response.redirected,
        type: response.type,
        url: response.url
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        debugError('Contenido de la respuesta de error:', errorText);
        throw new Error(`Error al cargar videos.txt: HTTP ${response.status} ${response.statusText}`);
      }
      
      const textContent = await response.text();
      debugLog('Contenido de videos.txt:', textContent);
      
      const lines = textContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      let debugFlagValue = null;
      const videoLines = [];
      const debugPattern = /^debug\s*[:=]\s*(.+)$/i;
      // Ajustar el patrón para que coincida con el formato 'título|url'
      const videoPattern = /^([^|]+?)\s*\|\s*(https?:\/\/[^\s]+)$/i;

      debugLog('Procesando líneas del archivo de videos:');
      lines.forEach((line, i) => {
        debugLog(`Línea ${i + 1}:`, line);
        const sanitizedLine = line.replace(/^\uFEFF/, '');
        const debugMatch = sanitizedLine.match(debugPattern);
        if (debugMatch) {
          debugFlagValue = debugMatch[1].trim();
          debugLog('  - Línea de depuración encontrada:', debugFlagValue);
          return;
        }
        
        const videoMatch = sanitizedLine.match(videoPattern);
        if (videoMatch && videoMatch[1] && videoMatch[2]) {
          const title = videoMatch[1].trim();
          const url = videoMatch[2].trim();
          debugLog('  - Video encontrado:', { title, url });
          videoLines.push([title, url]);
        } else {
          debugLog('  - Línea no coincide con el patrón de video');
        }
      });

      // Aplicar configuración de depuración si existe
      if (debugFlagValue !== null) {
        debugMode = debugFlagValue.toLowerCase() === 'true';
        applyDebugGridState(debugMode);
        if (debugMode) {
          debugLog('Modo depuración activado');
        }
      }

      debugLog('Líneas de video encontradas:', videoLines);
      
      // Aplicar videos a las tarjetas
      window.videoCards.forEach((card, index) => {
        const videoData = videoLines[index] || null;
        debugLog(`Aplicando a tarjeta ${index}:`, videoData);
        try {
          applyVideoCard(card, videoData, index);
        } catch (error) {
          debugWarn(`Error al aplicar video a tarjeta ${index}:`, error);
          applyVideoCard(card, null, index);
        }
      });
    } catch (error) {
      debugError('Error al cargar los videos:', error);
      applyDebugGridState(false);
      if (window.videoCards) {
        window.videoCards.forEach((card, index) => {
          try {
            applyVideoCard(card, null, index);
          } catch (innerError) {
            debugWarn(`Error al aplicar video a tarjeta ${index}:`, innerError);
          }
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
      console.log('Imagen actualizada a:', imageName);
    }
  }

  function refreshDomStrings() {
    const strings = getActiveStrings();
    applyDomTranslations(currentLang, doc);
    doc.title = strings.home_title;
    updateButtonImage();
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
      description = 'about_body' in strings ? strings.about_body : 'Versión actual: V1.0.2. Última actualización: 5/10/2025.';
      
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
    // Los botones de idioma ya están posicionados con CSS (top-right)
    // No necesitan reposicionamiento con la cuadrícula
    
    // Posicionar botones de misiones (si existen en el DOM)
    const misiones1 = document.getElementById('misiones-1');
    const misiones2 = document.getElementById('misiones-2');
    const misiones3 = document.getElementById('misiones-3');
    const matchedBtn = document.getElementById('btn-matched');
    
    if (misiones1) positionInGrid(misiones1, 'A5:C6', 10);
    if (misiones2) positionInGrid(misiones2, 'A8:C9', 10);
    if (misiones3) positionInGrid(misiones3, 'A10:C12', 10);
    if (matchedBtn) positionInGrid(matchedBtn, 'J6:L8', 10);
    
    // Las miniaturas de video y otros elementos ya tienen su posición
    // definida por CSS en la estructura home-layout
    // Solo usamos la cuadrícula para elementos que necesiten
    // posicionamiento absoluto específico
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

    // Reposicionar elementos al cambiar el tamaño de la ventana
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        positionElements();
        if (debugGridEnabled) {
          buildDebugGrid();
        }
      }, 100);
    });
  }

  /**
   * Inicializa el diseño de la aplicación, posicionando los elementos en la cuadrícula
   */
  function init() {
    // Re-query video cards now that the DOM is ready
    window.videoCards = Array.from(doc.querySelectorAll('.mini-card[data-video-slot]'));
    console.log(`Encontrados ${window.videoCards.length} tarjetas de video.`);
    
    // Posicionar elementos en la cuadrícula
    positionElements();

    refreshDomStrings();
    setupEventListeners();
    
    if (window.videoCards.length > 0) {
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




