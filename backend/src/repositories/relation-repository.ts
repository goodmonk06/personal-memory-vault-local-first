import { randomUUID } from 'crypto';
import { MemoryRelation, CreateRelationRequest } from '../types';
import { getDatabase } from '../db/sqlite';

export class RelationRepository {
  create(data: CreateRelationRequest): MemoryRelation {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = randomUUID();

    const stmt = db.prepare(`
      INSERT INTO memory_relations (id, from_id, to_id, relation_type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.fromId, data.toId, data.relationType, now);

    return db.prepare('SELECT * FROM memory_relations WHERE id = ?').get(id) as MemoryRelation;
  }

  findById(id: string): MemoryRelation | null {
    const db = getDatabase();
    const relation = db.prepare('SELECT * FROM memory_relations WHERE id = ?').get(id) as MemoryRelation | undefined;
    return relation || null;
  }

  findByItemId(itemId: string): MemoryRelation[] {
    const db = getDatabase();
    const relations = db
      .prepare('SELECT * FROM memory_relations WHERE from_id = ? OR to_id = ? ORDER BY created_at DESC')
      .all(itemId, itemId) as MemoryRelation[];

    return relations;
  }

  findAll(limit = 100, offset = 0): MemoryRelation[] {
    const db = getDatabase();
    const relations = db
      .prepare('SELECT * FROM memory_relations ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as MemoryRelation[];

    return relations;
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM memory_relations WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
