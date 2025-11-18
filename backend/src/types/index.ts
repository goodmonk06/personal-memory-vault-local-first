// Domain Types

export type MemoryItemType = 'note' | 'event' | 'link';
export type RelationType = 'relates_to' | 'references' | 'continues' | 'contradicts' | 'supports';

export interface MemoryItem {
  id: string;
  type: MemoryItemType;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tagsJson: string; // JSON array of strings
  sourceJson: string; // JSON object for metadata
}

export interface MemoryItemParsed extends Omit<MemoryItem, 'tagsJson' | 'sourceJson'> {
  tags: string[];
  source: Record<string, any>;
}

export interface MemoryRelation {
  id: string;
  fromId: string;
  toId: string;
  relationType: RelationType;
  createdAt: string;
}

export interface SyncCheckpoint {
  id: string;
  target: string; // e.g., "remote-server-1"
  lastSyncedAt: string;
  metaJson: string; // JSON object for sync metadata
}

export interface SyncCheckpointParsed extends Omit<SyncCheckpoint, 'metaJson'> {
  meta: Record<string, any>;
}

// API Request/Response Types

export interface CreateMemoryItemRequest {
  type: MemoryItemType;
  title: string;
  content: string;
  tags?: string[];
  source?: Record<string, any>;
}

export interface UpdateMemoryItemRequest {
  title?: string;
  content?: string;
  tags?: string[];
  source?: Record<string, any>;
}

export interface QueryRequest {
  queryText: string;
  limit?: number;
  tags?: string[];
}

export interface QueryResponse {
  items: MemoryItemParsed[];
  total: number;
}

export interface CreateRelationRequest {
  fromId: string;
  toId: string;
  relationType: RelationType;
}

export interface ListChangesRequest {
  since: string; // ISO timestamp
  limit?: number;
}
