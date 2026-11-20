import type { Player } from "@/lib/types";
import Avatar from "./Avatar";

export default function Scoreboard({
  players,
  myId,
}: {
  players: Player[];
  myId: string;
}) {
  const ranking = [...players].sort((a, b) => b.score - a.score);
  return (
    <ol className="space-y-2">
      {ranking.map((p, i) => (
        <li
          key={p.id}
          className={`flex items-center gap-3 rounded-xl border-2 border-ink px-3 py-2 ${
            p.id === myId ? "bg-sun" : "bg-white"
          }`}
        >
          <span className="w-5 text-center font-extrabold">{i + 1}</span>
          <Avatar id={p.id} name={p.name} />
          <span className="flex-1 truncate font-semibold">
            {p.name}
            {p.id === myId && " (you)"}
          </span>
          <span className="text-xl font-extrabold tabular-nums">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
