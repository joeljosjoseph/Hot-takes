export const ANSWER_SECONDS = 30;
export const TOTAL_ROUNDS = 3;
export const POINTS_PER_VOTE = 100;
export const MAX_ANSWER_LENGTH = 100;
export const MAX_NAME_LENGTH = 16;
export const MIN_PLAYERS = 2;

// Read from the environment so deployment doesn't need code changes
export const PORT = Number(process.env.PORT) || 4000;
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";