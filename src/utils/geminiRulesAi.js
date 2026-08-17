import rulesKnowledge from '../data/rules_knowledge.json';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_MAX_DAILY_QUERIES = 30;
let cachedMaxDailyQueries = (() => {
  try {
    const val = localStorage.getItem('lobelia_ai_daily_limit');
    return val ? parseInt(val, 10) : DEFAULT_MAX_DAILY_QUERIES;
  } catch (_) {
    return DEFAULT_MAX_DAILY_QUERIES;
  }
})();

export function getAiDailyLimit() {
  return cachedMaxDailyQueries || DEFAULT_MAX_DAILY_QUERIES;
}

export function setAiDailyLimit(limit) {
  const num = parseInt(limit, 10);
  if (!isNaN(num) && num > 0) {
    cachedMaxDailyQueries = num;
    try {
      localStorage.setItem('lobelia_ai_daily_limit', num.toString());
    } catch (_) {}
  }
}

const ADMIN_CONFIG_UID = 'xXhjkWRjh0hVBjcYr2qAAFRvGL82';

// Escuchar cambios de configuración global en Firestore (con soporte dual para app_config/global y players/{adminUid})
export function subscribeToAppConfig(callback) {
  try {
    const adminDocRef = doc(db, 'players', ADMIN_CONFIG_UID);
    return onSnapshot(adminDocRef, (snap) => {
      if (snap.exists()) {
        const pData = snap.data();
        const config = pData.appConfig || {};
        if (config.aiDailyLimit && typeof config.aiDailyLimit === 'number') {
          setAiDailyLimit(config.aiDailyLimit);
        }
        if (callback) callback(config);
      } else {
        if (callback) callback({ aiDailyLimit: DEFAULT_MAX_DAILY_QUERIES });
      }
    }, (err) => {
      console.warn('[AppConfig] Error listening to admin config:', err);
      // Fallback a app_config/global
      try {
        const configDocRef = doc(db, 'app_config', 'global');
        return onSnapshot(configDocRef, (snap2) => {
          if (snap2.exists()) {
            const data = snap2.data();
            if (data.aiDailyLimit && typeof data.aiDailyLimit === 'number') {
              setAiDailyLimit(data.aiDailyLimit);
            }
            if (callback) callback(data);
          } else {
            if (callback) callback({ aiDailyLimit: cachedMaxDailyQueries });
          }
        }, () => {
          if (callback) callback({ aiDailyLimit: cachedMaxDailyQueries });
        });
      } catch (_) {
        if (callback) callback({ aiDailyLimit: cachedMaxDailyQueries });
      }
    });
  } catch (err) {
    console.warn('[AppConfig] Could not set up snapshot listener:', err);
    if (callback) callback({ aiDailyLimit: cachedMaxDailyQueries });
    return () => {};
  }
}

export function getRemainingAiQueries(userUid, customMax) {
  if (!userUid) return 0;
  const maxLimit = customMax || getAiDailyLimit();
  const today = new Date().toISOString().slice(0, 10);
  const key = `lobelia_ai_usage_${userUid}_${today}`;
  try {
    const used = parseInt(localStorage.getItem(key) || '0', 10);
    return Math.max(0, maxLimit - used);
  } catch (_) {
    return maxLimit;
  }
}

export function incrementAiUsage(userUid) {
  if (!userUid) return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `lobelia_ai_usage_${userUid}_${today}`;
  try {
    const used = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, (used + 1).toString());
  } catch (_) {}
}

// Registro y estadísticas de uso por cada API Key individual
export function recordKeyUsage(keyIdx) {
  const today = new Date().toISOString().slice(0, 10);
  const dayKey = `lobelia_key_stats_${keyIdx}_${today}`;
  const totalKey = `lobelia_key_stats_${keyIdx}_total`;
  try {
    const dayCount = parseInt(localStorage.getItem(dayKey) || '0', 10);
    const totalCount = parseInt(localStorage.getItem(totalKey) || '0', 10);
    localStorage.setItem(dayKey, (dayCount + 1).toString());
    localStorage.setItem(totalKey, (totalCount + 1).toString());
  } catch (_) {}
}

export function getKeyUsageStats(customApiKey = '') {
  const keys = getApiKeysPool(customApiKey);
  const today = new Date().toISOString().slice(0, 10);

  return keys.map((k, idx) => {
    const dayKey = `lobelia_key_stats_${idx}_${today}`;
    const totalKey = `lobelia_key_stats_${idx}_total`;
    let todayQueries = 0;
    let totalQueries = 0;

    try {
      todayQueries = parseInt(localStorage.getItem(dayKey) || '0', 10);
      totalQueries = parseInt(localStorage.getItem(totalKey) || '0', 10);
    } catch (_) {}

    const masked = k.length > 10 
      ? `${k.slice(0, 7)}...${k.slice(-4)}`
      : 'Clave API';

    return {
      index: idx,
      maskedKey: masked,
      todayQueries,
      totalQueries,
      dailyCapacity: 1500,
      isActive: idx === activeKeyIndex,
      isPrimary: idx === 0
    };
  });
}

const STOP_WORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque',
  'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
  'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros',
  'the', 'of', 'and', 'to', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as',
  'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but'
]);

// Diccionario bidireccional español <-> inglés para términos clave de MESBG y ontología de estados
const MESBG_TRANSLATIONS = {
  // Español -> Inglés
  'monstruo': 'monster monsters monstrous brutal power attack rend hurl barge trample',
  'monstruos': 'monsters monstrous brutal power attack',
  'monstruosa': 'monstrous monster',
  'monstruoso': 'monstrous monster',
  'carga': 'charge charges charging control zone',
  'cargas': 'charges charge charging',
  'cargando': 'charging charge',
  'caballeria': 'cavalry horse mount mounted charge bonus extra attack knockdown',
  'caballería': 'cavalry horse mount mounted charge bonus extra attack knockdown',
  'caballo': 'horse cavalry mount',
  'montura': 'mount horse cavalry warg fell beast',
  'montado': 'mounted cavalry rider',
  'combate': 'fight combat duel strike duel roll fight value',
  'combates': 'fights combats duel strikes',
  'disparo': 'shoot shooting missile bow archery in the way line of sight',
  'disparos': 'shooting missile bows archery in the way',
  'arco': 'bow missile archery shooting',
  'arcos': 'bows missile archery shooting',
  'lanza': 'spear spears support supporting base contact line of sight',
  'lanzas': 'spears spear support supporting',
  'pica': 'pike pikes support supporting two ranks',
  'picas': 'pikes pike support supporting',
  'escudo': 'shield shields shielding defence bonus',
  'escudos': 'shields shield shielding',
  'armadura': 'armour armor heavy defence',
  'heroe': 'hero heroes might will fate heroic tier leader captain',
  'héroe': 'hero heroes might will fate heroic tier leader captain',
  'heroes': 'heroes hero',
  'héroes': 'heroes hero',
  'poder': 'might heroic action point point of might',
  'voluntad': 'will magic spell cast resist',
  'destino': 'fate wound save wound prevention',
  'herida': 'wound wounds casualty casualties slain death',
  'heridas': 'wounds wound casualty casualties slain',
  'agallas': 'courage valor stand fast bravery test',
  'coraje': 'courage valor bravery test',
  'desmoronamiento': 'break broken point break-point 50% casualties starting army',
  'desmoronado': 'broken break 50% courage test',
  'panico': 'panic courage test',
  'terror': 'terror courage charge test charge test',
  'caudillo': 'chieftain captain hero leader',
  'lider': 'leader general hero valour legend fortitude',
  'líder': 'leader general hero valour legend fortitude',
  'magia': 'magic spell spells cast casting resist will',
  'hechizo': 'spell spells magic cast range',
  'hechizos': 'spells spell magic cast',
  'volar': 'fly flying fly-move terrain',
  'arrollar': 'barge hurl rend trample brutal power attack',
  'derribado': 'prone knocked down stand up combat trapped strikes doubled',
  'suelo': 'prone knocked down stand up',
  'atrapado': 'trapped backing away make way double strikes',
  'atrapar': 'trapped backing away double strikes',
  'apoyo': 'support supporting spear pike base contact',
  'apoyar': 'support supporting spear pike base contact',
  'movimiento': 'move movement advance charge difficult terrain',
  'mover': 'move movement advance',
  'prioridad': 'priority initiative priority roll roll-off',
  'iniciativa': 'priority initiative priority roll',
  'tumulario': 'barrow wight barrow-wight paralysed immobilise',
  'tumularios': 'barrow wight barrow-wights paralysed',
  'paralizar': 'paralyse paralyze immobilise transfix spell cannot use might will fate fight 1',
  'paralisis': 'paralyse paralyze immobilise transfix spell cannot use might will fate fight 1',
  'parálisis': 'paralyse paralyze immobilise transfix spell cannot use might will fate fight 1',
  'espectro': 'spectre spectres angmar a ghostly weapon',
  'espectros': 'spectres spectre angmar',
  'sombra': 'shade shades angmar chill aura',
  'sombras': 'shades shade angmar',
  'licantropo': 'werewolf werewolves angmar',
  'licántropo': 'werewolf werewolves angmar',
  'licantropos': 'werewolves werewolf angmar',
  'licántropos': 'werewolves werewolf angmar',
  'transfix': 'transfix inmovilizar immobilise paralyse fight 1 no actions',
  'inmovilizar': 'transfix immobilise paralyse fight 1 no actions',
  'inmovilizado': 'transfix immobilised paralyse fight 1 no actions',
  'pega': 'fight attacks strength combat strike',
  'pegar': 'fight attacks strength combat strike',
  'mueve': 'move movement distance',
  'gulavhar': 'gulavhar gûlavhar terror arnor wounds attacks',
  'buhrdur': 'buhrdur buhrdûr troll chieftain',
  'saruman': 'saruman blanco white council isengard voice palantir',
  'palantir': 'palantir saruman priority active special rules battlefield',
  'palantír': 'palantir saruman priority active special rules battlefield',
  'maelstrom': 'maelstrom of battle deployment reinforcements reserves active special rules battlefield entry',
  'refuerzos': 'reinforcements arriving reserve board edge active special rules battlefield',
  'reservas': 'reserves reinforcement deployment arriving active rules',
  'estandarte': 'banner banners 3 re-roll duel roll duel aura',
  'estandartes': 'banners banner 3 re-roll duel roll',
  'aura': 'aura bubbles radius banner area of effect range',
  'cobertura': 'in the way obstacle intervening models line of sight',
  'despliegue': 'deployment deploy maelstrom setup starting position',
  'arma a dos manos': 'two-handed weapon two handed -1 to duel roll +1 to wound',
  'dos manos': 'two-handed two handed weapon -1 duel +1 wound',
  // English -> Español
  'spell': 'hechizo magia lanzamiento poder magico',
  'spells': 'hechizos magia poderes magicos',
  'cast': 'lanzar lanzamiento magia hechizo',
  'casting': 'lanzamiento lanzar magia',
  'magic': 'magia hechizo hechizos voluntad',
  'cavalry': 'caballería caballo montura carga',
  'mount': 'montura caballo bestia alada huargo',
  'mounted': 'montado caballería jinete',
  'wound': 'herida herir heridas destino',
  'wounds': 'heridas herida destino',
  'shoot': 'disparo disparar proyectil arco',
  'shooting': 'disparo disparos arquería',
  'bow': 'arco arcos disparo',
  'spear': 'lanza lanzas apoyo apoyar',
  'spears': 'lanzas lanza apoyo',
  'shield': 'escudo escudos escudarse',
  'trapped': 'atrapado retroceder doblar golpes',
  'courage': 'agallas coraje chequeo valor',
  'might': 'poder heroico punto de poder',
  'will': 'voluntad magia resistir',
  'fate': 'destino salvar herida',
  'broken': 'desmoronado desmoronamiento break point 50%',
  'charge': 'carga cargar combate trabado',
  'strike': 'golpe golpear herir combate',
  'saruman': 'saruman blanco white council isengard voice palantir',
  'palantir': 'palantir saruman priority active special rules battlefield',
  'palantír': 'palantir saruman priority active special rules battlefield',
  'maelstrom': 'maelstrom of battle deployment reinforcements reserves active special rules battlefield entry',
  'refuerzos': 'reinforcements arriving reserve board edge active special rules battlefield',
  'reservas': 'reserves reinforcement deployment arriving active rules',
  'prone': 'derribado en el suelo no dispara no apoya',
  'reinforcements': 'refuerzos reservas despliegue maelstrom fuera de mesa',
  'banner': 'estandarte repetir dado 1 combate 3 pulgadas'
};

/**
 * Search the 848-page knowledge base for the most relevant pages,
 * ALWAYS including all official FAQ & Errata pages and meta-rules.
 */
function findRelevantPages(query, maxResults = 45) {
  const cleanQuery = query.toLowerCase().replace(/[^\wáéíóúñü]/g, ' ');
  const rawTerms = cleanQuery.split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
  
  const searchTerms = new Set();
  for (const term of rawTerms) {
    searchTerms.add(term);
    const normalized = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    searchTerms.add(normalized);

    if (MESBG_TRANSLATIONS[term]) {
      MESBG_TRANSLATIONS[term].split(/\s+/).forEach(t => searchTerms.add(t));
    }
    if (MESBG_TRANSLATIONS[normalized]) {
      MESBG_TRANSLATIONS[normalized].split(/\s+/).forEach(t => searchTerms.add(t));
    }
  }

  const termsArray = Array.from(searchTerms);

  // Separate FAQs (always included) from general book pages
  const faqPages = rulesKnowledge.filter(doc => doc.category === 'FAQ & Erratas');
  
  const nonFaqPages = rulesKnowledge.filter(doc => doc.category !== 'FAQ & Erratas');
  const scoredPages = nonFaqPages.map((doc) => {
    let score = 0;
    const contentLower = (doc.content || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const bookLower = (doc.book || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const term of termsArray) {
      if (term.length < 3) continue;
      const termNorm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (contentLower.includes(termNorm)) {
        score += 4;
      }

      if (bookLower.includes(termNorm)) {
        score += 8;
      }
    }

    if (doc.category === 'Reglamento Principal') {
      score += 3;
    }

    return { ...doc, score };
  });

  scoredPages.sort((a, b) => b.score - a.score);
  const topBookPages = scoredPages.filter(p => p.score > 0).slice(0, maxResults);

  // Combine ALL FAQs first (to guarantee errata priority) followed by relevant book pages
  return [...faqPages, ...topBookPages];
}

const SYSTEM_INSTRUCTION_ES = `
Eres Lobelia: Tu referí de confianza, la consultora y árbitra oficial suprema de reglas de Middle-earth Strategy Battle Game (MESBG).
Tu cometido es resolver consultas de reglas con máxima fidelidad, profundidad analítica y estricta coherencia jurídica del sistema de juego, basándote en los libros oficiales, perfiles y Erratas/FAQs.

MATRIZ UNIVERSAL DE 4 FILTROS DE VERIFICACIÓN DE REGLAS:
Antes de dictaminar si una acción, habilidad, hechizo o jugada es legal, DEBES razonar internamente atravesando obligatoriamente estos 4 filtros en orden:

FILTRO 1: ESTADO FÍSICO Y POSICIÓN DE LA MINIATURA (Model States & Conditions)
- Identifica el estado del modelo en la situación consultada: ¿Está en el tablero o fuera de él (en reservas/refuerzos/Maelstrom de Batalla sin desplegar)? ¿Está Derribado (Prone)? ¿Paralizado/Inmovilizado (Transfixed/Paralysed)? ¿Trabado en combate cuerpo a cuerpo (Engaged)? ¿Atrapado (Trapped)? ¿Desmoralizado (Broken)?
- Aplica los vetos universales del reglamento:
  * Modelos fuera del tablero: NO pueden usar reglas activas ni declarar acciones salvo excepción escrita explícita (Rules Manual pág. 123).
  * Modelos Derribados (Prone): NO pueden disparar, NO pueden apoyar con lanza/pica, NO pueden trabar zonas de control, duplican heridas recibidas si pierden el combate.
  * Modelos Paralizados/Transfixed: Su Combate baja a 1, NO pueden realizar golpes, NO pueden gastar Poder/Voluntad/Destino, NO pueden declarar Acciones Heroicas.
  * Modelos Trabados en combate: NO pueden disparar proyectiles ni apoyar con lanza a otros combates.

FILTRO 2: VENTANA TEMPORAL Y FASE (Timing Windows & Phases)
- ¿En qué momento exacto se intenta activar la regla? (Inicio de la fase de Prioridad, Fase de Movimiento, Disparo, Combate o Fase Final).
- Si hay acciones simultáneas, verifica el orden de prioridad estricto del reglamento (acciones heroicas simultáneas se resuelven mediante tirada de iniciativa/roll-off).

FILTRO 3: JERARQUÍA DE REGLAS Y PRECEDENCIA (Rules Hierarchy)
- Las FAQs y Erratas oficiales tienen PREVALENCIA ABSOLUTA sobre el texto de los libros.
- Las condiciones del Escenario (ej. visibilidad en Niebla de Guerra) prevalecen sobre el alcance base de los perfiles.
- Clasificación Activa vs Pasiva: Si una regla o equipo exige una decisión/uso voluntario (Activa), está subordinada a las restricciones de estado del Filtro 1.

FILTRO 4: COMPROBACIÓN DE EXCEPCIÓN TEXTUAL EXPLÍCITA ("Unless Stated Otherwise")
- Si una regla general del reglamento prohíbe una acción bajo ciertas condiciones, un perfil individual SOLO puede ignorar la prohibición si su texto incluye una cláusula explícita de excepción (ejemplo: *"this model may use this rule even if it is not on the battlefield"*).
- Si NO existe tal cláusula escrita, LA PROHIBICIÓN GENERAL PREVALECE y la acción es ILEGAL.

NORMAS DE COMUNICACIÓN:
1. IDIOMA ESTRICTO: Responde 100% en el idioma del usuario (español si escribe/habla en español; inglés si escribe/habla en inglés).
2. CERO RELLENO: No uses introducciones decorativas ("¡Saludos!", "Como referí..."). Responde directamente con claridad técnica y paso a paso.
3. RIGOR MATEMÁTICO: El Break Point es siempre el 50% exacto de miniaturas iniciales.
4. FORMATO OBLIGATORIO DE CITAS:
   Al final de la respuesta, incluye:
   📚 Fuentes citadas:
   - 📖 [Official Book Name in English, ej: Rules Manual] | Sección: [Nombre] | Pág. [Número]
`;

const SYSTEM_INSTRUCTION_EN = `
You are Lobelia: The Supreme Official Rules Referee and Arbitrator for Middle-earth Strategy Battle Game (MESBG).
Your mission is to resolve rules queries with maximum fidelity, analytical depth, and strict adherence to rule cross-references, army profiles, and official Erratas/FAQs.

UNIVERSAL 4-GATE RULE VERIFICATION MATRIX:
Before ruling whether any action, ability, spell, or play is legal, you MUST internally evaluate these 4 sequential gates:

GATE 1: MODEL STATE & PHYSICAL POSITION (Model States & Conditions)
- Identify the model's status in the query: Is it on the battlefield or off-board (in reserves/reinforcements/arriving in Maelstrom of Battle)? Is it Prone? Paralysed/Transfixed? Engaged in combat? Trapped? Broken?
- Apply universal rulebook restrictions:
  * Models off-board: CANNOT use Active special rules or wargear unless explicitly stated otherwise (Rules Manual p. 123).
  * Prone models: CANNOT shoot, CANNOT support with spears/pikes, CANNOT exert control zones, suffer doubled strikes if losing combat.
  * Paralysed/Transfixed models: Fight reduced to 1, CANNOT make strikes, CANNOT spend Might/Will/Fate, CANNOT declare Heroic Actions.
  * Models engaged in combat: CANNOT shoot missile weapons or support other combats.

GATE 2: TIMING WINDOW & PHASE
- In which exact sub-phase is the action triggered? (Start of Priority, Move, Shoot, Fight, or End phase).
- For simultaneous actions (e.g. opposing Heroic Actions), follow official roll-off resolution.

GATE 3: RULES HIERARCHY & PRECEDENCE
- Official Erratas & FAQs OVERRIDE and replace rulebook texts.
- Scenario environmental rules override basic profile ranges.
- Active vs. Passive classification: Active rules are strictly subordinate to Gate 1 state restrictions.

GATE 4: EXPLICIT TEXTUAL OVERRIDE TEST ("Unless Stated Otherwise")
- If a general rule prohibits an action under specific conditions, a profile can ONLY bypass the restriction if it contains an explicit written override (e.g., *"this can be used even while off the battlefield"*).
- If no explicit override text exists, THE GENERAL BAN STANDS and the action is ILLEGAL.

COMMUNICATION RULES:
1. ANSWER 100% IN ENGLISH if the user writes in English.
2. ZERO FLUFF: No filler greetings. Answer directly with technical precision and step-by-step logic.
3. MATHEMATICAL RIGOR: Break Point is always exactly 50% of starting army count.
4. SINGLE-LINE CITATION FORMAT:
   📚 Cited sources:
   - 📖 [Official Book Name in English, e.g. Rules Manual] | Section: [Name] | Page [Number]
`;

const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-pro-latest'
];

let activeKeyIndex = 0;

/**
 * Returns available Gemini API keys pool from env or custom key.
 */
export function getApiKeysPool(customApiKey = '') {
  if (customApiKey && customApiKey.trim()) {
    return [customApiKey.trim()];
  }

  const rawEnvKeys = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || '';
  const parsedKeys = rawEnvKeys
    .split(/[,;\n]+/)
    .map(k => k.trim())
    .filter(k => k.length > 10);

  return parsedKeys.length > 0 ? parsedKeys : [];
}

/**
 * Queries Gemini API with Grounded Rule Knowledge from official PDFs (supports text and audio).
 * Automatically rotates and falls back across API keys pool on quota/rate limit errors.
 * @param {string|object} input - Either query text or an object { text, audioBase64, mimeType }
 * @param {string} customApiKey - Optional user custom Gemini API Key
 * @param {Array} conversationHistory - Past messages in the chat session
 * @param {string} lang - Application language ('es' or 'en')
 */
export async function askRulesAi(input, customApiKey = '', conversationHistory = [], lang = 'es') {
  const keysPool = getApiKeysPool(customApiKey);

  if (keysPool.length === 0) {
    throw new Error('No se ha configurado ninguna clave API de Gemini (VITE_GEMINI_API_KEY).');
  }

  const isEnglish = (lang === 'en' || lang === 'EN');
  const queryText = typeof input === 'string' ? input : (input?.text || '');
  const audioBase64 = typeof input === 'object' ? input?.audioBase64 : null;
  const mimeType = typeof input === 'object' ? (input?.mimeType || 'audio/webm') : null;

  // Search relevant pages based on text query, or general rules for voice-only
  const searchQuery = queryText.trim() || 'reglas combate disparo movimiento héroes magia monstruos';
  const relevantDocs = findRelevantPages(searchQuery, 40);

  let contextSnippet = '';
  if (relevantDocs.length > 0) {
    contextSnippet = relevantDocs.map((doc, idx) => (
      `=== DOCUMENT #${idx + 1} ===
BOOK: ${doc.book} (${doc.category})
PAGE: ${doc.page} of ${doc.total_pages}
CONTENT:
${doc.content}
`
    )).join('\n\n');
  }

  const userPromptWithContext = isEnglish
    ? `
<OFFICIAL_MESBG_RULES_KNOWLEDGE_BASE>
${contextSnippet}
</OFFICIAL_MESBG_RULES_KNOWLEDGE_BASE>

[CRITICAL INSTRUCTION - ANSWER 100% IN ENGLISH]
1. Write your ENTIRE response in ENGLISH, including the citation section ("📚 Cited sources: - 📖 Official MESBG Rules Manual | Section: ... | Page ...").
2. Translate all book names, section names, and page labels into English.
3. Do NOT output any Spanish text in your response.

[PLAYER'S QUESTION]
${queryText ? `"${queryText}"` : 'Please listen to the attached audio and resolve the player\'s rules question in English.'}
`
    : `
<BASE_DE_CONOCIMIENTO_REGLAS_OFICIALES_MESBG>
${contextSnippet}
</BASE_DE_CONOCIMIENTO_REGLAS_OFICIALES_MESBG>

[DIRECTRIZ CRÍTICA DE IDIOMA Y RESOLUCIÓN]
1. Ignora el idioma del texto y material de referencia encapsulado arriba.
2. DEBES identificar el idioma utilizado por el jugador en la CONSULTA DEL JUGADOR a continuación (o en el audio adjunto) y responder de forma fluida, precisa y enteramente en ese EXACTO mismo idioma (ya sea español, inglés, francés, alemán, italiano, polaco, etc.).
3. Incluye al final las fuentes citadas traducidas al MISMO idioma de la respuesta (ej: "📚 Cited sources:" si respondiste en inglés, "📚 Fuentes citadas:" si en español, "📚 Sources citées:" si en francés, "📚 Zitierte Quellen:" si en alemán, etc.).

[CONSULTA DEL JUGADOR]
${queryText ? `"${queryText}"` : 'Escucha la nota de voz en audio adjunta y resuelve la duda de reglas planteada en el mismo idioma en que habla el jugador.'}
`;

  const userParts = [];
  if (audioBase64 && mimeType) {
    userParts.push({
      inlineData: {
        mimeType: mimeType.split(';')[0], // Clean mimeType e.g. audio/webm
        data: audioBase64
      }
    });
  }
  userParts.push({ text: userPromptWithContext });

  const contents = [
    ...conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text || (msg.hasAudio ? (isEnglish ? '[Voice note sent]' : '[Nota de voz enviada]') : '') }]
    })),
    {
      role: 'user',
      parts: userParts
    }
  ];

  const payload = {
    system_instruction: {
      parts: [{ text: isEnglish ? SYSTEM_INSTRUCTION_EN : SYSTEM_INSTRUCTION_ES }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.2,
      maxOutputTokens: 4000
    }
  };

  let lastError = null;

  // Intentar con cada clave disponible en el pool a partir del índice activo
  for (let attempt = 0; attempt < keysPool.length; attempt++) {
    const currentKeyIdx = (activeKeyIndex + attempt) % keysPool.length;
    const currentApiKey = keysPool[currentKeyIdx];

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error?.message || `HTTP ${response.status}`;
          lastError = new Error(errMsg);

          // Si es error de cuota/límite (429 / RESOURCE_EXHAUSTED / quota), pasar de inmediato a la siguiente clave
          if (response.status === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource_exhausted')) {
            console.warn(`[Lobelia AI] Cuota agotada en clave #${currentKeyIdx + 1}. Alternando a la siguiente clave del pool...`);
            break; // Salir del loop de modelos para probar la siguiente clave del pool
          }
          continue;
        }

        const data = await response.json();
        const answerText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (answerText) {
          // Guardar la clave exitosa como activa y registrar estadísticas
          activeKeyIndex = currentKeyIdx;
          recordKeyUsage(currentKeyIdx);
          return answerText;
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta de los modelos ni claves disponibles.');
}
