import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { Answer, Player, Room } from "./type";
import generateCode from "./roomCode";
import { startTimer, stopTimer } from "./timer";
import { generatePrompt } from "./prompts";
import { randomUUID } from "crypto";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "http://localhost:3000" } });

//Max seconds for answering phase
const ANSWER_SECONDS = 30

const rooms = new Map<string, Room>();
const answers = new Map<string, Answer[]>();
const drafts = new Map<string, Map<string, string>>();

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

function startAnswering(room: Room) {
    room.phase = "ANSWERING";
    room.prompt = generatePrompt();
    room.phaseEndsAt = Date.now() + ANSWER_SECONDS * 1000;     // point in time, for clients
    startTimer(room.code, ANSWER_SECONDS * 1000, () => endAnswering(room.code));   // duration
    io.to(room.code).emit("room:state", room);
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
}

function endAnswering(code: string) {
    const room = rooms.get(code);
    if (!room || room.phase !== "ANSWERING") return;
    stopTimer(code);

    let list = answers.get(code) ?? [];
    const roomDrafts = drafts.get(code);

    for (const player of room.players) {
        const hasAnswer = list.some((a) => a.playerId === player.id);
        const draft = roomDrafts?.get(player.id);
        if (!hasAnswer && draft) {
            list.push({ id: randomUUID(), playerId: player.id, text: draft });
        }
    }
    answers.set(code, list);

    drafts.delete(code);
    room.phase = "VOTING";
    room.phaseEndsAt = null;
    io.to(code).emit("room:state", room);

    for (const player of room.players) {
        const options = shuffle(
            list
                .filter((a) => a.playerId !== player.id)
                .map((a) => ({ id: a.id, text: a.text }))
        );
        io.to(player.socketId).emit("voting:options", options);
    }
}

function everyoneAnswered(room: Room): boolean {
    const list = answers.get(room.code) ?? [];
    return room.players.every((p) => list.some((a) => a.playerId === p.id));
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
            phase: "LOBBY",
            phaseEndsAt: null,
            prompt: null
        };

        rooms.set(code, room);
        socket.join(code);
        socket.emit("room:state", room);
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

    socket.on("game:start", (data: { code: string }) => {
        const room = rooms.get(data.code);
        if (!room) {
            socket.emit("error:game", "Room not found");
            return;
        }

        const sender = room.players.find((p) => p.socketId === socket.id);
        if (!sender || sender.id !== room.hostId) {
            socket.emit("error:game", "Only the host can start the game");
            return;
        }

        if (room.phase !== "LOBBY") {
            socket.emit("error:game", "Game already started");
            return;
        }

        if (room.players.length < 2) {
            socket.emit("error:game", "Need at least 2 players");
            return;
        }

        room.phase = "ANSWERING";
        startAnswering(room)
        io.to(room.code).emit("room:state", room);
    });

    socket.on("answer:submit", (data: { code: string; text: string }) => {
        const room = rooms.get(data.code);
        if (!room) {
            socket.emit("error:game", "Room not found");
            return;
        }

        const sender = room.players.find((p) => p.socketId === socket.id);
        if (!sender) {
            socket.emit("error:game", "You're not in this room");
            return;
        }

        if (room.phase !== "ANSWERING") {
            socket.emit("error:game", "Not accepting answers right now");
            return;
        }


        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (text.length === 0 || text.length > 100) {
            socket.emit("error:game", "Answer must be 1-100 characters");
            return;
        }

        const list = answers.get(room.code) ?? [];
        const alreadyAnswered = list.some((o) => o.playerId === sender.id)

        if (alreadyAnswered) {
            socket.emit("error:game", "Only one submission per player");
            return;
        }
        list.push({ id: randomUUID(), playerId: sender.id, text });
        answers.set(room.code, list);

        socket.emit("answer:accepted");

        if (everyoneAnswered(room)) {
            endAnswering(room.code)
        }
    });

    socket.on("answer:draft", (data: { code: string; text: string }) => {
        const room = rooms.get(data.code);
        if (!room || room.phase !== "ANSWERING") return;

        const sender = room.players.find((p) => p.socketId === socket.id);
        if (!sender) return;

        const roomDrafts = drafts.get(room.code);
        if (!roomDrafts) return;

        // Already submitted: draft isn't needed anymore
        const list = answers.get(room.code) ?? [];
        if (list.some((a) => a.playerId === sender.id)) return;

        const text = typeof data.text === "string" ? data.text.trim().slice(0, 100) : "";

        if (text.length === 0) {
            roomDrafts.delete(sender.id);    // player cleared input; no draft
        } else {
            roomDrafts.set(sender.id, text);
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected:", socket.id);

        for (const room of rooms.values()) {
            const index = room.players.findIndex((p) => p.socketId === socket.id);
            if (index === -1) continue;

            const [removed] = room.players.splice(index, 1);   // returns the removed items

            if (room.players.length === 0) {
                stopTimer(room.code);
                answers.delete(room.code);
                rooms.delete(room.code);
                return;
            }
            if (removed?.id === room.hostId) {
                room.hostId = room.players[0]?.id || ""
            }

            io.to(room.code).emit("room:playerDisconnect", room);

            //If player leaves, check for phase...if left player was last to submit then end phase
            if (room.phase === "ANSWERING" && everyoneAnswered(room)) {
                endAnswering(room.code);
            }

            return;
        }
    });

});

httpServer.listen(4000, () => console.log("server on :4000"));