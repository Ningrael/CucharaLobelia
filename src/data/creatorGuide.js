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

Un mod puede especializarse en una sola funcionalidad o combinar varias:

1. **🗺️ TIPO 1: Mod de Misiones & Visor de PDFs** (Escenarios 1v1 y 2v2, mapas de despliegue y objetivos).
2. **🧙‍♂️ TIPO 2: Mod de Árbitro IA** (Base de conocimiento indexada, FAQs y citas exactas de manuales).
3. **⚔️ TIPO 3: Mod de Army Builder** (Facciones, miniaturas, atributos, puntos y opciones de equipo).
4. **🎲 TIPO 4: Mod de Duelos & Live Tracker** (Puntos de desmoronamiento al 50%/25% y seguimiento en vivo).

---

## 🗺️ GUÍA PASO A PASO: Cómo Crear y Publicar un Mod de Misiones (Tipo 1)

Esta sección te enseñará desde cero a preparar tu archivo de mod, alojarlo de forma gratuita en GitHub y publicarlo en el Workshop para que cualquier jugador del mundo pueda instalarlo con **1 solo clic**.

---

### 📝 PASO 1: Estructura del Archivo JSON (\`mod-misiones.json\`)

Crea un archivo llamado \`mod-misiones.json\` en tu ordenador con la siguiente estructura:

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

> 💡 **Consejo:** Puedes descargar una plantilla lista para usar haciendo clic en el botón **\`[Plantilla Tipo 1: Misiones & PDFs]\`** en esta misma pestaña.

---

### 🌐 PASO 2: Alojamiento Gratuito en GitHub

Para que tu mod pueda descargarse de forma universal y sin bloqueos de navegador (CORS), lo alojaremos en **GitHub**:

1. **Crear el Repositorio:**
   * Entra en [GitHub.com](https://github.com) con tu cuenta.
   * Crea un nuevo repositorio público (ejemplo: \`mesbg-missions-mod\`).
   * Asegúrate de marcarlo como **Public** y crear el archivo **README.md** inicial.

2. **Subir el archivo JSON:**
   * En la página principal de tu repositorio, haz clic en **\`Add file\`** ➔ **\`Upload files\`**.
   * Arrastra tu archivo \`mod-misiones.json\` (solo pesa unos 4 KB).
   * Pulsa el botón verde **\`Commit changes\`**.

3. **Subir la carpeta de PDFs:**
   * Puedes subir tus archivos PDF en una carpeta llamada \`pdfs/\` dentro del mismo repositorio, o crear un **Release** adjuntando el paquete \`.zip\`.

---

### 🔗 PASO 3: Obtener tu Enlace de Instalación en 1 Clic

Una vez subido tu archivo JSON al repositorio, tu enlace directo universal tiene el siguiente formato:

👉 **\`https://raw.githubusercontent.com/TU_USUARIO/TU_REPOSITORIO/main/mod-misiones.json\`**

*(Ejemplo real: \`https://raw.githubusercontent.com/agentsmithmatiasbot-dev/mesbg-missions-tolkienstein/main/mod-misiones-tolkienstein.json\`)*

---

### 📤 PASO 4: Enviar tu Mod a la Workshop de La Cuchara de Lobelia

1. En la aplicación, ve a la sección **Mods (🧩)** ➔ Pestaña **📤 Envía tu Mod**.
2. Rellena el formulario:
   * **Nombre del Mod:** El título visible para la comunidad.
   * **Autor / Creador:** Tu nombre o seudónimo.
   * **Enlace Directo de Descarga:** Pega tu enlace de GitHub (\`https://raw.githubusercontent.com/...\` o enlace del Release).
   * **Capacidades que incluye:** Marca la casilla **\`[x] 🗺️ Misiones (PDFs)\`**.
   * **Descripción:** Explica brevemente qué escenarios incluye.
3. Haz clic en **\`[🚀 Enviar a Moderación]\`**.

---

### ✅ PASO 5: Aprobación y Publicación

1. El equipo de administración revisará la solicitud desde el **🛡️ Panel SuperAdmin** y pulsará **\`[✅ Aprobar y Publicar]\`**.
2. ¡Listo! Tu mod aparecerá inmediatamente en la pestaña **🛍️ Workshop**.
3. Cualquier jugador podrá pulsar **\`[⬇️ Instalar con 1 Clic]\`**:
   * El navegador descargará el JSON y lo guardará en el almacenamiento local (**IndexedDB**) de su dispositivo.
   * Al entrar en la sección **Misiones** o en las partidas de la **Liga**, todos los PDFs y mapas se abrirán de forma nativa e instantánea.

---

## 🧙‍♂️ TIPO 2: Mod de Árbitro IA (Resumen)

Permite que Lobelia responda dudas de reglamento con citas exactas de páginas:
* Capacidad: \`"capabilities": ["rules_ai"]\`
* Contenido: Array \`rulesKnowledge\` con artículos, resúmenes de reglas y etiquetas de búsqueda.

## ⚔️ TIPO 3: Mod de Army Builder (Resumen)

Permite desbloquear facciones y miniaturas para el creador de listas:
* Capacidad: \`"capabilities": ["army_builder"]\`
* Contenido: Array \`factions\` con atributos (\`M\`, \`F\`, \`S\`, \`D\`, \`A\`, \`W\`, \`C\`, \`Might/Will/Fate\`), equipo y reglas especiales.

## 🎲 TIPO 4: Mod de Duelos & Live Tracker (Resumen)

Permite calcular desmoronamiento y realizar tiradas de combate en tiempo real:
* Capacidad: \`"capabilities": ["duels"]\`
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
