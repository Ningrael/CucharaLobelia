// MisionesMatched.js
// Vanilla JS implementation of the matched play missions browser and PDF viewer screen.
(function () {
  const { LobeliaI18n } = window;
  if (!LobeliaI18n) {
    console.error('Missing LobeliaI18n helper.');
    return;
  }

  const POOLS = [
    { items: ['Domination', 'Capture & Control', 'Breakthrough', 'Stake a Claim'] },
    { items: ['To the Death!', 'Lords of Battle', 'Assassination', 'Contest of Champions'] },
    { items: ['Hold Ground', 'Heirloom of Ages Past', 'Sites of Power', 'Command the Battlefield'] },
    { items: ['Destroy the Supplies', 'Retrieval', 'Seize the Prizes', 'Treasure Hoard'] },
    { items: ['Reconnoitre', 'Storm the Camp', 'Divide & Conquer', 'Escort the Wounded'] },
    { items: ['Fog of War', 'Clash by Moonlight', 'Lead from the Front', 'Convergence'] }
  ];

  const PDF_DIRECTORY = window.location.pathname.includes('misiones') ? '../pdfs/' : 'pdfs/';
  const PDF_JS_VIEWER = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=';
  const HISTORY_KEYS = { base: '__lobeliaMissionsBase', pdf: '__lobeliaPdfOpen' };
  const doc = document;
  const root = doc.getElementById('root');
  if (!root) {
    console.error('Missing #root container.');
    return;
  }

  root.innerHTML = '';

  const state = {
    lang: LobeliaI18n.detectInitialLang(),
    selected: '',
    rounds: '3',
    badges: {},
    modalOpen: false,
    lastFocus: null
  };

  const missionEntries = new Map();

  const elements = {};

  function create(tag, className, attrs) {
    const node = doc.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (attrs) {
      Object.entries(attrs).forEach(([key, value]) => {
        if (value == null) {
          return;
        }
        if (key === 'text') {
          node.textContent = value;
        } else if (key === 'html') {
          node.innerHTML = value;
        } else if (key === 'style') {
          Object.assign(node.style, value);
        } else {
          node.setAttribute(key, value);
        }
      });
    }
    return node;
  }

  function clampRoundsValue(value) {
    const parsed = parseInt(value || '3', 10);
    if (Number.isNaN(parsed)) {
      return '3';
    }
    return String(Math.min(6, Math.max(1, parsed)));
  }

  function ensureHistoryBase() {
    const current = history.state || {};
    if (!current[HISTORY_KEYS.base]) {
      const nextState = Object.assign({}, current, { [HISTORY_KEYS.base]: true });
      history.replaceState(nextState, '', window.location.href);
    }
  }

  function buildPdfCandidates(mission) {
    const baseName = `${mission.toUpperCase()}.pdf`;
    const variants = [
      baseName,
      encodeURIComponent(baseName),
      baseName.replace(/ /g, '_'),
      baseName.replace(/!/g, '')
    ];
    const baseUrl = new URL(PDF_DIRECTORY, window.location.href);
    const candidates = [];
    const seen = new Set();
    variants.forEach((variant) => {
      if (!variant) {
        return;
      }
      const href = new URL(variant, baseUrl).href;
      if (!seen.has(href)) {
        seen.add(href);
        candidates.push(href);
      }
    });
    return candidates;
  }

  function openPdfInModal(pdfHref, mission) {
    ensureHistoryBase();
    const viewerUrl = `${PDF_JS_VIEWER}${encodeURIComponent(pdfHref)}`;
    const activeElement = doc.activeElement;
    state.lastFocus = activeElement && typeof activeElement.focus === 'function' ? activeElement : null;
    elements.modalFrame.src = viewerUrl;
    elements.modalBackdrop.style.display = 'flex';
    elements.modalBackdrop.setAttribute('aria-hidden', 'false');
    state.selected = mission;
    state.modalOpen = true;
    updateSelectedButton();
    const focusClose = () => {
      if (!elements.modalClose || typeof elements.modalClose.focus !== 'function') {
        return;
      }
      try {
        elements.modalClose.focus({ preventScroll: true });
      } catch (error) {
        elements.modalClose.focus();
      }
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(focusClose);
    } else {
      focusClose();
    }
    const nextState = Object.assign({}, history.state || {});
    nextState[HISTORY_KEYS.pdf] = true;
    if (history.state && history.state[HISTORY_KEYS.pdf]) {
      history.replaceState(nextState, '', window.location.href);
    } else {
      history.pushState(nextState, '', '#pdf');
    }
  }
  function buildLayout() {
    // Limpiar el contenedor raÃƒÆ’Ã‚Â­z
    root.innerHTML = '';
    
    // Crear elementos principales
    const stage = create('div', 'stage');
    const phone = create('div', 'phone');
    const screen = create('div', 'screen');

    // Crear banner superior
    const banner = create('div', 'banner');
    const brand = create('div', 'brand');
    const topRight = create('div', 'top-right', { role: 'group', 'aria-label': 'Language' });
    const flagEs = create('button', 'flag-btn', { type: 'button', 'aria-label': 'EspaÃƒÆ’Ã‚Â±ol' });
    flagEs.style.backgroundImage = "url('https://flagcdn.com/w20/es.png')";
    const flagEn = create('button', 'flag-btn', { type: 'button', 'aria-label': 'English' });
    flagEn.style.backgroundImage = "url('https://flagcdn.com/w20/gb.png')";
    topRight.append(flagEs, flagEn);
    banner.append(brand, topRight);

    // Crear controles
    const controls = create('div', 'controls');
    const randomBtn = create('button', 'btn-gold', { 
      type: 'button',
      'data-i18n': 'random',
      'aria-label': 'Seleccionar misiÃƒÆ’Ã‚Â³n aleatoria'
    });

    // Grupo de rondas
    const roundsGroup = create('div', 'rounds-group', { role: 'group', 'aria-label': 'NÃƒÆ’Ã‚Âºmero de rondas' });
    const roundsLabel = create('span', 'rounds-label', { 'data-i18n': 'rounds' });
    const stepper = create('div', 'stepper');
    const decBtn = create('button', 'btn-circle', { 
      type: 'button',
      'aria-label': 'Reducir nÃƒÆ’Ã‚Âºmero de rondas',
      'data-i18n-aria': 'stepper_dec'
    });
    decBtn.textContent = '-';
    
    const roundsInput = create('input', 'rounds-input', { 
      type: 'text', 
      inputmode: 'numeric',
      'aria-label': 'NÃƒÆ’Ã‚Âºmero de rondas',
      value: state.rounds
    });
    
    const incBtn = create('button', 'btn-circle', { 
      type: 'button',
      'aria-label': 'Aumentar nÃƒÆ’Ã‚Âºmero de rondas',
      'data-i18n-aria': 'stepper_inc'
    });
    incBtn.textContent = '+';
    
    const generateBtn = create('button', 'btn-secondary btn-sm', { 
      type: 'button',
      'data-i18n': 'generate'
    });

    stepper.append(decBtn, roundsInput, incBtn);
    roundsGroup.append(roundsLabel, stepper, generateBtn);
    controls.append(randomBtn, roundsGroup);

    // Contenido principal - Grid de misiones
    const content = create('div', 'content');
    const poolsContainer = create('div', 'pools');
    const poolsGrid = create('div', 'pools-grid');

    // Crear tarjetas de misiones
    POOLS.forEach((pool, poolIndex) => {
      const poolCard = create('section', 'pool-card');
      const list = create('ul', 'missions');

      (pool.items || []).forEach((mission, missionIndex) => {
        const item = create('li');
        const button = create('button', 'item', { 
          type: 'button', 
          'data-mission': mission, 
          'aria-label': mission,
          'data-i18n': `mission_${poolIndex}_${missionIndex}`
        });
        const label = create('span', 'label', { text: mission });
        const badge = create('span', 'badge', { 
          'aria-hidden': 'true',
          style: { display: 'none' } 
        });
        button.append(label, badge);
        item.appendChild(button);
        list.appendChild(item);
        missionEntries.set(mission, { button, badge });
      });

      poolCard.appendChild(list);
      poolsGrid.appendChild(poolCard);
    });

    poolsContainer.appendChild(poolsGrid);
    content.appendChild(poolsContainer);

    // Pie de pÃƒÆ’Ã‚Â¡gina
    const footer = create('footer', 'footer');
    const twoVsTwoBtn = create('button', 'btn-footer', {
      type: 'button',
      'data-action': 'two-vs-two',
      'data-i18n': 'missions_2v2',
      'data-i18n-aria': 'missions_2v2'
    });
    twoVsTwoBtn.textContent = 'Misiones 2vs2';
    const backBtn = create('button', 'btn-footer', {
      type: 'button',
      'data-i18n': 'back',
      'aria-label': 'Volver al inicio'
    });
    footer.append(twoVsTwoBtn, backBtn);

    // Modal para PDF
    const modalBackdrop = create('div', 'modal-backdrop', { 
      role: 'dialog', 
      'aria-modal': 'true',
      'aria-hidden': 'true',
      'aria-label': 'Vista previa del PDF',
      tabindex: '-1'
    });
    
    modalBackdrop.style.display = 'none';
    const modalCard = create('div', 'modal-card');
    const modalClose = create('button', 'modal-close', { 
      type: 'button',
      'aria-label': 'Cerrar modal',
      'data-i18n-aria': 'close'
    });
    
    const modalFrame = create('iframe', 'modal-iframe', { 
      title: 'Vista previa del PDF de la misiÃƒÆ’Ã‚Â³n',
      referrerpolicy: 'no-referrer',
      'aria-label': 'Contenido de la misiÃƒÆ’Ã‚Â³n'
    });
    modalFrame.src = 'about:blank';
    
    modalCard.append(modalClose, modalFrame);
    modalBackdrop.appendChild(modalCard);

    // Construir la estructura del DOM
    screen.append(banner, controls, content, footer);
    phone.appendChild(screen);
    stage.append(phone, modalBackdrop);
    root.appendChild(stage);

    // Inicializar elementos en el objeto elements
    Object.assign(elements, {
      // Elementos de la interfaz
      brand,
      flagEs,
      flagEn,
      banner,
      controls,
      footer,
      screen,
      
      // Botones y controles
      randomBtn,
      twoVsTwoBtn,
      backBtn,
      
      // Elementos de rondas
      roundsGroup,
      roundsLabel,
      decBtn,
      incBtn,
      roundsInput,
      generateBtn,
      
      // Grid de misiones
      poolsGrid,
      
      // Elementos del modal
      modalBackdrop,
      modalClose,
      modalFrame,
      modalCard
    });
  }

  function renderStrings() {
    const strings = LobeliaI18n.getStrings(state.lang);
    doc.documentElement.lang = state.lang;
    doc.title = strings.missions_title;

    elements.brand.textContent = strings.brand;
    elements.flagEs.setAttribute('aria-label', strings.lang_es_aria);
    elements.flagEn.setAttribute('aria-label', strings.lang_en_aria);
    elements.randomBtn.textContent = strings.random;
    elements.twoVsTwoBtn.textContent = strings.missions_2v2 || 'Misiones 2vs2';
    elements.twoVsTwoBtn.setAttribute('aria-label', strings.missions_2v2 || 'Misiones 2vs2');
    elements.roundsGroup.setAttribute('aria-label', strings.rounds_group);
    elements.roundsLabel.textContent = strings.rounds;
    elements.decBtn.setAttribute('aria-label', strings.stepper_dec);
    elements.incBtn.setAttribute('aria-label', strings.stepper_inc);
    elements.roundsInput.setAttribute('aria-label', strings.rounds);
    elements.generateBtn.textContent = strings.generate;
    elements.backBtn.textContent = strings.back;
    elements.modalClose.textContent = strings.close;
    elements.modalBackdrop.setAttribute('data-missing-pdf', strings.pdf_missing);
  }

  function updateSelectedButton() {
    missionEntries.forEach(({ button }, mission) => {
      if (mission === state.selected) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
  }

  function updateBadges() {
    missionEntries.forEach(({ badge }, mission) => {
      const round = state.badges[mission];
      if (round) {
        badge.textContent = String(round);
        badge.style.display = 'inline-flex';
      } else {
        badge.textContent = '';
        badge.style.display = 'none';
      }
    });
  }

  async function handleMissionClick(mission) {
    if (!mission) {
      return;
    }
    const strings = LobeliaI18n.getStrings(state.lang);
    const candidates = buildPdfCandidates(mission);

    for (const href of candidates) {
      try {
        let response = await fetch(href, { method: 'HEAD', cache: 'no-store' });
        if (!response.ok && response.status === 405) {
          response = await fetch(href, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            cache: 'no-store'
          });
        }

        if (response.ok) {
          openPdfInModal(href, mission);
          return;
        }
      } catch (error) {
        console.warn('PDF lookup failed for', mission, error);
      }
    }

    alert(strings.pdf_missing);
  }

  function closeModal(options = {}) {
    const { fromPopstate = false } = options;
    if (!state.modalOpen && elements.modalBackdrop.style.display === 'none') {
      return;
    }
    elements.modalBackdrop.style.display = 'none';
    elements.modalBackdrop.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      elements.modalFrame.src = 'about:blank';
    }, 200);
    state.modalOpen = false;
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
      try {
        state.lastFocus.focus({ preventScroll: true });
      } catch (error) {
        state.lastFocus.focus();
      }
    }
    state.lastFocus = null;
    if (!fromPopstate && history.state && history.state[HISTORY_KEYS.pdf]) {
      history.back();
    }
  }

  function onPopState(event) {
    if (state.modalOpen && (!event.state || !event.state[HISTORY_KEYS.pdf])) {
      closeModal({ fromPopstate: true });
      ensureHistoryBase();
    }
  }

  function pickRandomMission() {
    if (!missionEntries.size) {
      return;
    }
    const missions = Array.from(missionEntries.keys());
    const randomIndex = Math.floor(Math.random() * missions.length);
    state.selected = missions[randomIndex];
    state.badges = {};
    updateSelectedButton();
    updateBadges();
  }

  function generateRounds() {
    const total = parseInt(clampRoundsValue(state.rounds), 10);
    const indexes = Array.from({ length: POOLS.length }, (_, index) => index);

    for (let i = indexes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }

    const chosen = indexes.slice(0, total);
    const nextBadges = {};
    let lastSelected = null;

    chosen.forEach((poolIndex, order) => {
      const pool = POOLS[poolIndex];
      const missions = pool.items || [];
      if (!missions.length) {
        return;
      }
      const mission = missions[Math.floor(Math.random() * missions.length)];
      nextBadges[mission] = order + 1;
      lastSelected = mission;
    });

    state.badges = nextBadges;
    if (lastSelected) {
      state.selected = lastSelected;
    }
    updateBadges();
    updateSelectedButton();
  }

  function setLang(lang) {
    state.lang = LobeliaI18n.normaliseLang(lang);
    LobeliaI18n.setStoredLang(state.lang);
    renderStrings();
  }

  function recalcSizes() {
    try {
      const bannerNode = elements.banner;
      const controlsNode = elements.controls;
      const footerNode = elements.footer;
      const screenNode = elements.screen;
      const grid = elements.poolsGrid;

      // Verificar que todos los elementos necesarios existan
      if (!bannerNode || !controlsNode || !footerNode || !screenNode || !grid) {
        console.warn('Algunos elementos del DOM no se encontraron:', {
          banner: !!bannerNode,
          controls: !!controlsNode,
          footer: !!footerNode,
          screen: !!screenNode,
          grid: !!grid
        });
        return;
      }

      const bannerH = bannerNode.getBoundingClientRect().height;
      const controlsH = controlsNode.getBoundingClientRect().height;
      const footerH = footerNode.getBoundingClientRect().height;

      const gap = 6;
      const cols = 2;
      const rows = 3;

      const availH = screenNode.clientHeight - bannerH - controlsH - footerH - 8;
      const availW = screenNode.clientWidth - 16;

      const sizeByH = Math.floor((availH - gap * (rows + 1)) / rows);
      const sizeByW = Math.floor((availW - gap * (cols + 1)) / cols);
      const tile = Math.max(0, Math.min(sizeByH, sizeByW));

      const pad = 6;
      const innerW = tile - pad * 2;
      const innerH = tile - pad * 2;
      const btnGap = 6;
      const subCols = 2;
      const subRows = 2;
      const btnW = Math.max(0, Math.floor((innerW - btnGap * (subCols - 1)) / subCols));
      const btnH = Math.max(0, Math.floor((innerH - btnGap * (subRows - 1)) / subRows));

      grid.style.setProperty('--tile', `${tile}px`);
      grid.style.setProperty('--btnW', `${btnW}px`);
      grid.style.setProperty('--btnH', `${btnH}px`);
      grid.style.setProperty('--gap', `${gap}px`);
    } catch (error) {
      console.error('Error en recalcSizes:', error);
    }
  }

  function initEventHandlers() {
    elements.flagEs.addEventListener('click', () => setLang('es'));
    elements.flagEn.addEventListener('click', () => setLang('en'));
    elements.randomBtn.addEventListener('click', pickRandomMission);
    elements.decBtn.addEventListener('click', () => {
      state.rounds = clampRoundsValue(String(parseInt(state.rounds || '3', 10) - 1));
      elements.roundsInput.value = state.rounds;
    });
    elements.incBtn.addEventListener('click', () => {
      state.rounds = clampRoundsValue(String(parseInt(state.rounds || '3', 10) + 1));
      elements.roundsInput.value = state.rounds;
    });
    elements.generateBtn.addEventListener('click', generateRounds);
    elements.backBtn.addEventListener('click', () => {
      window.location.href = '../PaginaInicio.html';
    });
    elements.twoVsTwoBtn.addEventListener('click', () => {
      window.location.href = './Matched2vs2.html';
    });

    missionEntries.forEach(({ button }, mission) => {
      button.addEventListener('click', () => handleMissionClick(mission));
    });

    elements.modalBackdrop.addEventListener('click', () => closeModal());
    elements.modalClose.addEventListener('click', () => closeModal());
    elements.modalCard.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    elements.roundsInput.addEventListener('input', (event) => {
      const value = event.target.value.trim();
      if (value === '') {
        state.rounds = '';
        return;
      }
      if (/^[1-6]$/.test(value)) {
        state.rounds = value;
      } else {
        event.target.value = state.rounds;
      }
    });

    elements.roundsInput.addEventListener('blur', (event) => {
      state.rounds = clampRoundsValue(event.target.value);
      event.target.value = state.rounds;
    });

    window.addEventListener('resize', recalcSizes);
    window.addEventListener('popstate', onPopState);
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && elements.modalBackdrop.style.display !== 'none') {
        closeModal();
      }
    });
  }

  buildLayout();
  ensureHistoryBase();
  renderStrings();
  updateSelectedButton();
  updateBadges();
  initEventHandlers();
  recalcSizes();
})();











































