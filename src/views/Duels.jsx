// src/views/Duels.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Vista Principal de Duelos y Desafíos — La Cuchara de Lobelia
// Gestión de emparejamientos, negociación de listas, misiones y ELO en vivo.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../utils/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import {
  previewELOChanges,
  calculateBreakPoint,
  calculateQuartered
} from '../utils/armyRules';

export default function Duels({ user, profile, lang, setView }) {
  const [subView, setSubView] = useState('lobby'); // 'lobby' | 'new_challenge' | 'negotiation' | 'select_list' | 'select_mission'
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  // ── Lista de jugadores registrados para buscar ──────────────────────────────
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [selectedRival, setSelectedRival] = useState(null);

  // ── Parámetros del nuevo desafío ────────────────────────────────────────────
  const [challengePoints, setChallengePoints] = useState(750);
  const [allowCivilWar, setAllowCivilWar] = useState(true);
  const [challengerSide, setChallengerSide] = useState('any'); // 'good' | 'evil' | 'any'
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  // ── Listas de ejército del usuario ──────────────────────────────────────────
  const [myArmyLists, setMyArmyLists] = useState([]);

  // ── Notificaciones ──────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const myElo = profile?.elo || 1200;

  // ── Escuchar desafíos en tiempo real ─────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoadingChallenges(false);
      return;
    }

    setLoadingChallenges(true);
    // Escuchar como retador
    const q1 = query(collection(db, 'challenges'), where('challengerId', '==', user.uid));
    // Escuchar como rival
    const q2 = query(collection(db, 'challenges'), where('rivalId', '==', user.uid));

    const challengesMap = new Map();

    const updateState = () => {
      const list = Array.from(challengesMap.values());
      list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setChallenges(list);
      setLoadingChallenges(false);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      snap.docs.forEach(d => challengesMap.set(d.id, { id: d.id, ...d.data() }));
      snap.docChanges().forEach(c => {
        if (c.type === 'removed') challengesMap.delete(c.doc.id);
      });
      updateState();
    }, (err) => {
      console.warn('Fallback Firestore listener q1:', err);
      setLoadingChallenges(false);
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      snap.docs.forEach(d => challengesMap.set(d.id, { id: d.id, ...d.data() }));
      snap.docChanges().forEach(c => {
        if (c.type === 'removed') challengesMap.delete(c.doc.id);
      });
      updateState();
    }, (err) => {
      console.warn('Fallback Firestore listener q2:', err);
      setLoadingChallenges(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // ── Cargar jugadores y listas del usuario ────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Cargar jugadores para retar
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'players'));
        const players = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(p => p.uid !== user.uid);
        setAllPlayers(players);
      } catch (err) {
        console.error('Error cargando jugadores:', err);
      }
    })();

    // Cargar listas guardadas del usuario
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'army_lists', user.uid, 'lists'));
        const lists = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyArmyLists(lists);
      } catch (err) {
        console.error('Error cargando listas:', err);
      }
    })();
  }, [user]);

  // ── Calcular preview de ELO ─────────────────────────────────────────────────
  const eloPreview = useMemo(() => {
    if (!selectedRival) return null;
    const rivalElo = selectedRival.elo || 1200;
    return previewELOChanges(myElo, rivalElo);
  }, [myElo, selectedRival]);

  // ── Enviar nuevo desafío ────────────────────────────────────────────────────
  const handleSendChallenge = async () => {
    if (!selectedRival || !user) return;
    setIsCreatingChallenge(true);

    try {
      const challengeData = {
        challengerId: user.uid,
        challengerName: profile?.name || profile?.username || 'Jugador',
        challengerElo: myElo,
        rivalId: selectedRival.uid,
        rivalName: selectedRival.name || selectedRival.username || 'Rival',
        rivalElo: selectedRival.elo || 1200,
        status: 'pending', // 'pending' | 'negotiating' | 'accepted' | 'list_selection' | 'mission_selection' | 'live' | 'completed' | 'cancelled'
        params: {
          points: challengePoints,
          allowCivilWar,
          challengerSide
        },
        challengerList: null,
        rivalList: null,
        selectedMission: null,
        sourceType: 'friendly',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const ref = await addDoc(collection(db, 'challenges'), challengeData);
      showToast('⚔️ ¡Desafío enviado con éxito!');
      setSelectedRival(null);
      setSubView('lobby');
    } catch (err) {
      showToast(`Error al enviar desafío: ${err.message}`, 'error');
    }
    setIsCreatingChallenge(false);
  };

  // ── Aceptar desafío recibido ────────────────────────────────────────────────
  const handleAcceptChallenge = async (challengeId) => {
    try {
      await updateDoc(doc(db, 'challenges', challengeId), {
        status: 'list_selection',
        updatedAt: serverTimestamp()
      });
      showToast('✅ Desafío aceptado. ¡Selecciona tu lista de ejército!');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // ── Rechazar / Cancelar desafío ─────────────────────────────────────────────
  const handleCancelChallenge = async (challengeId) => {
    if (!confirm('¿Seguro que deseas cancelar o rechazar este desafío?')) return;
    try {
      await deleteDoc(doc(db, 'challenges', challengeId));
      showToast('Desafío cancelado.');
      setActiveChallenge(null);
      setSubView('lobby');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // ── Seleccionar lista para el duelo ─────────────────────────────────────────
  const handleSelectListForMatch = async (challenge, selectedList) => {
    try {
      const isChallenger = challenge.challengerId === user.uid;
      const updatePayload = isChallenger
        ? { challengerList: selectedList, updatedAt: serverTimestamp() }
        : { rivalList: selectedList, updatedAt: serverTimestamp() };

      // Si el rival ya tiene lista seleccionada, avanzar a selección de misión
      const otherHasList = isChallenger ? !!challenge.rivalList : !!challenge.challengerList;
      if (otherHasList) {
        updatePayload.status = 'mission_selection';
      }

      await updateDoc(doc(db, 'challenges', challenge.id), updatePayload);
      showToast('Lista asignada al duelo.');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const s = {
    page: { padding: '16px', maxWidth: '700px', margin: '0 auto', paddingBottom: '90px' },
    topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '10px' },
    title: { fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.04em' },
    btnPrimary: { background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' },
    btnSecondary: { background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', border: 'var(--border-glass)', borderRadius: '8px', padding: '9px 16px', fontSize: '0.82rem', cursor: 'pointer' },
    card: { background: 'var(--card-bg)', border: 'var(--border-glass)', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' },
    eloBadge: { background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: 'var(--gold-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' },
    searchInput: { width: '100%', background: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' },
    playerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' },
    playerRowSelected: { background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold-primary)' },
    toastBar: { position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'rgba(25,25,25,0.96)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '8px', padding: '10px 20px', fontSize: '0.82rem', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }
  };

  // ── SI NO HAY USUARIO ──
  if (!user) {
    return (
      <div style={s.page}>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚔️</div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Inicia sesión para lanzar y recibir desafíos
          </div>
          <div style={{ fontSize: '0.82rem' }}>
            Compite con otros jugadores, sube tu ELO y lleva el seguimiento de tus partidas en tiempo real.
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA LOBBY ──
  if (subView === 'lobby') {
    const pendingReceived = challenges.filter(c => c.rivalId === user.uid && c.status === 'pending');
    const pendingSent = challenges.filter(c => c.challengerId === user.uid && c.status === 'pending');
    const activeMatches = challenges.filter(c => c.status !== 'pending' && c.status !== 'completed' && c.status !== 'cancelled');

    return (
      <div style={s.page}>
        {toast && <div style={s.toastBar}>{toast.msg}</div>}

        {/* Cabecera de Duelos */}
        <div style={s.topBar}>
          <div>
            <div style={s.title}>⚔️ Duelos & Desafíos</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Tu ELO:</span>
              <span style={s.eloBadge}>🏆 {myElo} ELO</span>
            </div>
          </div>
          <button style={s.btnPrimary} onClick={() => setSubView('new_challenge')}>
            + Lanzar Desafío
          </button>
        </div>

        {/* Desafíos Recibidos */}
        {pendingReceived.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#ffb74d', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              ⚡ Desafíos Recibidos ({pendingReceived.length})
            </div>
            {pendingReceived.map(c => {
              const pElo = previewELOChanges(myElo, c.challengerElo || 1200);
              return (
                <div key={c.id} style={{ ...s.card, border: '1px solid #e67e22', background: 'rgba(230,126,34,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        ⚔️ {c.challengerName} te ha desafiado
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {c.params?.points} pts • {c.challengerElo || 1200} ELO
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(230,126,34,0.2)', color: '#ffb74d', fontWeight: 'bold' }}>
                      PENDIENTE
                    </span>
                  </div>

                  {/* Letra pequeña de ELO */}
                  <div style={{ fontSize: '0.68rem', color: '#aaa', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tu ELO: <strong>{myElo}</strong></span>
                    <span>🏆 +{pElo.win} / 🤝 {pElo.draw >= 0 ? `+${pElo.draw}` : pElo.draw} / 💀 {pElo.loss}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ ...s.btnPrimary, flex: 1 }} onClick={() => handleAcceptChallenge(c.id)}>
                      ✓ Aceptar Desafío
                    </button>
                    <button style={{ ...s.btnSecondary, color: '#f88' }} onClick={() => handleCancelChallenge(c.id)}>
                      ✕ Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Partidas en Curso o en Preparación */}
        {activeMatches.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--gold-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              🔥 Partidas en Curso ({activeMatches.length})
            </div>
            {activeMatches.map(c => {
              const isChallenger = c.challengerId === user.uid;
              const rivalName = isChallenger ? c.rivalName : c.challengerName;
              const hasMyList = isChallenger ? !!c.challengerList : !!c.rivalList;

              return (
                <div key={c.id} style={{ ...s.card, border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        vs {rivalName} ({c.params?.points} pts)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Estado: <strong style={{ color: 'var(--gold-primary)' }}>{c.status}</strong>
                      </div>
                    </div>
                    <button
                      style={{ ...s.btnPrimary, padding: '6px 12px', fontSize: '0.75rem' }}
                      onClick={() => {
                        setActiveChallenge(c);
                        if (!hasMyList) {
                          setSubView('select_list');
                        } else if (c.status === 'mission_selection') {
                          setSubView('select_mission');
                        } else {
                          setSubView('negotiation');
                        }
                      }}
                    >
                      Continuar ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Desafíos Enviados Pendientes */}
        {pendingSent.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              ⏳ Desafíos Enviados Esperando Respuesta ({pendingSent.length})
            </div>
            {pendingSent.map(c => (
              <div key={c.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      vs {c.rivalName} ({c.params?.points} pts)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Esperando que {c.rivalName} acepte el duelo...
                    </div>
                  </div>
                  <button style={{ ...s.btnSecondary, color: '#f88', fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => handleCancelChallenge(c.id)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado Vacío */}
        {challenges.length === 0 && !loadingChallenges && (
          <div style={{ ...s.card, textAlign: 'center', padding: '32px 20px', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>⚔️</div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
              No tienes duelos activos
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
              ¡Reta a un compañero del club o de la liga y empieza a jugar!
            </div>
            <button style={s.btnPrimary} onClick={() => setSubView('new_challenge')}>
              + Lanzar mi primer desafío
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── VISTA NUEVO DESAFÍO ──
  if (subView === 'new_challenge') {
    const filteredPlayers = allPlayers.filter(p => {
      const q = playerSearchQuery.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q);
    });

    return (
      <div style={s.page}>
        {toast && <div style={s.toastBar}>{toast.msg}</div>}

        <div style={s.topBar}>
          <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => setSubView('lobby')}>
            ← Volver
          </button>
          <div style={{ ...s.title, fontSize: '1.1rem' }}>Lanzar Desafío</div>
          <div style={{ width: '40px' }} />
        </div>

        {/* Paso 1: Seleccionar Rival */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            1. Elige a tu rival
          </div>
          <input
            style={s.searchInput}
            placeholder="Buscar jugador por nombre o usuario..."
            value={playerSearchQuery}
            onChange={e => setPlayerSearchQuery(e.target.value)}
          />

          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
            {filteredPlayers.map(p => {
              const isSel = selectedRival?.uid === p.uid;
              return (
                <div
                  key={p.uid}
                  style={isSel ? { ...s.playerRow, ...s.playerRowSelected } : s.playerRow}
                  onClick={() => setSelectedRival(p)}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.88rem' }}>
                      {p.name || p.username}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#aaa' }}>
                      {p.faction || 'Sin facción'} • 🏆 {p.elo || 1200} ELO
                    </div>
                  </div>
                  {isSel && <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>✓</span>}
                </div>
              );
            })}
            {filteredPlayers.length === 0 && (
              <div style={{ textAlign: 'center', color: '#777', padding: '16px', fontSize: '0.8rem' }}>
                No se encontraron jugadores registrados con ese nombre.
              </div>
            )}
          </div>
        </div>

        {/* Paso 2: Configuración de Parámetros */}
        {selectedRival && (
          <div style={{ ...s.card, marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              2. Parámetros de la partida
            </div>

            {/* Selector de Puntos */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Puntos acordados:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[500, 600, 700, 750, 800, 1000].map(pts => (
                  <button
                    key={pts}
                    onClick={() => setChallengePoints(pts)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'var(--border-glass)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: challengePoints === pts ? 'bold' : 'normal',
                      background: challengePoints === pts ? 'var(--gold-primary)' : 'transparent',
                      color: challengePoints === pts ? '#000' : 'var(--text-muted)'
                    }}
                  >
                    {pts} pts
                  </button>
                ))}
              </div>
            </div>

            {/* Bando */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Tu bando sugerido:</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'any', label: 'Indiferente' },
                  { id: 'good', label: 'Luz (Good)' },
                  { id: 'evil', label: 'Oscuridad (Evil)' }
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => setChallengerSide(b.id)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'var(--border-glass)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: challengerSide === b.id ? 'bold' : 'normal',
                      background: challengerSide === b.id ? 'rgba(212,175,55,0.2)' : 'transparent',
                      color: challengerSide === b.id ? 'var(--gold-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CUADRO DISCRETO DE ELO (TRANSPARENCIA) ── */}
            {eloPreview && (
              <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', marginTop: '10px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Impacto estimado en tu ELO
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#f0e6d2' }}>
                  <span>Tu ELO: <strong>{myElo}</strong></span>
                  <span>Rival ({selectedRival.name || selectedRival.username}): <strong>{selectedRival.elo || 1200}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#2ecc71' }}>🏆 Ganar: <strong>+{eloPreview.win} pts</strong></span>
                  <span style={{ color: '#3498db' }}>🤝 Empate: <strong>{eloPreview.draw >= 0 ? `+${eloPreview.draw}` : eloPreview.draw} pts</strong></span>
                  <span style={{ color: '#e74c3c' }}>💀 Perder: <strong>{eloPreview.loss} pts</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón de Enviar Desafío */}
        <button
          style={{ ...s.btnPrimary, width: '100%', padding: '12px', fontSize: '0.9rem', opacity: (!selectedRival || isCreatingChallenge) ? 0.5 : 1 }}
          disabled={!selectedRival || isCreatingChallenge}
          onClick={handleSendChallenge}
        >
          {isCreatingChallenge ? 'Enviando...' : '⚔️ Enviar Desafío al Rival'}
        </button>
      </div>
    );
  }

  // ── VISTA SELECCIÓN DE LISTA ──
  if (subView === 'select_list' && activeChallenge) {
    return (
      <div style={s.page}>
        {toast && <div style={s.toastBar}>{toast.msg}</div>}

        <div style={s.topBar}>
          <button style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => setSubView('lobby')}>
            ← Volver
          </button>
          <div style={{ ...s.title, fontSize: '1.1rem' }}>Elige tu Lista</div>
          <div style={{ width: '40px' }} />
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Selecciona la lista con la que jugarás este duelo ({activeChallenge.params?.points} pts).
        </div>

        {myArmyLists.map(list => (
          <div key={list.id} style={{ ...s.card, cursor: 'pointer' }} onClick={() => handleSelectListForMatch(activeChallenge, list)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  {list.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {list.stats?.totalPoints || 0} pts • {list.stats?.totalModels || 0} miniaturas
                </div>
              </div>
              <button style={{ ...s.btnPrimary, padding: '6px 12px', fontSize: '0.75rem' }}>
                Usar esta lista
              </button>
            </div>
          </div>
        ))}

        {myArmyLists.length === 0 && (
          <div style={{ ...s.card, textAlign: 'center', padding: '24px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              No tienes listas guardadas en el Army Builder.
            </div>
            <button style={s.btnPrimary} onClick={() => setView('army')}>
              + Crear una lista ahora
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
