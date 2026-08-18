// src/utils/pdfGenerator.js
// ─────────────────────────────────────────────────────────────────────────────
// Generador de PDF oficial con estética de La Cuchara de Lobelia
// Manual de Creadores de Mods + Especificación para Agentes de IA
// ─────────────────────────────────────────────────────────────────────────────

import { jsPDF } from 'jspdf';

export function generateCreatorGuidePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const checkPageBreak = (spaceNeeded = 20) => {
    if (y + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      drawPageBackground();
      y = 25;
    }
  };

  const drawPageBackground = () => {
    // Fondo oscuro premium
    doc.setFillColor(17, 24, 19); // #111813
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Marco exterior dorado sutil
    doc.setDrawColor(203, 161, 53); // #cba135
    doc.setLineWidth(0.6);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Pie de página
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('La Cuchara de Lobelia — Manual Oficial de Creadores (Schema v1.0)', 14, pageHeight - 13);
    doc.text(`Pág. ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 24, pageHeight - 13);
  };

  // ── PÁGINA 1: PORTADA & GUÍA PARA HUMANOS ─────────────────────────────────
  drawPageBackground();

  // Cabecera / Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(203, 161, 53);
  doc.text('LA CUCHARA DE LOBELIA', pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('MANUAL OFICIAL PARA CREADORES DE MODS', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text('Guía paso a paso para crear, alojar y publicar mods de Misiones y PDFs en 1 Clic', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Separador dorado
  doc.setDrawColor(203, 161, 53);
  doc.setLineWidth(0.4);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Sección 1: Introducción
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(203, 161, 53);
  doc.text('1. ¿QUÉ ES UN MOD Y CÓMO FUNCIONA?', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);
  const introText = 
    'La Cuchara de Lobelia es un motor neutral que no almacena ni distribuye material con derechos de autor. ' +
    'Todos los mapas, documentos y reglas son aportados por la comunidad a través de Mods en formato JSON ' +
    'y archivos PDF alojados de forma independiente (por ejemplo, en GitHub). Al instalar un mod, los datos ' +
    'se guardan en la memoria local (IndexedDB) de tu navegador para que funcionen 100% desconectados de internet.';
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 28);
  doc.text(splitIntro, 14, y);
  y += (splitIntro.length * 4.2) + 6;

  // Sección 2: Estructura de Carpetas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(203, 161, 53);
  doc.text('2. ESTRUCTURA EXACTA DE CARPETAS Y ARCHIVOS', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(230, 230, 230);

  // Recuadro de diagrama
  doc.setFillColor(10, 15, 12);
  doc.setDrawColor(203, 161, 53);
  doc.setLineWidth(0.3);
  doc.rect(14, y, pageWidth - 28, 48, 'FD');

  const treeLines = [
    'mi-repositorio-misiones/',
    '├── mod-misiones.json          <-- Archivo manifiesto de configuración en la RAÍZ',
    '├── README.md                  <-- Archivo informativo inicial del repositorio',
    '└── pdfs/                      <-- CARPETA PRINCIPAL DE DOCUMENTOS',
    '    ├── DOMINATION_ES.pdf      <-- Las 24 misiones 1v1 van SUELTAS dentro de pdfs/',
    '    ├── DOMINATION_EN.pdf',
    '    ├── TO THE DEATH!_ES.pdf',
    '    ├── ... (resto de las 24 misiones 1v1)',
    '    └── 2vs2/                  <-- SUBCARPETA OBLIGATORIA PARA MISIONES 2vs2',
    '        ├── NO ESCAPE_ES.pdf',
    '        ├── TOTAL CONQUEST_ES.pdf',
    '        └── ... (las 6 misiones 2v2)'
  ];

  let treeY = y + 5;
  treeLines.forEach(line => {
    if (line.includes('<--')) {
      const parts = line.split('<--');
      doc.setTextColor(46, 204, 113);
      doc.text(parts[0], 18, treeY);
      doc.setTextColor(180, 180, 180);
      doc.text('<--' + parts[1], 18 + doc.getTextWidth(parts[0]), treeY);
    } else {
      doc.setTextColor(203, 161, 53);
      doc.text(line, 18, treeY);
    }
    treeY += 3.8;
  });
  y += 54;

  // Sección 3: Paso a Paso en GitHub
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(203, 161, 53);
  doc.text('3. PASO A PASO: SUBIDA A GITHUB Y PUBLICACIÓN', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);

  const steps = [
    'Paso 1: Entra a GitHub.com y crea un nuevo repositorio público (ej: "mesbg-missions-mod") con un README.md.',
    'Paso 2: En la raíz del repositorio, haz clic en "Add file" -> "Upload files", arrastra tu "mod-misiones.json" y pulsa "Commit changes".',
    'Paso 3: Sube tus PDFs en la carpeta "pdfs/" y "pdfs/2vs2/" (o crea un Release adjuntando el paquete .zip).',
    'Paso 4: Tu enlace universal de descarga será: https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/mod-misiones.json',
    'Paso 5: En La Cuchara de Lobelia, ve a Mods -> Envía tu Mod, pega el enlace, rellena el autor y pulsa "Enviar a Moderación".'
  ];

  steps.forEach((step, idx) => {
    const splitStep = doc.splitTextToSize(step, pageWidth - 32);
    doc.setTextColor(203, 161, 53);
    doc.text(`•`, 14, y);
    doc.setTextColor(220, 220, 220);
    doc.text(splitStep, 18, y);
    y += (splitStep.length * 4.2) + 2;
  });

  // ── PÁGINA 2: TABLAS OFICIALES DE MISIONES ─────────────────────────────────
  doc.addPage();
  drawPageBackground();
  y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(203, 161, 53);
  doc.text('TABLA OFICIAL DE NOMBRES DE ARCHIVO Y CLAVES JSON', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9.5);
  doc.text('Misiones 1vs1 (Ubicadas sueltas en "pdfs/")', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  const missions1v1List = [
    ['Domination', 'DOMINATION_ES.pdf', 'DOMINATION_EN.pdf'],
    ['To the Death!', 'TO THE DEATH!_ES.pdf', 'TO THE DEATH!_EN.pdf'],
    ['Hold Ground', 'HOLD GROUND_ES.pdf', 'HOLD GROUND_EN.pdf'],
    ['Destroy the Supplies', 'DESTROY THE SUPPLIES_ES.pdf', 'DESTROY THE SUPPLIES_EN.pdf'],
    ['Reconnoitre', 'RECONNOITRE_ES.pdf', 'RECONNOITRE_EN.pdf'],
    ['Fog of War', 'FOG OF WAR_ES.pdf', 'FOG OF WAR_EN.pdf'],
    ['Capture & Control', 'CAPTURE & CONTROL_ES.pdf', 'CAPTURE & CONTROL_EN.pdf'],
    ['Breakthrough', 'BREAKTHROUGH_ES.pdf', 'BREAKTHROUGH_EN.pdf'],
    ['Stake a Claim', 'STAKE A CLAIM_ES.pdf', 'STAKE A CLAIM_EN.pdf'],
    ['Lords of Battle', 'LORDS OF BATTLE_ES.pdf', 'LORDS OF BATTLE_EN.pdf'],
    ['Assassination', 'ASSASSINATION_ES.pdf', 'ASSASSINATION_EN.pdf'],
    ['Contest of Champions', 'CONTEST OF CHAMPIONS_ES.pdf', 'CONTEST OF CHAMPIONS_EN.pdf'],
    ['Heirloom of Ages Past', 'HEIRLOOM OF AGES PAST_ES.pdf', 'HEIRLOOM OF AGES PAST_EN.pdf'],
    ['Sites of Power', 'SITES OF POWER_ES.pdf', 'SITES OF POWER_EN.pdf'],
    ['Command the Battlefield', 'COMMAND THE BATTLEFIELD_ES.pdf', 'COMMAND THE BATTLEFIELD_EN.pdf'],
    ['Retrieval', 'RETRIEVAL_ES.pdf', 'RETRIEVAL_EN.pdf'],
    ['Seize the Prizes', 'SEIZE THE PRIZES_ES.pdf', 'SEIZE THE PRIZES_EN.pdf'],
    ['Treasure Hoard', 'TREASURE HOARD_ES.pdf', 'TREASURE HOARD_EN.pdf'],
    ['Storm the Camp', 'STORM THE CAMP_ES.pdf', 'STORM THE CAMP_EN.pdf'],
    ['Divide & Conquer', 'DIVIDE & CONQUER_ES.pdf', 'DIVIDE & CONQUER_EN.pdf'],
    ['Escort the Wounded', 'ESCORT THE WOUNDED_ES.pdf', 'ESCORT THE WOUNDED_EN.pdf'],
    ['Clash by Moonlight', 'CLASH BY MOONLIGHT_ES.pdf', 'CLASH BY MOONLIGHT_EN.pdf'],
    ['Lead from the Front', 'LEAD FROM THE FRONT_ES.pdf', 'LEAD FROM THE FRONT_EN.pdf'],
    ['Convergence', 'CONVERGENCE_ES.pdf', 'CONVERGENCE_EN.pdf']
  ];

  // Render 2 columnas para 1v1
  const col1 = missions1v1List.slice(0, 12);
  const col2 = missions1v1List.slice(12, 24);

  const startYTable = y;
  [col1, col2].forEach((colData, cIdx) => {
    let curY = startYTable;
    const xOffset = cIdx === 0 ? 14 : (pageWidth / 2) + 2;

    colData.forEach(row => {
      doc.setTextColor(203, 161, 53);
      doc.text(row[0], xOffset, curY);
      doc.setTextColor(180, 180, 180);
      doc.text(`-> ${row[1]}`, xOffset + 40, curY);
      curY += 4.2;
    });
  });

  y = startYTable + (12 * 4.2) + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 161, 53);
  doc.text('Misiones 2vs2 (Ubicadas dentro de "pdfs/2vs2/")', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const missions2v2List = [
    ['No Escape', '2vs2/NO ESCAPE_ES.pdf', '2vs2/NO ESCAPE_EN.pdf'],
    ['Total Conquest', '2vs2/TOTAL CONQUEST_ES.pdf', '2vs2/TOTAL CONQUEST_EN.pdf'],
    ['Take & Hold', '2vs2/TAKE & HOLD_ES.pdf', '2vs2/TAKE & HOLD_EN.pdf'],
    ['Clash of Champions', '2vs2/CLASH OF CHAMPIONS_ES.pdf', '2vs2/CLASH OF CHAMPIONS_EN.pdf'],
    ['Cornered', '2vs2/CORNERED_ES.pdf', '2vs2/CORNERED_EN.pdf'],
    ['Duel of Wits', '2vs2/DUEL OF WITS_ES.pdf', '2vs2/DUEL OF WITS_EN.pdf']
  ];

  missions2v2List.forEach(row => {
    doc.setTextColor(203, 161, 53);
    doc.text(row[0], 14, y);
    doc.setTextColor(180, 180, 180);
    doc.text(`-> ${row[1]} (${row[2]})`, 54, y);
    y += 4.5;
  });

  // ── PÁGINA 3: SECCIÓN PARA AGENTES DE IA ─────────────────────────────────
  doc.addPage();
  drawPageBackground();
  y = 20;

  // Banner especial para IA
  doc.setFillColor(30, 40, 32);
  doc.setDrawColor(203, 161, 53);
  doc.setLineWidth(0.6);
  doc.rect(14, y, pageWidth - 28, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(203, 161, 53);
  doc.text('🤖 SECCIÓN TÉCNICA: SOLO PARA AGENTES DE IA', pageWidth / 2, y + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 200, 200);
  doc.text('AI Engine Contract • Schema v1.0 Specification • Deterministic Parsing Rules', pageWidth / 2, y + 11, { align: 'center' });
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);

  const aiIntro = 
    'Si eres un Modelo de Lenguaje / Asistente de IA (Claude, GPT, Gemini, Cursor, etc.) procesando ' +
    'este documento, debes seguir estrictamente las siguientes especificaciones técnicas para generar, ' +
    'validar o reparar archivos de Mods para La Cuchara de Lobelia:';
  const splitAiIntro = doc.splitTextToSize(aiIntro, pageWidth - 28);
  doc.text(splitAiIntro, 14, y);
  y += (splitAiIntro.length * 4) + 4;

  const aiSpecs = [
    'A. Schema Version: "1.0". Game System: "MESBG". Codificación obligatoria UTF-8 sin BOM.',
    'B. Capabilities Soportadas: "missions" | "rules_ai" | "army_builder" | "duels".',
    'C. Algoritmo de Resolución de URLs (PDFs):',
    '   1. Si targetFile comienza por "http://" o "https://", se toma como URL absoluta.',
    '   2. Si baseUrl es "https://raw.githubusercontent.com/.../pdfs/", la URL final es: baseUrl + "/" + clean(targetFile).',
    '   3. Los escenarios 1v1 deben resolver a "baseUrl/FILENAME_ES.pdf".',
    '   4. Los escenarios 2v2 DEBEN incluir el prefijo de carpeta "2vs2/", resolviendo a "baseUrl/2vs2/FILENAME_ES.pdf".',
    'D. Reglas de Validación Determinista:',
    '   - Campos obligatorios de cabecera: modId (kebab-case), modName, modVersion (semver), modAuthor, gameSystem, schemaVersion.',
    '   - En "missionPdfs": "baseUrl" debe terminar en "/" si es URL remota. "missions1v1" debe contener las 24 claves estándar.',
    'E. Consideraciones de Seguridad y Privacidad:',
    '   - NO incrustar código JavaScript ejecutable, funciones evaluadas ni llamadas a APIs privadas.',
    '   - El archivo mod debe ser un documento puramente declarativo de datos estáticos en formato JSON estándar.',
    '   - La descarga en cliente se efectúa mediante HTTP GET con CORS habilitado vía raw.githubusercontent.com.'
  ];

  aiSpecs.forEach(spec => {
    const splitSpec = doc.splitTextToSize(spec, pageWidth - 28);
    if (spec.startsWith('A.') || spec.startsWith('B.') || spec.startsWith('C.') || spec.startsWith('D.') || spec.startsWith('E.')) {
      doc.setTextColor(203, 161, 53);
    } else {
      doc.setTextColor(220, 220, 220);
    }
    doc.text(splitSpec, 14, y);
    y += (splitSpec.length * 3.8) + 2;
  });

  return doc;
}
