import { io } from "./io";
import { registerLobbyHandlers } from "./handlers/lobby";
import { registerGameHandlers } from "./handlers/game";
import { registerAnsweringHandlers } from "./handlers/answering";
import { registerVotingHandlers } from "./handlers/voting";

let wired = false;

export function wireHandlers() {
    if (wired) return;
    wired = true;
    io.on("connection", (socket) => {
        console.log("connected:", socket.id);
        registerLobbyHandlers(socket);
        registerGameHandlers(socket);
        registerAnsweringHandlers(socket);
        registerVotingHandlers(socket);
    });
}