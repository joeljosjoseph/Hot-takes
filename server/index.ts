import { httpServer, io } from "./io";
import { PORT } from "./config";
import { registerLobbyHandlers } from "./handlers/lobby";
import { registerGameHandlers } from "./handlers/game";
import { registerAnsweringHandlers } from "./handlers/answering";
import { registerVotingHandlers } from "./handlers/voting";

io.on("connection", (socket) => {
    console.log("connected:", socket.id);
    registerLobbyHandlers(socket);
    registerGameHandlers(socket);
    registerAnsweringHandlers(socket);
    registerVotingHandlers(socket);
});

httpServer.listen(PORT, () => console.log(`server on :${PORT}`));