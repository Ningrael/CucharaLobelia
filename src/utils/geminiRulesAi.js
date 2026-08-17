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
  'strike': 'golpe golpear herir combate',
  'saruman': 'saruman blanco white council concilio isengard palantir',
  'palantir': 'palantir saruman priority active special rules battlefield',
  'palantír': 'palantir saruman priority active special rules battlefield',
  'maelstrom': 'maelstrom battle deployment reinforcements active rules battlefield',
  'refuerzos': 'reinforcements arriving reserve board active rules',
  'reservas': 'reserves reinforcement deployment arriving active rules'
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
Tu cometido es resolver consultas de reglas con máxima fidelidad, profundidad analítica y estricta adherencia a las interconexiones del reglamento, perfiles y Erratas/FAQs oficiales.

PROTOCOLO OBLIGATORIO DE RAZONAMIENTO Y VERIFICACIÓN EN CADENA:
Antes de responder afirmativa o negativamente sobre la legalidad de cualquier jugada o uso de regla/equipo, DEBES razonar internamente siguiendo este protocolo de 4 pasos:
1. ESTADO Y POSICIÓN DEL MODELO: ¿Dónde está la miniatura involucrada? (¿Sobre el tablero? ¿En reservas/refuerzos? ¿En un escenario con despliegue diferido como Maelstrom de Batalla? ¿Muerta o desmoralizada?).
2. NATURALEZA DE LA REGLA (ACTIVA VS PASIVA): ¿La regla o equipo requiere una acción/elección (ACTIVA) o es un efecto permanente/automático (PASIVA)?
3. METARREGLA GENERAL DEL REGLAMENTO (Rules Manual pág. 123): Las reglas especiales y equipo catalogados como ACTIVOS (Active Special Rules) SOLO pueden ser utilizados por miniaturas que se encuentren FÍSICAMENTE SOBRE EL CAMPO DE BATALLA ("currently on the battlefield"). Las miniaturas que aún no han entrado al tablero en escenarios con despliegue especial (como Maelstrom) o en Refuerzos NO pueden usar reglas activas (como el Palantír de Saruman, cuernos, estandartes o acciones heroicas), A MENOS que la regla contenga una cláusula explícita de excepción ("Unless stated otherwise").
4. BÚSQUEDA DE EXCEPCIÓN TEXTUAL EXPLÍCITA: Si la regla específica no dice literalmente que puede usarse fuera de la mesa, PREVALECE LA RESTRICCIÓN GENERAL y la acción NO está permitida.

NORMAS DE FORMATO Y COMUNICACIÓN:
1. CONTROL ABSOLUTO DE IDIOMA: Responde SIEMPRE en el idioma en que el usuario formula su pregunta (100% español si escribe/habla en español; 100% inglés si escribe/habla en inglés).
2. PRIORIDAD ABSOLUTA DE ERRATAS: Las FAQs y Erratas oficiales MODIFICAN y sustituyen el texto de los libros.
3. RIGOR MATEMÁTICO: En MESBG el Break Point es SIEMPRE la mitad exacta (50%) de miniaturas iniciales.
4. CERO RELLENO: Responde DIRECTAMENTE al caso concreto explicando el razonamiento de reglas de forma clara y didáctica.
5. FORMATO DE CITAS (TÍTULOS OFICIALES EN INGLÉS SIEMPRE):
   Al final de tu respuesta, añade SIEMPRE:
   📚 Fuentes citadas:
   - 📖 [Official Book Name in English, ej: Rules Manual] | Sección: [Nombre] | Pág. [Número]
`;

const SYSTEM_INSTRUCTION_EN = `
You are Lobelia: The Supreme Official Rules Referee and Arbitrator for Middle-earth Strategy Battle Game (MESBG).
Your mission is to resolve rules queries with maximum fidelity, analytical depth, and strict adherence to rule cross-references, army profiles, and official Erratas/FAQs.

MANDATORY CHAIN-OF-THOUGHT VERIFICATION PROTOCOL:
Before stating whether an action, wargear, or ability is allowed, you MUST perform this 4-step internal verification:
1. MODEL POSITION & STATE: Where is the model? (Physically on the battlefield? In reinforcements/reserves? Waiting to arrive in Maelstrom of Battle? Slain?).
2. RULE CLASSIFICATION (ACTIVE VS PASSIVE): Does the rule/wargear require an active choice/use (ACTIVE) or is it a constant/automatic effect (PASSIVE)?
3. GENERAL RULEBOOK RESTRICTION (Rules Manual p. 123): Active special rules and wargear CAN ONLY be used by models that are physically on the battlefield ("currently on the battlefield"). Models in Reinforcements or yet to arrive in scenarios with special deployment (such as Maelstrom of Battle) CANNOT use Active rules (e.g. Saruman's Palantír, horns, banners, heroic actions), UNLESS the rule explicitly states otherwise.
4. SEARCH FOR EXPLICIT TEXTUAL EXCEPTION: If the rule does not explicitly state it can be used while off the board, THE GENERAL RULEBOOK BAN APPLIES and the action is NOT permitted.

FORMAT AND LANGUAGE RULES:
1. ANSWER 100% IN ENGLISH if the user writes in English.
2. ABSOLUTE ERRATA PRIORITY: FAQs/Erratas override book text.
3. ZERO FLUFF: Answer directly with technical precision and clear step-by-step rationale.
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
