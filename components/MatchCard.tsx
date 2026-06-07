"use client";
import { Match, PlayerPrediction, MatchScore } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  match: Match;
  prediction?: PlayerPrediction;
  score?: MatchScore;
  showScore?: boolean;
}

export default function MatchCard({ match, prediction, score, showScore = false }: Props) {
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE";

  const predResult =
    prediction && prediction.homeGoals !== null && prediction.awayGoals !== null
      ? prediction.homeGoals > prediction.awayGoals
        ? "H"
        : prediction.homeGoals < prediction.awayGoals
        ? "A"
        : "D"
      : null;

  const actualResult =
    isFinished && match.score && match.score.home !== null
      ? match.score.home > match.score.away!
        ? "H"
        : match.score.home < match.score.away!
        ? "A"
        : "D"
      : null;

  const resultOk = predResult && actualResult && predResult === actualResult;
  const scoreOk =
    prediction &&
    isFinished &&
    match.score &&
    prediction.homeGoals === match.score.home &&
    prediction.awayGoals === match.score.away;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors">
      <div className="flex items-center justify-between gap-2 text-xs text-white/40 mb-2">
        <span>{match.stage.replace(/_/g, " ")}{match.group ? ` · ${match.group}` : ""}</span>
        <span className={isLive ? "text-green-400 animate-pulse font-semibold" : ""}>
          {isLive
            ? "EN VIVO"
            : isFinished
            ? "Finalizado"
            : format(parseISO(match.date), "d MMM HH:mm", { locale: es })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 text-right">
          <span className="font-semibold text-white text-sm">{match.homeTeam}</span>
          <span className="ml-2 text-white/30 text-xs font-mono">{match.homeTeamCode}</span>
        </div>

        {/* Score */}
        <div className="text-center min-w-[90px]">
          {isFinished || isLive ? (
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-bold text-white">{match.score?.home ?? "?"}</span>
              <span className="text-white/30">-</span>
              <span className="text-xl font-bold text-white">{match.score?.away ?? "?"}</span>
            </div>
          ) : (
            <span className="text-white/20 text-lg font-mono">vs</span>
          )}

          {/* Prediction */}
          {prediction && prediction.homeGoals !== null && (
            <div
              className={`text-xs font-mono mt-1 px-2 py-0.5 rounded-full inline-block ${
                scoreOk
                  ? "bg-green-500/20 text-green-400"
                  : resultOk
                  ? "bg-blue-500/20 text-blue-400"
                  : isFinished
                  ? "bg-red-500/10 text-red-400"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {prediction.homeGoals} - {prediction.awayGoals}
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1">
          <span className="text-white/30 text-xs font-mono mr-2">{match.awayTeamCode}</span>
          <span className="font-semibold text-white text-sm">{match.awayTeam}</span>
        </div>

        {/* Points */}
        {showScore && score && (
          <div className="ml-2 text-right min-w-[48px]">
            <span
              className={`text-lg font-bold ${
                score.total > 0 ? "text-green-400" : "text-white/20"
              }`}
            >
              +{score.total}
            </span>
            <div className="text-xs text-white/30">pts</div>
          </div>
        )}
      </div>

      {/* Audacious bets summary */}
      {prediction && (
        <div className="mt-2 flex flex-wrap gap-1">
          {prediction.homeScorers.length > 0 && (
            <Badge label={`⚽ ${prediction.homeScorers.join(", ")}`} color="blue" />
          )}
          {prediction.awayScorers.length > 0 && (
            <Badge label={`⚽ ${prediction.awayScorers.join(", ")}`} color="blue" />
          )}
          {prediction.extraTime && <Badge label="Alargue" color="orange" />}
          {prediction.penaltyShootout && <Badge label="Penales" color="red" />}
          {prediction.penaltyHome && <Badge label="Pen. local" color="purple" />}
          {prediction.penaltyAway && <Badge label="Pen. visit." color="purple" />}
          {prediction.yellowCardHome && <Badge label={`🟨 ${prediction.yellowCardHome}`} color="yellow" />}
          {prediction.yellowCardAway && <Badge label={`🟨 ${prediction.yellowCardAway}`} color="yellow" />}
          {prediction.redCardHome && <Badge label={`🟥 ${prediction.redCardHome}`} color="red" />}
          {prediction.redCardAway && <Badge label={`🟥 ${prediction.redCardAway}`} color="red" />}
          {prediction.pitchInvader && <Badge label="Invasión" color="green" />}
          {prediction.bombThreat && <Badge label="Bomba" color="red" />}
        </div>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-300",
    orange: "bg-orange-500/15 text-orange-300",
    red: "bg-red-500/15 text-red-300",
    purple: "bg-purple-500/15 text-purple-300",
    yellow: "bg-yellow-500/15 text-yellow-300",
    green: "bg-green-500/15 text-green-300",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[color] ?? "bg-white/10 text-white/40"}`}>
      {label}
    </span>
  );
}
