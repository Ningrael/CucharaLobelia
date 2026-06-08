// src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function UserManagement({ lang, currentUserId, currentUsername, showAlert, showConfirm }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit and Ban views states
  const [editingUser, setEditingUser] = useState(null);
  const [banningUser, setBanningUser] = useState(null);
  
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
      title: "Gestión de Usuarios",
      search_placeholder: "Buscar por nombre, usuario o email...",
      no_users: "No se encontraron usuarios.",
      loading: "Cargando usuarios...",
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
      oscuridad: "Oscuridad"
    },
    en: {
      title: "User Management",
      search_placeholder: "Search by name, username or email...",
      no_users: "No users found.",
      loading: "Loading users...",
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
      oscuridad: "Darkness"
    }
  };

  const currentT = t[lang] || t['es'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "players"));
      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
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
    // Check protection
    if (user.username?.toLowerCase() === 'matias') {
      showAlert(currentT.protect_super);
      return;
    }
    setBanningUser(user);
    setEditingUser(null);
    setEditStatus(user.status === 'approved' || !user.status ? 'suspended' : user.status);
    setEditBanUntil(user.banUntil || '');
    setEditBanReason(user.banReason || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    // Protection checks
    const targetIsMatias = editingUser.username?.toLowerCase() === 'matias';
    if (targetIsMatias) {
      if (editStatus !== 'approved' || !editIsAdmin || !editIsSuperAdmin) {
        showAlert(currentT.protect_super);
        return;
      }
    }

    // Prevent self-demotion
    if (editingUser.id === currentUserId && !editIsAdmin) {
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
    setIsSaving(true);
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

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.username || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.location || '').toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxHeight: '70vh', overflowY: 'auto' }}>
      <h3 style={{ color: 'var(--gold-primary)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px', margin: 0, fontSize: '1.2rem' }}>
        {currentT.title}
      </h3>

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
              <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
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
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} disabled={editingUser.username?.toLowerCase() === 'matias'} style={{ background: '#111', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }}>
                <option value="approved">{currentT.approved}</option>
                <option value="suspended">{currentT.suspended}</option>
                <option value="blocked">{currentT.blocked}</option>
              </select>
            </div>
          </div>

          {editStatus === 'suspended' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.ban_until}</label>
              <input type="date" value={editBanUntil} onChange={e => setEditBanUntil(e.target.value)} required style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
          )}

          {(editStatus === 'suspended' || editStatus === 'blocked') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{currentT.ban_reason}</label>
              <input type="text" value={editBanReason} onChange={e => setEditBanReason(e.target.value)} placeholder={currentT.ban_reason_placeholder} required style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.82rem' }} />
            </div>
          )}

          {/* ADMIN & SUPER ADMIN CHECKBOXES */}
          <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px', border: 'var(--border-glass)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={editIsAdmin} onChange={e => setEditIsAdmin(e.target.checked)} disabled={editingUser.username?.toLowerCase() === 'matias'} />
              <span>{currentT.admin}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={editIsSuperAdmin} onChange={e => setEditIsSuperAdmin(e.target.checked)} disabled={editingUser.username?.toLowerCase() === 'matias'} />
              <span>{currentT.super_admin}</span>
            </label>
          </div>

          {/* STATS SECTION */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              📊 {currentT.stats_label}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.points}</label>
                <input type="number" min="0" value={editPoints} onChange={e => setEditPoints(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.matches}</label>
                <input type="number" min="0" value={editMatchesPlayed} onChange={e => setEditMatchesPlayed(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.wins}</label>
                <input type="number" min="0" value={editWins} onChange={e => setEditWins(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.draws}</label>
                <input type="number" min="0" value={editDraws} onChange={e => setEditDraws(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.losses}</label>
                <input type="number" min="0" value={editLosses} onChange={e => setEditLosses(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.vp_scored}</label>
                <input type="number" min="0" value={editVpScored} onChange={e => setEditVpScored(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.vp_conceded}</label>
                <input type="number" min="0" value={editVpConceded} onChange={e => setEditVpConceded(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.leaders_killed}</label>
                <input type="number" min="0" value={editLeadersKilled} onChange={e => setEditLeadersKilled(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentT.leaders_lost}</label>
                <input type="number" min="0" value={editLeadersLost} onChange={e => setEditLeadersLost(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: '4px', color: '#fff', padding: '6px', fontSize: '0.78rem' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ flex: 1 }}>
              {isSaving ? currentT.saving : currentT.save}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>
              {currentT.cancel}
            </button>
          </div>
        </form>
      ) : banningUser ? (
        /* QUICK BAN VIEW */
        <form onSubmit={handleSaveBan} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(235, 87, 87, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(235, 87, 87, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--danger-color)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚫 {currentT.quick_ban_title}: @{banningUser.username}
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
        /* USER LIST VIEW */
        <>
          <div style={{ position: 'relative', width: '100%' }}>
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
                padding: '10px 12px',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              {currentT.loading}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {currentT.no_users}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredUsers.map(u => {
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

                return (
                  <div 
                    key={u.id} 
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.name} 
                          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>
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

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '4px' }}>
                      <div><strong>{currentT.location_label}:</strong> {u.location || '-'}</div>
                      <div><strong>{currentT.phone_label}:</strong> {u.phone || '-'}</div>
                      <div><strong>{currentT.faction}:</strong> {u.faction || '-'} ({u.alignment === 'oscuridad' ? currentT.oscuridad : currentT.luz})</div>
                      <div><strong>{currentT.points}:</strong> {u.points || 0} pts ({u.wins || 0}V - {u.draws || 0}E - {u.losses || 0}D)</div>
                    </div>

                    {u.banReason && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--danger-color)', fontStyle: 'italic', background: 'rgba(235, 87, 87, 0.05)', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid var(--danger-color)' }}>
                        <strong>{currentT.ban_reason}</strong> {u.banReason}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
    </div>
  );
}
