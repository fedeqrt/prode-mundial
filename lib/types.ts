export interface Match {
  id: number;
  date: string; // ISO string
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string;
  awayTeamCode: string;
  stage: string;
  group?: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";
  score?: {
    home: number | null;
    away: number | null;
    homeET?: number | null;
    awayET?: number | null;
  };
  // Actual match events (from API)
  actualEvents?: MatchEvents;
}

export interface MatchEvents {
  scorers: { name: string; team: "home" | "away"; minute: number; isET: boolean }[];
  yellowCards: { name: string | null; team: "home" | "away" }[];
  redCards: { name: string | null; team: "home" | "away" }[];
  penalties: { team: "home" | "away" }[];
  savedPenalties: { team: "home" | "away" }[];
  extraTime: boolean;
  penaltyShootout: boolean;
  pitchInvader: boolean;
  bombThreat: boolean;
  injuries: string[];
}

export interface PlayerPrediction {
  matchId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  // Audacious bets
  homeScorers: string[]; // player names
  awayScorers: string[];
  yellowCardHome: string | null; // player name or "EQUIPO" for team-only
  yellowCardAway: string | null;
  redCardHome: string | null;
  redCardAway: string | null;
  penaltyHome: boolean;
  penaltyAway: boolean;
  savedPenaltyHome: boolean;
  savedPenaltyAway: boolean;
  extraTime: boolean;
  penaltyShootout: boolean;
  etGoalHome: string | null;
  etGoalAway: string | null;
  pitchInvader: boolean;
  bombThreat: boolean;
}

export interface TournamentPrediction {
  champion: string;
  runnerUp: string;
  thirdPlace: string;
  bestPlayer: string;
  bestYoungPlayer: string;
  topScorer: string;
}

export interface InjuryPrediction {
  playerName: string;
}

export interface PlayerData {
  name: string;
  slug: string;
  predictions: PlayerPrediction[];
  tournament: TournamentPrediction;
  injuries: InjuryPrediction[];
}

export interface MatchScore {
  matchId: number;
  result: number;       // 0 o 1
  exactScore: number;   // 0 o 2
  scorers: number;
  allScorers: number;   // bonus por todos los goleadores de un equipo
  cards: number;
  penalties: number;
  savedPenalties: number;
  extraTime: number;
  penaltyShootout: number;
  etGoals: number;
  pitchInvader: number;
  bombThreat: number;
  total: number;
}

export interface PlayerScore {
  playerName: string;
  slug: string;
  matchScores: MatchScore[];
  tournamentScore: number;
  injuryScore: number;
  totalScore: number;
  matchesPlayed: number;
}

export interface TournamentResult {
  champion?: string;
  runnerUp?: string;
  thirdPlace?: string;
  bestPlayer?: string;
  bestYoungPlayer?: string;
  topScorer?: string;
}
