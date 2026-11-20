import type { Answer, Room } from "./type";
import { stopTimer } from "./timer";

export const rooms = new Map<string, Room>();
export const answers = new Map<string, Answer[]>();
export const drafts = new Map<string, Map<string, string>>();
export const votes = new Map<string, Map<string, string>>();

// One place that knows everything a room owns, so nothing leaks
export function deleteRoom(code: string) {
    stopTimer(code);
    rooms.delete(code);
    answers.delete(code);
    drafts.delete(code);
    votes.delete(code);
}