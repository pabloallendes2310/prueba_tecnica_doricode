import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
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
    isDeleted: {
      type: Boolean,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    _id: true,
  },
);

export const NoteModel = mongoose.model("Note", NoteSchema);
