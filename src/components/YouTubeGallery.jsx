// src/components/YouTubeGallery.jsx
import React, { useState, useEffect } from 'react';

export default function YouTubeGallery({ lang }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/videos.txt')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load videos.txt');
        return res.text();
      })
      .then((text) => {
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        const parsedVideos = [];
        const videoPattern = /^([^|]+?)\s*\|\s*(https?:\/\/[^\s]+)$/i;

        lines.forEach((line) => {
          // Remover marca Unicode BOM si existe
          const sanitizedLine = line.replace(/^\uFEFF/, '');
          const match = sanitizedLine.match(videoPattern);
          if (match && match[1] && match[2]) {
            const title = match[1].trim();
            const url = match[2].trim();
            const videoId = extractYouTubeId(url);
            if (videoId) {
              parsedVideos.push({ title, url, videoId });
            }
          }
        });
        setVideos(parsedVideos);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading videos:', err);
        setLoading(false);
      });
  }, []);

  function extractYouTubeId(urlStr) {
    if (!urlStr) return '';
    try {
      const url = new URL(urlStr);
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.replace(/\//g, '').trim();
      }
      const idParam = url.searchParams.get('v');
      if (idParam) {
        return idParam;
      }
    } catch (e) {
      return '';
    }
    return '';
  }

  if (loading) {
    return (
      <div className="video-gallery-loading" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-title)', textAlign: 'center', padding: '20px' }}>
        {lang === 'es' ? 'Cargando videos destacados...' : 'Loading featured videos...'}
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className="youtube-gallery" aria-label="Videos Destacados" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <h3 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {lang === 'es' ? 'Últimos Videos' : 'Latest Videos'}
      </h3>
      
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          width: '100%'
        }}
      >
        {videos.map((vid, idx) => (
          <a
            key={idx}
            href={vid.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card"
            style={{
              display: 'block',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'inherit',
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '16/9',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg)`,
              transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Título sobrepuesto en la parte inferior */}
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                padding: '8px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#fff',
                fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {vid.title}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
