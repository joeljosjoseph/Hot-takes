"use client";

import { useState } from "react";
import type { Room } from "@/lib/types";
import { useCountdown } from "@/hooks/useCountdown";
import { ANSWER_SECONDS } from "@/lib/config";
import { Button, Card, ErrorNote, Pill, Screen, inputClass } from "./ui";

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
  const msLeft = useCountdown(room.phaseEndsAt);
  const secondsLeft = msLeft === null ? null : Math.ceil(msLeft / 1000);
  const timeUp = msLeft === 0;
  const fraction =
    msLeft === null || !room.phaseDurationMs
      ? 0
      : Math.min(1, msLeft / room.phaseDurationMs);
  const urgent = msLeft !== null && fraction <= 1 / 3;

  function handleChange(value: string) {
    setText(value);
    onDraft(value);
  }
  console.log({ duration: room.phaseDurationMs, msLeft, fraction });

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <Pill>
          Round {room.round} of {room.totalRounds}
        </Pill>
        <span
          className={`rounded-full border-2 border-ink px-3 py-1 text-xl font-extrabold tabular-nums ${
            urgent ? "bg-[#ff4d6d]" : "bg-white"
          }`}
        >
          {secondsLeft === null ? "" : timeUp ? "Time's up" : `${secondsLeft}s`}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
        <div
          className="h-full bg-green-500"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <Card tone="sun" className="py-6">
        <h1 className="text-3xl font-extrabold leading-tight">{room.prompt}</h1>
      </Card>

      {submitted ? (
        <Card tone="mint">
          <p className="text-lg font-bold">Answer submitted</p>
          <p>Waiting for the others…</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <input
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit(text)}
            maxLength={100}
            placeholder="Your answer"
            disabled={timeUp}
            className={inputClass}
          />
          <p className="text-right text-sm font-semibold tabular-nums">
            {text.length}/100
          </p>
          <Button
            onClick={() => onSubmit(text)}
            disabled={timeUp}
            className="w-full"
          >
            Submit answer
          </Button>
          {timeUp && (
            <p className="text-center font-semibold">
              Waiting for the next phase…
            </p>
          )}
        </div>
      )}

      <ErrorNote message={error} />
    </Screen>
  );
}
