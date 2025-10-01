// Matched2vs2.js
// Simplified 2vs2 missions selector aligned with the main matched play styling.
(function () {
  const { LobeliaI18n } = window;
  if (!LobeliaI18n) {
    console.error('Missing LobeliaI18n helper.');
    return;
  }

  const MISSIONS = [
    'No Escape',
    'Total Conquest',
    'Take & Hold',
    'Clash of Champions',
    'Cornered',
    'Duel of Wits'
  ];

  const PDF_DIRECTORY = window.location.pathname.includes('misiones') ? '../pdfs/2vs2/' : 'pdfs/2vs2/';
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
    badges: {}
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
    return String(Math.min(MISSIONS.length, Math.max(1, parsed)));
  }

  function buildLayout() {
    const stage = create('div', 'stage stage-2v2');
    const phone = create('div', 'phone');
    const screen = create('div', 'screen');

    const banner = create('div', 'banner');
    const brand = create('div', 'brand');
    const topRight = create('div', 'top-right', { role: 'group', 'aria-label': 'Language' });
    const flagEs = create('button', 'flag-btn', { type: 'button', 'aria-label': 'Español' });
    flagEs.style.backgroundImage = "url('https://flagcdn.com/w20/es.png')";
    const flagEn = create('button', 'flag-btn', { type: 'button', 'aria-label': 'English' });
    flagEn.style.backgroundImage = "url('https://flagcdn.com/w20/gb.png')";
    topRight.append(flagEs, flagEn);
    banner.append(brand, topRight);

    const controls = create('div', 'controls');
    const randomBtn = create('button', 'btn-gold', {
      type: 'button',
      'data-i18n': 'random',
      'aria-label': 'Seleccionar misión aleatoria'
    });

    const roundsGroup = create('div', 'rounds-group', { role: 'group', 'aria-label': 'Número de rondas' });
    const roundsLabel = create('span', 'rounds-label', { 'data-i18n': 'rounds' });
    const stepper = create('div', 'stepper');
    const decBtn = create('button', 'btn-circle', {
      type: 'button',
      'data-i18n-aria': 'stepper_dec',
      'aria-label': 'Reducir número de rondas'
    });
    decBtn.textContent = '-';
    const roundsInput = create('input', 'rounds-input', {
      type: 'text',
      inputmode: 'numeric',
      'aria-label': 'Número de rondas',
      value: state.rounds
    });
    const incBtn = create('button', 'btn-circle', {
      type: 'button',
      'data-i18n-aria': 'stepper_inc',
      'aria-label': 'Aumentar número de rondas'
    });
    incBtn.textContent = '+';
    const generateBtn = create('button', 'btn-secondary btn-sm', {
      type: 'button',
      'data-i18n': 'generate'
    });

    stepper.append(decBtn, roundsInput, incBtn);
    roundsGroup.append(roundsLabel, stepper, generateBtn);
    controls.append(randomBtn, roundsGroup);

    const content = create('div', 'content content-2v2');
    const grid = create('div', 'grid-2v2');

    MISSIONS.forEach((mission) => {
      const card = create('button', 'mission-chip-2v2', {
        type: 'button',
        'data-mission': mission,
        'aria-label': mission
      });
      const title = create('span', 'mission-chip-2v2__label', { text: mission });
      const badge = create('span', 'badge', {
        'aria-hidden': 'true',
        style: { display: 'none' }
      });
      card.append(title, badge);
      grid.appendChild(card);
      missionEntries.set(mission, { button: card, badge });
    });

    content.appendChild(grid);

    const footer = create('footer', 'footer');
    const matchedBtn = create('button', 'btn-footer', {
      type: 'button',
      'data-action': 'to-matched',
      'data-i18n': 'missions',
      'data-i18n-aria': 'missions'
    });
    matchedBtn.textContent = 'Misiones Matched Play';
    const backBtn = create('button', 'btn-footer', {
      type: 'button',
      'data-i18n': 'back',
      'aria-label': 'Volver al inicio'
    });
    footer.append(matchedBtn, backBtn);

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
      'data-i18n-aria': 'close',
      'aria-label': 'Cerrar modal'
    });
    const modalFrame = create('iframe', 'modal-iframe', {
      title: 'Vista previa del PDF de la misión',
      referrerpolicy: 'no-referrer',
      'aria-label': 'Contenido de la misión'
    });
    modalFrame.src = 'about:blank';
    modalCard.append(modalClose, modalFrame);
    modalBackdrop.appendChild(modalCard);

    screen.append(banner, controls, content, footer);
    phone.appendChild(screen);
    stage.append(phone, modalBackdrop);
    root.appendChild(stage);

    Object.assign(elements, {
      brand,
      flagEs,
      flagEn,
      randomBtn,
      roundsGroup,
      roundsLabel,
      decBtn,
      incBtn,
      roundsInput,
      generateBtn,
      matchedBtn,
      backBtn,
      grid,
      modalBackdrop,
      modalClose,
      modalFrame
    });
  }

  function renderStrings() {
    const strings = LobeliaI18n.getStrings(state.lang);
    doc.documentElement.lang = state.lang;
    doc.title = strings.missions_2v2_title || strings.missions_title;

    elements.brand.textContent = strings.brand;
    elements.flagEs.setAttribute('aria-label', strings.lang_es_aria);
    elements.flagEn.setAttribute('aria-label', strings.lang_en_aria);
    elements.randomBtn.textContent = strings.random;
    elements.roundsGroup.setAttribute('aria-label', strings.rounds_group);
    elements.roundsLabel.textContent = strings.rounds;
    elements.decBtn.setAttribute('aria-label', strings.stepper_dec);
    elements.incBtn.setAttribute('aria-label', strings.stepper_inc);
    elements.roundsInput.setAttribute('aria-label', strings.rounds);
    elements.generateBtn.textContent = strings.generate;
    elements.matchedBtn.textContent = strings.missions || 'Misiones Matched Play';
    elements.matchedBtn.setAttribute('aria-label', strings.missions || 'Misiones Matched Play');
    elements.backBtn.textContent = strings.back;
    elements.modalClose.textContent = strings.close;
  }

  function updateSelectedButton() {
    missionEntries.forEach(({ button }, mission) => {
      button.classList.toggle('selected', mission === state.selected);
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
    const shuffled = [...MISSIONS];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, total);
    const nextBadges = {};
    selected.forEach((mission, index) => {
      nextBadges[mission] = index + 1;
    });
    state.badges = nextBadges;
    state.selected = selected[selected.length - 1] || '';
    updateBadges();
    updateSelectedButton();
  }

  async function handleMissionClick(mission) {
    if (!mission) {
      return;
    }
    const strings = LobeliaI18n.getStrings(state.lang);
    const pdfName = `${mission.toUpperCase()}.pdf`;
    const pdfUrl = new URL(PDF_DIRECTORY + pdfName, window.location.href).href;

    try {
      let response = await fetch(pdfUrl, { method: 'HEAD', cache: 'no-store' });
      if (!response.ok && response.status === 405) {
        response = await fetch(pdfUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          cache: 'no-store'
        });
      }
      if (response.ok) {
        elements.modalFrame.src = `${pdfUrl}#toolbar=0&navpanes=0`;
        elements.modalBackdrop.style.display = 'flex';
        elements.modalBackdrop.setAttribute('aria-hidden', 'false');
        state.selected = mission;
        updateSelectedButton();
        return;
      }
    } catch (error) {
      console.warn('PDF lookup failed', error);
    }

    alert(strings.pdf_missing);
  }

  function closeModal() {
    elements.modalBackdrop.style.display = 'none';
    elements.modalBackdrop.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      elements.modalFrame.src = 'about:blank';
    }, 200);
  }

  function recalcSizes() {
    elements.grid?.style.setProperty('--cols', '2');
  }

  function setLang(lang) {
    state.lang = LobeliaI18n.normaliseLang(lang);
    LobeliaI18n.setStoredLang(state.lang);
    renderStrings();
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
    elements.matchedBtn.addEventListener('click', () => {
      window.location.href = './MisionesMatched.html';
    });

    missionEntries.forEach(({ button }, mission) => {
      button.addEventListener('click', () => handleMissionClick(mission));
    });

    elements.modalBackdrop.addEventListener('click', closeModal);
    elements.modalClose.addEventListener('click', closeModal);
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
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && elements.modalBackdrop.style.display !== 'none') {
        closeModal();
      }
    });
  }

  buildLayout();
  renderStrings();
  updateSelectedButton();
  updateBadges();
  initEventHandlers();
  recalcSizes();
})();
