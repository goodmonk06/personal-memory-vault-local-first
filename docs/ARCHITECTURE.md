# Architecture Documentation

## System Overview

The Personal Memory Vault is built using a clean, layered architecture that emphasizes separation of concerns, testability, and extensibility.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                   React + TypeScript                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API Layer (Fastify)                   │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Routes    │  │ Middleware │  │ Validation │           │
│  │ (Handlers) │  │  (Errors)  │  │   (Zod)    │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service/Domain Layer                      │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │Repositories│  │   Events   │  │  Adapters  │           │
│  │            │  │  (Domain)  │  │ (Plugins)  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│                                                              │
│  ┌────────────────┐        ┌────────────────┐             │
│  │ SQLite (Local) │   OR   │ PostgreSQL     │             │
│  │  + FTS5        │        │  (Remote)      │             │
│  └────────────────┘        └────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Frontend Layer (`/frontend`)

**Responsibility**: User interface and client-side logic

**Components**:
- Next.js React application
- Pages and components
- Client-side state management
- API client for backend communication

**Key Files**:
- `app/page.tsx` - Main memory list and search UI
- `app/layout.tsx` - App layout and providers
- `app/globals.css` - Global styles

### 2. API Layer (`/backend/src/routes`)

**Responsibility**: HTTP request handling, validation, and response formatting

**Components**:
- Fastify route handlers
- Request/response validation (Zod schemas)
- Error handling middleware
- Authentication/authorization (future)

**Key Files**:
- `routes/memory-routes.ts` - Memory CRUD operations
- `routes/query-routes.ts` - Search and query endpoints
- `routes/relation-routes.ts` - Relationship management
- `routes/sync-routes.ts` - Sync operations (stubs)

**Middleware**:
- `middleware/error-handler.ts` - Centralized error handling
- `middleware/validation.ts` - Request validation helpers

### 3. Domain Layer (`/backend/src/repositories`, `/backend/src/lib`)

**Responsibility**: Business logic and domain models

**Components**:
- Repositories for data access abstraction
- Domain events for lifecycle hooks
- Adapter interfaces for extensibility
- Business rules and validation

**Key Files**:
- `repositories/memory-repository.ts` - Memory data operations
- `repositories/relation-repository.ts` - Relation data operations
- `repositories/sync-repository.ts` - Sync checkpoint operations
- `lib/events.ts` - Domain event system
- `lib/adapters/` - Plugin interfaces and implementations

**Domain Models**:
- `MemoryItem` - Core entity for notes/events/links
- `MemoryRelation` - Relationships between memories
- `SyncCheckpoint` - Sync state tracking

### 4. Infrastructure Layer (`/backend/src/db`, `/backend/src/lib`)

**Responsibility**: Technical infrastructure and utilities

**Components**:
- Database connections and migrations
- Logging system
- Metrics collection
- Error definitions
- Configuration management

**Key Files**:
- `db/sqlite.ts` - SQLite database setup
- `db/postgres.ts` - PostgreSQL database setup
- `db/schema.sql` - Database schema
- `lib/logger.ts` - Structured logging
- `lib/metrics.ts` - Metrics collection
- `lib/errors.ts` - Custom error types
- `config/index.ts` - Configuration management

## Data Flow

### Creating a Memory

```
User → Frontend → POST /api/items
                      ↓
                  Validation Middleware (Zod)
                      ↓
                  Memory Route Handler
                      ↓
                  Memory Repository
                      ↓
                  Database (SQLite/Postgres)
                      ↓
                  Event Emitter (memory.created)
                      ↓
                  Adapters (notifications, analytics, etc.)
```

### Searching Memories

```
User → Frontend → GET /api/query?q=text
                      ↓
                  Query Route Handler
                      ↓
                  Memory Repository.search()
                      ↓
                  SQLite FTS5 or PostgreSQL Full-Text
                      ↓
                  Results → Frontend
```

## Database Schema

### MemoryItems Table

```sql
CREATE TABLE memory_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('note', 'event', 'link')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  source_json TEXT NOT NULL DEFAULT '{}'
);
```

**Indexes**:
- `idx_memory_items_type` - Filter by type
- `idx_memory_items_created_at` - Sort by creation date
- `idx_memory_items_updated_at` - Sort by update date

**FTS5 Virtual Table** (SQLite only):
- Full-text search on title, content, and tags
- BM25 ranking for relevance

### MemoryRelations Table

```sql
CREATE TABLE memory_relations (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (from_id) REFERENCES memory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES memory_items(id) ON DELETE CASCADE
);
```

**Indexes**:
- `idx_memory_relations_from_id` - Find outgoing relations
- `idx_memory_relations_to_id` - Find incoming relations

### SyncCheckpoints Table

```sql
CREATE TABLE sync_checkpoints (
  id TEXT PRIMARY KEY,
  target TEXT NOT NULL UNIQUE,
  last_synced_at TEXT NOT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}'
);
```

## Extension Points

### 1. Adapter Pattern

The system uses adapter interfaces to allow plugging in different implementations:

**Available Adapters**:
- `INotificationAdapter` - Send notifications
- `ISearchAdapter` - Advanced search (vector, semantic)
- `IStorageAdapter` - Alternative storage backends
- `IAnalyticsAdapter` - Usage tracking
- `IAIAdapter` - AI service integration
- `IExportAdapter` - Export to various formats
- `ISyncAdapter` - Remote synchronization

**Usage**:
```typescript
// Example: Plug in custom notification adapter
import { INotificationAdapter } from './lib/adapters';
import { eventEmitter } from './lib/events';

class EmailNotificationAdapter implements INotificationAdapter {
  async send(notification: Notification) {
    // Send email...
  }
}

const adapter = new EmailNotificationAdapter();

eventEmitter.on('memory.created', async (event) => {
  await adapter.send({
    title: 'New Memory Created',
    message: event.payload.title,
    type: 'success',
  });
});
```

### 2. Domain Events

The event system allows reacting to domain changes:

**Available Events**:
- `memory.created`
- `memory.updated`
- `memory.deleted`
- `relation.created`
- `relation.deleted`
- `sync.started`
- `sync.completed`
- `sync.failed`

**Usage**:
```typescript
import { eventEmitter } from './lib/events';

// Subscribe to specific event
eventEmitter.on('memory.created', (event) => {
  console.log('New memory:', event.payload.title);
});

// Subscribe to all events
eventEmitter.onAny((event) => {
  console.log('Event:', event.type);
});
```

## Security Considerations

### Current State
- Input validation on all endpoints (Zod schemas)
- SQL injection prevention (parameterized queries)
- Error sanitization (no stack traces in production)
- CORS enabled (configurable)

### Future Enhancements
- Authentication (JWT or session-based)
- Authorization (role-based access control)
- Rate limiting
- Request signing
- Encryption at rest
- Audit logging

## Performance Considerations

### Database
- SQLite Write-Ahead Logging (WAL) mode for better concurrency
- FTS5 indexes for fast full-text search
- Proper indexes on frequently queried columns
- Connection pooling for PostgreSQL

### API
- Request/response streaming for large datasets
- Pagination on list endpoints
- Caching headers for static resources
- Compression middleware

### Monitoring
- Request logging with duration
- Metrics collection (counters, gauges, histograms)
- Health check endpoint
- Metrics snapshot endpoint

## Testing Strategy

### Unit Tests
- Repository layer (business logic)
- Validation schemas
- Utility functions

### Integration Tests
- API endpoints (request/response)
- Database operations
- Event emitters

### Test Infrastructure
- Vitest as test runner
- In-memory SQLite for fast tests
- Test fixtures and factories
- Coverage reporting

## Deployment

### Local Development
```bash
npm run dev          # Start dev servers
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
```

### Docker Deployment
```bash
docker-compose up -d        # Production
docker-compose -f docker-compose.dev.yml up -d  # Development
```

### Environment Variables
See `.env.example` for all configuration options.

## Future Architectural Improvements

1. **CQRS Pattern**: Separate read and write models
2. **Event Sourcing**: Store all changes as events
3. **Message Queue**: Async processing with Redis or RabbitMQ
4. **GraphQL API**: Alternative to REST for flexible queries
5. **WebSocket Support**: Real-time updates
6. **Multi-tenancy**: Support for multiple users/vaults
7. **Sharding**: Horizontal scaling for large datasets
8. **Read Replicas**: Scale read operations
