// src/views/ArmyBuilder.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Vista del Creador de Listas de Ejército — La Cuchara de Lobelia
// Construye listas usando el mod activo del usuario (cero datos GW en Lobelia).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  getActiveMod,
  getInstalledMods,
  getHeroes,
  getWarriorsByFaction
} from '../utils/modManager';
import {
  validateFullList,
  exportToTTS,
  calculateBreakPoint,
  calculateQuartered,
  calculateBowLimit
} from '../utils/armyRules';
import { db } from '../utils/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

import WarbandCard from '../components/army/WarbandCard';
import ModelCard from '../components/army/ModelCard';
import ArmySummaryCard from '../components/army/ArmySummaryCard';

export default function ArmyBuilder({ user, profile, lang, setView }) {
  const [activeMod, setActiveModData] = useState(null);
  const [modLoading, setModLoading] = useState(true);
  const [hasInstalledMods, setHasInstalledMods] = useState(false);

  // ── Estado del Builder ──────────────────────────────────────────────────────
  const [savedLists, setSavedLists] = useState([]);
  const [activeList, setActiveList] = useState(null); // Lista en edición
  const [isSaving, setIsSaving] = useState(false);

  // ── Estado de la UI ─────────────────────────────────────────────────────────
  const [view, setBuilderView] = useState('my_lists'); // 'my_lists' | 'edit_list'
  const [showAddWarriorModal, setShowAddWarriorModal] = useState(null); // warbandIndex o null
  const [showAddHeroModal, setShowAddHeroModal] = useState(false);
  const [inspectedModel, setInspectedModel] = useState(null); // modelo a mostrar en ModelCard
  const [showSummaryCard, setShowSummaryCard] = useState(false); // tarjeta gráfica WhatsApp
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Cargar mod activo ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setModLoading(false); return; }
    (async () => {
      setModLoading(true);
      const installed = await getInstalledMods(user.uid);
      setHasInstalledMods(installed.length > 0);
      const { mod } = await getActiveMod(user.uid);
      setActiveModData(mod);
      setModLoading(false);
    })();
  }, [user]);

  // ── Cargar listas guardadas ─────────────────────────────────────────────────
  const loadSavedLists = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'army_lists', user.uid, 'lists'));
      const lists = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lists.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setSavedLists(lists);
    } catch (err) {
      console.error('Error cargando listas:', err);
    }
  }, [user]);

  useEffect(() => { loadSavedLists(); }, [loadSavedLists]);

  // ── Crear nueva lista ───────────────────────────────────────────────────────
  const handleNewList = () => {
    setActiveList({
      id: null,
      name: 'Nueva Lista',
      pointsLimit: 750,
      warbands: [],
      modId: activeMod?.modId || null,
    });
    setBuilderView('edit_list');
  };

  // ── Guardar lista ───────────────────────────────────────────────────────────
  const handleSaveList = async () => {
    if (!activeList || !user) return;
    setIsSaving(true);
    try {
      const validation = validateFullList(activeList, activeMod);
      const { stats } = validation;
      const listData = {
        ...activeList,
        stats,
        updatedAt: serverTimestamp(),
      };

      if (activeList.id) {
        await updateDoc(doc(db, 'army_lists', user.uid, 'lists', activeList.id), listData);
        notify('Lista guardada correctamente.');
      } else {
        const ref = await addDoc(collection(db, 'army_lists', user.uid, 'lists'), {
          ...listData,
          createdAt: serverTimestamp(),
        });
        setActiveList(prev => ({ ...prev, id: ref.id }));
        notify('Lista creada correctamente.');
      }
      await loadSavedLists();
    } catch (err) {
      notify(`Error al guardar: ${err.message}`, 'error');
    }
    setIsSaving(false);
  };

  // ── Duplicar lista ──────────────────────────────────────────────────────────
  const handleDuplicateList = (originalList) => {
    const duplicated = {
      ...originalList,
      id: null,
      name: `${originalList.name} (Copia)`,
      createdAt: null,
      updatedAt: null
    };
    setActiveList(duplicated);
    setBuilderView('edit_list');
    notify('Copia de lista lista para editar.');
  };

  // ── Eliminar lista ──────────────────────────────────────────────────────────
  const handleDeleteList = async (listId, listName) => {
    if (!confirm(`¿Eliminar la lista "${listName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, 'army_lists', user.uid, 'lists', listId));
      await loadSavedLists();
      notify('Lista eliminada.');
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  // ── Añadir héroe a warband ──────────────────────────────────────────────────
  const handleAddHero = (model) => {
    const hero = {
      ...model,
      selectedOptions: [],
      totalCost: model.baseCost,
      isBowArmed: model.isBowArmed || false,
    };
    const newWarband = { hero, warriors: [] };
    setActiveList(prev => ({
      ...prev,
      warbands: [...(prev.warbands || []), newWarband],
    }));
    setShowAddHeroModal(false);
  };

  // ── Añadir guerrero a warband ───────────────────────────────────────────────
  const handleAddWarrior = (model, warbandIndex) => {
    const warrior = {
      ...model,
      selectedOptions: [],
      totalCost: model.baseCost,
      isBowArmed: model.isBowArmed || false,
    };
    setActiveList(prev => {
      const warbands = [...(prev.warbands || [])];
      warbands[warbandIndex] = {
        ...warbands[warbandIndex],
        warriors: [...(warbands[warbandIndex].warriors || []), warrior],
      };
      return { ...prev, warbands };
    });
    setShowAddWarriorModal(null);
  };

  // ── Eliminar warband ────────────────────────────────────────────────────────
  const handleDeleteWarband = (warbandIndex) => {
    setActiveList(prev => ({
      ...prev,
      warbands: prev.warbands.filter((_, i) => i !== warbandIndex),
    }));
  };

  // ── Eliminar guerrero de warband ────────────────────────────────────────────
  const handleRemoveWarrior = (warbandIndex, warriorIndex) => {
    setActiveList(prev => {
      const warbands = [...prev.warbands];
      warbands[warbandIndex] = {
        ...warbands[warbandIndex],
        warriors: warbands[warbandIndex].warriors.filter((_, i) => i !== warriorIndex),
      };
      return { ...prev, warbands };
    });
  };

  // ── Modificar opciones de equipo del modelo inspeccionado ────────────────────
  const handleToggleModelOption = (option) => {
    if (!inspectedModel) return;

    const currentSelected = inspectedModel.selectedOptions || [];
    const isSelected = currentSelected.some(o => o.name === option.name);

    let updatedOptions;
    if (isSelected) {
      updatedOptions = currentSelected.filter(o => o.name !== option.name);
    } else {
      updatedOptions = [...currentSelected, option];
    }

    const extraCost = updatedOptions.reduce((acc, o) => acc + (o.cost || 0), 0);
    const totalCost = (inspectedModel.baseCost || 0) + extraCost;
    const isBowArmed = inspectedModel.isBowArmed || updatedOptions.some(o => o.isBow);

    const updatedModel = {
      ...inspectedModel,
      selectedOptions: updatedOptions,
      totalCost,
      isBowArmed
    };

    setInspectedModel(updatedModel);

    // Si el modelo pertenece a la lista activa, actualizar la lista
    if (activeList) {
      setActiveList(prev => {
        const warbands = prev.warbands.map(wb => {
          if (wb.hero?.id === inspectedModel.id) {
            return { ...wb, hero: updatedModel };
          }
          const warriors = (wb.warriors || []).map(w => {
            if (w === inspectedModel || (w.id === inspectedModel.id && w.selectedOptions === inspectedModel.selectedOptions)) {
              return updatedModel;
            }
            return w;
          });
          return { ...wb, warriors };
        });
        return { ...prev, warbands };
      });
    }
  };

  // ── Validación en tiempo real ───────────────────────────────────────────────
  const validation = activeList ? validateFullList(activeList, activeMod) : null;
  const stats = validation?.stats || {};

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const s = {
    page: { padding: '16px', maxWidth: '700px', margin: '0 auto', paddingBottom: '90px' },
    topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '10px' },
    title: { fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--gold-primary)', fontFamily: 'var(--font-title)', letterSpacing: '0.04em' },
    btnPrimary: { background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' },
    btnSecondary: { background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', border: 'var(--border-glass)', borderRadius: '8px', padding: '9px 16px', fontSize: '0.82rem', cursor: 'pointer' },
    card: { background: 'var(--card-bg)', border: 'var(--border-glass)', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' },
    statsBar: { background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' },
    statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
    statVal: { fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-primary)' },
    statLabel: { fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
    pill: (color) => ({ background: color, borderRadius: '4px', padding: '1px 6px', fontSize: '0.66rem', fontWeight: 'bold' }),
    errorBox: { background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.78rem', color: '#f88' },
    warnBox: { background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.78rem', color: '#ffa500' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
    modalSheet: { background: 'var(--bg-primary)', borderRadius: '18px 18px 0 0', padding: '20px', width: '100%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' },
    searchInput: { width: '100%', background: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' },
    modelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' },
    notificationBar: { position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'rgba(30,30,30,0.95)', border: 'var(--border-glass)', borderRadius: '8px', padding: '10px 20px', fontSize: '0.82rem', color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' },
    noMod: { textAlign: 'center', padding: '40px 20px' },
  };

  const heroTierLabels = {
    hero_of_legend: 'Hero of Legend',
    hero_of_valour: 'Hero of Valour',
    hero_of_fortitude: 'Hero of Fortitude',
    minor_hero: 'Minor Hero',
    independent_hero: 'Independent Hero',
  };

  // ── ESTADO: Sin usuario ─────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={s.page}>
        <div style={s.noMod}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚔️</div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Inicia sesión para crear tus listas</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tus listas se guardan en la nube y están disponibles desde cualquier dispositivo.</div>
        </div>
      </div>
    );
  }

  // ── ESTADO: Cargando mod ────────────────────────────────────────────────────
  if (modLoading) {
    return (
      <div style={s.page}>
        <div style={s.noMod}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Cargando datos del mod...</div>
        </div>
      </div>
    );
  }

  // ── ESTADO: Sin mod instalado ───────────────────────────────────────────────
  if (!activeMod) {
    return (
      <div style={s.page}>
        <div style={{ ...s.noMod, padding: '32px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🧩</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>
            {hasInstalledMods ? 'Ningún mod activo' : 'Ningún mod instalado'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
            {hasInstalledMods
              ? 'Tienes mods instalados pero ninguno está activo. Ve a la sección de Mods y activa uno.'
              : 'Para usar el Creador de Listas necesitas instalar un Mod de Datos. El Mod contiene los perfiles de los ejércitos de MESBG.'}
          </div>
          <button style={s.btnPrimary} onClick={() => setView('mods')}>
            🧩 {hasInstalledMods ? 'Activar un mod' : 'Instalar mi primer mod'}
          </button>
        </div>
      </div>
    );
  }

  // ── VISTA: Mis Listas ───────────────────────────────────────────────────────
  if (view === 'my_lists') {
    return (
      <div style={s.page}>
        {notification && <div style={s.notificationBar}>{notification.msg}</div>}

        <div style={s.topBar}>
          <div>
            <div style={s.title}>⚔️ Mis Listas</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Mod activo: <strong style={{ color: 'var(--gold-primary)' }}>{activeMod.modName}</strong>
            </div>
          </div>
          <button style={s.btnPrimary} onClick={handleNewList}>+ Nueva Lista</button>
        </div>

        {savedLists.length === 0 && (
          <div style={{ ...s.card, textAlign: 'center', padding: '28px', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📋</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No tienes listas guardadas. ¡Crea tu primera lista!
            </div>
          </div>
        )}

        {savedLists.map(list => {
          const total = list.stats?.totalModels || 0;
          const pts = list.stats?.totalPoints || 0;
          const bp = list.stats?.breakPoint || 0;
          const q = list.stats?.quartered || 0;
          return (
            <div key={list.id} style={s.card}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', fontSize: '0.95rem' }}>{list.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {pts} pts • {total} miniaturas • BP: {bp} bajas • 25%: {q} vivas
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button style={{ ...s.btnSecondary, padding: '6px 10px', fontSize: '0.75rem' }}
                    onClick={() => { setActiveList(list); setBuilderView('edit_list'); }}>
                    ✏️ Editar
                  </button>
                  <button style={{ ...s.btnSecondary, padding: '6px 10px', fontSize: '0.75rem' }}
                    onClick={() => handleDuplicateList(list)}
                    title="Duplicar lista">
                    📑
                  </button>
                  <button style={{ ...s.btnSecondary, padding: '6px 10px', fontSize: '0.75rem', color: '#f88' }}
                    onClick={() => handleDeleteList(list.id, list.name)}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── VISTA: Editar Lista ─────────────────────────────────────────────────────
  if (view === 'edit_list' && activeList) {
    const heroes = getHeroes(activeMod);
    const filteredHeroes = heroes.filter(h =>
      !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div style={s.page}>
        {notification && <div style={s.notificationBar}>{notification.msg}</div>}

        {/* Cabecera */}
        <div style={s.topBar}>
          <button style={{ ...s.btnSecondary, padding: '7px 12px', fontSize: '0.78rem' }}
            onClick={() => { setBuilderView('my_lists'); setActiveList(null); }}>
            ← Volver
          </button>
          <input
            style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(212,175,55,0.4)', color: 'var(--gold-primary)', fontSize: '1rem', fontWeight: 'bold', fontFamily: 'var(--font-title)', outline: 'none', padding: '4px 0', textAlign: 'center' }}
            value={activeList.name}
            onChange={e => setActiveList(prev => ({ ...prev, name: e.target.value }))}
          />
          <button style={{ ...s.btnPrimary, padding: '7px 14px', fontSize: '0.8rem', opacity: isSaving ? 0.6 : 1 }}
            onClick={handleSaveList} disabled={isSaving}>
            {isSaving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>

        {/* Selector de Límite de Puntos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Límite de puntos:</span>
          {[500, 600, 700, 750, 800, 1000].map(p => (
            <button key={p}
              style={{ padding: '4px 10px', borderRadius: '6px', border: 'var(--border-glass)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: activeList.pointsLimit === p ? 'bold' : 'normal', background: activeList.pointsLimit === p ? 'var(--gold-primary)' : 'transparent', color: activeList.pointsLimit === p ? '#000' : 'var(--text-muted)' }}
              onClick={() => setActiveList(prev => ({ ...prev, pointsLimit: p }))}>
              {p}
            </button>
          ))}
        </div>

        {/* Barra de estadísticas en tiempo real */}
        <div style={s.statsBar}>
          <div style={s.statItem}>
            <span style={{ ...s.statVal, color: stats.totalPoints > stats.pointsLimit ? '#f88' : 'var(--gold-primary)' }}>
              {stats.totalPoints || 0} / {stats.pointsLimit || 0}
            </span>
            <span style={s.statLabel}>Puntos</span>
          </div>
          <div style={s.statItem}>
            <span style={s.statVal}>{stats.totalModels || 0}</span>
            <span style={s.statLabel}>Miniaturas</span>
          </div>
          <div style={s.statItem}>
            <span style={{ ...s.statVal, color: '#f88' }}>{stats.breakPoint || 0}</span>
            <span style={s.statLabel}>Break Point (50%)</span>
          </div>
          <div style={s.statItem}>
            <span style={{ ...s.statVal, color: '#ffa500' }}>{stats.quartered || 0}</span>
            <span style={s.statLabel}>25% (Quartered)</span>
          </div>
          <div style={s.statItem}>
            <span style={{ ...s.statVal, color: stats.bowCount > stats.bowLimit ? '#f88' : 'var(--text-primary)' }}>
              {stats.bowCount || 0} / {stats.bowLimit || 0}
            </span>
            <span style={s.statLabel}>Arcos</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {validation?.valid
              ? <span style={{ ...s.pill('rgba(100,200,100,0.15)'), color: '#6dc46d', fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px' }}>✓ Lista válida</span>
              : <span style={{ ...s.pill('rgba(255,80,80,0.15)'), color: '#f88', fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px' }}>⚠ {validation?.errors?.length} errores</span>
            }
          </div>
        </div>

        {/* Errores y advertencias */}
        {validation?.errors?.length > 0 && (
          <div style={s.errorBox}>
            {validation.errors.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}
        {validation?.warnings?.length > 0 && (
          <div style={s.warnBox}>
            {validation.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}

        {/* Warbands (utilizando el nuevo componente WarbandCard) */}
        {(activeList.warbands || []).map((wb, wbIdx) => (
          <WarbandCard
            key={wbIdx}
            warband={wb}
            warbandIndex={wbIdx}
            onRemoveWarband={handleDeleteWarband}
            onOpenAddWarrior={(idx) => { setSearchQuery(''); setShowAddWarriorModal(idx); }}
            onRemoveWarrior={handleRemoveWarrior}
            onViewModel={(m) => setInspectedModel(m)}
            activeMod={activeMod}
          />
        ))}

        {/* Botón añadir partida de guerra */}
        <button style={{ ...s.btnSecondary, width: '100%', padding: '12px', fontSize: '0.85rem', borderStyle: 'dashed', marginBottom: '16px' }}
          onClick={() => { setSearchQuery(''); setShowAddHeroModal(true); }}>
          ⚔️ + Nueva Partida de Guerra (Añadir Héroe)
        </button>

        {/* Botones de acción y exportación */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            style={{ ...s.btnPrimary, flex: 1, background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)', color: '#fff' }}
            onClick={() => setShowSummaryCard(true)}
          >
            📸 Tarjeta Gráfica (WhatsApp)
          </button>
          <button
            style={{ ...s.btnPrimary, flex: 1 }}
            onClick={() => setShowExportModal(true)}
          >
            📤 Exportar (TTS / JSON)
          </button>
        </div>

        {/* ── MODAL: Añadir Héroe ── */}
        {showAddHeroModal && (
          <div style={s.modalOverlay} onClick={() => setShowAddHeroModal(false)}>
            <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '12px', color: 'var(--gold-primary)' }}>
                Seleccionar Héroe Capitán
              </div>
              <input style={s.searchInput} placeholder="Buscar héroe..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} autoFocus />
              {filteredHeroes.map(h => (
                <div key={h.id} style={s.modelRow} onClick={() => handleAddHero(h)}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{h.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {h.factionName} · {heroTierLabels[h.heroTier]} · {h.baseCost} pts
                    </div>
                  </div>
                  <span style={{ color: 'var(--gold-primary)', fontSize: '1.2rem' }}>+</span>
                </div>
              ))}
              {filteredHeroes.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontSize: '0.82rem' }}>
                  No se encontraron héroes con ese nombre.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL: Añadir Guerrero ── */}
        {showAddWarriorModal !== null && (
          <div style={s.modalOverlay} onClick={() => setShowAddWarriorModal(null)}>
            <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '12px', color: 'var(--gold-primary)' }}>
                Añadir Guerrero
              </div>
              <input style={s.searchInput} placeholder="Buscar guerrero..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} autoFocus />
              {(() => {
                const warbandHeroFaction = activeList.warbands[showAddWarriorModal]?.hero?.factionId;
                const warriors = getWarriorsByFaction(activeMod, warbandHeroFaction)
                  .filter(w => !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()));
                return warriors.length > 0 ? warriors.map(w => (
                  <div key={w.id} style={s.modelRow} onClick={() => handleAddWarrior(w, showAddWarriorModal)}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{w.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{w.factionName} · {w.baseCost} pts</div>
                    </div>
                    <span style={{ color: 'var(--gold-primary)', fontSize: '1.2rem' }}>+</span>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontSize: '0.82rem' }}>
                    No se encontraron guerreros compatibles.
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── MODAL: Ver Perfil Ilustrado (ModelCard) ── */}
        {inspectedModel && (
          <ModelCard
            model={inspectedModel}
            onClose={() => setInspectedModel(null)}
            onSelectOption={handleToggleModelOption}
            selectedOptions={inspectedModel.selectedOptions || []}
          />
        )}

        {/* ── MODAL: Tarjeta Gráfica de Resumen (ArmySummaryCard) ── */}
        {showSummaryCard && (
          <ArmySummaryCard
            list={activeList}
            activeMod={activeMod}
            onClose={() => setShowSummaryCard(false)}
          />
        )}

        {/* ── MODAL: Exportar TTS / JSON ── */}
        {showExportModal && (
          <div style={s.modalOverlay} onClick={() => setShowExportModal(false)}>
            <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', color: 'var(--gold-primary)' }}>
                📤 Exportar Lista
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* TTS */}
                <div style={s.card}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '6px' }}>🎲 Tabletop Simulator (MESBG FTC Mod)</div>
                  <textarea
                    readOnly
                    style={{ width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.3)', color: '#ccc', border: 'var(--border-glass)', borderRadius: '6px', padding: '8px', fontSize: '0.75rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
                    value={exportToTTS(activeList)}
                  />
                  <button style={{ ...s.btnSecondary, marginTop: '8px', fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => { navigator.clipboard.writeText(exportToTTS(activeList)); notify('Copiado al portapapeles.'); }}>
                    📋 Copiar formato TTS
                  </button>
                </div>
                {/* JSON */}
                <button style={{ ...s.btnSecondary, padding: '10px' }}
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(activeList, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${activeList.name.replace(/\s+/g, '_')}.json`;
                    a.click();
                  }}>
                  💾 Descargar JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
