// src/components/PdfCanvasViewer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function PdfCanvasViewer({ url, lang }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const pinchRef = useRef({ startDist: 0, startZoom: 1 });

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

  // Render pages when pdfDoc or zoom changes
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    let active = true;

    async function renderPages() {
      containerRef.current.innerHTML = '';
      
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (!active) return;
        const page = await pdfDoc.getPage(pageNum);
        
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.margin = '10px auto';
        canvas.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
        canvas.style.borderRadius = '6px';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        
        containerRef.current.appendChild(canvas);
        
        const containerWidth = scrollRef.current ? scrollRef.current.clientWidth || 360 : 360;
        const viewportDefault = page.getViewport({ scale: 1.0 });
        
        // Apply zoom: base scale fills container width, then multiply by zoom
        const baseScale = containerWidth / viewportDefault.width;
        const renderScale = baseScale * zoom * (window.devicePixelRatio || 1);
        const displayScale = baseScale * zoom;
        
        const viewport = page.getViewport({ scale: renderScale > 2 ? renderScale : 2 });
        
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // CSS size = display scale (without devicePixelRatio)
        const displayViewport = page.getViewport({ scale: displayScale });
        canvas.style.width = displayViewport.width + 'px';
        canvas.style.height = displayViewport.height + 'px';
        if (zoom > 1) {
          canvas.style.maxWidth = 'none';
        } else {
          canvas.style.maxWidth = '100%';
        }
        
        await page.render({ canvasContext: context, viewport }).promise;
      }
    }

    renderPages();
    return () => { active = false; };
  }, [pdfDoc, zoom]);

  // Pinch-to-zoom touch handlers
  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchRef.current.startDist = getTouchDist(e.touches);
      pinchRef.current.startZoom = zoom;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDist = getTouchDist(e.touches);
      const scale = currentDist / pinchRef.current.startDist;
      const newZoom = Math.min(Math.max(pinchRef.current.startZoom * scale, 0.5), 4);
      setZoom(Math.round(newZoom * 100) / 100);
    }
  }, []);

  // Attach touch listeners with { passive: false } to allow preventDefault
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchStart, handleTouchMove]);

  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const zoomReset = () => setZoom(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Zoom controls */}
      {!loading && !error && (
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky', top: 0, zIndex: 2,
          background: 'rgba(10, 17, 11, 0.95)', backdropFilter: 'blur(8px)'
        }}>
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
      )}

      {/* Scrollable PDF area */}
      <div ref={scrollRef} style={{ 
        flex: 1, overflowY: 'auto', overflowX: zoom > 1 ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y'
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
        
        <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }} />
      </div>
    </div>
  );
}
