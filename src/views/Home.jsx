// src/views/Home.jsx
import React from 'react';
import YouTubeGallery from '../components/YouTubeGallery';
import HitsDisplay from '../components/HitsDisplay';

export default function Home({ setView, onOpenAbout, lang, translations }) {
  const t = translations[lang];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Tarjeta Destacada de Misiones (Principal Funcionalidad) */}
      <div 
        className="glass-card hero-card-highlight"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '24px 20px',
          borderRadius: 'var(--radius-md)',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))' }}>⚔️</span>
        </div>
        <h3 style={{ fontSize: '1.35rem', color: 'var(--gold-primary)' }}>
          {t.missions}
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
          {lang === 'es'
            ? 'Generador de escenarios de torneo, rondas de emparejamientos y reglamento oficial en un toque.'
            : 'Tournament scenario generator, round pairings, and official rules in one touch.'}
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => setView('missions')}
          style={{ width: '100%', marginTop: '8px', minHeight: '44px' }}
        >
          {lang === 'es' ? 'ACCEDER A MISIONES' : 'GO TO MISSIONS'}
        </button>
      </div>

      {/* Tarjeta Destacada de Liga (Nueva ubicación) */}
      <div 
        className="glass-card hero-card-highlight"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '24px 20px',
          borderRadius: 'var(--radius-md)',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))' }}>🏆</span>
        </div>
        <h3 style={{ fontSize: '1.35rem', color: 'var(--gold-primary)' }}>
          {lang === 'es' ? 'LIGA' : 'LEAGUE'}
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
          {lang === 'es'
            ? 'Explora torneos activos, inscríbete con tu bando y facción y registra tus resultados.'
            : 'Explore active tournaments, register with your side and faction, and report your scores.'}
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => setView('league')}
          style={{ width: '100%', marginTop: '8px', minHeight: '44px' }}
        >
          {lang === 'es' ? 'ACCEDER A LA LIGA' : 'GO TO LEAGUE'}
        </button>
      </div>

      {/* Grid de Utilidades Secundarias */}
      <div className="secondary-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <button
          className="secondary-grid-btn"
          onClick={() => setView('calculator')}
        >
          <span>📊</span>
          <span>{lang === 'es' ? 'Calculadora' : 'Calculator'}</span>
        </button>

        <button
          className="secondary-grid-btn"
          onClick={() => setView('calendar')}
        >
          <span>📅</span>
          <span>{lang === 'es' ? 'Eventos' : 'Events'}</span>
        </button>
      </div>

      {/* Galería de Videos de YouTube */}
      <YouTubeGallery lang={lang} />

      {/* Cartel Destacado Torneos (Sam Va Lentin - Debajo de YouTube y más pequeño) */}
      <div 
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.2)',
          gap: '12px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            {lang === 'es' ? 'Torneo Concluido' : 'Concluded Tournament'}
          </div>
          <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: '2px 0 0 0', fontFamily: 'var(--font-title)' }}>
            Sam Va Lentin 2026
          </h4>
        </div>
        <button 
          className="btn btn-primary btn-small"
          onClick={() => setView('calendar')}
          style={{ minHeight: '30px', padding: '4px 12px', fontSize: '0.72rem' }}
        >
          {lang === 'es' ? 'Ver Detalles' : 'View Details'}
        </button>
      </div>

      {/* Footer Info & Acerca De */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px', 
          marginTop: '8px', 
          paddingBottom: '20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '20px'
        }}
      >
        <button 
          className="btn btn-small" 
          onClick={onOpenAbout}
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: 'var(--text-muted)' }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold-primary)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {t.about}
        </button>
        <HitsDisplay lang={lang} />
      </div>
    </div>
  );
}
