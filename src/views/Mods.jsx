// src/views/Mods.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Vista de gestión de Mods de La Cuchara de Lobelia (Zero-GW IP Engine).
// Catálogo público, gestión por capas, documentación, validador en vivo,
// formulario de envío y panel de moderación para SuperAdmins.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  installMod,
  uninstallMod,
  getInstalledMods,
  getActiveLayers,
  setActiveLayer,
  setMasterActiveMod,
  validateModSchema,
  submitModForReview,
  getPendingSubmissions,
  approveModSubmission,
  rejectModSubmission,
  getPublicModsRegistry,
  PUBLIC_MOD_REGISTRY,
  MOD_LAYERS,
  SUPERADMIN_EMAILS
} from '../utils/modManager';

export default function Mods({ user, profile, lang = 'es' }) {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'layers' | 'docs' | 'submit' | 'admin'
  const [installedMods, setInstalledMods] = useState([]);
  const [activeLayers, setActiveLayersState] = useState(getActiveLayers());
  const [publicMods, setPublicMods] = useState(PUBLIC_MOD_REGISTRY);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null); // { type: 'success'|'error'|'info', message }
  
  // Validador en vivo en pestaña Docs
  const [validatorInput, setValidatorInput] = useState('');
  const [validationReport, setValidationReport] = useState(null);

  // Formulario de Envío
  const [submitJsonText, setSubmitJsonText] = useState('');
  const [submitContactEmail, setSubmitContactEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);

  // Panel de Moderación (SuperAdmin)
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const isSuperAdmin = user && (
    SUPERADMIN_EMAILS.includes(user.email) ||
    profile?.role === 'superadmin' ||
    profile?.role === 'admin'
  );

  // ── Cargar estado ───────────────────────────────────────────────────────────
  const reloadData = useCallback(async () => {
    setLoading(true);
    const uid = user?.uid || null;
    const installed = await getInstalledMods(uid);
    const layers = getActiveLayers(uid);
    const remotePublic = await getPublicModsRegistry();

    setInstalledMods(installed);
    setActiveLayersState(layers);

    if (remotePublic && remotePublic.length > 0) {
      const map = new Map();
      PUBLIC_MOD_REGISTRY.forEach(m => map.set(m.modId, m));
      remotePublic.forEach(m => map.set(m.modId, m));
      setPublicMods(Array.from(map.values()));
    } else {
      setPublicMods(PUBLIC_MOD_REGISTRY);
    }

    if (isSuperAdmin) {
      setLoadingAdmin(true);
      const pending = await getPendingSubmissions();
      setPendingSubmissions(pending);
      setLoadingAdmin(false);
    }

    setLoading(false);
  }, [user, isSuperAdmin]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // ── Acciones de Instalación / Desinstalación ────────────────────────────────
  const handleInstallModJson = async (modJson, sourceLabel = 'local') => {
    if (!user) {
      setActionStatus({
        type: 'error',
        message: lang === 'es' ? 'Debes iniciar sesión para instalar mods.' : 'You must sign in to install mods.'
      });
      return;
    }

    setActionStatus({
      type: 'info',
      message: lang === 'es' ? 'Instalando mod y verificando schema...' : 'Installing mod and validating schema...'
    });

    const result = await installMod(user.uid, modJson, sourceLabel);
    if (!result.success) {
      setActionStatus({ type: 'error', message: result.error });
    } else {
      setActionStatus({
        type: 'success',
        message: lang === 'es'
          ? `✅ "${result.mod.modName}" instalado y activado en tus capas.`
          : `✅ "${result.mod.modName}" installed and activated.`
      });
      await reloadData();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await handleInstallModJson(json, file.name);
      } catch (err) {
        setActionStatus({
          type: 'error',
          message: lang === 'es'
            ? `Error al leer el archivo JSON: ${err.message}`
            : `Failed to parse JSON file: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
  };

  const handleUninstall = async (modId, modName) => {
    if (!confirm(lang === 'es' ? `¿Desinstalar el mod "${modName}"?` : `Uninstall mod "${modName}"?`)) return;
    const res = await uninstallMod(user?.uid || null, modId);
    if (res.success) {
      setActionStatus({
        type: 'success',
        message: lang === 'es' ? `Mod "${modName}" desinstalado.` : `Mod "${modName}" uninstalled.`
      });
      await reloadData();
    }
  };

  const handleLayerChange = (layerKey, modId) => {
    const uid = user?.uid || null;
    setActiveLayer(uid, layerKey, modId === 'none' ? null : modId);
    setActiveLayersState(getActiveLayers(uid));
    setActionStatus({
      type: 'success',
      message: lang === 'es' ? 'Configuración de capas actualizada.' : 'Mod layer configuration updated.'
    });
  };

  // ── Validador en Vivo ───────────────────────────────────────────────────────
  const handleValidateInput = () => {
    if (!validatorInput.trim()) return;
    try {
      const parsed = JSON.parse(validatorInput);
      const report = validateModSchema(parsed);
      setValidationReport(report);
    } catch (err) {
      setValidationReport({
        valid: false,
        errors: [`Error de sintaxis JSON: ${err.message}`],
        stats: { factions: 0, models: 0, missions: 0, rulesPages: 0, capabilities: [] }
      });
    }
  };

  // ── Envío de Mod por Creador ────────────────────────────────────────────────
  const handleSubmitMod = async (e) => {
    e.preventDefault();
    if (!submitJsonText.trim()) return;
    setSubmitting(true);
    setActionStatus(null);

    try {
      const parsed = JSON.parse(submitJsonText);
      const res = await submitModForReview({
        modJson: parsed,
        contactEmail: submitContactEmail
      }, user);

      if (res.success) {
        setActionStatus({
          type: 'success',
          message: lang === 'es'
            ? '🚀 ¡Mod enviado con éxito! Se ha notificado a los SuperAdmins por correo para su revisión.'
            : '🚀 Mod submitted successfully! SuperAdmins have been alerted via email for review.'
        });
        setSubmitJsonText('');
        if (isSuperAdmin) reloadData();
      }
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Moderación SuperAdmin ───────────────────────────────────────────────────
  const handleApprove = async (sub) => {
    if (!confirm(`¿Aprobar y publicar el mod "${sub.modName}" para toda la comunidad?`)) return;
    try {
      await approveModSubmission(sub.id, sub.modJson, user);
      setActionStatus({
        type: 'success',
        message: `✅ Mod "${sub.modName}" aprobado y publicado en el Catálogo Público.`
      });
      await reloadData();
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message });
    }
  };

  const handleReject = async (submissionId, reason) => {
    try {
      await rejectModSubmission(submissionId, reason, user);
      setActionStatus({ type: 'info', message: 'Solicitud de mod rechazada con motivo.' });
      await reloadData();
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="mods-view-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px', color: '#f5f0e8' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#cba135', margin: '0 0 6px 0', fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>🧩</span> {lang === 'es' ? 'Gestor de Mods Comunitarios' : 'Community Mod Manager'}
        </h1>
        <p style={{ color: '#9e9a8d', fontSize: '0.84rem', margin: 0, maxWidth: '750px', marginInline: 'auto', lineHeight: '1.4' }}>
          {lang === 'es'
            ? 'La Cuchara de Lobelia es un motor 100% neutral sin datos propietarios. Instala o crea mods de la comunidad para habilitar el Creador de Listas, el Árbitro IA, Misiones y Duelos.'
            : 'La Cuchara de Lobelia is a neutral rules engine with 0% proprietary content. Install or build community mods to unlock Army Builder, AI Referee, Missions, and Duels.'}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('registry')}
          className={`tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
          style={{
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #cba135',
            background: activeTab === 'registry' ? '#cba135' : 'rgba(0,0,0,0.4)',
            color: activeTab === 'registry' ? '#111' : '#f5f0e8', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem'
          }}
        >
          📦 {lang === 'es' ? 'Catálogo de Mods' : 'Public Registry'}
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
          style={{
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #cba135',
            background: activeTab === 'layers' ? '#cba135' : 'rgba(0,0,0,0.4)',
            color: activeTab === 'layers' ? '#111' : '#f5f0e8', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem'
          }}
        >
          🎛️ {lang === 'es' ? 'Configuración por Capas' : 'Layer Manager'}
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          style={{
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #cba135',
            background: activeTab === 'docs' ? '#cba135' : 'rgba(0,0,0,0.4)',
            color: activeTab === 'docs' ? '#111' : '#f5f0e8', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem'
          }}
        >
          📖 {lang === 'es' ? 'Documentación & Validador' : 'Docs & Validator'}
        </button>

        <button
          onClick={() => setActiveTab('submit')}
          className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          style={{
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #cba135',
            background: activeTab === 'submit' ? '#cba135' : 'rgba(0,0,0,0.4)',
            color: activeTab === 'submit' ? '#111' : '#f5f0e8', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem'
          }}
        >
          📤 {lang === 'es' ? 'Envía tu Mod' : 'Submit a Mod'}
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            style={{
              padding: '7px 14px', borderRadius: '8px', border: '1px solid #e74c3c',
              background: activeTab === 'admin' ? '#e74c3c' : 'rgba(231,76,60,0.2)',
              color: '#f5f0e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem'
            }}
          >
            🛡️ {lang === 'es' ? 'Panel SuperAdmin' : 'SuperAdmin Panel'}
            {pendingSubmissions.length > 0 && (
              <span style={{ background: '#fff', color: '#e74c3c', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem' }}>
                {pendingSubmissions.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {actionStatus && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
          background: actionStatus.type === 'error' ? 'rgba(231,76,60,0.2)' : actionStatus.type === 'success' ? 'rgba(46,204,113,0.2)' : 'rgba(52,152,219,0.2)',
          border: `1px solid ${actionStatus.type === 'error' ? '#e74c3c' : actionStatus.type === 'success' ? '#2ecc71' : '#3498db'}`,
          color: '#f5f0e8', fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)} style={{ background: 'none', border: 'none', color: '#f5f0e8', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── TAB 1: CATÁLOGO DE MODS ────────────────────────────────────────── */}
      {activeTab === 'registry' && (
        <div>
          {/* Action Bar */}
          <div style={{
            background: 'rgba(20,28,20,0.8)', border: '1px solid rgba(203,161,53,0.3)', borderRadius: '10px',
            padding: '12px 14px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <strong style={{ color: '#cba135', fontSize: '0.9rem' }}>
                {lang === 'es' ? '📂 Cargar Mod Local (.JSON)' : '📂 Load Local Mod (.JSON)'}
              </strong>
              <div style={{ fontSize: '0.76rem', color: '#9e9a8d' }}>
                {lang === 'es' ? 'Selecciona un archivo mod desde tu ordenador o móvil.' : 'Select a mod file from your device.'}
              </div>
            </div>
            <label style={{
              background: '#cba135', color: '#111', padding: '7px 14px', borderRadius: '6px',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
            }}>
              {lang === 'es' ? '+ Seleccionar Archivo JSON' : '+ Select JSON File'}
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Mods Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {publicMods.map((mod) => {
              const isInstalled = installedMods.some(m => m.modId === mod.modId);
              return (
                <div
                  key={mod.modId}
                  style={{
                    background: 'rgba(20,28,20,0.85)',
                    border: isInstalled ? '1px solid #2ecc71' : '1px solid rgba(203,161,53,0.3)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h3 style={{ color: '#cba135', margin: 0, fontSize: '0.98rem', lineHeight: '1.3' }}>
                        {mod.modName}
                      </h3>
                      {isInstalled && (
                        <span style={{ background: '#2ecc71', color: '#111', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 5px', borderRadius: '4px' }}>
                          {lang === 'es' ? 'INSTALADO' : 'INSTALLED'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#888', marginBottom: '6px' }}>
                      {lang === 'es' ? 'Autor:' : 'Author:'} <strong style={{ color: '#bbb' }}>{mod.modAuthor}</strong> • v{mod.version || mod.modVersion || '1.0.0'}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#ddd', margin: '0 0 10px 0', lineHeight: '1.35' }}>
                      {mod.description || mod.modDescription}
                    </p>

                    {/* Badges de Capacidades */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                      {(mod.capabilities || ['army_builder', 'missions', 'rules_ai', 'duels']).map((cap) => (
                        <span
                          key={cap}
                          style={{
                            background: 'rgba(203,161,53,0.15)',
                            border: '1px solid rgba(203,161,53,0.4)',
                            color: '#cba135',
                            fontSize: '0.66rem',
                            padding: '2px 5px',
                            borderRadius: '4px'
                          }}
                        >
                          {cap === 'army_builder' ? '🗡️ Listas' : cap === 'missions' ? '🗺️ Misiones' : cap === 'rules_ai' ? '🧙‍♂️ IA' : '⚔️ Duelos'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {isInstalled ? (
                      <button
                        onClick={() => handleUninstall(mod.modId, mod.modName)}
                        style={{
                          flex: 1, padding: '6px', background: 'rgba(231,76,60,0.2)', border: '1px solid #e74c3c',
                          color: '#e74c3c', borderRadius: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 'bold'
                        }}
                      >
                        🗑️ {lang === 'es' ? 'Desinstalar' : 'Uninstall'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (mod.modJson) {
                            handleInstallModJson(mod.modJson, mod.modName);
                          } else {
                            setActionStatus({
                              type: 'info',
                              message: lang === 'es'
                                ? 'Para instalar este mod, cárgalo usando el botón "+ Seleccionar Archivo JSON" superior.'
                                : 'To install this mod, upload it using the "+ Select JSON File" button above.'
                            });
                          }
                        }}
                        style={{
                          flex: 1, padding: '6px', background: '#cba135', border: 'none',
                          color: '#111', borderRadius: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 'bold'
                        }}
                      >
                        ⚡ {lang === 'es' ? 'Instalar Mod' : 'Install Mod'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: CONFIGURACIÓN POR CAPAS ─────────────────────────────────── */}
      {activeTab === 'layers' && (
        <div style={{ background: 'rgba(20,28,20,0.85)', border: '1px solid rgba(203,161,53,0.3)', borderRadius: '10px', padding: '16px' }}>
          <h2 style={{ color: '#cba135', margin: '0 0 6px 0', fontSize: '1.1rem' }}>
            🎛️ {lang === 'es' ? 'Asignación de Mods por Capas' : 'Modular Layer Configuration'}
          </h2>
          <p style={{ color: '#9e9a8d', fontSize: '0.8rem', margin: '0 0 16px 0' }}>
            {lang === 'es'
              ? 'Puedes tener varios mods instalados y elegir qué mod controla cada sección de Lobelia independientemente.'
              : 'You can have multiple mods installed and independently assign which mod powers each section of Lobelia.'}
          </p>

          {installedMods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📦</div>
              <div style={{ fontSize: '0.86rem' }}>{lang === 'es' ? 'No tienes ningún mod instalado actualmente.' : 'No mods installed currently.'}</div>
              <button
                onClick={() => setActiveTab('registry')}
                style={{ marginTop: '10px', background: '#cba135', border: 'none', color: '#111', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                {lang === 'es' ? 'Ir al Catálogo de Mods' : 'Go to Mod Registry'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Capa 1: Creador de Listas */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#cba135', marginBottom: '2px', fontSize: '0.88rem' }}>
                  🗡️ {lang === 'es' ? 'Creador de Listas (Army Builder)' : 'Army Builder Data'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#888', marginBottom: '6px' }}>
                  {lang === 'es' ? 'Proporciona facciones, atributos, opciones y reglas de miniaturas.' : 'Provides factions, attributes, options, and model profiles.'}
                </div>
                <select
                  value={activeLayers[MOD_LAYERS.ARMY_BUILDER] || 'none'}
                  onChange={(e) => handleLayerChange(MOD_LAYERS.ARMY_BUILDER, e.target.value)}
                  style={{ width: '100%', padding: '7px', background: '#111', color: '#fff', border: '1px solid #cba135', borderRadius: '6px', fontSize: '0.8rem' }}
                >
                  <option value="none">{lang === 'es' ? '-- Desactivado (Sin mod) --' : '-- Disabled (No mod) --'}</option>
                  {installedMods.map(m => (
                    <option key={m.modId} value={m.modId}>{m.modName} ({m.modAuthor})</option>
                  ))}
                </select>
              </div>

              {/* Capa 2: Misiones */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#cba135', marginBottom: '2px', fontSize: '0.88rem' }}>
                  🗺️ {lang === 'es' ? 'Visor de Misiones y PDFs' : 'Missions & Map PDFs'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#888', marginBottom: '6px' }}>
                  {lang === 'es' ? 'Proporciona los enlaces de visualización a los PDFs y mapas oficiales.' : 'Provides links to official mission PDFs and deployment maps.'}
                </div>
                <select
                  value={activeLayers[MOD_LAYERS.MISSIONS] || 'none'}
                  onChange={(e) => handleLayerChange(MOD_LAYERS.MISSIONS, e.target.value)}
                  style={{ width: '100%', padding: '7px', background: '#111', color: '#fff', border: '1px solid #cba135', borderRadius: '6px', fontSize: '0.8rem' }}
                >
                  <option value="none">{lang === 'es' ? '-- Desactivado (Sin mod) --' : '-- Disabled (No mod) --'}</option>
                  {installedMods.map(m => (
                    <option key={m.modId} value={m.modId}>{m.modName} ({m.modAuthor})</option>
                  ))}
                </select>
              </div>

              {/* Capa 3: Árbitro IA */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#cba135', marginBottom: '2px', fontSize: '0.88rem' }}>
                  🧙‍♂️ {lang === 'es' ? 'Conocimiento del Árbitro IA' : 'AI Rules Referee Knowledge'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#888', marginBottom: '6px' }}>
                  {lang === 'es' ? 'Proporciona el índice de páginas de libros y FAQs para citas exactas.' : 'Provides indexed book pages and FAQs for exact rule citations.'}
                </div>
                <select
                  value={activeLayers[MOD_LAYERS.RULES_AI] || 'none'}
                  onChange={(e) => handleLayerChange(MOD_LAYERS.RULES_AI, e.target.value)}
                  style={{ width: '100%', padding: '7px', background: '#111', color: '#fff', border: '1px solid #cba135', borderRadius: '6px', fontSize: '0.8rem' }}
                >
                  <option value="none">{lang === 'es' ? '-- Desactivado (Sin mod) --' : '-- Disabled (No mod) --'}</option>
                  {installedMods.map(m => (
                    <option key={m.modId} value={m.modId}>{m.modName} ({m.modAuthor})</option>
                  ))}
                </select>
              </div>

              {/* Capa 4: Duelos */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#cba135', marginBottom: '2px', fontSize: '0.88rem' }}>
                  ⚔️ {lang === 'es' ? 'Reglas de Duelos & Live Tracker' : 'Duels & Live Game Tracker'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#888', marginBottom: '6px' }}>
                  {lang === 'es' ? 'Reglas de puntuación y cálculo de desmoronamiento en partidas.' : 'Scoring rules, victory points, and break point tracking.'}
                </div>
                <select
                  value={activeLayers[MOD_LAYERS.DUELS] || 'none'}
                  onChange={(e) => handleLayerChange(MOD_LAYERS.DUELS, e.target.value)}
                  style={{ width: '100%', padding: '7px', background: '#111', color: '#fff', border: '1px solid #cba135', borderRadius: '6px', fontSize: '0.8rem' }}
                >
                  <option value="none">{lang === 'es' ? '-- Desactivado (Sin mod) --' : '-- Disabled (No mod) --'}</option>
                  {installedMods.map(m => (
                    <option key={m.modId} value={m.modId}>{m.modName} ({m.modAuthor})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: DOCUMENTACIÓN & VALIDADOR EN VIVO ──────────────────────── */}
      {activeTab === 'docs' && (
        <div style={{ background: 'rgba(20,28,20,0.85)', border: '1px solid rgba(203,161,53,0.3)', borderRadius: '10px', padding: '16px' }}>
          <h2 style={{ color: '#cba135', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
            📖 {lang === 'es' ? 'Documentación Técnica de Mods (Schema v1.0)' : 'Mod Technical Documentation (Schema v1.0)'}
          </h2>
          <p style={{ color: '#9e9a8d', fontSize: '0.82rem', lineHeight: '1.4', margin: '0 0 14px 0' }}>
            {lang === 'es'
              ? 'Un Mod de Lobelia es un archivo .JSON estructurado que define datos de juego. Los mods pueden ser integrales (contener todo) o modulares (específicos de misiones, listas o IA).'
              : 'A Lobelia Mod is a structured .JSON file defining game data. Mods can be comprehensive (all-in-one) or modular (missions-only, army-only, etc.).'}
          </p>

          {/* Validador Interactivo en Vivo */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #cba135', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <h3 style={{ color: '#cba135', margin: '0 0 6px 0', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔍 {lang === 'es' ? 'Validador de JSON en Vivo (Sandbox)' : 'Live JSON Sandbox Validator'}
            </h3>
            <p style={{ color: '#888', fontSize: '0.74rem', margin: '0 0 8px 0' }}>
              {lang === 'es' ? 'Pega el código JSON de tu mod para verificar si cumple la especificación:' : 'Paste your mod JSON code to verify compliance:'}
            </p>
            <textarea
              rows={5}
              value={validatorInput}
              onChange={(e) => setValidatorInput(e.target.value)}
              placeholder='{ "modId": "mi-mod", "modName": "Mi Mod", "schemaVersion": "1.0", ... }'
              style={{
                width: '100%', padding: '8px', background: '#0a0e0a', color: '#2ecc71',
                fontFamily: 'monospace', fontSize: '0.76rem', border: '1px solid rgba(203,161,53,0.3)', borderRadius: '6px', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={handleValidateInput}
                style={{ background: '#cba135', color: '#111', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ⚡ {lang === 'es' ? 'Comprobar Validez' : 'Validate Schema'}
              </button>
            </div>

            {/* Resultado de Validación */}
            {validationReport && (
              <div style={{
                marginTop: '10px', padding: '10px', borderRadius: '6px',
                background: validationReport.valid ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                border: `1px solid ${validationReport.valid ? '#2ecc71' : '#e74c3c'}`
              }}>
                <div style={{ fontWeight: 'bold', color: validationReport.valid ? '#2ecc71' : '#e74c3c', marginBottom: '4px', fontSize: '0.84rem' }}>
                  {validationReport.valid ? '✅ Mod Válido y Compatible' : '❌ Se han detectado errores de estructura:'}
                </div>
                {validationReport.valid ? (
                  <div style={{ fontSize: '0.76rem', color: '#ddd' }}>
                    • Facciones: <strong>{validationReport.stats.factions}</strong> | Perfiles: <strong>{validationReport.stats.models}</strong><br />
                    • Misiones con PDF: <strong>{validationReport.stats.missions}</strong> | Páginas IA: <strong>{validationReport.stats.rulesPages}</strong>
                  </div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.76rem', color: '#ff9999' }}>
                    {validationReport.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Especificación de Campos */}
          <h3 style={{ color: '#cba135', fontSize: '0.92rem', marginBottom: '6px' }}>
            📋 {lang === 'es' ? 'Campos Obligatorios de la Cabecera' : 'Mandatory Header Fields'}
          </h3>
          <div style={{ fontSize: '0.78rem', color: '#bbb', lineHeight: '1.5', marginBottom: '14px' }}>
            • <code>modId</code>: Identificador único en minúsculas (ej: <code>"mod-integral-tolkienstein"</code>).<br />
            • <code>modName</code>: Nombre visible para la comunidad.<br />
            • <code>modVersion</code>: Versión semántica (ej: <code>"1.0.0"</code>).<br />
            • <code>modAuthor</code>: Nombre o apodo del autor.<br />
            • <code>gameSystem</code>: Debe ser <code>"MESBG"</code>.<br />
            • <code>schemaVersion</code>: Debe ser <code>"1.0"</code>.<br />
            • <code>capabilities</code>: Array opcional con <code>["army_builder", "missions", "rules_ai", "duels"]</code>.
          </div>

          {/* FAQ */}
          <h3 style={{ color: '#cba135', fontSize: '0.92rem', marginBottom: '6px' }}>
            ❓ {lang === 'es' ? 'Preguntas Frecuentes (FAQ) para Creadores' : 'Mod Creators FAQ'}
          </h3>
          <div style={{ fontSize: '0.78rem', color: '#9e9a8d', lineHeight: '1.4' }}>
            <p><strong>¿Puedo crear un mod que solo contenga misiones de torneo?</strong><br />
            Sí, solo debes incluir el bloque <code>missionPdfs</code> y declarar <code>"capabilities": ["missions"]</code>.</p>

            <p><strong>¿Cómo se aprueban los mods en el catálogo público?</strong><br />
            Una vez validado tu JSON, envíalo en la pestaña "Envía tu Mod". Un SuperAdmin revisará que cumpla el schema y no contenga código malicioso antes de publicarlo en el buscador.</p>
          </div>
        </div>
      )}

      {/* ── TAB 4: ENVÍA TU MOD ────────────────────────────────────────────── */}
      {activeTab === 'submit' && (
        <div style={{ background: 'rgba(20,28,20,0.85)', border: '1px solid rgba(203,161,53,0.3)', borderRadius: '10px', padding: '16px' }}>
          <h2 style={{ color: '#cba135', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
            📤 {lang === 'es' ? 'Enviar Mod a Revisión y Moderación' : 'Submit Mod for Community Review'}
          </h2>
          <p style={{ color: '#9e9a8d', fontSize: '0.8rem', margin: '0 0 14px 0' }}>
            {lang === 'es'
              ? 'Sube o pega tu archivo de mod para que sea revisado por los SuperAdmins. Si es aprobado, aparecerá en el Catálogo Público para todos los jugadores.'
              : 'Submit your mod file for review by SuperAdmins. Once approved, it will be published to the public catalog for all players.'}
          </p>

          <form onSubmit={handleSubmitMod} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cba135', marginBottom: '3px' }}>
                {lang === 'es' ? 'Correo de contacto del creador:' : 'Creator contact email:'}
              </label>
              <input
                type="email"
                required
                value={submitContactEmail}
                onChange={(e) => setSubmitContactEmail(e.target.value)}
                placeholder="tu-email@ejemplo.com"
                style={{ width: '100%', padding: '7px 10px', background: '#0a0e0a', color: '#fff', border: '1px solid rgba(203,161,53,0.3)', borderRadius: '6px', boxSizing: 'border-box', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.78rem', color: '#cba135' }}>
                  {lang === 'es' ? 'Contenido JSON del Mod:' : 'Mod JSON Content:'}
                </label>
                <label style={{ fontSize: '0.74rem', color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}>
                  {lang === 'es' ? 'Cargar archivo desde PC' : 'Upload file from PC'}
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setSubmitJsonText(ev.target.result);
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
              <textarea
                rows={8}
                required
                value={submitJsonText}
                onChange={(e) => setSubmitJsonText(e.target.value)}
                placeholder='Pega aquí el código JSON completo de tu mod...'
                style={{ width: '100%', padding: '8px', background: '#0a0e0a', color: '#2ecc71', fontFamily: 'monospace', fontSize: '0.76rem', border: '1px solid rgba(203,161,53,0.3)', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#cba135', color: '#111', border: 'none', padding: '8px 20px',
                  borderRadius: '6px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.84rem'
                }}
              >
                {submitting ? (lang === 'es' ? 'Enviando y notificando...' : 'Submitting & notifying...') : (lang === 'es' ? '🚀 Enviar a Moderación' : '🚀 Submit for Review')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 5: PANEL SUPERADMIN ────────────────────────────────────────── */}
      {activeTab === 'admin' && isSuperAdmin && (
        <div style={{ background: 'rgba(20,28,20,0.85)', border: '1px solid #e74c3c', borderRadius: '10px', padding: '16px' }}>
          <h2 style={{ color: '#e74c3c', margin: '0 0 6px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🛡️ {lang === 'es' ? 'Panel de Moderación de Mods (SuperAdmin)' : 'SuperAdmin Mod Moderation'}
          </h2>
          <p style={{ color: '#9e9a8d', fontSize: '0.8rem', margin: '0 0 14px 0' }}>
            {lang === 'es'
              ? 'Revisa, audita y aprueba los mods enviados por la comunidad antes de que se hagan públicos.'
              : 'Review, audit, and approve community submitted mods before publishing.'}
          </p>

          {loadingAdmin ? (
            <div style={{ textAlign: 'center', padding: '16px', color: '#888', fontSize: '0.84rem' }}>
              {lang === 'es' ? 'Cargando solicitudes...' : 'Loading submissions...'}
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#888', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>✨</div>
              <div style={{ fontSize: '0.84rem' }}>{lang === 'es' ? 'No hay solicitudes de mods pendientes de revisión.' : 'No pending mod submissions.'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '8px', padding: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div>
                      <h3 style={{ color: '#cba135', margin: 0, fontSize: '1rem' }}>{sub.modName} (v{sub.modVersion})</h3>
                      <div style={{ fontSize: '0.74rem', color: '#888' }}>
                        Autor: <strong>{sub.modAuthor}</strong> • Contacto: <span style={{ color: '#3498db' }}>{sub.contactEmail}</span>
                      </div>
                    </div>
                    <span style={{ background: '#f39c12', color: '#111', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                      PENDIENTE
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '6px 0' }}>{sub.description}</p>

                  <div style={{ fontSize: '0.74rem', color: '#aaa', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px', marginBottom: '10px' }}>
                    Estadísticas: <strong>{sub.stats?.factions || 0}</strong> facciones | <strong>{sub.stats?.models || 0}</strong> perfiles | <strong>{sub.stats?.missions || 0}</strong> misiones | <strong>{sub.stats?.rulesPages || 0}</strong> páginas IA
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleApprove(sub)}
                      style={{ background: '#2ecc71', color: '#111', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.78rem' }}
                    >
                      ✅ {lang === 'es' ? 'Aprobar y Publicar' : 'Approve & Publish'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt(lang === 'es' ? 'Motivo del rechazo:' : 'Rejection reason:');
                        if (reason) handleReject(sub.id, reason);
                      }}
                      style={{ background: 'rgba(231,76,60,0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.78rem' }}
                    >
                      ❌ {lang === 'es' ? 'Rechazar' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INFO LEGAL ── */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.5', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: 'var(--border-glass)', marginTop: '20px' }}>
        <strong>{lang === 'es' ? 'Aviso Legal:' : 'Legal Notice:'}</strong> {lang === 'es'
          ? 'La Cuchara de Lobelia es un motor neutral que no distribuye ni almacena datos con derechos de autor de terceros. Los mods son creados, mantenidos y publicados de forma independiente por autores de la comunidad. Al instalar un mod en tu navegador, lo haces bajo tu propia responsabilidad.'
          : 'La Cuchara de Lobelia is a neutral engine that does not distribute or store third-party copyrighted content. Mods are independently created and published by community authors. Installing a mod in your browser is done at your own discretion.'}
      </div>

    </div>
  );
}
