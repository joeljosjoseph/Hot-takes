"use client";

import { useState } from "react";
import { Button, Card, ErrorNote, Screen, inputClass } from "./ui";

type Props = {
  connected: boolean;
  error: string;
  onCreate: (name: string) => void;
  onJoin: (name: string, code: string) => void;
};

export default function JoinForm({
  connected,
  error,
  onCreate,
  onJoin,
}: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  return (
    <Screen>
      <header className="flex items-start justify-between">
        <h1 className="text-6xl font-extrabold leading-[0.9] tracking-tight">
          Hot
          <br />
          Takes
        </h1>
        <span className="mt-2 flex items-center gap-2 text-sm font-semibold">
          <span
            className={`size-2.5 rounded-full border border-ink ${connected ? "bg-mint" : "bg-chili"}`}
          />
          {connected ? "Connected" : "Connecting…"}
        </span>
      </header>

      <p className="text-lg">
        Answer the prompt, then vote for the funniest answer.
      </p>

      <label className="block space-y-2">
        <span className="font-bold">Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="Sam"
          className={inputClass}
        />
      </label>

      <Button
        onClick={() => onCreate(name)}
        disabled={!connected}
        className="w-full"
      >
        Create a room
      </Button>

      <Card>
        <p className="mb-3 font-bold">Have a code?</p>
        <div className="flex gap-2">
          <input
            aria-label="Room code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            placeholder="ABCD"
            className={`${inputClass} font-mono text-xl uppercase tracking-[0.3em]`}
          />
          <Button
            variant="secondary"
            onClick={() => onJoin(name, code)}
            disabled={!connected}
          >
            Join
          </Button>
        </div>
      </Card>

      <ErrorNote message={error} />
    </Screen>
  );
}
