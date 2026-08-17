// src/components/army/WarbandCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta individual de Partida de Guerra (Warband) en el Army Builder.
// Muestra el Héroe Capitán, capacidad de guerreros, opciones y lista de tropas.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { HERO_TIER_MAX_WARBAND } from '../../utils/armyRules';

export default function WarbandCard({
  warband,
  warbandIndex,
  onRemoveWarband,
  onOpenAddWarrior,
  onRemoveWarrior,
  onViewModel,
  onToggleHeroOption,
  onToggleWarriorOption,
  activeMod,
  lang = 'es'
}) {
  const { hero, warriors = [] } = warband;

  if (!hero) return null;

  const maxWarriors = HERO_TIER_MAX_WARBAND[hero.heroTier] ?? (hero.warbandMax || 0);
  const warriorCount = warriors.length;
  const isFull = warriorCount >= maxWarriors && maxWarriors > 0;
  const isOverLimit = warriorCount > maxWarriors && maxWarriors > 0;

  // URL imagen de héroe
  const heroImgUrl = hero.imageFile
    ? (hero.imageBaseUrl || activeMod?.imageBaseUrl ? `${(hero.imageBaseUrl || activeMod?.imageBaseUrl).replace(/\/$/, '')}/${hero.imageFile}` : hero.imageFile)
    : null;

  const tierLabels = {
    hero_of_legend: 'Hero of Legend (18)',
    hero_of_valour: 'Hero of Valour (15)',
    hero_of_fortitude: 'Hero of Fortitude (12)',
    minor_hero: 'Minor Hero (6)',
    independent_hero: 'Independent Hero (0)',
    siege_veteran: 'Siege Veteran'
  };

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #181512 0%, #100e0b 100%)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        position: 'relative'
      }}
    >
      {/* ── CABECERA DE LA PARTIDA DE GUERRA ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: 'rgba(212,175,55,0.15)',
              color: '#d4af37',
              border: '1px solid rgba(212,175,55,0.4)',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Warband {warbandIndex + 1}
          </span>

          <span
            style={{
              fontSize: '0.72rem',
              color: isOverLimit ? '#f88' : isFull ? '#ffa500' : '#888',
              fontWeight: isFull || isOverLimit ? 'bold' : 'normal'
            }}
          >
            {lang === 'es' ? `Capacidad: ${warriorCount} / ${maxWarriors} guerreros` : `Capacity: ${warriorCount} / ${maxWarriors} warriors`}
          </span>
        </div>

        <button
          onClick={() => onRemoveWarband(warbandIndex)}
          style={{
            background: 'rgba(255, 80, 80, 0.1)',
            border: '1px solid rgba(255, 80, 80, 0.25)',
            color: '#ff8888',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.72rem',
            cursor: 'pointer'
          }}
          title={lang === 'es' ? 'Eliminar partida de guerra' : 'Remove warband'}
        >
          🗑 {lang === 'es' ? 'Eliminar Warband' : 'Remove Warband'}
        </button>
      </div>

      {/* ── TARJETA DEL HÉROE CAPITÁN ── */}
      <div
        style={{
          background: 'rgba(212, 175, 55, 0.06)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px'
        }}
      >
        {/* Avatar y Datos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {heroImgUrl ? (
            <img
              src={heroImgUrl}
              alt={hero.name}
              style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #d4af37', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid #d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
              👑
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div
              onClick={() => onViewModel && onViewModel(hero)}
              style={{
                fontWeight: 'bold',
                color: '#d4af37',
                fontSize: '0.92rem',
                fontFamily: 'var(--font-title)',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '2px'
              }}
              title={lang === 'es' ? 'Ver perfil completo' : 'View full profile'}
            >
              {hero.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#9e917d', marginTop: '1px' }}>
              {tierLabels[hero.heroTier] || hero.heroTier} · {hero.factionName}
            </div>
          </div>
        </div>

        {/* Coste y M/W/F */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f0e6d2' }}>
            {hero.totalCost || hero.baseCost} pts
          </div>
          {hero.heroicStats && (
            <div style={{ fontSize: '0.68rem', color: '#f1c40f', fontWeight: 'bold', marginTop: '1px' }}>
              M:{hero.heroicStats.Might ?? hero.heroicStats.M ?? 0} W:{hero.heroicStats.Will ?? hero.heroicStats.W ?? 0} F:{hero.heroicStats.Fate ?? hero.heroicStats.F ?? 0}
            </div>
          )}
        </div>
      </div>

      {/* ── LISTA DE GUERREROS ── */}
      <div style={{ marginBottom: '10px' }}>
        {warriors.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: '#777', fontStyle: 'italic', padding: '6px 0', textAlign: 'center' }}>
            {hero.heroTier === 'independent_hero'
              ? (lang === 'es' ? 'Los Héroes Independientes no pueden liderar guerreros.' : 'Independent Heroes cannot lead warriors.')
              : (lang === 'es' ? 'Esta partida de guerra no tiene guerreros aún.' : 'This warband has no warriors yet.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {warriors.map((w, wIdx) => {
              const warriorImg = w.imageFile
                ? (w.imageBaseUrl || activeMod?.imageBaseUrl ? `${(w.imageBaseUrl || activeMod?.imageBaseUrl).replace(/\/$/, '')}/${w.imageFile}` : w.imageFile)
                : null;
              const opts = (w.selectedOptions || []).map(o => o.name).join(', ');

              return (
                <div
                  key={wIdx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {warriorImg && (
                      <img
                        src={warriorImg}
                        alt={w.name}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <span
                        onClick={() => onViewModel && onViewModel(w)}
                        style={{ fontSize: '0.82rem', color: '#e0d5c1', cursor: 'pointer', fontWeight: '500' }}
                        title={lang === 'es' ? 'Ver perfil de tropa' : 'View warrior profile'}
                      >
                        {w.name}
                      </span>
                      {opts && (
                        <span style={{ fontSize: '0.72rem', color: '#999', marginLeft: '4px' }}>
                          ({opts})
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.78rem', color: '#d4af37', fontWeight: 'bold' }}>
                      {w.totalCost || w.baseCost} pts
                    </span>
                    <button
                      onClick={() => onRemoveWarrior(warbandIndex, wIdx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff8888',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: '2px 4px'
                      }}
                      title={lang === 'es' ? 'Eliminar guerrero' : 'Remove warrior'}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BOTÓN AÑADIR GUERREROS ── */}
      {hero.heroTier !== 'independent_hero' && (
        <button
          onClick={() => onOpenAddWarrior(warbandIndex)}
          disabled={isOverLimit}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px dashed rgba(212, 175, 55, 0.4)',
            borderRadius: '8px',
            padding: '8px',
            color: '#d4af37',
            fontSize: '0.78rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>+</span> {lang === 'es' ? 'Añadir Guerrero a esta Warband' : 'Add Warrior to this Warband'}
        </button>
      )}
    </div>
  );
}
