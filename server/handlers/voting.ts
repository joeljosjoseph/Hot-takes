import type { Socket } from "socket.io";
import { rooms, answers, votes } from "../state";
import { findSender } from "../rooms";
import { checkVotingComplete } from "../game";

export function registerVotingHandlers(socket: Socket) {
    socket.on("vote:submit", (data: { code: string; answerId: string }) => {
        const room = rooms.get(data?.code);
        if (!room || room.phase !== "VOTING") return;

        const sender = findSender(room, socket.id);
        if (!sender) return;

        if (typeof data.answerId !== "string") return;
        const answer = (answers.get(room.code) ?? []).find((a) => a.id === data.answerId);
        if (!answer) return;

        if (answer.playerId === sender.id) {
            socket.emit("error:game", "You can't vote for your own answer");
            return;
        }

        const roomVotes = votes.get(room.code);
        if (!roomVotes) return;
        if (roomVotes.has(sender.id)) {
            socket.emit("error:game", "You already voted");
            return;
        }

        roomVotes.set(sender.id, answer.id);
        socket.emit("vote:accepted");

        checkVotingComplete(room);
    });
}