import type { Player } from "@/lib/types";

export default function Scoreboard({
  players,
  myId,
}: {
  players: Player[];
  myId: string;
}) {
  const ranking = [...players].sort((a, b) => b.score - a.score);
  return (
    <ol className="space-y-1">
      {ranking.map((p) => (
        <li key={p.id} className="flex justify-between">
          <span>
            {p.name}
            {p.id === myId && " (you)"}
          </span>
          <span>{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
