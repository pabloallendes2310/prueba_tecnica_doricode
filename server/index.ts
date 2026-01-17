import express from "express";
import dotenv from "dotenv";

import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { ClientToServerEvents, ServerToClientEvents } from "./types";
import { NoteModel } from "./models/Note";

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

// Initial Load al conectarse
io.on("connection", (socket) => {
  console.log(`cliente conectado en: ${socket.id}`);
  // Transformacion de datos
  NoteModel.find({}).then((notes) => {
    const cleanNotes = notes.map((n: any) => ({
      id: n.id,
      content: n.content,
      updatedAt: n.updatedAt,
      isDeleted: n.isDeleted,
    }));
    socket.emit("server_update", cleanNotes);
  });
  // Sincronizacion
  socket.on("sync_notes", async (incomingNotes) => {
    console.log(`recibiendo ${incomingNotes.length} en el socket:${socket.id}`);
    if (incomingNotes.length === 0) return;

    const operations = incomingNotes.map((note) => ({
      updateOne: {
        filter: { id: note.id },
        update: [
          {
            $set: {
              content: {
                $cond: {
                  if: { $gt: [note.updatedAt, "$updatedAt"] },
                  then: note.content,
                  else: "$content",
                },
              },
              isDeleted: {
                $cond: {
                  if: { $gt: [note.updatedAt, "$updatedAt"] },
                  then: note.isDeleted,
                  else: "$isDeleted",
                },
              },
              updatedAt: {
                $cond: {
                  if: { $gt: [note.updatedAt, "$updatedAt"] },
                  then: note.updatedAt,
                  else: "$updatedAt",
                },
              },
              id: note.id,
            },
          },
        ],
        upsert: true,
      },
    }));
    try {
      await NoteModel.bulkWrite(operations);
      const finalNotes = await NoteModel.find({});
      const cleanNotes = finalNotes.map((n: any) => ({
        id: n.id,
        content: n.content,
        updatedAt: n.updatedAt,
        isDeleted: n.isDeleted,
      }));

      io.emit("server_update", cleanNotes);
    } catch (error) {
      console.error("Error de sincronizacion", error);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`server en puerto ${PORT}`));
