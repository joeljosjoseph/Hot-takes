import type { AnswerResult, Room } from "@/lib/types";
import Scoreboard from "./Scoreboard";
import { Button, ErrorNote, Pill, Screen } from "./ui";

type Props = {
  room: Room;
  myId: string;
  results: AnswerResult[];
  error: string;
  onNext: () => void;
};

const STEP_MS = 300;

export default function Results({ room, myId, results, error, onNext }: Props) {
  const isLastRound = room.round >= room.totalRounds;

  return (
    <Screen>
      <Pill className="self-start">
        Round {room.round} of {room.totalRounds}
      </Pill>
      <h1 className="text-3xl font-extrabold">Results</h1>

      {/* Revealed from last place up to the winner */}
      <ul className="space-y-3">
        {results.map((r, i) => (
          <li
            key={i}
            className={`reveal rounded-2xl border-2 border-ink p-4 shadow-pop ${
              i === 0 && r.votes > 0 ? "bg-mint" : "bg-white"
            }`}
            style={{
              animationDelay: `${(results.length - 1 - i) * STEP_MS}ms`,
            }}
          >
            <p className="text-lg font-semibold">{r.text}</p>
            <p className="mt-1 text-sm font-semibold">
              {r.authorName} got {r.votes} {r.votes === 1 ? "vote" : "votes"}
            </p>
          </li>
        ))}
      </ul>

      {/* Scores appear after the last answer */}
      <div
        className="reveal space-y-6"
        style={{ animationDelay: `${results.length * STEP_MS}ms` }}
      >
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Scoreboard</h2>
          <Scoreboard players={room.players} myId={myId} />
        </section>

        {myId === room.hostId ? (
          <Button onClick={onNext} className="w-full">
            {isLastRound ? "Show final scores" : "Next round"}
          </Button>
        ) : (
          <p className="text-center font-semibold">Waiting for the host…</p>
        )}
        <ErrorNote message={error} />
      </div>
    </Screen>
  );
}
