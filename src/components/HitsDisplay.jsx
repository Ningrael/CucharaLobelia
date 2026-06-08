// src/components/HitsDisplay.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc, getCountFromServer, collection } from 'firebase/firestore';

export default function HitsDisplay({ lang }) {
  const [count, setCount] = useState('...');
  
  useEffect(() => {
    let active = true;

    async function trackVisit() {
      try {
        // 1. Fetch IP from ipify
        let ip = null;
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          if (res.ok) {
            const data = await res.json();
            ip = data.ip;
          }
        } catch (err) {
          console.warn('Failed to get IP from ipify, trying fallback...', err);
        }

        // Fallback IP fetcher if ipify fails
        if (!ip) {
          try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
              const data = await res.json();
              ip = data.ip;
            }
          } catch (err) {
            console.warn('Failed to get IP from fallback, using local session track...', err);
          }
        }

        // If we still don't have an IP, we use a generated unique session token
        if (!ip) {
          const sessionKey = 'lobelia_session_token';
          let token = localStorage.getItem(sessionKey);
          if (!token) {
            token = 'token_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
            localStorage.setItem(sessionKey, token);
          }
          ip = token;
        }

        const safeIp = ip.replace(/\./g, '_').replace(/:/g, '_').replace(/\s/g, '');

        // 2. Check in Firestore /visitors/{safeIp}
        const visitorRef = doc(db, 'visitors', safeIp);
        const docSnap = await getDoc(visitorRef);

        if (!docSnap.exists()) {
          // New visitor! Save to Firestore
          await setDoc(visitorRef, { 
            timestamp: new Date(),
            userAgent: navigator.userAgent || 'unknown',
            lang: lang || 'es'
          });
        }

        // 3. Get total unique visitor count
        const coll = collection(db, 'visitors');
        const snapshot = await getCountFromServer(coll);
        const total = snapshot.data().count;

        if (active) {
          setCount(total.toString());
        }
      } catch (error) {
        console.error('Error tracking visit:', error);
        if (active) {
          try {
            const coll = collection(db, 'visitors');
            const snapshot = await getCountFromServer(coll);
            setCount(snapshot.data().count.toString());
          } catch (innerErr) {
            setCount('...');
          }
        }
      }
    }

    trackVisit();

    return () => {
      active = false;
    };
  }, [lang]);

  const labelText = lang === 'es' ? 'Nº de visitas: ' : 'Visits: ';

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-title)',
        letterSpacing: '0.05em'
      }}
      aria-hidden="true"
    >
      <span>{labelText}{count}</span>
    </div>
  );
}
