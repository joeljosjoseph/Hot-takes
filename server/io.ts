import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { CLIENT_ORIGINS } from "./config";

export const app = express();
export const httpServer = createServer(app);
export const io = new Server(httpServer, { cors: { origin: CLIENT_ORIGINS } });

