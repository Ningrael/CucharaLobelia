// src/utils/modManager.js
// ─────────────────────────────────────────────────────────────────────────────
// Gestor del Sistema de Mods de La Cuchara de Lobelia (Zero-GW IP Engine).
// Permite instalar, moderar, activar por capas y sincronizar mods de datos.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';

// ── SCHEMA VERSION & CONSTANTS ────────────────────────────────────────────────
export const SUPPORTED_SCHEMA_VERSION = '1.0';
const MOD_CACHE_PREFIX = 'lobelia_mod_data_';
const INSTALLED_MODS_LIST_KEY = 'lobelia_installed_mods_list';
const ACTIVE_LAYERS_KEY = 'lobelia_active_layers';

export const MOD_LAYERS = {
  ARMY_BUILDER: 'army_builder',
  MISSIONS: 'missions',
  RULES_AI: 'rules_ai',
  DUELS: 'duels'
};

const REQUIRED_MOD_FIELDS = [
  'modId',
  'modName',
  'modVersion',
  'modAuthor',
  'gameSystem',
  'schemaVersion'
];

// ── SANITIZACIÓN DE SEGURIDAD CONTRA INYECCIONES Y XSS ────────────────────────
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeMod(modJson) {
  if (!modJson || typeof modJson !== 'object') return null;
  const clean = { ...modJson };

  clean.modId = sanitizeString(clean.modId);
  clean.modName = sanitizeString(clean.modName);
  clean.modVersion = sanitizeString(clean.modVersion);
  clean.modAuthor = sanitizeString(clean.modAuthor);
  clean.description = sanitizeString(clean.description);
  clean.gameSystem = sanitizeString(clean.gameSystem);
  clean.schemaVersion = sanitizeString(clean.schemaVersion || '1.0');

  if (Array.isArray(clean.capabilities)) {
    clean.capabilities = clean.capabilities.map(c => sanitizeString(c));
  } else {
    clean.capabilities = [];
    if (clean.factions && clean.factions.length > 0) clean.capabilities.push('army_builder', 'duels');
    if (clean.missionPdfs) clean.capabilities.push('missions');
    if (clean.rulesKnowledge && clean.rulesKnowledge.length > 0) clean.capabilities.push('rules_ai');
  }

  if (Array.isArray(clean.factions)) {
    clean.factions = clean.factions.map(f => ({
      ...f,
      factionId: sanitizeString(f.factionId),
      factionName: sanitizeString(f.factionName),
      side: ['good', 'evil', 'neutral'].includes(f.side) ? f.side : 'neutral',
      armyBonus: sanitizeString(f.armyBonus || ''),
      models: Array.isArray(f.models) ? f.models.map(m => ({
        ...m,
        id: sanitizeString(m.id),
        name: sanitizeString(m.name),
        type: ['hero', 'warrior', 'monster', 'siege'].includes(m.type) ? m.type : 'warrior',
        heroicTier: sanitizeString(m.heroicTier || ''),
        points: typeof m.points === 'number' ? m.points : parseInt(m.points || 0, 10),
        movement: sanitizeString(m.movement || '6"'),
        fight: sanitizeString(m.fight || '3/4+'),
        strength: typeof m.strength === 'number' ? m.strength : 3,
        defense: typeof m.defense === 'number' ? m.defense : 4,
        attacks: typeof m.attacks === 'number' ? m.attacks : 1,
        wounds: typeof m.wounds === 'number' ? m.wounds : 1,
        courage: typeof m.courage === 'number' ? m.courage : 3,
        might: typeof m.might === 'number' ? m.might : 0,
        will: typeof m.might === 'number' ? m.will : 0,
        fate: typeof m.might === 'number' ? m.fate : 0,
        wargear: Array.isArray(m.wargear) ? m.wargear.map(w => sanitizeString(w)) : [],
        options: Array.isArray(m.options) ? m.options.map(o => ({
          name: sanitizeString(o.name),
          points: typeof o.points === 'number' ? o.points : parseInt(o.points || 0, 10),
          isBow: Boolean(o.isBow)
        })) : [],
        specialRules: Array.isArray(m.specialRules) ? m.specialRules.map(sr => ({
          name: sanitizeString(sr.name),
          description: sanitizeString(sr.description)
        })) : [],
        magicalPowers: Array.isArray(m.magicalPowers) ? m.magicalPowers.map(mp => ({
          name: sanitizeString(mp.name),
          range: sanitizeString(mp.range),
          difficulty: sanitizeString(mp.difficulty),
          duration: sanitizeString(mp.duration)
        })) : []
      })) : []
    }));
  }

  return clean;
}

// ── VALIDACIÓN DE SCHEMA ──────────────────────────────────────────────────────
export function validateModSchema(modJson) {
  const errors = [];
  const stats = { factions: 0, models: 0, missions: 0, rulesPages: 0, capabilities: [] };

  if (!modJson || typeof modJson !== 'object') {
    return { valid: false, errors: ['El archivo no es un objeto JSON válido.'], stats };
  }

  for (const field of REQUIRED_MOD_FIELDS) {
    if (!modJson[field]) {
      errors.push(`Campo obligatorio ausente en la cabecera: "${field}".`);
    }
  }

  if (modJson.schemaVersion && modJson.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      `Versión de schema incompatible: "${modJson.schemaVersion}". Lobelia soporta schema "${SUPPORTED_SCHEMA_VERSION}".`
    );
  }

  // Comprobar capacidades
  if (Array.isArray(modJson.factions) && modJson.factions.length > 0) {
    stats.capabilities.push('army_builder', 'duels');
    stats.factions = modJson.factions.length;
    modJson.factions.forEach((f, idx) => {
      if (!f.factionId) errors.push(`La facción en índice ${idx} no tiene "factionId".`);
      if (!f.factionName) errors.push(`La facción en índice ${idx} no tiene "factionName".`);
      if (!['good', 'evil', 'neutral'].includes(f.side)) {
        errors.push(`Facción "${f.factionId || idx}" tiene "side" inválido. Permitidos: good, evil, neutral.`);
      }
      if (Array.isArray(f.models)) {
        stats.models += f.models.length;
        f.models.forEach((m, mIdx) => {
          if (!m.id) errors.push(`Miniatura en facción ${f.factionId} (índice ${mIdx}) no tiene "id".`);
          if (!m.name) errors.push(`Miniatura en facción ${f.factionId} (índice ${mIdx}) no tiene "name".`);
          if (typeof m.points !== 'number' || isNaN(m.points)) {
            errors.push(`Miniatura "${m.name || m.id}" no tiene puntos numéricos válidos.`);
          }
        });
      }
    });
  }

  if (modJson.missionPdfs && typeof modJson.missionPdfs === 'object') {
    stats.capabilities.push('missions');
    const m1 = Object.keys(modJson.missionPdfs.missions1v1 || {}).length;
    const m2 = Object.keys(modJson.missionPdfs.missions2v2 || {}).length;
    stats.missions = m1 + m2;
  }

  if (Array.isArray(modJson.rulesKnowledge) && modJson.rulesKnowledge.length > 0) {
    stats.capabilities.push('rules_ai');
    stats.rulesPages = modJson.rulesKnowledge.length;
  }

  if (stats.capabilities.length === 0) {
    errors.push('El mod no contiene ninguna función válida (facciones de listas, misiones con PDFs o índice de reglas).');
  }

  return { valid: errors.length === 0, errors, stats };
}

// ── GESTIÓN DE CAPAS (LAYER MANAGER) ──────────────────────────────────────────
export function getActiveLayers(uid = null) {
  try {
    const raw = localStorage.getItem(ACTIVE_LAYERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    [MOD_LAYERS.ARMY_BUILDER]: null,
    [MOD_LAYERS.MISSIONS]: null,
    [MOD_LAYERS.RULES_AI]: null,
    [MOD_LAYERS.DUELS]: null
  };
}

export function setActiveLayer(uid, layer, modId) {
  const current = getActiveLayers(uid);
  current[layer] = modId;
  try {
    localStorage.setItem(ACTIVE_LAYERS_KEY, JSON.stringify(current));
  } catch (_) {}

  // Sincronizar en la nube si hay usuario logueado
  if (uid && db) {
    try {
      const userDocRef = doc(db, 'players', uid);
      setDoc(userDocRef, { modConfig: { activeLayers: current, updatedAt: new Date().toISOString() } }, { merge: true }).catch(() => {});
    } catch (_) {}
  }
}

export function setMasterActiveMod(uid, modId) {
  const modData = getModDataById(modId);
  const current = getActiveLayers(uid);

  if (!modData) {
    Object.keys(current).forEach(k => { current[k] = modId; });
  } else {
    const caps = modData.capabilities || [];
    if (caps.includes('army_builder')) current[MOD_LAYERS.ARMY_BUILDER] = modId;
    if (caps.includes('missions')) current[MOD_LAYERS.MISSIONS] = modId;
    if (caps.includes('rules_ai')) current[MOD_LAYERS.RULES_AI] = modId;
    if (caps.includes('duels')) current[MOD_LAYERS.DUELS] = modId;
    if (caps.length === 0) {
      Object.keys(current).forEach(k => { current[k] = modId; });
    }
  }

  try {
    localStorage.setItem(ACTIVE_LAYERS_KEY, JSON.stringify(current));
  } catch (_) {}

  if (uid && db) {
    try {
      const userDocRef = doc(db, 'players', uid);
      setDoc(userDocRef, { modConfig: { activeLayers: current, updatedAt: new Date().toISOString() } }, { merge: true }).catch(() => {});
    } catch (_) {}
  }
}

// ── ALMACENAMIENTO LOCAL E INSTALACIÓN ─────────────────────────────────────────
export function getModDataById(modId) {
  if (!modId) return null;
  try {
    const raw = localStorage.getItem(`${MOD_CACHE_PREFIX}${modId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function getActiveModData(uid, layer) {
  const layers = getActiveLayers(uid);
  const modId = layers[layer];
  if (!modId) return null;
  return getModDataById(modId);
}

export async function getActiveMod(uid = null, layer = MOD_LAYERS.ARMY_BUILDER) {
  const mod = getActiveModData(uid, layer);
  return { success: !!mod, mod, error: mod ? null : 'No active mod found' };
}

export async function getInstalledMods(uid = null) {
  let list = [];
  try {
    const raw = localStorage.getItem(INSTALLED_MODS_LIST_KEY);
    if (raw) list = JSON.parse(raw);
  } catch (_) {}

  // Si está vacío localmente y hay usuario, sincronizar desde Firestore
  if (list.length === 0 && uid && db) {
    try {
      const userDocRef = doc(db, 'players', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const pData = snap.data();
        if (pData.modConfig?.installedModsMeta) {
          list = pData.modConfig.installedModsMeta;
          localStorage.setItem(INSTALLED_MODS_LIST_KEY, JSON.stringify(list));
        }
        if (pData.modConfig?.activeLayers) {
          localStorage.setItem(ACTIVE_LAYERS_KEY, JSON.stringify(pData.modConfig.activeLayers));
        }
      }
    } catch (_) {}
  }

  return list;
}

export async function installMod(uid, modJson, sourceUrl = '') {
  const sanitized = sanitizeMod(modJson);
  const validation = validateModSchema(sanitized);

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(' | ') };
  }

  try {
    // 1. Guardar contenido completo en localStorage del dispositivo
    localStorage.setItem(`${MOD_CACHE_PREFIX}${sanitized.modId}`, JSON.stringify(sanitized));

    // 2. Actualizar lista de instalados
    const installed = await getInstalledMods(uid);
    const existingIdx = installed.findIndex(m => m.modId === sanitized.modId);
    const meta = {
      modId: sanitized.modId,
      modName: sanitized.modName,
      modVersion: sanitized.modVersion,
      modAuthor: sanitized.modAuthor,
      description: sanitized.description,
      capabilities: sanitized.capabilities || [],
      installedAt: new Date().toISOString(),
      sourceUrl: sourceUrl || 'local_file'
    };

    if (existingIdx >= 0) {
      installed[existingIdx] = meta;
    } else {
      installed.push(meta);
    }
    localStorage.setItem(INSTALLED_MODS_LIST_KEY, JSON.stringify(installed));

    // 3. Activar automáticamente para sus capacidades
    setMasterActiveMod(uid, sanitized.modId);

    // 4. Sincronizar en Firestore
    if (uid && db) {
      const userDocRef = doc(db, 'players', uid);
      const activeLayers = getActiveLayers(uid);
      await setDoc(userDocRef, {
        modConfig: {
          installedModsMeta: installed,
          activeLayers: activeLayers,
          lastInstalledModId: sanitized.modId,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });
    }

    return { success: true, mod: sanitized };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function uninstallMod(uid, modId) {
  try {
    localStorage.removeItem(`${MOD_CACHE_PREFIX}${modId}`);

    const installed = await getInstalledMods(uid);
    const updated = installed.filter(m => m.modId !== modId);
    localStorage.setItem(INSTALLED_MODS_LIST_KEY, JSON.stringify(updated));

    // Limpiar capas activas que apuntaban a este mod
    const layers = getActiveLayers(uid);
    Object.keys(layers).forEach(layerKey => {
      if (layers[layerKey] === modId) {
        layers[layerKey] = null;
      }
    });
    localStorage.setItem(ACTIVE_LAYERS_KEY, JSON.stringify(layers));

    if (uid && db) {
      const userDocRef = doc(db, 'players', uid);
      await setDoc(userDocRef, {
        modConfig: {
          installedModsMeta: updated,
          activeLayers: layers,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── ENVÍO Y MODERACIÓN DE MODS POR SUPERADMIN ─────────────────────────────────
export const SUPERADMIN_EMAILS = ['sosamatias@gmail.com'];

export async function submitModForReview(submissionData, currentUser) {
  if (!db) throw new Error('Base de datos no disponible.');
  const sanitized = sanitizeMod(submissionData.modJson);
  const validation = validateModSchema(sanitized);

  if (!validation.valid) {
    throw new Error(`El mod contiene errores de validación:\n${validation.errors.join('\n')}`);
  }

  const submissionDoc = {
    modId: sanitized.modId,
    modName: sanitized.modName,
    modVersion: sanitized.modVersion,
    modAuthor: sanitized.modAuthor,
    description: sanitized.description || '',
    capabilities: sanitized.capabilities || [],
    contactEmail: sanitizeString(submissionData.contactEmail || currentUser?.email || ''),
    submittedByUid: currentUser?.uid || 'anonymous',
    submittedByName: currentUser?.displayName || currentUser?.email || 'Comunidad',
    submittedAt: serverTimestamp(),
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    stats: validation.stats,
    modJson: sanitized
  };

  // 1. Guardar en colección mod_submissions
  const submissionsRef = collection(db, 'mod_submissions');
  const docRef = await addDoc(submissionsRef, submissionDoc);

  // 2. Encolar notificación por correo para SuperAdmins vía colección mail (Firebase Trigger Email)
  try {
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to: SUPERADMIN_EMAILS,
      message: {
        subject: `🛡️ [Lobelia Mods] Nuevo Mod enviado para revisión: ${sanitized.modName}`,
        text: `El creador "${sanitized.modAuthor}" (${submissionDoc.contactEmail}) ha enviado el mod "${sanitized.modName}" v${sanitized.modVersion} para revisión.\n\nDescripción: ${sanitized.description}\nFacciones: ${validation.stats.factions}, Perfiles: ${validation.stats.models}, Misiones: ${validation.stats.missions}, Páginas IA: ${validation.stats.rulesPages}\n\nAccede al panel de administración de La Cuchara de Lobelia para revisarlo y aprobarlo.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f1910; color: #f5f0e8; border-radius: 10px;">
            <h2 style="color: #cba135;">🛡️ Nuevo Mod Enviado para Moderación</h2>
            <p><strong>Mod:</strong> ${sanitized.modName} (v${sanitized.modVersion})</p>
            <p><strong>Autor:</strong> ${sanitized.modAuthor}</p>
            <p><strong>Contacto:</strong> ${submissionDoc.contactEmail}</p>
            <p><strong>Descripción:</strong> ${sanitized.description}</p>
            <hr style="border: 1px solid rgba(203,161,53,0.3); margin: 15px 0;">
            <p><strong>Estadísticas:</strong> ${validation.stats.factions} facciones | ${validation.stats.models} perfiles | ${validation.stats.missions} misiones | ${validation.stats.rulesPages} páginas de reglas</p>
            <p>Accede al <strong>Panel de Moderación de SuperAdmin</strong> en la app para aprobar o rechazar.</p>
          </div>
        `
      }
    });
  } catch (mailErr) {
    console.warn('[ModManager] No se pudo encolar correo automático:', mailErr);
  }

  return { success: true, submissionId: docRef.id };
}

export async function getPendingSubmissions() {
  if (!db) return [];
  try {
    const submissionsRef = collection(db, 'mod_submissions');
    const q = query(submissionsRef, where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[ModManager] Error fetching pending submissions:', err);
    return [];
  }
}

export async function approveModSubmission(submissionId, modData, adminUser) {
  if (!db) throw new Error('Base de datos no disponible.');
  const sanitized = sanitizeMod(modData);

  // 1. Publicar en public_mods
  const publicModRef = doc(db, 'public_mods', sanitized.modId);
  await setDoc(publicModRef, {
    modId: sanitized.modId,
    modName: sanitized.modName,
    modVersion: sanitized.modVersion,
    modAuthor: sanitized.modAuthor,
    description: sanitized.description || '',
    capabilities: sanitized.capabilities || [],
    factionsCount: (sanitized.factions || []).length,
    missionsCount: sanitized.missionPdfs ? Object.keys(sanitized.missionPdfs.missions1v1 || {}).length : 0,
    rulesPagesCount: (sanitized.rulesKnowledge || []).length,
    isVerified: true,
    publishedAt: serverTimestamp(),
    approvedBy: adminUser?.email || 'SuperAdmin',
    modJson: sanitized
  });

  // 2. Actualizar estado de la solicitud
  const submissionRef = doc(db, 'mod_submissions', submissionId);
  await setDoc(submissionRef, {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminUser?.email || 'SuperAdmin'
  }, { merge: true });

  return { success: true };
}

export async function rejectModSubmission(submissionId, rejectionReason, adminUser) {
  if (!db) throw new Error('Base de datos no disponible.');
  const submissionRef = doc(db, 'mod_submissions', submissionId);
  await setDoc(submissionRef, {
    status: 'rejected',
    rejectionReason: sanitizeString(rejectionReason || 'No cumple las especificaciones del schema.'),
    rejectedAt: serverTimestamp(),
    rejectedBy: adminUser?.email || 'SuperAdmin'
  }, { merge: true });

  return { success: true };
}

export async function getPublicModsRegistry() {
  if (!db) return [];
  try {
    const publicModsRef = collection(db, 'public_mods');
    const snap = await getDocs(publicModsRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn('[ModManager] Error fetching public mods from Firestore:', err);
  }
  return [];
}

// ── GETTERS DESACOPLADOS PARA LAS VISTAS BASE ─────────────────────────────────

/**
 * Obtiene la URL del PDF de una misión desde el mod de misiones activo.
 * Si no hay ningún mod de misiones activo, devuelve NULL.
 */
export function getMissionPdfUrl(missionName, lang = 'es', mode = '1vs1', uid = null) {
  const modData = getActiveModData(uid, MOD_LAYERS.MISSIONS);
  if (!modData || !modData.missionPdfs) return null;

  const pdfConfig = modData.missionPdfs;
  const baseUrl = pdfConfig.baseUrl || '';
  const mapKey = mode === '2vs2' ? 'missions2v2' : 'missions1v1';
  const missionEntry = pdfConfig[mapKey]?.[missionName];

  if (!missionEntry || !missionEntry.file) return null;
  return `${baseUrl}${missionEntry.file}`;
}

/**
 * Obtiene las facciones del mod de listas activo.
 * Si no hay mod activo, devuelve array vacío.
 */
export function getArmyBuilderFactions(uid = null) {
  const modData = getActiveModData(uid, MOD_LAYERS.ARMY_BUILDER);
  if (!modData || !Array.isArray(modData.factions)) return [];
  return modData.factions;
}

/**
 * Obtiene el índice de reglas para el Árbitro IA desde el mod de reglas activo.
 * Si no hay mod activo, devuelve array vacío.
 */
export function getRulesKnowledgeFromMod(uid = null) {
  const modData = getActiveModData(uid, MOD_LAYERS.RULES_AI);
  if (!modData || !Array.isArray(modData.rulesKnowledge)) return [];
  return modData.rulesKnowledge;
}

export const PUBLIC_MOD_REGISTRY = [
  {
    modId: 'mod-integral-tolkienstein',
    modName: 'Mod integral: Misiones, filtro de IA, desafíos y generador de listas',
    modAuthor: 'Dr Tolkienstein',
    modDescription:
      'Paquete integral comunitario con perfiles de ejército completos para el Army Builder, visor de PDFs de misiones 1v1 y 2v2 con mapas, base de conocimiento para el árbitro IA y reglas de duelos.',
    gameSystem: 'MESBG',
    version: '1.0.0',
    capabilities: ['army_builder', 'missions', 'rules_ai', 'duels'],
    isVerified: true,
    tags: ['integral', 'completo', 'misiones', 'ia', 'listas', 'duelos']
  }
];

// ── BÚSQUEDA Y CONSULTA DE PERFILES EN UN MOD ─────────────────────────────────

export function searchModels(modData, queryStr = '', filters = {}) {
  if (!modData?.factions) return [];
  const q = queryStr.toLowerCase().trim();
  const results = [];

  for (const faction of modData.factions) {
    if (filters.side && faction.side !== filters.side) continue;
    if (filters.factionId && faction.factionId !== filters.factionId) continue;

    for (const model of (faction.models || [])) {
      if (filters.type && model.type !== filters.type) continue;
      if (q && !model.name.toLowerCase().includes(q)) continue;

      results.push({
        ...model,
        factionId: faction.factionId,
        factionName: faction.factionName,
        side: faction.side,
        baseCost: model.points || 0
      });
    }
  }

  return results;
}

export function getHeroes(modData, filters = {}) {
  return searchModels(modData, '', { ...filters, type: 'hero' });
}

export function getWarriorsByFaction(modData, factionId) {
  return searchModels(modData, '', { factionId, type: 'warrior' });
}

export function getFactions(modData) {
  if (!modData?.factions) return [];
  return modData.factions.map(f => ({
    factionId: f.factionId,
    factionName: f.factionName,
    side: f.side,
    armyBonus: f.armyBonus || '',
    modelCount: (f.models || []).length
  }));
}

