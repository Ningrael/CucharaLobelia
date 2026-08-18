// src/utils/eloRating.js
// ─────────────────────────────────────────────────────────────────────────────
// Motor de Cálculo de ELO para la Liga y Torneos de La Cuchara de Lobelia.
// Basado en el sistema oficial ELO adaptado a Wargames (K=32, Base 1000).
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_ELO = 1000;
export const DEFAULT_K_FACTOR = 32;

/**
 * Calcula la probabilidad esperada de victoria del Jugador A frente al Jugador B
 * EA = 1 / (1 + 10 ^ ((RatingB - RatingA) / 400))
 */
export function getExpectedScore(ratingA, ratingB) {
  const rA = Number(ratingA) || DEFAULT_ELO;
  const rB = Number(ratingB) || DEFAULT_ELO;
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

/**
 * Calcula la variación de ELO para dos jugadores tras una partida.
 * @param {number} ratingA - ELO actual del jugador 1
 * @param {number} ratingB - ELO actual del jugador 2
 * @param {string} result - 'win', 'loss', o 'draw' (desde la perspectiva del Jugador A)
 * @param {number} vpA - Puntos de Victoria anotados por Jugador A (opcional)
 * @param {number} vpB - Puntos de Victoria anotados por Jugador B (opcional)
 * @param {number} kFactor - Factor de volatilidad (por defecto 32)
 * @returns {object} { newRatingA, newRatingB, changeA, changeB, expectedA, expectedB }
 */
export function calculateMatchElo(ratingA = DEFAULT_ELO, ratingB = DEFAULT_ELO, result = 'draw', vpA = 0, vpB = 0, kFactor = DEFAULT_K_FACTOR) {
  const rA = Number(ratingA) || DEFAULT_ELO;
  const rB = Number(ratingB) || DEFAULT_ELO;

  const expectedA = getExpectedScore(rA, rB);
  const expectedB = 1 - expectedA;

  let actualA = 0.5;
  if (result === 'win') actualA = 1.0;
  else if (result === 'loss') actualA = 0.0;

  // Ajuste sutil por diferencia de Puntos de Victoria (máx +15% de impacto)
  let marginMultiplier = 1.0;
  const vpDiff = Math.abs((Number(vpA) || 0) - (Number(vpB) || 0));
  if (vpDiff > 0 && result !== 'draw') {
    marginMultiplier = Math.min(1.25, 1.0 + (vpDiff / 40));
  }

  const effectiveK = kFactor * marginMultiplier;
  const changeA = Math.round(effectiveK * (actualA - expectedA));
  const changeB = -changeA;

  const newRatingA = Math.max(100, rA + changeA);
  const newRatingB = Math.max(100, rB + changeB);

  return {
    newRatingA,
    newRatingB,
    changeA,
    changeB,
    expectedA: Math.round(expectedA * 100),
    expectedB: Math.round(expectedB * 100)
  };
}

/**
 * Devuelve la insignia y categoría visual del ELO
 */
export function getEloTier(elo = DEFAULT_ELO, lang = 'es') {
  const rating = Number(elo) || DEFAULT_ELO;

  if (rating >= 1700) {
    return {
      tier: 'grandmaster',
      badge: '👑',
      name: lang === 'es' ? 'Gran Maestro' : 'Grandmaster',
      color: '#ffd700',
      bg: 'rgba(255, 215, 0, 0.15)',
      border: 'rgba(255, 215, 0, 0.5)'
    };
  }
  if (rating >= 1500) {
    return {
      tier: 'diamond',
      badge: '💎',
      name: lang === 'es' ? 'Maestro' : 'Master',
      color: '#00d2d3',
      bg: 'rgba(0, 210, 211, 0.15)',
      border: 'rgba(0, 210, 211, 0.5)'
    };
  }
  if (rating >= 1300) {
    return {
      tier: 'gold',
      badge: '🥇',
      name: lang === 'es' ? 'Campeón' : 'Champion',
      color: '#f1c40f',
      bg: 'rgba(241, 196, 15, 0.15)',
      border: 'rgba(241, 196, 15, 0.4)'
    };
  }
  if (rating >= 1100) {
    return {
      tier: 'silver',
      badge: '🥈',
      name: lang === 'es' ? 'Veterano' : 'Veteran',
      color: '#bdc3c7',
      bg: 'rgba(189, 195, 199, 0.15)',
      border: 'rgba(189, 195, 199, 0.4)'
    };
  }
  return {
    tier: 'bronze',
    badge: '🥉',
    name: lang === 'es' ? 'Aspirante' : 'Aspirant',
    color: '#cd7f32',
    bg: 'rgba(205, 127, 50, 0.15)',
    border: 'rgba(205, 127, 50, 0.4)'
  };
}

/**
 * Reconstruye el ranking y ELO histórico de todos los jugadores a partir de las partidas verificadas
 */
export function computeLeagueEloStandings(players = [], matches = []) {
  const eloMap = {};

  // Inicializar ELO para cada jugador
  players.forEach(p => {
    eloMap[p.id || p.uid] = Number(p.elo) || DEFAULT_ELO;
  });

  // Ordenar partidas cronológicamente
  const sortedMatches = [...matches]
    .filter(m => m.verified && m.player1 && m.player2)
    .sort((a, b) => (new Date(a.date || a.timestamp || 0)) - (new Date(b.date || b.timestamp || 0)));

  // Procesar historial de partidas
  sortedMatches.forEach(m => {
    const p1Id = m.player1;
    const p2Id = m.player2;

    const currentP1Elo = eloMap[p1Id] ?? DEFAULT_ELO;
    const currentP2Elo = eloMap[p2Id] ?? DEFAULT_ELO;

    const { newRatingA, newRatingB } = calculateMatchElo(
      currentP1Elo,
      currentP2Elo,
      m.result,
      m.vpScored,
      m.vpConceded
    );

    eloMap[p1Id] = newRatingA;
    eloMap[p2Id] = newRatingB;
  });

  return eloMap;
}
