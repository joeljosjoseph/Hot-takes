import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { Player, Room } from "./type";
import generateCode from "./roomCode";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "http://localhost:3000" } });

const rooms = new Map<string, Room>();

function createUniqueCode(): string {
    let code = generateCode();
    if (rooms.has(code))
        code = createUniqueCode();
    return code;
}

function addOrUpdatePlayer(room: Room, playerId: string, name: string, socketId: string): Player {
    const existing = room.players.find((p) => p.id === playerId);
    if (existing) {
        existing.socketId = socketId;
        return existing;
    }
    const player: Player = { id: playerId, name, socketId, score: 0 };
    room.players.push(player);
    return player;
}

io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("createRoom", (data: { playerId: string; name: string }) => {

        //Check if a room with hostId already exists
        const existing = [...rooms.values()].find((r) => r.hostId === data.playerId);

        if (existing) {
            addOrUpdatePlayer(existing, data.playerId, data.name, socket.id);   // which three values from `data` and `socket`?
            socket.join(existing.code);
            io.to(existing.code).emit("room:state", existing);
            return;
        }

        const code = createUniqueCode();

        const host: Player = {
            id: data.playerId,
            name: data.name,
            socketId: socket.id,
            score: 0,
        };

        const room: Room = {
            code,
            hostId: data.playerId,
            players: [host],
        };

        rooms.set(code, room);
        socket.join(code);
        socket.emit("room:state", room);
    });

    socket.on("disconnect", () => {
        console.log("disconnected:", socket.id);
    });

    socket.on("joinRoom", (data: { code: string; playerId: string; name: string }) => {
        let room = rooms.get(data.code);

        //If room ID doesn't exists
        if (!room) {
            socket.emit("error:join", "Room not found")
            return;
        }

        //If player already joined previously
        addOrUpdatePlayer(room, data.playerId, data.name, socket.id);

        socket.join(room.code);

        // Everyone in the room sees the updated lobby:
        io.to(room.code).emit("room:state", room);
    });
});

httpServer.listen(4000, () => console.log("server on :4000"));