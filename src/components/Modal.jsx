// src/components/Modal.jsx
import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, size, zIndex, children }) {
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

  const backdropStyle = zIndex ? { zIndex } : {};
  const contentStyle = zIndex ? { zIndex: zIndex + 1 } : {};

  return (
    <>
      {/* Fondo oscuro del modal con blur */}
      <div 
        className="modal-backdrop" 
        onClick={onClose} 
        aria-hidden="true" 
        style={backdropStyle}
      />
      
      {/* Contenido del modal (Híbrido: cajón inferior en móvil / tarjeta en PC) */}
      <div 
        className={`modal-content ${size === 'large' ? 'modal-large' : ''}`}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        style={contentStyle}
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
