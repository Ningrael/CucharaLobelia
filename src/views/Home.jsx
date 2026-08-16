import React from 'react';
import HitsDisplay from '../components/HitsDisplay';
import AiRulesWidget from '../components/AiRulesWidget';

export default function Home({ setView, onOpenAbout, onShareApp, lang, translations, user, profile, onOpenAuthModal }) {
  const t = translations[lang] || translations['es'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Selector Rápido Compacto de Secciones (Misiones & Liga) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', width: '100%' }}>
        {/* Banner Compacto: Misiones */}
        <div
          onClick={() => setView('missions')}
          className="hero-card-highlight"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '16px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(22, 38, 25, 0.85) 0%, rgba(12, 20, 14, 0.95) 100%)',
            border: '1px solid rgba(203, 161, 53, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 6px var(--gold-glow))' }}>⚔️</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.5px' }}>
                {t.missions || 'Misiones Matched Play'}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {lang === 'es' ? 'Escenarios oficiales y emparejamientos' : 'Official scenarios & pairings'}
              </span>
            </div>
          </div>
          <span style={{ color: 'var(--gold-primary)', fontSize: '1.2rem', fontWeight: 'bold', paddingLeft: '8px' }}>➔</span>
        </div>

        {/* Banner Compacto: Liga */}
        <div
          onClick={() => setView('league')}
          className="hero-card-highlight"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '16px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(35, 26, 16, 0.85) 0%, rgba(18, 14, 10, 0.95) 100%)',
            border: '1px solid rgba(203, 161, 53, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 6px rgba(236, 210, 121, 0.4))' }}>🏆</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Liga & Torneos' : 'League & Tournaments'}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {lang === 'es' ? 'Clasificación, inscripciones y resultados' : 'Standings, sign-ups & battle logs'}
              </span>
            </div>
          </div>
          <span style={{ color: 'var(--gold-primary)', fontSize: '1.2rem', fontWeight: 'bold', paddingLeft: '8px' }}>➔</span>
        </div>
      </div>

      {/* 2. Cuadro Principal de IA - Sabio de Reglas MESBG */}
      <AiRulesWidget
        user={user}
        profile={profile}
        lang={lang}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Selector Secundario Compacto (Calculadora & Eventos) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', width: '100%' }}>
        {/* Banner Compacto: Calculadora */}
        <div
          onClick={() => setView('calculator')}
          className="hero-card-highlight"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '16px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(20, 28, 38, 0.85) 0%, rgba(10, 14, 20, 0.95) 100%)',
            border: '1px solid rgba(203, 161, 53, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 6px rgba(100, 180, 255, 0.3))' }}>📊</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Calculadora de Dados' : 'Dice Calculator'}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {lang === 'es' ? 'Probabilidades de combate y disparo' : 'Combat & shooting odds'}
              </span>
            </div>
          </div>
          <span style={{ color: 'var(--gold-primary)', fontSize: '1.2rem', fontWeight: 'bold', paddingLeft: '8px' }}>➔</span>
        </div>

        {/* Banner Compacto: Eventos */}
        <div
          onClick={() => setView('calendar')}
          className="hero-card-highlight"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '16px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(32, 20, 35, 0.85) 0%, rgba(16, 10, 20, 0.95) 100%)',
            border: '1px solid rgba(203, 161, 53, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 6px rgba(220, 150, 255, 0.3))' }}>📅</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Eventos & Torneos' : 'Events & Calendar'}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {lang === 'es' ? 'Calendario de torneos y quedadas' : 'Community tournaments & meetups'}
              </span>
            </div>
          </div>
          <span style={{ color: 'var(--gold-primary)', fontSize: '1.2rem', fontWeight: 'bold', paddingLeft: '8px' }}>➔</span>
        </div>
      </div>

      {/* Botón Compartir App con la Comunidad */}
      {onShareApp && (
        <button
          type="button"
          onClick={onShareApp}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(203, 161, 53, 0.12), rgba(0,0,0,0.3))',
            borderColor: 'rgba(203, 161, 53, 0.35)',
            color: 'var(--gold-primary)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📤</span>
          <span>{lang === 'es' ? 'Compartir La Cuchara de Lobelia con tu grupo' : 'Share La Cuchara de Lobelia with your group'}</span>
        </button>
      )}

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
