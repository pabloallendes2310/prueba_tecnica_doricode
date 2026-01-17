import { useEffect, useState } from "react";

import { v4 as uuidv4 } from "uuid";
import { socket } from "../socket";
import type { Note } from "../types";
export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const saved = localStorage.getItem("notes-offline");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (error) {
        console.error("error al leer el cache local", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("notes-offline", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log("conectado");

      const localData = JSON.parse(
        localStorage.getItem("notes-offline") || "[]",
      );
      if (localData.length > 0) {
        socket.emit("sync_notes", localData);
      }
    }
    function onDisconnect() {
      setIsConnected(false);
      console.log("desconectado");
    }

    function onServerUpdate(serverNotes: Note[]) {
      setNotes(serverNotes);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("server_update", onServerUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("server_update", onServerUpdate);
    };
  }, []);

  const addNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      content: "",
      updatedAt: Date.now(),
      isDeleted: false,
    };
    const updatedNotes = [...notes, newNote];

    setNotes(updatedNotes);

    if (socket.connected) socket.emit("sync_notes", updatedNotes);
  };

  const updateNote = (id: string, newContent: string) => {
    const updatedNotes = notes.map((n) =>
      n.id === id ? { ...n, content: newContent, updatedAt: Date.now() } : n,
    );
    setNotes(updatedNotes);
    if (socket.connected) socket.emit("sync_notes", updatedNotes);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.map((n) =>
      n.id === id ? { ...n, isDeleted: true, updatedAt: Date.now() } : n,
    );
    setNotes(updatedNotes);
    if (socket.connected) socket.emit("sync_notes", updatedNotes);
  };

  return {
    notes: notes.filter((n) => !n.isDeleted),
    isConnected,
    addNote,
    updateNote,
    deleteNote,
  };
};
