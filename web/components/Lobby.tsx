"use client";

import { useState } from "react";
import type { Room } from "@/lib/types";
import Avatar from "./Avatar";
import { Button, ErrorNote, Pill, Screen } from "./ui";

type Props = { room: Room; myId: string; error: string; onStart: () => void };

export default function Lobby({ room, myId, error, onStart }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = myId === room.hostId;

  async function copyCode() {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Screen>
      <section className="space-y-4 text-center">
        <p className="font-semibold">Share this code with your friends</p>
        <div
          className="flex justify-center gap-2"
          aria-label={`Room code ${room.code}`}
        >
          {room.code.split("").map((ch, i) => (
            <span
              key={i}
              className="grid size-16 place-items-center rounded-xl border-2 border-ink bg-white text-4xl font-extrabold shadow-pop"
            >
              {ch}
            </span>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={copyCode}
          className="min-h-10 px-4 py-1.5 text-base"
        >
          {copied ? "Copied" : "Copy code"}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">
          Players ({room.players.length})
        </h2>
        <ul className="space-y-2">
          {room.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white px-3 py-2"
            >
              <Avatar id={p.id} name={p.name} />
              <span className="flex-1 truncate font-semibold">{p.name}</span>
              {p.id === room.hostId && <Pill>Host</Pill>}
              {p.id === myId && <Pill className="bg-sun">You</Pill>}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-auto space-y-3">
        {isHost ? (
          <>
            <Button
              onClick={onStart}
              disabled={room.players.length < 2}
              className="w-full"
            >
              Start game
            </Button>
            {room.players.length < 2 && (
              <p className="text-center text-sm font-semibold">
                Waiting for at least one more player…
              </p>
            )}
          </>
        ) : (
          <p className="text-center font-semibold">
            Waiting for the host to start…
          </p>
        )}
        <ErrorNote message={error} />
      </div>
    </Screen>
  );
}
