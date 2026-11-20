import type { Socket } from "socket.io";
import { randomUUID } from "crypto";
import { rooms, answers, drafts } from "../state";
import { MAX_ANSWER_LENGTH } from "../config";
import { findSender } from "../rooms";
import { checkAnsweringComplete } from "../game";

export function registerAnsweringHandlers(socket: Socket) {
    socket.on("answer:submit", (data: { code: string; text: string }) => {
        const room = rooms.get(data?.code);
        if (!room) {
            socket.emit("error:game", "Room not found");
            return;
        }

        const sender = findSender(room, socket.id);
        if (!sender) {
            socket.emit("error:game", "You're not in this room");
            return;
        }

        if (room.phase !== "ANSWERING") {
            socket.emit("error:game", "Not accepting answers right now");
            return;
        }

        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (text.length === 0 || text.length > MAX_ANSWER_LENGTH) {
            socket.emit("error:game", `Answer must be 1-${MAX_ANSWER_LENGTH} characters`);
            return;
        }

        const list = answers.get(room.code) ?? [];
        if (list.some((a) => a.playerId === sender.id)) {
            socket.emit("error:game", "Only one submission per player");
            return;
        }

        list.push({ id: randomUUID(), playerId: sender.id, text });
        answers.set(room.code, list);
        socket.emit("answer:accepted");

        checkAnsweringComplete(room);
    });

    // Fires on every keystroke, so bad input is ignored quietly
    socket.on("answer:draft", (data: { code: string; text: string }) => {
        const room = rooms.get(data?.code);
        if (!room || room.phase !== "ANSWERING") return;

        const sender = findSender(room, socket.id);
        if (!sender) return;

        const roomDrafts = drafts.get(room.code);
        if (!roomDrafts) return;

        const list = answers.get(room.code) ?? [];
        if (list.some((a) => a.playerId === sender.id)) return;   // already submitted

        const text =
            typeof data.text === "string" ? data.text.trim().slice(0, MAX_ANSWER_LENGTH) : "";

        if (text.length === 0) {
            roomDrafts.delete(sender.id);
        } else {
            roomDrafts.set(sender.id, text);
        }
    });
}