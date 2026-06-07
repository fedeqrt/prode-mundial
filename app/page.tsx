import { getStandings } from "@/lib/data";
import StandingsTable from "@/components/StandingsTable";

export const revalidate = 300; // refresh every 5 min

export default async function HomePage() {
  const scores = await getStandings();

  const leader = scores[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-white to-blue-400 bg-clip-text text-transparent">
          Tabla de Posiciones
        </h1>
        <p className="text-white/40 text-sm">Mundial FIFA 2026 · Prode</p>
      </div>

      {/* Leader card */}
      {leader && leader.totalScore > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-white/50 text-xs mb-1 uppercase tracking-widest">Puntero</div>
            <div className="text-2xl font-bold text-white">{leader.playerName}</div>
            <div className="text-white/40 text-sm mt-1">{leader.matchesPlayed} partidos acertados</div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-yellow-400">{leader.totalScore}</div>
            <div className="text-white/40 text-sm">puntos</div>
          </div>
        </div>
      )}

      {/* Standings table */}
      <StandingsTable scores={scores} />

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <LegendItem color="text-blue-300" label="Resultados" desc="+1 pt c/u" />
        <LegendItem color="text-purple-300" label="Marcadores" desc="+2 pts exacto" />
        <LegendItem color="text-orange-300" label="Audaces" desc="goles, tarjetas, etc." />
        <LegendItem color="text-green-300" label="Torneo" desc="campeón, MVP, etc." />
      </div>
    </div>
  );
}

function LegendItem({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
      <div className={`font-semibold ${color}`}>{label}</div>
      <div className="text-white/30 mt-0.5">{desc}</div>
    </div>
  );
}
