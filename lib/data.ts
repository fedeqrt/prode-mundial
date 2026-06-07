import { getAllMatches } from "./football";
import {
  getPlayerNames,
  getPlayerData,
  getMatchEvents,
  getTournamentResult,
  getActualInjuries,
} from "./sheets";
import { computePlayerScore } from "./scoring";
import { PlayerScore, Match, PlayerData } from "./types";

export async function getStandings(): Promise<PlayerScore[]> {
  const [playerNames, matches, eventsMap, tournamentResult] = await Promise.all([
    getPlayerNames(),
    getAllMatches(),
    getMatchEvents(),
    getTournamentResult(),
  ]);

  const actualInjuries = await getActualInjuries(eventsMap);

  const playerDataList = await Promise.all(
    playerNames.map((name) => getPlayerData(name))
  );

  const scores: PlayerScore[] = [];
  for (const playerData of playerDataList) {
    if (!playerData) continue;
    const score = computePlayerScore(
      playerData,
      matches,
      eventsMap,
      tournamentResult,
      actualInjuries
    );
    scores.push(score);
  }

  return scores.sort((a, b) => b.totalScore - a.totalScore);
}

export async function getPlayerDetail(
  slug: string
): Promise<{ player: PlayerData; matches: Match[] } | null> {
  const playerNames = await getPlayerNames();
  const playerName = playerNames.find(
    (n) =>
      n
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") === slug
  );
  if (!playerName) return null;

  const [player, matches] = await Promise.all([
    getPlayerData(playerName),
    getAllMatches(),
  ]);

  if (!player) return null;
  return { player, matches };
}

export async function getMatchesWithScores(): Promise<Match[]> {
  return getAllMatches();
}
