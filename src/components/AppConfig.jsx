// src/components/AppConfig.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getApiKeysPool, setAiDailyLimit, getKeyUsageStats } from '../utils/geminiRulesAi';

const ADMIN_CONFIG_UID = 'xXhjkWRjh0hVBjcYr2qAAFRvGL82';

export default function AppConfig({ lang, showAlert, showConfirm, currentUser, profile }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [aiDailyLimitInput, setAiDailyLimitInput] = useState(30);
  const [adminUnlimitedQueries, setAdminUnlimitedQueries] = useState(false);
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementTextEs, setAnnouncementTextEs] = useState('');
  const [announcementTextEn, setAnnouncementTextEn] = useState('');

  // Key stats state
  const [keyStats, setKeyStats] = useState([]);

  const refreshKeyStats = () => {
    setKeyStats(getKeyUsageStats());
  };

  // Load existing configuration from Firestore (checking both admin doc and app_config)
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      setLoading(true);
      try {
        let loadedData = null;

        // 1. Check players/{adminUid}.appConfig
        try {
          const adminSnap = await getDoc(doc(db, 'players', ADMIN_CONFIG_UID));
          if (adminSnap.exists() && adminSnap.data()?.appConfig) {
            loadedData = adminSnap.data().appConfig;
          }
        } catch (_) {}

        // 2. Fallback to app_config/global if not found
        if (!loadedData) {
          try {
            const configSnap = await getDoc(doc(db, 'app_config', 'global'));
            if (configSnap.exists()) {
              loadedData = configSnap.data();
            }
          } catch (_) {}
        }

        if (loadedData && isMounted) {
          if (typeof loadedData.aiDailyLimit === 'number') {
            setAiDailyLimitInput(loadedData.aiDailyLimit);
          }
          if (typeof loadedData.adminUnlimitedQueries === 'boolean') {
            setAdminUnlimitedQueries(loadedData.adminUnlimitedQueries);
          }
          if (typeof loadedData.announcementEnabled === 'boolean') {
            setAnnouncementEnabled(loadedData.announcementEnabled);
          }
          if (typeof loadedData.announcementTextEs === 'string') {
            setAnnouncementTextEs(loadedData.announcementTextEs);
          }
          if (typeof loadedData.announcementTextEn === 'string') {
            setAnnouncementTextEn(loadedData.announcementTextEn);
          }
        }
      } catch (err) {
        console.error('[AppConfig] Error loading settings:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          refreshKeyStats();
        }
      }
    }

    loadConfig();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const limitNum = parseInt(aiDailyLimitInput, 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      showAlert(
        lang === 'es' ? 'Error de validación' : 'Validation Error',
        lang === 'es' ? 'El límite de consultas debe ser un número entero mayor a 0.' : 'Daily query limit must be an integer greater than 0.'
      );
      return;
    }

    setSaving(true);
    try {
      const configData = {
        aiDailyLimit: limitNum,
        adminUnlimitedQueries: !!adminUnlimitedQueries,
        announcementEnabled: !!announcementEnabled,
        announcementTextEs: announcementTextEs.trim(),
        announcementTextEn: announcementTextEn.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: profile?.username || currentUser?.email || 'admin'
      };

      // 1. Guardar en el documento de administrador (autorizado con permisos en Firestore)
      try {
        await setDoc(doc(db, 'players', ADMIN_CONFIG_UID), { appConfig: configData }, { merge: true });
      } catch (adminDocErr) {
        console.warn('[AppConfig] Could not write to admin doc, trying app_config/global...', adminDocErr);
      }

      // 2. Guardar también en app_config/global
      try {
        await setDoc(doc(db, 'app_config', 'global'), configData, { merge: true });
      } catch (globalDocErr) {
        console.warn('[AppConfig] Could not write to app_config/global:', globalDocErr);
      }

      // 3. Actualizar memoria local inmediata
      setAiDailyLimit(limitNum);

      showAlert(
        lang === 'es' ? '¡Configuración Guardada!' : 'Settings Saved!',
        lang === 'es' 
          ? `La configuración se ha guardado correctamente. El nuevo límite de la IA es de ${limitNum} consultas diarias por usuario.`
          : `Settings have been saved successfully. New AI limit is ${limitNum} daily queries per user.`
      );
    } catch (err) {
      console.error('[AppConfig] Fatal save error:', err);
      showAlert(
        lang === 'es' ? 'Error al guardar' : 'Error saving settings',
        err.message || (lang === 'es' ? 'No se pudo guardar la configuración.' : 'Could not save configuration.')
      );
    } finally {
      setSaving(false);
      refreshKeyStats();
    }
  };

  const handleResetDefaults = () => {
    showConfirm(
      lang === 'es' ? 'Restablecer Valores' : 'Reset Defaults',
      lang === 'es' ? '¿Deseas restablecer el límite de la IA a 30 consultas por defecto?' : 'Reset AI limit back to default 30 queries?',
      () => {
        setAiDailyLimitInput(30);
        setAdminUnlimitedQueries(false);
        setAnnouncementEnabled(false);
        setAnnouncementTextEs('');
        setAnnouncementTextEn('');
      }
    );
  };

  const handleResetKeyCounters = () => {
    showConfirm(
      lang === 'es' ? 'Reiniciar Contadores' : 'Reset Counters',
      lang === 'es' ? '¿Deseas reiniciar los contadores de consultas de las API Keys a 0?' : 'Reset API key query counters to 0?',
      () => {
        const today = new Date().toISOString().slice(0, 10);
        keyStats.forEach((_, idx) => {
          try {
            localStorage.removeItem(`lobelia_key_stats_${idx}_${today}`);
            localStorage.removeItem(`lobelia_key_stats_${idx}_total`);
          } catch (_) {}
        });
        refreshKeyStats();
      }
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>⚙️</span>
        {lang === 'es' ? 'Cargando configuración de la app...' : 'Loading app configuration...'}
      </div>
    );
  }

  const estimatedActiveUsers = Math.floor((keyStats.length * 1500) / (aiDailyLimitInput || 30));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Cabecera del Panel */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(203, 161, 53, 0.12), rgba(0,0,0,0.3))', 
        border: '1px solid var(--gold-primary)', 
        borderRadius: '10px', 
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '2rem' }}>⚙️</span>
        <div>
          <h3 style={{ margin: 0, color: 'var(--gold-primary)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
            {lang === 'es' ? 'Panel de Configuración de la App (AppConfig)' : 'Global App Settings (AppConfig)'}
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {lang === 'es' 
              ? 'Parámetros globales que afectan a todos los usuarios de La Cuchara de Lobelia.' 
              : 'Global parameters affecting all users in La Cuchara de Lobelia.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* SECCIÓN 1: Lobelia IA & Cuotas */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.92rem' }}>
              {lang === 'es' ? 'Lobelia: Referí de Reglas con IA' : 'Lobelia: AI Rules Referee'}
            </span>
          </div>

          {/* Límite de consultas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
              {lang === 'es' ? 'Límite de consultas diarias por usuario:' : 'Daily query limit per user:'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number"
                min="1"
                max="500"
                value={aiDailyLimitInput}
                onChange={(e) => setAiDailyLimitInput(e.target.value)}
                style={{
                  width: '100px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gold-primary)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {lang === 'es' ? 'preguntas por día / usuario' : 'questions per day / user'}
              </span>
            </div>

            {/* Chips de selección rápida */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
                {lang === 'es' ? 'Valores rápidos:' : 'Quick values:'}
              </span>
              {[10, 20, 30, 40, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAiDailyLimitInput(val)}
                  style={{
                    background: parseInt(aiDailyLimitInput, 10) === val ? 'var(--gold-primary)' : 'rgba(255,255,255,0.06)',
                    color: parseInt(aiDailyLimitInput, 10) === val ? '#000' : 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: parseInt(aiDailyLimitInput, 10) === val ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Tarjeta informativa de capacidad */}
            <div style={{
              background: 'rgba(203, 161, 53, 0.08)',
              border: '1px solid rgba(203, 161, 53, 0.25)',
              borderRadius: '8px',
              padding: '10px 12px',
              marginTop: '8px',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              💡 <strong>{lang === 'es' ? 'Cálculo de Capacidad:' : 'Capacity Calculation:'}</strong>{' '}
              {lang === 'es' 
                ? `Con el pool actual de ${keyStats.length} claves (${keyStats.length * 1500} peticiones/día de cuota gratuita), un límite de ${aiDailyLimitInput} consultas permite atender a aproximadamente ~${estimatedActiveUsers} usuarios activos al día.`
                : `With the current pool of ${keyStats.length} keys (${keyStats.length * 1500} queries/day free tier), a limit of ${aiDailyLimitInput} queries supports approximately ~${estimatedActiveUsers} active users per day.`}
            </div>
          </div>

          {/* Toggle Administradores Ilimitados */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input 
              type="checkbox"
              id="adminUnlimited"
              checked={adminUnlimitedQueries}
              onChange={(e) => setAdminUnlimitedQueries(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold-primary)' }}
            />
            <label htmlFor="adminUnlimited" style={{ fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {lang === 'es' 
                ? '⚡ Permitir consultas ilimitadas para Administradores' 
                : '⚡ Enable unlimited queries for Administrators'}
            </label>
          </div>
        </div>

        {/* SECCIÓN 2: Pool de Claves API & Contador de Consultas por Key */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔑</span>
              <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.92rem' }}>
                {lang === 'es' ? 'Uso y Estado de Claves API (Google Gemini)' : 'API Key Usage & Status (Google Gemini)'}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshKeyStats}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔄 {lang === 'es' ? 'Actualizar' : 'Refresh'}
            </button>
          </div>

          {/* Tarjetas individuales por cada clave del pool */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {keyStats.map((k, idx) => {
              const usagePercent = Math.min(100, Math.round((k.todayQueries / k.dailyCapacity) * 100));
              const isQuotaExceeded = k.todayQueries >= k.dailyCapacity;

              return (
                <div 
                  key={idx}
                  style={{
                    background: k.isActive ? 'rgba(203, 161, 53, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: k.isActive ? '1px solid var(--gold-primary)' : 'var(--border-glass)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        background: k.isPrimary ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)', 
                        color: k.isPrimary ? '#000' : '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {k.isPrimary ? (lang === 'es' ? 'CLAVE #1 (Principal)' : 'KEY #1 (Primary)') : (lang === 'es' ? `CLAVE #${idx + 1} (Respaldo)` : `KEY #${idx + 1} (Backup)`)}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {k.maskedKey}
                      </span>
                    </div>

                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: isQuotaExceeded ? 'rgba(231, 76, 60, 0.2)' : (k.isActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.06)'),
                      color: isQuotaExceeded ? '#e74c3c' : (k.isActive ? '#2ecc71' : 'var(--text-muted)')
                    }}>
                      {isQuotaExceeded 
                        ? (lang === 'es' ? '⚠️ Cuota Agotada' : '⚠️ Quota Full')
                        : (k.isActive ? (lang === 'es' ? '🟢 Activa (En uso)' : '🟢 Active (In use)') : (lang === 'es' ? '⚪ En espera' : '⚪ Standby'))}
                    </span>
                  </div>

                  {/* Contador y barra de progreso */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {lang === 'es' ? 'Consultas hoy:' : 'Queries today:'} <strong>{k.todayQueries}</strong> / {k.dailyCapacity}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {lang === 'es' ? 'Histórico total:' : 'Total all-time:'} {k.totalQueries}
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '7px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.max(2, usagePercent)}%`,
                        height: '100%',
                        background: isQuotaExceeded ? '#e74c3c' : (usagePercent > 80 ? '#f39c12' : 'var(--gold-primary)'),
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ⚡ {lang === 'es' ? 'El sistema alterna automáticamente de clave si una alcanza el límite de 1.500 req/día.' : 'System automatically switches to backup key if primary hits 1,500 req/day.'}
            </span>
            <button
              type="button"
              onClick={handleResetKeyCounters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {lang === 'es' ? 'Reiniciar contadores' : 'Reset counters'}
            </button>
          </div>
        </div>

        {/* SECCIÓN 3: Anuncio Global (Opcional / Extensible) */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: 'var(--border-glass)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📢</span>
            <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.92rem' }}>
              {lang === 'es' ? 'Avisos & Comunicados Globales' : 'Global Announcements & Notices'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox"
              id="announcementEnabled"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold-primary)' }}
            />
            <label htmlFor="announcementEnabled" style={{ fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {lang === 'es' ? 'Mostrar banner de aviso a todos los usuarios' : 'Show announcement banner to all users'}
            </label>
          </div>

          {announcementEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {lang === 'es' ? 'Texto del aviso (Español):' : 'Notice text (Spanish):'}
                </label>
                <input 
                  type="text"
                  value={announcementTextEs}
                  onChange={(e) => setAnnouncementTextEs(e.target.value)}
                  placeholder={lang === 'es' ? 'Ej: ¡Próximo torneo oficial este fin de semana!' : 'E.g., Upcoming tournament this weekend!'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'var(--border-glass)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {lang === 'es' ? 'Texto del aviso (Inglés):' : 'Notice text (English):'}
                </label>
                <input 
                  type="text"
                  value={announcementTextEn}
                  onChange={(e) => setAnnouncementTextEn(e.target.value)}
                  placeholder="E.g., Next official tournament this weekend!"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'var(--border-glass)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleResetDefaults}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'var(--border-glass)' }}
          >
            🔄 {lang === 'es' ? 'Valores por Defecto' : 'Reset Defaults'}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ minWidth: '160px', fontWeight: 'bold' }}
          >
            {saving 
              ? (lang === 'es' ? 'Guardando...' : 'Saving...') 
              : (lang === 'es' ? '💾 Guardar Configuración' : '💾 Save Settings')}
          </button>
        </div>
      </form>
    </div>
  );
}
