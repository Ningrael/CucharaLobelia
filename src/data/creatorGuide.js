// src/data/creatorGuide.js
// ─────────────────────────────────────────────────────────────────────────────
// Manual Oficial y Plantillas para Creadores de Mods de La Cuchara de Lobelia
// Estructura de 4 Tipos de Mods Independientes (Schema v1.0)
// ─────────────────────────────────────────────────────────────────────────────

export const CREATOR_GUIDE_MD = `# 📚 Manual Oficial para Creadores de Mods
### La Cuchara de Lobelia — Engine v3.0 (Schema v1.0)

Bienvenido a la guía oficial para creadores de la comunidad de **La Cuchara de Lobelia**. Este motor es 100% neutral y modular, permitiendo a los jugadores crear, compartir e instalar extensiones sin necesidad de saber programar.

---

## 🧩 Los 4 Tipos de Mods en La Cuchara de Lobelia

Un mod puede especializarse en un solo tipo de contenido o combinar varios si el autor lo desea:

1. **🗺️ TIPO 1: Mod de Misiones & Visor de PDFs** (Mapas de despliegue, objetivos y escenarios 1v1 y 2v2).
2. **🧙‍♂️ TIPO 2: Mod de Árbitro IA** (Base de conocimiento indexada, FAQs y directivas para resolver dudas de reglamento con citas).
3. **⚔️ TIPO 3: Mod de Army Builder (Creador de Listas)** (Facciones, héroes, guerreros, equipo, puntos y reglas de composición).
4. **🎲 TIPO 4: Mod de Duelos & Live Tracker** (Perfiles de combate, tiradas de dados, cálculo de desmoronamiento al 50%/25% y seguimiento de partidas en vivo).

---

## 🗺️ TIPO 1 EN DETALLE: Mod de Misiones & Visor de PDFs

Este tipo de mod permite al usuario visualizar los mapas de despliegue y las reglas completas de las **24 misiones oficiales 1v1** y las **6 misiones de 2v2** (en español e inglés).

El creador del mod puede ofrecer su contenido en dos metodologías distintas, y el usuario puede elegir cómo usarlo según el dispositivo:

### 🌐 Metodología A: Mod Online (Streaming / Enlaces Directos)
* **¿Cómo funciona?:** El autor sube sus archivos PDF a su propio repositorio público en **GitHub**, **GitLab** o a un servidor web público con enlace directo.
* **Peso del Mod:** Menos de **5 KB** (solo contiene el archivo \`mod.json\` con las direcciones web).
* **Ventajas:** Instalación instantánea en 1 segundo. No ocupa espacio de almacenamiento en el móvil del usuario.
* **Ideal para:** Dispositivos con poco espacio o usuarios con conexión continua a internet.

#### Estructura del JSON para Mod Online:
\`\`\`json
{
  "modId": "misiones-fanmade-2026",
  "modName": "Misiones de Torneo Fan-Made 2026",
  "modVersion": "1.0.0",
  "modAuthor": "Concilio Blanco",
  "gameSystem": "MESBG",
  "schemaVersion": "1.0",
  "description": "Escenarios 1v1 y 2v2 con mapas y reglas actualizadas para torneos.",
  "capabilities": ["missions"],
  "missionPdfs": {
    "baseUrl": "https://raw.githubusercontent.com/mi-usuario/mis-misiones/main/pdfs/",
    "missions1v1": {
      "Domination": { "fileEs": "DOMINATION_ES.pdf", "fileEn": "DOMINATION_EN.pdf" },
      "To the Death!": { "fileEs": "TO THE DEATH!_ES.pdf", "fileEn": "TO THE DEATH!_EN.pdf" },
      "Hold Ground": { "fileEs": "HOLD GROUND_ES.pdf", "fileEn": "HOLD GROUND_EN.pdf" },
      "Destroy the Supplies": { "fileEs": "DESTROY THE SUPPLIES_ES.pdf", "fileEn": "DESTROY THE SUPPLIES_EN.pdf" },
      "Reconnoitre": { "fileEs": "RECONNOITRE_ES.pdf", "fileEn": "RECONNOITRE_EN.pdf" },
      "Fog of War": { "fileEs": "FOG OF WAR_ES.pdf", "fileEn": "FOG OF WAR_EN.pdf" },
      "Capture & Control": { "fileEs": "CAPTURE & CONTROL_ES.pdf", "fileEn": "CAPTURE & CONTROL_EN.pdf" },
      "Breakthrough": { "fileEs": "BREAKTHROUGH_ES.pdf", "fileEn": "BREAKTHROUGH_EN.pdf" },
      "Stake a Claim": { "fileEs": "STAKE A CLAIM_ES.pdf", "fileEn": "STAKE A CLAIM_EN.pdf" },
      "Lords of Battle": { "fileEs": "LORDS OF BATTLE_ES.pdf", "fileEn": "LORDS OF BATTLE_EN.pdf" },
      "Assassination": { "fileEs": "ASSASSINATION_ES.pdf", "fileEn": "ASSASSINATION_EN.pdf" },
      "Contest of Champions": { "fileEs": "CONTEST OF CHAMPIONS_ES.pdf", "fileEn": "CONTEST OF CHAMPIONS_EN.pdf" },
      "Heirloom of Ages Past": { "fileEs": "HEIRLOOM OF AGES PAST_ES.pdf", "fileEn": "HEIRLOOM OF AGES PAST_EN.pdf" },
      "Sites of Power": { "fileEs": "SITES OF POWER_ES.pdf", "fileEn": "SITES OF POWER_EN.pdf" },
      "Command the Battlefield": { "fileEs": "COMMAND THE BATTLEFIELD_ES.pdf", "fileEn": "COMMAND THE BATTLEFIELD_EN.pdf" },
      "Retrieval": { "fileEs": "RETRIEVAL_ES.pdf", "fileEn": "RETRIEVAL_EN.pdf" },
      "Seize the Prizes": { "fileEs": "SEIZE THE PRIZES_ES.pdf", "fileEn": "SEIZE THE PRIZES_EN.pdf" },
      "Treasure Hoard": { "fileEs": "TREASURE HOARD_ES.pdf", "fileEn": "TREASURE HOARD_EN.pdf" },
      "Storm the Camp": { "fileEs": "STORM THE CAMP_ES.pdf", "fileEn": "STORM THE CAMP_EN.pdf" },
      "Divide & Conquer": { "fileEs": "DIVIDE & CONQUER_ES.pdf", "fileEn": "DIVIDE & CONQUER_EN.pdf" },
      "Escort the Wounded": { "fileEs": "ESCORT THE WOUNDED_ES.pdf", "fileEn": "ESCORT THE WOUNDED_EN.pdf" },
      "Clash by Moonlight": { "fileEs": "CLASH BY MOONLIGHT_ES.pdf", "fileEn": "CLASH BY MOONLIGHT_EN.pdf" },
      "Lead from the Front": { "fileEs": "LEAD FROM THE FRONT_ES.pdf", "fileEn": "LEAD FROM THE FRONT_EN.pdf" },
      "Convergence": { "fileEs": "CONVERGENCE_ES.pdf", "fileEn": "CONVERGENCE_EN.pdf" }
    },
    "missions2v2": {
      "No Escape": { "fileEs": "2vs2/NO ESCAPE_ES.pdf", "fileEn": "2vs2/NO ESCAPE_EN.pdf" },
      "Total Conquest": { "fileEs": "2vs2/TOTAL CONQUEST_ES.pdf", "fileEn": "2vs2/TOTAL CONQUEST_EN.pdf" },
      "Take & Hold": { "fileEs": "2vs2/TAKE & HOLD_ES.pdf", "fileEn": "2vs2/TAKE & HOLD_EN.pdf" },
      "Clash of Champions": { "fileEs": "2vs2/CLASH OF CHAMPIONS_ES.pdf", "fileEn": "2vs2/CLASH OF CHAMPIONS_EN.pdf" },
      "Cornered": { "fileEs": "2vs2/CORNERED_ES.pdf", "fileEn": "2vs2/CORNERED_EN.pdf" },
      "Duel of Wits": { "fileEs": "2vs2/DUEL OF WITS_ES.pdf", "fileEn": "2vs2/DUEL OF WITS_EN.pdf" }
    }
  }
}
\`\`\`

---

### 📦 Metodología B: Mod Offline (Paquete Local Todo-en-Uno)
* **¿Cómo funciona?:** El autor empaqueta en un archivo \`.zip\` o \`.lobeliamod\` el archivo \`manifest.json\` junto con todos los archivos PDF en una carpeta local.
* **Almacenamiento:** Cuando el usuario instala el paquete, la app guarda los archivos PDF directamente en el **IndexedDB del navegador de ese dispositivo**.
* **Ventajas:** **100% funcional sin conexión a internet.** Los PDFs abren al instante incluso en sótanos de tiendas de wargames o modo avión.
* **Ideal para:** Ordenadores portátiles de torneos, tablets o usuarios que no dependen de WiFi.

---

## 🧙‍♂️ TIPO 2: Mod de Árbitro IA

Permite al motor de IA responder dudas con citas de páginas de libros oficiales o manuales de torneos:

\`\`\`json
{
  "modId": "arbitro-ia-reglas",
  "modName": "Base de Conocimiento y FAQs Oficiales",
  "capabilities": ["rules_ai"],
  "rulesKnowledge": [
    {
      "id": "movimiento_heroico_faq",
      "title": "Movimiento Heroico",
      "category": "Acciones Heroicas",
      "page": "Pág. 68",
      "book": "Rules Manual",
      "summary": "Se declara al inicio de la fase de movimiento antes de tirar prioridad...",
      "tags": ["movimiento", "heroico", "prioridad"]
    }
  ]
}
\`\`\`

---

## ⚔️ TIPO 3: Mod de Army Builder (Creador de Listas)

Define facciones, perfiles de héroes/tropas, costes en puntos y opciones:

\`\`\`json
{
  "modId": "perfiles-facciones-comunidad",
  "modName": "Perfiles y Facciones Completas",
  "capabilities": ["army_builder"],
  "factions": [
    {
      "factionId": "minas_tirith",
      "factionName": "Minas Tirith",
      "side": "good",
      "armyBonus": "Un Reino de Hombres: +1 al Coraje en todos los Héroes.",
      "models": [ ... ]
    }
  ]
}
\`\`\`

---

## 🎲 TIPO 4: Mod de Duelos & Live Tracker

Contiene las tablas de desmoronamiento y reglas de puntuación de partidas en vivo.

---

## 🚀 Publicación Oficial en GitHub Releases

1. Sube tu archivo a un **Release público en GitHub** (o enlace directo sin publicidad).
2. Entra a la pestaña **📤 Envía tu Mod** en La Cuchara de Lobelia y pega el enlace directo.
3. El equipo de administración revisará la compatibilidad técnica antes de que aparezca en el **Workshop público**.
`;

// ── PLANTILLAS DESCARGABLES PARA CADA TIPO DE MOD ────────────────────────────

export const TEMPLATE_MOD_1_MISSIONS = {
  modId: "mi-mod-misiones",
  modName: "Mi Mod de Misiones y Escenarios",
  modVersion: "1.0.0",
  modAuthor: "Mi Nick",
  gameSystem: "MESBG",
  schemaVersion: "1.0",
  description: "Plantilla oficial para escenarios 1v1 y 2v2 con soporte para visor de PDFs online y offline.",
  capabilities: ["missions"],
  tags: ["misiones", "escenarios", "mapas"],
  missionPdfs: {
    baseUrl: "https://raw.githubusercontent.com/tu-usuario/tu-repo/main/pdfs/",
    missions1v1: {
      "Domination": { "fileEs": "DOMINATION_ES.pdf", "fileEn": "DOMINATION_EN.pdf" },
      "To the Death!": { "fileEs": "TO THE DEATH!_ES.pdf", "fileEn": "TO THE DEATH!_EN.pdf" },
      "Hold Ground": { "fileEs": "HOLD GROUND_ES.pdf", "fileEn": "HOLD GROUND_EN.pdf" },
      "Destroy the Supplies": { "fileEs": "DESTROY THE SUPPLIES_ES.pdf", "fileEn": "DESTROY THE SUPPLIES_EN.pdf" },
      "Reconnoitre": { "fileEs": "RECONNOITRE_ES.pdf", "fileEn": "RECONNOITRE_EN.pdf" },
      "Fog of War": { "fileEs": "FOG OF WAR_ES.pdf", "fileEn": "FOG OF WAR_EN.pdf" },
      "Capture & Control": { "fileEs": "CAPTURE & CONTROL_ES.pdf", "fileEn": "CAPTURE & CONTROL_EN.pdf" },
      "Breakthrough": { "fileEs": "BREAKTHROUGH_ES.pdf", "fileEn": "BREAKTHROUGH_EN.pdf" },
      "Stake a Claim": { "fileEs": "STAKE A CLAIM_ES.pdf", "fileEn": "STAKE A CLAIM_EN.pdf" },
      "Lords of Battle": { "fileEs": "LORDS OF BATTLE_ES.pdf", "fileEn": "LORDS OF BATTLE_EN.pdf" },
      "Assassination": { "fileEs": "ASSASSINATION_ES.pdf", "fileEn": "ASSASSINATION_EN.pdf" },
      "Contest of Champions": { "fileEs": "CONTEST OF CHAMPIONS_ES.pdf", "fileEn": "CONTEST OF CHAMPIONS_EN.pdf" },
      "Heirloom of Ages Past": { "fileEs": "HEIRLOOM OF AGES PAST_ES.pdf", "fileEn": "HEIRLOOM OF AGES PAST_EN.pdf" },
      "Sites of Power": { "fileEs": "SITES OF POWER_ES.pdf", "fileEn": "SITES OF POWER_EN.pdf" },
      "Command the Battlefield": { "fileEs": "COMMAND THE BATTLEFIELD_ES.pdf", "fileEn": "COMMAND THE BATTLEFIELD_EN.pdf" },
      "Retrieval": { "fileEs": "RETRIEVAL_ES.pdf", "fileEn": "RETRIEVAL_EN.pdf" },
      "Seize the Prizes": { "fileEs": "SEIZE THE PRIZES_ES.pdf", "fileEn": "SEIZE THE PRIZES_EN.pdf" },
      "Treasure Hoard": { "fileEs": "TREASURE HOARD_ES.pdf", "fileEn": "TREASURE HOARD_EN.pdf" },
      "Storm the Camp": { "fileEs": "STORM THE CAMP_ES.pdf", "fileEn": "STORM THE CAMP_EN.pdf" },
      "Divide & Conquer": { "fileEs": "DIVIDE & CONQUER_ES.pdf", "fileEn": "DIVIDE & CONQUER_EN.pdf" },
      "Escort the Wounded": { "fileEs": "ESCORT THE WOUNDED_ES.pdf", "fileEn": "ESCORT THE WOUNDED_EN.pdf" },
      "Clash by Moonlight": { "fileEs": "CLASH BY MOONLIGHT_ES.pdf", "fileEn": "CLASH BY MOONLIGHT_EN.pdf" },
      "Lead from the Front": { "fileEs": "LEAD FROM THE FRONT_ES.pdf", "fileEn": "LEAD FROM THE FRONT_EN.pdf" },
      "Convergence": { "fileEs": "CONVERGENCE_ES.pdf", "fileEn": "CONVERGENCE_EN.pdf" }
    },
    "missions2v2": {
      "No Escape": { "fileEs": "2vs2/NO ESCAPE_ES.pdf", "fileEn": "2vs2/NO ESCAPE_EN.pdf" },
      "Total Conquest": { "fileEs": "2vs2/TOTAL CONQUEST_ES.pdf", "fileEn": "2vs2/TOTAL CONQUEST_EN.pdf" },
      "Take & Hold": { "fileEs": "2vs2/TAKE & HOLD_ES.pdf", "fileEn": "2vs2/TAKE & HOLD_EN.pdf" },
      "Clash of Champions": { "fileEs": "2vs2/CLASH OF CHAMPIONS_ES.pdf", "fileEn": "2vs2/CLASH OF CHAMPIONS_EN.pdf" },
      "Cornered": { "fileEs": "2vs2/CORNERED_ES.pdf", "fileEn": "2vs2/CORNERED_EN.pdf" },
      "Duel of Wits": { "fileEs": "2vs2/DUEL OF WITS_ES.pdf", "fileEn": "2vs2/DUEL OF WITS_EN.pdf" }
    }
  }
};

export const TEMPLATE_MOD_2_RULES_AI = {
  modId: "mi-mod-arbitro-ia",
  modName: "Mi Mod de Árbitro IA",
  modVersion: "1.0.0",
  modAuthor: "Mi Nick",
  gameSystem: "MESBG",
  schemaVersion: "1.0",
  description: "Base de conocimiento indexada y FAQs oficiales para el árbitro de reglas IA.",
  capabilities: ["rules_ai"],
  tags: ["ia", "reglas", "faqs"],
  rulesKnowledge: [
    {
      id: "regla_ejemplo_1",
      title: "Movimiento Heroico",
      category: "Acciones Heroicas",
      page: "Pág. 68",
      book: "Rules Manual",
      summary: "Se declara al inicio de la fase de movimiento antes de tirar prioridad.",
      fullText: "El jugador activo declara la acción gastando 1 punto de Poder...",
      tags: ["movimiento", "heroico", "prioridad", "poder"]
    }
  ]
};

export const TEMPLATE_MOD_3_ARMY_BUILDER = {
  modId: "mi-mod-army-builder",
  modName: "Mi Mod de Facciones y Miniaturas",
  modVersion: "1.0.0",
  modAuthor: "Mi Nick",
  gameSystem: "MESBG",
  schemaVersion: "1.0",
  description: "Plantilla oficial para facciones, perfiles y reglas de miniaturas del creador de listas.",
  capabilities: ["army_builder", "duels"],
  tags: ["listas", "perfiles", "facciones"],
  factions: [
    {
      factionId: "mi_faccion_ejemplo",
      factionName: "Mi Facción Temática",
      side: "good",
      armyBonus: "Valor Indomable: +1 al combate al defender objetivos.",
      models: [
        {
          id: "capitan_ejemplo",
          name: "Capitán del Bosque",
          type: "hero",
          heroicTier: "Hero of Fortitude",
          points: 60,
          movement: "6\"",
          fight: "5/3+",
          strength: 4,
          defense: 5,
          attacks: 2,
          wounds: 2,
          courage: 5,
          might: 2,
          will: 1,
          fate: 1,
          wargear: ["Espada élfica", "Armadura"],
          options: [
            { "name": "Arco élfico", "points": 5, "isBow": true },
            { "name": "Caballo", "points": 10, "isBow": false }
          ],
          specialRules: [
            { "name": "Paso Ligero", "description": "No sufre penalización por terreno difícil boscoso." }
          ]
        }
      ]
    }
  ]
};

export const TEMPLATE_MOD_4_DUELS = {
  modId: "mi-mod-duelos-tracker",
  modName: "Mi Mod de Duelos y Tracker",
  modVersion: "1.0.0",
  modAuthor: "Mi Nick",
  gameSystem: "MESBG",
  schemaVersion: "1.0",
  description: "Plantilla para cálculo de desmoronamiento y simulador de duelos.",
  capabilities: ["duels"],
  tags: ["duelos", "tracker"]
};
