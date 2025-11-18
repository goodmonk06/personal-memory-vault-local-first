import { logger } from './logger';
import { MemoryItemParsed } from '../types';

// Event types
export type DomainEventType =
  | 'memory.created'
  | 'memory.updated'
  | 'memory.deleted'
  | 'relation.created'
  | 'relation.deleted'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed';

// Base event interface
export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  timestamp: string;
  payload: T;
  metadata?: Record<string, any>;
}

// Specific event payloads
export interface MemoryCreatedPayload {
  memoryId: string;
  type: string;
  title: string;
  tags: string[];
}

export interface MemoryUpdatedPayload {
  memoryId: string;
  changes: Record<string, any>;
}

export interface MemoryDeletedPayload {
  memoryId: string;
}

export interface RelationCreatedPayload {
  relationId: string;
  fromId: string;
  toId: string;
  relationType: string;
}

export interface RelationDeletedPayload {
  relationId: string;
}

export interface SyncEventPayload {
  target: string;
  itemCount?: number;
  error?: string;
}

// Event handler type
export type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

// Event emitter class
class EventEmitter {
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  // Subscribe to a specific event type
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  // Subscribe to all events
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);

    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  // Emit an event
  async emit<T = any>(event: DomainEvent<T>): Promise<void> {
    logger.debug('Domain event emitted', {
      eventType: event.type,
      eventId: event.id,
      timestamp: event.timestamp,
    });

    // Call type-specific handlers
    const typeHandlers = this.handlers.get(event.type) || new Set();

    for (const handler of typeHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${event.type}`, error);
      }
    }

    // Call global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Error in global event handler', error);
      }
    }
  }

  // Clear all handlers (useful for testing)
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }

  // Get count of handlers for a type
  getHandlerCount(eventType?: DomainEventType): number {
    if (eventType) {
      return this.handlers.get(eventType)?.size || 0;
    }
    return this.globalHandlers.size;
  }
}

// Singleton event emitter
export const eventEmitter = new EventEmitter();

// Helper function to create events
export function createEvent<T = any>(
  type: DomainEventType,
  payload: T,
  metadata?: Record<string, any>
): DomainEvent<T> {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    payload,
    metadata,
  };
}

// Pre-configured event creators
export const events = {
  memoryCreated: (memory: MemoryItemParsed) => {
    return createEvent<MemoryCreatedPayload>('memory.created', {
      memoryId: memory.id,
      type: memory.type,
      title: memory.title,
      tags: memory.tags,
    });
  },

  memoryUpdated: (memoryId: string, changes: Record<string, any>) => {
    return createEvent<MemoryUpdatedPayload>('memory.updated', {
      memoryId,
      changes,
    });
  },

  memoryDeleted: (memoryId: string) => {
    return createEvent<MemoryDeletedPayload>('memory.deleted', {
      memoryId,
    });
  },

  relationCreated: (relation: {
    id: string;
    fromId: string;
    toId: string;
    relationType: string;
  }) => {
    return createEvent<RelationCreatedPayload>('relation.created', {
      relationId: relation.id,
      fromId: relation.fromId,
      toId: relation.toId,
      relationType: relation.relationType,
    });
  },

  relationDeleted: (relationId: string) => {
    return createEvent<RelationDeletedPayload>('relation.deleted', {
      relationId,
    });
  },

  syncStarted: (target: string) => {
    return createEvent<SyncEventPayload>('sync.started', { target });
  },

  syncCompleted: (target: string, itemCount: number) => {
    return createEvent<SyncEventPayload>('sync.completed', { target, itemCount });
  },

  syncFailed: (target: string, error: string) => {
    return createEvent<SyncEventPayload>('sync.failed', { target, error });
  },
};
