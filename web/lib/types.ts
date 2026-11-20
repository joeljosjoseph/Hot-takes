export type Phase = "LOBBY" | "ANSWERING" | "VOTING" | "RESULTS" | "GAME_OVER";

export type Option = { id: string; text: string };

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
    phaseDurationMs: number | null
    phaseEndsAt: number | null
    prompt: string | null
    round: number;
    totalRounds: number;
};

export type AnswerResult = { text: string; authorName: string; votes: number };