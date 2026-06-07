import { getPlayerDetail, getStandings } from "@/lib/data";
import { getMatchEvents, getTournamentResult } from "@/lib/sheets";
import { computePlayerScore } from "@/lib/scoring";
import MatchCard from "@/components/MatchCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const [detail, standings, eventsMap, tournamentResult] = await Promise.all([
    getPlayerDetail(slug),
    getStandings(),
    getMatchEvents(),
    getTournamentResult(),
  ]);

  if (!detail) notFound();

  const { player, matches } = detail;
  const playerStanding = standings.find((s) => s.slug === slug);
  const rank = standings.findIndex((s) => s.slug === slug) + 1;

  const scoreData = playerStanding
    ? playerStanding
    : computePlayerScore(player, matches, eventsMap, tournamentResult, []);

  const predictionMap = new Map(player.predictions.map((p) => [p.matchId, p]));
  const matchScoreMap = new Map(scoreData.matchScores.map((s) => [s.matchId, s]));

  const playedMatches = matches.filter(
    (m) => m.status === "FINISHED" || m.status === "LIVE"
  );
  const scheduledMatches = matches.filter((m) => m.status === "SCHEDULED");

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors inline-flex items-center gap-1">
        ← Tabla de posiciones
      </Link>

      {/* Player header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest mb-1">
              {rank > 0 ? `Posición #${rank}` : "Jugador"}
            </div>
            <h1 className="text-3xl font-bold text-white">{player.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-green-400">{scoreData.totalScore}</div>
            <div className="text-white/40 text-sm">puntos totales</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            label="Resultados"
            value={scoreData.matchScores.reduce((a, s) => a + s.result, 0)}
            color="blue"
          />
          <StatBox
            label="Marcadores"
            value={scoreData.matchScores.reduce((a, s) => a + s.exactScore, 0)}
            color="purple"
          />
          <StatBox
            label="Audaces"
            value={
              scoreData.matchScores.reduce(
                (a, s) =>
                  a +
                  s.scorers +
                  s.allScorers +
                  s.cards +
                  s.penalties +
                  s.savedPenalties +
                  s.extraTime +
                  s.penaltyShootout +
                  s.etGoals +
                  s.pitchInvader +
                  s.bombThreat,
                0
              ) + scoreData.injuryScore
            }
            color="orange"
          />
          <StatBox label="Torneo" value={scoreData.tournamentScore} color="green" />
        </div>
      </div>

      {/* Tournament predictions */}
      {(player.tournament.champion || player.tournament.topScorer) && (
        <div>
          <h2 className="text-lg font-semibold text-white/70 mb-3">Predicciones del torneo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {player.tournament.champion && (
              <TournamentCard label="Campeón" value={player.tournament.champion} pts={15} />
            )}
            {player.tournament.runnerUp && (
              <TournamentCard label="Subcampeón" value={player.tournament.runnerUp} pts={12} />
            )}
            {player.tournament.thirdPlace && (
              <TournamentCard label="Tercer puesto" value={player.tournament.thirdPlace} pts={10} />
            )}
            {player.tournament.topScorer && (
              <TournamentCard label="Goleador" value={player.tournament.topScorer} pts={10} />
            )}
            {player.tournament.bestPlayer && (
              <TournamentCard label="Mejor jugador" value={player.tournament.bestPlayer} pts={10} />
            )}
            {player.tournament.bestYoungPlayer && (
              <TournamentCard label="Mejor joven" value={player.tournament.bestYoungPlayer} pts={5} />
            )}
          </div>
        </div>
      )}

      {/* Injury predictions */}
      {player.injuries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white/70 mb-3">Lesionados apostados</h2>
          <div className="flex flex-wrap gap-2">
            {player.injuries.map((inj) => (
              <span
                key={inj.playerName}
                className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-3 py-1 rounded-full"
              >
                🤕 {inj.playerName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Played matches */}
      {playedMatches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white/70 mb-3">Partidos jugados</h2>
          <div className="space-y-3">
            {playedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionMap.get(match.id)}
                score={matchScoreMap.get(match.id)}
                showScore
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming predictions */}
      {scheduledMatches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white/70 mb-3">Próximos partidos</h2>
          <div className="space-y-3">
            {scheduledMatches.slice(0, 20).map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionMap.get(match.id)}
              />
            ))}
            {scheduledMatches.length > 20 && (
              <p className="text-center text-white/30 text-sm py-2">
                + {scheduledMatches.length - 20} partidos más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
    green: "text-green-400",
  };
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <div className={`text-2xl font-bold ${colors[color] ?? "text-white"}`}>{value}</div>
      <div className="text-white/40 text-xs mt-1">{label}</div>
    </div>
  );
}

function TournamentCard({ label, value, pts }: { label: string; value: string; pts: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="text-white/40 text-xs mb-1">{label}</div>
      <div className="font-semibold text-white">{value}</div>
      <div className="text-green-400/60 text-xs mt-1">vale {pts} pts</div>
    </div>
  );
}
