import type { AnswerResult, Room } from "@/lib/types";
import Scoreboard from "./Scoreboard";

type Props = {
  room: Room;
  myId: string;
  results: AnswerResult[];
  error: string;
  onNext: () => void;
};

export default function Results({ room, myId, results, error, onNext }: Props) {
  const isLastRound = room.round >= room.totalRounds;

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Round {room.round} results
      </h1>

      <ul className="space-y-2">
        {results.map((r, i) => (
          <li key={i} className="rounded border px-4 py-3">
            <p>{r.text}</p>
            <p className="text-sm text-gray-500">
              {r.authorName}: {r.votes} vote{r.votes === 1 ? "" : "s"}
            </p>
          </li>
        ))}
      </ul>

      <div>
        <h2 className="font-semibold mb-2">Scoreboard</h2>
        <Scoreboard players={room.players} myId={myId} />
      </div>

      {myId === room.hostId ? (
        <button
          onClick={onNext}
          className="w-full rounded bg-black px-4 py-2 text-white"
        >
          {isLastRound ? "Final scores" : "Next round"}
        </button>
      ) : (
        <p className="text-center text-gray-500">Waiting for the host…</p>
      )}
      {error && <p className="text-red-600 text-center">{error}</p>}
    </main>
  );
}
