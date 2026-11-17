"use client";

import { useEffect, useState } from "react";
import { socket } from "./socket";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    function onMessage(message: string) {
      setMessage(message);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("Hello", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    socket.on("room:state", (room) => console.log(room));
    socket.on("error:join", (room) => console.log("Room not found"));

    return () => {
      socket.off("room:state");
    };
  });

  return (
    <div>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Transport: {transport}</p>
      <p>Message: {message}</p>
      <button
        onClick={() =>
          socket.emit("createRoom", { playerId: "p1", name: "Sam" })
        }
      >
        Create room
      </button>

      <button
        onClick={() =>
          socket.emit("joinRoom", {
            code: "BULJ",
            playerId: "p2",
            name: "Alex",
          })
        }
      >
        Join as Alex
      </button>
    </div>
  );
}
