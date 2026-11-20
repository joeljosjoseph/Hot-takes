import type { Socket } from "socket.io";
import { io } from "../io";
import { rooms, deleteRoom } from "../state";
import { TOTAL_ROUNDS } from "../config";
import { addOrUpdatePlayer, cleanName, createUniqueCode } from "../rooms";
import { checkAnsweringComplete, checkVotingComplete } from "../game";
import type { Player, Room } from "../type";

export function registerLobbyHandlers(socket: Socket) {
    socket.on("createRoom", (data: { playerId: string; name: string }) => {
        const name = cleanName(data?.name);
        if (typeof data?.playerId !== "string" || !name) return;

        // A returning host gets their existing room back
        const existing = [...rooms.values()].find((r) => r.hostId === data.playerId);
        if (existing) {
            addOrUpdatePlayer(existing, data.playerId, name, socket.id);
            socket.join(existing.code);
            io.to(existing.code).emit("room:state", existing);
            return;
        }

        const code = createUniqueCode();
        const host: Player = { id: data.playerId, name, socketId: socket.id, score: 0 };
        const room: Room = {
            code,
            hostId: data.playerId,
            players: [host],
            phase: "LOBBY",
            phaseEndsAt: null,
            prompt: null,
            round: 0,
            totalRounds: TOTAL_ROUNDS, phaseDurationMs: null
        };

        rooms.set(code, room);
        socket.join(code);
        socket.emit("room:state", room);
    });

    socket.on("joinRoom", (data: { code: string; playerId: string; name: string }) => {
        const name = cleanName(data?.name);
        if (typeof data?.playerId !== "string" || !name) return;

        const room = rooms.get(String(data.code).toUpperCase());
        if (!room) {
            socket.emit("error:join", "Room not found");
            return;
        }

        // TODO: reject joins once the game has started (room.phase !== "LOBBY")

        addOrUpdatePlayer(room, data.playerId, name, socket.id);
        socket.join(room.code);
        io.to(room.code).emit("room:state", room);
    });

    socket.on("disconnect", () => {
        console.log("disconnected:", socket.id);

        for (const room of rooms.values()) {
            const index = room.players.findIndex((p) => p.socketId === socket.id);
            if (index === -1) continue;

            const [removed] = room.players.splice(index, 1);

            if (room.players.length === 0) {
                deleteRoom(room.code);
                return;
            }

            if (removed?.id === room.hostId) {
                room.hostId = room.players[0]?.id ?? "";
            }

            io.to(room.code).emit("room:playerDisconnect", room);

            // Someone leaving may mean everyone left has already acted
            checkAnsweringComplete(room);
            checkVotingComplete(room);
            return;
        }
    });
}