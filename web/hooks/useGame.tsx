"use client";

import { useEffect, useState } from "react";
import { socket } from "@/app/socket";
import type { AnswerResult, Option, Room } from "@/lib/types";

// Stable id for this tab (the server's hostId/player id come from this)
function getPlayerId(): string {
  let id = sessionStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("playerId", id);
  }
  return id;
}

export function useGame() {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [voted, setVoted] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onState = (r: Room) => {
      setRoom(r);
      if (r.phase !== "ANSWERING") setSubmitted(false);
      if (r.phase !== "VOTING") {
        setOptions([]);
        setVoted(false);
      }
      if (r.phase !== "RESULTS") setResults([]);
      setError("");
    };

    const onError = (msg: string) => setError(msg);
    const onAccepted = () => setSubmitted(true);
    const onOptions = (o: Option[]) => setOptions(o);
    const onVoteAccepted = () => setVoted(true);
    const onResults = (r: AnswerResult[]) => setResults(r);

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("room:playerDisconnect", onState);
    socket.on("error:join", onError);
    socket.on("error:game", onError);
    socket.on("answer:accepted", onAccepted);
    socket.on("voting:options", onOptions);
    socket.on("vote:accepted", onVoteAccepted);
    socket.on("room:results", onResults);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("room:playerDisconnect", onState);
      socket.off("error:join", onError);
      socket.off("error:game", onError);
      socket.off("answer:accepted", onAccepted);
      socket.off("voting:options", onOptions);
      socket.off("vote:accepted", onVoteAccepted);
      socket.off("room:results", onResults);
    };
  }, []);

  // ---- actions: the only place that emits ----
  function createRoom(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a name first");
    socket.emit("createRoom", { playerId: getPlayerId(), name: trimmed });
  }

  function joinRoom(name: string, code: string) {
    const trimmed = name.trim();
    const cleanCode = code.trim().toUpperCase();
    if (!trimmed) return setError("Enter a name first");
    if (cleanCode.length !== 4) return setError("Room codes are 4 letters");
    socket.emit("joinRoom", {
      code: cleanCode,
      playerId: getPlayerId(),
      name: trimmed,
    });
  }

  function startGame() {
    if (!room) return;
    socket.emit("game:start", { code: room.code });
  }

  function sendDraft(text: string) {
    if (!room || submitted) return;
    socket.emit("answer:draft", { code: room.code, text });
  }

  function submitAnswer(text: string) {
    if (!room) return;
    const trimmed = text.trim();
    if (!trimmed) return setError("Write something first");
    socket.emit("answer:submit", { code: room.code, text: trimmed });
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

  // room is only set after a socket event, so this never runs during server rendering
  const myId = room ? getPlayerId() : "";

  return {
    isConnected,
    room,
    myId,
    error,
    submitted,
    options,
    voted,
    results,
    createRoom,
    joinRoom,
    startGame,
    sendDraft,
    submitAnswer,
    vote,
    nextRound,
    playAgain,
  };
}
