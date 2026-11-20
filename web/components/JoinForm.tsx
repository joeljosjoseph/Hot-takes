"use client";

import { useState } from "react";

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
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-3xl font-bold">Hot Takes</h1>
      <p className="text-sm text-gray-500">
        {connected ? "Connected" : "Connecting…"}
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={16}
        className="w-full rounded border px-3 py-2"
      />

      <button
        onClick={() => onCreate(name)}
        disabled={!connected}
        className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Create room
      </button>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD"
          maxLength={4}
          className="w-full rounded border px-3 py-2 font-mono uppercase"
        />
        <button
          onClick={() => onJoin(name, code)}
          disabled={!connected}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Join
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}
