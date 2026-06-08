// src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Modal from './components/Modal';

// Firebase & Auth
import { auth, db } from './utils/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import UserManagement from './components/UserManagement';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  orderBy
} from 'firebase/firestore';

// Factions
import {
  LIGHT_FACTIONS,
  LIGHT_FACTIONS_LEGEND,
  DARK_FACTIONS,
  DARK_FACTIONS_LEGEND
} from './utils/factions';

// Importar Vistas
import Home from './views/Home';
import Calculator from './views/Calculator';
import Missions from './views/Missions';
import Calendar from './views/Calendar';
import League from './views/League';
import logoImg from './assets/hero.png';

// Importar Traducciones
import translations from './i18n/translations.json';

const ADMIN_USERNAMES = ['matias', 'admin'];

export default function App() {
  // 1. Estado de Navegación ('home', 'missions', 'calculator', 'calendar', 'league')
  const [currentView, setView] = useState('home');

  // 2. Estado de Idioma (se detecta del navegador o localStorage, por defecto 'es')
  const [lang, setLang] = useState(() => {
    try {
      const stored = localStorage.getItem('lobelia_lang');
      if (stored === 'es' || stored === 'en') return stored;
    } catch (_) {}
    
    const navLang = navigator.language || navigator.userLanguage || '';
    return navLang.startsWith('en') ? 'en' : 'es';
  });

  // Guardar idioma preferido al cambiar
  useEffect(() => {
    try {
      localStorage.setItem('lobelia_lang', lang);
    } catch (_) {}
  }, [lang]);

  // 3. Estado del Modal "Acerca de"
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // 4. Estados de Autenticación Global
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Estados del Modal de Perfil/Login
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot_password'
  
  // Inputs del formulario de Auth
  const [usernameInput, setUsernameInput] = useState('');
  const [nickInput, setNickInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Estados del Formulario de Recuperación
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingForgotPassword, setIsSendingForgotPassword] = useState(false);

  // Estados de Gestión de Cuenta (Editar Perfil / Cambiar Contraseña)
  const [profileTab, setProfileTab] = useState('view'); // 'view' | 'edit_profile' | 'change_password'
  const [editNickInput, setEditNickInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editPhoneInput, setEditPhoneInput] = useState('');
  const [editLocationInput, setEditLocationInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  
  // Preferencia de notificaciones de correo para PMs
  const [editEmailNotifications, setEditEmailNotifications] = useState(true);

  // Estados de Mensajería Privada (PM)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Sincronizar inputs de edición con el perfil activo
  useEffect(() => {
    if (profile) {
      setEditNickInput(profile.name || '');
      setEditEmailInput(profile.email || '');
      setEditPhoneInput(profile.phone || '');
      setEditLocationInput(profile.location || '');
      setEditEmailNotifications(profile.emailNotifications !== false);
    }
  }, [profile]);

  // Resetear estados al abrir/cerrar el modal
  useEffect(() => {
    if (!isAuthModalOpen) {
      setProfileTab('view');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
    }
  }, [isAuthModalOpen]);

  // Estados y método para Alertas con modal premium
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  const showAlert = (message) => {
    setAlertModalMessage(message);
    setIsAlertModalOpen(true);
  };

  const alert = (message) => {
    showAlert(message);
  };

  // Estados y método para Confirmaciones con modal premium
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalOnConfirm, setConfirmModalOnConfirm] = useState(null);

  const showConfirm = (message, onConfirmCallback) => {
    setConfirmModalMessage(message);
    setConfirmModalOnConfirm(() => onConfirmCallback);
    setIsConfirmModalOpen(true);
  };

  // Escucha del estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'players', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          
          // Verify ban/block status
          const isBlocked = profileData.status === 'blocked' || profileData.status === 'deleted';
          const isSuspended = profileData.status === 'suspended' && profileData.banUntil && new Date(profileData.banUntil) > new Date();
          
          if (isBlocked || isSuspended) {
            const reason = profileData.banReason || (lang === 'es' ? 'No especificado' : 'Not specified');
            let banMessage = '';
            if (isBlocked) {
              banMessage = lang === 'es'
                ? `Tu cuenta ha sido bloqueada permanentemente. Motivo: ${reason}`
                : `Your account has been permanently blocked. Reason: ${reason}`;
            } else {
              banMessage = lang === 'es'
                ? `Tu cuenta ha sido suspendida hasta el ${profileData.banUntil}. Motivo: ${reason}`
                : `Your account has been suspended until ${profileData.banUntil}. Reason: ${reason}`;
            }
            
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            await signOut(auth);
            showAlert(banMessage);
            setAuthLoading(false);
            return;
          }

          setProfile(profileData);
          const isUserSuperAdmin = profileData.username?.toLowerCase() === 'matias' || profileData.isSuperAdmin === true;
          const isUserAdmin = ADMIN_USERNAMES.includes(profileData.username?.toLowerCase()) || profileData.isAdmin === true || isUserSuperAdmin;
          setIsAdmin(isUserAdmin);

          // Auto-fix invalid profile fields for Firestore schema compliance
          if (
            profileData.vpScored === null || profileData.vpScored === undefined || profileData.vpScored < 0 ||
            profileData.vpConceded === null || profileData.vpConceded === undefined || profileData.vpConceded < 0 ||
            profileData.leadersKilled === null || profileData.leadersKilled === undefined || profileData.leadersKilled < 0 ||
            profileData.leadersLost === null || profileData.leadersLost === undefined || profileData.leadersLost < 0 ||
            profileData.points === undefined || profileData.points === null || profileData.points < 0 ||
            profileData.matchesPlayed === undefined || profileData.matchesPlayed === null || profileData.matchesPlayed < 0 ||
            profileData.wins === undefined || profileData.wins === null || profileData.wins < 0 ||
            profileData.draws === undefined || profileData.draws === null || profileData.draws < 0 ||
            profileData.losses === undefined || profileData.losses === null || profileData.losses < 0 ||
            profileData.isAdmin === undefined || profileData.isAdmin === null ||
            profileData.isSuperAdmin === undefined || profileData.isSuperAdmin === null ||
            (profileData.username?.toLowerCase() === 'matias' && (profileData.isAdmin !== true || profileData.isSuperAdmin !== true))
          ) {
            console.log("Auto-fixing invalid profile fields for Firestore schema compliance...");
            const fixedFields = {};
            if (profileData.points === undefined || profileData.points === null || profileData.points < 0) fixedFields.points = 0;
            if (profileData.matchesPlayed === undefined || profileData.matchesPlayed === null || profileData.matchesPlayed < 0) fixedFields.matchesPlayed = 0;
            if (profileData.wins === undefined || profileData.wins === null || profileData.wins < 0) fixedFields.wins = 0;
            if (profileData.draws === undefined || profileData.draws === null || profileData.draws < 0) fixedFields.draws = 0;
            if (profileData.losses === undefined || profileData.losses === null || profileData.losses < 0) fixedFields.losses = 0;
            if (profileData.vpScored === null || profileData.vpScored === undefined || profileData.vpScored < 0) fixedFields.vpScored = 0;
            if (profileData.vpConceded === null || profileData.vpConceded === undefined || profileData.vpConceded < 0) fixedFields.vpConceded = 0;
            if (profileData.leadersKilled === null || profileData.leadersKilled === undefined || profileData.leadersKilled < 0) fixedFields.leadersKilled = 0;
            if (profileData.leadersLost === null || profileData.leadersLost === undefined || profileData.leadersLost < 0) fixedFields.leadersLost = 0;
            if (profileData.isAdmin === undefined || profileData.isAdmin === null) fixedFields.isAdmin = isUserAdmin;
            if (profileData.isSuperAdmin === undefined || profileData.isSuperAdmin === null) fixedFields.isSuperAdmin = isUserSuperAdmin;
            
            // Explicitly force Matias's fields
            if (profileData.username?.toLowerCase() === 'matias') {
              fixedFields.isAdmin = true;
              fixedFields.isSuperAdmin = true;
            }

            try {
              await updateDoc(docRef, fixedFields);
              console.log("Profile fields auto-fixed successfully!");
              const freshSnap = await getDoc(docRef);
              if (freshSnap.exists()) {
                setProfile(freshSnap.data());
              }
            } catch (err) {
              console.warn("Failed to auto-fix profile fields:", err.message);
            }
          }
        } else {
          const baseName = currentUser.email.split('@')[0];
          const defaultProfile = {
            username: baseName,
            name: baseName,
            phone: '',
            faction: 'Desconocida',
            alignment: 'luz',
            status: 'pending',
            isAdmin: false,
            points: 0,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            vpScored: 0,
            vpConceded: 0,
            leadersKilled: 0,
            leadersLost: 0
          };
          await setDoc(docRef, defaultProfile);
          setProfile(defaultProfile);
          setIsAdmin(ADMIN_USERNAMES.includes(baseName.toLowerCase()));
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Escuchar chats en tiempo real y calcular unreadCount
  useEffect(() => {
    if (!user) {
      setChats([]);
      setUnreadCount(0);
      return;
    }

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = [];
      let unreadSum = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const chatItem = { id: docSnap.id, ...data };
        chatList.push(chatItem);
        if (data.unread && data.unread[user.uid] === true) {
          unreadSum++;
        }
      });
      chatList.sort((a, b) => {
        const tA = a.lastUpdated?.toMillis ? a.lastUpdated.toMillis() : (a.lastUpdated || 0);
        const tB = b.lastUpdated?.toMillis ? b.lastUpdated.toMillis() : (b.lastUpdated || 0);
        return tB - tA;
      });
      setChats(chatList);
      setUnreadCount(unreadSum);
    });

    return () => unsubscribe();
  }, [user]);

  // Escuchar mensajes del chat activo y marcar como leído
  useEffect(() => {
    if (!activeChat || !user) {
      setChatMessages([]);
      return;
    }

    const messagesRef = collection(db, "chats", activeChat.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = [];
      snapshot.forEach(docSnap => {
        msgList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setChatMessages(msgList);

      if (activeChat.unread && activeChat.unread[user.uid] === true) {
        const docRef = doc(db, "chats", activeChat.id);
        updateDoc(docRef, {
          [`unread.${user.uid}`]: false
        }).catch(err => console.warn("Failed to mark chat as read:", err.message));
      }
    });

    return () => unsubscribe();
  }, [activeChat, user]);

  // Iniciar o reanudar conversación
  const handleStartChat = async (recipientUid, recipientNick, recipientUsername) => {
    if (!user || !profile) return;
    if (user.uid === recipientUid) {
      alert(lang === 'es' ? "No puedes chatear contigo mismo." : "You cannot chat with yourself.");
      return;
    }

    const chatId = user.uid < recipientUid ? `${user.uid}_${recipientUid}` : `${recipientUid}_${user.uid}`;
    const chatDocRef = doc(db, "chats", chatId);

    try {
      const chatDoc = await getDoc(chatDocRef);
      let chatData = null;

      if (!chatDoc.exists()) {
        chatData = {
          participants: [user.uid, recipientUid],
          lastMessage: '',
          lastUpdated: new Date(),
          unread: {
            [user.uid]: false,
            [recipientUid]: false
          },
          nicks: {
            [user.uid]: profile.name || user.email.split('@')[0],
            [recipientUid]: recipientNick
          },
          usernames: {
            [user.uid]: profile.username || user.email.split('@')[0],
            [recipientUid]: recipientUsername
          }
        };
        await setDoc(chatDocRef, chatData);
        chatData.id = chatId;
      } else {
        chatData = { id: chatId, ...chatDoc.data() };
      }

      setActiveChat(chatData);
      setIsChatModalOpen(true);
    } catch (err) {
      console.error("Error starting chat:", err);
      alert(lang === 'es' ? "Error al iniciar chat: " + err.message : "Error starting chat: " + err.message);
    }
  };

  // Enviar mensaje e integrar correo en /mail
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!user || !activeChat || !newMessageText.trim()) return;

    const messageText = newMessageText.trim();
    setNewMessageText('');
    setIsSendingMessage(true);

    try {
      const recipientUid = activeChat.participants.find(uid => uid !== user.uid);

      const messagesRef = collection(db, "chats", activeChat.id, "messages");
      await addDoc(messagesRef, {
        senderId: user.uid,
        text: messageText,
        timestamp: new Date()
      });

      const chatDocRef = doc(db, "chats", activeChat.id);
      await updateDoc(chatDocRef, {
        lastMessage: messageText,
        lastUpdated: new Date(),
        [`unread.${recipientUid}`]: true
      });

      const recipientDocRef = doc(db, "players", recipientUid);
      const recipientDoc = await getDoc(recipientDocRef);
      if (recipientDoc.exists()) {
         const recipientData = recipientDoc.data();
         if (recipientData.emailNotifications !== false && recipientData.email) {
           const senderNick = profile.name || user.email.split('@')[0];
           const senderUsername = profile.username || user.email.split('@')[0];
           const recipientNick = recipientData.name || recipientData.email.split('@')[0];

           await addDoc(collection(db, "mail"), {
             to: recipientData.email,
             recipientUid: recipientUid,
             message: {
               subject: lang === 'es' ? `Nuevo mensaje de ${senderNick} en La Cuchara de Lobelia` : `New message from ${senderNick} on La Cuchara de Lobelia`,
               text: lang === 'es' 
                 ? `Hola ${recipientNick},\n\nHas recibido un nuevo mensaje privado de ${senderNick} (@${senderUsername}) en La Cuchara de Lobelia MESBG Companion.\n\nMensaje:\n"${messageText}"\n\nPuedes responder ingresando a la web: ${window.location.origin}\n\nUn saludo,\nLa Cuchara de Lobelia`
                 : `Hello ${recipientNick},\n\nYou have received a new private message from ${senderNick} (@${senderUsername}) on La Cuchara de Lobelia MESBG Companion.\n\nMessage:\n"${messageText}"\n\nYou can reply by entering the web: ${window.location.origin}\n\nBest regards,\nLa Cuchara de Lobelia`,
               html: `<div style="font-family: sans-serif; padding: 20px; background-color: #112114; color: #fff; border-radius: 8px; border: 1px solid #cba135;">
                        <h2 style="color: #cba135; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-top: 0;">La Cuchara de Lobelia MESBG</h2>
                        <p>${lang === 'es' ? `Hola <strong>${recipientNick}</strong>,` : `Hello <strong>${recipientNick}</strong>,`}</p>
                        <p>${lang === 'es' ? `Has recibido un nuevo mensaje privado de <strong>${senderNick}</strong> (@${senderUsername}):` : `You have received a new private message from <strong>${senderNick}</strong> (@${senderUsername}):`}</p>
                        <blockquote style="background: rgba(0,0,0,0.3); padding: 12px; border-left: 4px solid #cba135; color: #ddd; margin: 15px 0; border-radius: 4px; font-style: italic;">
                          "${messageText}"
                        </blockquote>
                        <p><a href="${window.location.origin}" style="display: inline-block; background: #cba135; color: #000; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 4px; margin-top: 10px;">${lang === 'es' ? '👉 Responder en la Web' : '👉 Reply on Web'}</a></p>
                        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />
                        <p style="font-size: 0.8rem; color: #888; margin-bottom: 0;">${lang === 'es' ? 'Este es un correo automático. Puedes desactivar estas notificaciones desde los ajustes de tu cuenta en la web.' : 'This is an automatic email. You can disable these notifications from your account settings on the web.'}</p>
                      </div>`
             }
           });
         }
      }
    } catch (err) {
      console.warn("Failed to send message/email:", err.message);
    }
    setIsSendingMessage(false);
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser({ ...updatedUser });
      if (updatedUser.emailVerified) {
        alert(lang === 'es' ? "¡Correo verificado con éxito!" : "Email successfully verified!");
      } else {
        alert(
          lang === 'es'
            ? "El correo aún no ha sido verificado. Revisa tu bandeja de entrada."
            : "Email has not been verified yet. Please check your inbox."
        );
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'es' ? "Error al actualizar: " + err.message : "Error refreshing: " + err.message);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      alert(
        lang === 'es'
          ? "Correo de verificación reenviado. Revisa tu bandeja de entrada."
          : "Verification email resent. Please check your inbox."
      );
    } catch (err) {
      console.error(err);
      alert(lang === 'es' ? "Error al reenviar: " + err.message : "Error resending: " + err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    const newNick = editNickInput.trim();
    const newEmail = editEmailInput.trim();
    const newPhone = editPhoneInput.trim();
    const newLocation = editLocationInput.trim();
    
    if (!newNick || !newEmail || !newLocation) {
      alert(lang === 'es' ? "Completa todos los campos obligatorios." : "Please fill out all required fields.");
      return;
    }
    
    setIsUpdatingAccount(true);
    try {
      const docRef = doc(db, "players", user.uid);
      const emailChanged = newEmail.toLowerCase() !== profile.email?.toLowerCase();
      
      // Si el correo cambió, actualizamos en Firebase Auth
      if (emailChanged) {
        try {
          await updateEmail(auth.currentUser, newEmail);
          await sendEmailVerification(auth.currentUser);
          // Forzar refresh de la sesión local
          setUser({ ...auth.currentUser });
        } catch (authErr) {
          console.error("Failed to update email in Auth:", authErr);
          if (authErr.code === 'auth/requires-recent-login') {
            alert(
              lang === 'es'
                ? "Por motivos de seguridad, para cambiar tu correo electrónico debes cerrar sesión y volver a iniciarla."
                : "For security reasons, you must log out and log back in to change your email address."
            );
            setIsUpdatingAccount(false);
            return;
          }
          if (authErr.code === 'auth/email-already-in-use') {
            alert(
              lang === 'es'
                ? "El correo electrónico ya se encuentra en uso por otra cuenta."
                : "The email address is already in use by another account."
            );
            setIsUpdatingAccount(false);
            return;
          }
          throw authErr;
        }
      }
      
      const updatedFields = {
        name: newNick,
        email: newEmail,
        phone: newPhone,
        location: newLocation,
        emailNotifications: editEmailNotifications
      };
      
      await updateDoc(docRef, updatedFields);
      
      // Actualizar perfil local
      setProfile(prev => ({
        ...prev,
        ...updatedFields
      }));
      
      alert(
        lang === 'es'
          ? emailChanged
            ? "Perfil actualizado con éxito. Se envió un correo de verificación a la nueva dirección."
            : "Perfil actualizado con éxito."
          : emailChanged
            ? "Profile updated successfully. A verification email has been sent to the new address."
            : "Profile updated successfully."
      );
      setProfileTab('view');
    } catch (err) {
      console.error(err);
      alert(lang === 'es' ? `Error al actualizar perfil: ${err.message}` : `Error updating profile: ${err.message}`);
    }
    setIsUpdatingAccount(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    if (!newPasswordInput) {
      alert(lang === 'es' ? "Introduce la nueva contraseña." : "Please enter the new password.");
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      alert(lang === 'es' ? "Las contraseñas no coinciden." : "Passwords do not match.");
      return;
    }
    
    setIsUpdatingAccount(true);
    try {
      await updatePassword(auth.currentUser, newPasswordInput);
      alert(lang === 'es' ? "Contraseña cambiada con éxito." : "Password changed successfully.");
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
      setProfileTab('view');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        alert(
          lang === 'es'
            ? "Por motivos de seguridad, para cambiar tu contraseña debes cerrar sesión y volver a iniciarla."
            : "For security reasons, you must log out and log back in to change your password."
        );
      } else {
        alert(lang === 'es' ? `Error al cambiar contraseña: ${err.message}` : `Error changing password: ${err.message}`);
      }
    }
    setIsUpdatingAccount(false);
  };

  // Handlers de Auth
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      alert(lang === 'es' ? "Introduce tus credenciales." : "Please enter your credentials.");
      return;
    }
    setIsSubmittingAuth(true);
    const input = usernameInput.trim().toLowerCase();
    let email = '';
    
    try {
      if (input.includes('@')) {
        email = input;
      } else {
        // Consultar Firestore para ver si existe el usuario y su email
        const qUser = query(collection(db, "players"), where("username", "==", input));
        const qSnap = await getDocs(qUser);
        if (!qSnap.empty) {
          const pData = qSnap.docs[0].data();
          email = pData.email || `${input}@cucharalobelia.com`;
        } else {
          // Fallback para cuentas de prueba existentes
          email = `${input}@cucharalobelia.com`;
        }
      }
      
      await signInWithEmailAndPassword(auth, email, passwordInput);
      setUsernameInput('');
      setPasswordInput('');
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(lang === 'es' ? "Nombre de usuario o contraseña incorrectos." : "Incorrect username or password.");
    }
    setIsSubmittingAuth(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      alert(lang === 'es' ? "Por favor ingresa tu correo electrónico." : "Please enter your email address.");
      return;
    }
    setIsSendingForgotPassword(true);
    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail.trim());
      alert(
        lang === 'es'
          ? "Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico."
          : "A password reset link has been sent to your email address."
      );
      setForgotPasswordEmail('');
      setAuthMode('login');
    } catch (err) {
      console.error(err);
      alert(
        lang === 'es'
          ? `Error al enviar el correo: ${err.message}`
          : `Error sending email: ${err.message}`
      );
    }
    setIsSendingForgotPassword(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const sanitizedUsername = usernameInput.trim().toLowerCase();
    const sanitizedNick = nickInput.trim();
    const realEmail = emailInput.trim();
    
    if (!sanitizedUsername || !sanitizedNick || !passwordInput || !realEmail || !locationInput) {
      alert(lang === 'es' ? "Completa todo el formulario." : "Please fill out the entire form.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      alert(lang === 'es' ? "Las contraseñas no coinciden." : "Passwords do not match.");
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const qUser = query(collection(db, "players"), where("username", "==", sanitizedUsername));
      const qSnap = await getDocs(qUser);
      if (!qSnap.empty) {
        alert(lang === 'es' ? "El usuario ya existe." : "Username already exists.");
        setIsSubmittingAuth(false);
        return;
      }

      // Crear usuario en Firebase Auth con email real
      const cred = await createUserWithEmailAndPassword(auth, realEmail, passwordInput);

      // Enviar correo de verificación
      try {
        await sendEmailVerification(cred.user);
      } catch (verifErr) {
        console.error("Failed to send email verification:", verifErr);
      }

      const isMatias = sanitizedUsername === 'matias';
      const newProfile = {
        username: sanitizedUsername,
        name: sanitizedNick,
        email: realEmail,
        phone: phoneInput.trim(),
        location: locationInput.trim(),
        status: 'approved',
        isAdmin: isMatias || ADMIN_USERNAMES.includes(sanitizedUsername),
        isSuperAdmin: isMatias,
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        vpScored: 0,
        vpConceded: 0,
        leadersKilled: 0,
        leadersLost: 0,
        emailNotifications: true
      };

      await setDoc(doc(db, "players", cred.user.uid), newProfile);
      setProfile(newProfile);
      setIsAdmin(newProfile.isAdmin);

      setUsernameInput('');
      setNickInput('');
      setPasswordInput('');
      setConfirmPasswordInput('');
      setEmailInput('');
      setPhoneInput('');
      setLocationInput('');
      setIsAuthModalOpen(false);
      alert(
        lang === 'es'
          ? "Registro exitoso. Se ha enviado un correo de verificación. Por favor, verifica tu cuenta para unirte a las ligas."
          : "Registration successful. A verification email has been sent. Please verify your account to join leagues."
      );
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
        alert(
          lang === 'es'
            ? "El correo electrónico ya se encuentra en uso por otra cuenta."
            : "The email address is already in use by another account."
        );
      } else {
        alert(lang === 'es' ? `Error al registrar: ${err.message}` : `Registration error: ${err.message}`);
      }
    }
    setIsSubmittingAuth(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthModalOpen(false);
  };

  const handleDeleteOwnAccount = async () => {
    const confirmMsg = lang === 'es'
      ? "¿Estás completamente seguro de que deseas eliminar tu cuenta? Esta acción es definitiva, borrará tu perfil y estadísticas de jugador y no se puede deshacer."
      : "Are you completely sure you want to delete your account? This action is permanent, will delete your player profile and statistics, and cannot be undone.";
      
    showConfirm(confirmMsg, async () => {
      if (!auth.currentUser) return;
      setIsUpdatingAccount(true);
      const uid = auth.currentUser.uid;
      
      try {
        // 1. Delete player document in Firestore first
        const docRef = doc(db, 'players', uid);
        await deleteDoc(docRef);
        
        // 2. Delete Firebase Auth user
        await deleteUser(auth.currentUser);
        
        // 3. Clear local states
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsAuthModalOpen(false);
        
        showAlert(
          lang === 'es'
            ? "Tu cuenta ha sido eliminada correctamente. ¡Lamentamos verte partir!"
            : "Your account has been successfully deleted. We are sorry to see you go!"
        );
      } catch (err) {
        console.error("Error deleting account:", err);
        if (err.code === 'auth/requires-recent-login') {
          showAlert(
            lang === 'es'
              ? "Por motivos de seguridad, para eliminar tu cuenta debes cerrar sesión y volver a iniciarla recientemente."
              : "For security reasons, you must log out and log back in recently to delete your account."
          );
        } else {
          showAlert(
            lang === 'es'
              ? `Error al eliminar la cuenta: ${err.message}`
              : `Error deleting account: ${err.message}`
          );
        }
      } finally {
        setIsUpdatingAccount(false);
      }
    });
  };


  // Obtener diccionario activo
  const t = translations[lang] || translations['es'];

  // Renderizar la vista activa (pasando los datos de sesión globales a la vista de Liga)
  const renderActiveView = () => {
    switch (currentView) {
      case 'home':
        return (
          <Home 
            setView={setView} 
            onOpenAbout={() => setIsAboutOpen(true)}
            lang={lang} 
            translations={translations} 
          />
        );
      case 'calculator':
        return <Calculator lang={lang} translations={translations} />;
      case 'missions':
        return <Missions lang={lang} translations={translations} />;
      case 'calendar':
        return <Calendar lang={lang} translations={translations} />;
      case 'league':
        return (
          <League 
            lang={lang} 
            translations={translations} 
            user={user}
            profile={profile}
            isAdmin={isAdmin}
            authLoading={authLoading}
            onOpenAuthModal={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            onStartChat={handleStartChat}
          />
        );
      default:
        return (
          <Home 
            setView={setView} 
            onOpenAbout={() => setIsAboutOpen(true)}
            lang={lang} 
            translations={translations} 
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Encabezado Fijo superior */}
      <header className="app-header">
        <div 
          className="logo-container" 
          onClick={() => setView('home')} 
          style={{ cursor: 'pointer' }}
        >
          <img 
            src={logoImg} 
            alt="La Cuchara de Lobelia" 
          />
        </div>

        <div className="youtube-header-center">
          <a 
            href="https://www.youtube.com/@CucharadeLobelia" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" style={{ fill: '#ff0000', display: 'inline-block', verticalAlign: 'middle' }}>
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.862.51 9.387.51 9.387.51s7.525 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span style={{ verticalAlign: 'middle', marginLeft: '6px' }}>YouTube</span>
          </a>
        </div>
        
        <div className="header-controls">
          {/* Botón de Mensajería Privada (PM) */}
          {user && (
            <button 
              className={`lang-btn ${isChatModalOpen ? 'active' : ''}`}
              onClick={() => {
                setActiveChat(null);
                setIsChatModalOpen(true);
              }}
              aria-label={lang === 'es' ? "Mensajes Privados" : "Private Messages"}
              style={{ fontSize: '1.1rem', background: 'rgba(255, 255, 255, 0.05)', position: 'relative' }}
            >
              ✉️
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--danger-color)',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #000'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Botón de Perfil / Iniciar Sesión Global */}
          {authLoading ? (
            <div style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>...</div>
          ) : (
            <button 
              className={`lang-btn ${isAuthModalOpen ? 'active' : ''}`}
              onClick={() => setIsAuthModalOpen(true)}
              aria-label={lang === 'es' ? "Perfil y cuenta de jugador" : "User profile and account"}
              style={{ fontSize: '1.1rem', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              {user ? (profile?.alignment === 'luz' ? '☀️' : '👁️') : '👤'}
            </button>
          )}

          {/* Bandera ES */}
          <button 
            className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
            onClick={() => setLang('es')}
            aria-label="Cambiar idioma a Español"
          >
            <img src="https://flagcdn.com/w20/es.png" alt="Español" />
          </button>
          
          {/* Bandera EN */}
          <button 
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
            aria-label="Switch language to English"
          >
            <img src="https://flagcdn.com/w20/gb.png" alt="English" />
          </button>
        </div>
      </header>

      {/* Renderizado de la vista principal del enrutador */}
      {user && !user.emailVerified && (
        <div className="glass-card" style={{
          background: 'rgba(247, 169, 59, 0.1)',
          border: '1px solid var(--warning-color)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-color)', fontWeight: 'bold', fontSize: '0.92rem' }}>
            <span>⚠️</span>
            <span>{lang === 'es' ? "Correo electrónico no verificado" : "Email address not verified"}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {lang === 'es'
              ? "Debes verificar tu correo electrónico para poder inscribirte a ligas o crear tus propias ligas. Revisa tu bandeja de entrada."
              : "You must verify your email address to join or create leagues. Please check your inbox."}
          </p>
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
            <button 
              className="btn btn-small"
              onClick={handleRefreshVerification}
              style={{
                background: 'var(--gold-primary)',
                color: '#000',
                border: 'none',
                minHeight: '28px',
                fontSize: '0.75rem',
                flex: '1',
                maxWidth: '180px',
                cursor: 'pointer'
              }}
            >
              🔄 {lang === 'es' ? "Ya lo verifiqué" : "I verified it"}
            </button>
            <button 
              className="btn btn-small"
              onClick={handleResendVerification}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: 'var(--border-glass)',
                minHeight: '28px',
                fontSize: '0.75rem',
                flex: '1',
                maxWidth: '180px',
                cursor: 'pointer'
              }}
            >
              ✉️ {lang === 'es' ? "Reenviar correo" : "Resend email"}
            </button>
          </div>
        </div>
      )}

      <main role="main" aria-label="Contenido Principal">
        {renderActiveView()}
      </main>

      {/* Modal Acerca De */}
      <Modal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        title={t.about_title}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🥄</span>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            {t.about_body}
          </p>
        </div>
      </Modal>

      {/* Modal de Autenticación / Perfil Global */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={user ? (lang === 'es' ? "Perfil de Jugador" : "Player Profile") : (lang === 'es' ? "Acceso de Jugador" : "Player Access")}
      >
        {user ? (
          /* VISTA: PERFIL LOGUEADO */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header con foto y nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', color: '#000' }}>
                👤
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{profile?.name || user.email.split('@')[0]}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{profile?.username}</span>
              </div>
            </div>

            {/* Menú de pestañas de navegación */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => setProfileTab('view')}
                style={{
                  background: profileTab === 'view' ? 'var(--gold-primary)' : 'transparent',
                  color: profileTab === 'view' ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {lang === 'es' ? 'Mis Datos' : 'My Info'}
              </button>
              <button 
                type="button"
                onClick={() => setProfileTab('edit_profile')}
                style={{
                  background: profileTab === 'edit_profile' ? 'var(--gold-primary)' : 'transparent',
                  color: profileTab === 'edit_profile' ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {lang === 'es' ? 'Editar Perfil' : 'Edit Profile'}
              </button>
              <button 
                type="button"
                onClick={() => setProfileTab('change_password')}
                style={{
                  background: profileTab === 'change_password' ? 'var(--gold-primary)' : 'transparent',
                  color: profileTab === 'change_password' ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {lang === 'es' ? 'Contraseña' : 'Password'}
              </button>
              {isAdmin && (
                <button 
                  type="button"
                  onClick={() => setProfileTab('admin_users')}
                  style={{
                    background: profileTab === 'admin_users' ? 'var(--gold-primary)' : 'transparent',
                    color: profileTab === 'admin_users' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {lang === 'es' ? 'Usuarios' : 'Users'}
                </button>
              )}
            </div>

            {/* Contenido Condicional */}
            {profileTab === 'view' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: 'var(--border-glass)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>{lang === 'es' ? 'Nick / Nombre Público:' : 'Nick / Display Name:'}</strong> {profile?.name}</div>
                  <div><strong>{lang === 'es' ? 'Nombre de Usuario:' : 'Username:'}</strong> @{profile?.username}</div>
                  <div><strong>{lang === 'es' ? 'Email:' : 'Email:'}</strong> {profile?.email}</div>
                  <div><strong>{lang === 'es' ? 'País - Ciudad:' : 'Country - City:'}</strong> {profile?.location || (lang === 'es' ? 'No especificado' : 'Not specified')}</div>
                  <div><strong>{lang === 'es' ? 'Teléfono:' : 'Phone:'}</strong> {profile?.phone || (lang === 'es' ? 'No proporcionado' : 'Not provided')}</div>
                  <div><strong>{lang === 'es' ? 'Notificaciones por Correo:' : 'Email Notifications:'}</strong> {profile?.emailNotifications !== false ? (lang === 'es' ? 'Activadas 🔔' : 'Enabled 🔔') : (lang === 'es' ? 'Desactivadas 🔕' : 'Disabled 🔕')}</div>
                  <div>
                    <strong>{lang === 'es' ? 'Verificación de Correo:' : 'Email Verification:'}</strong>{' '}
                    <span style={{ color: user?.emailVerified ? 'var(--success-color)' : 'var(--warning-color)' }}>
                      {user?.emailVerified 
                        ? (lang === 'es' ? 'Verificado ✔' : 'Verified ✔') 
                        : (lang === 'es' ? 'Pendiente ⏳' : 'Pending ⏳')}
                    </span>
                    {!user?.emailVerified && (
                      <button 
                        type="button"
                        onClick={handleResendVerification}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--gold-primary)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: '0.75rem',
                          marginLeft: '8px'
                        }}
                      >
                        ({lang === 'es' ? 'Reenviar' : 'Resend'})
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-small" 
                  onClick={handleLogout} 
                  style={{ width: '100%', marginTop: '8px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'var(--border-glass)' }}
                >
                  {lang === 'es' ? 'Cerrar Sesión' : 'Logout'}
                </button>

                {/* Separador y opción de eliminación de cuenta (RGPD) */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '16px', paddingTop: '12px', textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={handleDeleteOwnAccount}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      textDecoration: 'underline',
                      padding: '4px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ⚠️ {lang === 'es' ? 'Eliminar mi cuenta' : 'Delete my account'}
                  </button>
                </div>
              </div>
            )}

            {profileTab === 'edit_profile' && (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Nick / Nombre Público:' : 'Nick / Display Name:'}</label>
                  <input 
                    type="text" value={editNickInput} onChange={(e) => setEditNickInput(e.target.value)} required
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Email:' : 'Email:'}</label>
                  <input 
                    type="email" value={editEmailInput} onChange={(e) => setEditEmailInput(e.target.value)} required
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }}
                  />
                  {editEmailInput.toLowerCase() !== profile?.email?.toLowerCase() && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)', marginTop: '2px' }}>
                      ⚠️ {lang === 'es' ? 'El cambio de email requerirá volver a verificar tu cuenta.' : 'Changing your email will require re-verifying your account.'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Teléfono (WhatsApp):' : 'Phone (WhatsApp):'}</label>
                  <input 
                    type="tel" value={editPhoneInput} onChange={(e) => setEditPhoneInput(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'País - Ciudad:' : 'Country - City:'}</label>
                  <input 
                    type="text" value={editLocationInput} onChange={(e) => setEditLocationInput(e.target.value)} required
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" disabled={isUpdatingAccount} style={{ flex: 1 }}>
                    {isUpdatingAccount ? (lang === 'es' ? 'Guardando...' : 'Saving...') : (lang === 'es' ? 'Guardar Cambios' : 'Save Changes')}
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => setProfileTab('view')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'var(--border-glass)' }}>
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            {profileTab === 'change_password' && (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '4px' }}>
                  {lang === 'es' ? 'Actualiza la contraseña de tu cuenta.' : 'Update your account password.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Nueva Contraseña:' : 'New Password:'}</label>
                  <input 
                    type="password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} placeholder="******" required minLength="6"
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Repetir Contraseña:' : 'Confirm Password:'}</label>
                  <input 
                    type="password" value={confirmNewPasswordInput} onChange={(e) => setConfirmNewPasswordInput(e.target.value)} placeholder="******" required minLength="6"
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" disabled={isUpdatingAccount} style={{ flex: 1 }}>
                    {isUpdatingAccount ? (lang === 'es' ? 'Actualizando...' : 'Updating...') : (lang === 'es' ? 'Cambiar Contraseña' : 'Change Password')}
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => setProfileTab('view')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'var(--border-glass)' }}>
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            {profileTab === 'admin_users' && isAdmin && (
              <UserManagement 
                lang={lang} 
                currentUserId={user.uid}
                currentUsername={profile?.username}
                showAlert={showAlert}
                showConfirm={showConfirm}
              />
            )}
          </div>
        ) : (
          /* VISTA: LOGOUT - FORMULARIOS LOGIN/REGISTRO */
          <div>
            {authMode === 'login' ? (
              /* FORMULARIO LOGIN */
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                  {lang === 'es' ? 'Ingresa tus credenciales para unirte a ligas o cargar tus resultados.' : 'Enter your credentials to join leagues or report match scores.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Nombre de Usuario:' : 'Username:'}</label>
                  <input 
                    type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder={lang === 'es' ? "Ej. frodo88" : "e.g. frodo88"}
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '12px', outline: 'none', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Contraseña:' : 'Password:'}</label>
                  <input 
                    type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="******"
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '12px', outline: 'none', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px' }}>
                  <button type="button" onClick={() => setAuthMode('forgot_password')} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.78rem' }}>
                    {lang === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
                  </button>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSubmittingAuth} style={{ marginTop: '6px' }}>
                  {isSubmittingAuth ? (lang === 'es' ? 'Entrando...' : 'Logging in...') : (lang === 'es' ? 'Iniciar Sesión' : 'Login')}
                </button>
                
                <button type="button" onClick={() => setAuthMode('register')} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem', alignSelf: 'center', marginTop: '4px' }}>
                  {lang === 'es' ? '¿No tienes cuenta? Regístrate aquí' : "Don't have an account? Register here"}
                </button>
              </form>
            ) : authMode === 'forgot_password' ? (
              /* FORMULARIO RECUPERAR CONTRASEÑA */
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                  {lang === 'es' ? 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.' : 'Enter your email address and we will send you a password reset link.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Correo Electrónico:' : 'Email Address:'}</label>
                  <input 
                    type="email" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} placeholder="frodo@shire.com"
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '12px', outline: 'none', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSendingForgotPassword} style={{ marginTop: '6px' }}>
                  {isSendingForgotPassword ? (lang === 'es' ? 'Enviando...' : 'Sending...') : (lang === 'es' ? 'Enviar Enlace' : 'Send Link')}
                </button>
                
                <button type="button" onClick={() => setAuthMode('login')} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem', alignSelf: 'center', marginTop: '4px' }}>
                  {lang === 'es' ? 'Volver al Inicio de Sesión' : 'Back to Login'}
                </button>
              </form>
            ) : (
              /* FORMULARIO REGISTRO */
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '4px' }}>
                  {lang === 'es' ? 'Crea tu cuenta de jugador para ligas y torneos.' : 'Create your player account for leagues and tournaments.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Nombre de Usuario (Login):' : 'Username (Login):'}</label>
                  <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="frodo88"
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }} required
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {lang === 'es' ? '🔒 Privado: Nombre para iniciar sesión.' : '🔒 Private: Name used to sign in.'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Nick / Nombre Público:' : 'Nick / Display Name:'}</label>
                  <input type="text" value={nickInput} onChange={(e) => setNickInput(e.target.value)} placeholder="Frodo"
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }} required
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {lang === 'es' ? '🌍 Público: El nombre que verán los demás en las ligas.' : '🌍 Public: The name others will see in leagues.'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Email:' : 'Email:'}</label>
                  <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="frodo@shire.com"
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }} required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Contraseña:' : 'Password:'}</label>
                    <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="******"
                      style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }} required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Repetir Contraseña:' : 'Confirm Password:'}</label>
                    <input type="password" value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} placeholder="******"
                      style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }} required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {lang === 'es' ? 'País - Ciudad:' : 'Country - City:'}
                  </label>
                  <input type="text" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} placeholder={lang === 'es' ? "España - Madrid" : "Spain - Madrid"}
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }} required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang === 'es' ? 'Teléfono (WhatsApp):' : 'Phone (WhatsApp):'}</label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({lang === 'es' ? 'Opcional' : 'Optional'})</span>
                  </div>
                  <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder={lang === 'es' ? "Ej. +34 666 555 444" : "e.g. +34 666 555 444"}
                    style={{ background: 'rgba(0,0,0,0.3)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '10px', outline: 'none', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.2' }}>
                    {lang === 'es' 
                      ? '💡 Opcional: Proporcionar tu WhatsApp ayuda a los organizadores a coordinar emparejamientos.' 
                      : '💡 Optional: Providing your WhatsApp helps organizers coordinate matches.'}
                  </span>
                </div>

                {/* Consentimiento RGPD / GDPR Checkbox */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', margin: '4px 0' }}>
                  <input 
                    type="checkbox" 
                    id="gdpr_consent" 
                    required 
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="gdpr_consent" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.3', cursor: 'pointer' }}>
                    {lang === 'es' 
                      ? 'Acepto el tratamiento de mis datos personales (nombre, correo y teléfono opcional) para la gestión del torneo conforme al RGPD. Esta app utiliza almacenamiento local del navegador (cookies/localStorage) únicamente para mantener mi sesión abierta.' 
                      : 'I consent to the processing of my personal data (name, email, and optional phone) for tournament management under GDPR. This app uses local storage (cookies/localStorage) strictly to keep my session open.'}
                  </label>
                </div>

                {/* Descargo de Responsabilidad No Comercial de Games Workshop */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.3',
                  textAlign: 'justify'
                }}>
                  {lang === 'es'
                    ? '📢 Proyecto de Fans No Oficial: Esta aplicación es una herramienta gratuita creada por fans y no tiene fines comerciales. No está afiliada, autorizada ni respaldada por Games Workshop Limited, Middle-earth Enterprises ni los herederos de J.R.R. Tolkien. Todos los nombres, facciones y marcas registradas son propiedad de sus respectivos dueños.'
                    : '📢 Unofficial Fan Project: This application is a free tool created by fans and has no commercial purposes. It is not affiliated with, authorized, or endorsed by Games Workshop Limited, Middle-earth Enterprises, or the Tolkien Estate. All names, factions, and trademarks are the property of their respective owners.'}
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSubmittingAuth} style={{ marginTop: '8px' }}>
                  {isSubmittingAuth ? (lang === 'es' ? 'Registrando...' : 'Registering...') : (lang === 'es' ? 'Crear Cuenta' : 'Create Account')}
                </button>
                
                <button type="button" onClick={() => setAuthMode('login')} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem', alignSelf: 'center', marginTop: '4px' }}>
                  {lang === 'es' ? '¿Ya tienes cuenta? Inicia sesión' : 'Already have an account? Login'}
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Mensajería Privada (PM) */}
      <Modal
        isOpen={isChatModalOpen}
        onClose={() => {
          setIsChatModalOpen(false);
          setActiveChat(null);
        }}
        title={activeChat 
          ? (lang === 'es' ? `Chat con ${activeChat.nicks[activeChat.participants.find(uid => uid !== user?.uid)]}` : `Chat with ${activeChat.nicks[activeChat.participants.find(uid => uid !== user?.uid)]}`) 
          : (lang === 'es' ? "Mensajes Privados" : "Private Messages")}
      >
        {!activeChat ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px', maxHeight: '60vh', overflowY: 'auto' }}>
            {chats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>✉️</span>
                {lang === 'es' ? 'No tienes conversaciones activas.' : 'No active conversations.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chats.map(chat => {
                  const recipientId = chat.participants.find(uid => uid !== user?.uid);
                  const recipientNick = chat.nicks?.[recipientId] || recipientId;
                  const recipientUser = chat.usernames?.[recipientId] || '';
                  const hasUnread = chat.unread?.[user?.uid] === true;
                  const lastMsgTime = chat.lastUpdated?.toMillis 
                    ? new Date(chat.lastUpdated.toMillis()).toLocaleDateString() + ' ' + new Date(chat.lastUpdated.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className="league-row-hover"
                      style={{
                        background: hasUnread ? 'rgba(203, 161, 53, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                        border: hasUnread ? '1px solid rgba(203, 161, 53, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: hasUnread ? 'bold' : '600', color: hasUnread ? 'var(--gold-primary)' : '#fff', fontSize: '0.9rem' }}>
                            {recipientNick}
                          </span>
                          {recipientUser && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{recipientUser}</span>
                          )}
                          {hasUnread && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-primary)', display: 'inline-block' }} />
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: chat.lastMessage ? 'normal' : 'italic' }}>
                          {chat.lastMessage || (lang === 'es' ? 'Sin mensajes aún.' : 'No messages yet.')}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {lastMsgTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '65vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setActiveChat(null)}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'var(--border-glass)', padding: '4px 10px', minHeight: '30px' }}
              >
                ◀ {lang === 'es' ? 'Volver' : 'Back'}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  {lang === 'es' ? 'Comienzo de la conversación. Envía un mensaje.' : 'Start of the conversation. Send a message.'}
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.senderId === user?.uid;
                  const msgTime = msg.timestamp?.toMillis 
                    ? new Date(msg.timestamp.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: isMe ? 'rgba(46, 117, 89, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: isMe ? '1px solid rgba(46, 117, 89, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isMe ? '#fff' : 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        wordBreak: 'break-word'
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>{msg.text}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>{msgTime}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={lang === 'es' ? "Escribe un mensaje..." : "Type a message..."}
                style={{
                  flex: 1,
                  background: '#111',
                  border: 'var(--border-glass)',
                  borderRadius: '4px',
                  color: '#fff',
                  padding: '10px',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
                maxLength="500"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSendingMessage || !newMessageText.trim()}
                style={{ padding: '0 20px', minHeight: '38px', fontWeight: 'bold' }}
              >
                {lang === 'es' ? 'Enviar' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal de Alerta Premium */}
      <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title={lang === 'es' ? 'Mensaje de la Cuchara' : 'Lobelia Message'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {alertModalMessage}
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsAlertModalOpen(false)}
            style={{ minWidth: '100px', marginTop: '8px' }}
          >
            {lang === 'es' ? 'Aceptar' : 'OK'}
          </button>
        </div>
      </Modal>

      {/* Modal de Confirmación Premium */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={lang === 'es' ? 'Confirmación' : 'Confirmation'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {confirmModalMessage}
          </p>
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={async () => {
                setIsConfirmModalOpen(false);
                if (confirmModalOnConfirm) {
                  await confirmModalOnConfirm();
                }
              }}
              style={{ minWidth: '100px' }}
            >
              {lang === 'es' ? 'Confirmar' : 'Confirm'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsConfirmModalOpen(false)}
              style={{ minWidth: '100px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'var(--border-glass)' }}
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Barra de Navegación inferior fija */}
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        lang={lang} 
        translations={translations} 
      />
    </div>
  );
}
