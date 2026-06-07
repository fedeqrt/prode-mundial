"use client";
import Link from "next/link";
import { PlayerScore } from "@/lib/types";

interface Props {
  scores: PlayerScore[];
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function StandingsTable({ scores }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-white/60 uppercase text-xs tracking-widest">
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Jugador</th>
            <th className="px-4 py-3 text-right">Resultados</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Marcadores</th>
            <th className="px-4 py-3 text-right hidden md:table-cell">Audaces</th>
            <th className="px-4 py-3 text-right hidden md:table-cell">Torneo</th>
            <th className="px-4 py-3 text-right font-bold text-white">Total</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => {
            const resultPts = s.matchScores.reduce((acc, m) => acc + m.result, 0);
            const scorePts = s.matchScores.reduce((acc, m) => acc + m.exactScore, 0);
            const audacePts = s.matchScores.reduce(
              (acc, m) =>
                acc +
                m.scorers +
                m.allScorers +
                m.cards +
                m.penalties +
                m.savedPenalties +
                m.extraTime +
                m.penaltyShootout +
                m.etGoals +
                m.pitchInvader +
                m.bombThreat,
              0
            ) + s.injuryScore;

            return (
              <tr
                key={s.slug}
                className={`border-t border-white/5 hover:bg-white/5 transition-colors ${
                  i === 0 ? "bg-yellow-500/10" : i === 1 ? "bg-gray-400/5" : i === 2 ? "bg-orange-700/5" : ""
                }`}
              >
                <td className="px-4 py-4 text-white/50 text-center w-12">
                  {MEDAL[i] ?? <span className="text-white/40">{i + 1}</span>}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/jugador/${s.slug}`}
                    className="font-semibold text-white hover:text-green-400 transition-colors"
                  >
                    {s.playerName}
                  </Link>
                  <span className="ml-2 text-white/30 text-xs hidden sm:inline">
                    {s.matchesPlayed} partidos
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-blue-300">{resultPts}</td>
                <td className="px-4 py-4 text-right text-purple-300 hidden sm:table-cell">
                  {scorePts}
                </td>
                <td className="px-4 py-4 text-right text-orange-300 hidden md:table-cell">
                  {audacePts}
                </td>
                <td className="px-4 py-4 text-right text-green-300 hidden md:table-cell">
                  {s.tournamentScore}
                </td>
                <td className="px-4 py-4 text-right font-bold text-white text-base">
                  {s.totalScore}
                </td>
              </tr>
            );
          })}
          {scores.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-white/30">
                Aún no hay datos. ¿Configuraste el Google Sheet?
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
