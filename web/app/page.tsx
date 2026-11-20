"use client";

import { useEffect, useState } from "react";
import { socket } from "./socket";

type Player = { id: string; name: string; socketId: string; score: number };
type Room = { code: string; hostId: string; players: Player[] };

// Stable id that survives refreshes (the server's hostId/player id come from this)
function getPlayerId(): string {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("playerId", id);
  }
  return id;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onState = (r: Room) => {
      console.log(r);

      setRoom(r);
      setError("");
    };
    const onJoinError = (msg: string) => setError(msg);

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("error:join", onJoinError);
    socket.on("room:playerDisconnect", onState);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("error:join", onJoinError);
      socket.off("room:playerDisconnect", onState);
    };
  }, []);

  const trimmedName = name.trim();
  const ready = isConnected;

  function createRoom() {
    const playerId = getPlayerId();
    if (!trimmedName) return setError("Enter a name first");
    localStorage.setItem("playerName", trimmedName);
    socket.emit("createRoom", { playerId, name: trimmedName });
  }

  function joinRoom() {
    const playerId = getPlayerId();
    if (!trimmedName) return setError("Enter a name first");
    if (joinCode.trim().length !== 4)
      return setError("Room codes are 4 letters");
    localStorage.setItem("playerName", trimmedName);
    socket.emit("joinRoom", {
      code: joinCode.trim().toUpperCase(),
      playerId,
      name: trimmedName,
    });
  }

  async function copyCode() {
    if (!room) return;
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ---------- Lobby ----------
  if (room) {
    const myId = getPlayerId();
    return (
      <main className="mx-auto max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">Room code</p>
          <p className="text-5xl font-mono font-bold tracking-widest">
            {room.code}
          </p>
          <button
            onClick={copyCode}
            className="rounded border px-3 py-1 text-sm"
          >
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>

        <div>
          <h2 className="font-semibold mb-2">
            Players ({room.players.length})
          </h2>
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
            disabled
            className="w-full rounded bg-black px-4 py-2 text-white opacity-50"
          >
            Start game (coming soon)
          </button>
        ) : (
          <p className="text-center text-gray-500">
            Waiting for the host to start…
          </p>
        )}
      </main>
    );
  }

  // ---------- Join / create form ----------
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-3xl font-bold">Hot Takes</h1>
      <p className="text-sm text-gray-500">
        {isConnected ? "Connected" : "Connecting…"}
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={16}
        className="w-full rounded border px-3 py-2"
      />

      <button
        onClick={createRoom}
        disabled={!ready}
        className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Create room
      </button>

      <div className="flex gap-2">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="ABCD"
          maxLength={4}
          className="w-full rounded border px-3 py-2 font-mono uppercase"
        />
        <button
          onClick={joinRoom}
          disabled={!ready}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Join
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}
