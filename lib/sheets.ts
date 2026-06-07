import { google } from "googleapis";
import {
  PlayerData,
  PlayerPrediction,
  TournamentPrediction,
  InjuryPrediction,
  MatchEvents,
  TournamentResult,
} from "./types";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const key = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({ credentials: key, scopes: SCOPES });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || "";

async function readRange(range: string): Promise<string[][]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  return (res.data.values as string[][] | null | undefined) ?? [];
}

// CONFIG tab: A1:A20 → player names
export async function getPlayerNames(): Promise<string[]> {
  try {
    const rows = await readRange("CONFIG!A2:A50");
    return rows.map((r) => r[0]).filter(Boolean);
  } catch {
    return [];
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Player tab structure (row per match starting at row 2):
// A=matchId, B=homeGoals, C=awayGoals, D=homeScorers, E=awayScorers,
// F=ycHome, G=ycAway, H=rcHome, I=rcAway,
// J=penHome, K=penAway, L=spHome, M=spAway,
// N=ET, O=shootout, P=etGoalHome, Q=etGoalAway,
// R=pitchInvader, S=bombThreat
//
// After matches: LESIONES section (col A=player name)
// After that: TORNEO section (fixed labels in col A, values in col B)

export async function getPlayerData(playerName: string): Promise<PlayerData | null> {
  try {
    const tabName = playerName;
    const rows = await readRange(`'${tabName}'!A1:T200`);
    if (!rows || rows.length < 2) return null;

    const predictions: PlayerPrediction[] = [];
    const injuries: InjuryPrediction[] = [];
    let tournament: TournamentPrediction = {
      champion: "",
      runnerUp: "",
      thirdPlace: "",
      bestPlayer: "",
      bestYoungPlayer: "",
      topScorer: "",
    };

    let section: "matches" | "lesiones" | "torneo" = "matches";

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const cellA = (row[0] || "").trim();

      if (cellA === "LESIONES") { section = "lesiones"; continue; }
      if (cellA === "TORNEO") { section = "torneo"; continue; }

      if (section === "matches") {
        const matchId = parseInt(cellA);
        if (isNaN(matchId)) continue;

        const homeGoals = row[1] !== undefined && row[1] !== "" ? parseInt(row[1]) : null;
        const awayGoals = row[2] !== undefined && row[2] !== "" ? parseInt(row[2]) : null;

        predictions.push({
          matchId,
          homeGoals: isNaN(homeGoals as number) ? null : homeGoals,
          awayGoals: isNaN(awayGoals as number) ? null : awayGoals,
          homeScorers: row[3] ? row[3].split(",").map((s) => s.trim()).filter(Boolean) : [],
          awayScorers: row[4] ? row[4].split(",").map((s) => s.trim()).filter(Boolean) : [],
          yellowCardHome: row[5] || null,
          yellowCardAway: row[6] || null,
          redCardHome: row[7] || null,
          redCardAway: row[8] || null,
          penaltyHome: row[9]?.toUpperCase() === "S",
          penaltyAway: row[10]?.toUpperCase() === "S",
          savedPenaltyHome: row[11]?.toUpperCase() === "S",
          savedPenaltyAway: row[12]?.toUpperCase() === "S",
          extraTime: row[13]?.toUpperCase() === "S",
          penaltyShootout: row[14]?.toUpperCase() === "S",
          etGoalHome: row[15] || null,
          etGoalAway: row[16] || null,
          pitchInvader: row[17]?.toUpperCase() === "S",
          bombThreat: row[18]?.toUpperCase() === "S",
        });
      } else if (section === "lesiones") {
        if (cellA) injuries.push({ playerName: cellA });
      } else if (section === "torneo") {
        const val = (row[1] || "").trim();
        if (cellA === "CAMPEON") tournament.champion = val;
        else if (cellA === "SUBCAMPEON") tournament.runnerUp = val;
        else if (cellA === "TERCERO") tournament.thirdPlace = val;
        else if (cellA === "MEJOR JUGADOR") tournament.bestPlayer = val;
        else if (cellA === "MEJOR JUGADOR JOVEN") tournament.bestYoungPlayer = val;
        else if (cellA === "GOLEADOR") tournament.topScorer = val;
      }
    }

    return {
      name: playerName,
      slug: slugify(playerName),
      predictions,
      tournament,
      injuries,
    };
  } catch (e) {
    console.error(`Error reading player ${playerName}:`, e);
    return null;
  }
}

// RESULTADOS tab: match events entered manually by admin
// Row per match: A=matchId, B=homeScorers, C=awayScorers,
// D=ycHome(players comma), E=ycAway, F=rcHome, G=rcAway,
// H=penHome(S/N), I=penAway, J=spHome, K=spAway,
// L=ET(S/N), M=shootout, N=pitchInvader, O=bombThreat,
// P=injuries(comma)
export async function getMatchEvents(): Promise<Map<number, MatchEvents>> {
  const map = new Map<number, MatchEvents>();
  try {
    const rows = await readRange("RESULTADOS!A2:P300");
    for (const row of rows) {
      const matchId = parseInt(row[0]);
      if (isNaN(matchId)) continue;

      const parseScorers = (cell: string, team: "home" | "away") =>
        (cell || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name, team, minute: 0, isET: false }));

      const parseCards = (cell: string, team: "home" | "away") =>
        (cell || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name: name === "EQUIPO" ? null : name, team }));

      map.set(matchId, {
        scorers: [...parseScorers(row[1], "home"), ...parseScorers(row[2], "away")],
        yellowCards: [...parseCards(row[3], "home"), ...parseCards(row[4], "away")],
        redCards: [...parseCards(row[5], "home"), ...parseCards(row[6], "away")],
        penalties: [
          ...(row[7]?.toUpperCase() === "S" ? [{ team: "home" as const }] : []),
          ...(row[8]?.toUpperCase() === "S" ? [{ team: "away" as const }] : []),
        ],
        savedPenalties: [
          ...(row[9]?.toUpperCase() === "S" ? [{ team: "home" as const }] : []),
          ...(row[10]?.toUpperCase() === "S" ? [{ team: "away" as const }] : []),
        ],
        extraTime: row[11]?.toUpperCase() === "S",
        penaltyShootout: row[12]?.toUpperCase() === "S",
        pitchInvader: row[13]?.toUpperCase() === "S",
        bombThreat: row[14]?.toUpperCase() === "S",
        injuries: (row[15] || "").split(",").map((s) => s.trim()).filter(Boolean),
      });
    }
  } catch (e) {
    console.error("Error reading RESULTADOS:", e);
  }
  return map;
}

// TORNEO tab: actual tournament results (filled as tournament progresses)
export async function getTournamentResult(): Promise<TournamentResult> {
  try {
    const rows = await readRange("TORNEO_REAL!A2:B10");
    const result: TournamentResult = {};
    for (const row of rows) {
      const label = (row[0] || "").trim();
      const val = (row[1] || "").trim();
      if (label === "CAMPEON") result.champion = val;
      else if (label === "SUBCAMPEON") result.runnerUp = val;
      else if (label === "TERCERO") result.thirdPlace = val;
      else if (label === "MEJOR JUGADOR") result.bestPlayer = val;
      else if (label === "MEJOR JUGADOR JOVEN") result.bestYoungPlayer = val;
      else if (label === "GOLEADOR") result.topScorer = val;
    }
    return result;
  } catch {
    return {};
  }
}

// Global injuries actually happened (from RESULTADOS tab injuries column aggregated)
export async function getActualInjuries(eventsMap: Map<number, MatchEvents>): Promise<string[]> {
  const all: string[] = [];
  for (const events of eventsMap.values()) {
    all.push(...events.injuries);
  }
  return [...new Set(all)];
}

export { slugify };
