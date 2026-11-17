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

io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("createRoom", (data: { playerId: string; name: string }) => {
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
        let player: Player | undefined = room.players.find((p) => p.id === data.playerId);
        if (player)
            player.socketId = socket.id
        else {
            player = {
                id: data.playerId,
                name: data.name,
                socketId: socket.id,
                score: 0,
            };
            room.players.push(player)
        }

        rooms.set(room.code, room)

        socket.join(room.code);

        // Everyone in the room sees the updated lobby:
        io.to(room.code).emit("room:state", room);
    });
});

httpServer.listen(4000, () => console.log("server on :4000"));