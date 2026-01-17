import express from "express";
import dotenv from "dotenv";

import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("mongo conectado"))
  .catch((err) => console.error("error mongo:", err));
