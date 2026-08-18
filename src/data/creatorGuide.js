// src/data/creatorGuide.js
// ─────────────────────────────────────────────────────────────────────────────
// Manual Oficial y Plantillas para Creadores de Mods de La Cuchara de Lobelia
// Estructura de 4 Tipos de Mods Independientes (Schema v1.0)
// ─────────────────────────────────────────────────────────────────────────────

export const CREATOR_GUIDE_MD = `# 📚 Manual Oficial para Creadores de Mods
### La Cuchara de Lobelia — Engine v3.0 (Schema v1.0)

Bienvenido a la guía oficial para creadores de la comunidad de **La Cuchara de Lobelia**. Este motor es **100% neutral y modular**, lo que significa que el servidor no aloja ningún contenido propietario; todo el material es aportado por la comunidad mediante archivos de datos y alojamientos independientes.

---

## 🧩 Los 4 Tipos de Mods en La Cuchara de Lobelia

1. **🗺️ TIPO 1: Mod de Misiones & Visor de PDFs** (Escenarios 1v1 y 2v2, mapas de despliegue y objetivos).
2. **🧙‍♂️ TIPO 2: Mod de Árbitro IA** (Base de conocimiento indexada, FAQs y citas exactas de manuales).
3. **⚔️ TIPO 3: Mod de Army Builder** (Facciones, miniaturas, atributos, puntos y opciones de equipo).
4. **🎲 TIPO 4: Mod de Duelos & Live Tracker** (Puntos de desmoronamiento al 50%/25% y seguimiento en vivo).

---

## 🗺️ GUÍA EXHAUSTIVA: Cómo Crear y Publicar un Mod de Misiones (Tipo 1)

---

### 📂 1. Estructura Exacta de Carpetas y Ubicación de los PDFs

Para que el visor de La Cuchara de Lobelia encuentre cada PDF sin errores, debes organizar tus carpetas en tu ordenador y en tu repositorio de GitHub exactamente así:

\`\`\`text
📁 mi-repositorio-misiones/
│
├── 📄 mod-misiones.json          <-- Archivo de configuración en la RAÍZ
├── 📄 README.md                  <-- Archivo descriptivo inicial
│
└── 📁 pdfs/                      <-- CARPETA PRINCIPAL DE DOCUMENTOS
    ├── 📄 DOMINATION_ES.pdf      <-- Misiones 1v1 sueltas dentro de pdfs/
    ├── 📄 DOMINATION_EN.pdf
    ├── 📄 TO THE DEATH!_ES.pdf
    ├── 📄 TO THE DEATH!_EN.pdf
    ├── 📄 HOLD GROUND_ES.pdf
    ├── 📄 HOLD GROUND_EN.pdf
    ├── ... (resto de las 24 misiones 1v1)
    │
    └── 📁 2vs2/                  <-- SUBCARPETA OBLIGATORIA PARA MISIONES 2vs2
        ├── 📄 NO ESCAPE_ES.pdf
        ├── 📄 NO ESCAPE_EN.pdf
        ├── 📄 TOTAL CONQUEST_ES.pdf
        ├── 📄 TOTAL CONQUEST_EN.pdf
        ├── 📄 TAKE & HOLD_ES.pdf
        ├── 📄 TAKE & HOLD_EN.pdf
        ├── 📄 CLASH OF CHAMPIONS_ES.pdf
        ├── 📄 CLASH OF CHAMPIONS_EN.pdf
        ├── 📄 CORNERED_ES.pdf
        ├── 📄 CORNERED_EN.pdf
        ├── 📄 DUEL OF WITS_ES.pdf
        └── 📄 DUEL OF WITS_EN.pdf
\`\`\`

> ⚠️ **REGLA DE ORO DE CARPETAS:**
> * Los PDFs de las **24 misiones 1v1** van **sueltos** directamente dentro de la carpeta \`pdfs/\`.
> * Los PDFs de las **6 misiones 2vs2** van dentro de la **subcarpeta** \`pdfs/2vs2/\`.

---

### 🏷️ 2. Tabla Oficial de Nombres de Archivo y Claves

Tu archivo \`mod-misiones.json\` debe enlazar cada escenario usando las siguientes claves exactas:

#### ⚔️ Misiones 1 vs 1 (24 Escenarios en \`pdfs/\`):

| Clave en JSON (\`missions1v1\`) | Archivo Español (\`fileEs\`) | Archivo Inglés (\`fileEn\`) |
| :--- | :--- | :--- |
| \`"Domination"\` | \`DOMINATION_ES.pdf\` | \`DOMINATION_EN.pdf\` |
| \`"To the Death!"\` | \`TO THE DEATH!_ES.pdf\` | \`TO THE DEATH!_EN.pdf\` |
| \`"Hold Ground"\` | \`HOLD GROUND_ES.pdf\` | \`HOLD GROUND_EN.pdf\` |
| \`"Destroy the Supplies"\` | \`DESTROY THE SUPPLIES_ES.pdf\` | \`DESTROY THE SUPPLIES_EN.pdf\` |
| \`"Reconnoitre"\` | \`RECONNOITRE_ES.pdf\` | \`RECONNOITRE_EN.pdf\` |
| \`"Fog of War"\` | \`FOG OF WAR_ES.pdf\` | \`FOG OF WAR_EN.pdf\` |
| \`"Capture & Control"\` | \`CAPTURE & CONTROL_ES.pdf\` | \`CAPTURE & CONTROL_EN.pdf\` |
| \`"Breakthrough"\` | \`BREAKTHROUGH_ES.pdf\` | \`BREAKTHROUGH_EN.pdf\` |
| \`"Stake a Claim"\` | \`STAKE A CLAIM_ES.pdf\` | \`STAKE A CLAIM_EN.pdf\` |
| \`"Lords of Battle"\` | \`LORDS OF BATTLE_ES.pdf\` | \`LORDS OF BATTLE_EN.pdf\` |
| \`"Assassination"\` | \`ASSASSINATION_ES.pdf\` | \`ASSASSINATION_EN.pdf\` |
| \`"Contest of Champions"\` | \`CONTEST OF CHAMPIONS_ES.pdf\` | \`CONTEST OF CHAMPIONS_EN.pdf\` |
| \`"Heirloom of Ages Past"\` | \`HEIRLOOM OF AGES PAST_ES.pdf\` | \`HEIRLOOM OF AGES PAST_EN.pdf\` |
| \`"Sites of Power"\` | \`SITES OF POWER_ES.pdf\` | \`SITES OF POWER_EN.pdf\` |
| \`"Command the Battlefield"\`| \`COMMAND THE BATTLEFIELD_ES.pdf\` | \`COMMAND THE BATTLEFIELD_EN.pdf\` |
| \`"Retrieval"\` | \`RETRIEVAL_ES.pdf\` | \`RETRIEVAL_EN.pdf\` |
| \`"Seize the Prizes"\` | \`SEIZE THE PRIZES_ES.pdf\` | \`SEIZE THE PRIZES_EN.pdf\` |
| \`"Treasure Hoard"\` | \`TREASURE HOARD_ES.pdf\` | \`TREASURE HOARD_EN.pdf\` |
| \`"Storm the Camp"\` | \`STORM THE CAMP_ES.pdf\` | \`STORM THE CAMP_EN.pdf\` |
| \`"Divide & Conquer"\` | \`DIVIDE & CONQUER_ES.pdf\` | \`DIVIDE & CONQUER_EN.pdf\` |
| \`"Escort the Wounded"\` | \`ESCORT THE WOUNDED_ES.pdf\` | \`ESCORT THE WOUNDED_EN.pdf\` |
| \`"Clash by Moonlight"\` | \`CLASH BY MOONLIGHT_ES.pdf\` | \`CLASH BY MOONLIGHT_EN.pdf\` |
| \`"Lead from the Front"\` | \`LEAD FROM THE FRONT_ES.pdf\` | \`LEAD FROM THE FRONT_EN.pdf\` |
| \`"Convergence"\` | \`CONVERGENCE_ES.pdf\` | \`CONVERGENCE_EN.pdf\` |

#### 🛡️ Misiones 2 vs 2 (6 Escenarios en \`pdfs/2vs2/\`):

| Clave en JSON (\`missions2v2\`) | Archivo Español (\`fileEs\`) | Archivo Inglés (\`fileEn\`) |
| :--- | :--- | :--- |
| \`"No Escape"\` | \`2vs2/NO ESCAPE_ES.pdf\` | \`2vs2/NO ESCAPE_EN.pdf\` |
| \`"Total Conquest"\` | \`2vs2/TOTAL CONQUEST_ES.pdf\` | \`2vs2/TOTAL CONQUEST_EN.pdf\` |
| \`"Take & Hold"\` | \`2vs2/TAKE & HOLD_ES.pdf\` | \`2vs2/TAKE & HOLD_EN.pdf\` |
| \`"Clash of Champions"\` | \`2vs2/CLASH OF CHAMPIONS_ES.pdf\` | \`2vs2/CLASH OF CHAMPIONS_EN.pdf\` |
| \`"Cornered"\` | \`2vs2/CORNERED_ES.pdf\` | \`2vs2/CORNERED_EN.pdf\` |
| \`"Duel of Wits"\` | \`2vs2/DUEL OF WITS_ES.pdf\` | \`2vs2/DUEL OF WITS_EN.pdf\` |

---

### 📄 3. Estructura Completa del Archivo JSON

Crea el archivo \`mod-misiones.json\` en la raíz de tu carpeta:

\`\`\`json
{
  "modId": "mi-mod-misiones-2026",
  "modName": "Misiones Oficiales MESBG 2026",
  "modVersion": "1.0.0",
  "modAuthor": "Tu Nombre o Nick",
  "gameSystem": "MESBG",
  "schemaVersion": "1.0",
  "description": "Colección completa de 24 escenarios 1v1 y 6 escenarios 2v2 con mapas en español e inglés.",
  "capabilities": ["missions"],
  "tags": ["misiones", "escenarios", "mapas", "torneo"],
  "missionPdfs": {
    "baseUrl": "https://raw.githubusercontent.com/TU_USUARIO/TU_REPOSITORIO/main/pdfs/",
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

### 🌐 4. Subida y Alojamiento en GitHub

1. **Crear Repositorio Público:**
   * Entra a [GitHub.com](https://github.com) y crea un nuevo repositorio público (ejemplo: \`mesbg-missions-mod\`).
   * Añade el archivo inicial \`README.md\`.

2. **Subir el JSON a la Raíz:**
   * Pulsa en **\`Add file\`** ➔ **\`Upload files\`**.
   * Arrastra tu archivo \`mod-misiones.json\` y haz clic en **\`Commit changes\`**.

3. **Subir la Carpeta \`pdfs/\`:**
   * Puedes subir la carpeta \`pdfs/\` al repositorio, o crear un **Release** adjuntando el paquete comprimido \`.zip\`.

---

### 🚀 5. Enlace Universal y Envío a La Cuchara de Lobelia

1. Tu enlace universal para que cualquier jugador instale tu mod con 1 clic es:
   👉 **\`https://raw.githubusercontent.com/TU_USUARIO/TU_REPOSITORIO/main/mod-misiones.json\`**
2. Entra a **La Cuchara de Lobelia** ➔ Pestaña **📤 Envía tu Mod**.
3. Pega tu enlace, indica el nombre y autor, y marca **\`[x] 🗺️ Misiones (PDFs)\`**.
4. ¡Una vez aprobado, aparecerá en el **Workshop público** disponible para toda la comunidad!

---

## 🎲 TIPO 4: Mod de Duelos & Tracker (Resumen)
* Capacidad: \`"capabilities": ["duels"]\`
* Contiene: Tablas de desmoronamiento (50%/25%) y reglas de combate en vivo.

---

# 🤖 SECCIÓN TÉCNICA: SOLO PARA AGENTES DE IA (AI SPECIFICATION & PROMPT CONTRACT)
> **Directiva del Sistema para LLMs (GPT-4, Claude, Gemini, Cursor, Copilot, DeepSeek, etc.):**
> Si el usuario te proporciona este documento como contexto para construir o validar un Mod para **La Cuchara de Lobelia**, actúa como compilador determinista y sigue estrictamente las siguientes reglas del motor:

### 1. Requisitos Formales de Schema (JSON Specification v1.0)
- **Codificación:** Obligatoriamente \`UTF-8\` estricto, sin BOM.
- **Tipado estricto:**
  - \`modId\`: \`string\` en formato kebab-case (\`^[a-z0-9-_]+$\`).
  - \`modName\`: \`string\` legible (1-60 caracteres).
  - \`modVersion\`: \`string\` bajo estándar SemVer (\`X.Y.Z\`).
  - \`modAuthor\`: \`string\` con el nombre o nick del creador.
  - \`gameSystem\`: Literal exacto \`"MESBG"\`.
  - \`schemaVersion\`: Literal exacto \`"1.0"\`.
  - \`capabilities\`: Array de subconjunto \`["missions" | "rules_ai" | "army_builder" | "duels"]\`.

### 2. Algoritmo de Resolución de Rutas para Misiones (\`missionPdfs\`)
- Sea \`baseUrl\` la URL base declarada (ej: \`"https://raw.githubusercontent.com/user/repo/main/pdfs/"\`).
- Sea \`targetFile\` el nombre de archivo asignado a la misión.
- **Regla 1:** Si \`targetFile\` es una URL absoluta (\`http://\` o \`https://\`), se utiliza directamente.
- **Regla 2:** Si es relativa, la URL resuelta es: \`baseUrl.replace(/\\/$/, '') + '/' + targetFile.replace(/^\\//, '')\`.
- **Regla 3:** Todas las misiones 1v1 deben resolver a la raíz de \`pdfs/\`.
- **Regla 4:** Todas las misiones 2v2 DEBEN incluir el prefijo de carpeta \`2vs2/\` (ej: \`2vs2/NO ESCAPE_ES.pdf\`).

### 3. Seguridad y Límites del Motor
- El motor es declarativo: **NO** se permite código evaluado (\`eval\`), inyecciones de HTML no sanitizadas ni ejecución de scripts externos.
- La distribución se realiza mediante enlaces directos con soporte CORS (\`raw.githubusercontent.com\` o GitHub Releases).
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
