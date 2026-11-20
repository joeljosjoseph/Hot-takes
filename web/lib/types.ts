export type Phase = "LOBBY" | "ANSWERING" | "VOTING" | "RESULTS" | "GAME_OVER";

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
    round: number;
    totalRounds: number;
};

export type AnswerResult = { text: string; authorName: string; votes: number };