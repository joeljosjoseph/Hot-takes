import type { Room } from "@/lib/types";
import Scoreboard from "./Scoreboard";

type Props = {
  room: Room;
  myId: string;
  error: string;
  onPlayAgain: () => void;
};

export default function GameOver({ room, myId, error, onPlayAgain }: Props) {
  const winner = [...room.players].sort((a, b) => b.score - a.score)[0];

  return (
    <main className="mx-auto max-w-md p-6 space-y-4 text-center">
      <h1 className="text-3xl font-bold">Game over</h1>
      <p className="text-xl">🏆 {winner?.name}</p>
      <Scoreboard players={room.players} myId={myId} />
      {myId === room.hostId ? (
        <button
          onClick={onPlayAgain}
          className="w-full rounded bg-black px-4 py-2 text-white"
        >
          Play again
        </button>
      ) : (
        <p className="text-gray-500">Waiting for the host…</p>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}
