// src/utils/analyticsTracker.js
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

const ADMIN_CONFIG_UID = 'xXhjkWRjh0hVBjcYr2qAAFRvGL82';
const SUMMARY_DOC_REF = () => doc(db, 'analytics', 'summary');
const ADMIN_DOC_REF = () => doc(db, 'players', ADMIN_CONFIG_UID);

// Detect device type
export function getDeviceType() {
  const ua = navigator.userAgent || '';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Detect operating system
export function getOperatingSystem() {
  const ua = navigator.userAgent || '';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}

let activeSession = null;
let heartbeatTimer = null;

/**
 * Initializes session tracking for current visit.
 * Heartbeat periodically updates time spent.
 */
export function initSessionTracking(currentUser, profile, lang = 'es') {
  if (activeSession) return activeSession;

  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const deviceType = getDeviceType();
  const os = getOperatingSystem();
  const isRegistered = !!currentUser;
  const username = profile?.username || (currentUser ? currentUser.email?.split('@')[0] : null);

  activeSession = {
    sessionId,
    startTime: Date.now(),
    lastHeartbeat: Date.now(),
    durationSeconds: 0,
    isRegistered,
    username,
    deviceType,
    os,
    lang
  };

  // 1. Record session start in Firestore (both analytics/summary and players/{adminUid}.analytics)
  recordSessionStart(activeSession);

  // 2. Setup periodic heartbeat (every 30 seconds) to measure active session time
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (!activeSession) return;
    const now = Date.now();
    const elapsedSinceLast = Math.round((now - activeSession.lastHeartbeat) / 1000);
    if (elapsedSinceLast >= 25 && elapsedSinceLast <= 120) {
      activeSession.durationSeconds += elapsedSinceLast;
      activeSession.lastHeartbeat = now;
      recordHeartbeat(elapsedSinceLast, activeSession);
    } else {
      activeSession.lastHeartbeat = now;
    }
  }, 30000);

  // 3. Handle page unload to flush remaining seconds
  window.addEventListener('beforeunload', () => {
    if (activeSession) {
      const now = Date.now();
      const finalSec = Math.round((now - activeSession.lastHeartbeat) / 1000);
      if (finalSec > 0 && finalSec < 120) {
        recordHeartbeat(finalSec, activeSession);
      }
    }
  });

  return activeSession;
}

/**
 * Update session info when user logs in/out during active browsing
 */
export function updateSessionUser(currentUser, profile) {
  if (!activeSession) return;
  const wasRegistered = activeSession.isRegistered;
  activeSession.isRegistered = !!currentUser;
  activeSession.username = profile?.username || (currentUser ? currentUser.email?.split('@')[0] : null);

  // If user just logged in during this session, adjust stats
  if (!wasRegistered && currentUser) {
    recordRegisteredConversion(activeSession);
  }
}

/**
 * Track specific feature usage (e.g. 'ai_query', 'calculator_run', 'mission_view', 'pdf_export')
 */
export async function trackFeature(featureName, meta = {}) {
  const today = new Date().toISOString().slice(0, 10);

  // Local storage quick caching
  try {
    const locKey = `lobelia_stat_${featureName}_${today}`;
    const cur = parseInt(localStorage.getItem(locKey) || '0', 10);
    localStorage.setItem(locKey, (cur + 1).toString());
  } catch (_) {}

  // Update in Firestore
  const updatePayload = {
    [`features.${featureName}`]: increment(1),
    [`daily.${today}.features.${featureName}`]: increment(1),
    updatedAt: new Date().toISOString()
  };

  await atomicUpdateAnalytics(updatePayload);
}

/**
 * Record a new session start in aggregated analytics
 */
async function recordSessionStart(session) {
  const today = new Date().toISOString().slice(0, 10);
  const isAnon = !session.isRegistered;

  const updatePayload = {
    'sessions.total': increment(1),
    'sessions.anonymous': increment(isAnon ? 1 : 0),
    'sessions.registered': increment(isAnon ? 0 : 1),
    [`devices.${session.deviceType}`]: increment(1),
    [`os.${session.os}`]: increment(1),
    [`languages.${session.lang || 'es'}`]: increment(1),
    [`daily.${today}.sessions.total`]: increment(1),
    [`daily.${today}.sessions.anonymous`]: increment(isAnon ? 1 : 0),
    [`daily.${today}.sessions.registered`]: increment(isAnon ? 0 : 1),
    updatedAt: new Date().toISOString()
  };

  // If registered user, append to recent active players list
  if (session.isRegistered && session.username) {
    updateRecentUsersList(session.username, session.deviceType);
  }

  await atomicUpdateAnalytics(updatePayload);
}

/**
 * Record seconds elapsed in heartbeat
 */
async function recordHeartbeat(seconds, session) {
  if (seconds <= 0) return;
  const today = new Date().toISOString().slice(0, 10);

  const updatePayload = {
    'sessions.totalDurationSec': increment(seconds),
    [`daily.${today}.sessions.totalDurationSec`]: increment(seconds),
    updatedAt: new Date().toISOString()
  };

  await atomicUpdateAnalytics(updatePayload);
}

/**
 * Record conversion when user logs in during session
 */
async function recordRegisteredConversion(session) {
  const today = new Date().toISOString().slice(0, 10);

  const updatePayload = {
    'sessions.anonymous': increment(-1),
    'sessions.registered': increment(1),
    [`daily.${today}.sessions.anonymous`]: increment(-1),
    [`daily.${today}.sessions.registered`]: increment(1),
    updatedAt: new Date().toISOString()
  };

  if (session.username) {
    updateRecentUsersList(session.username, session.deviceType);
  }

  await atomicUpdateAnalytics(updatePayload);
}

/**
 * Helper to update recent active users in Firestore
 */
async function updateRecentUsersList(username, deviceType) {
  try {
    const adminDocRef = ADMIN_DOC_REF();
    const snap = await getDoc(adminDocRef);
    let recentUsers = [];
    if (snap.exists() && snap.data()?.analytics?.recentUsers) {
      recentUsers = snap.data().analytics.recentUsers;
    }

    // Filter out existing and prepend newest
    recentUsers = recentUsers.filter(u => u.username !== username);
    recentUsers.unshift({
      username,
      deviceType,
      lastSeen: new Date().toISOString()
    });

    // Keep last 15 users
    recentUsers = recentUsers.slice(0, 15);

    await setDoc(adminDocRef, {
      analytics: {
        recentUsers
      }
    }, { merge: true });
  } catch (err) {
    console.warn('[Analytics] Could not update recent users list:', err);
  }
}

/**
 * Resilient atomic updater for Firestore analytics
 */
async function atomicUpdateAnalytics(updatePayload) {
  // 1. Try updating analytics/summary
  try {
    const sumRef = SUMMARY_DOC_REF();
    await updateDoc(sumRef, updatePayload);
    return;
  } catch (err) {
    // If doc doesn't exist, create it with setDoc
    try {
      const sumRef = SUMMARY_DOC_REF();
      await setDoc(sumRef, updatePayload, { merge: true });
      return;
    } catch (_) {}
  }

  // 2. Resilient fallback to players/{adminUid}.analytics
  try {
    const adminRef = ADMIN_DOC_REF();
    const transformed = {};
    for (const [k, v] of Object.entries(updatePayload)) {
      transformed[`analytics.${k}`] = v;
    }
    await updateDoc(adminRef, transformed);
  } catch (err2) {
    try {
      const adminRef = ADMIN_DOC_REF();
      const transformed = {};
      for (const [k, v] of Object.entries(updatePayload)) {
        transformed[`analytics.${k}`] = v;
      }
      await setDoc(adminRef, transformed, { merge: true });
    } catch (_) {}
  }
}

/**
 * Fetches aggregated analytics summary for the Admin Dashboard
 */
export async function getAnalyticsSummary() {
  try {
    // 1. Check analytics/summary doc
    try {
      const sumSnap = await getDoc(SUMMARY_DOC_REF());
      if (sumSnap.exists()) {
        const data = sumSnap.data();
        // Also fetch recent users from admin doc if available
        try {
          const adminSnap = await getDoc(ADMIN_DOC_REF());
          if (adminSnap.exists() && adminSnap.data()?.analytics?.recentUsers) {
            data.recentUsers = adminSnap.data().analytics.recentUsers;
          }
        } catch (_) {}
        return data;
      }
    } catch (_) {}

    // 2. Check players/{adminUid}.analytics
    const adminSnap = await getDoc(ADMIN_DOC_REF());
    if (adminSnap.exists() && adminSnap.data()?.analytics) {
      return adminSnap.data().analytics;
    }

    return null;
  } catch (err) {
    console.error('[Analytics] Error fetching summary:', err);
    return null;
  }
}

/**
 * Resets all analytics data in Firestore (Admin only action)
 */
export async function resetAnalyticsData() {
  const emptySummary = {
    sessions: {
      total: 0,
      anonymous: 0,
      registered: 0,
      totalDurationSec: 0
    },
    features: {
      ai_query: 0,
      calculator_run: 0,
      mission_view: 0,
      pdf_export: 0,
      league_view: 0,
      calendar_view: 0
    },
    devices: {
      mobile: 0,
      desktop: 0,
      tablet: 0
    },
    os: {
      Windows: 0,
      Android: 0,
      iOS: 0,
      macOS: 0,
      Linux: 0,
      Other: 0
    },
    languages: {
      es: 0,
      en: 0
    },
    recentUsers: [],
    daily: {},
    resetAt: new Date().toISOString()
  };

  try {
    await setDoc(SUMMARY_DOC_REF(), emptySummary);
  } catch (_) {}

  try {
    await setDoc(ADMIN_DOC_REF(), { analytics: emptySummary }, { merge: true });
  } catch (_) {}

  return emptySummary;
}
