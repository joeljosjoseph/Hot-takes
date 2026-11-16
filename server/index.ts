import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "http://localhost:3000" } });

io.on("connection", (socket) => {
    console.log("connected:", socket.id);
    // TODO: log when this socket disconnects
    () => {
        console.log("disconnected:", socket.id);
    }
});

httpServer.listen(4000, () => console.log("server on :4000"));