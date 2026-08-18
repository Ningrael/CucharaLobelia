// src/views/Mods.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ModStore & Workshop de La Cuchara de Lobelia (Zero-GW IP Engine).
// Instalación 1-Clic, gestión por capas, documentación para creadores,
// validador en vivo y panel de moderación SuperAdmin.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  installMod,
  installModFromUrl,
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
  const [downloadingModId, setDownloadingModId] = useState(null);

  // Validador en vivo en pestaña Docs
  const [validatorInput, setValidatorInput] = useState('');
  const [validationReport, setValidationReport] = useState(null);

  // Formulario de Envío
  const [submitModName, setSubmitModName] = useState('');
  const [submitAuthor, setSubmitAuthor] = useState('');
  const [submitDownloadUrl, setSubmitDownloadUrl] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitCapabilities, setSubmitCapabilities] = useState(['missions', 'rules_ai']);
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
  const handleInstall1Click = async (mod) => {
    setDownloadingModId(mod.modId);
    setActionStatus({
      type: 'info',
      message: lang === 'es'
        ? `Descargando e instalando "${mod.modName}" en el almacenamiento local...`
        : `Downloading and installing "${mod.modName}" into local storage...`
    });

    const result = await installModFromUrl(user?.uid || null, mod.downloadUrl);
    setDownloadingModId(null);

    if (!result.success) {
      setActionStatus({ type: 'error', message: result.error });
    } else {
      setActionStatus({
        type: 'success',
        message: lang === 'es'
          ? `✅ "${result.mod.modName}" instalado correctamente y listo para usar offline.`
          : `✅ "${result.mod.modName}" installed successfully and ready offline.`
      });
      await reloadData();
    }
  };

  const handleInstallModJson = async (modJson, sourceLabel = 'local') => {
    setActionStatus({
      type: 'info',
      message: lang === 'es' ? 'Instalando mod y verificando schema...' : 'Installing mod and validating schema...'
    });

    const result = await installMod(user?.uid || null, modJson, sourceLabel);
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
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        handleInstallModJson(json, file.name);
      } catch (err) {
        setActionStatus({
          type: 'error',
          message: lang === 'es' ? 'El archivo seleccionado no es un JSON válido.' : 'Invalid JSON file selected.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUninstall = async (modId) => {
    if (!confirm(lang === 'es' ? '¿Desinstalar este mod de tu dispositivo?' : 'Uninstall this mod from your device?')) return;
    const res = await uninstallMod(user?.uid || null, modId);
    if (res.success) {
      setActionStatus({
        type: 'info',
        message: lang === 'es' ? 'Mod desinstalado.' : 'Mod uninstalled.'
      });
      await reloadData();
    }
  };

  // ── Cambiar Capa Activa ─────────────────────────────────────────────────────
  const handleLayerChange = (layer, modId) => {
    const targetModId = modId === 'none' ? null : modId;
    setActiveLayer(user?.uid || null, layer, targetModId);
    setActiveLayersState(getActiveLayers(user?.uid || null));
    setActionStatus({
      type: 'success',
      message: lang === 'es' ? 'Capa actualizada.' : 'Layer updated.'
    });
  };

  // ── Validador en vivo ───────────────────────────────────────────────────────
  const runLiveValidation = () => {
    if (!validatorInput.trim()) {
      setValidationReport(null);
      return;
    }
    try {
      const parsed = JSON.parse(validatorInput);
      const res = validateModSchema(parsed);
      setValidationReport({
        valid: res.valid,
        errors: res.errors,
        stats: res.stats
      });
    } catch (err) {
      setValidationReport({
        valid: false,
        errors: [`Error de sintaxis JSON: ${err.message}`],
        stats: null
      });
    }
  };

  // ── Envío de Mod ────────────────────────────────────────────────────────────
  const handleSubmitMod = async (e) => {
    e.preventDefault();
    if (!submitModName || !submitAuthor || !submitDownloadUrl) {
      alert(lang === 'es' ? 'Por favor completa los campos obligatorios.' : 'Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const submission = {
        modName: submitModName,
        modAuthor: submitAuthor,
        downloadUrl: submitDownloadUrl,
        description: submitDescription,
        capabilities: submitCapabilities,
        contactEmail: submitContactEmail,
        submittedBy: user?.uid || 'anonymous',
        submittedAt: new Date().toISOString()
      };

      const res = await submitModForReview(submission, user);
      if (res.success) {
        alert(lang === 'es' ? '¡Mod enviado a revisión correctamente! Los administradores lo evaluarán.' : 'Mod submitted for review! Admins will inspect it.');
        setSubmitModName('');
        setSubmitDownloadUrl('');
        setSubmitDescription('');
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    setSubmitting(false);
  };

  // ── Acciones SuperAdmin ─────────────────────────────────────────────────────
  const handleApprove = async (sub) => {
    if (!confirm(`¿Aprobar y publicar el mod "${sub.modName}"?`)) return;
    const res = await approveModSubmission(sub, user);
    if (res.success) {
      alert('Mod aprobado y publicado en el catálogo público.');
      await reloadData();
    }
  };

  const handleReject = async (subId, reason) => {
    const res = await rejectModSubmission(subId, reason, user);
    if (res.success) {
      alert('Solicitud rechazada.');
      await reloadData();
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '850px', margin: '0 auto', paddingBottom: '90px' }}>
      
      {/* ── CABECERA ── */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--gold-primary)', margin: '0 0 6px 0', fontSize: '1.6rem', letterSpacing: '0.04em' }}>
          🧩 {lang === 'es' ? 'MODSTORE & WORKSHOP' : 'COMMUNITY MODSTORE'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: '580px', margin: '0 auto' }}>
          {lang === 'es'
            ? 'La Cuchara de Lobelia es un motor 100% neutral sin datos propietarios. Instala mods comunitarios con 1 clic para desbloquear Misiones, Árbitro IA y Listas.'
            : 'La Cuchara de Lobelia is a neutral rules engine with 0% proprietary content. Install community mods in 1-click to unlock Missions, AI Referee, and Army Lists.'}
        </p>
      </div>

      {/* ── NOTIFICACIONES DE ACCIÓN ── */}
      {actionStatus && (
        <div
          style={{
            background: actionStatus.type === 'success' ? 'rgba(46, 204, 113, 0.15)' : actionStatus.type === 'error' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(52, 152, 219, 0.15)',
            border: `1px solid ${actionStatus.type === 'success' ? '#2ecc71' : actionStatus.type === 'error' ? '#e74c3c' : '#3498db'}`,
            color: '#fff',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{actionStatus.message}</span>
          <button
            onClick={() => setActionStatus(null)}
            style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── PESTAÑAS DE NAVEGACIÓN ── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        {[
          { id: 'registry', icon: '🛍️', label: lang === 'es' ? 'Workshop (1-Clic)' : 'Workshop' },
          { id: 'layers', icon: '🎛️', label: lang === 'es' ? 'Configuración por Capas' : 'Layer Manager' },
          { id: 'docs', icon: '📖', label: lang === 'es' ? 'Guía Creadores & Validador' : 'Docs & Validator' },
          { id: 'submit', icon: '📤', label: lang === 'es' ? 'Envía tu Mod' : 'Submit Mod' },
          ...(isSuperAdmin ? [{ id: 'admin', icon: '🛡️', label: lang === 'es' ? 'Panel SuperAdmin' : 'SuperAdmin Panel' }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? '#111' : 'var(--text-secondary)',
              border: activeTab === tab.id ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: WORKSHOP & MODSTORE (1-CLIC)                                    */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'registry' && (
        <div>
          {/* Tarjeta de Importar Archivo Local */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(203, 161, 53, 0.08) 0%, rgba(0,0,0,0.3) 100%)',
              border: '1px dashed rgba(203, 161, 53, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.92rem', marginBottom: '2px' }}>
                📁 {lang === 'es' ? 'Cargar Mod Local (.JSON o .lobeliamod)' : 'Load Local Mod (.JSON or .lobeliamod)'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'es'
                  ? 'Importa un archivo de mod descargado en tu dispositivo para guardarlo en tu IndexedDB local.'
                  : 'Import a mod file saved on your device to store it directly in your local IndexedDB.'}
              </div>
            </div>
            <label
              style={{
                background: 'var(--gold-primary)',
                color: '#111',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>+</span> {lang === 'es' ? 'Seleccionar Archivo' : 'Select File'}
              <input type="file" accept=".json,.lobeliamod,.zip" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Listado de Mods de la Workshop */}
          <h3 style={{ color: 'var(--gold-primary)', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⭐</span> {lang === 'es' ? 'Mods Destacados de la Comunidad (1-Clic)' : 'Featured Community Mods (1-Click)'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
            {publicMods.map((mod) => {
              const isInstalled = installedMods.some((m) => m.modId === mod.modId);
              const isDownloading = downloadingModId === mod.modId;

              return (
                <div
                  key={mod.modId}
                  style={{
                    background: 'var(--card-bg)',
                    border: isInstalled ? '1px solid rgba(46, 204, 113, 0.6)' : 'var(--border-glass)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                      <h4 style={{ margin: 0, color: 'var(--gold-primary)', fontSize: '0.98rem', fontFamily: 'var(--font-title)' }}>
                        {mod.modName}
                      </h4>
                      {isInstalled ? (
                        <span style={{ background: '#2ecc71', color: '#111', fontSize: '0.66rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                          ✓ {lang === 'es' ? 'INSTALADO' : 'INSTALLED'}
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(203, 161, 53, 0.15)', color: 'var(--gold-primary)', border: '1px solid rgba(203, 161, 53, 0.4)', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                          v{mod.version || '1.0.0'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {lang === 'es' ? 'Autor:' : 'Author:'} <strong style={{ color: '#fff' }}>{mod.modAuthor}</strong>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: '0 0 12px 0' }}>
                      {mod.modDescription || mod.description}
                    </p>

                    {/* Capacidades / Badges */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {(mod.capabilities || []).map((cap) => (
                        <span
                          key={cap}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.66rem',
                            color: '#e2e8f0'
                          }}
                        >
                          {cap === 'missions' && '🗺️ Misiones (PDFs)'}
                          {cap === 'rules_ai' && '🧙‍♂️ Árbitro IA'}
                          {cap === 'army_builder' && '⚔️ Listas'}
                          {cap === 'duels' && '🎲 Duelos'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {isInstalled ? (
                      <button
                        onClick={() => handleUninstall(mod.modId)}
                        style={{
                          background: 'rgba(231, 76, 60, 0.1)',
                          border: '1px solid rgba(231, 76, 60, 0.3)',
                          color: '#ff8888',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.74rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ {lang === 'es' ? 'Desinstalar' : 'Uninstall'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInstall1Click(mod)}
                        disabled={isDownloading}
                        style={{
                          background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '7px 16px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)'
                        }}
                      >
                        <span>{isDownloading ? '⏳' : '⬇️'}</span>
                        <span>{isDownloading ? (lang === 'es' ? 'Instalando...' : 'Installing...') : (lang === 'es' ? 'Instalar con 1 Clic' : 'Install in 1-Click')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: CONFIGURACIÓN POR CAPAS                                        */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'layers' && (
        <div style={{ background: 'var(--card-bg)', border: 'var(--border-glass)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', margin: '0 0 4px 0' }}>
            🎛️ {lang === 'es' ? 'Asignación de Mods por Capas' : 'Layer Assignment'}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            {lang === 'es'
              ? 'Puedes tener varios mods instalados en tu navegador y elegir cuál controla cada sección de la aplicación.'
              : 'You can have multiple mods installed locally and assign which mod controls each section independently.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                id: MOD_LAYERS.MISSIONS,
                title: lang === 'es' ? '🗺️ Visor de Misiones y PDFs' : '🗺️ Missions Viewer & PDFs',
                desc: lang === 'es' ? 'Proporciona los PDFs y mapas oficiales para escenarios 1v1 y 2v2.' : 'Supplies the official scenario PDFs and maps for 1v1 and 2v2.'
              },
              {
                id: MOD_LAYERS.RULES_AI,
                title: lang === 'es' ? '🧙‍♂️ Conocimiento del Árbitro IA' : '🧙‍♂️ AI Referee Knowledge Base',
                desc: lang === 'es' ? 'Proporciona el índice de páginas de libros y FAQs para resolver dudas con citas.' : 'Supplies indexed rulebook pages and FAQs for exact citations.'
              },
              {
                id: MOD_LAYERS.ARMY_BUILDER,
                title: lang === 'es' ? '⚔️ Creador de Listas (Army Builder)' : '⚔️ Army Builder',
                desc: lang === 'es' ? 'Proporciona facciones, atributos, opciones y reglas de miniaturas.' : 'Supplies factions, profiles, wargear options and miniature stats.'
              },
              {
                id: MOD_LAYERS.DUELS,
                title: lang === 'es' ? '🎲 Reglas de Duelos & Live Tracker' : '🎲 Duels Rules & Live Tracker',
                desc: lang === 'es' ? 'Reglas de puntuación y cálculo de desmoronamiento en partidas.' : 'Scoring rules and breakpoint calculations in live matches.'
              }
            ].map((layer) => (
              <div
                key={layer.id}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: '2px' }}>
                  {layer.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {layer.desc}
                </div>

                <select
                  value={activeLayers[layer.id] || 'none'}
                  onChange={(e) => handleLayerChange(layer.id, e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(203, 161, 53, 0.4)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                >
                  <option value="none" style={{ background: '#1a1a1a', color: '#888' }}>
                    {lang === 'es' ? '❌ Ninguno (Función desactivada)' : '❌ None (Feature disabled)'}
                  </option>
                  {installedMods.map((m) => (
                    <option key={m.modId} value={m.modId} style={{ background: '#1a1a1a', color: '#fff' }}>
                      {m.modName} ({m.modAuthor})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 3: DOCUMENTACIÓN & VALIDADOR (CREADORES)                           */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'docs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Guía en 3 Pasos */}
          <div style={{ background: 'var(--card-bg)', border: 'var(--border-glass)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: '0 0 10px 0' }}>
              📚 {lang === 'es' ? 'Cómo Crear y Publicar un Mod en 3 Pasos' : 'How to Create & Publish a Mod in 3 Steps'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', color: '#ccc', lineHeight: '1.5' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--gold-primary)' }}>
                <strong style={{ color: '#fff' }}>Paso 1: Construye tu archivo JSON o Paquete</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#aaa' }}>
                  Define las cabeceras obligatorias (<code>modId</code>, <code>modName</code>, <code>modAuthor</code>, <code>gameSystem</code>, <code>schemaVersion: "1.0"</code>) y agrega tus bloques de misiones (<code>missionPdfs</code>), reglas IA (<code>rulesKnowledge</code>) o facciones.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #3498db' }}>
                <strong style={{ color: '#fff' }}>Paso 2: Alójalo en GitHub Releases (Estándar Oficial)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#aaa' }}>
                  Sube tu archivo a un Release público en GitHub (o enlace público directo sin anuncios). Esto garantiza descarga rápida en 1-clic y control de versiones transparente.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #2ecc71' }}>
                <strong style={{ color: '#fff' }}>Paso 3: Envía el enlace a la Workshop</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#aaa' }}>
                  En la pestaña <em>"Envía tu Mod"</em>, pega tu enlace directo. Tras una rápida revisión por el equipo de moderación para asegurar que no contiene código malicioso, se publicará en el catálogo público para toda la comunidad.
                </p>
              </div>
            </div>
          </div>

          {/* Validador en Vivo (Sandbox) */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(203, 161, 53, 0.35)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1rem', margin: '0 0 6px 0' }}>
              🔍 {lang === 'es' ? 'Validador de JSON en Vivo (Sandbox)' : 'Live JSON Validator (Sandbox)'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {lang === 'es' ? 'Pega el código de tu mod para verificar al instante si cumple con el Schema v1.0.' : 'Paste your mod code to instantly verify Schema v1.0 compliance.'}
            </p>

            <textarea
              value={validatorInput}
              onChange={(e) => setValidatorInput(e.target.value)}
              placeholder='{ "modId": "mi-mod", "modName": "Mi Mod", "schemaVersion": "1.0", ... }'
              rows={8}
              style={{
                width: '100%',
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px',
                color: '#2ecc71',
                fontFamily: 'monospace',
                fontSize: '0.76rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '10px'
              }}
            />

            <button
              onClick={runLiveValidation}
              style={{
                background: 'var(--gold-primary)',
                color: '#111',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              ⚡ {lang === 'es' ? 'Comprobar Validez' : 'Check Validity'}
            </button>

            {validationReport && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: validationReport.valid ? 'rgba(46, 204, 113, 0.12)' : 'rgba(231, 76, 60, 0.12)',
                  border: `1px solid ${validationReport.valid ? '#2ecc71' : '#e74c3c'}`,
                  fontSize: '0.78rem'
                }}
              >
                {validationReport.valid ? (
                  <div style={{ color: '#2ecc71' }}>
                    <strong>✅ Mod Válido y Compatible:</strong>
                    <div style={{ marginTop: '4px', color: '#e2e8f0', fontSize: '0.74rem' }}>
                      • Misiones: <strong>{validationReport.stats?.missions || 0}</strong> | Páginas IA: <strong>{validationReport.stats?.rulesPages || 0}</strong> | Facciones: <strong>{validationReport.stats?.factions || 0}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#ff7675' }}>
                    <strong>❌ Se encontraron errores:</strong>
                    <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '0.74rem' }}>
                      {validationReport.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 4: ENVÍA TU MOD                                                   */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'submit' && (
        <form onSubmit={handleSubmitMod} style={{ background: 'var(--card-bg)', border: 'var(--border-glass)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', margin: '0 0 4px 0' }}>
            📤 {lang === 'es' ? 'Envía tu Mod a la Workshop' : 'Submit Mod to Workshop'}
          </h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {lang === 'es'
              ? 'Comparte tu creación con la comunidad de La Cuchara de Lobelia alojándola en GitHub Releases.'
              : 'Share your creation with the community hosted on GitHub Releases.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {lang === 'es' ? 'Nombre del Mod *' : 'Mod Name *'}
              </label>
              <input
                required
                value={submitModName}
                onChange={(e) => setSubmitModName(e.target.value)}
                placeholder="Ej: Misiones Torneo ETC 2026"
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {lang === 'es' ? 'Autor / Creador *' : 'Author *'}
              </label>
              <input
                required
                value={submitAuthor}
                onChange={(e) => setSubmitAuthor(e.target.value)}
                placeholder="Tu nick o grupo"
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {lang === 'es' ? 'Enlace Directo de Descarga (GitHub Releases / URL Directa) *' : 'Direct Download URL (GitHub Releases / Direct Link) *'}
            </label>
            <input
              required
              type="url"
              value={submitDownloadUrl}
              onChange={(e) => setSubmitDownloadUrl(e.target.value)}
              placeholder="https://github.com/usuario/repo/releases/download/v1.0/mod.json"
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {lang === 'es' ? 'Descripción del Mod' : 'Mod Description'}
            </label>
            <textarea
              rows={3}
              value={submitDescription}
              onChange={(e) => setSubmitDescription(e.target.value)}
              placeholder="Describe qué escenarios o reglas incluye este mod..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'var(--gold-primary)',
              color: '#111',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {submitting ? '⏳ Enviando...' : (lang === 'es' ? '🚀 Enviar a Moderación' : '🚀 Submit for Moderation')}
          </button>
        </form>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 5: PANEL SUPERADMIN (MODERACIÓN)                                  */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admin' && isSuperAdmin && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(231, 76, 60, 0.4)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ color: '#e74c3c', fontSize: '1.1rem', margin: '0 0 12px 0' }}>
            🛡️ {lang === 'es' ? 'Panel de Moderación SuperAdmin' : 'SuperAdmin Moderation Panel'}
          </h3>

          {loadingAdmin ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cargando solicitudes...</div>
          ) : pendingSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              ✅ No hay solicitudes pendientes de moderación.
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
                      <h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.96rem' }}>{sub.modName}</h4>
                      <div style={{ fontSize: '0.74rem', color: '#888' }}>
                        Autor: <strong>{sub.modAuthor}</strong> • Contacto: <span style={{ color: '#3498db' }}>{sub.contactEmail}</span>
                      </div>
                    </div>
                    <span style={{ background: '#f39c12', color: '#111', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                      PENDIENTE
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#ccc', margin: '6px 0' }}>{sub.description}</p>
                  <div style={{ fontSize: '0.72rem', color: '#3498db', wordBreak: 'break-all', marginBottom: '10px' }}>
                    🔗 URL: {sub.downloadUrl}
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
