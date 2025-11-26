// js/calendario.js

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy5hrB0FwvIj9iStea3SEdKjK0JGAFk8-zwWOKesUWcRTNXXOJtPPYVT5eBD1DPG4VHd6Ko4qsLo_p/pub?output=csv';

let allEvents = [];
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
});

async function initCalendar() {
    // Setup listeners
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('go-today').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });

    // Add Event Modal Listeners (Removed - button now links directly)
    /* 
    const addBtnImg = document.getElementById('btn-add-event-img');
    ... logic removed ...
    */

    // Event Details Modal Logic (Backdrop click)
    const backdrop = document.getElementById('event-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            document.getElementById('event-modal').style.display = 'none';
            backdrop.style.display = 'none';
            document.getElementById('event-modal').setAttribute('aria-hidden', 'true');
        });
    }

    // Language switchers
    const { setStoredLang, applyDomTranslations, detectInitialLang } = window.LobeliaI18n;

    function updateLanguage(lang) {
        setStoredLang(lang);
        applyDomTranslations(lang);
        renderCalendar();
        updateAddEventButton(lang);
    }

    document.getElementById('lang-es').addEventListener('click', () => updateLanguage('es'));
    document.getElementById('lang-en').addEventListener('click', () => updateLanguage('en'));

    // Initial setup
    const initialLang = detectInitialLang();
    updateAddEventButton(initialLang);
    renderCalendar();
    await fetchEvents();
}

function updateAddEventButton(lang) {
    const btnImg = document.getElementById('btn-add-event-img');
    if (btnImg) {
        // Normalise lang to 'es' or 'en'
        const l = lang.startsWith('es') ? 'es' : 'en';
        const imgName = l === 'es' ? 'AñadirEvento.png' : 'AddEvent.png';
        btnImg.src = `images/${imgName}`;
        btnImg.alt = l === 'es' ? 'Añadir Evento' : 'Add Event';
    }
}

async function fetchEvents() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();
        allEvents = parseCSV(text);
        renderCalendar();
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update Header
    const lang = window.LobeliaI18n.detectInitialLang();
    const monthName = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(currentDate);
    document.getElementById('current-month-year').textContent = monthName;

    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const startDay = firstDayOfMonth.getDay();

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-cell other-month';
        dayDiv.textContent = prevMonthLastDay - i;
        daysContainer.appendChild(dayDiv);
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-cell';
        dayDiv.textContent = i;

        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            dayDiv.classList.add('today');
        }

        const dayEvents = allEvents.filter(e => {
            const eDate = parseDate(e.date);
            return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === i;
        });

        if (dayEvents.length > 0) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'event-dots';
            dayEvents.forEach(event => {
                const dot = document.createElement('span');
                dot.className = `event-dot ${getEventTypeClass(event.type)}`;
                dotsContainer.appendChild(dot);
            });
            dayDiv.appendChild(dotsContainer);
        }

        // Selection Logic
        dayDiv.addEventListener('click', () => {
            document.querySelectorAll('.day-cell.selected').forEach(el => el.classList.remove('selected'));
            dayDiv.classList.add('selected');
            if (dayEvents.length > 0) {
                openEventModal(i, monthName, dayEvents);
            }
        });

        daysContainer.appendChild(dayDiv);
    }

    // Next month padding to fill 42 cells (6 rows)
    const totalCellsFilled = startDay + daysInMonth;
    const totalCellsToFill = 42; // 6 rows * 7 days

    for (let i = 1; i <= (totalCellsToFill - totalCellsFilled); i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-cell other-month';
        dayDiv.textContent = i;
        daysContainer.appendChild(dayDiv);
    }
}

function getEventTypeClass(type) {
    if (!type) return 'type-other';
    const t = type.toLowerCase();
    if (t.includes('torneo') || t.includes('tournament')) return 'type-tournament';
    if (t.includes('liga') || t.includes('league')) return 'type-league';
    if (t.includes('jornada') || t.includes('journey')) return 'type-journey';
    return 'type-other';
}

function openEventModal(day, monthName, events) {
    const modal = document.getElementById('event-modal');
    const backdrop = document.getElementById('event-backdrop');
    const content = document.getElementById('event-modal-content');
    const title = document.getElementById('event-modal-title');
    const closeBtn = document.getElementById('event-modal-close');

    title.textContent = `${day} ${monthName}`;
    content.innerHTML = '';

    events.forEach(event => {
        const item = document.createElement('div');
        item.className = 'modal-event-item';
        item.style.borderLeftColor = getEventColor(event.type);

        let whatsappHtml = '';
        if (event.whatsapp && event.whatsapp.trim() !== '') {
            whatsappHtml = `<p><a href="${event.whatsapp}" target="_blank" style="color:#25D366; text-decoration:none;">📱 <span data-i18n="whatsapp_group">Grupo WhatsApp</span></a></p>`;
        }

        let descHtml = '';
        if (event.description && event.description.trim() !== '') {
            descHtml = `<p style="margin-top:8px; font-style:italic; font-size:0.85rem; border-top:1px solid #ccc; padding-top:4px;">${event.description}</p>`;
        }

        item.innerHTML = `
            <h4>${event.name}</h4>
            <p><strong>📍 ${event.place}</strong></p>
            <p>🏷️ ${event.type}</p>
            ${whatsappHtml}
            ${descHtml}
            <a href="${event.link}" target="_blank" data-i18n="more_info">Más info</a>
        `;
        content.appendChild(item);
    });

    if (window.LobeliaI18n && window.LobeliaI18n.applyDomTranslations) {
        window.LobeliaI18n.applyDomTranslations(window.LobeliaI18n.detectInitialLang(), content);
    }

    modal.style.display = 'block';
    backdrop.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    const closeModal = () => {
        modal.style.display = 'none';
        backdrop.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    };

    closeBtn.onclick = closeModal;
    backdrop.onclick = closeModal;
}

function getEventColor(type) {
    const cls = getEventTypeClass(type);
    if (cls === 'type-tournament') return '#4a90e2';
    if (cls === 'type-league') return '#e24a4a';
    if (cls === 'type-journey') return '#f5a623';
    return '#7ed321';
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const events = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length >= 6) {
            events.push({
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
    return events;
}

function parseCSVLine(text) {
    const result = [];
    let startValue = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
            let val = text.substring(startValue, i).trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            result.push(val);
            startValue = i + 1;
        }
    }
    let lastVal = text.substring(startValue).trim();
    if (lastVal.startsWith('"') && lastVal.endsWith('"')) lastVal = lastVal.slice(1, -1);
    result.push(lastVal);
    return result;
}

function parseDate(dateStr) {
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
    }
    return new Date(dateStr);
}
