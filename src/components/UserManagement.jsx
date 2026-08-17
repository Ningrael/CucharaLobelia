// src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function UserManagement({ lang, currentUserId, currentUsername, showAlert, showConfirm }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('registered_desc'); // 'registered_desc' | 'registered_asc' | 'name_asc' | 'last_seen_desc' | 'ai_desc' | 'points_desc'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  
  // Edit, Ban and Analytics views states
  const [editingUser, setEditingUser] = useState(null);
  const [banningUser, setBanningUser] = useState(null);
  const [selectedAnalyticsUser, setSelectedAnalyticsUser] = useState(null);
  
  // Form edit states
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editFaction, setEditFaction] = useState('');
  const [editAlignment, setEditAlignment] = useState('luz');
  const [editStatus, setEditStatus] = useState('approved');
  const [editBanUntil, setEditBanUntil] = useState('');
  const [editBanReason, setEditBanReason] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editIsSuperAdmin, setEditIsSuperAdmin] = useState(false);

  // Stats edit states
  const [editPoints, setEditPoints] = useState(0);
  const [editMatchesPlayed, setEditMatchesPlayed] = useState(0);
  const [editWins, setEditWins] = useState(0);
  const [editDraws, setEditDraws] = useState(0);
  const [editLosses, setEditLosses] = useState(0);
  const [editVpScored, setEditVpScored] = useState(0);
  const [editVpConceded, setEditVpConceded] = useState(0);
  const [editLeadersKilled, setEditLeadersKilled] = useState(0);
  const [editLeadersLost, setEditLeadersLost] = useState(0);

  const [isSaving, setIsSaving] = useState(false);

  // Translations
  const t = {
    es: {
      title: "Gestión de Usuarios & Directorio de Registrados",
      subtitle: "Historial cronológico de registros, actividad reciente y administración de cuentas.",
      search_placeholder: "Buscar por nombre, usuario, email o facción...",
      no_users: "No se encontraron usuarios.",
      loading: "Cargando usuarios y telemetría...",
      user_label: "Usuario",
      email_label: "Email",
      phone_label: "Teléfono",
      location_label: "Ubicación",
      role_label: "Rol",
      status_label: "Estado",
      stats_label: "Estadísticas",
      actions: "Acciones",
      edit: "Editar",
      delete: "Eliminar",
      ban_btn: "Banear",
      quick_ban_title: "Baneo / Bloqueo de Cuenta",
      ban_action_label: "Acción / Estado de Cuenta:",
      unban_option: "Activar Cuenta (Quitar Baneo)",
      suspend_option: "Suspender Temporalmente",
      block_option: "Bloquear Permanentemente",
      save: "Guardar Cambios",
      saving: "Guardando...",
      cancel: "Cancelar",
      super_admin: "Super Admin",
      admin: "Admin",
      player: "Jugador",
      approved: "Aprobado",
      suspended: "Suspendido",
      blocked: "Bloqueado",
      deleted: "Eliminado",
      ban_until: "Baneado hasta:",
      ban_reason: "Motivo del Ban:",
      ban_reason_placeholder: "Ej: Comportamiento inapropiado en el chat de la liga",
      points: "Puntos",
      matches: "Partidas",
      wins: "Victorias",
      draws: "Empates",
      losses: "Derrotas",
      vp_scored: "VP Anotados",
      vp_conceded: "VP Concedidos",
      leaders_killed: "Líderes Eliminados",
      leaders_lost: "Líderes Perdidos",
      confirm_delete: "¿Estás seguro de que deseas eliminar este usuario? Esta acción borrará su perfil de Firestore.",
      error_load: "Error al cargar los usuarios: ",
      error_save: "Error al guardar los cambios: ",
      error_delete: "Error al eliminar el usuario: ",
      success_save: "Usuario actualizado con éxito.",
      success_delete: "Usuario eliminado con éxito.",
      success_ban: "Estado de baneo actualizado con éxito.",
      protect_super: "No se puede editar, suspender ni bloquear al Super Admin principal Matias.",
      cant_self_demote: "No puedes quitarte el rol de Administrador a ti mismo para evitar perder el acceso.",
      alignment: "Alineación",
      faction: "Facción",
      luz: "Luz",
      oscuridad: "Oscuridad",
      registered_date: "Fecha de Registro",
      last_active: "Última Conexión",
      recent_activity: "Actividad en App",
      total_registered: "Total Registrados",
      active_recently: "Activos Recientes",
      sort_by: "Ordenar por:",
      sort_registered_desc: "📅 Registro (Más Recientes)",
      sort_registered_asc: "📅 Registro (Más Antiguos)",
      sort_name_asc: "🔤 Nombre (A-Z)",
      sort_last_seen: "⚡ Última Conexión",
      sort_ai: "🤖 Más Uso de IA",
      sort_points: "🏆 Puntos en Liga",
      view_cards: "📇 Tarjetas Detalladas",
      view_table: "📑 Listado / Histórico",
      legacy_user: "Usuario Histórico",
      ai_queries: "Consultas IA",
      calc_runs: "Cálculos",
      mission_views: "Misiones",
      never_connected: "Sin actividad registrada"
    },
    en: {
      title: "User Management & Registered Directory",
      subtitle: "Chronological registration history, recent user activity and account administration.",
      search_placeholder: "Search by name, username, email or faction...",
      no_users: "No users found.",
      loading: "Loading users and telemetry...",
      user_label: "Username",
      email_label: "Email",
      phone_label: "Phone",
      location_label: "Location",
      role_label: "Role",
      status_label: "Status",
      stats_label: "Statistics",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      ban_btn: "Ban",
      quick_ban_title: "Account Ban / Block",
      ban_action_label: "Action / Account Status:",
      unban_option: "Activate Account (Remove Ban)",
      suspend_option: "Suspend Temporarily",
      block_option: "Block Permanently",
      save: "Save Changes",
      saving: "Saving...",
      cancel: "Cancel",
      super_admin: "Super Admin",
      admin: "Admin",
      player: "Player",
      approved: "Approved",
      suspended: "Suspended",
      blocked: "Blocked",
      deleted: "Deleted",
      ban_until: "Banned until:",
      ban_reason: "Ban Reason:",
      ban_reason_placeholder: "e.g. Inappropriate behavior in league chat",
      points: "Points",
      matches: "Matches",
      wins: "Wins",
      draws: "Draws",
      losses: "Losses",
      vp_scored: "VP Scored",
      vp_conceded: "VP Conceded",
      leaders_killed: "Leaders Killed",
      leaders_lost: "Leaders Lost",
      confirm_delete: "Are you sure you want to delete this user? This action will remove their Firestore profile.",
      error_load: "Error loading users: ",
      error_save: "Error saving changes: ",
      error_delete: "Error deleting user: ",
      success_save: "User updated successfully.",
      success_delete: "User deleted successfully.",
      success_ban: "Ban status updated successfully.",
      protect_super: "The main Super Admin Matias cannot be edited, suspended or blocked.",
      cant_self_demote: "You cannot remove your own Admin role to prevent locking yourself out.",
      alignment: "Alignment",
      faction: "Faction",
      luz: "Light",
      oscuridad: "Darkness",
      registered_date: "Registration Date",
      last_active: "Last Active",
      recent_activity: "App Activity",
      total_registered: "Total Registered",
      active_recently: "Recently Active",
      sort_by: "Sort by:",
      sort_registered_desc: "📅 Registration (Newest)",
      sort_registered_asc: "📅 Registration (Oldest)",
      sort_name_asc: "🔤 Name (A-Z)",
      sort_last_seen: "⚡ Last Active",
      sort_ai: "🤖 Most AI Queries",
      sort_points: "🏆 League Points",
      view_cards: "📇 Detailed Cards",
      view_table: "📑 Directory / History",
      legacy_user: "Legacy User",
      ai_queries: "AI Queries",
      calc_runs: "Calculations",
      mission_views: "Missions",
      never_connected: "No recorded activity"
    }
  };

  const currentT = t[lang] || t['es'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "players"));
      const usersList = [];
      querySnapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(usersList);
    } catch (error) {
      console.error(error);
      showAlert(currentT.error_load + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setBanningUser(null);
    setEditName(user.name || '');
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditLocation(user.location || '');
    setEditFaction(user.faction || '');
    setEditAlignment(user.alignment || 'luz');
    setEditStatus(user.status || 'approved');
    setEditBanUntil(user.banUntil || '');
    setEditBanReason(user.banReason || '');
    setEditIsAdmin(user.isAdmin === true);
    setEditIsSuperAdmin(user.isSuperAdmin === true);

    // Stats
    setEditPoints(user.points || 0);
    setEditMatchesPlayed(user.matchesPlayed || 0);
    setEditWins(user.wins || 0);
    setEditDraws(user.draws || 0);
    setEditLosses(user.losses || 0);
    setEditVpScored(user.vpScored || 0);
    setEditVpConceded(user.vpConceded || 0);
    setEditLeadersKilled(user.leadersKilled || 0);
    setEditLeadersLost(user.leadersLost || 0);
  };

  const handleBanClick = (user) => {
    if (user.username?.toLowerCase() === 'matias') {
      showAlert(currentT.protect_super);
      return;
    }
    setBanningUser(user);
    setEditingUser(null);
    setEditStatus(user.status || 'approved');
    setEditBanUntil(user.banUntil || '');
    setEditBanReason(user.banReason || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const targetIsMatias = editingUser.username?.toLowerCase() === 'matias';

    // Prevent demoting yourself from Admin
    if (editingUser.id === currentUserId && !editIsAdmin && !editIsSuperAdmin) {
      showAlert(currentT.cant_self_demote);
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "players", editingUser.id);
      const updatedFields = {
        name: editName.trim(),
        username: editUsername.trim().toLowerCase(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        location: editLocation.trim(),
        faction: editFaction.trim(),
        alignment: editAlignment,
        status: editStatus,
        banUntil: editStatus === 'suspended' ? editBanUntil : '',
        banReason: (editStatus === 'suspended' || editStatus === 'blocked') ? editBanReason.trim() : '',
        isAdmin: targetIsMatias ? true : editIsAdmin,
        isSuperAdmin: targetIsMatias ? true : editIsSuperAdmin,
        points: parseInt(editPoints) || 0,
        matchesPlayed: parseInt(editMatchesPlayed) || 0,
        wins: parseInt(editWins) || 0,
        draws: parseInt(editDraws) || 0,
        losses: parseInt(editLosses) || 0,
        vpScored: parseInt(editVpScored) || 0,
        vpConceded: parseInt(editVpConceded) || 0,
        leadersKilled: parseInt(editLeadersKilled) || 0,
        leadersLost: parseInt(editLeadersLost) || 0
      };

      await updateDoc(userRef, updatedFields);
      showAlert(currentT.success_save);
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      console.error(error);
      showAlert(currentT.error_save + error.message);
    }
    setIsSaving(false);
  };

  const handleSaveBan = async (e) => {
    e.preventDefault();
    if (!banningUser) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, "players", banningUser.id);
      const updatedFields = {
        status: editStatus,
        banUntil: editStatus === 'suspended' ? editBanUntil : '',
        banReason: (editStatus === 'suspended' || editStatus === 'blocked') ? editBanReason.trim() : ''
      };

      await updateDoc(userRef, updatedFields);
      showAlert(currentT.success_ban);
      setBanningUser(null);
      await fetchUsers();
    } catch (error) {
      console.error(error);
      showAlert(currentT.error_save + error.message);
    }
    setIsSaving(false);
  };

  const handleDelete = (user) => {
    // Check if trying to delete Matias
    if (user.username?.toLowerCase() === 'matias') {
      showAlert(currentT.protect_super);
      return;
    }

    // Check if trying to delete self
    if (user.id === currentUserId) {
      showAlert(lang === 'es' ? "No puedes eliminar tu propia cuenta en uso." : "You cannot delete your own active account.");
      return;
    }

    showConfirm(currentT.confirm_delete, async () => {
      try {
        const userRef = doc(db, "players", user.id);
        await deleteDoc(userRef);
        showAlert(currentT.success_delete);
        await fetchUsers();
      } catch (error) {
        console.error(error);
        showAlert(currentT.error_delete + error.message);
      }
    });
  };

  // Helper date formatters
  const formatRegistrationDate = (dateVal) => {
    if (!dateVal) return currentT.legacy_user;
    try {
      let d;
      if (dateVal?.toDate) {
        d = dateVal.toDate();
      } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
        d = new Date(dateVal);
      } else if (dateVal?.seconds) {
        d = new Date(dateVal.seconds * 1000);
      }
      if (!d || isNaN(d.getTime())) return currentT.legacy_user;

      return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return currentT.legacy_user;
    }
  };

  const formatLastSeen = (lastSeenVal) => {
    if (!lastSeenVal) return currentT.never_connected;
    try {
      const d = new Date(lastSeenVal);
      if (isNaN(d.getTime())) return currentT.never_connected;

      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return lang === 'es' ? '🟢 Conectado ahora' : '🟢 Active now';
      if (diffMins < 60) return lang === 'es' ? `🟢 Hace ${diffMins} min` : `🟢 ${diffMins}m ago`;
      if (diffHours < 24) return lang === 'es' ? `Hace ${diffHours}h` : `${diffHours}h ago`;
      if (diffDays <= 7) return lang === 'es' ? `Hace ${diffDays} días` : `${diffDays}d ago`;

      return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit',
        month: 'short'
      });
    } catch (_) {
      return currentT.never_connected;
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.username || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.location || '').toLowerCase().includes(query) ||
      (user.faction || '').toLowerCase().includes(query)
    );
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'name_asc') {
      return (a.name || a.username || '').localeCompare(b.name || b.username || '');
    }
    if (sortBy === 'registered_desc') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.userAnalytics?.lastSeen ? new Date(a.userAnalytics.lastSeen).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.userAnalytics?.lastSeen ? new Date(b.userAnalytics.lastSeen).getTime() : 0);
      return dateB - dateA;
    }
    if (sortBy === 'registered_asc') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.userAnalytics?.lastSeen ? new Date(a.userAnalytics.lastSeen).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.userAnalytics?.lastSeen ? new Date(b.userAnalytics.lastSeen).getTime() : 0);
      return dateA - dateB;
    }
    if (sortBy === 'last_seen_desc') {
      const lsA = a.userAnalytics?.lastSeen ? new Date(a.userAnalytics.lastSeen).getTime() : 0;
      const lsB = b.userAnalytics?.lastSeen ? new Date(b.userAnalytics.lastSeen).getTime() : 0;
      return lsB - lsA;
    }
    if (sortBy === 'ai_desc') {
      const aiA = a.userAnalytics?.features?.ai_query || 0;
      const aiB = b.userAnalytics?.features?.ai_query || 0;
      return aiB - aiA;
    }
    if (sortBy === 'points_desc') {
      return (b.points || 0) - (a.points || 0);
    }
    return 0;
  });

  // KPI calculations for users header
  const totalCount = users.length;
  const recentActiveCount = users.filter(u => {
    if (!u.userAnalytics?.lastSeen) return false;
    const diffDays = (Date.now() - new Date(u.userAnalytics.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;
  const adminCount = users.filter(u => u.isAdmin || u.isSuperAdmin).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxHeight: '72vh', overflowY: 'auto' }}>
      
      {/* CABECERA CON RESUMEN DE USUARIOS REGISTRADOS */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(203, 161, 53, 0.12), rgba(0,0,0,0.3))',
        border: '1px solid var(--gold-primary)',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--gold-primary)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
            👥 {currentT.title}
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            {currentT.subtitle}
          </p>
        </div>

        {/* Chips de KPIs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', background: 'rgba(203, 161, 53, 0.15)', color: 'var(--gold-primary)', border: '1px solid rgba(203, 161, 53, 0.3)', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
            👥 {totalCount} {currentT.total_registered}
          </span>
          <span style={{ fontSize: '0.72rem', background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
            🟢 {recentActiveCount} {currentT.active_recently}
          </span>
          <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
            🛡️ {adminCount} Admins
          </span>
        </div>
      </div>

      {editingUser ? (
        /* EDIT FULL FORM VIEW */
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px', border: 'var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
              {currentT.edit}: @{editingUser.username}
            </span>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingUser(null)} style={{ padding: '2px 8px', minHeight: '26px' }}>
              {currentT.cancel}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Nick / Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Username</label>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.phone_label}</label>
              <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.location_label}</label>
              <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.faction}</label>
              <input type="text" value={editFaction} onChange={e => setEditFaction(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.alignment}</label>
              <select value={editAlignment} onChange={e => setEditAlignment(e.target.value)} style={{ background: '#111', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }}>
                <option value="luz">{currentT.luz}</option>
                <option value="oscuridad">{currentT.oscuridad}</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.status_label}</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ background: '#111', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }}>
                <option value="approved">{currentT.approved}</option>
                <option value="suspended">{currentT.suspended}</option>
                <option value="blocked">{currentT.blocked}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#fff', cursor: 'pointer' }}>
              <input type="checkbox" checked={editIsAdmin} onChange={e => setEditIsAdmin(e.target.checked)} />
              {currentT.admin}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--gold-primary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editIsSuperAdmin} onChange={e => setEditIsSuperAdmin(e.target.checked)} />
              {currentT.super_admin}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ flex: 1 }}>
              {isSaving ? currentT.saving : currentT.save}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>
              {currentT.cancel}
            </button>
          </div>
        </form>
      ) : banningUser ? (
        /* BAN / BLOCK QUICK VIEW */
        <form onSubmit={handleSaveBan} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(235, 87, 87, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(235, 87, 87, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(235, 87, 87, 0.15)', paddingBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#ff6b6b', fontSize: '0.9rem' }}>
              {currentT.quick_ban_title}: @{banningUser.username}
            </span>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setBanningUser(null)} style={{ padding: '2px 8px', minHeight: '26px' }}>
              {currentT.cancel}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{currentT.ban_action_label}</label>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ background: '#111', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '10px', fontSize: '0.85rem' }}>
              <option value="approved">{currentT.unban_option}</option>
              <option value="suspended">{currentT.suspend_option}</option>
              <option value="blocked">{currentT.block_option}</option>
            </select>
          </div>

          {editStatus === 'suspended' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{currentT.ban_until}</label>
              <input type="date" value={editBanUntil} onChange={e => setEditBanUntil(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '10px', fontSize: '0.85rem' }} />
            </div>
          )}

          {(editStatus === 'suspended' || editStatus === 'blocked') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{currentT.ban_reason}</label>
              <input 
                type="text" 
                value={editBanReason} 
                onChange={e => setEditBanReason(e.target.value)} 
                placeholder={currentT.ban_reason_placeholder} 
                required 
                style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '10px', fontSize: '0.85rem' }} 
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button type="submit" className="btn btn-danger" disabled={isSaving} style={{ flex: 1, background: 'var(--danger-color)', color: '#fff', border: 'none' }}>
              {isSaving ? currentT.saving : currentT.save}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setBanningUser(null)} style={{ flex: 1 }}>
              {currentT.cancel}
            </button>
          </div>
        </form>
      ) : (
        /* MAIN USER LIST VIEW */
        <>
          {/* BARRA DE HERRAMIENTAS: BÚSQUEDA, ORDENACIÓN Y MODO DE VISTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <input
                  type="text"
                  placeholder={currentT.search_placeholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: 'var(--border-glass)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              {/* Selector de ordenación */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '8px', padding: '4px 8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.sort_by}</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    background: '#111',
                    border: 'none',
                    color: 'var(--gold-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    outline: 'none',
                    padding: '2px 4px'
                  }}
                >
                  <option value="registered_desc">{currentT.sort_registered_desc}</option>
                  <option value="registered_asc">{currentT.sort_registered_asc}</option>
                  <option value="name_asc">{currentT.sort_name_asc}</option>
                  <option value="last_seen_desc">{currentT.sort_last_seen}</option>
                  <option value="ai_desc">{currentT.sort_ai}</option>
                  <option value="points_desc">{currentT.sort_points}</option>
                </select>
              </div>

              {/* Selector de modo de visualización: Tarjetas vs Tabla */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '2px', border: 'var(--border-glass)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  style={{
                    background: viewMode === 'cards' ? 'var(--gold-primary)' : 'transparent',
                    color: viewMode === 'cards' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  title={currentT.view_cards}
                >
                  📇 {lang === 'es' ? 'Tarjetas' : 'Cards'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    background: viewMode === 'table' ? 'var(--gold-primary)' : 'transparent',
                    color: viewMode === 'table' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  title={currentT.view_table}
                >
                  📑 {lang === 'es' ? 'Histórico / Tabla' : 'History / Table'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              {currentT.loading}
            </div>
          ) : sortedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {currentT.no_users}
            </div>
          ) : viewMode === 'table' ? (
            /* VISTA DE TABLA / HISTÓRICO COMPACTO */
            <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.25)', border: 'var(--border-glass)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--gold-primary)' }}>
                    <th style={{ padding: '8px 10px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>{currentT.user_label}</th>
                    <th style={{ padding: '8px 10px' }}>{currentT.email_label}</th>
                    <th style={{ padding: '8px 10px' }}>{currentT.registered_date}</th>
                    <th style={{ padding: '8px 10px' }}>{currentT.last_active}</th>
                    <th style={{ padding: '8px 10px' }}>🤖 {currentT.ai_queries}</th>
                    <th style={{ padding: '8px 10px' }}>🏆 {currentT.matches}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>{currentT.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u, idx) => {
                    const isUserMatias = u.username?.toLowerCase() === 'matias';
                    const feats = u.userAnalytics?.features || {};
                    const roleBadge = u.isSuperAdmin ? '👑 Super' : (u.isAdmin ? '🛡️ Admin' : '👤');

                    return (
                      <tr 
                        key={u.id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                        }}
                      >
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>@{u.username} <span style={{ color: 'var(--text-muted)' }}>({roleBadge})</span></div>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {formatRegistrationDate(u.createdAt)}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {formatLastSeen(u.userAnalytics?.lastSeen || u.lastSeen)}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                          {feats.ai_query || 0}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#2ecc71' }}>
                          {u.points || 0} pts ({u.matchesPlayed || 0}P)
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedAnalyticsUser(u)}
                              style={{ background: 'rgba(203,161,53,0.15)', border: '1px solid rgba(203,161,53,0.3)', color: 'var(--gold-primary)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}
                              title="Ver analíticas"
                            >
                              📊
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditClick(u)}
                              style={{ background: 'rgba(255,255,255,0.08)', border: 'var(--border-glass)', color: '#fff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}
                              title="Editar usuario"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBanClick(u)}
                              disabled={isUserMatias}
                              style={{ background: 'rgba(235,87,87,0.15)', border: '1px solid rgba(235,87,87,0.3)', color: '#ff6b6b', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem', opacity: isUserMatias ? 0.3 : 1 }}
                              title="Banear usuario"
                            >
                              🚫
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VISTA DE TARJETAS DETALLADAS CON HISTÓRICO Y ACTIVIDAD */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedUsers.map((u, idx) => {
                const isUserMatias = u.username?.toLowerCase() === 'matias';
                const roleLabel = u.isSuperAdmin 
                  ? currentT.super_admin 
                  : (u.isAdmin ? currentT.admin : currentT.player);
                
                let statusBadgeColor = 'var(--success-color)';
                let statusLabel = currentT.approved;
                if (u.status === 'suspended') {
                  statusBadgeColor = 'var(--warning-color)';
                  statusLabel = `${currentT.suspended} (${u.banUntil})`;
                } else if (u.status === 'blocked') {
                  statusBadgeColor = 'var(--danger-color)';
                  statusLabel = currentT.blocked;
                }

                const uA = u.userAnalytics || {};
                const feats = uA.features || {};

                return (
                  <div 
                    key={u.id} 
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {/* Header de la tarjeta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{idx + 1}</span>
                          {u.name} 
                          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'var(--gold-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                            @{u.username}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {u.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          fontWeight: 'bold', 
                          background: u.isSuperAdmin ? 'rgba(203, 161, 53, 0.15)' : (u.isAdmin ? 'rgba(255,255,255,0.1)' : 'transparent'),
                          color: u.isSuperAdmin ? 'var(--gold-primary)' : (u.isAdmin ? '#fff' : 'var(--text-muted)'),
                          border: u.isSuperAdmin ? '1px solid rgba(203, 161, 53, 0.4)' : (u.isAdmin ? '1px solid rgba(255,255,255,0.2)' : 'none'),
                          padding: '2px 6px', 
                          borderRadius: '4px' 
                        }}>
                          {roleLabel}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: statusBadgeColor, fontWeight: '500' }}>
                          ● {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Fila de Fechas de Registro y Conexión */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      gap: '6px',
                      background: 'rgba(203, 161, 53, 0.05)',
                      border: '1px solid rgba(203, 161, 53, 0.15)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.73rem'
                    }}>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        📅 <strong>{currentT.registered_date}:</strong> <span style={{ color: '#fff' }}>{formatRegistrationDate(u.createdAt)}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        🕒 <strong>{currentT.last_active}:</strong> <span style={{ color: 'var(--gold-primary)' }}>{formatLastSeen(uA.lastSeen || u.lastSeen)}</span>
                      </div>
                    </div>

                    {/* Resumen de actividad y uso de la web por este usuario */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {currentT.recent_activity}:
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', padding: '2px 6px', borderRadius: '4px', color: 'var(--gold-primary)' }}>
                        🤖 {feats.ai_query || 0} {currentT.ai_queries}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>
                        🎲 {feats.calculator_run || 0} {currentT.calc_runs}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>
                        📜 {feats.mission_view || 0} {currentT.mission_views}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', padding: '2px 6px', borderRadius: '4px', color: '#2ecc71' }}>
                        🏆 {u.points || 0} pts ({u.wins || 0}V-{u.draws || 0}E-{u.losses || 0}D)
                      </span>
                    </div>

                    {/* Datos de contacto y facción */}
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '6px 8px', borderRadius: '4px' }}>
                      <div><strong>{currentT.location_label}:</strong> {u.location || '-'}</div>
                      <div><strong>{currentT.phone_label}:</strong> {u.phone || '-'}</div>
                      <div><strong>{currentT.faction}:</strong> {u.faction || '-'} ({u.alignment === 'oscuridad' ? currentT.oscuridad : currentT.luz})</div>
                      <div><strong>{currentT.matches}:</strong> {u.matchesPlayed || 0} {lang === 'es' ? 'jugadas' : 'played'}</div>
                    </div>

                    {u.banReason && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--danger-color)', fontStyle: 'italic', background: 'rgba(235, 87, 87, 0.05)', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid var(--danger-color)' }}>
                        <strong>{currentT.ban_reason}</strong> {u.banReason}
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-small" 
                        onClick={() => setSelectedAnalyticsUser(u)}
                        style={{ 
                          flex: 1, 
                          padding: '4px 0', 
                          minHeight: '30px', 
                          background: 'rgba(203, 161, 53, 0.12)', 
                          color: 'var(--gold-primary)', 
                          border: '1px solid rgba(203, 161, 53, 0.35)' 
                        }}
                        title={lang === 'es' ? 'Ver qué ha hecho este usuario en la app' : 'View what this user did on the app'}
                      >
                        📊 {lang === 'es' ? 'Ver Qué Hizo (Analíticas)' : 'Activity & Analytics'}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-small" 
                        onClick={() => handleEditClick(u)}
                        style={{ flex: 1, padding: '4px 0', minHeight: '30px' }}
                      >
                        ✏️ {currentT.edit}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-small" 
                        onClick={() => handleBanClick(u)}
                        disabled={isUserMatias}
                        style={{ 
                          flex: 1, 
                          padding: '4px 0', 
                          minHeight: '30px', 
                          opacity: isUserMatias ? 0.3 : 1,
                          background: 'rgba(235, 87, 87, 0.1)', 
                          color: '#ff6b6b', 
                          border: '1px solid rgba(235, 87, 87, 0.3)' 
                        }}
                      >
                        🚫 {currentT.ban_btn}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-small" 
                        onClick={() => handleDelete(u)}
                        disabled={isUserMatias}
                        style={{ flex: 1, padding: '4px 0', minHeight: '30px', opacity: isUserMatias ? 0.3 : 1 }}
                      >
                        🗑️ {currentT.delete}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL DE ANALÍTICAS INDIVIDUALES DEL USUARIO */}
      {selectedAnalyticsUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#141414',
            border: '1px solid var(--gold-primary)',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
          }}>
            {/* Header del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>📊</span>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--gold-primary)', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                    {selectedAnalyticsUser.name}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    @{selectedAnalyticsUser.username} • {selectedAnalyticsUser.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnalyticsUser(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Tarjetas de Métricas de Sesión y Tiempo */}
            {(() => {
              const uA = selectedAnalyticsUser.userAnalytics || {};
              const feats = uA.features || {};
              const durSec = uA.totalDurationSec || 0;
              const durMin = Math.floor(durSec / 60);
              const durSecRem = durSec % 60;
              const durFormatted = durMin > 60 
                ? `${(durMin / 60).toFixed(1)} h (${durMin} min)`
                : `${durMin}m ${durSecRem}s`;

              const lastSeenFormatted = formatLastSeen(uA.lastSeen || selectedAnalyticsUser.lastSeen);
              const registeredFormatted = formatRegistrationDate(selectedAnalyticsUser.createdAt);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Grid 1: Conexión y Tiempo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: 'var(--border-glass)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 {currentT.registered_date}:</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginTop: '2px' }}>{registeredFormatted}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: 'var(--border-glass)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🕒 {currentT.last_active}:</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2ecc71', marginTop: '2px' }}>{lastSeenFormatted}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: 'var(--border-glass)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⏱️ {lang === 'es' ? 'Tiempo en App:' : 'Time on App:'}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{durFormatted}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: 'var(--border-glass)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🔄 {lang === 'es' ? 'Sesiones totales:' : 'Total Sessions:'}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{uA.sessionsCount || 1} {lang === 'es' ? 'visitas' : 'visits'}</div>
                    </div>
                  </div>

                  {/* Sección 2: Uso de Funcionalidades por este Jugador */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                      🛠️ {lang === 'es' ? 'Herramientas y Acciones Usadas:' : 'Tools & Actions Used:'}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>🤖 {lang === 'es' ? 'Consultas a Lobelia IA:' : 'AI Rules Queries:'}</span>
                        <strong style={{ color: 'var(--gold-primary)' }}>{feats.ai_query || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>🎲 {lang === 'es' ? 'Cálculos de Combate / Dados:' : 'Combat Calculations:'}</span>
                        <strong style={{ color: '#fff' }}>{feats.calculator_run || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>📜 {lang === 'es' ? 'Misiones Consultadas:' : 'Missions Viewed:'}</span>
                        <strong style={{ color: '#fff' }}>{feats.mission_view || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>🏆 {lang === 'es' ? 'Partidas Oficiales Jugadas:' : 'Official Matches Played:'}</span>
                        <strong style={{ color: '#2ecc71' }}>{selectedAnalyticsUser.matchesPlayed || 0} ({selectedAnalyticsUser.wins || 0}V - {selectedAnalyticsUser.draws || 0}E - {selectedAnalyticsUser.losses || 0}D)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: Rendimiento de Juego */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                      ⚔️ {lang === 'es' ? 'Rendimiento y Puntuación:' : 'Performance & Scores:'}
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      <div>• <strong>{lang === 'es' ? 'Puntos Totales:' : 'Total Points:'}</strong> {selectedAnalyticsUser.points || 0} pts</div>
                      <div>• <strong>{lang === 'es' ? 'VP Ratio:' : 'VP Ratio:'}</strong> {selectedAnalyticsUser.vpScored || 0} / {selectedAnalyticsUser.vpConceded || 0}</div>
                      <div>• <strong>{lang === 'es' ? 'Líderes Eliminados:' : 'Leaders Killed:'}</strong> {selectedAnalyticsUser.leadersKilled || 0}</div>
                      <div>• <strong>{lang === 'es' ? 'Líderes Perdidos:' : 'Leaders Lost:'}</strong> {selectedAnalyticsUser.leadersLost || 0}</div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Botón Cerrar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setSelectedAnalyticsUser(null)}
                style={{ minWidth: '100px' }}
              >
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
