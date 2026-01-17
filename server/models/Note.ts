import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  content: {
    type: String,
    default: "",
  },
  updatedAt: {
    type: Number,
    required: true,
  },
  deletedAt: {
    timestamps: false,
    versionKey: false,
  },
});

export const NoteMode = mongoose.model("Note", NoteSchema);
