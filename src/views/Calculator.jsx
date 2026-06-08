// src/views/Calculator.jsx
import React, { useState, useMemo } from 'react';
import { 
  calculateSpellProbability, 
  calculateResistProbability, 
  calculateDuelProbability 
} from '../utils/math';

export default function Calculator({ lang, translations }) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState('spell'); // 'spell', 'resist', 'duel'

  // --- Estado de Lanzar Hechizo ---
  const [spellWill, setSpellWill] = useState(1);
  const [spellDiff, setSpellDiff] = useState(4);
  const [spellMight, setSpellMight] = useState(0);

  // --- Estado de Resistir Hechizo ---
  const [resistWill, setResistWill] = useState(1);
  const [rivalResult, setRivalResult] = useState(4);
  const [resistMight, setResistMight] = useState(0);
  const [magicResist, setMagicResist] = useState(false);

  // --- Estado de Duelo de Combate ---
  const [fAttacks, setFAttacks] = useState(1);
  const [fFv, setFFv] = useState(3);
  const [fBanner, setFBanner] = useState(false);
  const [fTwoHanded, setFTwoHanded] = useState(false);
  const [fElven, setFElven] = useState(false);

  const [eAttacks, setEAttacks] = useState(1);
  const [eFv, setEFv] = useState(3);
  const [eBanner, setEBanner] = useState(false);
  const [eTwoHanded, setETwoHanded] = useState(false);
  const [eElven, setEElven] = useState(false);

  // --- Cálculos Reactivos Memorizados ---
  const spellResult = useMemo(() => {
    return calculateSpellProbability(spellWill, spellDiff, spellMight);
  }, [spellWill, spellDiff, spellMight]);

  const resistResult = useMemo(() => {
    return calculateResistProbability(resistWill, rivalResult, resistMight, magicResist);
  }, [resistWill, rivalResult, resistMight, magicResist]);

  const duelResult = useMemo(() => {
    return calculateDuelProbability(
      { attacks: fAttacks, fv: fFv, hasBanner: fBanner, twoHanded: fTwoHanded, elven: fElven },
      { attacks: eAttacks, fv: eFv, hasBanner: eBanner, twoHanded: eTwoHanded, elven: eElven }
    );
  }, [fAttacks, fFv, fBanner, fTwoHanded, fElven, eAttacks, eFv, eBanner, eTwoHanded, eElven]);

  // Componente de control incremental (+ / -)
  const Stepper = ({ value, min, max, onChange }) => (
    <div className="stepper-container">
      <button 
        type="button" 
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        -
      </button>
      <input 
        type="number" 
        className="stepper-input" 
        value={value} 
        readOnly 
      />
      <button 
        type="button" 
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );

  // Componente de Gráfico de Barras SVG Nativo
  const SvgBarChart = ({ distribution, activeValue, type }) => {
    const thresholds = [2, 3, 4, 5, 6];
    const chartHeight = 120;
    const chartWidth = 320;
    const paddingLeft = 35;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 25;
    
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;
    
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '6px' }}>
          {/* Líneas de Guía de Porcentaje */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = paddingTop + plotHeight - (pct / 100) * plotHeight;
            return (
              <g key={pct}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={chartWidth - paddingRight} 
                  y2={y} 
                  stroke="rgba(255,255,255,0.06)" 
                  strokeWidth="1" 
                />
                <text 
                  x={paddingLeft - 6} 
                  y={y + 3} 
                  fill="var(--text-muted)" 
                  fontSize="8px" 
                  textAnchor="end"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Ejes */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop} 
            x2={paddingLeft} 
            y2={paddingTop + plotHeight} 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1" 
          />
          <line 
            x1={paddingLeft} 
            y1={paddingTop + plotHeight} 
            x2={chartWidth - paddingRight} 
            y2={paddingTop + plotHeight} 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1" 
          />

          {/* Barras */}
          {thresholds.map((t, idx) => {
            const val = distribution[t] || 0;
            const barWidth = 24;
            const spacing = plotWidth / thresholds.length;
            const x = paddingLeft + spacing * idx + (spacing - barWidth) / 2;
            const barHeight = (val / 100) * plotHeight;
            const y = paddingTop + plotHeight - barHeight;
            
            // Determinar color de barra
            let fill = 'var(--warning-color)';
            if (type === 'spell') {
              fill = t <= 3 ? 'var(--success-color)' : t === 4 ? 'var(--warning-color)' : 'var(--danger-color)';
            } else { // resist
              fill = t <= 3 ? 'var(--danger-color)' : t === 4 ? 'var(--warning-color)' : 'var(--success-color)';
            }

            const isActive = t === parseInt(activeValue);

            return (
              <g key={t}>
                {/* Barra */}
                <rect 
                  x={x} 
                  y={y} 
                  width={barWidth} 
                  height={barHeight} 
                  fill={fill} 
                  opacity={isActive ? 1.0 : 0.6}
                  rx="3"
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* Borde de realce para la barra activa */}
                {isActive && (
                  <rect 
                    x={x - 2} 
                    y={y - 2} 
                    width={barWidth + 4} 
                    height={barHeight + 2} 
                    fill="transparent" 
                    stroke="var(--gold-primary)" 
                    strokeWidth="1.5"
                    rx="5"
                  />
                )}
                {/* Texto del porcentaje sobre la barra */}
                <text 
                  x={x + barWidth / 2} 
                  y={y - 4} 
                  fill={isActive ? 'var(--gold-primary)' : 'var(--text-secondary)'} 
                  fontSize="8px" 
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {val.toFixed(1)}%
                </text>
                {/* Etiqueta del valor de dado (X+) */}
                <text 
                  x={x + barWidth / 2} 
                  y={paddingTop + plotHeight + 14} 
                  fill={isActive ? 'var(--gold-primary)' : 'var(--text-muted)'} 
                  fontSize="9px" 
                  fontWeight={isActive ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {t}+
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Selector de Pestañas (Tabs) */}
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
          onClick={() => setActiveTab('spell')}
          style={{
            flex: 1,
            background: activeTab === 'spell' ? 'linear-gradient(135deg, #1d3321 0%, #112114 100%)' : 'transparent',
            border: activeTab === 'spell' ? 'var(--border-gold)' : '1px solid transparent',
            color: activeTab === 'spell' ? 'var(--gold-primary)' : 'var(--text-muted)',
            boxShadow: 'none',
            minHeight: '40px'
          }}
        >
          {t.spell_calc}
        </button>
        <button 
          className="btn btn-small"
          onClick={() => setActiveTab('resist')}
          style={{
            flex: 1,
            background: activeTab === 'resist' ? 'linear-gradient(135deg, #1d3321 0%, #112114 100%)' : 'transparent',
            border: activeTab === 'resist' ? 'var(--border-gold)' : '1px solid transparent',
            color: activeTab === 'resist' ? 'var(--gold-primary)' : 'var(--text-muted)',
            boxShadow: 'none',
            minHeight: '40px'
          }}
        >
          {t.resist_calc}
        </button>
        <button 
          className="btn btn-small"
          onClick={() => setActiveTab('duel')}
          style={{
            flex: 1,
            background: activeTab === 'duel' ? 'linear-gradient(135deg, #1d3321 0%, #112114 100%)' : 'transparent',
            border: activeTab === 'duel' ? 'var(--border-gold)' : '1px solid transparent',
            color: activeTab === 'duel' ? 'var(--gold-primary)' : 'var(--text-muted)',
            boxShadow: 'none',
            minHeight: '40px'
          }}
        >
          {lang === 'es' ? 'Duelo' : 'Duel'}
        </button>
      </div>

      {/* --- PANEL DE LANZAR HECHIZO --- */}
      {activeTab === 'spell' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', textAlign: 'center', color: 'var(--gold-primary)' }}>
            {t.spell_calc}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.will_points}</label>
              <Stepper value={spellWill} min={1} max={12} onChange={setSpellWill} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.spell_difficulty}</label>
              <Stepper value={spellDiff} min={2} max={6} onChange={setSpellDiff} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.might_points}</label>
              <Stepper value={spellMight} min={0} max={6} onChange={setSpellMight} />
            </div>
          </div>

          <div 
            style={{
              background: 'rgba(0,0,0,0.15)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-glass)',
              textAlign: 'center',
              marginTop: '8px'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.success_probability}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--success-color)', margin: '4px 0' }}>
              {spellResult.totalProbability.toFixed(1)}%
            </div>
          </div>

          <SvgBarChart distribution={spellResult.distribution} activeValue={spellDiff} type="spell" />
        </div>
      )}

      {/* --- PANEL DE RESISTIR HECHIZO --- */}
      {activeTab === 'resist' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', textAlign: 'center', color: 'var(--gold-primary)' }}>
            {t.resist_calc}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.will_points}</label>
              <Stepper value={resistWill} min={1} max={12} onChange={setResistWill} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.rival_spell_result}</label>
              <Stepper value={rivalResult} min={2} max={6} onChange={setRivalResult} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.might_points}</label>
              <Stepper value={resistMight} min={0} max={6} onChange={setResistMight} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.magic_resistance}</span>
              <label 
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '28px'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={magicResist}
                  onChange={(e) => setMagicResist(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span 
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: magicResist ? 'var(--success-color)' : '#3f4e41',
                    transition: '0.3s',
                    borderRadius: '34px',
                    boxShadow: magicResist ? '0 0 8px rgba(85, 196, 107, 0.4)' : 'none'
                  }}
                >
                  <span 
                    style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: magicResist ? '26px' : '4px',
                      bottom: '4px',
                      backgroundColor: '#fff',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          <div 
            style={{
              background: 'rgba(0,0,0,0.15)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-glass)',
              textAlign: 'center',
              marginTop: '8px'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.resist_probability}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--warning-color)', margin: '4px 0' }}>
              {resistResult.totalProbability.toFixed(1)}%
            </div>
          </div>

          <SvgBarChart distribution={resistResult.distribution} activeValue={rivalResult} type="resist" />
        </div>
      )}

      {/* --- PANEL DE DUELO DE COMBATE --- */}
      {activeTab === 'duel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Ficha Amiga */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '3px solid var(--success-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--success-color)', textTransform: 'uppercase' }}>
              {t.friendly_stats}
            </h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.attacks}</span>
              <Stepper value={fAttacks} min={1} max={10} onChange={setFAttacks} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.fight_value}</span>
              <Stepper value={fFv} min={1} max={10} onChange={setFFv} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={fBanner} onChange={(e) => setFBanner(e.target.checked)} />
                {t.banner}
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={fTwoHanded} onChange={(e) => setFTwoHanded(e.target.checked)} />
                {t.two_handed}
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={fElven} onChange={(e) => setFElven(e.target.checked)} />
                {t.elven_weapon}
              </label>
            </div>
          </div>

          {/* Ficha Enemiga */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '3px solid var(--danger-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--danger-color)', textTransform: 'uppercase' }}>
              {t.enemy_stats}
            </h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.attacks}</span>
              <Stepper value={eAttacks} min={1} max={10} onChange={setEAttacks} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.fight_value}</span>
              <Stepper value={eFv} min={1} max={10} onChange={setEFv} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={eBanner} onChange={(e) => setEBanner(e.target.checked)} />
                {t.banner}
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={eTwoHanded} onChange={(e) => setETwoHanded(e.target.checked)} />
                {t.two_handed}
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={eElven} onChange={(e) => setEElven(e.target.checked)} />
                {t.elven_weapon}
              </label>
            </div>
          </div>

          {/* Panel de Resultados del Duelo */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--gold-primary)', textAlign: 'center', marginBottom: '4px' }}>
              {t.results}
            </h4>

            {/* Barra de Distribución Visual */}
            <div style={{ width: '100%', height: '22px', display: 'flex', borderRadius: '11px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div 
                style={{ 
                  width: `${duelResult.friendlyWin}%`, 
                  background: 'var(--success-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: '#000',
                  transition: 'width 0.3s ease'
                }}
              >
                {duelResult.friendlyWin > 15 ? `${duelResult.friendlyWin.toFixed(0)}%` : ''}
              </div>
              <div 
                style={{ 
                  width: `${duelResult.enemyWin}%`, 
                  background: 'var(--danger-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: '#fff',
                  transition: 'width 0.3s ease'
                }}
              >
                {duelResult.enemyWin > 15 ? `${duelResult.enemyWin.toFixed(0)}%` : ''}
              </div>
            </div>

            {/* Desglose de Porcentajes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{t.win_probability}</span>
                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{duelResult.friendlyWin.toFixed(2)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{t.loss_probability}</span>
                <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{duelResult.enemyWin.toFixed(2)}%</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
