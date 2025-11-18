-- Memory Items Table
CREATE TABLE IF NOT EXISTS memory_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('note', 'event', 'link')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  source_json TEXT NOT NULL DEFAULT '{}'
);

-- Memory Relations Table
CREATE TABLE IF NOT EXISTS memory_relations (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  relation_type TEXT NOT NULL CHECK(relation_type IN ('relates_to', 'references', 'continues', 'contradicts', 'supports')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (from_id) REFERENCES memory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES memory_items(id) ON DELETE CASCADE
);

-- Sync Checkpoints Table
CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id TEXT PRIMARY KEY,
  target TEXT NOT NULL UNIQUE,
  last_synced_at TEXT NOT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}'
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_memory_items_type ON memory_items(type);
CREATE INDEX IF NOT EXISTS idx_memory_items_created_at ON memory_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_items_updated_at ON memory_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_relations_from_id ON memory_relations(from_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_to_id ON memory_relations(to_id);
CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_target ON sync_checkpoints(target);

-- Full-text search virtual table (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS memory_items_fts USING fts5(
  id UNINDEXED,
  title,
  content,
  tags_json,
  content=memory_items,
  content_rowid=rowid
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS memory_items_ai AFTER INSERT ON memory_items BEGIN
  INSERT INTO memory_items_fts(rowid, id, title, content, tags_json)
  VALUES (new.rowid, new.id, new.title, new.content, new.tags_json);
END;

CREATE TRIGGER IF NOT EXISTS memory_items_ad AFTER DELETE ON memory_items BEGIN
  DELETE FROM memory_items_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS memory_items_au AFTER UPDATE ON memory_items BEGIN
  UPDATE memory_items_fts
  SET title = new.title, content = new.content, tags_json = new.tags_json
  WHERE rowid = new.rowid;
END;
