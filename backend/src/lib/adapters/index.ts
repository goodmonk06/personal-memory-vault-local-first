// Adapter interfaces for extensibility

import { MemoryItemParsed } from '../../types';

/**
 * Notification adapter interface
 * Implement this to send notifications when events occur
 */
export interface INotificationAdapter {
  send(notification: Notification): Promise<void>;
}

export interface Notification {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Search adapter interface
 * Implement this to add advanced search capabilities (e.g., vector search)
 */
export interface ISearchAdapter {
  index(item: MemoryItemParsed): Promise<void>;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  delete(itemId: string): Promise<void>;
}

export interface SearchResult {
  itemId: string;
  score: number;
  highlights?: string[];
}

/**
 * Storage adapter interface
 * Implement this for alternative storage backends
 */
export interface IStorageAdapter {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

/**
 * Analytics adapter interface
 * Implement this to track usage analytics
 */
export interface IAnalyticsAdapter {
  track(event: AnalyticsEvent): Promise<void>;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: string;
}

/**
 * AI Integration adapter interface
 * Implement this to integrate with AI services
 */
export interface IAIAdapter {
  generateEmbedding(text: string): Promise<number[]>;
  generateSummary(text: string): Promise<string>;
  extractKeywords(text: string): Promise<string[]>;
  classifyContent(text: string): Promise<ContentClassification>;
}

export interface ContentClassification {
  category: string;
  confidence: number;
  suggestedTags: string[];
}

/**
 * Export adapter interface
 * Implement this to support various export formats
 */
export interface IExportAdapter {
  export(items: MemoryItemParsed[], format: string): Promise<ExportResult>;
}

export interface ExportResult {
  format: string;
  data: string | Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Sync adapter interface
 * Implement this for remote synchronization
 */
export interface ISyncAdapter {
  push(items: MemoryItemParsed[]): Promise<SyncResult>;
  pull(since?: string): Promise<MemoryItemParsed[]>;
  getStatus(): Promise<SyncStatus>;
}

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: number;
}

export interface SyncStatus {
  lastSync?: string;
  itemCount: number;
  isConnected: boolean;
}
