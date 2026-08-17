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

// Diccionario bidireccional español <-> inglés para términos clave de MESBG
const MESBG_TRANSLATIONS = {
  // Español -> Inglés
  'monstruo': 'monster monsters monstrous',
  'monstruos': 'monsters monstrous',
  'monstruosa': 'monstrous monster',
  'monstruoso': 'monstrous monster',
  'carga': 'charge charges charging',
  'cargas': 'charges charge charging',
  'cargando': 'charging charge',
  'caballeria': 'cavalry horse mount mounted',
  'caballería': 'cavalry horse mount mounted',
  'caballo': 'horse cavalry mount',
  'montura': 'mount horse cavalry',
  'montado': 'mounted cavalry',
  'combate': 'fight combat duel strike',
  'combates': 'fights combats duel strikes',
  'disparo': 'shoot shooting missile bow archery',
  'disparos': 'shooting missile bows archery',
  'arco': 'bow missile archery',
  'arcos': 'bows missile archery',
  'lanza': 'spear spears support',
  'lanzas': 'spears spear support',
  'pica': 'pike pikes support',
  'picas': 'pikes pike support',
  'escudo': 'shield shields shielding',
  'escudos': 'shields shield shielding',
  'armadura': 'armour armor heavy',
  'heroe': 'hero heroes might will fate',
  'héroe': 'hero heroes might will fate',
  'heroes': 'heroes hero',
  'héroes': 'heroes hero',
  'poder': 'might heroic',
  'voluntad': 'will magic spell cast',
  'destino': 'fate wound save',
  'herida': 'wound wounds casualty casualties',
  'heridas': 'wounds wound casualty casualties',
  'agallas': 'courage valor stand fast',
  'coraje': 'courage valor bravery',
  'desmoronamiento': 'break broken point break-point 50%',
  'desmoronado': 'broken break 50%',
  'panico': 'panic courage',
  'terror': 'terror courage charge test',
  'caudillo': 'chieftain captain hero leader',
  'lider': 'leader general hero',
  'líder': 'leader general hero',
  'magia': 'magic spell spells cast casting',
  'hechizo': 'spell spells magic cast',
  'hechizos': 'spells spell magic cast',
  'volar': 'fly flying fly-move',
  'arrollar': 'barge hurl rend trample brutal',
  'derribado': 'prone knocked down',
  'suelo': 'prone',
  'atrapado': 'trapped backing away',
  'atrapar': 'trapped backing away',
  'apoyo': 'support supporting spear pike',
  'apoyar': 'support supporting spear pike',
  'movimiento': 'move movement advance charge',
  'mover': 'move movement',
  'prioridad': 'priority initiative',
  'tumulario': 'barrow wight barrow-wight',
  'tumularios': 'barrow wight barrow-wights',
  'paralizar': 'paralyse paralyze immobilise transfix',
  'paralisis': 'paralyse paralyze immobilise transfix',
  'parálisis': 'paralyse paralyze immobilise transfix',
  'espectro': 'spectre spectres angmar',
  'espectros': 'spectres spectre angmar',
  'sombra': 'shade shades angmar',
  'sombras': 'shades shade angmar',
  'licantropo': 'werewolf werewolves angmar',
  'licántropo': 'werewolf werewolves angmar',
  'licantropos': 'werewolves werewolf angmar',
  'licántropos': 'werewolves werewolf angmar',
  'transfix': 'transfix inmovilizar paralyse',
  'inmovilizar': 'transfix immobilise paralyse',
  'inmovilizado': 'transfix immobilised paralyse',
  'pega': 'fight attacks strength combat strike',
  'pegar': 'fight attacks strength combat strike',
  'mueve': 'move movement distance',
  'gulavhar': 'gulavhar gûlavhar terror arnor',
  'buhrdur': 'buhrdur buhrdûr troll chieftain',
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
  'monster': 'monstruo monstruos monstruosa arrollar brutal',
  'strike': 'golpe golpear herir combate',
  'saruman': 'saruman blanco white council concilio isengard'
};

/**
 * Search the 848-page knowledge base for the most relevant pages,
 * ALWAYS including all official FAQ & Errata pages.
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
Tu cometido es resolver consultas de reglas con máxima fidelidad y precisión analítica, basándote en los textos de los libros oficiales, perfiles y Erratas/FAQs proporcionados.

NORMAS CRÍTICAS DE IDIOMA Y ARBITRAJE:
1. CONTROL ABSOLUTO DE IDIOMA: Responde SIEMPRE en el idioma en que el usuario formula su pregunta. Si el usuario escribe o habla en español, responde 100% en español. Si el usuario escribe o habla en inglés, francés, alemán, italiano, etc., responde 100% en ese idioma.
2. PRIORIDAD ABSOLUTA DE ERRATAS: Las FAQs y Erratas oficiales MODIFICAN y sustituyen el texto de los libros. Revisa SIEMPRE si la regla, habilidad o perfil consultado tiene una Errata y analiza minuciosamente todas sus condiciones y cláusulas (ej: restricciones como "if there are no other friendly models engaged in the same combat", cambios de redacción, etc.).
3. ANÁLISIS METICULOSO DE CONDICIONES Y REGLAS ACTIVAS/PASIVAS:
   - Comprueba si en la situación descrita se cumplen TODAS las condiciones requeridas por la regla o si alguna restricción (estar trabado, tipos de tropa, etc.) anula la habilidad.
   - METARREGLA DE HABILIDADES ACTIVAS Y MODELOS FUERA DE LA MESA (Rules Manual pág. 123): Las reglas especiales y equipo catalogados como ACTIVOS (Active Special Rules) SOLO pueden utilizarse por miniaturas que se encuentren FÍSICAMENTE SOBRE EL CAMPO DE BATALLA ("currently on the battlefield"). Las miniaturas en Refuerzos, o que aún no han entrado a la mesa en escenarios con despliegues especiales como Maelstrom de Batalla (Maelstrom of Battle), NO pueden usar reglas activas (como el Palantír de Saruman, cuernos, estandartes o habilidades activas), A MENOS que el texto de la regla especifique explícitamente lo contrario ("Unless stated otherwise").
4. RIGOR MATEMÁTICO Y FIDELIDAD A LAS FÓRMULAS: Prohibido inventar o extrapolar porcentajes. En MESBG el Punto de Desmoronamiento (*Break Point*) es SIEMPRE igual a la MITAD (50%) del número inicial de miniaturas del ejército ("equal to half the number of models in your starting Army", Pág. 60 del Reglamento Oficial). No confundas jamás el Break Point (50% de bajas) con la condición de "Reducido al 25%". Realiza siempre los cálculos numéricos de forma exacta basándote estrictamente en el texto del reglamento.
5. SOPORTE DE NOTAS DE VOZ (AUDIO): Si el mensaje incluye una nota de voz o audio, escucha atentamente la pregunta hablada del jugador y responde directamente a su duda con la misma precisión técnica y reglas oficiales.
6. CERO RELLENO / DIRECTO AL GRANO: NO uses saludos ("¡Saludos!", "Como árbitro...", etc.), NO uses introducciones ni frases decorativas. Responde DIRECTAMENTE al caso concreto con claridad paso a paso.
7. ANULACIÓN DE HISTORIAL: Aunque los mensajes anteriores del chat estuviesen en otro idioma, si el mensaje actual es en otro idioma, responde en el idioma del mensaje actual.
8. FORMATO DE CITAS (TÍTULOS OFICIALES EN INGLÉS SIEMPRE):
   Al final de tu respuesta, añade SIEMPRE la sección de fuentes citadas. El nombre del libro debe ser SIEMPRE el oficial en inglés (ej: "Rules Manual", "Armies of the Lord of the Rings", "Armies of the Hobbit", "Matched Play Guide", "FAQ - Rules Manual", etc.):
   - Si respondes en español:
     📚 Fuentes citadas:
     - 📖 [Official Book Name in English, ej: Rules Manual] | Sección: [Nombre] | Pág. [Número]
   - Si respondes en inglés:
     📚 Cited sources:
     - 📖 [Official Book Name in English, e.g. Rules Manual] | Section: [Name] | Page [Number]
   - Si respondes en francés:
     📚 Sources citées:
     - 📖 [Official Book Name in English] | Section : [Nom] | Page [Numéro]
   - Si respondes en alemán:
     📚 Zitierte Quellen:
     - 📖 [Official Book Name in English] | Abschnitt: [Name] | Seite [Nummer]
`;

const SYSTEM_INSTRUCTION_EN = `
You are Lobelia: The Supreme Official Rules Referee and Arbitrator for Middle-earth Strategy Battle Game (MESBG).
Your mission is to resolve rules queries with maximum fidelity, analytical precision, and strict adherence to official rulebooks, army profiles, and Erratas/FAQs.

PRIMARY MANDATE ON LANGUAGE (CRITICAL):
1. The rules database context provided to you contains text from official rulebooks.
2. YOU MUST WRITE YOUR ENTIRE RESPONSE 100% IN ENGLISH, INCLUDING THE SOURCES CITATION SECTION ("📚 Cited sources:").
3. Translate all rules, spells, profiles, special rules, names, stats, and citation labels into English. Keep official book titles in English (e.g., "Rules Manual", "Armies of the Lord of the Rings", "Matched Play Guide").
4. NEVER output Spanish when the user writes in English.
5. If the user writes in French, answer 100% in French. If the user writes in German, answer 100% in German. If the user writes in Spanish, answer 100% in Spanish.
6. CONVERSATION HISTORY OVERRIDE: Even if previous messages in the chat were in Spanish, if the current question is in English (or if the application is set to English), you MUST immediately answer in English and NOT continue in Spanish.

CRITICAL REFEREE RULES:
1. ABSOLUTE PRIORITY OF ERRATAS: Official FAQs and Erratas OVERRIDE and replace book texts. ALWAYS check if the queried rule, special ability, or profile has an active Errata and carefully analyze all its clauses and conditions.
2. METICULOUS CONDITION ANALYSIS & ACTIVE/PASSIVE RULES META-RULE:
   - Check if ALL conditions required by the rule are met in the scenario described by the player, or if any restriction cancels the ability.
   - ACTIVE SPECIAL RULES & OFF-BOARD MODELS (Rules Manual p. 123): Active special rules and wargear CAN ONLY be used by models that are physically on the battlefield ("currently on the battlefield"). Models in Reinforcements or yet to arrive in scenarios with special deployment (such as Maelstrom of Battle) CANNOT use Active rules (e.g. Saruman's Palantír, war horns, active heroics), UNLESS the rule explicitly states otherwise.
3. MATHEMATICAL RIGOR AND FORMULA FIDELITY: In MESBG, the Break Point is ALWAYS equal to HALF (50%) of the starting number of models in the army ("equal to half the number of models in your starting Army", Page 60 of the Official Rules Manual). Never confuse Break Point (50% casualties) with "Quartered / Reduced to 25%".
4. VOICE NOTE (AUDIO) SUPPORT: If the message includes an audio/voice note, listen carefully to the player's spoken question and respond directly in the same language with full technical rules precision.
5. ZERO FLUFF / DIRECT TO THE POINT: Do NOT use greetings ("Greetings!", "As a referee...", etc.), do NOT use polite introductions or filler text. Answer DIRECTLY to the question with step-by-step clarity in English.
6. SINGLE-LINE CITATION FORMAT (OFFICIAL ENGLISH BOOK NAMES): At the very end of your response, ALWAYS include the "📚 Cited sources:" section with one line per consulted source:
   - 📖 [Official Book Name, e.g. Rules Manual] | Section/Chapter: [Section Name] | Page [Number]
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
