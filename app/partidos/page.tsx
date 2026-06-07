import { getMatchesWithScores } from "@/lib/data";
import MatchCard from "@/components/MatchCard";

export const revalidate = 300;

export default async function PartidosPage() {
  const matches = await getMatchesWithScores();

  const live = matches.filter((m) => m.status === "LIVE");
  const played = matches.filter((m) => m.status === "FINISHED");
  const scheduled = matches.filter((m) => m.status === "SCHEDULED");

  const groupStages = ["GROUP_STAGE", "FIRST_STAGE"];
  const knockout = scheduled.filter((m) => !groupStages.includes(m.stage));
  const group = scheduled.filter((m) => groupStages.includes(m.stage));

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Todos los partidos</h1>
        <p className="text-white/40 text-sm">
          {played.length} jugados · {live.length} en vivo · {scheduled.length} por jugar
        </p>
      </div>

      {live.length > 0 && (
        <section>
          <h2 className="text-green-400 font-semibold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            En vivo
          </h2>
          <div className="space-y-3">
            {live.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {played.length > 0 && (
        <section>
          <h2 className="text-white/60 font-semibold text-sm uppercase tracking-widest mb-3">
            Jugados ({played.length})
          </h2>
          <div className="space-y-3">
            {played.slice().reverse().map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {knockout.length > 0 && (
        <section>
          <h2 className="text-white/60 font-semibold text-sm uppercase tracking-widest mb-3">
            Fase final
          </h2>
          <div className="space-y-3">
            {knockout.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {group.length > 0 && (
        <section>
          <h2 className="text-white/60 font-semibold text-sm uppercase tracking-widest mb-3">
            Fase de grupos ({group.length} partidos)
          </h2>
          <div className="space-y-3">
            {group.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="text-center py-20 text-white/30">
          No se pudieron cargar los partidos. Verificá la API key de football-data.org.
        </div>
      )}
    </div>
  );
}
