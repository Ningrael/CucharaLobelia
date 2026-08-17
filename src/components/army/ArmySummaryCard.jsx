// src/components/army/ArmySummaryCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta visual estilizada de resumen de lista (Social Share para WhatsApp/Torneos).
// Replica con precisión la estética limpia, pergamino/oscura y los controles de visualización.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import { exportToTTS } from '../../utils/armyRules';

export default function ArmySummaryCard({ list, activeMod, onClose }) {
  const [plainText, setPlainText] = useState(false);
  const [showUnitTotals, setShowUnitTotals] = useState(false);
  const [showArmyBonus, setShowArmyBonus] = useState(true);
  const [displayRosterName, setDisplayRosterName] = useState(true);
  const [copying, setCopying] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const cardRef = useRef(null);

  if (!list) return null;

  const {
    name = 'Mi Lista de Ejército',
    pointsLimit = 750,
    warbands = [],
    stats = {}
  } = list;

  const totalPoints = stats.totalPoints || 0;
  const totalModels = stats.totalModels || 0;
  const bowCount = stats.bowCount || 0;
  const bowLimit = stats.bowLimit || Math.floor(totalModels / 3);
  const breakPoint = stats.breakPoint || Math.ceil(totalModels / 2);
  const quartered = stats.quartered || Math.ceil(totalModels / 4);

  // Calcular totales de M / W / F
  let totalMight = 0;
  let totalWill = 0;
  let totalFate = 0;
  warbands.forEach(wb => {
    if (wb.hero?.heroicStats) {
      totalMight += wb.hero.heroicStats.Might ?? wb.hero.heroicStats.M ?? 0;
      totalWill += wb.hero.heroicStats.Will ?? wb.hero.heroicStats.W ?? 0;
      totalFate += wb.hero.heroicStats.Fate ?? wb.hero.heroicStats.F ?? 0;
    }
  });

  // Agrupar unidades idénticas si showUnitTotals está activo
  const aggregatedUnits = {};
  if (showUnitTotals) {
    warbands.forEach(wb => {
      (wb.warriors || []).forEach(w => {
        const opts = (w.selectedOptions || []).map(o => o.name).sort().join(', ');
        const key = `${w.name}${opts ? ' with ' + opts : ''}`;
        const cost = w.totalCost ?? w.baseCost ?? 0;
        if (!aggregatedUnits[key]) {
          aggregatedUnits[key] = { count: 0, cost: 0, singleCost: cost };
        }
        aggregatedUnits[key].count += 1;
        aggregatedUnits[key].cost += cost;
      });
    });
  }

  // Copiar imagen o texto al portapapeles
  const handleCopyText = async () => {
    let text = `${name.toUpperCase()}\n${totalPoints} PUNTOS | ${totalModels} MINIATURAS\n`;
    text += `Arcos: ${bowCount}/${bowLimit} | Desmoronado (50%): ${breakPoint} bajas | Reducido 25%: ${quartered} vivas\n`;
    text += `Poder/Voluntad/Destino: ${totalMight} / ${totalWill} / ${totalFate}\n\n`;

    warbands.forEach((wb, i) => {
      text += `--- Partida ${i + 1} ---\n`;
      if (wb.hero) {
        const opts = (wb.hero.selectedOptions || []).map(o => o.name).join(', ');
        text += `• ${wb.hero.name}${opts ? ' (' + opts + ')' : ''} - ${wb.hero.totalCost || wb.hero.baseCost} pts\n`;
      }
      (wb.warriors || []).forEach(w => {
        const opts = (w.selectedOptions || []).map(o => o.name).join(', ');
        text += `  - ${w.name}${opts ? ' (' + opts + ')' : ''} (${w.totalCost || w.baseCost} pts)\n`;
      });
      text += '\n';
    });

    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg('¡Lista en texto copiada al portapapeles!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg('Error al copiar.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#161411',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: '16px',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 50px rgba(0,0,0,0.9), 0 0 25px rgba(212,175,55,0.15)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── BARRA SUPERIOR MODAL ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: '#100e0b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🔗</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#d4af37', fontFamily: 'var(--font-title)' }}>
              Roster Summary & Sharing
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopyText}
              style={{
                background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📋 COPIAR TEXTO
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#aaa',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{ background: 'rgba(46, 204, 113, 0.15)', borderBottom: '1px solid rgba(46, 204, 113, 0.3)', color: '#2ecc71', padding: '6px 16px', fontSize: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
            {statusMsg}
          </div>
        )}

        {/* ── CUERPO PRINCIPAL (TARJETA VISUAL PERGAMINO) ── */}
        <div
          ref={cardRef}
          style={{
            padding: '24px 20px',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #f7f3ea 0%, #ede6d6 100%)',
            color: '#2c1e11',
            fontFamily: 'serif',
            position: 'relative'
          }}
        >
          {/* Marco decorativo */}
          <div
            style={{
              border: '2px solid #8b1d1d',
              borderRadius: '8px',
              padding: '18px',
              background: 'rgba(255,255,255,0.65)',
              position: 'relative'
            }}
          >
            {/* Título de Roster */}
            {displayRosterName && (
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.35rem',
                    fontWeight: 'bold',
                    color: '#8b1d1d',
                    letterSpacing: '0.06em',
                    fontFamily: 'var(--font-title)'
                  }}
                >
                  {name.toUpperCase()}
                </h1>
              </div>
            )}

            {/* Subtítulo Puntos / Unidades */}
            <div style={{ textAlign: 'center', fontSize: '0.88rem', fontWeight: 'bold', color: '#3d2817', marginBottom: '14px', letterSpacing: '0.04em' }}>
              {totalPoints} POINTS | {totalModels} UNITS
            </div>

            {/* Badges de Recursos */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '10px 4px',
                borderTop: '1px solid #8b1d1d',
                borderBottom: '1px solid #8b1d1d',
                marginBottom: '16px',
                textAlign: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              {/* Arcos */}
              <div style={{ minWidth: '60px' }}>
                <div style={{ fontSize: '1.2rem' }}>🏹</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2c1e11' }}>
                  {bowCount} <span style={{ color: '#777', fontSize: '0.72rem' }}>/ {bowLimit}</span>
                </div>
              </div>

              {/* Break Point 50% */}
              <div style={{ minWidth: '70px' }}>
                <div style={{ fontSize: '1.2rem' }}>💔</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#8b1d1d' }}>
                  {breakPoint} <span style={{ fontSize: '0.72rem', color: '#555' }}>dead (50%)</span>
                </div>
              </div>

              {/* 25% Quartered */}
              <div style={{ minWidth: '70px' }}>
                <div style={{ fontSize: '1.2rem' }}>☠️</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#a04000' }}>
                  {quartered} <span style={{ fontSize: '0.72rem', color: '#555' }}>left (25%)</span>
                </div>
              </div>

              {/* M / W / F Totals */}
              <div style={{ minWidth: '80px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#8b1d1d', letterSpacing: '0.06em' }}>M / W / F</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2c1e11' }}>
                  {totalMight} / {totalWill} / {totalFate}
                </div>
              </div>
            </div>

            {/* ── DESGLOSE DE PARTIDAS DE GUERRA ── */}
            {!showUnitTotals ? (
              <div>
                {warbands.map((wb, wbIdx) => (
                  <div key={wbIdx} style={{ marginBottom: '14px', borderBottom: wbIdx < warbands.length - 1 ? '1px solid rgba(139,29,29,0.25)' : 'none', paddingBottom: '10px' }}>
                    <div style={{ color: '#8b1d1d', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                      Warband {wbIdx + 1}
                    </div>

                    {/* Héroe */}
                    {wb.hero && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 'bold', color: '#2c1e11', marginBottom: '3px' }}>
                        <span>
                          {wb.hero.name}
                          {wbIdx === 0 && <em style={{ color: '#666', fontWeight: 'normal' }}> (General)</em>}
                          {wb.hero.selectedOptions?.length > 0 && (
                            <span style={{ fontWeight: 'normal', color: '#555', fontSize: '0.8rem' }}>
                              {' '}with {wb.hero.selectedOptions.map(o => o.name).join(', ')}
                            </span>
                          )}
                        </span>
                        <span>{wb.hero.totalCost || wb.hero.baseCost} pts</span>
                      </div>
                    )}

                    {/* Guerreros */}
                    {wb.warriors?.map((w, wIdx) => {
                      const opts = (w.selectedOptions || []).map(o => o.name).join(' and ');
                      return (
                        <div key={wIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#3d2817', paddingLeft: '8px', marginTop: '2px' }}>
                          <span>
                            1 {w.name}{opts ? ` with ${opts}` : ''}
                          </span>
                          <span style={{ color: '#555' }}>{w.totalCost || w.baseCost} pts</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              /* Modo Totales Agrupados */
              <div style={{ marginBottom: '14px' }}>
                <div style={{ color: '#8b1d1d', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px' }}>
                  Units Breakdown
                </div>
                {warbands.map((wb, i) => wb.hero && (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 'bold', color: '#2c1e11', marginBottom: '4px' }}>
                    <span>1x {wb.hero.name}</span>
                    <span>{wb.hero.totalCost || wb.hero.baseCost} pts</span>
                  </div>
                ))}
                {Object.entries(aggregatedUnits).map(([unitName, data], uIdx) => (
                  <div key={uIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#3d2817', paddingLeft: '8px', marginTop: '2px' }}>
                    <span>{data.count}x {unitName}</span>
                    <span style={{ color: '#555' }}>{data.cost} pts</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── REGLAS DE EJÉRCITO & ARMY BONUS ── */}
            {showArmyBonus && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #8b1d1d' }}>
                <div style={{ textAlign: 'center', color: '#8b1d1d', fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '8px' }}>
                  Army Bonus & Special Rules
                </div>
                <div style={{ fontSize: '0.76rem', color: '#3d2817', lineHeight: '1.45' }}>
                  • <strong>Alianza:</strong> {stats.allianceType === 'pure' ? 'Ejército Puro (Mantiene Army Bonus)' : stats.allianceType === 'historical' ? 'Alianza Histórica (Green - Mantiene Bonuses)' : stats.allianceType === 'convenient' ? 'Alianza Conveniente (Yellow - Pierde Bonuses)' : 'Alianza Imposible (Red)'}
                </div>
              </div>
            )}

            {/* Pie de autoría */}
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.65rem', color: '#888' }}>
              Generado con <strong>La Cuchara de Lobelia</strong> • https://ningrael.github.io/CucharaLobelia/
            </div>
          </div>
        </div>

        {/* ── BARRA DE CONTROLES INFERIORES (TOGGLES) ── */}
        <div
          style={{
            background: '#100e0b',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.78rem',
            color: '#c5b8a5'
          }}
        >
          {/* Toggle Unit Totals */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showUnitTotals}
              onChange={e => setShowUnitTotals(e.target.checked)}
            />
            <span>Show unit totals</span>
          </label>

          {/* Toggle Army Bonus */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showArmyBonus}
              onChange={e => setShowArmyBonus(e.target.checked)}
            />
            <span>Show army bonus</span>
          </label>

          {/* Toggle Roster Name */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={displayRosterName}
              onChange={e => setDisplayRosterName(e.target.checked)}
            />
            <span>Display roster name</span>
          </label>
        </div>
      </div>
    </div>
  );
}
