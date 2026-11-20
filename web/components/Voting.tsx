import type { Option, Room } from "@/lib/types";

type Props = {
  room: Room;
  options: Option[];
  voted: boolean;
  error: string;
  onVote: (answerId: string) => void;
};

export default function Voting({ room, options, voted, error, onVote }: Props) {
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">{room.prompt}</h1>
      <p className="text-center text-gray-500">
        {voted
          ? "Vote locked in^^^^ Waiting for the others…"
          : "Pick your favourite"}
      </p>

      {options.length === 0 ? (
        <p className="text-center text-gray-500">
          Nothing to vote on this round. Waiting for the others…
        </p>
      ) : (
        <ul className="space-y-2">
          {options.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => onVote(o.id)}
                disabled={voted}
                className="w-full rounded border px-4 py-3 text-left disabled:opacity-50"
              >
                {o.text}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-600 text-center">{error}</p>}
    </main>
  );
}
