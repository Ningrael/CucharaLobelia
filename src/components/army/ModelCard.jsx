// src/components/army/ModelCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta de perfil ilustrado de Héroe / Guerrero (estilo MESBG List Builder).
// Muestra atributos, foto circular, M/W/F, equipo, reglas especiales y montura.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

export default function ModelCard({ model, onClose, onSelectOption, selectedOptions = [], lang = 'es' }) {
  if (!model) return null;

  const {
    name,
    factionName,
    baseCost = 0,
    totalCost,
    keywords = [],
    baseSize = '25mm',
    stats = {},
    heroicStats,
    options = [],
    wargear = [],
    specialRules = [],
    heroicActions = [],
    magicalPowers = [],
    mounts = {},
    imageFile,
    imageBaseUrl = '',
  } = model;

  const currentCost = totalCost ?? baseCost;
  const isHero = !!heroicStats || model.type === 'hero';

  // URL de la imagen de la miniatura
  const imageUrl = imageFile
    ? (imageBaseUrl ? `${imageBaseUrl.replace(/\/$/, '')}/${imageFile}` : imageFile)
    : null;

  const statKeys = ['Mv', 'Fv', 'Sv', 'S', 'D', 'A', 'W', 'C', 'I'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
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
          background: 'linear-gradient(145deg, #1c1a16 0%, #12100d 100%)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.15)',
          color: '#e2d9c8'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#c5b8a5',
            fontSize: '1.2rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* ── CABECERA & FOTO ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.35rem',
                  fontFamily: 'var(--font-title)',
                  color: '#d4af37',
                  letterSpacing: '0.04em',
                  lineHeight: '1.2'
                }}
              >
                {name}
              </h2>
              <span
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#d4af37',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                {currentCost} pts
              </span>
            </div>

            {/* Tags / Keywords */}
            <div style={{ fontSize: '0.72rem', color: '#9e917d', marginTop: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {[...(keywords || []), baseSize].filter(Boolean).join(' | ')}
            </div>
          </div>

          {/* Foto circular de la miniatura */}
          {imageUrl ? (
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                border: '2px solid #d4af37',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
                background: '#0a0a0a'
              }}
            >
              <img
                src={imageUrl}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                flexShrink: 0,
                background: 'rgba(212, 175, 55, 0.05)'
              }}
            >
              ⚔️
            </div>
          )}
        </div>

        {/* ── TABLA DE ESTADÍSTICAS & RECURSOS HEROICOS ── */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          {/* Stats Base */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {statKeys.map((k) => (
              <div key={k} style={{ textAlign: 'center', minWidth: '28px' }}>
                <div style={{ fontSize: '0.65rem', color: '#9e917d', fontWeight: 'bold' }}>{k}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f0e6d2' }}>
                  {stats[k] ?? '-'}
                </div>
              </div>
            ))}
          </div>

          {/* M / W / F */}
          {isHero && heroicStats && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                paddingLeft: '12px',
                borderLeft: '1px solid rgba(212, 175, 55, 0.25)'
              }}
            >
              {[
                { label: 'M', val: heroicStats.Might ?? heroicStats.M ?? 0, title: 'Might (Poder)', col: '#f1c40f' },
                { label: 'W', val: heroicStats.Will ?? heroicStats.W ?? 0, title: 'Will (Voluntad)', col: '#3498db' },
                { label: 'F', val: heroicStats.Fate ?? heroicStats.F ?? 0, title: 'Fate (Destino)', col: '#2ecc71' }
              ].map((res) => (
                <div key={res.label} style={{ textAlign: 'center' }} title={res.title}>
                  <div style={{ fontSize: '0.65rem', color: res.col, fontWeight: 'bold' }}>{res.label}</div>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: `1px solid ${res.col}`,
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                  >
                    {res.val}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── OPCIONES DE EQUIPO ── */}
        {options.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d4af37', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {lang === 'es' ? 'Opciones de Equipo (Options)' : 'Wargear Upgrades & Options'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {options.map((opt, oIdx) => {
                const isSelected = selectedOptions.some((s) => s.name === opt.name);
                return (
                  <button
                    key={oIdx}
                    onClick={() => onSelectOption && onSelectOption(opt)}
                    style={{
                      background: isSelected ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#d4af37' : '#c5b8a5',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      cursor: onSelectOption ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{opt.name}</span>
                    <span style={{ color: '#9e917d' }}>(+{opt.cost} pts)</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EQUIPO BASE (WARGEAR) ── */}
        {wargear.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d4af37', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {lang === 'es' ? 'Equipo Base (Wargear)' : 'Base Wargear'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#c5b8a5' }}>
              {wargear.join(', ')}
            </div>
          </div>
        )}

        {/* ── ACCIONES HEROICAS ── */}
        {heroicActions.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d4af37', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {lang === 'es' ? 'Acciones Heroicas (Heroic Actions)' : 'Heroic Actions'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {heroicActions.map((act, aIdx) => (
                <span
                  key={aIdx}
                  style={{
                    background: 'rgba(241, 196, 15, 0.1)',
                    border: '1px solid rgba(241, 196, 15, 0.3)',
                    color: '#f1c40f',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem'
                  }}
                >
                  ⚡ {act}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── PODERES MÁGICOS ── */}
        {magicalPowers.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3498db', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {lang === 'es' ? 'Poderes Mágicos (Magical Powers)' : 'Magical Powers'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px' }}>
              {magicalPowers.map((mag, mIdx) => (
                <div
                  key={mIdx}
                  style={{
                    background: 'rgba(52, 152, 219, 0.08)',
                    border: '1px solid rgba(52, 152, 219, 0.25)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: '#74b9ff' }}>{mag.name}</span>
                  <span style={{ color: '#dfe6e9' }}>{mag.cast} · {mag.range}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REGLAS ESPECIALES ── */}
        {specialRules.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d4af37', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {lang === 'es' ? 'Reglas Especiales (Special Rules)' : 'Special Rules'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {specialRules.map((rule, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 'bold', color: '#f0e6d2', fontSize: '0.82rem' }}>
                      {rule.name}
                    </span>
                    {rule.type && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: rule.type === 'Active' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                          color: rule.type === 'Active' ? '#ff7675' : '#2ecc71'
                        }}
                      >
                        {rule.type}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#a89c89', lineHeight: '1.45' }}>
                    {rule.text || rule.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PERFIL DE MONTURA (SI TIENE) ── */}
        {mounts && Object.keys(mounts).length > 0 && (
          <div>
            {Object.values(mounts).map((mount, mIdx) => (
              <div
                key={mIdx}
                style={{
                  background: 'rgba(212, 175, 55, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginTop: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '6px' }}>
                  {lang === 'es' ? `🐎 Montura: ${mount.name}` : `🐎 Mount: ${mount.name}`}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {statKeys.map((k) => (
                    <div key={k} style={{ textAlign: 'center', minWidth: '24px' }}>
                      <div style={{ fontSize: '0.62rem', color: '#9e917d' }}>{k}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f0e6d2' }}>
                        {mount.stats?.[k] ?? '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
