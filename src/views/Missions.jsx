// src/views/Missions.jsx
import React, { useState } from 'react';
import Modal from '../components/Modal';
import PdfCanvasViewer from '../components/PdfCanvasViewer';

const POOLS_1VS1 = [
  { name: { es: "1. Control de Zonas", en: "1. Zone Control" }, items: ['Domination', 'Capture & Control', 'Breakthrough', 'Stake a Claim'] },
  { name: { es: "2. Matar y Destruir", en: "2. Kill & Destroy" }, items: ['To the Death!', 'Lords of Battle', 'Assassination', 'Contest of Champions'] },
  { name: { es: "3. Objetivos Variables", en: "3. Variable Objectives" }, items: ['Hold Ground', 'Heirloom of Ages Past', 'Sites of Power', 'Command the Battlefield'] },
  { name: { es: "4. Escenarios de Suministros", en: "4. Supply Scenarios" }, items: ['Destroy the Supplies', 'Retrieval', 'Seize the Prizes', 'Treasure Hoard'] },
  { name: { es: "5. Movimiento y Flancos", en: "5. Maneuver & Flank" }, items: ['Reconnoitre', 'Storm the Camp', 'Divide & Conquer', 'Escort the Wounded'] },
  { name: { es: "6. Condiciones Especiales", en: "6. Special Conditions" }, items: ['Fog of War', 'Clash by Moonlight', 'Lead from the Front', 'Convergence'] }
];

const MISSIONS_2VS2 = [
  'No Escape',
  'Total Conquest',
  'Take & Hold',
  'Clash of Champions',
  'Cornered',
  'Duel of Wits'
];

export default function Missions({ lang, translations }) {
  const t = translations[lang];

  const [mode, setMode] = useState('1vs1'); // '1vs1' o '2vs2'
  const [rounds, setRounds] = useState(3);
  const [selectedMission, setSelectedMission] = useState(null);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  
  // Guardamos las rondas generadas en el estado: { missionName: roundNumber }
  const [roundBadges, setRoundBadges] = useState({});

  // 1. Selector Aleatorio Simple
  const handleRandomSelect = () => {
    setRoundBadges({});
    if (mode === '1vs1') {
      const allMissions = POOLS_1VS1.flatMap(pool => pool.items);
      const randomMission = allMissions[Math.floor(Math.random() * allMissions.length)];
      openPdf(randomMission);
    } else {
      const randomMission = MISSIONS_2VS2[Math.floor(Math.random() * MISSIONS_2VS2.length)];
      openPdf(randomMission);
    }
  };

  // 2. Generador de Rondas de Torneo
  const handleGenerateRounds = () => {
    const badges = {};
    let lastSelected = null;

    if (mode === '1vs1') {
      // Barajar los índices de las 6 categorías oficiales
      const poolIndexes = [0, 1, 2, 3, 4, 5];
      for (let i = poolIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolIndexes[i], poolIndexes[j]] = [poolIndexes[j], poolIndexes[i]];
      }

      // Tomar tantos pools como rondas queramos (máx. 6)
      const chosenPoolIndexes = poolIndexes.slice(0, rounds);

      chosenPoolIndexes.forEach((poolIdx, roundOrder) => {
        const pool = POOLS_1VS1[poolIdx];
        const mission = pool.items[Math.floor(Math.random() * pool.items.length)];
        badges[mission] = roundOrder + 1;
        lastSelected = mission;
      });
    } else {
      // Barajar las 6 misiones de 2vs2
      const shuffled2v2 = [...MISSIONS_2VS2];
      for (let i = shuffled2v2.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled2v2[i], shuffled2v2[j]] = [shuffled2v2[j], shuffled2v2[i]];
      }
      
      const chosenMissions = shuffled2v2.slice(0, rounds);
      chosenMissions.forEach((mission, roundOrder) => {
        badges[mission] = roundOrder + 1;
        lastSelected = mission;
      });
    }

    setRoundBadges(badges);
    if (lastSelected) {
      setSelectedMission(lastSelected);
    }
  };

  // 3. Abrir visor de PDF
  const openPdf = (missionName) => {
    setSelectedMission(missionName);
    
    // Ruta del PDF (portada estáticamente en public/pdfs)
    const folder = mode === '1vs1' ? 'pdfs/' : 'pdfs/2vs2/';
    const filename = `${missionName.toUpperCase()}.pdf`;
    const relativePath = `/${folder}${filename}`;
    
    setActivePdfUrl(relativePath);
  };

  // 4. Compartir Rondas (Mobile Native Share / Fallback Clipboard)
  const handleShare = async () => {
    // Ordenar las rondas
    const roundsMap = {};
    Object.entries(roundBadges).forEach(([mission, round]) => {
      roundsMap[round] = mission;
    });

    const sortedRounds = Object.keys(roundsMap).sort((a, b) => parseInt(a) - parseInt(b));
    if (sortedRounds.length === 0) return;

    let shareText = lang === 'es' 
      ? `🏆 *Rondas del Torneo (MESBG)* 🏆\n\n`
      : `🏆 *Tournament Rounds (MESBG)* 🏆\n\n`;

    sortedRounds.forEach(r => {
      shareText += `Ronda ${r}: *${roundsMap[r]}*\n`;
    });

    shareText += `\nGenerado en: https://ningrael.github.io/CucharaLobelia/`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'La Cuchara de Lobelia - Rondas',
          text: shareText
        });
      } catch (err) {
        console.warn('Share api failed', err);
      }
    } else {
      // Fallback al portapapeles
      try {
        await navigator.clipboard.writeText(shareText);
        alert(lang === 'es' ? '¡Lista copiada al portapapeles!' : 'List copied to clipboard!');
      } catch (err) {
        alert(shareText);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Selector de Modo (1vs1 / 2vs2) */}
      <div 
        style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.2)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: 'var(--border-glass)'
        }}
      >
        <button 
          className="btn btn-small"
          onClick={() => { setMode('1vs1'); setRoundBadges({}); setSelectedMission(null); }}
          style={{
            flex: 1,
            background: mode === '1vs1' ? 'linear-gradient(135deg, #1d3321 0%, #112114 100%)' : 'transparent',
            border: mode === '1vs1' ? 'var(--border-gold)' : '1px solid transparent',
            color: mode === '1vs1' ? 'var(--gold-primary)' : 'var(--text-muted)',
            boxShadow: 'none',
            minHeight: '40px'
          }}
        >
          Matched Play (1vs1)
        </button>
        <button 
          className="btn btn-small"
          onClick={() => { setMode('2vs2'); setRoundBadges({}); setSelectedMission(null); }}
          style={{
            flex: 1,
            background: mode === '2vs2' ? 'linear-gradient(135deg, #1d3321 0%, #112114 100%)' : 'transparent',
            border: mode === '2vs2' ? 'var(--border-gold)' : '1px solid transparent',
            color: mode === '2vs2' ? 'var(--gold-primary)' : 'var(--text-muted)',
            boxShadow: 'none',
            minHeight: '40px'
          }}
        >
          {lang === 'es' ? 'Doble (2vs2)' : 'Doubles (2v2)'}
        </button>
      </div>

      {/* Panel de Controles Compacto */}
      <div 
        className="glass-card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          padding: '10px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          {/* Stepper para Rondas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
              {lang === 'es' ? 'Rondas:' : 'Rounds:'}
            </span>
            <div className="stepper-container" style={{ maxWidth: '100px', height: '32px' }}>
              <button 
                type="button" 
                className="stepper-btn" 
                style={{ width: '30px', height: '32px', fontSize: '1rem', padding: 0 }}
                onClick={() => setRounds(Math.max(1, rounds - 1))}
              >
                -
              </button>
              <input 
                type="number" 
                className="stepper-input" 
                style={{ width: '40px', height: '32px', fontSize: '0.9rem' }} 
                value={rounds} 
                readOnly 
              />
              <button 
                type="button" 
                className="stepper-btn" 
                style={{ width: '30px', height: '32px', fontSize: '1rem', padding: 0 }}
                onClick={() => setRounds(Math.min(6, rounds + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
            {/* Botón Aleatorio */}
            <button 
              className="btn btn-small"
              onClick={handleRandomSelect}
              style={{ minHeight: '32px', fontSize: '0.72rem', padding: '0 8px' }}
            >
              🎲 {lang === 'es' ? 'Aleatorio' : 'Random'}
            </button>
            
            {/* Botón Generar */}
            <button 
              className="btn btn-small btn-primary"
              onClick={handleGenerateRounds}
              style={{ minHeight: '32px', fontSize: '0.72rem', padding: '0 8px' }}
            >
              ⚡ {lang === 'es' ? 'Generar' : 'Generate'}
            </button>
          </div>
        </div>

        {Object.keys(roundBadges).length > 0 && (
          <button
            className="btn btn-primary btn-small"
            onClick={handleShare}
            style={{ width: '100%', minHeight: '30px', fontSize: '0.72rem', padding: '4px', marginTop: '2px' }}
          >
            📤 {lang === 'es' ? 'Compartir Rondas' : 'Share Rounds'}
          </button>
        )}
      </div>

      {/* --- GRID DE MISIONES 1VS1 (DASHBOARD COMPACTO 24 MISIONES) --- */}
      {mode === '1vs1' && (
        <div className="missions-dashboard-grid">
          {POOLS_1VS1.map((pool, pIdx) => (
            <div key={pIdx} className="pool-subcard">
              <div className="pool-title" title={pool.name[lang]}>
                {pool.name[lang]}
              </div>
              <div className="pool-missions-grid">
                {pool.items.map((mission, mIdx) => {
                  const roundNum = roundBadges[mission];
                  const isSelected = selectedMission === mission;
                  let roundClass = "";
                  if (roundNum) {
                    roundClass = ` active-round-${roundNum}`;
                  }
                  
                  return (
                    <button
                      key={mIdx}
                      onClick={() => openPdf(mission)}
                      className={`mission-pill-btn${roundClass}`}
                      style={{
                        borderColor: isSelected ? 'var(--gold-primary)' : undefined,
                        boxShadow: isSelected ? '0 0 8px var(--gold-glow)' : undefined,
                      }}
                      title={mission}
                    >
                      {mission}
                      {roundNum && (
                        <span className="mission-pill-badge">
                          {roundNum}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- GRID DE MISIONES 2VS2 --- */}
      {mode === '2vs2' && (
        <div className="glass-card" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px' }}>
            {lang === 'es' ? 'Misiones Oficiales por Parejas' : 'Official Doubles Missions'}
          </h4>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}
          >
            {MISSIONS_2VS2.map((mission, idx) => {
              const roundNum = roundBadges[mission];
              const isSelected = selectedMission === mission;

              return (
                <button
                  key={idx}
                  onClick={() => openPdf(mission)}
                  style={{
                    padding: '16px 8px',
                    background: isSelected ? 'rgba(203, 161, 53, 0.15)' : 'rgba(0,0,0,0.2)',
                    border: isSelected ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-sm)',
                    color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    minHeight: '64px',
                    position: 'relative'
                  }}
                >
                  {mission}
                  {roundNum && (
                    <span 
                      style={{
                        background: 'var(--gold-primary)',
                        color: '#000',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        marginTop: '2px'
                      }}
                    >
                      R{roundNum}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Visor de PDF embebido mediante el componente Modal */}
      <Modal 
        isOpen={!!activePdfUrl} 
        onClose={() => setActivePdfUrl(null)}
        title={selectedMission}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', height: '65vh' }}>
          <PdfCanvasViewer url={activePdfUrl} lang={lang} />
          <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
            <a 
              href={activePdfUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--gold-primary)', textDecoration: 'underline' }}
            >
              {lang === 'es' ? '¿Problemas con el visor? Abre el PDF directo' : 'Trouble viewing? Open PDF directly'}
            </a>
          </div>
        </div>
      </Modal>

    </div>
  );
}
