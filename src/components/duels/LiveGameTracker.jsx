// src/components/duels/LiveGameTracker.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tracker de Partida en Vivo — La Cuchara de Lobelia
// Seguimiento sincronizado en tiempo real de M/W/F/W de héroes, bajas,
// alertas de Break Point (50%) y 25% (Quartered).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { calculateBreakPoint, calculateQuartered, getArmyStatus } from '../../utils/armyRules';

export default function LiveGameTracker({
  matchId,
  currentUserId,
  lang,
  onEndMatch,
  onOpenModelCard
}) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Escuchar estado del match en tiempo real ────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    const unsub = onSnapshot(doc(db, 'live_matches', matchId), (docSnap) => {
      if (docSnap.exists()) {
        setMatchData({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }, (err) => {
      console.error('Error listening to live match:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [matchId]);

  if (loading || !matchData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚔️</div>
        <div>Cargando tracker de partida en vivo...</div>
      </div>
    );
  }

  const {
    player1,
    player2,
    mission,
    round = 1
  } = matchData;

  const isPlayer1 = player1?.uid === currentUserId;
  const myPlayerKey = isPlayer1 ? 'player1' : 'player2';
  const rivalPlayerKey = isPlayer1 ? 'player2' : 'player1';

  const myData = matchData[myPlayerKey] || {};
  const rivalData = matchData[rivalPlayerKey] || {};

  // Cálculo de bajas y estados
  const myStatus = getArmyStatus(myData.totalModels || 0, myData.casualties || 0);
  const rivalStatus = getArmyStatus(rivalData.totalModels || 0, rivalData.casualties || 0);

  // ── Actualizar contadores de un héroe propio ────────────────────────────────
  const handleUpdateHeroStat = async (heroIdx, statName, delta) => {
    const heroes = [...(myData.heroes || [])];
    const target = heroes[heroIdx];
    if (!target) return;

    const currentVal = target[statName] ?? 0;
    const maxVal = target[`max${statName}`] ?? 10;
    const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));

    heroes[heroIdx] = {
      ...target,
      [statName]: newVal,
      isDead: statName === 'currentWounds' ? newVal === 0 : target.isDead
    };

    try {
      await updateDoc(doc(db, 'live_matches', matchId), {
        [`${myPlayerKey}.heroes`]: heroes,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating hero stat:', err);
    }
  };

  // ── Modificar bajas del ejército propio ─────────────────────────────────────
  const handleUpdateCasualties = async (delta) => {
    const currentCas = myData.casualties || 0;
    const total = myData.totalModels || 0;
    const newCas = Math.max(0, Math.min(total, currentCas + delta));

    try {
      await updateDoc(doc(db, 'live_matches', matchId), {
        [`${myPlayerKey}.casualties`]: newCas,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating casualties:', err);
    }
  };

  // ── Avanzar ronda ───────────────────────────────────────────────────────────
  const handleNextRound = async () => {
    try {
      await updateDoc(doc(db, 'live_matches', matchId), {
        round: (round || 1) + 1,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error advancing round:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '750px', margin: '0 auto', paddingBottom: '80px' }}>

      {/* ── CABECERA DE LA PARTIDA ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1f1b15 0%, #12100d 100%)',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: 'bold', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Misión Matched Play
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#f0e6d2', fontFamily: 'var(--font-title)' }}>
            {mission?.name || 'Misión MESBG'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(212,175,55,0.15)',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: '8px',
              padding: '6px 12px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.62rem', color: '#aaa', textTransform: 'uppercase' }}>Ronda</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#d4af37' }}>{round}</div>
          </div>

          <button
            onClick={handleNextRound}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            +1 Ronda
          </button>

          <button
            onClick={onEndMatch}
            style={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🏁 Finalizar
          </button>
        </div>
      </div>

      {/* ── PANEL DE MI EJÉRCITO (INTERACTIVO) ── */}
      <div
        style={{
          background: '#161411',
          border: '1px solid rgba(46, 204, 113, 0.4)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', color: '#2ecc71', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🟢</span> <span>Tu Ejército ({myData.name || 'Tú'})</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
            {myStatus.alive} / {myData.totalModels} miniaturas vivas
          </span>
        </div>

        {/* 🚨 ALERTAS DE BREAK POINT (50%) Y QUARTERED (25%) */}
        {myStatus.isBroken && (
          <div style={{ background: 'rgba(231, 76, 60, 0.25)', border: '1px solid #e74c3c', color: '#ff7675', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 'bold', textAlign: 'center', animation: 'pulse 2s infinite' }}>
            🚨 ¡EJÉRCITO DESMORONADO! (Has alcanzado el 50% de bajas)
          </div>
        )}
        {myStatus.isQuartered && (
          <div style={{ background: 'rgba(230, 126, 34, 0.25)', border: '1px solid #e67e22', color: '#ffb74d', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 'bold', textAlign: 'center' }}>
            ⚠️ ¡REDUCIDO AL 25%! (Quedan {myStatus.alive} o menos miniaturas)
          </div>
        )}

        {/* Contador de Bajas */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Bajas acumuladas:</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
              {myData.casualties || 0} <span style={{ fontSize: '0.75rem', color: '#777' }}>/ {myStatus.breakPoint} para Break Point</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleUpdateCasualties(-1)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              -
            </button>
            <button
              onClick={() => handleUpdateCasualties(1)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              +1 Baja
            </button>
          </div>
        </div>

        {/* Héroes de Mi Ejército */}
        <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Héroes & Recursos
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(myData.heroes || []).map((h, hIdx) => (
            <div
              key={hIdx}
              style={{
                background: h.isDead ? 'rgba(50,10,10,0.4)' : 'rgba(255,255,255,0.03)',
                border: h.isDead ? '1px solid rgba(231,76,60,0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '10px 14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  onClick={() => onOpenModelCard && onOpenModelCard(h)}
                  style={{ fontWeight: 'bold', color: h.isDead ? '#e74c3c' : '#f0e6d2', fontSize: '0.88rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {h.name} {h.isDead && '💀 (MUERTO)'}
                </span>
              </div>

              {/* Botones de Recursos (+ / -) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                {/* Heridas */}
                <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#ff7675', fontWeight: 'bold' }}>HERIDAS</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: '2px 0' }}>{h.currentWounds ?? h.wounds ?? 1}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentWounds', -1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(231, 76, 60, 0.4)', color: '#fff', cursor: 'pointer' }}>-</button>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentWounds', 1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(231, 76, 60, 0.4)', color: '#fff', cursor: 'pointer' }}>+</button>
                  </div>
                </div>

                {/* Poder (Might) */}
                <div style={{ background: 'rgba(241, 196, 15, 0.1)', border: '1px solid rgba(241, 196, 15, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#f1c40f', fontWeight: 'bold' }}>MIGHT</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: '2px 0' }}>{h.currentMight ?? h.might ?? 0}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentMight', -1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(241, 196, 15, 0.3)', color: '#fff', cursor: 'pointer' }}>-</button>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentMight', 1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(241, 196, 15, 0.3)', color: '#fff', cursor: 'pointer' }}>+</button>
                  </div>
                </div>

                {/* Voluntad (Will) */}
                <div style={{ background: 'rgba(52, 152, 219, 0.1)', border: '1px solid rgba(52, 152, 219, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#3498db', fontWeight: 'bold' }}>WILL</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: '2px 0' }}>{h.currentWill ?? h.will ?? 0}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentWill', -1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(52, 152, 219, 0.3)', color: '#fff', cursor: 'pointer' }}>-</button>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentWill', 1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(52, 152, 219, 0.3)', color: '#fff', cursor: 'pointer' }}>+</button>
                  </div>
                </div>

                {/* Destino (Fate) */}
                <div style={{ background: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.3)', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#2ecc71', fontWeight: 'bold' }}>FATE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: '2px 0' }}>{h.currentFate ?? h.fate ?? 0}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentFate', -1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(46, 204, 113, 0.3)', color: '#fff', cursor: 'pointer' }}>-</button>
                    <button onClick={() => handleUpdateHeroStat(hIdx, 'currentFate', 1)} style={{ padding: '1px 6px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'rgba(46, 204, 113, 0.3)', color: '#fff', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PANEL DEL RIVAL (EN TIEMPO REAL) ── */}
      <div
        style={{
          background: '#161411',
          border: '1px solid rgba(231, 76, 60, 0.4)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔴</span> <span>Rival ({rivalData.name || 'Rival'})</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
            {rivalStatus.alive} / {rivalData.totalModels} miniaturas vivas
          </span>
        </div>

        {rivalStatus.isBroken && (
          <div style={{ background: 'rgba(231, 76, 60, 0.25)', border: '1px solid #e74c3c', color: '#ff7675', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 'bold', textAlign: 'center' }}>
            🚨 ¡RIVAL DESMORONADO (BREAK POINT ALCANZADO)!
          </div>
        )}
        {rivalStatus.isQuartered && (
          <div style={{ background: 'rgba(230, 126, 34, 0.25)', border: '1px solid #e67e22', color: '#ffb74d', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 'bold', textAlign: 'center' }}>
            ⚠️ ¡RIVAL AL 25% O MENOS!
          </div>
        )}

        <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '8px' }}>
          Bajas del rival: <strong>{rivalData.casualties || 0}</strong> ({rivalStatus.breakPoint} para Break Point)
        </div>

        {/* Héroes del Rival */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(rivalData.heroes || []).map((h, rIdx) => (
            <div
              key={rIdx}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span
                onClick={() => onOpenModelCard && onOpenModelCard(h)}
                style={{ fontWeight: '500', color: h.isDead ? '#e74c3c' : '#e0d5c1', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {h.name} {h.isDead && '💀'}
              </span>
              <div style={{ fontSize: '0.75rem', color: '#ccc', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#ff7675' }}>❤️ {h.currentWounds ?? h.wounds ?? 1}</span>
                <span style={{ color: '#f1c40f' }}>⚡ {h.currentMight ?? h.might ?? 0}</span>
                <span style={{ color: '#3498db' }}>🔮 {h.currentWill ?? h.will ?? 0}</span>
                <span style={{ color: '#2ecc71' }}>🍀 {h.currentFate ?? h.fate ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
