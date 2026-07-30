// src/views/Battles.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import Modal from '../components/Modal';
import { getRandomMission } from '../utils/missionsData';
import { calculate1v1Elo, calculate2v2Elo } from '../utils/eloCalculator';
import {
  LIGHT_FACTIONS,
  LIGHT_FACTIONS_LEGEND,
  DARK_FACTIONS,
  DARK_FACTIONS_LEGEND
} from '../utils/factions';

export default function Battles({ user, profile, lang, initialTargetUser, clearTargetUser, onOpenPdf }) {
  const [activeTab, setActiveTab] = useState('mis_desafios'); // 'mis_desafios' | 'nuevo_desafio'
  const [challenges, setChallenges] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario Crear Desafío
  const [battleType, setBattleType] = useState('1v1'); // '1v1' | '2v2'
  const [pointsInput, setPointsInput] = useState(600);
  const [civilWar, setCivilWar] = useState(false);
  const [myAlignment, setMyAlignment] = useState('luz');
  const [myFaction, setMyFaction] = useState('');
  const [targetUid, setTargetUid] = useState('');
  const [teammateUid, setTeammateUid] = useState('');
  const [armyListFile, setArmyListFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Sala de Batalla Activa
  const [activeChallenge, setActiveChallenge] = useState(null);

  // Formulario Cargar Resultado
  const [myVp, setMyVp] = useState(0);
  const [rivalVp, setRivalVp] = useState(0);
  const [myKilledLeader, setMyKilledLeader] = useState(false);
  const [rivalKilledLeader, setRivalKilledLeader] = useState(false);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  // Cargar lista de jugadores para selección
  useEffect(() => {
    const playersRef = collection(db, 'players');
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          name: d.name || d.username || 'Jugador',
          username: d.username || '',
          faction: d.faction || 'Desconocida',
          elo: d.elo || 1000
        });
      });
      setAllPlayers(list);
    });

    return () => unsubscribe();
  }, []);

  // Set initial target user if passed from Ranking view
  useEffect(() => {
    if (initialTargetUser) {
      setTargetUid(initialTargetUser.uid);
      setActiveTab('nuevo_desafio');
    }
  }, [initialTargetUser]);

  // Cargar Desafíos del usuario en tiempo real
  useEffect(() => {
    if (!user) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    const challengesRef = collection(db, 'challenges');
    const unsubscribe = onSnapshot(challengesRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const isMyChallenge =
          d.challengerUid === user.uid ||
          d.targetUid === user.uid ||
          (d.challengerTeam && d.challengerTeam.includes(user.uid)) ||
          (d.targetTeam && d.targetTeam.includes(user.uid));

        if (isMyChallenge) {
          list.push({ id: docSnap.id, ...d });
        }
      });

      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setChallenges(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper para comprimir imágenes de lista a Base64
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Enviar Desafío
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!user || !targetUid || !armyListFile || !myFaction) return;
    if (battleType === '2v2' && !teammateUid) return;

    setIsSubmitting(true);
    try {
      const compressedList = await compressImage(armyListFile);
      const mission = getRandomMission(battleType);

      const challengeData = {
        type: battleType,
        status: 'pending_accept',
        points: Number(pointsInput),
        civilWar: civilWar,
        challengerUid: user.uid,
        challengerTeam: battleType === '2v2' ? [user.uid, teammateUid] : [user.uid],
        targetUid: targetUid,
        targetTeam: [targetUid],
        factions: {
          [user.uid]: { alignment: myAlignment, faction: myFaction }
        },
        armyLists: {
          [user.uid]: compressedList
        },
        readyToStart: {
          [user.uid]: false
        },
        listsRevealed: false,
        mission: mission,
        rerollRequested: {},
        rerollUsed: false,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'challenges'), challengeData);

      // Limpiar y resetear
      setArmyListFile(null);
      setTargetUid('');
      setTeammateUid('');
      if (clearTargetUser) clearTargetUser();
      setActiveTab('mis_desafios');
      alert(lang === 'es' ? '¡Desafío enviado correctamente!' : 'Challenge sent successfully!');
    } catch (err) {
      console.error('Error creating challenge:', err);
      alert(lang === 'es' ? `Error al enviar desafío: ${err.message}` : `Error sending challenge: ${err.message}`);
    }
    setIsSubmitting(false);
  };

  // Aceptar Desafío (Rival sube su lista y facción)
  const handleAcceptChallenge = async (challenge, selectedFaction, selectedAlignment, file) => {
    if (!user || !file || !selectedFaction) return;

    try {
      const compressedList = await compressImage(file);
      const challengeRef = doc(db, 'challenges', challenge.id);

      const updatedFactions = { ...challenge.factions, [user.uid]: { alignment: selectedAlignment, faction: selectedFaction } };
      const updatedLists = { ...challenge.armyLists, [user.uid]: compressedList };

      await updateDoc(challengeRef, {
        status: 'preparing',
        factions: updatedFactions,
        armyLists: updatedLists
      });

      alert(lang === 'es' ? '¡Has aceptado el desafío! La batalla está en preparación.' : 'Challenge accepted!');
    } catch (err) {
      console.error('Error accepting challenge:', err);
      alert(err.message);
    }
  };

  // Marcar "Iniciar Batalla" (Listo)
  const handleToggleReady = async (challenge) => {
    if (!user) return;
    const challengeRef = doc(db, 'challenges', challenge.id);

    const readyState = { ...(challenge.readyToStart || {}), [user.uid]: true };
    const requiredPlayers = challenge.type === '2v2' ? 4 : 2;
    const readyCount = Object.values(readyState).filter(Boolean).length;
    const allReady = readyCount >= requiredPlayers;

    await updateDoc(challengeRef, {
      readyToStart: readyState,
      listsRevealed: allReady,
      status: allReady ? 'in_progress' : 'preparing'
    });
  };

  // Solicitar o Confirmar Re-sorteo de Misión
  const handleRerollMission = async (challenge) => {
    if (!user || challenge.rerollUsed) return;

    const challengeRef = doc(db, 'challenges', challenge.id);
    const updatedRerolls = { ...(challenge.rerollRequested || {}), [user.uid]: true };
    const requiredCount = challenge.type === '2v2' ? 2 : 2; // al menos 1 por bando
    const requestedCount = Object.values(updatedRerolls).filter(Boolean).length;

    if (requestedCount >= requiredCount) {
      // Ambos aceptaron -> volver a sortear
      const newMission = getRandomMission(challenge.type, challenge.mission.id);
      await updateDoc(challengeRef, {
        mission: newMission,
        rerollUsed: true,
        rerollRequested: updatedRerolls
      });
    } else {
      await updateDoc(challengeRef, {
        rerollRequested: updatedRerolls
      });
    }
  };

  // Cargar Resultado
  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!user || !activeChallenge) return;

    setIsSubmittingResult(true);
    try {
      const challengeRef = doc(db, 'challenges', activeChallenge.id);
      const isChallenger = activeChallenge.challengerUid === user.uid;
      const myUid = user.uid;
      const rivalUid = activeChallenge.targetUid;

      const vpObj = {
        [myUid]: Number(myVp),
        [rivalUid]: Number(rivalVp)
      };

      const killedLeaderObj = {
        [myUid]: myKilledLeader,
        [rivalUid]: rivalKilledLeader
      };

      let winnerUid = 'draw';
      if (Number(myVp) > Number(rivalVp)) winnerUid = myUid;
      else if (Number(rivalVp) > Number(myVp)) winnerUid = rivalUid;

      await updateDoc(challengeRef, {
        status: 'pending_verification',
        result: {
          submittedBy: user.uid,
          vp: vpObj,
          killedLeader: killedLeaderObj,
          winnerUid: winnerUid
        }
      });

      alert(lang === 'es' ? 'Resultado enviado. Esperando confirmación del rival.' : 'Result submitted. Waiting for rival confirmation.');
      setActiveChallenge(null);
    } catch (err) {
      console.error('Error submitting result:', err);
      alert(err.message);
    }
    setIsSubmittingResult(false);
  };

  // Confirmar/Verificar Resultado & Calcular ELO
  const handleVerifyResult = async (challenge) => {
    if (!user || !challenge.result) return;

    try {
      const challengeRef = doc(db, 'challenges', challenge.id);
      const p1Uid = challenge.challengerUid;
      const p2Uid = challenge.targetUid;

      const p1DocRef = doc(db, 'players', p1Uid);
      const p2DocRef = doc(db, 'players', p2Uid);

      const [p1Snap, p2Snap] = await Promise.all([getDoc(p1DocRef), getDoc(p2DocRef)]);
      const p1Data = p1Snap.exists() ? p1Snap.data() : {};
      const p2Data = p2Snap.exists() ? p2Snap.data() : {};

      const p1Elo = p1Data.elo || 1000;
      const p2Elo = p2Data.elo || 1000;

      const vp1 = challenge.result.vp[p1Uid] || 0;
      const vp2 = challenge.result.vp[p2Uid] || 0;

      let scoreP1 = 0.5; // Empate
      if (vp1 > vp2) scoreP1 = 1; // Victoria P1
      else if (vp2 > vp1) scoreP1 = 0; // Victoria P2

      // Calcular nuevo ELO
      const { newRatingA, newRatingB, deltaA, deltaB } = calculate1v1Elo(p1Elo, p2Elo, scoreP1);

      // Actualizar Jugador 1
      await updateDoc(p1DocRef, {
        elo: newRatingA,
        matchesPlayed: (p1Data.matchesPlayed || 0) + 1,
        wins: (p1Data.wins || 0) + (scoreP1 === 1 ? 1 : 0),
        draws: (p1Data.draws || 0) + (scoreP1 === 0.5 ? 1 : 0),
        losses: (p1Data.losses || 0) + (scoreP1 === 0 ? 1 : 0),
        vpScored: (p1Data.vpScored || 0) + vp1,
        vpConceded: (p1Data.vpConceded || 0) + vp2,
        leadersKilled: (p1Data.leadersKilled || 0) + (challenge.result.killedLeader[p1Uid] ? 1 : 0),
        leadersLost: (p1Data.leadersLost || 0) + (challenge.result.killedLeader[p2Uid] ? 1 : 0)
      });

      // Actualizar Jugador 2
      await updateDoc(p2DocRef, {
        elo: newRatingB,
        matchesPlayed: (p2Data.matchesPlayed || 0) + 1,
        wins: (p2Data.wins || 0) + (scoreP1 === 0 ? 1 : 0),
        draws: (p2Data.draws || 0) + (scoreP1 === 0.5 ? 1 : 0),
        losses: (p2Data.losses || 0) + (scoreP1 === 1 ? 1 : 0),
        vpScored: (p2Data.vpScored || 0) + vp2,
        vpConceded: (p2Data.vpConceded || 0) + vp1,
        leadersKilled: (p2Data.leadersKilled || 0) + (challenge.result.killedLeader[p2Uid] ? 1 : 0),
        leadersLost: (p2Data.leadersLost || 0) + (challenge.result.killedLeader[p1Uid] ? 1 : 0)
      });

      // Marcar Batalla como Completada
      await updateDoc(challengeRef, {
        status: 'completed',
        completedAt: new Date(),
        eloDeltas: {
          [p1Uid]: deltaA,
          [p2Uid]: deltaB
        }
      });

      alert(lang === 'es' ? '¡Batalla verificada y ranking ELO actualizado!' : 'Battle verified and ELO rating updated!');
    } catch (err) {
      console.error('Error verifying result:', err);
      alert(err.message);
    }
  };

  const currentFactionList = myAlignment === 'luz' ? LIGHT_FACTIONS : DARK_FACTIONS;
  const currentLegendList = myAlignment === 'luz' ? LIGHT_FACTIONS_LEGEND : DARK_FACTIONS_LEGEND;

  return (
    <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-primary)', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
          ⚔️ {lang === 'es' ? 'Sistema de Batallas & Desafíos' : 'Battle & Challenge System'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
          {lang === 'es'
            ? 'Desafía a otros jugadores a batallas 1v1 o 2v2 Dobles, oculta tu lista hasta empezar y actualiza tu ELO.'
            : 'Challenge other players to 1v1 or 2v2 battles, keep lists hidden until battle starts, and boost your ELO.'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('mis_desafios')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'mis_desafios' ? '3px solid var(--gold-primary)' : '3px solid transparent',
            color: activeTab === 'mis_desafios' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          🗡️ {lang === 'es' ? 'Mis Batallas' : 'My Battles'} ({challenges.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nuevo_desafio')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'nuevo_desafio' ? '3px solid var(--gold-primary)' : '3px solid transparent',
            color: activeTab === 'nuevo_desafio' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          ⚡ {lang === 'es' ? 'Crear Desafío' : 'Create Challenge'}
        </button>
      </div>

      {/* TAB 1: MIS DESAFÍOS */}
      {activeTab === 'mis_desafios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              {lang === 'es' ? 'Cargando batallas...' : 'Loading battles...'}
            </div>
          ) : challenges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: 'var(--border-glass)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>⚔️</span>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {lang === 'es' ? 'No tienes batallas o desafíos activos en este momento.' : 'No active battles or challenges.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('nuevo_desafio')}
                style={{ marginTop: '14px' }}
              >
                ⚡ {lang === 'es' ? 'Crear mi primer desafío' : 'Create my first challenge'}
              </button>
            </div>
          ) : (
            challenges.map((c) => {
              const isChallenger = c.challengerUid === user?.uid;
              const rivalUid = isChallenger ? c.targetUid : c.challengerUid;
              const rivalPlayer = allPlayers.find((p) => p.uid === rivalUid);
              const rivalName = rivalPlayer ? rivalPlayer.name : 'Jugador Rival';

              let statusBadge = '⏳ Pendiente de Aceptar';
              let badgeBg = 'rgba(255,165,0,0.15)';
              let badgeColor = '#ffa500';

              if (c.status === 'preparing') { statusBadge = '🛡️ En Preparación'; badgeBg = 'rgba(52,152,219,0.15)'; badgeColor = '#3498db'; }
              else if (c.status === 'in_progress') { statusBadge = '⚔️ ¡En Batalla!'; badgeBg = 'rgba(46,204,113,0.15)'; badgeColor = '#2ecc71'; }
              else if (c.status === 'pending_verification') { statusBadge = '⚖️ Pendiente Confirmar'; badgeBg = 'rgba(155,89,182,0.15)'; badgeColor = '#9b59b6'; }
              else if (c.status === 'completed') { statusBadge = '✅ Completada'; badgeBg = 'rgba(255,255,255,0.05)'; badgeColor = 'var(--text-muted)'; }

              return (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{c.type === '2v2' ? '👥' : '⚔️'}</span>
                      <div>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>
                          {isChallenger ? `Desafío a ${rivalName}` : `Desafío de ${rivalName}`}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {c.points} pts • {c.civilWar ? 'Guerra Civil Permitida' : 'Luz vs Oscuridad'}
                        </span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', background: badgeBg, color: badgeColor, fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {statusBadge}
                    </span>
                  </div>

                  {/* Acciones según Estado */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    {c.status === 'pending_accept' && !isChallenger && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          const faction = prompt(lang === 'es' ? 'Introduce tu facción para la batalla:' : 'Enter your faction for battle:');
                          if (faction) {
                            handleAcceptChallenge(c, faction, 'luz', null);
                          }
                        }}
                      >
                        ✅ {lang === 'es' ? 'Aceptar Desafío' : 'Accept Challenge'}
                      </button>
                    )}

                    {(c.status === 'preparing' || c.status === 'in_progress') && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setActiveChallenge(c)}
                      >
                        🏟️ {lang === 'es' ? 'Entrar a la Sala de Batalla' : 'Enter Battle Room'}
                      </button>
                    )}

                    {c.status === 'pending_verification' && c.result?.submittedBy !== user?.uid && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleVerifyResult(c)}
                      >
                        ✅ {lang === 'es' ? 'Confirmar Resultado' : 'Confirm Result'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: CREAR DESAFÍO */}
      {activeTab === 'nuevo_desafio' && (
        <form onSubmit={handleCreateChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: 'var(--border-glass)' }}>
          {/* Tipo de Batalla */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
              {lang === 'es' ? '1. Tipo de Batalla' : '1. Battle Type'}
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setBattleType('1v1')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: battleType === '1v1' ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.1)',
                  background: battleType === '1v1' ? 'rgba(203, 161, 53, 0.15)' : 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ⚔️ 1v1 Individual
              </button>
              <button
                type="button"
                onClick={() => setBattleType('2v2')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: battleType === '2v2' ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.1)',
                  background: battleType === '2v2' ? 'rgba(203, 161, 53, 0.15)' : 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                👥 2v2 Dobles
              </button>
            </div>
          </div>

          {/* Seleccionar Rival */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
              {lang === 'es' ? '2. Seleccionar Jugador Rival *' : '2. Select Rival Player *'}
            </label>
            <select
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              required
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'var(--border-glass)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="">{lang === 'es' ? '-- Elige un rival --' : '-- Choose a rival --'}</option>
              {allPlayers
                .filter((p) => p.uid !== user?.uid)
                .map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {p.name} (@{p.username}) — {p.elo} ELO
                  </option>
                ))}
            </select>
          </div>

          {/* Compañero (si es 2v2) */}
          {battleType === '2v2' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                {lang === 'es' ? '2b. Seleccionar tu Compañero (2v2) *' : '2b. Select your Teammate *'}
              </label>
              <select
                value={teammateUid}
                onChange={(e) => setTeammateUid(e.target.value)}
                required
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'var(--border-glass)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">{lang === 'es' ? '-- Elige un compañero --' : '-- Choose a teammate --'}</option>
                {allPlayers
                  .filter((p) => p.uid !== user?.uid && p.uid !== targetUid)
                  .map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.name} (@{p.username})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Puntos de la Batalla */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
              {lang === 'es' ? `3. Cantidad de Puntos: ${pointsInput} pts` : `3. Battle Points: ${pointsInput} pts`}
            </label>
            <input
              type="range"
              min="300"
              max="1500"
              step="50"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              style={{ accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Guerra Civil Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 'bold', display: 'block' }}>
                ⚔️ {lang === 'es' ? 'Permitir Guerra Civil' : 'Allow Civil War'}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'es' ? 'Si está desactivado, un jugador debe llevar Luz y el otro Oscuridad.' : 'If off, one player must bring Light and the other Dark.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={civilWar}
              onChange={(e) => setCivilWar(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          {/* Tu Facción y Alineamiento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
              {lang === 'es' ? '4. Tu Bando y Facción' : '4. Your Alignment & Faction'}
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#fff', fontSize: '0.88rem' }}>
                <input type="radio" name="myAlign" checked={myAlignment === 'luz'} onChange={() => { setMyAlignment('luz'); setMyFaction(''); }} />
                ☀️ {lang === 'es' ? 'Luz' : 'Light'}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#fff', fontSize: '0.88rem' }}>
                <input type="radio" name="myAlign" checked={myAlignment === 'oscuridad'} onChange={() => { setMyAlignment('oscuridad'); setMyFaction(''); }} />
                👁️ {lang === 'es' ? 'Oscuridad' : 'Darkness'}
              </label>
            </div>

            <select
              value={myFaction}
              onChange={(e) => setMyFaction(e.target.value)}
              required
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'var(--border-glass)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="">{lang === 'es' ? '-- Selecciona Facción --' : '-- Select Faction --'}</option>
              <optgroup label={lang === 'es' ? 'Ejércitos' : 'Armies'}>
                {currentFactionList.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </optgroup>
              <optgroup label={lang === 'es' ? 'Legiones Legendarias' : 'Legendary Legions'}>
                {currentLegendList.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Subir Foto de la Lista de Ejército */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
              📷 {lang === 'es' ? '5. Subir Imagen de tu Lista de Ejército (Oculta) *' : '5. Upload Army List Image (Hidden) *'}
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setArmyListFile(e.target.files?.[0] || null)}
              style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {lang === 'es' ? '🔒 La lista permanecerá oculta para tu rival hasta que ambos pulsen "Iniciar Batalla".' : '🔒 Kept hidden from rival until both click "Start Battle".'}
            </span>
          </div>

          {/* Botón Enviar Desafío */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !targetUid || !myFaction || !armyListFile}
            style={{ padding: '12px', fontSize: '1rem', marginTop: '8px' }}
          >
            {isSubmitting ? (lang === 'es' ? 'Enviando desafío...' : 'Sending challenge...') : (lang === 'es' ? '⚡ Enviar Desafío' : '⚡ Send Challenge')}
          </button>
        </form>
      )}

      {/* MODAL SALA DE BATALLA ACTIVA */}
      {activeChallenge && (
        <Modal
          isOpen={!!activeChallenge}
          onClose={() => setActiveChallenge(null)}
          title={`⚔️ Sala de Batalla (${activeChallenge.points} pts)`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Misión Sorteada */}
            <div style={{ background: 'rgba(203, 161, 53, 0.08)', border: '1px solid var(--gold-primary)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🎯 {lang === 'es' ? 'Misión Asignada' : 'Assigned Mission'}
              </span>
              <h3 style={{ margin: '6px 0', color: 'var(--gold-primary)', fontSize: '1.2rem' }}>
                {lang === 'es' ? activeChallenge.mission?.name_es : activeChallenge.mission?.name_en}
              </h3>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const pdfPath = lang === 'es' ? activeChallenge.mission?.pdf_es : activeChallenge.mission?.pdf_en;
                    if (onOpenPdf) onOpenPdf(pdfPath);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  📄 {lang === 'es' ? 'Ver PDF Misión' : 'View Mission PDF'}
                </button>
                {!activeChallenge.rerollUsed && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleRerollMission(activeChallenge)}
                    style={{ fontSize: '0.82rem', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    🎲 {lang === 'es' ? 'Volver a Sortear' : 'Re-roll Mission'}
                  </button>
                )}
              </div>
            </div>

            {/* Listas de Ejército (Ocultas o Reveladas) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                📋 {lang === 'es' ? 'Listas de Ejército' : 'Army Lists'}
              </h4>

              {!activeChallenge.listsRevealed ? (
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: 'var(--border-glass)' }}>
                  <span style={{ fontSize: '2rem', display: 'block' }}>🔒</span>
                  <p style={{ margin: '6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'es' ? 'Las listas están ocultas. Ambos deben pulsar "Iniciar Batalla" para revelarlas.' : 'Lists are hidden. Both must click "Start Battle" to reveal.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleToggleReady(activeChallenge)}
                    disabled={activeChallenge.readyToStart?.[user?.uid]}
                    style={{ marginTop: '10px' }}
                  >
                    {activeChallenge.readyToStart?.[user?.uid]
                      ? (lang === 'es' ? '⏳ Esperando al rival...' : '⏳ Waiting for rival...')
                      : (lang === 'es' ? '⚔️ Iniciar Batalla (Listo)' : '⚔️ Start Battle (Ready)')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {Object.entries(activeChallenge.armyLists || {}).map(([uid, imgData]) => {
                    const p = allPlayers.find((player) => player.uid === uid);
                    return (
                      <div key={uid} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                          📜 {p ? p.name : 'Jugador'}:
                        </span>
                        <img src={imgData} alt="Lista de ejército" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '6px', border: 'var(--border-glass)' }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Formulario Cargar Resultado */}
            {activeChallenge.listsRevealed && (
              <form onSubmit={handleSubmitResult} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gold-primary)' }}>
                  📊 {lang === 'es' ? 'Cargar Resultado de la Batalla' : 'Submit Battle Result'}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tus PVs:</label>
                    <input type="number" min="0" max="30" value={myVp} onChange={(e) => setMyVp(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: 'var(--border-glass)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>PVs Rival:</label>
                    <input type="number" min="0" max="30" value={rivalVp} onChange={(e) => setRivalVp(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: 'var(--border-glass)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#fff' }}>
                    <input type="checkbox" checked={myKilledLeader} onChange={(e) => setMyKilledLeader(e.target.checked)} />
                    ⚔️ {lang === 'es' ? 'Has matado al Líder rival' : 'Killed rival Leader'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#fff' }}>
                    <input type="checkbox" checked={rivalKilledLeader} onChange={(e) => setRivalKilledLeader(e.target.checked)} />
                    💀 {lang === 'es' ? 'El rival ha matado a tu Líder' : 'Rival killed your Leader'}
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSubmittingResult} style={{ marginTop: '8px' }}>
                  {isSubmittingResult ? (lang === 'es' ? 'Guardando...' : 'Saving...') : (lang === 'es' ? '📩 Enviar Resultado para Confirmación' : '📩 Submit Result')}
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
