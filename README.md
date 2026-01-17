# Documentacion Tecnica - Sistema de Notas en Tiempo Real

## Descripcion del Proyecto

Sistema de notas colaborativas en tiempo real con sincronizacion bidireccional entre cliente y servidor. La aplicacion permite crear, editar y eliminar notas con persistencia local (LocalStorage) y sincronizacion automatica cuando hay conexion al servidor mediante WebSockets.

## Arquitectura del Sistema

### Stack Tecnologico

**Backend (Server)**

- Node.js con TypeScript
- Express.js para el servidor HTTP
- Socket.IO para comunicacion en tiempo real
- MongoDB con Mongoose para persistencia de datos
- dotenv para configuracion de variables de entorno

**Frontend (Client)**

- React 19 con TypeScript
- Vite como bundler y dev server
- Socket.IO Client para WebSockets
- UUID para generacion de identificadores unicos
- LocalStorage para cache offline

### Estructura del Proyecto

```
prueba_tecnica_doricode/
├── server/                 # Backend Node.js
│   ├── index.ts           # Punto de entrada del servidor
│   ├── types.ts           # Definiciones de tipos TypeScript
│   ├── package.json       # Dependencias del servidor
│   └── models/
│       └── Note.ts        # Modelo de datos Mongoose
│
└── client/                 # Frontend React
    ├── src/
    │   ├── main.tsx       # Punto de entrada React
    │   ├── NotasDoricode.tsx  # Componente principal
    │   ├── socket.ts      # Configuracion Socket.IO Client
    │   ├── types.ts       # Tipos compartidos
    │   └── hooks/
    │       └── useNotes.ts  # Hook personalizado para logica de notas
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

## Modelo de Datos

### Interfaz Note

```typescript
interface Note {
  id: string; // UUID v4 generado en cliente
  content: string; // Contenido de la nota
  updatedAt: number; // Timestamp (Date.now()) de ultima modificacion
  isDeleted: boolean; // Soft delete flag
}
```

### Schema MongoDB (Mongoose)

```typescript
{
  id: String (unique, indexed),
  content: String,
  updatedAt: Number,
  isDeleted: Boolean
}
```

## Flujo de Datos y Sincronizacion

### 1. Carga Inicial

**Cliente:**

1. Lee notas del LocalStorage al montar el componente
2. Se conecta al servidor via Socket.IO
3. Al conectar, envia todas sus notas locales al servidor

**Servidor:**

1. Al recibir conexion, obtiene todas las notas de MongoDB
2. Envia notas al cliente via evento `server_update`

### 2. Sincronizacion de Cambios

**Estrategia: Last-Write-Wins (LWW)**

Cuando el cliente realiza una operacion (crear, editar, eliminar):

1. **Cliente actualiza localmente:**
   - Modifica el estado de React
   - Actualiza LocalStorage
   - Genera nuevo timestamp `updatedAt`

2. **Cliente envia al servidor:**
   - Emite evento `sync_notes` con todas las notas locales

3. **Servidor procesa:**
   - Ejecuta operacion `bulkWrite` con `updateOne` condicional
   - Compara timestamps: mantiene la version mas reciente
   - Usa pipeline de agregacion MongoDB para resolver conflictos

```javascript
{
  $set: {
    content: {
      $cond: {
        if: { $gt: [note.updatedAt, "$updatedAt"] },
        then: note.content,
        else: "$content"
      }
    }
  }
}
```

4. **Servidor broadcast:**
   - Lee estado actualizado de MongoDB
   - Emite `server_update` a todos los clientes conectados

### 3. Manejo de Conflictos

El sistema resuelve conflictos mediante comparacion de timestamps:

- Si `note.updatedAt > dbNote.updatedAt`: Se acepta el cambio
- Si `note.updatedAt <= dbNote.updatedAt`: Se mantiene el valor existente
- El servidor siempre tiene la version autorizada final

### 4. Soft Deletion

Las notas no se eliminan fisicamente:

- Se marca `isDeleted: true` con nuevo timestamp
- El cliente filtra notas eliminadas en la UI
- El servidor mantiene historico completo en MongoDB

## API WebSocket

### Eventos Cliente -> Servidor

**`sync_notes`**

```typescript
socket.emit("sync_notes", notes: Note[])
```

Envia array completo de notas locales para sincronizacion.

### Eventos Servidor -> Cliente

**`server_update`**

```typescript
socket.on("server_update", (notes: Note[]) => void)
```

Recibe estado autorizado de todas las notas desde el servidor.

### Eventos de Conexion

**`connect`**

- Emitido al establecer conexion
- Cliente marca estado como conectado
- Sincroniza notas locales pendientes

**`disconnect`**

- Emitido al perder conexion
- Cliente marca estado como desconectado
- Continua funcionando en modo offline

## Caracteristicas Tecnicas

### 1. Modo Offline

- **LocalStorage como cache:** Todas las operaciones se guardan localmente
- **Sincronizacion automatica:** Al reconectar, envia cambios pendientes
- **Indicador visual:** Badge de estado conectado/desconectado

### 2. Operaciones en Tiempo Real

- **Latencia minima:** WebSockets para comunicacion bidireccional
- **Broadcast:** Cambios se propagan a todos los clientes conectados
- **Optimista UI:** Cliente actualiza inmediatamente sin esperar confirmacion

### 3. Resolucion de Conflictos

- **Estrategia LWW:** Last-Write-Wins basado en timestamps
- **Atomicidad:** BulkWrite de MongoDB para operaciones batch
- **Consistencia eventual:** Todos los clientes convergen al mismo estado

### 4. Escalabilidad

**Limitaciones actuales:**

- Sincronizacion completa en cada operacion (no delta)
- Sin paginacion de notas
- Broadcast a todos los clientes sin discriminacion

**Mejoras potenciales:**

- Implementar sincronizacion delta (solo cambios)
- Paginar resultados para grandes volumenes
- Usar rooms de Socket.IO para segmentar usuarios
- Implementar CRDT para conflictos mas complejos

## Configuracion del Entorno

### Variables de Entorno (Server)

Crear archivo `.env` en directorio `server/`:

```env
MONGO_URI=URL DE MONGO DB CON COLLECTION AL FINAL/
PORT=3000
```

### Instalacion y Ejecucion

**Prerequisitos:**

- Node.js 18+
- MongoDB 6+

**Backend:**

```bash
cd server
npm install
npm run dev
```

**Frontend:**

```bash
cd client
npm install
npm run dev
```

El cliente se ejecuta por defecto en `http://localhost:5173` y se conecta al servidor en `http://localhost:3000`.

## Dependencias Principales

### Server

- `express@5.2.1` - Framework HTTP
- `socket.io@4.8.3` - WebSockets
- `mongoose@9.1.4` - ODM MongoDB
- `typescript@5.9.3` - Type safety
- `tsx@4.21.0` - Ejecucion TypeScript en desarrollo

### Client

- `react@19.2.0` - Libreria UI
- `socket.io-client@4.8.3` - Cliente WebSocket
- `uuid@13.0.0` - Generacion de IDs
- `vite@7.2.4` - Build tool
- `typescript@5.9.3` - Type safety

## Seguridad y Consideraciones

**Implementado:**

- CORS habilitado en servidor
- TypeScript para type safety en cliente y servidor
- Validacion de tipos en interfaces Socket.IO

Proyecto desarrollado como prueba tecnica para Doricode
