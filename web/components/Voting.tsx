"use client";

import { useState } from "react";
import type { Option, Room } from "@/lib/types";
import { Card, ErrorNote, Pill, pressable, Screen } from "./ui";

type Props = {
  room: Room;
  options: Option[];
  voted: boolean;
  error: string;
  onVote: (answerId: string) => void;
};

export default function Voting({ room, options, voted, error, onVote }: Props) {
  const [picked, setPicked] = useState<string | null>(null);

  function pick(id: string) {
    setPicked(id);
    onVote(id);
  }

  return (
    <Screen>
      <Pill className="self-start">
        Round {room.round} of {room.totalRounds}
      </Pill>
      <h1 className="text-2xl font-extrabold leading-tight">{room.prompt}</h1>
      <p className="font-semibold">
        {voted
          ? "Vote submitted. Waiting for the others…"
          : "Vote for your favourite. Your own answer isn't shown."}
      </p>

      {options.length === 0 ? (
        <Card>
          <p className="font-semibold">
            Nothing to vote on this round. Waiting for the others…
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {options.map((o) => {
            const isPicked = picked === o.id;
            return (
              <li key={o.id}>
                <button
                  onClick={() => pick(o.id)}
                  disabled={voted}
                  className={`w-full rounded-2xl border-2 px-4 py-4 text-left text-lg font-semibold disabled:cursor-default ${
                    voted
                      ? isPicked
                        ? "translate-x-1 translate-y-1 border-ink bg-mint shadow-none"
                        : "border-ink/30 bg-white/50 text-ink/40 shadow-none"
                      : `border-ink bg-white shadow-pop ${pressable}`
                  }`}
                >
                  {o.text}
                  {voted && isPicked && (
                    <span className="mt-1 block text-sm font-bold">
                      Your vote
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ErrorNote message={error} />
    </Screen>
  );
}
