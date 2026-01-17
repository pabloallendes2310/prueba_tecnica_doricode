export interface Note {
  id: string;
  content: string;
  updatedAt: number;
  isDeleted: boolean;
}

export interface ServerToClientEvents {
  server_update: (notes: Note[]) => void;
}

export interface ClientToServerEvents {
  sync_notes: (notes: Note[]) => void;
}
