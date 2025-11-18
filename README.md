# Personal Memory Vault

A local-first personal memory vault that stores notes, events, and links in a structured way, with powerful search capabilities designed for AI assistants.

## Why Local-First?

This project follows the [local-first software principles](https://www.inkandswitch.com/local-first/):

- **No spinners**: Your data lives locally, so operations are fast
- **Not trapped on one device**: Designed to sync (when you're ready)
- **Network optional**: Works completely offline
- **Seamless collaboration**: Prepare for future sync with proper data structures
- **Longevity**: Your data in SQLite, a format that will outlive most services
- **Privacy**: Your memories stay on your machine by default
- **User control**: You own your data and can export, backup, or migrate anytime

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│                    localhost:3000                            │
│         Simple UI for browsing and searching memories        │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Fastify)                     │
│                      localhost:3001                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Memory API   │  │  Query API   │  │  Sync API    │     │
│  │ (CRUD)       │  │  (AI Tools)  │  │  (Stubs)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                            │                                 │
│                            ▼                                 │
│              ┌──────────────────────────┐                   │
│              │   Repository Layer        │                   │
│              └──────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (SQLite/Postgres)                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ memory_items │  │ memory_      │  │ sync_        │     │
│  │              │  │ relations    │  │ checkpoints  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │  Full-Text Search (SQLite FTS5)              │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### MemoryItem
The core entity representing a piece of knowledge or information.

```typescript
{
  id: string;           // UUID
  type: 'note' | 'event' | 'link';
  title: string;
  content: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
  tags: string[];       // Array of tags
  source: object;       // Metadata about origin
}
```

### MemoryRelation
Links between memory items to build a knowledge graph.

```typescript
{
  id: string;           // UUID
  fromId: string;       // Source memory ID
  toId: string;         // Target memory ID
  relationType: 'relates_to' | 'references' | 'continues' | 'contradicts' | 'supports';
  createdAt: string;
}
```

### SyncCheckpoint
Tracks synchronization state for future remote sync capabilities.

```typescript
{
  id: string;
  target: string;       // e.g., "remote-server-1"
  lastSyncedAt: string;
  meta: object;         // Sync-specific metadata
}
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd personal-memory-vault-local-first

# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### Running the Application

#### Option 1: Run Everything Together

```bash
# From the root directory
npm run dev
```

This starts:
- Backend API on http://localhost:3001
- Frontend UI on http://localhost:3000

#### Option 2: Run Separately

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Seeding Sample Data

```bash
cd backend
npm run seed
```

This creates sample memories about:
- TypeScript best practices
- Local-first software principles
- Project milestones
- Technical documentation links
- AI context strategies

## API Documentation

### For AI Tools: Query Endpoint

The `/api/query` endpoint is designed specifically for AI assistants to retrieve relevant context.

#### POST /api/query

Search for relevant memories using full-text search and tag filtering.

**Request:**
```json
{
  "queryText": "typescript best practices",
  "tags": ["programming"],
  "limit": 10
}
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "note",
      "title": "TypeScript Best Practices",
      "content": "Always use strict mode...",
      "tags": ["programming", "typescript"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "source": {}
    }
  ],
  "total": 1,
  "query": {
    "text": "typescript best practices",
    "tags": ["programming"],
    "limit": 10
  }
}
```

#### GET /api/query

Simple GET version for quick testing:

```bash
curl "http://localhost:3001/api/query?q=typescript&limit=5"
curl "http://localhost:3001/api/query?tags=ai,search"
curl "http://localhost:3001/api/query?q=local-first&tags=architecture"
```

### Memory Management APIs

#### Create Memory
```bash
POST /api/items
Content-Type: application/json

{
  "type": "note",
  "title": "New Memory",
  "content": "Content here",
  "tags": ["tag1", "tag2"],
  "source": { "origin": "api" }
}
```

#### List Memories
```bash
GET /api/items?limit=50&offset=0
```

#### Get Memory
```bash
GET /api/items/:id
```

#### Update Memory
```bash
PATCH /api/items/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "tags": ["new-tag"]
}
```

#### Delete Memory
```bash
DELETE /api/items/:id
```

### Relations APIs

#### Create Relation
```bash
POST /api/relations
Content-Type: application/json

{
  "fromId": "uuid1",
  "toId": "uuid2",
  "relationType": "relates_to"
}
```

#### Get Relations for Item
```bash
GET /api/relations/item/:itemId
```

#### List All Relations
```bash
GET /api/relations
```

### Sync APIs (Stubs)

These endpoints are placeholders for future synchronization features:

```bash
GET /api/sync/checkpoints
POST /api/sync/checkpoints
POST /api/sync/pull
POST /api/sync/push
```

## Search Capabilities

The system uses **SQLite FTS5** (Full-Text Search) for powerful search:

- **Prefix matching**: Search for "type*" matches "typescript", "types", etc.
- **Phrase search**: Use quotes for exact phrases
- **Boolean operators**: Combine terms with OR
- **Tag filtering**: Filter by multiple tags
- **BM25 ranking**: Results ranked by relevance

Example searches:
```bash
# Find all TypeScript-related content
curl "http://localhost:3001/api/query?q=typescript"

# Find content about local-first architecture
curl "http://localhost:3001/api/query?q=local-first&tags=architecture"

# Find all AI-related memories
curl "http://localhost:3001/api/query?tags=ai"
```

## Configuration

### Database Options

The system supports both SQLite (default) and PostgreSQL:

```env
# SQLite (default, recommended for local-first)
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/memory-vault.db

# PostgreSQL (for server deployment)
DB_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=memory_vault
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### Environment Variables

Backend (`backend/.env`):
```env
PORT=3001
HOST=0.0.0.0
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/memory-vault.db
```

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## How AI Tools Should Use This

### Scenario 1: Contextual Q&A

When a user asks a question, the AI can query the memory vault for relevant context:

```javascript
// AI Assistant Integration Example
async function getPersonalContext(userQuestion) {
  const response = await fetch('http://localhost:3001/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryText: userQuestion,
      limit: 5
    })
  });

  const { items } = await response.json();

  // Use items as context for AI response
  return items;
}

// Usage
const context = await getPersonalContext("How should I structure TypeScript code?");
// Returns memories about TypeScript best practices
```

### Scenario 2: Building on Past Work

When starting a new project, retrieve related past experiences:

```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "queryText": "similar project architecture",
    "tags": ["project", "architecture"],
    "limit": 10
  }'
```

### Scenario 3: Avoiding Repeated Mistakes

Query for past issues or learnings:

```bash
curl "http://localhost:3001/api/query?q=common+pitfalls&tags=lessons-learned"
```

## Future Enhancements

### Planned Features

1. **Remote Sync**: Implement CRDT or timestamp-based synchronization
2. **Vector Search**: Add semantic search using embeddings
3. **Conflict Resolution**: Handle sync conflicts gracefully
4. **Encryption**: Optional end-to-end encryption for sync
5. **Mobile Apps**: iOS/Android apps using the same local-first principles
6. **Browser Extension**: Quick capture of web content
7. **Graph Visualization**: Visual representation of memory relations
8. **Import/Export**: Support for various formats (Markdown, JSON, etc.)

### Why These Are Not Included Yet

This is a **minimal viable core** designed to be:
- Easy to understand
- Easy to extend
- Functional as-is for local use

Add features as you need them, not before.

## Development

### Project Structure

```
personal-memory-vault-local-first/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── db/              # Database setup and migrations
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # API endpoints
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Main server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main page
│   │   └── globals.css      # Styles
│   ├── package.json
│   └── tsconfig.json
├── package.json             # Root workspace
└── README.md
```

### Running Tests

```bash
# Backend tests (add your test framework)
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Or individually
npm run build:backend
npm run build:frontend
```

## Troubleshooting

### Database Issues

If you encounter database errors:

```bash
# Reset the database
cd backend
rm -rf data/
npm run migrate
npm run seed
```

### Port Conflicts

If ports 3000 or 3001 are in use:

1. Edit `backend/.env` to change `PORT`
2. Edit `frontend/.env.local` to update `NEXT_PUBLIC_API_URL`

### CORS Issues

If frontend can't reach backend:
- Ensure both are running
- Check that `NEXT_PUBLIC_API_URL` in frontend matches backend URL
- Backend has CORS enabled by default

## Contributing

This is a personal project template, but feel free to:
- Fork and customize for your needs
- Submit issues or suggestions
- Share your extensions

## License

MIT License - Feel free to use this as a starting point for your own memory vault.

## Acknowledgments

- Inspired by the [local-first software movement](https://www.inkandswitch.com/local-first/)
- Built on excellent open-source tools: Fastify, SQLite, Next.js
- Designed for AI-human collaboration

---

**Built with TypeScript, Fastify, SQLite, and Next.js**

*Your memories, your machine, your control.*
