// src/utils/math.jsx

/**
 * Calcula la probabilidad exacta de éxito al lanzar un hechizo en MESBG.
 * @param {number} willPoints - Dados de Will rodados.
 * @param {number} difficulty - Dificultad del hechizo (2 a 6).
 * @param {number} mightPoints - Puntos de Might para modificar el resultado.
 * @returns {Object} { totalProbability, distribution }
 */
export function calculateSpellProbability(willPoints, difficulty, mightPoints) {
  const n = parseInt(willPoints) || 0;
  const diff = parseInt(difficulty) || 4;
  const might = parseInt(mightPoints) || 0;

  if (n <= 0) {
    return {
      totalProbability: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
  }

  // Distribución de probabilidad acumulada para un dado
  // Un dado individual modificado por Might obtiene un resultado >= X
  const distribution = {};
  for (let r = 1; r <= 6; r++) {
    let singleDieSuccessOutcomes = 0;
    for (let face = 1; face <= 6; face++) {
      const modified = Math.min(6, face + might);
      if (modified >= r) {
        singleDieSuccessOutcomes++;
      }
    }
    const pSingle = singleDieSuccessOutcomes / 6;
    // Probabilidad de obtener al menos un dado con resultado >= r
    const pAtLeastOne = 1 - Math.pow(1 - pSingle, n);
    distribution[r] = pAtLeastOne * 100;
  }

  return {
    totalProbability: distribution[diff] || 0,
    distribution
  };
}

/**
 * Calcula la probabilidad exacta de resistir un hechizo.
 * @param {number} willPoints - Dados de Will del defensor.
 * @param {number} rivalResult - Mayor resultado obtenido por el atacante (2 a 6).
 * @param {number} mightPoints - Puntos de Might del defensor.
 * @param {boolean} hasMagicResistance - Si tiene resistencia mágica (dado extra).
 * @returns {Object} { totalProbability, distribution }
 */
export function calculateResistProbability(willPoints, rivalResult, mightPoints, hasMagicResistance) {
  const will = parseInt(willPoints) || 0;
  const target = parseInt(rivalResult) || 4;
  const might = parseInt(mightPoints) || 0;
  const extraDice = hasMagicResistance ? 1 : 0;
  const totalDice = will + extraDice;

  if (totalDice <= 0) {
    return {
      totalProbability: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
  }

  const distribution = {};
  for (let r = 1; r <= 6; r++) {
    let singleDieSuccessOutcomes = 0;
    for (let face = 1; face <= 6; face++) {
      const modified = Math.min(6, face + might);
      if (modified >= r) {
        singleDieSuccessOutcomes++;
      }
    }
    const pSingle = singleDieSuccessOutcomes / 6;
    const pAtLeastOne = 1 - Math.pow(1 - pSingle, totalDice);
    distribution[r] = pAtLeastOne * 100;
  }

  return {
    totalProbability: distribution[target] || 0,
    distribution
  };
}

/**
 * Calcula la probabilidad exacta para un Duelo (Duel) de Combate en MESBG.
 * @param {Object} friendly - Atributos del bando amigo: { attacks, fv, hasBanner, twoHanded, elven }
 * @param {Object} enemy - Atributos del bando enemigo: { attacks, fv, hasBanner, twoHanded, elven }
 * @returns {Object} { friendlyWin, enemyWin, draw }
 */
export function calculateDuelProbability(friendly, enemy) {
  // Dados efectivos (los ataques + 1 dado por Estandarte)
  const dFriendly = (parseInt(friendly.attacks) || 1) + (friendly.hasBanner ? 1 : 0);
  const dEnemy = (parseInt(enemy.attacks) || 1) + (enemy.hasBanner ? 1 : 0);

  const fvF = parseInt(friendly.fv) || 3;
  const fvE = parseInt(enemy.fv) || 3;

  // 1. Obtener la función de probabilidad de masa (PMF) para el mejor resultado de cada bando
  const pmfFriendly = getBestRollPMF(dFriendly, friendly.twoHanded);
  const pmfEnemy = getBestRollPMF(dEnemy, enemy.twoHanded);

  let friendlyWinProb = 0;
  let enemyWinProb = 0;
  let tieProb = 0;

  // 2. Calcular probabilidades cruzadas
  for (let fRoll = 1; fRoll <= 6; fRoll++) {
    const pF = pmfFriendly[fRoll] || 0;
    if (pF === 0) continue;

    for (let eRoll = 1; eRoll <= 6; eRoll++) {
      const pE = pmfEnemy[eRoll] || 0;
      if (pE === 0) continue;

      const pState = pF * pE;

      if (fRoll > eRoll) {
        // Amigo gana directamente por tirada de dado superior
        friendlyWinProb += pState;
      } else if (eRoll > fRoll) {
        // Enemigo gana directamente por tirada de dado superior
        enemyWinProb += pState;
      } else {
        // Empate en los dados (fRoll === eRoll)
        // Desempate por Fight Value (Fv)
        if (fvF > fvE) {
          friendlyWinProb += pState;
        } else if (fvE > fvF) {
          enemyWinProb += pState;
        } else {
          // Empate en dados y empate en Fv -> Roll-off (Tirada de desempate 1d6)
          // Reglas de Arma Élfica en empates de Fv:
          // - Si Amigo tiene y Enemigo no: Amigo gana en 3-6 (2/3 de probabilidad)
          // - Si Enemigo tiene y Amigo no: Enemigo gana en 3-6 (Amigo gana en 1-2, 1/3 de probabilidad)
          // - Si ambos o ninguno tienen: 50/50 de probabilidad
          let friendlyRollOffWin = 0.5;
          if (friendly.elven && !enemy.elven) {
            friendlyRollOffWin = 4 / 6; // Gana con 3, 4, 5, 6
          } else if (!friendly.elven && enemy.elven) {
            friendlyRollOffWin = 2 / 6; // Gana con 5, 6 (el enemigo gana con 3, 4, 5, 6)
          }

          friendlyWinProb += pState * friendlyRollOffWin;
          enemyWinProb += pState * (1 - friendlyRollOffWin);
        }
      }
    }
  }

  // Suavizado cosmético para evitar ruidos decimales cuando las estadísticas son idénticas
  let friendlyWin = friendlyWinProb * 100;
  let enemyWin = enemyWinProb * 100;

  if (Math.abs(friendlyWin - 50) < 0.01 && Math.abs(enemyWin - 50) < 0.01) {
    friendlyWin = 50.0;
    enemyWin = 50.0;
  }

  return {
    friendlyWin: parseFloat(friendlyWin.toFixed(2)),
    enemyWin: parseFloat(enemyWin.toFixed(2)),
    draw: 0.0 // En el juego real siempre hay un ganador tras el desempate
  };
}

/**
 * Helper: Calcula la distribución de probabilidad (PMF) del mejor dado modificado.
 * @param {number} numDice - Número de dados que se tiran.
 * @param {boolean} isTwoHanded - Si sufre la penalización de arma a dos manos (-1).
 * @returns {Object} PMF del dado modificado (mapeo de resultado a probabilidad 0-1)
 */
function getBestRollPMF(numDice, isTwoHanded) {
  // CDF (Cumulative Distribution Function) del máximo de N dados normales de 6 caras
  // P(G <= k) = (k/6)^N
  const cdfMaxNormal = (k) => Math.pow(k / 6, numDice);

  // PMF (Probability Mass Function) de un dado normal
  // P(G = k) = P(G <= k) - P(G <= k-1)
  const pmfMaxNormal = {};
  for (let k = 1; k <= 6; k++) {
    pmfMaxNormal[k] = cdfMaxNormal(k) - cdfMaxNormal(k - 1);
  }

  if (!isTwoHanded) {
    return pmfMaxNormal;
  }

  // Con arma a dos manos (Two-Handed Weapon):
  // Cada dado natural d se modifica como: min(6, d - 1) excepto natural 6 que sigue siendo 6.
  // Por lo tanto, el mapeo de los resultados modificados es:
  // d=1 -> 1
  // d=2 -> 1
  // d=3 -> 2
  // d=4 -> 3
  // d=5 -> 4
  // d=6 -> 6
  // (Nota: es imposible obtener un 5 modificado).
  
  const pmfModified = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  
  // Mapeamos las probabilidades del valor natural al modificado:
  // Y = f(G)
  pmfModified[1] = cdfMaxNormal(2); // G = 1 o G = 2
  pmfModified[2] = pmfMaxNormal[3]; // G = 3
  pmfModified[3] = pmfMaxNormal[4]; // G = 4
  pmfModified[4] = pmfMaxNormal[5]; // G = 5
  pmfModified[5] = 0;              // Imposible obtener un 5
  pmfModified[6] = pmfMaxNormal[6]; // G = 6 (6 natural no se penaliza)

  return pmfModified;
}
