// src/components/PdfCanvasViewer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function PdfCanvasViewer({ url, lang, onChangeLang }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const touchStateRef = useRef({
    isPinching: false,
    startDist: 0,
    startZoom: 1,
    startFocalX: 0,
    startFocalY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    lastTap: 0
  });

  // Load pdf.js and the document
  useEffect(() => {
    let active = true;
    
    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);
        setPdfDoc(null);
        
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error(lang === 'es' ? 'No se pudo cargar el visor de PDF.' : 'Could not load PDF viewer.'));
            document.head.appendChild(script);
          });
        }
        
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        if (!active) return;
        setPdfDoc(pdf);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (active) {
          setError(lang === 'es' ? 'Error al renderizar el documento. Intenta abrir el PDF directo.' : 'Error rendering document. Try opening the PDF directly.');
          setLoading(false);
        }
      }
    }
    
    loadPdf();
    return () => { active = false; };
  }, [url, lang]);

  // Render pages ONCE when pdfDoc changes (crisp high-res rendering)
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    let active = true;

    async function renderPages() {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      
      const availableWidth = scrollRef.current ? (scrollRef.current.clientWidth || 360) : 360;
      const containerWidth = Math.max(availableWidth - 16, 280);

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (!active) return;
        const page = await pdfDoc.getPage(pageNum);
        
        const viewportDefault = page.getViewport({ scale: 1.0 });
        const baseWidth = containerWidth;
        const baseHeight = (containerWidth / viewportDefault.width) * viewportDefault.height;
        
        // High resolution render scale for sharp text even when zoomed in 2.5x - 3x
        const dpr = window.devicePixelRatio || 1;
        const renderScale = Math.max(2.5, (containerWidth / viewportDefault.width) * 2.5 * dpr);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.dataset.baseWidth = baseWidth;
        canvas.dataset.baseHeight = baseHeight;

        canvas.style.display = 'block';
        canvas.style.margin = '10px auto';
        canvas.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
        canvas.style.borderRadius = '6px';
        canvas.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        canvas.style.transition = 'width 0.05s ease-out, height 0.05s ease-out';
        
        // Set physical pixel dimensions for high DPI rendering
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Set CSS display size based on current zoom
        const currentZoom = zoomRef.current;
        canvas.style.width = `${baseWidth * currentZoom}px`;
        canvas.style.height = `${baseHeight * currentZoom}px`;
        canvas.style.maxWidth = currentZoom > 1 ? 'none' : '100%';

        containerRef.current.appendChild(canvas);

        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
      }
    }

    renderPages();
    return () => { active = false; };
  }, [pdfDoc]);

  // Adjust canvas CSS size smoothly whenever `zoom` state changes
  useEffect(() => {
    if (!containerRef.current) return;
    const canvases = containerRef.current.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const baseW = parseFloat(canvas.dataset.baseWidth || 320);
      const baseH = parseFloat(canvas.dataset.baseHeight || 450);
      canvas.style.width = `${baseW * zoom}px`;
      canvas.style.height = `${baseH * zoom}px`;
      canvas.style.maxWidth = zoom > 1 ? 'none' : '100%';
    });
  }, [zoom]);

  // Helper to measure distance between two touch points
  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch event listeners with focal point tracking
  const handleTouchStart = useCallback((e) => {
    const scrollEl = scrollRef.current;
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const rect = scrollEl ? scrollEl.getBoundingClientRect() : { left: 0, top: 0, width: 360, height: 600 };
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const offsetX = centerX - rect.left;
      const offsetY = centerY - rect.top;

      touchStateRef.current = {
        isPinching: true,
        startDist: dist,
        startZoom: zoomRef.current,
        startFocalX: scrollEl ? scrollEl.scrollLeft + offsetX : 0,
        startFocalY: scrollEl ? scrollEl.scrollTop + offsetY : 0,
        startOffsetX: offsetX,
        startOffsetY: offsetY,
        lastTap: 0
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      const tapX = e.touches[0].clientX;
      const tapY = e.touches[0].clientY;

      if (now - touchStateRef.current.lastTap < 300) {
        // Double tap on touched spot!
        e.preventDefault();
        const oldZoom = zoomRef.current;
        const nextZoom = oldZoom > 1.2 ? 1 : 2;

        if (scrollEl) {
          const rect = scrollEl.getBoundingClientRect();
          const offsetX = tapX - rect.left;
          const offsetY = tapY - rect.top;
          const focalX = scrollEl.scrollLeft + offsetX;
          const focalY = scrollEl.scrollTop + offsetY;

          setZoom(nextZoom);

          requestAnimationFrame(() => {
            const ratio = nextZoom / oldZoom;
            scrollEl.scrollLeft = Math.max(0, focalX * ratio - offsetX);
            scrollEl.scrollTop = Math.max(0, focalY * ratio - offsetY);
          });
        } else {
          setZoom(nextZoom);
        }
      }
      touchStateRef.current.lastTap = now;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStateRef.current.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const currentDist = getTouchDist(e.touches);
      if (touchStateRef.current.startDist > 0) {
        const scaleRatio = currentDist / touchStateRef.current.startDist;
        let targetZoom = touchStateRef.current.startZoom * scaleRatio;
        targetZoom = Math.min(Math.max(targetZoom, 0.6), 4.0);
        
        const scrollEl = scrollRef.current;
        if (containerRef.current) {
          const canvases = containerRef.current.querySelectorAll('canvas');
          canvases.forEach(canvas => {
            const baseW = parseFloat(canvas.dataset.baseWidth || 320);
            const baseH = parseFloat(canvas.dataset.baseHeight || 450);
            canvas.style.width = `${baseW * targetZoom}px`;
            canvas.style.height = `${baseH * targetZoom}px`;
            canvas.style.maxWidth = targetZoom > 1 ? 'none' : '100%';
          });
        }

        if (scrollEl && touchStateRef.current.startZoom > 0) {
          const ratio = targetZoom / touchStateRef.current.startZoom;
          scrollEl.scrollLeft = Math.max(0, touchStateRef.current.startFocalX * ratio - touchStateRef.current.startOffsetX);
          scrollEl.scrollTop = Math.max(0, touchStateRef.current.startFocalY * ratio - touchStateRef.current.startOffsetY);
        }
        
        zoomRef.current = targetZoom;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStateRef.current.isPinching) {
      if (e.touches.length < 2) {
        touchStateRef.current.isPinching = false;
        const finalZoom = Math.round(zoomRef.current * 100) / 100;
        setZoom(finalZoom);
      }
    }
  }, []);

  // Attach non-passive touch listeners
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Button zoom helpers centered on current screen middle
  const changeZoomWithCenterFocal = (getNextZoom) => {
    const oldZoom = zoomRef.current;
    const nextZoom = getNextZoom(oldZoom);
    if (nextZoom === oldZoom) return;

    const scrollEl = scrollRef.current;
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect();
      const offsetX = rect.width / 2;
      const offsetY = rect.height / 2;
      const focalX = scrollEl.scrollLeft + offsetX;
      const focalY = scrollEl.scrollTop + offsetY;

      setZoom(nextZoom);

      requestAnimationFrame(() => {
        const ratio = nextZoom / oldZoom;
        scrollEl.scrollLeft = Math.max(0, focalX * ratio - offsetX);
        scrollEl.scrollTop = Math.max(0, focalY * ratio - offsetY);
      });
    } else {
      setZoom(nextZoom);
    }
  };

  const zoomIn = () => changeZoomWithCenterFocal(z => Math.min(Math.round((z + 0.25) * 100) / 100, 4));
  const zoomOut = () => changeZoomWithCenterFocal(z => Math.max(Math.round((z - 0.25) * 100) / 100, 0.5));
  const zoomReset = () => changeZoomWithCenterFocal(() => 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Zoom controls */}
      {!loading && !error && (
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky', top: 0, zIndex: 2,
          background: 'rgba(10, 17, 11, 0.95)', backdropFilter: 'blur(8px)'
        }}>
          {/* Flag Left: ES */}
          <button 
            onClick={() => onChangeLang && onChangeLang('es')}
            style={{
              background: 'transparent',
              border: lang === 'es' ? '2.5px solid var(--gold-primary)' : '2.5px solid transparent',
              borderRadius: '4px',
              padding: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: lang === 'es' ? 1 : 0.35,
              transition: 'opacity 0.2s, border-color 0.2s'
            }}
            title="Español"
          >
            <img 
              src="https://flagcdn.com/w20/es.png" 
              alt="Español" 
              style={{ display: 'block', width: '22px', height: 'auto', borderRadius: '1.5px' }} 
            />
          </button>

          {/* Zoom controls in center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={zoomOut} disabled={zoom <= 0.5} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: zoom <= 0.5 ? 'rgba(255,255,255,0.2)' : 'var(--gold-primary)',
              borderRadius: '6px', width: '36px', height: '36px', fontSize: '1.2rem',
              cursor: zoom <= 0.5 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>−</button>
            
            <button onClick={zoomReset} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)', borderRadius: '6px', padding: '4px 12px',
              fontSize: '0.8rem', cursor: 'pointer', minWidth: '60px'
            }}>{Math.round(zoom * 100)}%</button>
            
            <button onClick={zoomIn} disabled={zoom >= 4} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: zoom >= 4 ? 'rgba(255,255,255,0.2)' : 'var(--gold-primary)',
              borderRadius: '6px', width: '36px', height: '36px', fontSize: '1.2rem',
              cursor: zoom >= 4 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>+</button>
          </div>

          {/* Flag Right: EN */}
          <button 
            onClick={() => onChangeLang && onChangeLang('en')}
            style={{
              background: 'transparent',
              border: lang === 'en' ? '2.5px solid var(--gold-primary)' : '2.5px solid transparent',
              borderRadius: '4px',
              padding: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: lang === 'en' ? 1 : 0.35,
              transition: 'opacity 0.2s, border-color 0.2s'
            }}
            title="English"
          >
            <img 
              src="https://flagcdn.com/w20/gb.png" 
              alt="English" 
              style={{ display: 'block', width: '22px', height: 'auto', borderRadius: '1.5px' }} 
            />
          </button>
        </div>
      )}

      {/* Scrollable PDF area */}
      <div ref={scrollRef} style={{ 
        flex: 1, overflowY: 'auto', overflowX: zoom > 1 ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y',
        padding: '8px 0'
      }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px', color: 'var(--text-secondary)' }}>
            <div className="pdf-spinner" style={{ 
              border: '4px solid rgba(255,255,255,0.1)', 
              borderTop: '4px solid var(--gold-primary)', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              animation: 'pdf-spin 1s linear infinite', 
              marginBottom: '12px' 
            }}></div>
            <span>{lang === 'es' ? 'Preparando vista previa...' : 'Preparing preview...'}</span>
            <style>{`
              @keyframes pdf-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        
        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--danger-color)', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}
        
        <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }} />
      </div>
    </div>
  );
}
