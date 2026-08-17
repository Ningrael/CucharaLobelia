// src/components/duels/GameScoringPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Panel de Puntuación, Cierre de Partida y ELO — La Cuchara de Lobelia
// Calcula los PVs según la misión, determina el resultado (Mayor/Menor/Empate)
// y actualiza el ELO de ambos jugadores con la fórmula FIDE estándar.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { db } from '../../utils/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { calculateELO, determineMatchOutcome } from '../../utils/armyRules';

export default function GameScoringPanel({
  matchData,
  currentUserId,
  lang,
  onClose,
  onFinished
}) {
  const [player1VP, setPlayer1VP] = useState(0);
  const [player2VP, setPlayer2VP] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcomeResult, setOutcomeResult] = useState(null);

  if (!matchData) return null;

  const {
    id: matchId,
    player1 = {},
    player2 = {},
    mission = {}
  } = matchData;

  const p1Elo = player1.elo || 1200;
  const p2Elo = player2.elo || 1200;

  // ── Calcular resultado y ELO ────────────────────────────────────────────────
  const handleConfirmScores = async () => {
    setIsSubmitting(true);

    const outcome = determineMatchOutcome(player1VP, player2VP);
    const p1EloResult = calculateELO(p1Elo, p2Elo, outcome.resultA);
    const p2EloResult = calculateELO(p2Elo, p1Elo, outcome.resultB);

    setOutcomeResult({
      outcome,
      p1EloResult,
      p2EloResult
    });

    try {
      // 1. Guardar resultado en el match
      await updateDoc(doc(db, 'live_matches', matchId), {
        status: 'completed',
        result: {
          player1VP,
          player2VP,
          outcome: outcome.outcome,
          p1EloDelta: p1EloResult.delta,
          p2EloDelta: p2EloResult.delta
        },
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Actualizar ELO de Jugador 1
      await updateDoc(doc(db, 'players', player1.uid), {
        elo: p1EloResult.newRating,
        matchesPlayed: increment(1),
        wins: outcome.resultA === 'win' ? increment(1) : increment(0),
        draws: outcome.resultA === 'draw' ? increment(1) : increment(0),
        losses: outcome.resultA === 'loss' ? increment(1) : increment(0),
        vpScored: increment(player1VP),
        vpConceded: increment(player2VP)
      });

      // 3. Actualizar ELO de Jugador 2
      await updateDoc(doc(db, 'players', player2.uid), {
        elo: p2EloResult.newRating,
        matchesPlayed: increment(1),
        wins: outcome.resultB === 'win' ? increment(1) : increment(0),
        draws: outcome.resultB === 'draw' ? increment(1) : increment(0),
        losses: outcome.resultB === 'loss' ? increment(1) : increment(0),
        vpScored: increment(player2VP),
        vpConceded: increment(player1VP)
      });

      // 4. Guardar en historial de partidas de ambos jugadores
      const matchRecordP1 = {
        matchId,
        rivalUid: player2.uid,
        rivalName: player2.name,
        myVP: player1VP,
        rivalVP: player2VP,
        result: outcome.resultA,
        eloDelta: p1EloResult.delta,
        newElo: p1EloResult.newRating,
        missionName: mission.name || 'Misión',
        date: serverTimestamp()
      };
      await setDoc(doc(db, 'players', player1.uid, 'matchHistory', matchId), matchRecordP1);

      const matchRecordP2 = {
        matchId,
        rivalUid: player1.uid,
        rivalName: player1.name,
        myVP: player2VP,
        rivalVP: player1VP,
        result: outcome.resultB,
        eloDelta: p2EloResult.delta,
        newElo: p2EloResult.newRating,
        missionName: mission.name || 'Misión',
        date: serverTimestamp()
      };
      await setDoc(doc(db, 'players', player2.uid, 'matchHistory', matchId), matchRecordP2);

      if (onFinished) onFinished();
    } catch (err) {
      console.error('Error submitting match result:', err);
    }
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#181512',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: '16px',
          maxWidth: '540px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
          color: '#e0d5c1'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🏆</div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#d4af37', fontFamily: 'var(--font-title)' }}>
            Puntuación & Cierre de Partida
          </h2>
          <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '4px' }}>
            Misión: <strong>{mission.name || 'Misión MESBG'}</strong>
          </div>
        </div>

        {/* ── SELECTOR DE PUNTOS DE VICTORIA (VP) ── */}
        {!outcomeResult ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              {/* Jugador 1 */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                  {player1.name || 'Jugador 1'}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '8px' }}>
                  {player1VP} <span style={{ fontSize: '0.8rem', color: '#888' }}>VP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button onClick={() => setPlayer1VP(Math.max(0, player1VP - 1))} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>-</button>
                  <button onClick={() => setPlayer1VP(player1VP + 1)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'var(--gold-primary)', color: '#000', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              </div>

              {/* Jugador 2 */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                  {player2.name || 'Jugador 2'}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '8px' }}>
                  {player2VP} <span style={{ fontSize: '0.8rem', color: '#888' }}>VP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button onClick={() => setPlayer2VP(Math.max(0, player2VP - 1))} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>-</button>
                  <button onClick={() => setPlayer2VP(player2VP + 1)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'var(--gold-primary)', color: '#000', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmScores}
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Guardando...' : '✓ Confirmar Resultado & Actualizar ELO'}
            </button>
          </div>
        ) : (
          /* ── RESULTADO FINAL Y CAMBIOS DE ELO ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#2ecc71', marginBottom: '14px' }}>
              {outcomeResult.outcome.label}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                <span>{player1.name}:</span>
                <strong style={{ color: outcomeResult.p1EloResult.delta >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  {outcomeResult.p1EloResult.newRating} ({outcomeResult.p1EloResult.delta >= 0 ? `+${outcomeResult.p1EloResult.delta}` : outcomeResult.p1EloResult.delta})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span>{player2.name}:</span>
                <strong style={{ color: outcomeResult.p2EloResult.delta >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  {outcomeResult.p2EloResult.newRating} ({outcomeResult.p2EloResult.delta >= 0 ? `+${outcomeResult.p2EloResult.delta}` : outcomeResult.p2EloResult.delta})
                </strong>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                background: 'var(--gold-primary)',
                color: '#000',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
