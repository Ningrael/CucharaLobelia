// src/utils/armyRules.js
// ─────────────────────────────────────────────────────────────────────────────
// Motor de validación de listas de ejército para La Cuchara de Lobelia.
// Este fichero NO contiene ningún dato de Games Workshop.
// Trabaja exclusivamente con la estructura de datos que provee un Mod instalado.
// ─────────────────────────────────────────────────────────────────────────────

// ── JERARQUÍA DE HÉROES ──────────────────────────────────────────────────────

export const HERO_TIER_ORDER = [
  'hero_of_legend',    // Warband max: 18 — puede ser Líder
  'hero_of_valour',    // Warband max: 15 — puede ser Líder
  'hero_of_fortitude', // Warband max: 12 — puede ser Líder si no hay superiores
  'minor_hero',        // Warband max: 6  — NO puede ser Líder si hay superiores
  'independent_hero',  // Warband max: 0  — Despliega solo, sin guerreros
  'siege_veteran',     // Líder de Engenio de Asedio
];

export const HERO_TIER_MAX_WARBAND = {
  hero_of_legend:    18,
  hero_of_valour:    15,
  hero_of_fortitude: 12,
  minor_hero:        6,
  independent_hero:  0,
  siege_veteran:     0,
};

export const HERO_TIER_CAN_LEAD = {
  hero_of_legend:    true,
  hero_of_valour:    true,
  hero_of_fortitude: true,
  minor_hero:        false, // Solo si es el único héroe
  independent_hero:  false,
  siege_veteran:     false,
};

// ── BREAK POINT & QUARTERED ───────────────────────────────────────────────────

/**
 * Calcula el Break Point (Punto de Desmoronamiento) del ejército.
 * Un ejército se desmoraliza cuando pierde el 50% de sus miniaturas.
 * @param {number} totalModels - Total de miniaturas al inicio de la partida
 * @returns {number} Número de bajas necesarias para alcanzar el Break Point
 */
export function calculateBreakPoint(totalModels) {
  return Math.ceil(totalModels / 2);
}

/**
 * Calcula el umbral de "Reducido al 25%" (Quartered).
 * Muchas misiones finalizan o tienen condiciones especiales cuando un ejército
 * queda reducido al 25% o menos de sus miniaturas iniciales.
 * @param {number} totalModels - Total de miniaturas al inicio de la partida
 * @returns {number} Número de miniaturas vivas al que se alcanza el 25%
 */
export function calculateQuartered(totalModels) {
  return Math.ceil(totalModels / 4);
}

/**
 * Devuelve el estado actual del ejército.
 * @param {number} totalModels - Total inicial
 * @param {number} casualties - Bajas actuales
 * @returns {{ alive: number, breakPoint: number, quartered: number, isBreoken: boolean, isQuartered: boolean, percentAlive: number }}
 */
export function getArmyStatus(totalModels, casualties) {
  const alive = totalModels - casualties;
  const breakPoint = calculateBreakPoint(totalModels);
  const quartered = calculateQuartered(totalModels);
  return {
    alive,
    casualties,
    breakPoint,
    quartered,
    isBroken: casualties >= breakPoint,
    isQuartered: alive <= quartered,
    percentAlive: totalModels > 0 ? Math.round((alive / totalModels) * 100) : 0,
  };
}

// ── LÍMITE DE ARCOS (BOW LIMIT) ───────────────────────────────────────────────

/**
 * Calcula el número máximo de modelos con arcos permitidos.
 * La regla estándar es 1/3 (33.33%) del total del ejército, redondeado.
 * Algunas facciones tienen excepciones definidas en el mod.
 *
 * @param {number} totalModels - Total de miniaturas del ejército
 * @param {string|null} exception - Regla especial del mod ('no_limit', 'half', number, null)
 * @returns {number} Máximo de arcos permitidos
 */
export function calculateBowLimit(totalModels, exception = null) {
  if (exception === 'no_limit') return totalModels;
  if (exception === 'half') return Math.floor(totalModels / 2);
  if (typeof exception === 'number') return exception;
  // Regla estándar: 1/3 redondeado hacia abajo
  return Math.floor(totalModels / 3);
}

/**
 * Cuenta los modelos con arco en la lista completa.
 * @param {Array} warbands - Array de warbands con sus modelos
 * @returns {number} Total de modelos con arco
 */
export function countBowModels(warbands) {
  let count = 0;
  for (const wb of warbands) {
    if (wb.hero?.isBowArmed) count++;
    for (const warrior of (wb.warriors || [])) {
      if (warrior.isBowArmed) count++;
    }
  }
  return count;
}

// ── DETECCIÓN DE LÍDER ────────────────────────────────────────────────────────

/**
 * Detecta automáticamente el Líder del ejército.
 * Es el héroe de mayor Heroic Tier. En caso de empate, se puede elegir.
 * @param {Array} warbands - Array de warbands
 * @returns {{ hero: object|null, warbandIndex: number, isTied: boolean }}
 */
export function detectArmyLeader(warbands) {
  let bestTierIndex = Infinity;
  let leader = null;
  let leaderWarbandIndex = -1;
  let tiedCandidates = 0;

  warbands.forEach((wb, wbIdx) => {
    if (!wb.hero) return;
    const tierIndex = HERO_TIER_ORDER.indexOf(wb.hero.heroTier);
    if (tierIndex === -1) return;
    if (tierIndex < bestTierIndex) {
      bestTierIndex = tierIndex;
      leader = wb.hero;
      leaderWarbandIndex = wbIdx;
      tiedCandidates = 1;
    } else if (tierIndex === bestTierIndex) {
      tiedCandidates++;
    }
  });

  return {
    hero: leader,
    warbandIndex: leaderWarbandIndex,
    isTied: tiedCandidates > 1,
    tierIndex: bestTierIndex,
  };
}

// ── ALIANZAS ──────────────────────────────────────────────────────────────────

/**
 * Determina el tipo de alianza entre las facciones de la lista.
 * La matriz de alianzas viene del mod instalado.
 * @param {string[]} factionIds - IDs de las facciones en la lista
 * @param {object} allianceMatrix - Matriz del mod: { factionA: { factionB: 'historical' } }
 * @returns {'historical'|'convenient'|'impossible'|'pure'}
 */
export function detectAllianceType(factionIds, allianceMatrix = {}) {
  const unique = [...new Set(factionIds)].filter(Boolean);
  if (unique.length <= 1) return 'pure'; // Lista pura, sin alianzas

  let worstAlliance = 'historical';
  const alliancePriority = { historical: 0, convenient: 1, impossible: 2 };

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i];
      const b = unique[j];
      const ab = allianceMatrix[a]?.[b] ?? allianceMatrix[b]?.[a] ?? 'impossible';
      if (alliancePriority[ab] > alliancePriority[worstAlliance]) {
        worstAlliance = ab;
      }
    }
  }

  return worstAlliance;
}

// ── VALIDACIÓN DE WARBAND ─────────────────────────────────────────────────────

/**
 * Valida una Partida de Guerra individual.
 * @param {object} warband - { hero, warriors: [] }
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateWarband(warband) {
  const errors = [];
  const warnings = [];

  if (!warband.hero) {
    errors.push('La partida de guerra no tiene Héroe capitán.');
    return { valid: false, errors, warnings };
  }

  const maxWarriors = HERO_TIER_MAX_WARBAND[warband.hero.heroTier] ?? 0;
  const warriorCount = (warband.warriors || []).length;

  if (warriorCount > maxWarriors) {
    errors.push(
      `El héroe "${warband.hero.name}" (${warband.hero.heroTier}) solo puede liderar ${maxWarriors} guerreros, pero tiene ${warriorCount}.`
    );
  }

  if (warband.hero.heroTier === 'independent_hero' && warriorCount > 0) {
    errors.push(
      `El Héroe Independiente "${warband.hero.name}" no puede liderar guerreros.`
    );
  }

  if (warband.hero.isUnique && /* checked at list level */ false) {
    // La unicidad se valida a nivel de lista completa
  }

  if (warriorCount === 0 && warband.hero.heroTier !== 'independent_hero') {
    warnings.push(
      `La partida de "${warband.hero.name}" no tiene guerreros. ¿Es intencionado?`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── VALIDACIÓN DE LISTA COMPLETA ──────────────────────────────────────────────

/**
 * Valida la lista de ejército completa contra un mod y sus reglas.
 * @param {object} list - La lista del usuario
 * @param {object} modData - Datos del mod activo (facciones, alliance matrix, etc.)
 * @returns {{ valid: boolean, errors: string[], warnings: string[], stats: object }}
 */
export function validateFullList(list, modData = {}) {
  const errors = [];
  const warnings = [];

  const warbands = list.warbands || [];
  const pointsLimit = list.pointsLimit || Infinity;
  const allianceMatrix = modData.allianceMatrix || {};

  // ── Contar miniaturas totales ─────────────────────────────────────────────
  let totalModels = 0;
  let totalPoints = 0;
  let bowCount = 0;
  const factionIds = [];
  const uniqueHeroIds = new Set();

  for (const wb of warbands) {
    // Validar cada warband
    const wbResult = validateWarband(wb);
    errors.push(...wbResult.errors);
    warnings.push(...wbResult.warnings);

    if (wb.hero) {
      totalModels++;
      totalPoints += wb.hero.totalCost ?? wb.hero.baseCost ?? 0;
      if (wb.hero.isBowArmed) bowCount++;
      if (wb.hero.faction) factionIds.push(wb.hero.faction);

      // Verificar unicidad
      if (wb.hero.isUnique) {
        if (uniqueHeroIds.has(wb.hero.id)) {
          errors.push(`"${wb.hero.name}" es ÚNICO y no puede aparecer más de una vez en la lista.`);
        } else {
          uniqueHeroIds.add(wb.hero.id);
        }
      }
    }

    for (const warrior of (wb.warriors || [])) {
      totalModels++;
      totalPoints += warrior.totalCost ?? warrior.baseCost ?? 0;
      if (warrior.isBowArmed) bowCount++;
    }
  }

  // ── Límite de puntos ──────────────────────────────────────────────────────
  if (totalPoints > pointsLimit) {
    errors.push(`La lista supera el límite de puntos: ${totalPoints} / ${pointsLimit} pts.`);
  }

  // ── Límite de arcos ───────────────────────────────────────────────────────
  // Para lista mixta, se usa la regla estándar (sin excepción de facción única)
  const bowLimit = calculateBowLimit(totalModels, null);
  if (bowCount > bowLimit) {
    errors.push(
      `Demasiados modelos con arco: ${bowCount} / ${bowLimit} permitidos (límite del 33%).`
    );
  }

  // ── Alianzas ──────────────────────────────────────────────────────────────
  const allianceType = detectAllianceType(factionIds, allianceMatrix);
  if (allianceType === 'impossible') {
    errors.push('La lista contiene una alianza IMPOSIBLE. Revisa las facciones incluidas.');
  } else if (allianceType === 'convenient') {
    warnings.push('Alianza CONVENIENTE: ambas facciones pierden su Army Bonus.');
  }

  // ── Líder ─────────────────────────────────────────────────────────────────
  const leaderInfo = detectArmyLeader(warbands);
  if (!leaderInfo.hero) {
    errors.push('La lista no tiene ningún héroe. Debe incluir al menos un Héroe capitán.');
  } else if (leaderInfo.isTied) {
    warnings.push(
      `Hay ${/* tiedCandidates */''} héroes del mismo nivel máximo. Deberás elegir el Líder del ejército.`
    );
  }

  // ── Stats finales ─────────────────────────────────────────────────────────
  const breakPoint = calculateBreakPoint(totalModels);
  const quartered = calculateQuartered(totalModels);

  const stats = {
    totalModels,
    totalPoints,
    pointsLimit,
    pointsRemaining: pointsLimit - totalPoints,
    bowCount,
    bowLimit,
    breakPoint,
    quartered,
    allianceType,
    leader: leaderInfo.hero?.name ?? null,
    warbandCount: warbands.length,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// ── EXPORTADOR TTS (MESBG FTC MOD) ───────────────────────────────────────────

/**
 * Genera el texto en formato TTS para el mod MESBG FTC (Fixed Tabletop Collection).
 * Formato: (Hero Name: Equipment)\n    (Nx Warrior: Equipment)
 *
 * @param {object} list - Lista completa del usuario
 * @returns {string} Texto formateado para pegar en el importador de TTS
 */
export function exportToTTS(list) {
  const lines = [];

  for (const wb of (list.warbands || [])) {
    if (!wb.hero) continue;

    // Línea del héroe: (Hero Name: Equipment Option)
    const heroEquip = wb.hero.selectedOptions?.map(o => o.name).join(', ') || '';
    lines.push(`(${wb.hero.name}${heroEquip ? ': ' + heroEquip : ': '})`);

    // Línea de guerreros agrupados: (Nx Warrior: Equipment)
    const warriorGroups = {};
    for (const w of (wb.warriors || [])) {
      const equip = w.selectedOptions?.map(o => o.name).join(' and ') || '';
      const key = `${w.name}::${equip}`;
      warriorGroups[key] = (warriorGroups[key] || 0) + 1;
    }

    for (const [key, count] of Object.entries(warriorGroups)) {
      const [name, equip] = key.split('::');
      lines.push(`    (${count}x ${name}${equip ? ': ' + equip : ''})`);
    }

    lines.push(''); // Línea en blanco entre warbands
  }

  return lines.join('\n').trim();
}

// ── SISTEMA DE ELO ────────────────────────────────────────────────────────────

const ELO_K_FACTOR = 32; // Factor K estándar (como en ajedrez FIDE para jugadores activos)

/**
 * Calcula la probabilidad de victoria esperada del jugador A contra B.
 * @param {number} ratingA - ELO del jugador A
 * @param {number} ratingB - ELO del jugador B
 * @returns {number} Probabilidad entre 0 y 1
 */
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calcula el nuevo ELO de un jugador tras una partida.
 * @param {number} ratingA - ELO actual del jugador A
 * @param {number} ratingB - ELO actual del jugador B
 * @param {'win'|'draw'|'loss'} result - Resultado para el jugador A
 * @param {number} kFactor - Factor K (por defecto 32)
 * @returns {{ newRating: number, delta: number, expectedScore: number }}
 */
export function calculateELO(ratingA, ratingB, result, kFactor = ELO_K_FACTOR) {
  const scoreMap = { win: 1, draw: 0.5, loss: 0 };
  const actualScore = scoreMap[result] ?? 0.5;
  const expected = expectedScore(ratingA, ratingB);
  const delta = Math.round(kFactor * (actualScore - expected));
  return {
    newRating: ratingA + delta,
    delta,
    expectedScore: expected,
  };
}

/**
 * Previsualiza los cambios de ELO para mostrar al jugador antes de aceptar el desafío.
 * @param {number} ratingA - ELO del retador
 * @param {number} ratingB - ELO del rival
 * @returns {{ win: number, draw: number, loss: number }}
 */
export function previewELOChanges(ratingA, ratingB) {
  return {
    win:  calculateELO(ratingA, ratingB, 'win').delta,
    draw: calculateELO(ratingA, ratingB, 'draw').delta,
    loss: calculateELO(ratingA, ratingB, 'loss').delta,
  };
}

// ── RESULTADO DE PARTIDA ──────────────────────────────────────────────────────

/**
 * Determina el resultado de la partida basado en los VP finales.
 * Convención estándar MESBG Matched Play:
 * - Diferencia ≥ 4 VP → Victoria Mayor
 * - Diferencia 2-3 VP → Victoria Menor
 * - Diferencia 0-1 VP → Empate
 *
 * @param {number} vpA - VP del jugador A
 * @param {number} vpB - VP del jugador B
 * @returns {{ outcome: string, resultA: 'win'|'draw'|'loss', resultB: 'win'|'draw'|'loss', label: string }}
 */
export function determineMatchOutcome(vpA, vpB) {
  const diff = Math.abs(vpA - vpB);
  let outcome, resultA, resultB, label;

  if (diff === 0 || diff === 1) {
    outcome = 'draw';
    resultA = 'draw';
    resultB = 'draw';
    label = 'Empate';
  } else if (vpA > vpB) {
    if (diff >= 4) {
      outcome = 'a_major';
      resultA = 'win';
      resultB = 'loss';
      label = 'Victoria Mayor Jugador 1';
    } else {
      outcome = 'a_minor';
      resultA = 'win';
      resultB = 'loss';
      label = 'Victoria Menor Jugador 1';
    }
  } else {
    if (diff >= 4) {
      outcome = 'b_major';
      resultA = 'loss';
      resultB = 'win';
      label = 'Victoria Mayor Jugador 2';
    } else {
      outcome = 'b_minor';
      resultA = 'loss';
      resultB = 'win';
      label = 'Victoria Menor Jugador 2';
    }
  }

  return { outcome, resultA, resultB, label, vpA, vpB };
}
