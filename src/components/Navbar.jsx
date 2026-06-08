// src/components/Navbar.jsx
import React from 'react';

export default function Navbar({ currentView, setView, lang, translations }) {
  const items = [
    {
      id: 'home',
      label: lang === 'es' ? 'Inicio' : 'Home',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      )
    },
    {
      id: 'missions',
      label: lang === 'es' ? 'Misiones' : 'Missions',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
        </svg>
      )
    },
    {
      id: 'league',
      label: lang === 'es' ? 'Liga' : 'League',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      )
    },
    {
      id: 'calculator',
      label: lang === 'es' ? 'Calculadora' : 'Calculator',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14h-4v-1h4v1zm0-3h-4v-1h4v1zm0-3h-4V8h4v3zm-6 6H7v-1h4v1zm0-3H7v-1h4v1zm0-3H7V8h4v3z"/>
        </svg>
      )
    },
    {
      id: 'calendar',
      label: lang === 'es' ? 'Eventos' : 'Events',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
        </svg>
      )
    }
  ];

  return (
    <nav className="mobile-navbar" role="navigation">
      {items.map((item) => (
        <button
          key={item.id}
          className={`navbar-item ${currentView === item.id ? 'active' : ''}`}
          onClick={() => setView(item.id)}
          aria-label={item.label}
          aria-current={currentView === item.id ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
