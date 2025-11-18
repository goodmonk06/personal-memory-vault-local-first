import { randomUUID } from 'crypto';
import {
  MemoryItem,
  MemoryItemParsed,
  CreateMemoryItemRequest,
  UpdateMemoryItemRequest,
} from '../types';
import { getDatabase } from '../db/sqlite';

export class MemoryRepository {
  private parseMemoryItem(item: MemoryItem): MemoryItemParsed {
    return {
      ...item,
      tags: JSON.parse(item.tagsJson || '[]'),
      source: JSON.parse(item.sourceJson || '{}'),
    };
  }

  create(data: CreateMemoryItemRequest): MemoryItemParsed {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = randomUUID();

    const stmt = db.prepare(`
      INSERT INTO memory_items (id, type, title, content, created_at, updated_at, tags_json, source_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.type,
      data.title,
      data.content,
      now,
      now,
      JSON.stringify(data.tags || []),
      JSON.stringify(data.source || {})
    );

    const item = db.prepare('SELECT * FROM memory_items WHERE id = ?').get(id) as MemoryItem;
    return this.parseMemoryItem(item);
  }

  findById(id: string): MemoryItemParsed | null {
    const db = getDatabase();
    const item = db.prepare('SELECT * FROM memory_items WHERE id = ?').get(id) as MemoryItem | undefined;
    return item ? this.parseMemoryItem(item) : null;
  }

  findAll(limit = 100, offset = 0): MemoryItemParsed[] {
    const db = getDatabase();
    const items = db
      .prepare('SELECT * FROM memory_items ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as MemoryItem[];

    return items.map(item => this.parseMemoryItem(item));
  }

  update(id: string, data: UpdateMemoryItemRequest): MemoryItemParsed | null {
    const db = getDatabase();
    const existing = this.findById(id);

    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      params.push(data.content);
    }
    if (data.tags !== undefined) {
      updates.push('tags_json = ?');
      params.push(JSON.stringify(data.tags));
    }
    if (data.source !== undefined) {
      updates.push('source_json = ?');
      params.push(JSON.stringify(data.source));
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(id);

    const stmt = db.prepare(`
      UPDATE memory_items
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM memory_items WHERE id = ?').run(id);
    return result.changes > 0;
  }

  search(queryText: string, tags?: string[], limit = 50): MemoryItemParsed[] {
    const db = getDatabase();

    if (!queryText && (!tags || tags.length === 0)) {
      return this.findAll(limit);
    }

    // Use FTS5 for full-text search if queryText is provided
    if (queryText) {
      // Quote the entire query to handle special characters like hyphens
      // FTS5 will handle phrase matching properly this way
      const ftsQuery = `"${queryText.replace(/"/g, '""')}"`;

      let sql = `
        SELECT m.*
        FROM memory_items m
        INNER JOIN memory_items_fts fts ON m.rowid = fts.rowid
        WHERE memory_items_fts MATCH ?
      `;

      const params: any[] = [ftsQuery];

      if (tags && tags.length > 0) {
        sql += ` AND (${tags.map(() => 'tags_json LIKE ?').join(' OR ')})`;
        tags.forEach(tag => params.push(`%"${tag}"%`));
      }

      sql += ' ORDER BY rank LIMIT ?';
      params.push(limit);

      const items = db.prepare(sql).all(...params) as MemoryItem[];
      return items.map(item => this.parseMemoryItem(item));
    }

    // Tag-only search
    if (tags && tags.length > 0) {
      const sql = `
        SELECT * FROM memory_items
        WHERE ${tags.map(() => 'tags_json LIKE ?').join(' OR ')}
        ORDER BY created_at DESC
        LIMIT ?
      `;
      const params = [...tags.map(tag => `%"${tag}"%`), limit];
      const items = db.prepare(sql).all(...params) as MemoryItem[];
      return items.map(item => this.parseMemoryItem(item));
    }

    return [];
  }

  listChangesSince(since: string, limit = 100): MemoryItemParsed[] {
    const db = getDatabase();
    const items = db
      .prepare('SELECT * FROM memory_items WHERE updated_at > ? ORDER BY updated_at DESC LIMIT ?')
      .all(since, limit) as MemoryItem[];

    return items.map(item => this.parseMemoryItem(item));
  }
}
