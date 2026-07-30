// src/views/Ranking.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Modal from '../components/Modal';

export default function Ranking({ user, profile, lang, onStartChallenge }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerMatches, setPlayerMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Fetch all players and sort by ELO > VP Diff > Leaders Killed > Wins
  useEffect(() => {
    const playersRef = collection(db, 'players');
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const elo = data.elo !== undefined && data.elo !== null ? data.elo : 1000;
        const wins = data.wins || 0;
        const draws = data.draws || 0;
        const losses = data.losses || 0;
        const vpScored = data.vpScored || 0;
        const vpConceded = data.vpConceded || 0;
        const vpDiff = vpScored - vpConceded;
        const leadersKilled = data.leadersKilled || 0;

        list.push({
          id: docSnap.id,
          uid: docSnap.id,
          name: data.name || data.username || 'Jugador',
          username: data.username || '',
          email: data.email || '',
          faction: data.faction || 'Desconocida',
          alignment: data.alignment || 'luz',
          elo,
          wins,
          draws,
          losses,
          matchesPlayed: data.matchesPlayed || 0,
          vpScored,
          vpConceded,
          vpDiff,
          leadersKilled,
          leadersLost: data.leadersLost || 0
        });
      });

      // Sort by ELO desc, then vpDiff desc, then leadersKilled desc, then wins desc
      list.sort((a, b) => {
        if (b.elo !== a.elo) return b.elo - a.elo;
        if (b.vpDiff !== a.vpDiff) return b.vpDiff - a.vpDiff;
        if (b.leadersKilled !== a.leadersKilled) return b.leadersKilled - a.leadersKilled;
        return b.wins - a.wins;
      });

      setPlayers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch match history when a player is selected
  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerMatches([]);
      return;
    }

    setLoadingMatches(true);
    const challengesRef = collection(db, 'challenges');
    const unsubscribe = onSnapshot(challengesRef, (snapshot) => {
      const matches = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'completed') {
          const isParticipant = 
            data.challengerUid === selectedPlayer.uid ||
            data.targetUid === selectedPlayer.uid ||
            (data.challengerTeam && data.challengerTeam.includes(selectedPlayer.uid)) ||
            (data.targetTeam && data.targetTeam.includes(selectedPlayer.uid));

          if (isParticipant) {
            matches.push({ id: docSnap.id, ...data });
          }
        }
      });

      matches.sort((a, b) => {
        const tA = a.completedAt?.toMillis ? a.completedAt.toMillis() : 0;
        const tB = b.completedAt?.toMillis ? b.completedAt.toMillis() : 0;
        return tB - tA;
      });

      setPlayerMatches(matches);
      setLoadingMatches(false);
    });

    return () => unsubscribe();
  }, [selectedPlayer]);

  const filteredPlayers = players.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.faction.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-primary)', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
          🏆 {lang === 'es' ? 'Ranking Global ELO' : 'Global ELO Ranking'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
          {lang === 'es'
            ? 'Clasificación de todos los jugadores basada en sistema ELO. Criterio de desempate: Dif. PVs ➔ Líderes Matados.'
            : 'All players ranked by ELO system. Tiebreakers: VP Diff ➔ Leaders Killed.'}
        </p>
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'es' ? '🔍 Buscar por jugador o facción...' : '🔍 Search player or faction...'}
          style={{
            width: '100%',
            maxWidth: '450px',
            padding: '10px 14px',
            borderRadius: '20px',
            border: 'var(--border-glass)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {lang === 'es' ? 'Cargando ranking...' : 'Loading ranking...'}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {lang === 'es' ? 'No se encontraron jugadores.' : 'No players found.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredPlayers.map((player, index) => {
            const rank = index + 1;
            const isMe = user && player.uid === user.uid;

            let rankBadge = `#${rank}`;
            let rankColor = 'var(--text-secondary)';
            if (rank === 1) { rankBadge = '🥇 #1'; rankColor = '#ffd700'; }
            else if (rank === 2) { rankBadge = '🥈 #2'; rankColor = '#c0c0c0'; }
            else if (rank === 3) { rankBadge = '🥉 #3'; rankColor = '#cd7f32'; }

            return (
              <div
                key={player.uid}
                onClick={() => setSelectedPlayer(player)}
                className="league-row-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isMe ? 'rgba(203, 161, 53, 0.12)' : 'rgba(255,255,255,0.03)',
                  border: isMe ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {/* Position & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', color: rankColor, minWidth: '42px', textAlign: 'center' }}>
                    {rankBadge}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name}
                      </span>
                      {isMe && (
                        <span style={{ background: 'var(--gold-primary)', color: '#000', fontSize: '0.65rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px' }}>
                          {lang === 'es' ? 'TÚ' : 'YOU'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🚩 {player.faction} ({player.wins}V / {player.draws}E / {player.losses}D)
                    </span>
                  </div>
                </div>

                {/* ELO & Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '1.1rem', fontFamily: 'monospace' }}>
                      {player.elo} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ELO</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: player.vpDiff >= 0 ? '#4cd137' : '#e84118' }}>
                      {player.vpDiff >= 0 ? `+${player.vpDiff}` : player.vpDiff} Dif. PV
                    </span>
                  </div>
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>➔</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalle de Jugador + Historial de Partidas */}
      {selectedPlayer && (
        <Modal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          title={selectedPlayer.name}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header del Perfil */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{selectedPlayer.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{selectedPlayer.username} • 🚩 {selectedPlayer.faction}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--gold-primary)', fontFamily: 'monospace' }}>
                  {selectedPlayer.elo} ELO
                </span>
              </div>
            </div>

            {/* Tarjetas de Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', border: 'var(--border-glass)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{lang === 'es' ? 'Partidas' : 'Matches'}</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{selectedPlayer.matchesPlayed}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', border: 'var(--border-glass)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>V / E / D</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#4cd137' }}>{selectedPlayer.wins}/{selectedPlayer.draws}/{selectedPlayer.losses}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', border: 'var(--border-glass)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Dif. PV</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: selectedPlayer.vpDiff >= 0 ? '#4cd137' : '#e84118' }}>
                  {selectedPlayer.vpDiff >= 0 ? `+${selectedPlayer.vpDiff}` : selectedPlayer.vpDiff}
                </span>
              </div>
            </div>

            {/* Botón Desafiar */}
            {user && selectedPlayer.uid !== user.uid && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = selectedPlayer;
                  setSelectedPlayer(null);
                  if (onStartChallenge) onStartChallenge(target);
                }}
                style={{ width: '100%', padding: '10px', fontSize: '0.92rem', fontWeight: 'bold' }}
              >
                ⚡ {lang === 'es' ? `Desafiar a ${selectedPlayer.name}` : `Challenge ${selectedPlayer.name}`}
              </button>
            )}

            {/* Historial de Batallas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                📜 {lang === 'es' ? 'Historial de Batallas' : 'Battle History'}
              </h4>

              {loadingMatches ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {lang === 'es' ? 'Cargando historial...' : 'Loading history...'}
                </div>
              ) : playerMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  {lang === 'es' ? 'No hay batallas registradas aún.' : 'No battles recorded yet.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                  {playerMatches.map((m) => {
                    const isWinner = m.result?.winnerUid === selectedPlayer.uid;
                    const isDraw = m.result?.winnerUid === 'draw';
                    const resultBadge = isDraw ? '⚖️ EMPATE' : isWinner ? '🏆 VICTORIA' : '❌ DERROTA';
                    const resultColor = isDraw ? 'var(--gold-primary)' : isWinner ? '#4cd137' : '#e84118';

                    return (
                      <div
                        key={m.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>
                            {m.type === '2v2' ? '👥 2v2 Dobles' : '⚔️ 1v1 Desafío'} — {m.mission?.name || 'Misión'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {m.points} pts • {m.civilWar ? 'Guerra Civil' : 'Normal'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 'bold', color: resultColor, fontSize: '0.78rem' }}>
                          {resultBadge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
