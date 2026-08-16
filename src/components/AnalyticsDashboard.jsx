// src/components/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { subscribeToAnalytics, getAnalyticsSummary, resetAnalyticsData } from '../utils/analyticsTracker';

export default function AnalyticsDashboard({ lang, showAlert, showConfirm }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToAnalytics((incomingData) => {
      if (isMounted) {
        setData(incomingData || {});
        setLoading(false);
      }
    });

    // Fallback load in case snapshot delay
    getAnalyticsSummary().then((initial) => {
      if (isMounted && initial) {
        setData(initial);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const summary = await getAnalyticsSummary();
      setData(summary || {});
    } catch (err) {
      console.error('[AnalyticsDashboard] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    showConfirm(
      lang === 'es' ? 'Reiniciar Analíticas' : 'Reset Analytics',
      lang === 'es' 
        ? '¿Estás seguro de que deseas poner a cero todas las estadísticas y métricas de uso acumuladas?'
        : 'Are you sure you want to reset all accumulated analytics and usage metrics to zero?',
      async () => {
        setLoading(true);
        try {
          const empty = await resetAnalyticsData();
          setData(empty);
          showAlert(
            lang === 'es' ? 'Analíticas Reiniciadas' : 'Analytics Reset',
            lang === 'es' ? 'Se han restablecido los contadores correctamente.' : 'Counters have been reset successfully.'
          );
        } catch (err) {
          showAlert(lang === 'es' ? 'Error' : 'Error', err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>📊</span>
        {lang === 'es' ? 'Cargando analíticas y telemetría de uso...' : 'Loading analytics and usage telemetry...'}
      </div>
    );
  }

  // Filtrado temporal
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyStats = data?.daily || {};

  let sessions = {
    total: data?.sessions?.total || 0,
    anonymous: data?.sessions?.anonymous || 0,
    registered: data?.sessions?.registered || 0,
    totalDurationSec: data?.sessions?.totalDurationSec || 0
  };

  let features = {
    ai_query: data?.features?.ai_query || 0,
    calculator_run: data?.features?.calculator_run || 0,
    mission_view: data?.features?.mission_view || 0,
    pdf_export: data?.features?.pdf_export || 0,
    league_view: data?.features?.league_view || 0,
    calendar_view: data?.features?.calendar_view || 0
  };

  if (timeFilter === 'today') {
    const todayData = dailyStats[todayKey] || {};
    sessions = {
      total: todayData.sessions?.total || 0,
      anonymous: todayData.sessions?.anonymous || 0,
      registered: todayData.sessions?.registered || 0,
      totalDurationSec: todayData.sessions?.totalDurationSec || 0
    };
    features = {
      ai_query: todayData.features?.ai_query || 0,
      calculator_run: todayData.features?.calculator_run || 0,
      mission_view: todayData.features?.mission_view || 0,
      pdf_export: todayData.features?.pdf_export || 0,
      league_view: todayData.features?.league_view || 0,
      calendar_view: todayData.features?.calendar_view || 0
    };
  } else if (timeFilter === 'week' || timeFilter === 'month') {
    const daysBack = timeFilter === 'week' ? 7 : 30;
    let totalSess = 0, anonSess = 0, regSess = 0, durSec = 0;
    let featAi = 0, featCalc = 0, featMiss = 0, featPdf = 0, featLeague = 0, featCal = 0;

    for (let i = 0; i < daysBack; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dKey = d.toISOString().slice(0, 10);
      const dayData = dailyStats[dKey];
      if (dayData) {
        totalSess += dayData.sessions?.total || 0;
        anonSess += dayData.sessions?.anonymous || 0;
        regSess += dayData.sessions?.registered || 0;
        durSec += dayData.sessions?.totalDurationSec || 0;

        featAi += dayData.features?.ai_query || 0;
        featCalc += dayData.features?.calculator_run || 0;
        featMiss += dayData.features?.mission_view || 0;
        featPdf += dayData.features?.pdf_export || 0;
        featLeague += dayData.features?.league_view || 0;
        featCal += dayData.features?.calendar_view || 0;
      }
    }

    sessions = { total: totalSess, anonymous: anonSess, registered: regSess, totalDurationSec: durSec };
    features = {
      ai_query: featAi,
      calculator_run: featCalc,
      mission_view: featMiss,
      pdf_export: featPdf,
      league_view: featLeague,
      calendar_view: featCal
    };
  } else if (timeFilter === 'custom') {
    let totalSess = 0, anonSess = 0, regSess = 0, durSec = 0;
    let featAi = 0, featCalc = 0, featMiss = 0, featPdf = 0, featLeague = 0, featCal = 0;

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);

    // Iterar por cada día del rango
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dKey = d.toISOString().slice(0, 10);
      const dayData = dailyStats[dKey];
      if (dayData) {
        totalSess += dayData.sessions?.total || 0;
        anonSess += dayData.sessions?.anonymous || 0;
        regSess += dayData.sessions?.registered || 0;
        durSec += dayData.sessions?.totalDurationSec || 0;

        featAi += dayData.features?.ai_query || 0;
        featCalc += dayData.features?.calculator_run || 0;
        featMiss += dayData.features?.mission_view || 0;
        featPdf += dayData.features?.pdf_export || 0;
        featLeague += dayData.features?.league_view || 0;
        featCal += dayData.features?.calendar_view || 0;
      }
    }

    sessions = { total: totalSess, anonymous: anonSess, registered: regSess, totalDurationSec: durSec };
    features = {
      ai_query: featAi,
      calculator_run: featCalc,
      mission_view: featMiss,
      pdf_export: featPdf,
      league_view: featLeague,
      calendar_view: featCal
    };
  }

  // Cálculos de KPI
  const regPercent = sessions.total > 0 ? Math.round((sessions.registered / sessions.total) * 100) : 0;
  const anonPercent = sessions.total > 0 ? 100 - regPercent : 0;

  const avgSeconds = sessions.total > 0 ? Math.round(sessions.totalDurationSec / sessions.total) : 0;
  const avgMin = Math.floor(avgSeconds / 60);
  const avgSec = avgSeconds % 60;
  const avgDurationFormatted = `${avgMin}m ${avgSec < 10 ? '0' : ''}${avgSec}s`;

  const totalMin = Math.floor((sessions.totalDurationSec || 0) / 60);
  const totalHours = (totalMin / 60).toFixed(1);

  // Ranking de herramientas
  const featureList = [
    { id: 'ai_query', name: lang === 'es' ? 'Lobelia IA (Referí de Reglas)' : 'Lobelia AI (Rules Referee)', count: features.ai_query, icon: '🤖' },
    { id: 'mission_view', name: lang === 'es' ? 'Misiones Matched Play & Escenarios' : 'Matched Play Missions & Scenarios', count: features.mission_view, icon: '📜' },
    { id: 'calculator_run', name: lang === 'es' ? 'Calculadora de Dados & Combate' : 'Dice & Combat Calculator', count: features.calculator_run, icon: '🎲' },
    { id: 'league_view', name: lang === 'es' ? 'Ligas, Torneos & Emparejamientos' : 'Leagues, Tournaments & Matchups', count: features.league_view, icon: '🏆' },
    { id: 'pdf_export', name: lang === 'es' ? 'Descarga de Informes & PDFs' : 'Reports & PDF Downloads', count: features.pdf_export, icon: '📄' },
    { id: 'calendar_view', name: lang === 'es' ? 'Calendario de Eventos MESBG' : 'MESBG Events Calendar', count: features.calendar_view, icon: '📅' },
  ].sort((a, b) => b.count - a.count);

  const totalFeatureEvents = featureList.reduce((acc, f) => acc + f.count, 0);

  // Dispositivos y navegadores
  const devices = data?.devices || {};
  const totalDev = (devices.mobile || 0) + (devices.desktop || 0) + (devices.tablet || 0) || 1;
  const mobilePct = Math.round(((devices.mobile || 0) / totalDev) * 100);
  const desktopPct = Math.round(((devices.desktop || 0) / totalDev) * 100);
  const tabletPct = Math.max(0, 100 - mobilePct - desktopPct);

  // Idiomas
  const languages = data?.languages || {};
  const totalLang = (languages.es || 0) + (languages.en || 0) || 1;
  const esPct = Math.round(((languages.es || 0) / totalLang) * 100);
  const enPct = Math.max(0, 100 - esPct);

  // Usuarios recientes
  const recentUsers = data?.recentUsers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cabecera con selector de tiempo y botón actualizar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(203, 161, 53, 0.12), rgba(0,0,0,0.3))',
        border: '1px solid var(--gold-primary)',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>📊</span>
          <div>
            <h3 style={{ margin: 0, color: 'var(--gold-primary)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
              {lang === 'es' ? 'Analíticas & Telemetría de Uso' : 'Analytics & Usage Telemetry'}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {lang === 'es' 
                ? 'Métricas de sesiones anónimas vs registradas, tiempo de permanencia y ranking de uso.' 
                : 'Metrics for anonymous vs registered sessions, time spent, and tool usage ranking.'}
            </p>
          </div>
        </div>

        {/* Filtros temporales y refrescar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '2px', border: 'var(--border-glass)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              style={{
                background: timeFilter === 'all' ? 'var(--gold-primary)' : 'transparent',
                color: timeFilter === 'all' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {lang === 'es' ? 'Histórico' : 'All-time'}
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('month')}
              style={{
                background: timeFilter === 'month' ? 'var(--gold-primary)' : 'transparent',
                color: timeFilter === 'month' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {lang === 'es' ? '30 Días' : '30 Days'}
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('week')}
              style={{
                background: timeFilter === 'week' ? 'var(--gold-primary)' : 'transparent',
                color: timeFilter === 'week' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {lang === 'es' ? '7 Días' : '7 Days'}
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              style={{
                background: timeFilter === 'today' ? 'var(--gold-primary)' : 'transparent',
                color: timeFilter === 'today' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {lang === 'es' ? 'Hoy' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('custom')}
              style={{
                background: timeFilter === 'custom' ? 'var(--gold-primary)' : 'transparent',
                color: timeFilter === 'custom' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📅 {lang === 'es' ? 'Rango' : 'Custom'}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleRefresh}
            title={lang === 'es' ? 'Actualizar métricas' : 'Refresh metrics'}
            style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.06)' }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Selector de Rango Personalizado */}
      {timeFilter === 'custom' && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: 'var(--border-glass)',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
            📅 {lang === 'es' ? 'Filtrar por Fecha:' : 'Filter by Date Range:'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Desde:' : 'From:'}</label>
            <input 
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: 'var(--border-glass)',
                borderRadius: '4px',
                color: '#fff',
                padding: '4px 8px',
                fontSize: '0.78rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Hasta:' : 'To:'}</label>
            <input 
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: 'var(--border-glass)',
                borderRadius: '4px',
                color: '#fff',
                padding: '4px 8px',
                fontSize: '0.78rem'
              }}
            />
          </div>
        </div>
      )}

      {/* Grid de KPIs Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        
        {/* KPI 1: Sesiones Totales */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'es' ? 'Sesiones Totales' : 'Total Sessions'}
            </span>
            <span style={{ fontSize: '1.2rem' }}>👥</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-heading)' }}>
            {sessions.total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {timeFilter === 'today' ? (lang === 'es' ? 'Visitas registradas hoy' : 'Visits today') : (lang === 'es' ? 'Visitas totales acumuladas' : 'Cumulative visits')}
          </div>
        </div>

        {/* KPI 2: Anónimos vs Registrados */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'es' ? 'Usuarios vs Anónimos' : 'Users vs Anonymous'}
            </span>
            <span style={{ fontSize: '1.2rem' }}>👤</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
              {sessions.registered} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({regPercent}%)</span>
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              {sessions.anonymous} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>({anonPercent}%)</span>
            </span>
          </div>

          {/* Barra visual de proporción */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginTop: '2px' }}>
            <div style={{ width: `${regPercent}%`, background: 'var(--gold-primary)', height: '100%', title: 'Registrados' }} />
            <div style={{ width: `${anonPercent}%`, background: 'rgba(255,255,255,0.25)', height: '100%', title: 'Anónimos' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>🟡 {lang === 'es' ? 'Registrados' : 'Registered'}</span>
            <span>⚪ {lang === 'es' ? 'Anónimos' : 'Anonymous'}</span>
          </div>
        </div>

        {/* KPI 3: Tiempo Medio de Sesión */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'es' ? 'Tiempo Medio / Sesión' : 'Avg. Session Duration'}
            </span>
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#2ecc71', fontFamily: 'var(--font-heading)' }}>
            {avgDurationFormatted}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {lang === 'es' ? `Tiempo total: ${totalHours}h acumuladas` : `Total time: ${totalHours}h accumulated`}
          </div>
        </div>

        {/* KPI 4: Consultas de IA */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'es' ? 'Consultas IA (Lobelia)' : 'AI Rules Queries'}
            </span>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--gold-primary)', fontFamily: 'var(--font-heading)' }}>
            {features.ai_query.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {lang === 'es' ? 'Preguntas de reglas resueltas' : 'Rules questions answered'}
          </div>
        </div>

      </div>

      {/* SECCIÓN: Ranking de Funcionalidades (Qué cosas usaron más y qué menos) */}
      <div style={{
        background: 'rgba(0,0,0,0.25)',
        border: 'var(--border-glass)',
        borderRadius: '10px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>🏆</span>
            <div>
              <h4 style={{ margin: 0, color: 'var(--gold-primary)', fontSize: '0.95rem' }}>
                {lang === 'es' ? 'Ranking de Uso de Funcionalidades (Más a Menos usadas)' : 'Feature Usage Ranking (Most to Least Used)'}
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {lang === 'es' ? `Total de interacciones registradas: ${totalFeatureEvents}` : `Total feature interactions: ${totalFeatureEvents}`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {featureList.map((item, idx) => {
            const pct = totalFeatureEvents > 0 ? Math.round((item.count / totalFeatureEvents) * 100) : 0;
            const rankColors = ['#f1c40f', '#bdc3c7', '#cd7f32', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'];

            return (
              <div 
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: 'var(--border-glass)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: rankColors[idx] || 'rgba(255,255,255,0.1)',
                      color: idx < 3 ? '#000' : '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                      {item.count.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({pct}%)
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(1, pct)}%`,
                    height: '100%',
                    background: idx === 0 ? 'var(--gold-primary)' : (idx === 1 ? '#3498db' : '#2ecc71'),
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN: Dispositivos & Idiomas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        
        {/* Dispositivos */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📱</span>
            <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
              {lang === 'es' ? 'Dispositivos & Plataformas' : 'Devices & Platforms'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>📱</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{mobilePct}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'es' ? 'Móvil' : 'Mobile'} ({devices.mobile || 0})</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>💻</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{desktopPct}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'es' ? 'PC / Escritorio' : 'Desktop'} ({devices.desktop || 0})</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>📟</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{tabletPct}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'es' ? 'Tablet' : 'Tablet'} ({devices.tablet || 0})</div>
            </div>
          </div>
        </div>

        {/* Idiomas */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
            <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
              {lang === 'es' ? 'Distribución por Idioma' : 'Language Distribution'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>🇪🇸</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{esPct}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Español ({languages.es || 0})</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>🇬🇧</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3498db' }}>{enPct}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>English ({languages.en || 0})</div>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN: Últimos Jugadores Registrados Activos */}
      {recentUsers.length > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🕒</span>
            <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
              {lang === 'es' ? 'Últimos Jugadores Conectados' : 'Recently Active Players'}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {recentUsers.map((u, i) => {
              const dateStr = u.lastSeen ? new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: 'var(--border-glass)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem'
                  }}
                >
                  <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>👤 {u.username}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {u.deviceType === 'mobile' ? '📱' : '💻'} {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botón de Reinicio Admin */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={handleReset}
          style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', fontSize: '0.72rem' }}
        >
          🗑️ {lang === 'es' ? 'Reiniciar Métricas de Analíticas' : 'Reset Analytics Metrics'}
        </button>
      </div>

    </div>
  );
}
