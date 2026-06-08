// src/components/PdfCanvasViewer.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function PdfCanvasViewer({ url, lang }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;
    
    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        
        // 1. Dynamically load pdf.js if not already present
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
        
        // 2. Fetch and load the PDF document
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        if (!active) return;
        setLoading(false);
        
        // 3. Render all pages sequentially
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (!active) return;
          const page = await pdf.getPage(pageNum);
          
          const canvas = document.createElement('canvas');
          canvas.style.display = 'block';
          canvas.style.margin = '10px auto';
          canvas.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
          canvas.style.borderRadius = '6px';
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';
          canvas.style.border = '1px solid rgba(255, 255, 255, 0.05)';
          
          if (containerRef.current) {
            containerRef.current.appendChild(canvas);
          }
          
          // Scale to container width
          const containerWidth = containerRef.current ? containerRef.current.clientWidth || 360 : 360;
          const viewportDefault = page.getViewport({ scale: 1.0 });
          
          // Higher scale for crisp text rendering on canvas
          const targetScale = (containerWidth / viewportDefault.width) * (window.devicePixelRatio || 1);
          const viewport = page.getViewport({ scale: targetScale > 2 ? targetScale : 2 });
          
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
        }
      } catch (err) {
        console.error('Error rendering PDF:', err);
        if (active) {
          setError(lang === 'es' ? 'Error al renderizar el documento. Intenta abrir el PDF directo.' : 'Error rendering document. Try opening the PDF directly.');
          setLoading(false);
        }
      }
    }
    
    loadPdf();
    
    return () => {
      active = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [url, lang]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto' }}>
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
  );
}
