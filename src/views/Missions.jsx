// src/views/Missions.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import PdfCanvasViewer from '../components/PdfCanvasViewer';
import { trackFeature } from '../utils/analyticsTracker';

const POOLS_1VS1 = [
  { name: { es: "Pool 1: Control de Objetivos", en: "Pool 1: Hold Objective" }, items: ['Domination', 'Capture & Control', 'Breakthrough', 'Stake a Claim'] },
  { name: { es: "Pool 2: Matar al Enemigo", en: "Pool 2: Kill the Enemy" }, items: ['To the Death!', 'Lords of Battle', 'Assassination', 'Contest of Champions'] },
  { name: { es: "Pool 3: Torbellino de Batalla", en: "Pool 3: Maelstrom of Battle" }, items: ['Hold Ground', 'Heirloom of Ages Past', 'Sites of Power', 'Command the Battlefield'] },
  { name: { es: "Pool 4: Suministros", en: "Pool 4: Supply Scenarios" }, items: ['Destroy the Supplies', 'Retrieval', 'Seize the Prizes', 'Treasure Hoard'] },
  { name: { es: "Pool 5: Maniobras y Flancos", en: "Pool 5: Manoeuvring" }, items: ['Reconnoitre', 'Storm the Camp', 'Divide & Conquer', 'Escort the Wounded'] },
  { name: { es: "Pool 6: Escenarios Únicos", en: "Pool 6: Unique Scenarios" }, items: ['Fog of War', 'Clash by Moonlight', 'Lead from the Front', 'Convergence'] }
];

export const MISSION_DISPLAY_INFO = {
  'Domination': { num: 1, es: '1. Dominación', en: '1. Domination' },
  'To the Death!': { num: 2, es: '2. ¡A Muerte!', en: '2. To the Death!' },
  'Hold Ground': { num: 3, es: '3. Mantener la Posición', en: '3. Hold Ground' },
  'Destroy the Supplies': { num: 4, es: '4. Destruir Suministros', en: '4. Destroy the Supplies' },
  'Reconnoitre': { num: 5, es: '5. Reconocimiento', en: '5. Reconnoitre' },
  'Fog of War': { num: 6, es: '6. Niebla de Guerra', en: '6. Fog of War' },
  'Capture & Control': { num: 7, es: '7. Capturar y Controlar', en: '7. Capture & Control' },
  'Breakthrough': { num: 8, es: '8. Ruptura', en: '8. Breakthrough' },
  'Stake a Claim': { num: 9, es: '9. Reclamar el Terreno', en: '9. Stake a Claim' },
  'Lords of Battle': { num: 10, es: '10. Señores de la Batalla', en: '10. Lords of Battle' },
  'Assassination': { num: 11, es: '11. Asesinato', en: '11. Assassination' },
  'Contest of Champions': { num: 12, es: '12. Concurso de Campeones', en: '12. Contest of Champions' },
  'Heirloom of Ages Past': { num: 13, es: '13. Reliquia de Tiempos Pasados', en: '13. Heirloom of Ages Past' },
  'Sites of Power': { num: 14, es: '14. Sitios de Poder', en: '14. Sites of Power' },
  'Command the Battlefield': { num: 15, es: '15. Dominar el Campo de Batalla', en: '15. Command the Battlefield' },
  'Retrieval': { num: 16, es: '16. Recuperación', en: '16. Retrieval' },
  'Seize the Prizes': { num: 17, es: '17. Apoderarse de los Premios', en: '17. Seize the Prizes' },
  'Treasure Hoard': { num: 18, es: '18. Tesoro Acumulado', en: '18. Treasure Hoard' },
  'Storm the Camp': { num: 19, es: '19. Asaltar el Campamento', en: '19. Storm the Camp' },
  'Divide & Conquer': { num: 20, es: '20. Dividir y Vencer', en: '20. Divide & Conquer' },
  'Escort the Wounded': { num: 21, es: '21. Escoltar a los Heridos', en: '21. Escort the Wounded' },
  'Clash by Moonlight': { num: 22, es: '22. Choque a la Luz de la Luna', en: '22. Clash by Moonlight' },
  'Lead from the Front': { num: 23, es: '23. Liderar desde el Frente', en: '23. Lead from the Front' },
  'Convergence': { num: 24, es: '24. Convergencia', en: '24. Convergence' },
  
  // 2vs2 (Dobles)
  'No Escape': { num: 1, es: '1. Sin Escape', en: '1. No Escape' },
  'Total Conquest': { num: 2, es: '2. Conquista Total', en: '2. Total Conquest' },
  'Take & Hold': { num: 3, es: '3. Tomar y Mantener', en: '3. Take & Hold' },
  'Clash of Champions': { num: 4, es: '4. Choque de Campeones', en: '4. Clash of Champions' },
  'Cornered': { num: 5, es: '5. Acorralados', en: '5. Cornered' },
  'Duel of Wits': { num: 6, es: '6. Duelo de Ingenios', en: '6. Duel of Wits' }
};

const MISSIONS_2VS2 = [
  'No Escape',
  'Total Conquest',
  'Take & Hold',
  'Clash of Champions',
  'Cornered',
  'Duel of Wits'
];

export default function Missions({ lang, translations, setLang }) {
  const t = translations[lang];

  const [mode, setMode] = useState('1vs1'); // '1vs1' o '2vs2'
  const [rounds, setRounds] = useState(3);
  const [selectedMission, setSelectedMission] = useState(null);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [pdfLang, setPdfLang] = useState(() => {
    try {
      const stored = localStorage.getItem('lobelia_pdf_lang');
      if (stored === 'es' || stored === 'en') return stored;
    } catch (_) {}
    return lang;
  });

  // Sincronizar pdfLang con lang si no se ha guardado una preferencia explícita
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lobelia_pdf_lang');
      if (!stored) {
        setPdfLang(lang);
      }
    } catch (_) {}
  }, [lang]);
  
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
    setSelectedMission(null);
  };

  // 3. Abrir visor de PDF
  const openPdf = (missionName) => {
    setSelectedMission(missionName);
    trackFeature('mission_view', { mission: missionName, mode });
  };

  useEffect(() => {
    if (!selectedMission) {
      setActivePdfUrl(null);
      return;
    }
    
    const fanmadeMissions = [
      'Domination', 'Capture & Control', 'Breakthrough', 'Stake a Claim',
      'Destroy the Supplies', 'Retrieval', 'Seize the Prizes', 'Treasure Hoard',
      'To the Death!', 'Lords of Battle', 'Assassination', 'Contest of Champions',
      'Hold Ground', 'Heirloom of Ages Past', 'Sites of Power', 'Command the Battlefield',
      'Reconnoitre', 'Storm the Camp', 'Divide & Conquer', 'Escort the Wounded',
      'Fog of War', 'Clash by Moonlight', 'Lead from the Front', 'Convergence',
      'No Escape', 'Total Conquest', 'Take & Hold', 'Clash of Champions', 'Cornered', 'Duel of Wits'
    ];
    
    const folder = mode === '1vs1' ? 'pdfs/' : 'pdfs/2vs2/';
    
    let filename = `${selectedMission.toUpperCase()}.pdf`;
    if (fanmadeMissions.includes(selectedMission)) {
      filename = `${selectedMission.toUpperCase()}_${pdfLang.toUpperCase()}.pdf`;
    }
    
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const relativePath = `${base}/${folder}${filename}`;
    
    setActivePdfUrl(relativePath);
  }, [selectedMission, pdfLang, mode]);

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

      {/* Dos Banners Principales Interactivos (Random Naranja & Rondas de Torneo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', width: '100%' }}>
        {/* 1. Botón Principal Naranja: Misión Random */}
        <div
          onClick={handleRandomSelect}
          className="hero-card-highlight"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: '16px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.28) 0%, rgba(160, 64, 0, 0.35) 100%)',
            border: '1px solid #e67e22',
            boxShadow: '0 4px 18px rgba(230, 126, 34, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 8px rgba(243, 156, 18, 0.6))' }}>🎲</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#ffb74d', fontFamily: 'var(--font-title)', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Elige una misión random' : 'Pick a random mission'}
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                {lang === 'es' ? 'Selección y visor instantáneo' : 'Instant random mission & PDF'}
              </span>
            </div>
          </div>
          <span style={{ color: '#ffb74d', fontSize: '1.3rem', fontWeight: 'bold' }}>➔</span>
        </div>

        {/* 2. Botón Rondas de Torneo con Stepper Integrado */}
        <div
          className="hero-card-highlight"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(22, 38, 25, 0.85) 0%, rgba(12, 20, 14, 0.95) 100%)',
            border: '1px solid rgba(203, 161, 53, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '140px' }}>
            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 6px var(--gold-glow))' }}>🏆</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Rondas de torneo' : 'Tournament rounds'}
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {lang === 'es' ? 'Genera sin repetir pool' : 'Generate non-repeating pools'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="stepper-container" style={{ maxWidth: '90px', height: '34px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
              <button 
                type="button" 
                className="stepper-btn" 
                style={{ width: '28px', height: '34px', fontSize: '0.9rem', padding: 0 }}
                onClick={() => setRounds(Math.max(1, rounds - 1))}
              >
                -
              </button>
              <input 
                type="number" 
                className="stepper-input" 
                style={{ width: '34px', height: '34px', fontSize: '0.88rem' }} 
                value={rounds} 
                readOnly 
              />
              <button 
                type="button" 
                className="stepper-btn" 
                style={{ width: '28px', height: '34px', fontSize: '0.9rem', padding: 0 }}
                onClick={() => setRounds(Math.min(6, rounds + 1))}
              >
                +
              </button>
            </div>

            <button 
              className="btn btn-primary btn-small"
              onClick={handleGenerateRounds}
              style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.8rem', borderRadius: '8px', fontWeight: 'bold' }}
            >
              ⚡ {lang === 'es' ? 'Generar' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Botón Compartir Rondas si se han generado */}
      {Object.keys(roundBadges).length > 0 && (
        <button
          className="btn btn-primary btn-small"
          onClick={handleShare}
          style={{ width: '100%', minHeight: '34px', fontSize: '0.8rem', padding: '6px', borderRadius: '10px' }}
        >
          📤 {lang === 'es' ? 'Compartir Rondas Generadas' : 'Share Generated Rounds'}
        </button>
      )}

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
                      {MISSION_DISPLAY_INFO[mission]?.[lang] || mission}
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
          <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '14px', fontFamily: 'var(--font-title)' }}>
            {lang === 'es' ? 'Misiones Oficiales por Parejas (2vs2)' : 'Official Doubles Missions (2v2)'}
          </h4>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px'
            }}
          >
            {MISSIONS_2VS2.map((mission, idx) => {
              const roundNum = roundBadges[mission];
              const isSelected = selectedMission === mission;
              let roundClass = "";
              if (roundNum) {
                roundClass = ` active-round-${roundNum}`;
              }

              return (
                <button
                  key={idx}
                  onClick={() => openPdf(mission)}
                  className={`mission-pill-btn${roundClass}`}
                  style={{
                    padding: '16px 10px',
                    fontSize: '0.85rem',
                    minHeight: '64px',
                    borderRadius: '8px',
                    borderColor: isSelected ? 'var(--gold-primary)' : undefined,
                    boxShadow: isSelected ? '0 0 10px var(--gold-glow)' : undefined,
                    position: 'relative'
                  }}
                  title={mission}
                >
                  {MISSION_DISPLAY_INFO[mission]?.[lang] || mission}
                  {roundNum && (
                    <span 
                      className="mission-pill-badge"
                      style={{ width: '18px', height: '18px', fontSize: '10px', top: '-6px', right: '-6px' }}
                    >
                      {roundNum}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Modal 
        isOpen={!!activePdfUrl} 
        onClose={() => { setSelectedMission(null); setActivePdfUrl(null); }}
        title={selectedMission}
        size="large"
      >
        <div className="pdf-modal-container">
          <PdfCanvasViewer 
            url={activePdfUrl} 
            lang={pdfLang} 
            onChangeLang={(newLang) => {
              setPdfLang(newLang);
              try {
                localStorage.setItem('lobelia_pdf_lang', newLang);
              } catch (_) {}
            }} 
          />
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
