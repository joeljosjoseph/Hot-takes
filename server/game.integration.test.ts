import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "net";
import { io as connectClient, type Socket } from "socket.io-client";
import { httpServer, io } from "./io";
import { wireHandlers } from "./setup";
import type { Option } from "./logic";
import type { Room } from "./type";

type Result = { text: string; authorName: string; votes: number };
type Client = { name: string; id: string; socket: Socket };

let port = 0;
const open: Socket[] = [];

beforeAll(async () => {
    wireHandlers();
    await new Promise<void>((resolve) => httpServer.listen(0, resolve)); // 0 = any free port
    port = (httpServer.address() as AddressInfo).port;
});

afterEach(() => {
    for (const s of open) s.disconnect();
    open.length = 0;
});

afterAll(async () => {
    await new Promise<void>((resolve) => io.close(() => resolve()));
});

// ---------- helpers ----------

function connect(): Promise<Socket> {
    const socket = connectClient(`http://localhost:${port}`, {
        transports: ["websocket"],
        forceNew: true,
    });
    open.push(socket);
    return new Promise((resolve, reject) => {
        socket.on("connect", () => resolve(socket));
        socket.on("connect_error", reject);
    });
}

// Resolves with the first event that matches. Always create the waiter BEFORE
// emitting, or the reply can arrive before anyone is listening.
function waitFor<T>(
    socket: Socket,
    event: string,
    predicate: (data: T) => boolean = () => true,
    ms = 4000
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, handler);
            reject(new Error(`timed out waiting for "${event}"`));
        }, ms);
        const handler = (data: T) => {
            if (!predicate(data)) return;
            clearTimeout(timer);
            socket.off(event, handler);
            resolve(data);
        };
        socket.on(event, handler);
    });
}

// Creates a room and joins everyone. The first name is the host.
async function newGame(names: string[]) {
    const clients: Client[] = [];
    for (const name of names) {
        clients.push({ name, id: name.toLowerCase(), socket: await connect() });
    }

    const host = clients[0]!;
    const created = waitFor<Room>(host.socket, "room:state");
    host.socket.emit("createRoom", { playerId: host.id, name: host.name });
    const { code } = await created;

    for (const [i, c] of clients.slice(1).entries()) {
        const joined = waitFor<Room>(c.socket, "room:state", (r) => r.players.length === i + 2);
        c.socket.emit("joinRoom", { code, playerId: c.id, name: c.name });
        await joined;
    }
    return { clients, code };
}

// The host starts a game ("game:start") or moves on ("round:next")
async function advance(clients: Client[], code: string, event: string, round: number) {
    const started = clients.map((c) =>
        waitFor<Room>(c.socket, "room:state", (r) => r.phase === "ANSWERING" && r.round === round)
    );
    clients[0]!.socket.emit(event, { code });
    await Promise.all(started);
}

// Everyone answers "<name>'s answer"; returns the voting options each player was sent
async function submitAnswers(clients: Client[], code: string): Promise<Option[][]> {
    const pending = clients.map((c) => waitFor<Option[]>(c.socket, "voting:options"));
    for (const c of clients) {
        c.socket.emit("answer:submit", { code, text: `${c.name}'s answer` });
    }
    return Promise.all(pending);
}

// A whole round: the second player's answer wins, and that player votes for the first
async function playRound(clients: Client[], code: string) {
    const options = await submitAnswers(clients, code);
    const host = clients[0]!;
    const winner = clients[1]!;

    const results = waitFor<Result[]>(host.socket, "room:results");
    const state = waitFor<Room>(host.socket, "room:state", (r) => r.phase === "RESULTS");

    clients.forEach((c, i) => {
        const target = c === winner ? host.name : winner.name;
        const choice = options[i]!.find((o) => o.text === `${target}'s answer`)!;
        c.socket.emit("vote:submit", { code, answerId: choice.id });
    });

    return { options, results: await results, state: await state };
}

const scoreOf = (room: Room, name: string) => room.players.find((p) => p.name === name)?.score;

// ---------- full games ----------

describe("full game", () => {
    it("plays a round: answers, anonymous voting, results and scores", async () => {
        const { clients, code } = await newGame(["Ann", "Bob", "Cy"]);
        await advance(clients, code, "game:start", 1);

        const { options, results, state } = await playRound(clients, code);

        // Voting was anonymous: only id + text, and never your own answer
        options.forEach((list, i) => {
            expect(list).toHaveLength(2);
            for (const option of list) {
                expect(Object.keys(option).sort()).toEqual(["id", "text"]);
                expect(option.text).not.toBe(`${clients[i]!.name}'s answer`);
            }
        });

        // Results are sorted, with authors revealed
        expect(results).toHaveLength(3);
        expect(results[0]).toEqual({ text: "Bob's answer", authorName: "Bob", votes: 2 });
        expect(results.find((r) => r.authorName === "Ann")?.votes).toBe(1);
        expect(results.find((r) => r.authorName === "Cy")?.votes).toBe(0);

        // 100 points per vote
        expect(scoreOf(state, "Bob")).toBe(200);
        expect(scoreOf(state, "Ann")).toBe(100);
        expect(scoreOf(state, "Cy")).toBe(0);
    });

    it("plays three rounds, ends the game, and resets on play again", async () => {
        const { clients, code } = await newGame(["Ann", "Bob", "Cy"]);
        const host = clients[0]!;

        await advance(clients, code, "game:start", 1);
        for (let round = 1; round <= 3; round++) {
            if (round > 1) await advance(clients, code, "round:next", round);
            const { state } = await playRound(clients, code);
            expect(state.round).toBe(round);
        }

        const over = waitFor<Room>(host.socket, "room:state", (r) => r.phase === "GAME_OVER");
        host.socket.emit("round:next", { code });
        const final = await over;
        expect(scoreOf(final, "Bob")).toBe(600);
        expect(scoreOf(final, "Ann")).toBe(300);
        expect(scoreOf(final, "Cy")).toBe(0);

        const lobby = waitFor<Room>(host.socket, "room:state", (r) => r.phase === "LOBBY");
        host.socket.emit("game:playAgain", { code });
        const reset = await lobby;
        expect(reset.round).toBe(0);
        expect(reset.players.every((p) => p.score === 0)).toBe(true);
    });
});

// ---------- rules ----------

describe("rules", () => {
    it("rejects joining a room that doesn't exist", async () => {
        const bob = await connect();
        const error = waitFor<string>(bob, "error:join");
        bob.emit("joinRoom", { code: "ZZZZ", playerId: "bob", name: "Bob" });
        expect(await error).toBe("Room not found");
    });

    it("only lets the host start, and only with two players", async () => {
        const solo = await newGame(["Ann"]);
        const tooFew = waitFor<string>(solo.clients[0]!.socket, "error:game");
        solo.clients[0]!.socket.emit("game:start", { code: solo.code });
        expect(await tooFew).toBe("Need at least 2 players");

        const { clients, code } = await newGame(["Cy", "Dee"]);
        const dee = clients[1]!;
        const notHost = waitFor<string>(dee.socket, "error:game");
        dee.socket.emit("game:start", { code });
        expect(await notHost).toBe("Only the host can start the game");
    });

    it("rejects a second vote", async () => {
        const { clients, code } = await newGame(["Ann", "Bob", "Cy"]);
        await advance(clients, code, "game:start", 1);
        const options = await submitAnswers(clients, code);

        const ann = clients[0]!;
        const choice = options[0]!.find((o) => o.text === "Bob's answer")!;

        const accepted = waitFor(ann.socket, "vote:accepted");
        ann.socket.emit("vote:submit", { code, answerId: choice.id });
        await accepted;

        const error = waitFor<string>(ann.socket, "error:game");
        ann.socket.emit("vote:submit", { code, answerId: choice.id });
        expect(await error).toBe("You already voted");
    });

    it("turns an unsent draft into an answer when time runs out", async () => {
        const { clients, code } = await newGame(["Ann", "Bob"]);
        const [ann, bob] = clients as [Client, Client];
        await advance(clients, code, "game:start", 1);

        const bobsOptions = waitFor<Option[]>(bob.socket, "voting:options", () => true, 6000);
        ann.socket.emit("answer:draft", { code, text: "typed but never sent" });
        bob.socket.emit("answer:submit", { code, text: "Bob's answer" });

        expect((await bobsOptions).map((o) => o.text)).toEqual(["typed but never sent"]);
    });

    it("promotes a new host when the host leaves", async () => {
        const { clients } = await newGame(["Ann", "Bob"]);
        const [ann, bob] = clients as [Client, Client];

        const left = waitFor<Room>(bob.socket, "room:playerDisconnect");
        ann.socket.disconnect();
        const room = await left;

        expect(room.hostId).toBe("bob");
        expect(room.players.map((p) => p.id)).toEqual(["bob"]);
    });
});