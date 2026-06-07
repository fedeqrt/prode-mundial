import {
  PlayerData,
  PlayerPrediction,
  TournamentPrediction,
  InjuryPrediction,
  MatchEvents,
  TournamentResult,
} from "./types";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || "";

// Reads a sheet tab as a 2D array using the public gviz endpoint.
// Requires the sheet to be set to "Anyone with the link can view".
// No API key or service account needed.
async function readTab(tabName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`Sheet fetch error ${res.status} for tab "${tabName}"`);

  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) throw new Error(`Unexpected gviz response for tab "${tabName}"`);

  const data = JSON.parse(match[1]);
  const tableRows: string[][] = [];

  for (const row of data?.table?.rows ?? []) {
    const cells: string[] = (row?.c ?? []).map(
      (cell: { v?: unknown } | null) => {
        if (!cell || cell.v === null || cell.v === undefined) return "";
        return String(cell.v);
      }
    );
    tableRows.push(cells);
  }

  return tableRows;
}

export async function getPlayerNames(): Promise<string[]> {
  try {
    const rows = await readTab("CONFIG");
    // Skip title (row 0) and "JUGADORES" label (row 1), read from row 2
    return rows.slice(2).map((r) => r[0]).filter(Boolean);
  } catch (e) {
    console.error("Error reading CONFIG tab:", e);
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

export async function getPlayerData(playerName: string): Promise<PlayerData | null> {
  try {
    const rows = await readTab(playerName);
    if (!rows || rows.length === 0) return null;

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

    for (const row of rows) {
      if (!row || row.length === 0) continue;
      const cellA = (row[0] || "").trim();

      if (cellA === "LESIONES") { section = "lesiones"; continue; }
      if (cellA === "TORNEO") { section = "torneo"; continue; }

      if (section === "matches") {
        const matchId = parseInt(cellA);
        if (isNaN(matchId) || matchId <= 0) continue;

        const homeGoals = row[1] !== undefined && row[1] !== "" ? parseInt(row[1]) : null;
        const awayGoals = row[2] !== undefined && row[2] !== "" ? parseInt(row[2]) : null;

        predictions.push({
          matchId,
          homeGoals: homeGoals !== null && isNaN(homeGoals) ? null : homeGoals,
          awayGoals: awayGoals !== null && isNaN(awayGoals) ? null : awayGoals,
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

    return { name: playerName, slug: slugify(playerName), predictions, tournament, injuries };
  } catch (e) {
    console.error(`Error reading player tab "${playerName}":`, e);
    return null;
  }
}

export async function getMatchEvents(): Promise<Map<number, MatchEvents>> {
  const map = new Map<number, MatchEvents>();
  try {
    const rows = await readTab("RESULTADOS");
    for (const row of rows) {
      const matchId = parseInt(row[0]);
      if (isNaN(matchId) || matchId <= 0) continue;

      const parseNames = (cell: string) =>
        (cell || "").split(",").map((s) => s.trim()).filter(Boolean);

      const parseScorers = (cell: string, team: "home" | "away") =>
        parseNames(cell).map((name) => ({ name, team, minute: 0, isET: false }));

      const parseCards = (cell: string, team: "home" | "away") =>
        parseNames(cell).map((name) => ({ name: name === "EQUIPO" ? null : name, team }));

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
        injuries: parseNames(row[15]),
      });
    }
  } catch (e) {
    console.error("Error reading RESULTADOS tab:", e);
  }
  return map;
}

export async function getTournamentResult(): Promise<TournamentResult> {
  try {
    const rows = await readTab("TORNEO_REAL");
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

export async function getActualInjuries(eventsMap: Map<number, MatchEvents>): Promise<string[]> {
  const all: string[] = [];
  for (const events of eventsMap.values()) all.push(...events.injuries);
  return [...new Set(all)];
}

export { slugify };
