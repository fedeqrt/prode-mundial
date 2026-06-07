import {
  Match,
  MatchEvents,
  PlayerPrediction,
  MatchScore,
  PlayerScore,
  PlayerData,
  TournamentResult,
  InjuryPrediction,
} from "./types";

function normalizeStr(s: string) {
  return s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function namesMatch(a: string, b: string) {
  return normalizeStr(a) === normalizeStr(b);
}

export function scoreMatch(
  match: Match,
  prediction: PlayerPrediction,
  events: MatchEvents
): MatchScore {
  const score: MatchScore = {
    matchId: match.id,
    result: 0,
    exactScore: 0,
    scorers: 0,
    allScorers: 0,
    cards: 0,
    penalties: 0,
    savedPenalties: 0,
    extraTime: 0,
    penaltyShootout: 0,
    etGoals: 0,
    pitchInvader: 0,
    bombThreat: 0,
    total: 0,
  };

  if (!match.score || match.score.home === null || match.score.away === null) {
    return score; // partido no jugado
  }

  const actualHome = match.score.home;
  const actualAway = match.score.away;
  const predHome = prediction.homeGoals;
  const predAway = prediction.awayGoals;

  if (predHome === null || predAway === null) return score;

  // Resultado (1 punto)
  const actualResult = actualHome > actualAway ? "H" : actualHome < actualAway ? "A" : "D";
  const predResult = predHome > predAway ? "H" : predHome < predAway ? "A" : "D";
  if (actualResult === predResult) score.result = 1;

  // Marcador exacto (2 puntos)
  if (predHome === actualHome && predAway === actualAway) score.exactScore = 2;

  // === AUDACES ===

  // Goleadores individuales (1 punto c/u)
  const actualHomeScorers = events.scorers
    .filter((s) => s.team === "home" && !s.isET)
    .map((s) => s.name);
  const actualAwayScorers = events.scorers
    .filter((s) => s.team === "away" && !s.isET)
    .map((s) => s.name);

  for (const p of prediction.homeScorers) {
    if (actualHomeScorers.some((n) => namesMatch(n, p))) score.scorers += 1;
  }
  for (const p of prediction.awayScorers) {
    if (actualAwayScorers.some((n) => namesMatch(n, p))) score.scorers += 1;
  }

  // Todos los goleadores de un equipo (3 puntos bonus por equipo)
  if (
    prediction.homeScorers.length > 0 &&
    actualHomeScorers.length > 0 &&
    actualHomeScorers.every((n) => prediction.homeScorers.some((p) => namesMatch(n, p))) &&
    prediction.homeScorers.every((p) => actualHomeScorers.some((n) => namesMatch(n, p)))
  ) {
    score.allScorers += 3;
  }
  if (
    prediction.awayScorers.length > 0 &&
    actualAwayScorers.length > 0 &&
    actualAwayScorers.every((n) => prediction.awayScorers.some((p) => namesMatch(n, p))) &&
    prediction.awayScorers.every((p) => actualAwayScorers.some((n) => namesMatch(n, p)))
  ) {
    score.allScorers += 3;
  }

  // Tarjetas amarillas
  score.cards += scoreCard(prediction.yellowCardHome, events.yellowCards, "home");
  score.cards += scoreCard(prediction.yellowCardAway, events.yellowCards, "away");

  // Tarjetas rojas
  score.cards += scoreCard(prediction.redCardHome, events.redCards, "home");
  score.cards += scoreCard(prediction.redCardAway, events.redCards, "away");

  // Penales (1 pto por equipo acertado)
  if (prediction.penaltyHome && events.penalties.some((p) => p.team === "home"))
    score.penalties += 1;
  if (prediction.penaltyAway && events.penalties.some((p) => p.team === "away"))
    score.penalties += 1;

  // Penal atajado (1 pto)
  if (prediction.savedPenaltyHome && events.savedPenalties.some((p) => p.team === "home"))
    score.savedPenalties += 1;
  if (prediction.savedPenaltyAway && events.savedPenalties.some((p) => p.team === "away"))
    score.savedPenalties += 1;

  // Alargue (1 pto)
  if (prediction.extraTime && events.extraTime) score.extraTime = 1;

  // Penales en tanda (1 pto)
  if (prediction.penaltyShootout && events.penaltyShootout) score.penaltyShootout = 1;

  // Goles en alargue (mismas reglas + 1 pto extra por gol)
  const actualETHomeScorers = events.scorers.filter((s) => s.team === "home" && s.isET).map((s) => s.name);
  const actualETAwayScorers = events.scorers.filter((s) => s.team === "away" && s.isET).map((s) => s.name);

  if (prediction.etGoalHome && actualETHomeScorers.some((n) => namesMatch(n, prediction.etGoalHome!))) {
    score.etGoals += 1 + 1; // scorer point + ET bonus
  } else if (prediction.etGoalHome && actualETHomeScorers.length > 0) {
    // Acertó que hay gol ET local pero no el jugador — no suma (necesita el jugador para el punto)
  }
  if (prediction.etGoalAway && actualETAwayScorers.some((n) => namesMatch(n, prediction.etGoalAway!))) {
    score.etGoals += 1 + 1;
  }

  // Invasión de cancha (2 pts)
  if (prediction.pitchInvader && events.pitchInvader) score.pitchInvader = 2;

  // Amenaza de bomba (2 pts)
  if (prediction.bombThreat && events.bombThreat) score.bombThreat = 2;

  score.total =
    score.result +
    score.exactScore +
    score.scorers +
    score.allScorers +
    score.cards +
    score.penalties +
    score.savedPenalties +
    score.extraTime +
    score.penaltyShootout +
    score.etGoals +
    score.pitchInvader +
    score.bombThreat;

  return score;
}

function scoreCard(
  prediction: string | null,
  actualCards: { name: string | null; team: "home" | "away" }[],
  team: "home" | "away"
): number {
  if (!prediction) return 0;
  const teamCards = actualCards.filter((c) => c.team === team);
  if (teamCards.length === 0) return 0;

  const isTeamOnly = prediction.toUpperCase() === "EQUIPO";
  if (isTeamOnly) {
    // Solo acertó que el equipo iba a tener tarjeta → 1 pto
    return 1;
  }
  // Acertó equipo + jugador → 2 pts
  if (teamCards.some((c) => c.name && namesMatch(c.name, prediction))) {
    return 2;
  }
  // Hay tarjeta en ese equipo pero no el jugador → 1 pto (acertó equipo)
  return 1;
}

export function scoreTournament(
  prediction: PlayerData["tournament"],
  actual: TournamentResult
): number {
  let pts = 0;
  if (actual.champion && namesMatch(prediction.champion, actual.champion)) pts += 15;
  if (actual.runnerUp && namesMatch(prediction.runnerUp, actual.runnerUp)) pts += 12;
  if (actual.thirdPlace && namesMatch(prediction.thirdPlace, actual.thirdPlace)) pts += 10;
  if (actual.bestPlayer && namesMatch(prediction.bestPlayer, actual.bestPlayer)) pts += 10;
  if (actual.bestYoungPlayer && namesMatch(prediction.bestYoungPlayer, actual.bestYoungPlayer)) pts += 5;
  if (actual.topScorer && namesMatch(prediction.topScorer, actual.topScorer)) pts += 10;
  return pts;
}

export function scoreInjuries(
  predictions: InjuryPrediction[],
  actualInjuries: string[]
): number {
  let pts = 0;
  for (const pred of predictions) {
    if (actualInjuries.some((n) => namesMatch(n, pred.playerName))) pts += 1;
  }
  return pts;
}

export function computePlayerScore(
  player: PlayerData,
  matches: Match[],
  eventsMap: Map<number, MatchEvents>,
  tournamentResult: TournamentResult,
  actualInjuries: string[]
): PlayerScore {
  const matchScores: MatchScore[] = [];

  for (const pred of player.predictions) {
    const match = matches.find((m) => m.id === pred.matchId);
    if (!match) continue;
    const events = eventsMap.get(match.id) ?? {
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
    matchScores.push(scoreMatch(match, pred, events));
  }

  const tournamentScore = scoreTournament(player.tournament, tournamentResult);
  const injuryScore = scoreInjuries(player.injuries, actualInjuries);

  const totalScore =
    matchScores.reduce((sum, s) => sum + s.total, 0) + tournamentScore + injuryScore;

  return {
    playerName: player.name,
    slug: player.slug,
    matchScores,
    tournamentScore,
    injuryScore,
    totalScore,
    matchesPlayed: matchScores.filter((s) => s.result + s.exactScore > 0 || s.total > 0).length,
  };
}
