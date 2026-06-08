// src/components/Modal.jsx
import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Manejar el cierre del modal al pulsar la tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Bloquear el scroll de la página de fondo cuando el modal esté abierto
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Fondo oscuro del modal con blur */}
      <div 
        className="modal-backdrop" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      {/* Contenido del modal (Híbrido: cajón inferior en móvil / tarjeta en PC) */}
      <div 
        className="modal-content" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button 
            className="modal-close-btn" 
            onClick={onClose} 
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </>
  );
}
