import { io } from "./io";
import { rooms, answers, drafts, votes } from "./state";
import { startTimer, stopTimer } from "./timer";
import { generatePrompt } from "./prompts";
import { ANSWER_SECONDS, POINTS_PER_VOTE } from "./config";
import {
    countVotes,
    draftsToAnswers,
    everyoneAnswered,
    everyoneVoted,
    optionsFor,
} from "./logic";
import type { Room } from "./type";

export function startAnswering(room: Room) {
    room.phase = "ANSWERING";
    room.prompt = generatePrompt();
    room.phaseEndsAt = Date.now() + ANSWER_SECONDS * 1000;   // point in time, for clients
    room.phaseDurationMs = ANSWER_SECONDS * 1000
    room.round += 1;
    answers.set(room.code, []);
    drafts.set(room.code, new Map());
    startTimer(room.code, ANSWER_SECONDS * 1000, () => endAnswering(room.code));
    io.to(room.code).emit("room:state", room);
}

export function endAnswering(code: string) {
    const room = rooms.get(code);
    if (!room || room.phase !== "ANSWERING") return;
    stopTimer(code);

    const list = answers.get(code) ?? [];
    list.push(...draftsToAnswers(room.players, list, drafts.get(code)));
    answers.set(code, list);
    drafts.delete(code);

    room.phase = "VOTING";
    room.phaseEndsAt = null;
    votes.set(code, new Map());

    io.to(code).emit("room:state", room);
    for (const player of room.players) {
        io.to(player.socketId).emit("voting:options", optionsFor(list, player.id));
    }

    checkVotingComplete(room);   // nobody eligible to vote? skip straight to results
}

export function endVoting(code: string) {
    const room = rooms.get(code);
    if (!room || room.phase !== "VOTING") return;

    const list = answers.get(code) ?? [];
    const tally = countVotes(votes.get(code) ?? new Map());

    const results: { text: string; authorName: string; votes: number }[] = [];
    for (const a of list) {
        const count = tally.get(a.id) ?? 0;
        const author = room.players.find((p) => p.id === a.playerId);
        if (author) author.score += count * POINTS_PER_VOTE;
        results.push({
            text: a.text,
            authorName: author?.name ?? "(left the game)",
            votes: count,
        });
    }
    results.sort((a, b) => b.votes - a.votes);

    room.phase = "RESULTS";
    room.phaseEndsAt = null;
    io.to(code).emit("room:results", results);   // results first, so the screen is never empty
    io.to(code).emit("room:state", room);
}

export function advanceFromResults(room: Room) {
    if (room.round >= room.totalRounds) {
        room.phase = "GAME_OVER";
        io.to(room.code).emit("room:state", room);
    } else {
        startAnswering(room);
    }
}

export function resetToLobby(room: Room) {
    stopTimer(room.code);
    room.phase = "LOBBY";
    room.round = 0;
    room.prompt = null;
    room.phaseEndsAt = null;
    room.phaseDurationMs = null;
    for (const p of room.players) p.score = 0;
    answers.delete(room.code);
    drafts.delete(room.code);
    votes.delete(room.code);
    io.to(room.code).emit("room:state", room);
}

// Called after anything that might complete a phase early
export function checkAnsweringComplete(room: Room) {
    if (room.phase !== "ANSWERING") return;
    if (everyoneAnswered(room.players, answers.get(room.code) ?? [])) {
        endAnswering(room.code);
    }
}

export function checkVotingComplete(room: Room) {
    if (room.phase !== "VOTING") return;
    const roomVotes = votes.get(room.code);
    if (!roomVotes) return;
    if (everyoneVoted(room.players, answers.get(room.code) ?? [], roomVotes)) {
        endVoting(room.code);
    }
}