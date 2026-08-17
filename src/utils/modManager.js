// src/utils/modManager.js
// ─────────────────────────────────────────────────────────────────────────────
// Gestor del Sistema de Mods de La Cuchara de Lobelia.
// Permite instalar, cargar y activar mods de datos externos.
// La app NO contiene ningún dato de juego. Todo viene de mods externos.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

// ── SCHEMA VERSION ────────────────────────────────────────────────────────────
const SUPPORTED_SCHEMA_VERSION = '1.0';
const MOD_CACHE_PREFIX = 'lobelia_mod_';
const ACTIVE_MOD_KEY = 'lobelia_active_mod';

// ── CAMPOS REQUERIDOS DEL MOD ─────────────────────────────────────────────────
const REQUIRED_MOD_FIELDS = [
  'modId',
  'modName',
  'modVersion',
  'modAuthor',
  'gameSystem',
  'schemaVersion',
  'factions',
];

// ── VALIDACIÓN DE SCHEMA ──────────────────────────────────────────────────────

/**
 * Valida que un JSON tenga la estructura correcta de un Mod de Lobelia.
 * @param {object} modJson - El JSON del mod a validar
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateModSchema(modJson) {
  const errors = [];

  if (!modJson || typeof modJson !== 'object') {
    return { valid: false, errors: ['El mod no es un objeto JSON válido.'] };
  }

  // Campos requeridos
  for (const field of REQUIRED_MOD_FIELDS) {
    if (!modJson[field]) {
      errors.push(`Campo requerido ausente: "${field}".`);
    }
  }

  // Versión de schema compatible
  if (modJson.schemaVersion && modJson.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      `Versión de schema incompatible: "${modJson.schemaVersion}". ` +
      `Esta versión de Lobelia soporta schema "${SUPPORTED_SCHEMA_VERSION}".`
    );
  }

  // Validar que factions sea un array no vacío
  if (modJson.factions && !Array.isArray(modJson.factions)) {
    errors.push('"factions" debe ser un array.');
  } else if (modJson.factions && modJson.factions.length === 0) {
    errors.push('"factions" no puede estar vacío.');
  }

  // Validar estructura básica de cada facción
  if (Array.isArray(modJson.factions)) {
    modJson.factions.forEach((faction, idx) => {
      if (!faction.factionId) {
        errors.push(`La facción en índice ${idx} no tiene "factionId".`);
      }
      if (!faction.factionName) {
        errors.push(`La facción en índice ${idx} no tiene "factionName".`);
      }
      if (!['good', 'evil', 'neutral'].includes(faction.side)) {
        errors.push(
          `La facción "${faction.factionId}" tiene "side" inválido: "${faction.side}". ` +
          `Valores permitidos: "good", "evil", "neutral".`
        );
      }
      if (!Array.isArray(faction.models)) {
        errors.push(`La facción "${faction.factionId}" no tiene un array "models".`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ── CARGA DESDE URL ───────────────────────────────────────────────────────────

/**
 * Descarga un mod desde una URL pública y lo valida.
 * @param {string} url - URL del JSON del mod
 * @returns {Promise<{ success: boolean, mod: object|null, errors: string[] }>}
 */
export async function loadModFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return {
        success: false,
        mod: null,
        errors: [`No se pudo descargar el mod: HTTP ${response.status}`],
      };
    }

    let modJson;
    try {
      modJson = await response.json();
    } catch {
      return {
        success: false,
        mod: null,
        errors: ['El contenido de la URL no es un JSON válido.'],
      };
    }

    const validation = validateModSchema(modJson);
    if (!validation.valid) {
      return { success: false, mod: null, errors: validation.errors };
    }

    return { success: true, mod: modJson, errors: [] };
  } catch (err) {
    return {
      success: false,
      mod: null,
      errors: [`Error de red al descargar el mod: ${err.message}`],
    };
  }
}

// ── INSTALACIÓN DE MOD ────────────────────────────────────────────────────────

/**
 * Instala un mod para el usuario.
 * Guarda los metadatos en Firestore y el contenido completo en localStorage/IndexedDB.
 *
 * @param {string} userId - UID del usuario
 * @param {object} modJson - El JSON validado del mod
 * @param {string} sourceUrl - URL desde donde se descargó
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export async function installMod(userId, modJson, sourceUrl = '') {
  const validation = validateModSchema(modJson);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(' | ') };
  }

  try {
    // 1. Guardar metadatos en Firestore (sin el contenido completo para ahorrar espacio)
    const modMeta = {
      modId: modJson.modId,
      modName: modJson.modName,
      modVersion: modJson.modVersion,
      modAuthor: modJson.modAuthor,
      modDescription: modJson.modDescription || '',
      gameSystem: modJson.gameSystem,
      schemaVersion: modJson.schemaVersion,
      sourceUrl: sourceUrl || modJson.sourceUrl || '',
      factionCount: modJson.factions.length,
      factionNames: modJson.factions.map(f => f.factionName),
      imageBaseUrl: modJson.imageBaseUrl || '',
      installedAt: serverTimestamp(),
    };

    await setDoc(
      doc(db, 'players', userId, 'installedMods', modJson.modId),
      modMeta
    );

    // 2. Guardar el contenido completo del mod en localStorage (acceso rápido sin Firestore)
    // Para mods muy grandes, se podría usar IndexedDB en el futuro
    try {
      localStorage.setItem(
        `${MOD_CACHE_PREFIX}${modJson.modId}`,
        JSON.stringify(modJson)
      );
    } catch (storageErr) {
      // localStorage lleno — el mod estará solo en Firestore (carga más lenta)
      console.warn('localStorage lleno, el mod se cargará desde la URL cada vez:', storageErr);
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: `Error al guardar el mod: ${err.message}` };
  }
}

// ── OBTENER MODS INSTALADOS ───────────────────────────────────────────────────

/**
 * Devuelve la lista de mods instalados para un usuario (solo metadatos).
 * @param {string} userId - UID del usuario
 * @returns {Promise<object[]>} Array de metadatos de mods instalados
 */
export async function getInstalledMods(userId) {
  try {
    const snap = await getDocs(
      collection(db, 'players', userId, 'installedMods')
    );
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  } catch (err) {
    console.error('Error cargando mods instalados:', err);
    return [];
  }
}

// ── CARGAR CONTENIDO COMPLETO DEL MOD ────────────────────────────────────────

/**
 * Carga el contenido completo de un mod instalado (desde cache o URL).
 * @param {string} modId - ID del mod
 * @param {string} sourceUrl - URL de respaldo si no está en cache
 * @returns {Promise<object|null>} El JSON completo del mod, o null si falla
 */
export async function loadModContent(modId, sourceUrl = '') {
  // 1. Intentar desde localStorage (más rápido)
  try {
    const cached = localStorage.getItem(`${MOD_CACHE_PREFIX}${modId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Verificar que la cache no esté corrupta
      if (parsed?.modId === modId) return parsed;
    }
  } catch { /* cache corrupta, continuar */ }

  // 2. Si hay URL, descargarlo de nuevo
  if (sourceUrl) {
    const result = await loadModFromUrl(sourceUrl);
    if (result.success) {
      // Actualizar cache
      try {
        localStorage.setItem(`${MOD_CACHE_PREFIX}${modId}`, JSON.stringify(result.mod));
      } catch { /* ignorar error de storage */ }
      return result.mod;
    }
  }

  return null;
}

// ── MOD ACTIVO ────────────────────────────────────────────────────────────────

/**
 * Devuelve el ID del mod activo del usuario.
 * @param {string} userId - UID del usuario
 * @returns {string|null}
 */
export function getActiveModId(userId) {
  try {
    return localStorage.getItem(`${ACTIVE_MOD_KEY}_${userId}`) || null;
  } catch {
    return null;
  }
}

/**
 * Establece el mod activo del usuario.
 * @param {string} userId - UID del usuario
 * @param {string} modId - ID del mod a activar
 */
export function setActiveMod(userId, modId) {
  try {
    localStorage.setItem(`${ACTIVE_MOD_KEY}_${userId}`, modId);
  } catch (err) {
    console.error('Error guardando mod activo:', err);
  }
}

/**
 * Carga el contenido completo del mod activo del usuario.
 * @param {string} userId - UID del usuario
 * @returns {Promise<{ mod: object|null, modId: string|null, hasActiveMod: boolean }>}
 */
export async function getActiveMod(userId) {
  const modId = getActiveModId(userId);
  if (!modId) return { mod: null, modId: null, hasActiveMod: false };

  // Buscar metadatos para obtener la sourceUrl
  let sourceUrl = '';
  try {
    const metaDoc = await getDoc(doc(db, 'players', userId, 'installedMods', modId));
    if (metaDoc.exists()) {
      sourceUrl = metaDoc.data().sourceUrl || '';
    }
  } catch { /* continuar sin URL */ }

  const mod = await loadModContent(modId, sourceUrl);
  return { mod, modId, hasActiveMod: !!mod };
}

// ── DESINSTALAR MOD ───────────────────────────────────────────────────────────

/**
 * Desinstala un mod del usuario.
 * @param {string} userId - UID del usuario
 * @param {string} modId - ID del mod a desinstalar
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export async function uninstallMod(userId, modId) {
  try {
    // Eliminar de Firestore
    await deleteDoc(doc(db, 'players', userId, 'installedMods', modId));

    // Eliminar de localStorage
    try {
      localStorage.removeItem(`${MOD_CACHE_PREFIX}${modId}`);
    } catch { /* ignorar */ }

    // Si era el mod activo, dejar sin mod activo
    const activeModId = getActiveModId(userId);
    if (activeModId === modId) {
      try {
        localStorage.removeItem(`${ACTIVE_MOD_KEY}_${userId}`);
      } catch { /* ignorar */ }
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: `Error al desinstalar el mod: ${err.message}` };
  }
}

// ── BUSCAR MODELOS EN EL MOD ACTIVO ──────────────────────────────────────────

/**
 * Busca modelos en el contenido de un mod por nombre o facción.
 * @param {object} modData - El JSON completo del mod
 * @param {string} query - Texto de búsqueda
 * @param {{ side?: string, type?: string, factionId?: string }} filters - Filtros opcionales
 * @returns {object[]} Array de modelos que coinciden
 */
export function searchModels(modData, query = '', filters = {}) {
  if (!modData?.factions) return [];

  const q = query.toLowerCase().trim();
  const results = [];

  for (const faction of modData.factions) {
    // Filtro de bando
    if (filters.side && faction.side !== filters.side) continue;
    // Filtro de facción
    if (filters.factionId && faction.factionId !== filters.factionId) continue;

    for (const model of (faction.models || [])) {
      // Filtro de tipo
      if (filters.type && model.type !== filters.type) continue;

      // Búsqueda por texto
      if (q && !model.name.toLowerCase().includes(q)) continue;

      results.push({
        ...model,
        factionId: faction.factionId,
        factionName: faction.factionName,
        side: faction.side,
        imageBaseUrl: modData.imageBaseUrl || '',
      });
    }
  }

  return results;
}

/**
 * Obtiene todos los héroes disponibles en un mod (para selección de capitán).
 * @param {object} modData - El JSON completo del mod
 * @param {{ side?: string, factionId?: string }} filters
 * @returns {object[]}
 */
export function getHeroes(modData, filters = {}) {
  return searchModels(modData, '', { ...filters, type: 'hero' });
}

/**
 * Obtiene todos los guerreros de una facción específica (para llenar el warband).
 * @param {object} modData - El JSON completo del mod
 * @param {string} factionId - ID de la facción del capitán
 * @returns {object[]}
 */
export function getWarriorsByFaction(modData, factionId) {
  return searchModels(modData, '', { factionId, type: 'warrior' });
}

/**
 * Obtiene todas las facciones disponibles en un mod.
 * @param {object} modData - El JSON completo del mod
 * @returns {{ factionId, factionName, side, armyBonus }[]}
 */
export function getFactions(modData) {
  if (!modData?.factions) return [];
  return modData.factions.map(f => ({
    factionId: f.factionId,
    factionName: f.factionName,
    side: f.side,
    armyBonus: f.armyBonus || '',
    bowLimitException: f.bowLimitException || null,
    modelCount: (f.models || []).length,
  }));
}

// ── CATÁLOGO DE MODS PÚBLICOS ─────────────────────────────────────────────────
// Lista curada de mods verificados y publicados por la comunidad.
// Esta lista es pública — cualquiera puede añadir su mod aquí mediante PR.
// Los mods listados aquí son responsabilidad de sus autores, no de Lobelia.

export const PUBLIC_MOD_REGISTRY = [
  {
    modId: 'mesbg-2024-es',
    modName: 'MESBG 2024 — Español',
    modAuthor: '@cucharalobelia',
    modDescription:
      'Perfiles completos de MESBG edición 2024 en español, incluyendo héroes, guerreros, ' +
      'reglas especiales, poderes mágicos y bonificaciones de ejército. ' +
      'Datos introducidos y verificados por la comunidad.',
    gameSystem: 'MESBG',
    version: '1.0.0',
    url: 'https://raw.githubusercontent.com/Ningrael/mesbg-lobelia-mod/main/mesbg-2024-es.json',
    isOfficial: true, // Mod recomendado por La Cuchara de Lobelia
    isVerified: true,
    factionCount: 100, // aprox.
    tags: ['español', 'MESBG', '2024', 'completo'],
  },
  // Aquí la comunidad puede añadir sus mods mediante Pull Request
];
