import type { Socket } from "socket.io";
import { rooms } from "../state";
import { MIN_PLAYERS } from "../config";
import { findSender } from "../rooms";
import { advanceFromResults, resetToLobby, startAnswering } from "../game";

export function registerGameHandlers(socket: Socket) {
    socket.on("game:start", (data: { code: string }) => {
        const room = rooms.get(data?.code);
        if (!room) {
            socket.emit("error:game", "Room not found");
            return;
        }

        const sender = findSender(room, socket.id);
        if (!sender || sender.id !== room.hostId) {
            socket.emit("error:game", "Only the host can start the game");
            return;
        }

        if (room.phase !== "LOBBY") {
            socket.emit("error:game", "Game already started");
            return;
        }

        if (room.players.length < MIN_PLAYERS) {
            socket.emit("error:game", `Need at least ${MIN_PLAYERS} players`);
            return;
        }

        startAnswering(room);
    });

    socket.on("round:next", (data: { code: string }) => {
        const room = rooms.get(data?.code);
        if (!room) return;

        const sender = findSender(room, socket.id);
        if (!sender || sender.id !== room.hostId) {
            socket.emit("error:game", "Only the host can continue");
            return;
        }
        if (room.phase !== "RESULTS") return;

        advanceFromResults(room);
    });

    socket.on("game:playAgain", (data: { code: string }) => {
        const room = rooms.get(data?.code);
        if (!room) return;

        const sender = findSender(room, socket.id);
        if (!sender || sender.id !== room.hostId) {
            socket.emit("error:game", "Only the host can continue");
            return;
        }
        if (room.phase !== "GAME_OVER") return;

        resetToLobby(room);
    });
}