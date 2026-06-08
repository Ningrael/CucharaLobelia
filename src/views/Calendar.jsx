// src/views/Calendar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../components/Modal';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy5hrB0FwvIj9iStea3SEdKjK0JGAFk8-zwWOKesUWcRTNXXOJtPPYVT5eBD1DPG4VHd6Ko4qsLo_p/pub?output=csv';

export default function Calendar({ lang, translations }) {
  const t = translations[lang];

  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null); // { day, eventsList }
  const [modalTitle, setModalTitle] = useState('');

  // 1. Cargar y parsear el CSV de Google Sheets
  useEffect(() => {
    function parseCSV(text) {
      const rows = [];
      let currentRow = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentVal);
          currentVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          currentRow.push(currentVal);
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentVal = '';
        } else {
          currentVal += char;
        }
      }

      if (currentRow.length > 0) {
        currentRow.push(currentVal);
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
      }

      const parsedEvents = [];
      // Empezar en i=1 para omitir cabecera
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 6) {
          parsedEvents.push({
            timestamp: row[0],
            name: row[1],
            date: row[2],
            place: row[3],
            type: row[4],
            link: row[5],
            whatsapp: row[6] || '',
            description: row[7] || ''
          });
        }
      }
      return parsedEvents;
    }

    fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch events spreadsheet');
        return res.text();
      })
      .then((text) => {
        setEvents(parseCSV(text));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching calendar events:', err);
        setLoading(false);
      });
  }, []);

  // Helper para analizar la fecha
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    return new Date(dateStr);
  };

  const getEventTypeClass = (type) => {
    if (!type) return 'type-other';
    const typeStr = type.toLowerCase();
    if (typeStr.includes('torneo') || typeStr.includes('tournament')) return 'type-tournament';
    if (typeStr.includes('liga') || typeStr.includes('league')) return 'type-league';
    if (typeStr.includes('jornada') || typeStr.includes('journey')) return 'type-journey';
    return 'type-other';
  };

  const getEventColor = (type) => {
    const cls = getEventTypeClass(type);
    if (cls === 'type-tournament') return '#4a90e2'; // Azul
    if (cls === 'type-league') return '#e24a4a';      // Rojo
    if (cls === 'type-journey') return '#f5a623';     // Naranja
    return '#7ed321';                                 // Verde
  };

  // 2. Generar el Calendario del Mes Activo
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Días de desfase inicial (0: Domingo, 1: Lunes, etc.)
    const startDayOffset = firstDay.getDay();

    const cells = [];

    // Relleno del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOffset - 1; i >= 0; i--) {
      cells.push({
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
        key: `prev-${i}`
      });
    }

    // Días del mes actual
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      
      // Filtrar eventos de este día
      const dayEvents = events.filter((e) => {
        const eDate = parseDate(e.date);
        return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === d;
      });

      cells.push({
        dayNum: d,
        isCurrentMonth: true,
        isToday,
        eventsList: dayEvents,
        key: `curr-${d}`
      });
    }

    // Relleno del mes siguiente para completar cuadrícula estándar de 42 celdas
    const cellsFilled = startDayOffset + daysInMonth;
    const cellsRemaining = 42 - cellsFilled;
    for (let i = 1; i <= cellsRemaining; i++) {
      cells.push({
        dayNum: i,
        isCurrentMonth: false,
        key: `next-${i}`
      });
    }

    return cells;
  }, [currentDate, events]);

  const monthYearLabel = useMemo(() => {
    return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(currentDate);
  }, [currentDate, lang]);

  const handleMonthChange = (delta) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(nextDate);
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (cell) => {
    if (cell.isCurrentMonth && cell.eventsList && cell.eventsList.length > 0) {
      setModalTitle(`${cell.dayNum} ${monthYearLabel}`);
      setSelectedDayEvents(cell.eventsList);
    }
  };

  const dayNames = lang === 'es' 
    ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Controles de Navegación del Mes */}
      <div 
        className="glass-card" 
        style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '14px 16px'
        }}
      >
        <button 
          className="btn btn-small" 
          onClick={() => handleMonthChange(-1)}
          style={{ minHeight: '38px', minWidth: '38px', padding: 0 }}
        >
          &lt;
        </button>
        
        <h2 style={{ fontSize: '0.98rem', textTransform: 'capitalize', color: 'var(--gold-primary)' }}>
          {monthYearLabel}
        </h2>
        
        <button 
          className="btn btn-small" 
          onClick={() => handleMonthChange(1)}
          style={{ minHeight: '38px', minWidth: '38px', padding: 0 }}
        >
          &gt;
        </button>
      </div>

      {/* Botón Hoy */}
      <button 
        className="btn btn-small" 
        onClick={handleGoToday}
        style={{ width: '100%', minHeight: '38px' }}
      >
        {t.today}
      </button>

      {/* Cuadrícula del Calendario */}
      <div className="glass-card" style={{ padding: '12px' }}>
        {/* Cabecera de días de la semana */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-title)',
            letterSpacing: '0.05em',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          {dayNames.map((day, idx) => (
            <div key={idx}>{day}</div>
          ))}
        </div>

        {/* Celdas de días */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            {t.loading}
          </div>
        ) : (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginTop: '8px'
            }}
          >
            {calendarCells.map((cell) => {
              const hasEvents = cell.eventsList && cell.eventsList.length > 0;
              
              return (
                <button
                  key={cell.key}
                  disabled={!cell.isCurrentMonth}
                  onClick={() => handleDayClick(cell)}
                  style={{
                    aspectRatio: '1',
                    background: cell.isToday 
                      ? 'rgba(203, 161, 53, 0.25)' 
                      : cell.isCurrentMonth ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    border: cell.isToday 
                      ? '1px solid var(--gold-primary)' 
                      : cell.isCurrentMonth ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: cell.isCurrentMonth 
                      ? (cell.isToday ? 'var(--gold-primary)' : 'var(--text-primary)') 
                      : 'var(--text-muted)',
                    cursor: (cell.isCurrentMonth && hasEvents) ? 'pointer' : 'default',
                    fontSize: '0.9rem',
                    fontWeight: cell.isToday || hasEvents ? 'bold' : 'normal',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    outline: 'none',
                    minWidth: '40px',
                    opacity: cell.isCurrentMonth ? 1 : 0.25
                  }}
                >
                  <span>{cell.dayNum}</span>
                  
                  {/* Puntos de Eventos */}
                  {cell.isCurrentMonth && hasEvents && (
                    <div 
                      style={{
                        display: 'flex',
                        gap: '2px',
                        justifyContent: 'center',
                        position: 'absolute',
                        bottom: '4px',
                        width: '100%'
                      }}
                    >
                      {cell.eventsList.map((e, idx) => (
                        <span 
                          key={idx} 
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: getEventColor(e.type)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Leyenda de Eventos */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '14px',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4a90e2' }} />
          <span>{lang === 'es' ? 'Torneo' : 'Tournament'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e24a4a' }} />
          <span>{lang === 'es' ? 'Liga' : 'League'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f5a623' }} />
          <span>{lang === 'es' ? 'Jornada' : 'Journey'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7ed321' }} />
          <span>{lang === 'es' ? 'Otro' : 'Other'}</span>
        </div>
      </div>

      {/* Botón para Añadir Evento (Enlace al Formulario de Google) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <a 
          href="https://forms.gle/UpZQL1P7LkjcaruY8" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary"
          style={{ width: '100%', textDecoration: 'none' }}
        >
          ➕ {lang === 'es' ? 'Añadir mi Evento' : 'Add my Event'}
        </a>
      </div>

      {/* Modal de Detalle de Eventos */}
      <Modal 
        isOpen={!!selectedDayEvents} 
        onClose={() => setSelectedDayEvents(null)}
        title={modalTitle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {selectedDayEvents && selectedDayEvents.map((event, idx) => (
            <div 
              key={idx}
              className="glass-card"
              style={{
                padding: '16px',
                borderLeft: `4px solid ${getEventColor(event.type)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(255,255,255,0.01)'
              }}
            >
              <h4 style={{ fontSize: '0.98rem', color: '#fff' }}>{event.name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>📍 {event.place}</strong>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                🏷️ {event.type}
              </p>

              {event.whatsapp && (
                <p style={{ marginTop: '4px' }}>
                  <a 
                    href={event.whatsapp} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#25D366', 
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 'bold' 
                    }}
                  >
                    <span>📱</span> {lang === 'es' ? 'Unirse al grupo de WhatsApp' : 'Join WhatsApp Group'}
                  </a>
                </p>
              )}

              {event.description && (
                <p 
                  style={{ 
                    fontSize: '0.82rem', 
                    color: 'var(--text-secondary)', 
                    borderTop: '1px solid rgba(255,255,255,0.05)', 
                    paddingTop: '8px', 
                    marginTop: '4px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {event.description}
                </p>
              )}

              {event.link && event.link.trim() !== '' && (
                <a 
                  href={event.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-small"
                  style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                >
                  {t.more_info}
                </a>
              )}
            </div>
          ))}
        </div>
      </Modal>

    </div>
  );
}
