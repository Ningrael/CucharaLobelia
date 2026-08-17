// src/views/Mods.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Vista de gestión de Mods de La Cuchara de Lobelia.
// Permite instalar, gestionar y activar mods de datos de ejércitos.
// La app no contiene ningún dato de GW. Los datos vienen de mods externos.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  loadModFromUrl,
  installMod,
  getInstalledMods,
  uninstallMod,
  getActiveModId,
  setActiveMod,
  validateModSchema,
  PUBLIC_MOD_REGISTRY,
} from '../utils/modManager';

export default function Mods({ user, profile, lang }) {
  const [installedMods, setInstalledMods] = useState([]);
  const [activeModId, setActiveModIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installUrl, setInstallUrl] = useState('');
  const [installStatus, setInstallStatus] = useState(null); // { type: 'success'|'error', message }
  const [expandedMod, setExpandedMod] = useState(null);

  // ── Cargar mods instalados ──────────────────────────────────────────────────
  const loadMods = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const mods = await getInstalledMods(user.uid);
    const active = getActiveModId(user.uid);
    setInstalledMods(mods);
    setActiveModIdState(active);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadMods(); }, [loadMods]);

  // ── Instalar desde URL ──────────────────────────────────────────────────────
  const handleInstallFromUrl = async (url) => {
    if (!url.trim()) return;
    setInstalling(true);
    setInstallStatus(null);

    const loadResult = await loadModFromUrl(url.trim());
    if (!loadResult.success) {
      setInstallStatus({ type: 'error', message: loadResult.errors.join('\n') });
      setInstalling(false);
      return;
    }

    // Verificar si ya está instalado
    const alreadyInstalled = installedMods.some(m => m.modId === loadResult.mod.modId);
    if (alreadyInstalled) {
      setInstallStatus({ type: 'error', message: `El mod "${loadResult.mod.modName}" ya está instalado.` });
      setInstalling(false);
      return;
    }

    const installResult = await installMod(user.uid, loadResult.mod, url.trim());
    if (!installResult.success) {
      setInstallStatus({ type: 'error', message: installResult.error });
    } else {
      setInstallStatus({
        type: 'success',
        message: `✅ "${loadResult.mod.modName}" instalado correctamente.`,
      });
      setInstallUrl('');
      await loadMods();
    }
    setInstalling(false);
  };

  // ── Instalar desde catálogo ─────────────────────────────────────────────────
  const handleInstallFromRegistry = (registryMod) => {
    setInstallUrl(registryMod.url);
    handleInstallFromUrl(registryMod.url);
  };

  // ── Activar mod ─────────────────────────────────────────────────────────────
  const handleActivate = (modId) => {
    setActiveMod(user.uid, modId);
    setActiveModIdState(modId);
    setInstallStatus({ type: 'success', message: `Mod activado. Ya puedes usar el Creador de Listas.` });
  };

  // ── Desinstalar mod ─────────────────────────────────────────────────────────
  const handleUninstall = async (modId, modName) => {
    if (!confirm(`¿Desinstalar el mod "${modName}"? Se eliminarán sus datos locales.`)) return;
    const result = await uninstallMod(user.uid, modId);
    if (result.success) {
      await loadMods();
      setInstallStatus({ type: 'success', message: `Mod "${modName}" desinstalado.` });
    } else {
      setInstallStatus({ type: 'error', message: result.error });
    }
  };

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const s = {
    page: { padding: '16px', maxWidth: '700px', margin: '0 auto', paddingBottom: '80px' },
    header: { marginBottom: '24px' },
    title: { fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.04em' },
    subtitle: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' },
    section: { marginBottom: '28px' },
    sectionTitle: { fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' },
    card: { background: 'var(--card-bg)', border: 'var(--border-glass)', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' },
    activeCard: { background: 'rgba(212,175,55,0.08)', border: '1px solid var(--gold-primary)', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' },
    modName: { fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' },
    modMeta: { fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '3px' },
    badge: { display: 'inline-block', padding: '2px 7px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 'bold', marginLeft: '6px' },
    activeBadge: { background: 'rgba(212,175,55,0.2)', color: 'var(--gold-primary)' },
    officialBadge: { background: 'rgba(100,200,100,0.15)', color: '#6dc46d' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
    btnGroup: { display: 'flex', gap: '6px', flexShrink: 0 },
    btnSmall: { fontSize: '0.72rem', padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    btnActivate: { background: 'var(--gold-primary)', color: '#000' },
    btnUninstall: { background: 'rgba(255,80,80,0.15)', color: '#f88', border: '1px solid rgba(255,80,80,0.3)' },
    inputRow: { display: 'flex', gap: '8px' },
    input: { flex: 1, background: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' },
    btnInstall: { background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' },
    statusBox: (type) => ({
      padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginTop: '10px',
      background: type === 'success' ? 'rgba(100,200,100,0.1)' : 'rgba(255,80,80,0.1)',
      color: type === 'success' ? '#6dc46d' : '#f88',
      border: `1px solid ${type === 'success' ? 'rgba(100,200,100,0.2)' : 'rgba(255,80,80,0.2)'}`,
    }),
    emptyState: { textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' },
    registryCard: { background: 'rgba(255,255,255,0.03)', border: 'var(--border-glass)', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' },
    factionPills: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' },
    pill: { background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.68rem', color: 'var(--text-muted)' },
    noUser: { textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' },
  };

  // ── Si no hay usuario logueado ──────────────────────────────────────────────
  if (!user) {
    return (
      <div style={s.page}>
        <div style={s.noUser}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🧩</div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Inicia sesión para gestionar mods
          </div>
          <div style={{ fontSize: '0.82rem' }}>
            Los mods instalados se sincronizan con tu cuenta para que estén disponibles en todos tus dispositivos.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* ── CABECERA ── */}
      <div style={s.header}>
        <div style={s.title}>🧩 Mods de Datos</div>
        <div style={s.subtitle}>
          La Cuchara de Lobelia no contiene datos de juego propios.{' '}
          Instala un <strong>Mod</strong> creado por la comunidad para usar el Creador de Listas y el Tracker de Partidas.
          Los mods son ficheros JSON externos alojados por sus autores.
        </div>
      </div>

      {/* ── ESTADO GENERAL ── */}
      {installedMods.length === 0 && !loading && (
        <div style={{ ...s.card, textAlign: 'center', padding: '20px', marginBottom: '20px', borderColor: 'var(--gold-primary)', borderStyle: 'dashed' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📦</div>
          <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.92rem', marginBottom: '4px' }}>
            Ningún mod instalado
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Instala el mod oficial de MESBG 2024 para empezar a crear tus listas de ejército.
          </div>
        </div>
      )}

      {/* ── MODS INSTALADOS ── */}
      {installedMods.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Mods instalados ({installedMods.length})</div>
          {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Cargando...</div>}
          {installedMods.map(mod => {
            const isActive = mod.modId === activeModId;
            return (
              <div key={mod.modId} style={isActive ? s.activeCard : s.card}>
                <div style={s.row}>
                  <div style={{ minWidth: 0 }}>
                    <div style={s.modName}>
                      {mod.modName}
                      {isActive && <span style={{ ...s.badge, ...s.activeBadge }}>✓ ACTIVO</span>}
                    </div>
                    <div style={s.modMeta}>
                      {mod.modAuthor} • v{mod.modVersion} • {mod.factionCount} facciones • {mod.gameSystem}
                    </div>
                    {mod.modDescription && (
                      <div style={{ ...s.modMeta, marginTop: '4px', fontSize: '0.72rem' }}>
                        {mod.modDescription}
                      </div>
                    )}
                  </div>
                  <div style={s.btnGroup}>
                    {!isActive && (
                      <button
                        style={{ ...s.btnSmall, ...s.btnActivate }}
                        onClick={() => handleActivate(mod.modId)}
                      >
                        Activar
                      </button>
                    )}
                    <button
                      style={{ ...s.btnSmall, ...s.btnUninstall }}
                      onClick={() => handleUninstall(mod.modId, mod.modName)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── INSTALAR DESDE URL ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Instalar mod desde URL</div>
        <div style={s.installCard}>
          <div style={s.inputRow}>
            <input
              style={s.input}
              type="url"
              placeholder="https://ejemplo.com/mi-mod.json"
              value={installUrl}
              onChange={e => setInstallUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInstallFromUrl(installUrl)}
              disabled={installing}
            />
            <button
              style={{ ...s.btnInstall, opacity: installing ? 0.6 : 1 }}
              onClick={() => handleInstallFromUrl(installUrl)}
              disabled={installing || !installUrl.trim()}
            >
              {installing ? 'Instalando...' : '+ Instalar'}
            </button>
          </div>
          {installStatus && (
            <div style={s.statusBox(installStatus.type)}>
              {installStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* ── CATÁLOGO PÚBLICO ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Catálogo de Mods verificados</div>
        {PUBLIC_MOD_REGISTRY.map(regMod => {
          const alreadyInstalled = installedMods.some(m => m.modId === regMod.modId);
          return (
            <div key={regMod.modId} style={s.registryCard}>
              <div style={s.row}>
                <div style={{ minWidth: 0 }}>
                  <div style={s.modName}>
                    {regMod.modName}
                    {regMod.isOfficial && <span style={{ ...s.badge, ...s.officialBadge }}>✓ Oficial</span>}
                  </div>
                  <div style={s.modMeta}>
                    {regMod.modAuthor} • v{regMod.version} • ~{regMod.factionCount} facciones
                  </div>
                  <div style={{ ...s.modMeta, marginTop: '4px', fontSize: '0.72rem' }}>
                    {regMod.modDescription}
                  </div>
                  <div style={s.factionPills}>
                    {(regMod.tags || []).map(tag => (
                      <span key={tag} style={s.pill}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={s.btnGroup}>
                  {alreadyInstalled ? (
                    <span style={{ ...s.btnSmall, background: 'rgba(100,200,100,0.1)', color: '#6dc46d', cursor: 'default' }}>
                      Instalado ✓
                    </span>
                  ) : (
                    <button
                      style={{ ...s.btnSmall, ...s.btnActivate, opacity: installing ? 0.6 : 1 }}
                      onClick={() => handleInstallFromRegistry(regMod)}
                      disabled={installing}
                    >
                      + Instalar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── INFO LEGAL ── */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.5', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: 'var(--border-glass)' }}>
        <strong>Aviso Legal:</strong> La Cuchara de Lobelia no distribuye ni almacena datos con derechos de autor de Games Workshop.
        Los mods son creados y publicados de forma independiente por sus autores. Al instalar un mod, lo haces bajo tu propia responsabilidad.
        Middle-earth Strategy Battle Game © Games Workshop Ltd.
      </div>

    </div>
  );
}
