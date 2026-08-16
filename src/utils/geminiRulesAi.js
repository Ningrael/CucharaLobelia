import rulesKnowledge from '../data/rules_knowledge.json';

const MAX_DAILY_QUERIES = 30;

export function getRemainingAiQueries(userUid) {
  if (!userUid) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const key = `lobelia_ai_usage_${userUid}_${today}`;
  try {
    const used = parseInt(localStorage.getItem(key) || '0', 10);
    return Math.max(0, MAX_DAILY_QUERIES - used);
  } catch (_) {
    return MAX_DAILY_QUERIES;
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

const STOP_WORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque',
  'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
  'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros',
  'the', 'of', 'and', 'to', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as',
  'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but'
]);

// Diccionario de equivalencias español -> inglés para términos clave de MESBG
const MESBG_TRANSLATIONS = {
  'monstruo': 'monster',
  'monstruos': 'monsters',
  'monstruosa': 'monstrous',
  'monstruoso': 'monstrous',
  'carga': 'charge',
  'cargas': 'charges',
  'cargando': 'charging',
  'caballeria': 'cavalry',
  'caballería': 'cavalry',
  'caballo': 'horse',
  'montura': 'mount',
  'montado': 'mounted',
  'combate': 'fight combat',
  'combates': 'fights combats',
  'disparo': 'shoot shooting',
  'disparos': 'shooting missile',
  'arco': 'bow',
  'arcos': 'bows',
  'lanza': 'spear',
  'lanzas': 'spears',
  'pica': 'pike',
  'picas': 'pikes',
  'escudo': 'shield',
  'escudos': 'shields',
  'armadura': 'armour armor',
  'heroe': 'hero',
  'héroe': 'hero',
  'heroes': 'heroes',
  'héroes': 'heroes',
  'poder': 'might',
  'voluntad': 'will',
  'destino': 'fate',
  'herida': 'wound',
  'heridas': 'wounds',
  'agallas': 'courage',
  'desmoronamiento': 'break broken point',
  'desmoronado': 'broken break',
  'panico': 'panic',
  'terror': 'terror',
  'caudillo': 'chieftain captain hero',
  'lider': 'leader general',
  'líder': 'leader general',
  'magia': 'magic spell cast',
  'hechizo': 'spell cast',
  'hechizos': 'spells',
  'volar': 'fly flying',
  'arrollar': 'barge hurl rend trample',
  'derribado': 'prone knocked down',
  'suelo': 'prone',
  'atrapado': 'trapped',
  'atrapar': 'trapped',
  'apoyo': 'support supporting',
  'apoyar': 'support',
  'movimiento': 'move movement',
  'mover': 'move',
  'prioridad': 'priority'
};

/**
 * Search the 650-page knowledge base for the most relevant pages,
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
    const contentLower = doc.content.toLowerCase();
    const bookLower = doc.book.toLowerCase();

    for (const term of termsArray) {
      if (term.length < 3) continue;

      if (contentLower.includes(term)) {
        score += 4;
      }

      if (bookLower.includes(term)) {
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

const SYSTEM_INSTRUCTION = `
Eres el árbitro y consultor oficial supremo de reglas de Middle-earth Strategy Battle Game (MESBG).
Tu cometido es resolver consultas de reglas con máxima fidelidad y precisión analítica, basándote en los textos de los libros oficiales, perfiles y Erratas/FAQs proporcionados.

NORMAS CRÍTICAS DE ARBITRAJE:
1. PRIORIDAD ABSOLUTA DE ERRATAS: Las FAQs y Erratas oficiales MODIFICAN y sustituyen el texto de los libros. Revisa SIEMPRE si la regla, habilidad o perfil consultado tiene una Errata y analiza minuciosamente todas sus condiciones y cláusulas (ej: restricciones como "if there are no other friendly models engaged in the same combat", cambios de redacción, etc.).
2. ANÁLISIS METICULOSO DE CONDICIONES: Comprueba si en la situación descrita por el jugador se cumplen TODAS las condiciones requeridas por la regla o si alguna restricción (como tener aliados en el mismo combate, estar trabado, tipos de tropa) anula la habilidad.
3. RIGOR MATEMÁTICO Y FIDELIDAD A LAS FÓRMULAS: Prohibido inventar o extrapolar porcentajes. En MESBG el Punto de Desmoronamiento (*Break Point*) es SIEMPRE igual a la MITAD (50%) del número inicial de miniaturas del ejército ("equal to half the number of models in your starting Army", Pág. 60 del Reglamento Oficial). No confundas jamás el Break Point (50% de bajas) con la condición de "Reducido al 25%". Realiza siempre los cálculos numéricos de forma exacta basándote estrictamente en el texto del reglamento.
4. SOPORTE DE NOTAS DE VOZ (AUDIO): Si el mensaje incluye una nota de voz o audio, escucha atentamente la pregunta hablada del jugador y responde directamente a su duda con la misma precisión técnica y reglas oficiales.
5. CERO RELLENO / DIRECTO AL GRANO: NO uses saludos ("¡Saludos!", "Como árbitro...", etc.), NO uses introducciones ni frases decorativas. Responde DIRECTAMENTE al caso concreto con claridad paso a paso.
6. FORMATO DE CITAS EN UNA SOLA LÍNEA: Al final de tu respuesta, añade SIEMPRE la sección "📚 Fuentes citadas:" con una línea por cada fuente consultada siguiendo exactamente esta estructura:
   - 📖 [Nombre del Libro] | Capítulo/Sección: [Nombre de la sección] | Pág. [Número]
`;

const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.6-flash'
];

/**
 * Queries Gemini API with Grounded Rule Knowledge from official PDFs (supports text and audio).
 * @param {string|object} input - Either query text or an object { text, audioBase64, mimeType }
 * @param {string} apiKey - Gemini API Key
 * @param {Array} conversationHistory - Past messages in the chat session
 */
export async function askRulesAi(input, apiKey, conversationHistory = []) {
  if (!apiKey) {
    throw new Error('No se ha configurado la clave API de Gemini (VITE_GEMINI_API_KEY).');
  }

  const queryText = typeof input === 'string' ? input : (input?.text || '');
  const audioBase64 = typeof input === 'object' ? input?.audioBase64 : null;
  const mimeType = typeof input === 'object' ? (input?.mimeType || 'audio/webm') : null;

  // Search relevant pages based on text query, or general rules for voice-only
  const searchQuery = queryText.trim() || 'reglas combate disparo movimiento héroes magia monstruos';
  const relevantDocs = findRelevantPages(searchQuery, 40);

  let contextSnippet = '';
  if (relevantDocs.length > 0) {
    contextSnippet = relevantDocs.map((doc, idx) => (
      `=== DOCUMENTO OFICIAL #${idx + 1} ===
LIBRO: ${doc.book} (${doc.category})
PÁGINA: ${doc.page} de ${doc.total_pages}
CONTENIDO:
${doc.content}
`
    )).join('\n\n');
  }

  const userPromptWithContext = `
FRAGMENTOS OFICIALES DE LOS LIBROS Y FAQS DE MESBG:
${contextSnippet}

${queryText ? `PREGUNTA ESCRITA DEL JUGADOR:\n"${queryText}"\n` : 'CONSULTA EN NOTA DE VOZ ADJUNTA:\nEscucha el audio adjunto y resuelve la duda de reglas que plantea el jugador.\n'}
Responde en español de forma directa, analizando todas las condiciones de las reglas y erratas oficiales aplicables, y añade al final las fuentes citadas en una sola línea por libro.
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
      parts: [{ text: msg.text || (msg.hasAudio ? '[Nota de voz enviada]' : '') }]
    })),
    {
      role: 'user',
      parts: userParts
    }
  ];

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
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

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(errorData.error?.message || `Error en modelo ${modelName} (${response.status})`);
        continue;
      }

      const data = await response.json();
      const answerText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (answerText) {
        return answerText;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta de los modelos disponibles.');
}
