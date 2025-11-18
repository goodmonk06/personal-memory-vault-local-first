import { randomUUID } from 'crypto';
import { SyncCheckpoint, SyncCheckpointParsed } from '../types';
import { getDatabase } from '../db/sqlite';

export class SyncRepository {
  private parseSyncCheckpoint(checkpoint: SyncCheckpoint): SyncCheckpointParsed {
    return {
      ...checkpoint,
      meta: JSON.parse(checkpoint.metaJson || '{}'),
    };
  }

  upsertCheckpoint(target: string, meta?: Record<string, any>): SyncCheckpointParsed {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = db
      .prepare('SELECT * FROM sync_checkpoints WHERE target = ?')
      .get(target) as SyncCheckpoint | undefined;

    if (existing) {
      // Update existing checkpoint
      const stmt = db.prepare(`
        UPDATE sync_checkpoints
        SET last_synced_at = ?, meta_json = ?
        WHERE target = ?
      `);

      stmt.run(now, JSON.stringify(meta || {}), target);
    } else {
      // Insert new checkpoint
      const id = randomUUID();
      const stmt = db.prepare(`
        INSERT INTO sync_checkpoints (id, target, last_synced_at, meta_json)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(id, target, now, JSON.stringify(meta || {}));
    }

    const checkpoint = db
      .prepare('SELECT * FROM sync_checkpoints WHERE target = ?')
      .get(target) as SyncCheckpoint;

    return this.parseSyncCheckpoint(checkpoint);
  }

  getCheckpoint(target: string): SyncCheckpointParsed | null {
    const db = getDatabase();
    const checkpoint = db
      .prepare('SELECT * FROM sync_checkpoints WHERE target = ?')
      .get(target) as SyncCheckpoint | undefined;

    return checkpoint ? this.parseSyncCheckpoint(checkpoint) : null;
  }

  listCheckpoints(): SyncCheckpointParsed[] {
    const db = getDatabase();
    const checkpoints = db
      .prepare('SELECT * FROM sync_checkpoints ORDER BY last_synced_at DESC')
      .all() as SyncCheckpoint[];

    return checkpoints.map(cp => this.parseSyncCheckpoint(cp));
  }

  deleteCheckpoint(target: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM sync_checkpoints WHERE target = ?').run(target);
    return result.changes > 0;
  }
}
