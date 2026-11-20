export type Player = {
    id: string;        // stable ID generated, survives page refreshes
    name: string;      // what the lobby displays
    socketId: string;  // current connection; changes on every reconnect
    score: number;
};

export type Phase = "LOBBY" | "ANSWERING" | "VOTING" | "RESULTS";

export type Answer = { id: string; playerId: string; text: string };

export type Room = {
    code: string;      // eg: "ABCD", the code players type to join
    hostId: string;    // which player's screen controls the game
    players: Player[];
    phase: Phase;
    phaseEndsAt: number | null
    prompt: string | null
};


