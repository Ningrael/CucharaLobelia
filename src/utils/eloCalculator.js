// src/utils/eloCalculator.js

/**
 * Calculates ELO rating change for 1v1 match between Player A and Player B.
 * 
 * @param {number} ratingA Current ELO rating of Player A
 * @param {number} ratingB Current ELO rating of Player B
 * @param {number} actualScoreA Outcome for Player A: 1 for Win, 0.5 for Draw, 0 for Loss
 * @param {number} kFactor Rating volatility factor (default 32)
 * @returns {object} { newRatingA, newRatingB, deltaA, deltaB }
 */
export function calculate1v1Elo(ratingA = 1000, ratingB = 1000, actualScoreA, kFactor = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const actualScoreB = 1 - actualScoreA;

  const deltaA = Math.round(kFactor * (actualScoreA - expectedA));
  const deltaB = Math.round(kFactor * (actualScoreB - expectedB));

  return {
    newRatingA: Math.max(0, ratingA + deltaA),
    newRatingB: Math.max(0, ratingB + deltaB),
    deltaA,
    deltaB
  };
}

/**
 * Calculates ELO rating change for 2v2 doubles match (Team 1 vs Team 2).
 * Uses average team ELO for calculation and distributes the delta equally.
 * 
 * @param {number[]} team1Elos Array of 2 player ELOs for Team 1 [eloA, eloB]
 * @param {number[]} team2Elos Array of 2 player ELOs for Team 2 [eloC, eloD]
 * @param {number} actualScoreTeam1 Outcome for Team 1: 1 for Win, 0.5 for Draw, 0 for Loss
 * @param {number} kFactor Rating volatility factor (default 32)
 * @returns {object} { newTeam1Elos, newTeam2Elos, deltaTeam1, deltaTeam2 }
 */
export function calculate2v2Elo(team1Elos = [1000, 1000], team2Elos = [1000, 1000], actualScoreTeam1, kFactor = 32) {
  const avgTeam1 = (team1Elos[0] + team1Elos[1]) / 2;
  const avgTeam2 = (team2Elos[0] + team2Elos[1]) / 2;

  const { deltaA, deltaB } = calculate1v1Elo(avgTeam1, avgTeam2, actualScoreTeam1, kFactor);

  return {
    newTeam1Elos: [
      Math.max(0, team1Elos[0] + deltaA),
      Math.max(0, team1Elos[1] + deltaA)
    ],
    newTeam2Elos: [
      Math.max(0, team2Elos[0] + deltaB),
      Math.max(0, team2Elos[1] + deltaB)
    ],
    deltaTeam1: deltaA,
    deltaTeam2: deltaB
  };
}
