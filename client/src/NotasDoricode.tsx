import { useNotes } from "./hooks/useNotes";
import "./index.css";
function NotasDoricode() {
  // Extraemos la lógica y el estado de nuestro Hook personalizado
  const { notes, isConnected, addNote, updateNote, deleteNote } = useNotes();

  return (
    <div className="app-container">
      <header className="header">
        <h1>Notas Doricode</h1>

        {/* REQUERIMIENTO: Indicador visual de conexión */}
        <div className={`status-badge ${isConnected ? "online" : "offline"}`}>
          {isConnected ? "Conectado (Sincronizado)" : "Desconectado (Local)"}
        </div>
      </header>

      <main>
        <button className="btn-add" onClick={addNote}>
          + Nueva Nota
        </button>

        <div className="notes-grid">
          {notes.length === 0 && (
            <p className="empty-msg">No hay notas. ¡Crea una para empezar!</p>
          )}

          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <textarea
                value={note.content}
                onChange={(e) => updateNote(note.id, e.target.value)}
                placeholder="Escribe aquí..."
                spellCheck="false"
              />
              <div className="card-footer">
                <span className="timestamp">
                  {new Date(note.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  className="btn-delete"
                  onClick={() => deleteNote(note.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default NotasDoricode;
