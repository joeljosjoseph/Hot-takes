"use client";

import { useState } from "react";
import type { Room } from "@/lib/types";

type Props = { room: Room; myId: string; error: string; onStart: () => void };

export default function Lobby({ room, myId, error, onStart }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500">Room code</p>
        <p className="text-5xl font-mono font-bold tracking-widest">
          {room.code}
        </p>
        <button onClick={copyCode} className="rounded border px-3 py-1 text-sm">
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Players ({room.players.length})</h2>
        <ul className="space-y-1">
          {room.players.map((p) => (
            <li key={p.id} className="rounded border px-3 py-2">
              {p.name}
              {p.id === room.hostId && " 👑"}
              {p.id === myId && " (you)"}
            </li>
          ))}
        </ul>
      </div>

      {myId === room.hostId ? (
        <button
          disabled={room.players.length < 2}
          onClick={onStart}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Start Game
        </button>
      ) : (
        <p className="text-center text-gray-500">
          Waiting for the host to start…
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}
