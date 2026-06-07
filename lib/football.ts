import { Match, MatchEvents } from "./types";

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || "";
const COMPETITION_CODE = process.env.COMPETITION_CODE || "WC";

async function fetchFD(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": API_KEY },
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!res.ok) throw new Error(`football-data.org error ${res.status}: ${path}`);
  return res.json();
}

export async function getAllMatches(): Promise<Match[]> {
  try {
    const data = await fetchFD(`/competitions/${COMPETITION_CODE}/matches`);
    return (data.matches || []).map(parseMatch);
  } catch (e) {
    console.error("Error fetching matches:", e);
    return [];
  }
}

export async function getMatch(matchId: number): Promise<Match | null> {
  try {
    const data = await fetchFD(`/matches/${matchId}`);
    return parseMatch(data);
  } catch {
    return null;
  }
}

function parseMatch(m: Record<string, unknown>): Match {
  const homeTeam = m.homeTeam as Record<string, unknown>;
  const awayTeam = m.awayTeam as Record<string, unknown>;
  const score = m.score as Record<string, unknown>;
  const fullTime = score?.fullTime as Record<string, unknown> | undefined;
  const extraTime = score?.extraTime as Record<string, unknown> | undefined;

  return {
    id: m.id as number,
    date: m.utcDate as string,
    homeTeam: (homeTeam?.name as string) || "TBD",
    awayTeam: (awayTeam?.name as string) || "TBD",
    homeTeamCode: (homeTeam?.tla as string) || "???",
    awayTeamCode: (awayTeam?.tla as string) || "???",
    stage: m.stage as string,
    group: m.group as string | undefined,
    status: m.status as Match["status"],
    score:
      fullTime
        ? {
            home: fullTime.home as number | null,
            away: fullTime.away as number | null,
            homeET: extraTime?.home as number | null,
            awayET: extraTime?.away as number | null,
          }
        : undefined,
  };
}

// football-data.org free tier does NOT provide match events (scorers, cards).
// We read those from the RESULTADOS tab in the Google Sheet (entered manually by the admin)
// or leave empty so only result+score points are awarded automatically.
export function emptyEvents(): MatchEvents {
  return {
    scorers: [],
    yellowCards: [],
    redCards: [],
    penalties: [],
    savedPenalties: [],
    extraTime: false,
    penaltyShootout: false,
    pitchInvader: false,
    bombThreat: false,
    injuries: [],
  };
}
