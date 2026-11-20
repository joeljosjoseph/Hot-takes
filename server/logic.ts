import { randomUUID } from "crypto";
import type { Answer, Player } from "./type";

export type Option = { id: string; text: string };

export function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
}

// Has at least one answer that isn't their own
export function canVote(answerList: Answer[], playerId: string): boolean {
    return answerList.some((a) => a.playerId !== playerId);
}

export function everyoneAnswered(players: Player[], answerList: Answer[]): boolean {
    return players.every((p) => answerList.some((a) => a.playerId === p.id));
}

// Only players who actually have something to vote on are waited for
export function everyoneVoted(
    players: Player[],
    answerList: Answer[],
    roomVotes: Map<string, string>
): boolean {
    return players
        .filter((p) => canVote(answerList, p.id))
        .every((p) => roomVotes.has(p.id));
}

// answerId -> number of votes
export function countVotes(roomVotes: Map<string, string>): Map<string, number> {
    const tally = new Map<string, number>();
    for (const answerId of roomVotes.values()) {
        tally.set(answerId, (tally.get(answerId) ?? 0) + 1);
    }
    return tally;
}

// Typed-but-unsubmitted drafts become answers (only for players with no answer yet)
export function draftsToAnswers(
    players: Player[],
    answerList: Answer[],
    roomDrafts: Map<string, string> | undefined
): Answer[] {
    const extra: Answer[] = [];
    for (const p of players) {
        const hasAnswer = answerList.some((a) => a.playerId === p.id);
        const draft = roomDrafts?.get(p.id);
        if (!hasAnswer && draft) {
            extra.push({ id: randomUUID(), playerId: p.id, text: draft });
        }
    }
    return extra;
}

// What one player sees while voting: no authors, not their own, shuffled
export function optionsFor(answerList: Answer[], playerId: string): Option[] {
    return shuffle(
        answerList
            .filter((a) => a.playerId !== playerId)
            .map((a) => ({ id: a.id, text: a.text }))
    );
}