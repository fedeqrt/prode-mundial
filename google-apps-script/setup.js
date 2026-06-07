/**
 * PRODE MUNDIAL 2026 - Script de configuración del Google Sheet
 *
 * INSTRUCCIONES:
 * 1. Abrí Google Sheets → Extensions → Apps Script
 * 2. Pegá este código
 * 3. Ejecutá la función `setupProde`
 * 4. Aceptá los permisos
 *
 * Podés editar PLAYER_NAMES antes de ejecutar.
 */

const PLAYER_NAMES = [
  "Jugador 1",
  "Jugador 2",
  "Jugador 3",
  "Jugador 4",
  "Jugador 5",
];

// Colores
const COLOR_HEADER = "#1a2744";
const COLOR_MATCH_ROW = "#0d1526";
const COLOR_SECTION = "#16213e";
const COLOR_GREEN = "#1e3a2f";

function setupProde() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  setupConfigTab(ss);
  setupResultadosTab(ss);
  setupTorneoRealTab(ss);

  for (const name of PLAYER_NAMES) {
    setupPlayerTab(ss, name);
  }

  SpreadsheetApp.getUi().alert(
    "✅ Prode configurado!\n\n" +
    "Compartí este sheet con cada jugador para que complete sus pestañas.\n" +
    "El 10 de junio podés proteger las pestañas.\n\n" +
    "Próximo paso: configurar la web app con el ID de este sheet."
  );
}

function setupConfigTab(ss) {
  let sheet = ss.getSheetByName("CONFIG");
  if (!sheet) sheet = ss.insertSheet("CONFIG", 0);
  sheet.clearContents();
  sheet.clearFormats();

  sheet.getRange("A1").setValue("PRODE MUNDIAL 2026").setFontSize(16).setFontWeight("bold").setFontColor("#4ade80");
  sheet.getRange("A3").setValue("JUGADORES").setFontWeight("bold").setFontColor("#94a3b8");

  PLAYER_NAMES.forEach((name, i) => {
    sheet.getRange(4 + i, 1).setValue(name).setFontColor("white");
  });

  sheet.getRange("A1:B1").merge().setBackground(COLOR_HEADER);
  sheet.getRange("A1:Z50").setBackground(COLOR_MATCH_ROW);
  sheet.getRange("A1").setBackground(COLOR_HEADER);

  sheet.setColumnWidth(1, 200);
}

function setupResultadosTab(ss) {
  let sheet = ss.getSheetByName("RESULTADOS");
  if (!sheet) sheet = ss.insertSheet("RESULTADOS");
  sheet.clearContents();

  const headers = [
    "ID Partido", "Goleadores Local", "Goleadores Visitante",
    "T.Amar. Local (jugadores)", "T.Amar. Visit. (jugadores)",
    "T.Roja Local", "T.Roja Visit.",
    "Penal Local (S/N)", "Penal Visit. (S/N)",
    "Pen.Atajado Local", "Pen.Atajado Visit.",
    "Alargue (S/N)", "Penales (S/N)",
    "Invasión (S/N)", "Bomba (S/N)",
    "Lesionados (nombres)"
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground(COLOR_HEADER).setFontColor("#4ade80").setFontWeight("bold");

  sheet.getRange("A1:P300").setBackground(COLOR_MATCH_ROW).setFontColor("white");
  sheet.setFrozenRows(1);

  // Nota de ayuda
  sheet.getRange("A1").setNote(
    "ID del partido (de football-data.org). " +
    "Completar después de cada partido.\n" +
    "Goleadores: separados por coma. Ej: Messi, Di María\n" +
    "Tarjetas: nombre del jugador o 'EQUIPO' si no sabés el jugador."
  );
}

function setupTorneoRealTab(ss) {
  let sheet = ss.getSheetByName("TORNEO_REAL");
  if (!sheet) sheet = ss.insertSheet("TORNEO_REAL");
  sheet.clearContents();

  sheet.getRange("A1:B1").setValues([["RESULTADO FINAL DEL TORNEO", ""]]);
  sheet.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#4ade80");

  const rows = [
    ["CAMPEON", ""],
    ["SUBCAMPEON", ""],
    ["TERCERO", ""],
    ["MEJOR JUGADOR", ""],
    ["MEJOR JUGADOR JOVEN", ""],
    ["GOLEADOR", ""],
  ];

  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  sheet.getRange("A2:A7").setFontWeight("bold").setFontColor("#94a3b8");
  sheet.getRange("B2:B7").setFontColor("white");
  sheet.getRange("A1:B10").setBackground(COLOR_MATCH_ROW);

  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 200);
}

function setupPlayerTab(ss, playerName) {
  let sheet = ss.getSheetByName(playerName);
  if (!sheet) sheet = ss.insertSheet(playerName);
  sheet.clearContents();
  sheet.clearFormats();

  // Title
  sheet.getRange("A1").setValue(`PRODE - ${playerName.toUpperCase()}`);
  sheet.getRange("A1:T1").merge().setBackground(COLOR_HEADER)
    .setFontColor("#4ade80").setFontSize(14).setFontWeight("bold")
    .setHorizontalAlignment("center");

  // Instructions row
  sheet.getRange("A2").setValue(
    "⚽ Completá tus predicciones. S = Sí, N = No. " +
    "Goleadores separados por coma. Tarjetas: nombre del jugador o 'EQUIPO'."
  );
  sheet.getRange("A2:T2").merge().setBackground("#1a2744").setFontColor("#94a3b8")
    .setFontSize(10).setHorizontalAlignment("left");

  // Headers - match predictions
  const headers = [
    "ID Partido", "Goles Local", "Goles Visit.",
    "Goleadores Local", "Goleadores Visit.",
    "T.Amar Local", "T.Amar Visit.", "T.Roja Local", "T.Roja Visit.",
    "Pen.Local(S/N)", "Pen.Visit.(S/N)", "Pen.At.Local(S/N)", "Pen.At.Visit.(S/N)",
    "Alargue(S/N)", "Penales(S/N)",
    "Gol Alarg.Local", "Gol Alarg.Visit.",
    "Invasión(S/N)", "Bomba(S/N)"
  ];

  const headerRange = sheet.getRange(3, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground(COLOR_SECTION).setFontColor("#60a5fa")
    .setFontWeight("bold").setFontSize(10);

  // 104 empty match rows with alternating colors
  for (let i = 0; i < 104; i++) {
    const rowNum = 4 + i;
    const bg = i % 2 === 0 ? COLOR_MATCH_ROW : "#0f1e35";
    sheet.getRange(rowNum, 1, 1, headers.length).setBackground(bg).setFontColor("white");
    // Match ID placeholder
    sheet.getRange(rowNum, 1).setValue("").setFontColor("#4b5563");
  }

  // LESIONES section
  const lesionesRow = 4 + 104 + 1;
  sheet.getRange(lesionesRow, 1).setValue("LESIONES");
  sheet.getRange(lesionesRow, 1, 1, 4).merge().setBackground("#2d1b1b")
    .setFontColor("#f87171").setFontWeight("bold");
  sheet.getRange(lesionesRow + 1, 1).setValue("(nombre del jugador que creés que se va a lesionar - 1 pto c/u)");
  sheet.getRange(lesionesRow + 1, 1, 1, 4).merge().setFontColor("#6b7280").setBackground(COLOR_MATCH_ROW);

  // 10 rows for injury predictions
  for (let i = 0; i < 10; i++) {
    sheet.getRange(lesionesRow + 2 + i, 1).setBackground(COLOR_MATCH_ROW).setFontColor("white")
      .setBorder(true, true, true, true, false, false, "#1e3a5f", SpreadsheetApp.BorderStyle.SOLID);
  }

  // TORNEO section
  const torneoRow = lesionesRow + 13;
  sheet.getRange(torneoRow, 1).setValue("TORNEO");
  sheet.getRange(torneoRow, 1, 1, 4).merge().setBackground(COLOR_GREEN)
    .setFontColor("#4ade80").setFontWeight("bold");

  const torneoItems = [
    ["CAMPEON", "15 pts"],
    ["SUBCAMPEON", "12 pts"],
    ["TERCERO", "10 pts"],
    ["MEJOR JUGADOR", "10 pts"],
    ["MEJOR JUGADOR JOVEN", "5 pts"],
    ["GOLEADOR", "10 pts"],
  ];

  torneoItems.forEach(([label, pts], i) => {
    const row = torneoRow + 1 + i;
    sheet.getRange(row, 1).setValue(label).setFontColor("#94a3b8").setFontWeight("bold");
    sheet.getRange(row, 2).setValue("").setFontColor("white");
    sheet.getRange(row, 3).setValue(pts).setFontColor("#4ade80").setFontSize(10);
    sheet.getRange(row, 1, 1, 3).setBackground(COLOR_MATCH_ROW);
  });

  // Column widths
  sheet.setColumnWidth(1, 90);   // ID
  sheet.setColumnWidth(2, 80);   // home goals
  sheet.setColumnWidth(3, 80);   // away goals
  sheet.setColumnWidth(4, 180);  // home scorers
  sheet.setColumnWidth(5, 180);  // away scorers
  sheet.setColumnWidths(6, 14, 100); // rest

  sheet.setFrozenRows(3);
}

// Run this to lock all player tabs on June 10
function lockPlayerTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const me = Session.getActiveUser().getEmail();

  for (const name of PLAYER_NAMES) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) continue;

    const protection = sheet.protect().setDescription(`Bloqueado el 10/6 - ${name}`);
    protection.removeEditors(protection.getEditors());
    if (protection.canDomainEdit()) protection.setDomainEdit(false);
    // Solo el owner puede editar
    protection.addEditor(me);
  }

  SpreadsheetApp.getUi().alert("🔒 Pestañas de jugadores bloqueadas. Solo el owner puede editarlas.");
}
