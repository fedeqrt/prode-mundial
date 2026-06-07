/**
 * PRODE MUNDIAL 2026 - Script de configuración del Google Sheet
 * Versión optimizada — usa operaciones en batch para no agotar el tiempo.
 *
 * INSTRUCCIONES:
 * 1. Guardá el script (Ctrl+S)
 * 2. Seleccioná "setupProde" en el menú desplegable
 * 3. Click en Run y aceptá los permisos
 */

// ✏️ EDITÁ ESTOS NOMBRES antes de ejecutar
const PLAYER_NAMES = [
  "Fede",
  "Lolo",
  "Joita",
  "Mati",
  "Emi",
];

function setupProde() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupConfigTab(ss);
  setupResultadosTab(ss);
  setupTorneoRealTab(ss);
  // Creamos una pestaña de jugador por vez
  // Si tenés muchos jugadores y sigue fallando, ejecutá setupJugador1, setupJugador2, etc.
  for (const name of PLAYER_NAMES) {
    setupPlayerTab(ss, name);
  }
  SpreadsheetApp.getUi().alert('✅ Listo! Compartí el sheet con los jugadores.\nRecordá ponerlo en "Cualquiera con el link puede ver".');
}

// Si setupProde falla por tiempo, ejecutá estas individualmente:
function setupJugador1() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[0]); }
function setupJugador2() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[1]); }
function setupJugador3() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[2]); }
function setupJugador4() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[3]); }
function setupJugador5() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[4]); }
function setupJugador6() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[5]); }
function setupJugador7() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[6]); }
function setupJugador8() { setupPlayerTab(SpreadsheetApp.getActiveSpreadsheet(), PLAYER_NAMES[7]); }

function deleteAndCreate(ss, name, index) {
  const existing = ss.getSheetByName(name);
  if (existing) ss.deleteSheet(existing);
  return index !== undefined ? ss.insertSheet(name, index) : ss.insertSheet(name);
}

function setupConfigTab(ss) {
  let sheet = deleteAndCreate(ss, "CONFIG", 0);

  // Título + nombres en una sola operación
  const data = [["PRODE MUNDIAL 2026"], ["JUGADORES"]].concat(
    PLAYER_NAMES.map(n => [n])
  );
  sheet.getRange(1, 1, data.length, 1).setValues(data);
  sheet.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#4ade80");
  sheet.getRange("A2").setFontWeight("bold").setFontColor("#94a3b8");
  sheet.getRange(3, 1, PLAYER_NAMES.length, 1).setFontColor("#ffffff");
  sheet.getRange("A1:B" + (data.length + 1)).setBackground("#0d1526");
  sheet.setColumnWidth(1, 200);
}

function setupResultadosTab(ss) {
  let sheet = deleteAndCreate(ss, "RESULTADOS");

  const headers = [[
    "ID Partido", "Goleadores Local", "Goleadores Visitante",
    "T.Amarilla Local", "T.Amarilla Visit.", "T.Roja Local", "T.Roja Visit.",
    "Penal Local(S/N)", "Penal Visit.(S/N)", "PenAtaj.Local(S/N)", "PenAtaj.Visit.(S/N)",
    "Alargue(S/N)", "Penales(S/N)", "Invasión(S/N)", "Bomba(S/N)", "Lesionados"
  ]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground("#1a2744").setFontColor("#4ade80").setFontWeight("bold");
  sheet.getRange("A1:P200").setBackground("#0d1526").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  sheet.getRange("A1").setNote(
    "ID del partido (número de football-data.org).\n" +
    "Goleadores: separar con coma. Ej: Messi, Di María\n" +
    "Tarjetas: nombre del jugador o 'EQUIPO'\n" +
    "S = Sí, N = No"
  );
}

function setupTorneoRealTab(ss) {
  let sheet = deleteAndCreate(ss, "TORNEO_REAL");

  const data = [
    ["RESULTADO FINAL DEL TORNEO", ""],
    ["CAMPEON", ""], ["SUBCAMPEON", ""], ["TERCERO", ""],
    ["MEJOR JUGADOR", ""], ["MEJOR JUGADOR JOVEN", ""], ["GOLEADOR", ""]
  ];
  sheet.getRange(1, 1, data.length, 2).setValues(data);
  sheet.getRange("A1:B" + data.length).setBackground("#0d1526").setFontColor("#ffffff");
  sheet.getRange("A1").setFontSize(13).setFontWeight("bold").setFontColor("#4ade80");
  sheet.getRange("A2:A7").setFontWeight("bold").setFontColor("#94a3b8");
  sheet.setColumnWidth(1, 220).setColumnWidth(2, 200);
}

function setupPlayerTab(ss, playerName) {
  let sheet = deleteAndCreate(ss, playerName);

  const HEADERS = [
    "ID Partido", "Goles Local", "Goles Visit.",
    "Goleadores Local (separar con coma)", "Goleadores Visit. (separar con coma)",
    "T.Amar Local (jugador o EQUIPO)", "T.Amar Visit.", "T.Roja Local", "T.Roja Visit.",
    "Penal Local(S/N)", "Penal Visit.(S/N)", "PenAtaj.Local(S/N)", "PenAtaj.Visit.(S/N)",
    "Alargue(S/N)", "Penales(S/N)", "Gol Alarg.Local", "Gol Alarg.Visit.",
    "Invasión(S/N)", "Bomba(S/N)"
  ];
  const NCOLS = HEADERS.length;

  // --- Título ---
  sheet.getRange(1, 1, 1, NCOLS).merge()
    .setValue("⚽ PRODE MUNDIAL 2026 — " + playerName.toUpperCase())
    .setBackground("#1a2744").setFontColor("#4ade80")
    .setFontSize(13).setFontWeight("bold").setHorizontalAlignment("center");

  // --- Instrucciones ---
  sheet.getRange(2, 1, 1, NCOLS).merge()
    .setValue("Completá tus predicciones. S = Sí | N = No | Goleadores separados por coma | Tarjetas: nombre del jugador o 'EQUIPO'")
    .setBackground("#0f1e35").setFontColor("#94a3b8").setFontSize(10);

  // --- Headers ---
  sheet.getRange(3, 1, 1, NCOLS).setValues([HEADERS])
    .setBackground("#16213e").setFontColor("#60a5fa").setFontWeight("bold");

  // --- 104 filas vacías en batch ---
  const emptyRows = Array(104).fill(null).map(() => Array(NCOLS).fill(""));
  sheet.getRange(4, 1, 104, NCOLS).setValues(emptyRows).setFontColor("#ffffff");

  // Colores alternados en batch
  const bgLight = Array(52).fill(null).map(() => Array(NCOLS).fill("#0d1526"));
  const bgDark  = Array(52).fill(null).map(() => Array(NCOLS).fill("#0f1e35"));
  for (let i = 0; i < 104; i++) {
    const bg = i % 2 === 0 ? "#0d1526" : "#0f1e35";
    sheet.getRange(4 + i, 1, 1, NCOLS).setBackground(bg);
  }

  // --- Sección LESIONES ---
  const lesRow = 109;
  sheet.getRange(lesRow, 1, 1, 4).merge()
    .setValue("LESIONES").setBackground("#2d1b1b").setFontColor("#f87171").setFontWeight("bold");
  sheet.getRange(lesRow + 1, 1, 1, 4).merge()
    .setValue("Escribí el nombre de los jugadores que creés que se van a lesionar (1 pto c/u)")
    .setBackground("#0d1526").setFontColor("#6b7280").setFontSize(10);
  const lesData = Array(10).fill(null).map(() => [""]);
  sheet.getRange(lesRow + 2, 1, 10, 1).setValues(lesData)
    .setBackground("#0d1526").setFontColor("#ffffff");

  // --- Sección TORNEO ---
  const torRow = 122;
  sheet.getRange(torRow, 1, 1, 4).merge()
    .setValue("TORNEO").setBackground("#1e3a2f").setFontColor("#4ade80").setFontWeight("bold");

  const torneoData = [
    ["CAMPEON", "", "→ 15 pts"],
    ["SUBCAMPEON", "", "→ 12 pts"],
    ["TERCERO", "", "→ 10 pts"],
    ["MEJOR JUGADOR", "", "→ 10 pts"],
    ["MEJOR JUGADOR JOVEN", "", "→ 5 pts"],
    ["GOLEADOR", "", "→ 10 pts"],
  ];
  sheet.getRange(torRow + 1, 1, torneoData.length, 3).setValues(torneoData)
    .setBackground("#0d1526").setFontColor("#ffffff");
  sheet.getRange(torRow + 1, 1, torneoData.length, 1).setFontColor("#94a3b8").setFontWeight("bold");
  sheet.getRange(torRow + 1, 3, torneoData.length, 1).setFontColor("#4ade80").setFontSize(10);

  // --- Anchos de columna ---
  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 200);
  for (let c = 6; c <= NCOLS; c++) sheet.setColumnWidth(c, 110);
  sheet.setFrozenRows(3);

  SpreadsheetApp.flush();
}

// Ejecutar el 10 de junio para bloquear las pestañas
function lockPlayerTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const me = Session.getActiveUser().getEmail();
  for (const name of PLAYER_NAMES) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) continue;
    const prot = sheet.protect().setDescription("Bloqueado 10/6");
    prot.removeEditors(prot.getEditors());
    if (prot.canDomainEdit()) prot.setDomainEdit(false);
    prot.addEditor(me);
  }
  SpreadsheetApp.getUi().alert("🔒 Pestañas bloqueadas. Solo vos podés editarlas.");
}
