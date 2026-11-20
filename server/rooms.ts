import type { Player, Room } from "./type";
import generateCode from "./roomCode";
import { rooms } from "./state";
import { MAX_NAME_LENGTH } from "./config";

export function createUniqueCode(): string {
    let code = generateCode();
    while (rooms.has(code)) code = generateCode();   // loop instead of recursion
    return code;
}

export function addOrUpdatePlayer(
    room: Room,
    playerId: string,
    name: string,
    socketId: string
): Player {
    const existing = room.players.find((p) => p.id === playerId);
    if (existing) {
        existing.socketId = socketId;
        return existing;
    }
    const player: Player = { id: playerId, name, socketId, score: 0 };
    room.players.push(player);
    return player;
}

// The sender is identified by the socket, never by anything in the payload
export function findSender(room: Room, socketId: string): Player | undefined {
    return room.players.find((p) => p.socketId === socketId);
}

export function cleanName(value: unknown): string {
    return typeof value === "string" ? value.trim().slice(0, MAX_NAME_LENGTH) : "";
}