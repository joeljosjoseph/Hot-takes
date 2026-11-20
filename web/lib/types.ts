export type Phase = "LOBBY" | "ANSWERING" | "VOTING" | "RESULTS";

export type Player = {
    id: string;
    name: string;
    socketId: string;
    score: number
};

export type Room = {
    code: string;
    hostId: string;
    players: Player[];
    phase: Phase;
    phaseEndsAt: number | null
    prompt: string | null
};

export type AnswerResult = { text: string; authorName: string; votes: number };