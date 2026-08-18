// src/data/creatorGuide.js
// ─────────────────────────────────────────────────────────────────────────────
// Manual Oficial y Plantillas para Creadores de Mods de La Cuchara de Lobelia
// ─────────────────────────────────────────────────────────────────────────────

export const CREATOR_GUIDE_MD = `# 📚 Manual Oficial para Creadores de Mods
### La Cuchara de Lobelia — Engine v3.0 (Schema v1.0)

Bienvenido a la guía oficial de creación de Mods para **La Cuchara de Lobelia**. Este documento te guiará paso a paso para construir, empaquetar, alojar y publicar tu propio mod sin necesidad de conocimientos de programación.

---

## 🎯 1. ¿Qué es un Mod de La Cuchara de Lobelia?

La Cuchara de Lobelia es un motor neutral que **no contiene ni aloja datos con derechos de autor**. Las reglas, perfiles, misiones y textos son aportados por la comunidad a través de archivos de datos estructurados en formato **JSON**.

Existen 4 capacidades o capas independientes que tu mod puede implementar (una sola, varias o todas):

| Capa | Capacidad (\`capabilities\`) | ¿Qué proporciona? |
| :--- | :--- | :--- |
| **🗺️ Misiones y Mapas** | \`"missions"\` | Rutas a PDFs/mapas para los 24 escenarios 1v1 y 6 de 2v2. |
| **🧙‍♂️ Árbitro IA** | \`"rules_ai"\` | Artículos, FAQs y páginas indexadas para que la IA resuelva dudas citando el reglamento. |
| **⚔️ Army Builder** | \`"army_builder"\` | Facciones, héroes, guerreros, equipo y reglas especiales. |
| **🎲 Duelos y Tracker** | \`"duels"\` | Perfiles de combate para el simulador de duelos 1v1 y desmoronamiento. |

---

## 🏗️ 2. Estructura Obligatoria de la Cabecera

Todo archivo de mod debe comenzar con los siguientes metadatos obligatorios:

\`\`\`json
{
  "modId": "nombre-unico-de-tu-mod",
  "modName": "Título Visible de tu Mod",
  "modVersion": "1.0.0",
  "modAuthor": "Tu Nick o Grupo",
  "gameSystem": "MESBG",
  "schemaVersion": "1.0",
  "description": "Breve descripción de lo que incluye tu paquete.",
  "capabilities": ["missions", "rules_ai"],
  "tags": ["misiones", "ia", "comunidad"]
}
\`\`\`

---

## 🗺️ 3. Capa de Misiones y Mapas (\`missionPdfs\`)

Si tu mod incluye la capacidad \`"missions"\`, debes añadir el objeto \`missionPdfs\`. 
Puedes especificar una URL base (\`baseUrl\`) o enlaces completos a cada archivo:

\`\`\`json
{
  "missionPdfs": {
    "baseUrl": "https://raw.githubusercontent.com/tu-usuario/tu-repo/main/pdfs/",
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

## 🧙‍♂️ 4. Capa de Árbitro IA (\`rulesKnowledge\`)

Para que el Árbitro IA pueda interpretar y citar reglas con exactitud, añade el array \`rulesKnowledge\` con artículos estructurados:

\`\`\`json
{
  "rulesKnowledge": [
    {
      "id": "regla_combate_duelo",
      "title": "Resolución de Duelos en Combate",
      "category": "Reglas Básicas",
      "page": "Pág. 44-46",
      "book": "Rules Manual",
      "summary": "Cada jugador tira tantos dados como su atributo de Ataques. El resultado más alto gana el combate. En caso de empate, gana el mayor atributo de Combate (F). Si persiste el empate, se tira un dado a 1-3 / 4-6.",
      "fullText": "Explicación detallada de la tirada de dados, elección de apoyo con lanza y modificadores por arma a dos manos.",
      "tags": ["combate", "duelo", "ataques", "empate", "combate"]
    }
  ]
}
\`\`\`

---

## ⚔️ 5. Capa de Army Builder (\`factions\`)

Si creas perfiles de miniaturas para el Creador de Listas:

\`\`\`json
{
  "factions": [
    {
      "factionId": "minas_tirith",
      "factionName": "Minas Tirith",
      "side": "good",
      "armyBonus": "Un Reino de Hombres: Todos los Héroes ganan +1 al Coraje.",
      "models": [
        {
          "id": "aragorn_rey_elessar",
          "name": "Aragorn, Rey Elessar",
          "type": "hero",
          "heroicTier": "Hero of Legend",
          "points": 225,
          "movement": "6\\"",
          "fight": "6/4+",
          "strength": 4,
          "defense": 5,
          "attacks": 3,
          "wounds": 3,
          "courage": 6,
          "might": 3,
          "will": 3,
          "fate": 3,
          "wargear": ["Andúril", "Armadura pesada"],
          "options": [
            { "name": "Caballo con barda", "points": 15, "isBow": false },
            { "name": "Capa élfica", "points": 10, "isBow": false }
          ],
          "specialRules": [
            { "name": "Señor del Oeste", "description": "Aragorn puede gastar 1 punto de Poder gratuito por turno." }
          ]
        }
      ]
    }
  ]
}
\`\`\`

---

## 🚀 6. Publicación en GitHub Releases (Estándar Oficial)

Para que toda la comunidad pueda instalar tu mod con **1 solo clic**:

1. Crea una cuenta gratuita en [GitHub.com](https://github.com).
2. Crea un repositorio público (ejemplo: \`mi-mod-misiones-lobelia\`).
3. En la barra lateral derecha, haz clic en **Releases** ➔ **Draft a new release**.
4. Ponle una etiqueta de versión (ej: \`v1.0.0\`) y arrastra tu archivo \`mod.json\`.
5. Pulsa **Publish release**.
6. Haz clic derecho sobre el archivo subido y selecciona **Copiar dirección del enlace**.
7. Ve a la pestaña **📤 Envía tu Mod** en La Cuchara de Lobelia y pega ese enlace directo.
8. Una vez aprobado por el equipo de moderación, aparecerá destacado en el **Workshop público**.
`;

export const TEMPLATE_MISSIONS_IA = {
  modId: "mi-mod-misiones-ia",
  modName: "Mi Mod de Misiones & Árbitro IA",
  modVersion: "1.0.0",
  modAuthor: "Mi Nick",
  gameSystem: "MESBG",
  schemaVersion: "1.0",
  description: "Plantilla oficial de ejemplo para escenarios de misiones y base de conocimiento de reglas IA.",
  capabilities: ["missions", "rules_ai"],
  tags: ["misiones", "ia", "plantilla"],
  missionPdfs: {
    baseUrl: "https://raw.githubusercontent.com/usuario/repo/main/pdfs/",
    missions1v1: {
      "Domination": { "fileEs": "DOMINATION_ES.pdf", "fileEn": "DOMINATION_EN.pdf" },
      "To the Death!": { "fileEs": "TO THE DEATH!_ES.pdf", "fileEn": "TO THE DEATH!_EN.pdf" },
      "Hold Ground": { "fileEs": "HOLD GROUND_ES.pdf", "fileEn": "HOLD GROUND_EN.pdf" }
    },
    missions2v2: {
      "No Escape": { "fileEs": "2vs2/NO ESCAPE_ES.pdf", "fileEn": "2vs2/NO ESCAPE_EN.pdf" },
      "Total Conquest": { "fileEs": "2vs2/TOTAL CONQUEST_ES.pdf", "fileEn": "2vs2/TOTAL CONQUEST_EN.pdf" }
    }
  },
  rulesKnowledge: [
    {
      id: "ejemplo_regla_1",
      title: "Movimiento Heroico",
      category: "Acciones Heroicas",
      page: "Pág. 68",
      book: "Rules Manual",
      summary: "Se declara al inicio de la fase de movimiento antes de tirar prioridad. Permite al héroe y a los aliados a 6 pulgadas mover primero.",
      fullText: "El jugador activo declara la acción gastando 1 punto de Poder...",
      tags: ["movimiento", "heroico", "prioridad", "poder"]
    }
  ]
};

export const TEMPLATE_ARMY_BUILDER = {
  modId: "mi-mod-facciones-listas",
  modName: "Mi Mod de Facciones & Listas",
  modVersion: "1.0.0",
  modAuthor: "Mi Nick",
  gameSystem: "MESBG",
  schemaVersion: "1.0",
  description: "Plantilla oficial de ejemplo para creación de perfiles y facciones de ejército.",
  capabilities: ["army_builder", "duels"],
  tags: ["listas", "perfiles", "facciones"],
  factions: [
    {
      factionId: "mi_facción_ejemplo",
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
