"use client";

import { useState } from "react";
import type { Room } from "@/lib/types";
import { useSecondsLeft } from "../hooks/useSecondsLeft";

type Props = {
  room: Room;
  submitted: boolean;
  error: string;
  onDraft: (text: string) => void;
  onSubmit: (text: string) => void;
};

export default function Answering({
  room,
  submitted,
  error,
  onDraft,
  onSubmit,
}: Props) {
  const [text, setText] = useState("");
  const secondsLeft = useSecondsLeft(room.phaseEndsAt);
  const timeUp = secondsLeft === 0;

  function handleChange(value: string) {
    setText(value);
    onDraft(value);
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6 text-center">
      <p className="text-sm text-gray-500">
        Round {room.round} of {room.totalRounds}
      </p>
      <h1 className="text-2xl font-bold">{room.prompt}</h1>

      <p className="text-5xl font-mono">
        {secondsLeft === null
          ? ""
          : secondsLeft > 0
            ? `${secondsLeft}s`
            : "Time's up!"}
      </p>
      {timeUp && <p className="text-gray-500">Waiting for the next phase…</p>}

      {submitted ? (
        <p className="text-green-600">Submitted! Waiting for the others…</p>
      ) : (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit(text)}
            maxLength={100}
            placeholder="Your answer"
            disabled={timeUp}
            className="w-full rounded border px-3 py-2"
          />
          <button
            onClick={() => onSubmit(text)}
            disabled={timeUp}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}
