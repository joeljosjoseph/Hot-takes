"use client";

import { useEffect, useState } from "react";
import { socket } from "./socket";
import { AnswerResult, Room } from "@/lib/types";

// Stable id that survives refreshes (the server's hostId/player id come from this)
function getPlayerId(): string {
  let id = sessionStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("playerId", id);
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
  const [now, setNow] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [options, setOptions] = useState<{ id: string; text: string }[]>([]);
  const [voted, setVoted] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);

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

  function handleStartGame() {
    if (!room) return;
    socket.emit("game:start", { code: room.code });
  }

  function onAnswerChange(value: string) {
    setAnswerText(value);
    if (!room || submitted) return;
    socket.emit("answer:draft", { code: room.code, text: value });
  }

  function submitAnswer() {
    if (!room) return;
    const text = answerText.trim();
    if (!text) return setError("Write something first");
    socket.emit("answer:submit", { code: room.code, text });
  }

  function vote(answerId: string) {
    if (!room || voted) return;

    socket.emit("vote:submit", { code: room.code, answerId });
  }

  function nextRound() {
    if (!room) return;
    socket.emit("round:next", { code: room.code });
  }

  function playAgain() {
    if (!room) return;
    socket.emit("game:playAgain", { code: room.code });
  }

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onState = (r: Room) => {
      console.log(r);
      setRoom(r);

      if (r.phase !== "ANSWERING") {
        // round complete: reset for next round
        setSubmitted(false);
        setAnswerText("");
      }

      if (r.phase !== "VOTING") {
        setOptions([]);
        setVoted(false);
      }

      if (r.phase !== "RESULTS") setResults([]);

      setError("");
    };

    const onAccepted = () => setSubmitted(true);

    const onJoinError = (msg: string) => setError(msg);

    const onGameError = (msg: string) => setError(msg);

    const onOptions = (o: { id: string; text: string }[]) => setOptions(o);

    const onVoteAccepted = () => {
      console.log("Voted");
      setVoted(true);
    };

    const onResults = (r: AnswerResult[]) => setResults(r);

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("error:join", onJoinError);
    socket.on("error:game", onGameError);
    socket.on("answer:accepted", onAccepted);
    socket.on("voting:options", onOptions);
    socket.on("vote:accepted", onVoteAccepted);
    socket.on("room:results", onResults);
    socket.on("room:playerDisconnect", onState);

    // socket.on("game:vote", onGameVote);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("error:join", onJoinError);
      socket.off("error:game", onGameError);
      socket.off("answer:accepted", onAccepted);
      socket.off("voting:options", onOptions);
      socket.off("vote:accepted", onVoteAccepted);
      socket.off("room:results", onResults);
      socket.off("room:playerDisconnect", onState);
    };
  }, []);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const secondsLeft =
    room?.phaseEndsAt != null && now !== null
      ? Math.max(0, Math.ceil((room.phaseEndsAt - now) / 1000))
      : null;

  const trimmedName = name.trim();
  const ready = isConnected;

  // ---------- Lobby ----------
  if (room) {
    const myId = getPlayerId();

    if (room.phase === "ANSWERING") {
      return (
        <main className="mx-auto max-w-md p-6 space-y-6 text-center">
          <p className="text-sm text-gray-500">
            Round {room.round} of {room.totalRounds}
          </p>
          <p className="text-sm text-gray-500">Your prompt</p>
          <h1 className="text-2xl font-bold">{room.prompt}</h1>

          <p className="text-5xl font-mono">
            {secondsLeft === null
              ? ""
              : secondsLeft > 0
                ? `${secondsLeft}s`
                : "Time's up!"}
          </p>
          {secondsLeft === 0 && (
            <p className="text-gray-500">Waiting for the next phase…</p>
          )}

          {submitted ? (
            <p className="text-green-600">Submitted! Waiting for the others…</p>
          ) : (
            <div className="flex gap-2">
              <input
                value={answerText}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                maxLength={100}
                placeholder="Your answer"
                disabled={secondsLeft === 0}
                className="w-full rounded border px-3 py-2"
              />
              <button
                onClick={submitAnswer}
                disabled={secondsLeft === 0}
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

    if (room.phase === "VOTING") {
      return (
        <main className="mx-auto max-w-md p-6 space-y-4">
          <h1 className="text-2xl font-bold text-center">{room.prompt}</h1>
          <p className="text-center text-gray-500">
            {voted
              ? "Vote locked in ✓ Waiting for the others…"
              : "Pick your favourite"}
          </p>
          <ul className="space-y-2">
            {options.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => vote(o.id)}
                  disabled={voted}
                  className="w-full rounded border px-4 py-3 text-left disabled:opacity-50"
                >
                  {o.text}
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <p className="text-center text-gray-500">
                Nothing to vote on this round. Waiting for the others…
              </p>
            )}
          </ul>
          {error && <p className="text-red-600 text-center">{error}</p>}
        </main>
      );
    }

    if (room.phase === "RESULTS") {
      const ranking = [...room.players].sort((a, b) => b.score - a.score);
      const isLastRound = room.round >= room.totalRounds;
      return (
        <main className="mx-auto max-w-md p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center">
            Round {room.round} results
          </h1>

          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={i} className="rounded border px-4 py-3">
                <p>{r.text}</p>
                <p className="text-sm text-gray-500">
                  {r.authorName}: {r.votes} vote{r.votes === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>

          <div>
            <h2 className="font-semibold mb-2">Scoreboard</h2>
            <ol className="space-y-1">
              {ranking.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {p.name}
                    {p.id === myId && " (you)"}
                  </span>
                  <span>{p.score}</span>
                </li>
              ))}
            </ol>
          </div>

          {myId === room.hostId ? (
            <button
              onClick={nextRound}
              className="w-full rounded bg-black px-4 py-2 text-white"
            >
              {isLastRound ? "Final scores" : "Next round"}
            </button>
          ) : (
            <p className="text-center text-gray-500">Waiting for the host…</p>
          )}
          {error && <p className="text-red-600 text-center">{error}</p>}
        </main>
      );
    }

    // new screen, with the others
    if (room.phase === "GAME_OVER") {
      const ranking = [...room.players].sort((a, b) => b.score - a.score);
      return (
        <main className="mx-auto max-w-md p-6 space-y-4 text-center">
          <h1 className="text-3xl font-bold">Game over</h1>
          <p className="text-xl">🏆 {ranking[0]?.name}</p>
          <ol className="space-y-1">
            {ranking.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {p.name}
                  {p.id === myId && " (you)"}
                </span>
                <span>{p.score}</span>
              </li>
            ))}
          </ol>
          {myId === room.hostId ? (
            <button
              onClick={playAgain}
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
            disabled={room.players.length < 2}
            onClick={handleStartGame}
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
