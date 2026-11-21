import { describe, expect, it } from "vitest";
import {
    canVote,
    countVotes,
    draftsToAnswers,
    everyoneAnswered,
    everyoneVoted,
    optionsFor,
    shuffle,
} from "./logic";
import type { Answer, Player } from "./type";

// Small factories keep each test short and readable
const player = (id: string): Player => ({
    id,
    name: id.toUpperCase(),
    socketId: `socket-${id}`,
    score: 0,
});
const answer = (id: string, playerId: string, text = `answer ${id}`): Answer => ({
    id,
    playerId,
    text,
});
const byId = (x: { id: string }, y: { id: string }) => x.id.localeCompare(y.id);

describe("shuffle", () => {
    it("keeps the same items", () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        expect([...shuffle(input)].sort((a, b) => a - b)).toEqual(input);
    });

    it("does not change the original array", () => {
        const input = [1, 2, 3, 4, 5];
        shuffle(input);
        expect(input).toEqual([1, 2, 3, 4, 5]);
    });

    it("handles empty and single-item arrays", () => {
        expect(shuffle([])).toEqual([]);
        expect(shuffle(["only"])).toEqual(["only"]);
    });
});

describe("canVote", () => {
    it("is true when someone else has an answer", () => {
        expect(canVote([answer("1", "a"), answer("2", "b")], "a")).toBe(true);
    });

    it("is false when the only answer is your own", () => {
        expect(canVote([answer("1", "a")], "a")).toBe(false);
    });

    it("is false when there are no answers", () => {
        expect(canVote([], "a")).toBe(false);
    });
});

describe("everyoneAnswered", () => {
    const players = [player("a"), player("b"), player("c")];

    it("is true when every player has an answer", () => {
        const list = [answer("1", "a"), answer("2", "b"), answer("3", "c")];
        expect(everyoneAnswered(players, list)).toBe(true);
    });

    // Regression: the arrays were once the wrong way round, so one answer ended the phase
    it("is false when only one of three players has answered", () => {
        expect(everyoneAnswered(players, [answer("1", "a")])).toBe(false);
    });

    it("only waits for players who are still in the room", () => {
        // b left after answering; a and c have answered, so the phase is done
        const remaining = [player("a"), player("c")];
        const list = [answer("1", "a"), answer("2", "b"), answer("3", "c")];
        expect(everyoneAnswered(remaining, list)).toBe(true);
    });
});

describe("everyoneVoted", () => {
    const players = [player("a"), player("b"), player("c")];
    const onlyAAnswered = [answer("1", "a")];

    it("only waits for players who have something to vote on", () => {
        // a wrote the only answer, so a can't vote; b and c are the voters
        const votes = new Map([
            ["b", "1"],
            ["c", "1"],
        ]);
        expect(everyoneVoted(players, onlyAAnswered, votes)).toBe(true);
    });

    it("is false while an eligible voter hasn't voted", () => {
        const votes = new Map([["b", "1"]]);
        expect(everyoneVoted(players, onlyAAnswered, votes)).toBe(false);
    });

    it("is true straight away when nobody can vote", () => {
        // a lone player whose only option would be their own answer
        expect(everyoneVoted([player("a")], onlyAAnswered, new Map())).toBe(true);
    });
});

describe("countVotes", () => {
    it("counts votes per answer", () => {
        const votes = new Map([
            ["a", "x"],
            ["b", "x"],
            ["c", "y"],
        ]);
        const tally = countVotes(votes);
        expect(tally.get("x")).toBe(2);
        expect(tally.get("y")).toBe(1);
        expect(tally.get("z")).toBeUndefined();
    });

    it("returns an empty tally when nobody voted", () => {
        expect(countVotes(new Map()).size).toBe(0);
    });
});

describe("draftsToAnswers", () => {
    const players = [player("a"), player("b"), player("c")];

    it("turns a typed-but-unsubmitted draft into an answer", () => {
        const drafts = new Map([["b", "typed text"]]);
        const result = draftsToAnswers(players, [answer("1", "a")], drafts);
        expect(result).toEqual([
            { id: expect.any(String), playerId: "b", text: "typed text" },
        ]);
    });

    it("ignores drafts from players who already submitted", () => {
        const drafts = new Map([["a", "stale draft"]]);
        expect(draftsToAnswers(players, [answer("1", "a")], drafts)).toEqual([]);
    });

    it("skips players with no draft", () => {
        const drafts = new Map([["b", "typed"]]);
        const result = draftsToAnswers(players, [], drafts);
        expect(result.map((r) => r.playerId)).toEqual(["b"]);
    });

    it("copes with a missing drafts map", () => {
        expect(draftsToAnswers(players, [], undefined)).toEqual([]);
    });
});

describe("optionsFor", () => {
    const list = [answer("1", "a"), answer("2", "b"), answer("3", "c")];

    it("excludes the player's own answer", () => {
        const options = optionsFor(list, "a").sort(byId);
        expect(options.map((o) => o.id)).toEqual(["2", "3"]);
    });

    it("never exposes who wrote an answer", () => {
        for (const option of optionsFor(list, "a")) {
            expect(Object.keys(option).sort()).toEqual(["id", "text"]);
        }
    });

    it("returns nothing when the player has no one else to vote for", () => {
        expect(optionsFor([answer("1", "a")], "a")).toEqual([]);
    });
});