import type { Room } from "@/lib/types";
import Scoreboard from "./Scoreboard";
import { Button, Card, ErrorNote, Screen } from "./ui";

type Props = {
  room: Room;
  myId: string;
  error: string;
  onPlayAgain: () => void;
};

export default function GameOver({ room, myId, error, onPlayAgain }: Props) {
  const winner = [...room.players].sort((a, b) => b.score - a.score)[0];

  return (
    <Screen>
      <Card tone="sun" className="py-8 text-center">
        <p className="text-5xl" aria-hidden>
          🏆
        </p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight">
          {winner?.name} wins
        </h1>
        <p className="mt-1 text-lg font-semibold">{winner?.score} points</p>
      </Card>

      <Scoreboard players={room.players} myId={myId} />

      <div className="mt-auto space-y-3">
        {myId === room.hostId ? (
          <Button onClick={onPlayAgain} className="w-full">
            Play again
          </Button>
        ) : (
          <p className="text-center font-semibold">Waiting for the host…</p>
        )}
        <ErrorNote message={error} />
      </div>
    </Screen>
  );
}
