import { runMigrations } from './sqlite';
import { MemoryRepository } from '../repositories/memory-repository';
import { RelationRepository } from '../repositories/relation-repository';
import { SyncRepository } from '../repositories/sync-repository';

const memoryRepo = new MemoryRepository();
const relationRepo = new RelationRepository();
const syncRepo = new SyncRepository();

async function seed() {
  console.log('Running migrations...');
  runMigrations();

  console.log('Seeding database with sample data...');

  // Create sample memories
  const memory1 = memoryRepo.create({
    type: 'note',
    title: 'TypeScript Best Practices',
    content: 'Always use strict mode and enable noImplicitAny. Prefer interfaces over types for object shapes. Use const assertions for literal types.',
    tags: ['programming', 'typescript', 'best-practices'],
    source: { origin: 'learning', author: 'self' },
  });

  const memory2 = memoryRepo.create({
    type: 'note',
    title: 'Local-First Software Principles',
    content: 'Seven ideals: No spinners, your work is not trapped on one device, the network is optional, seamless collaboration, longevity, privacy, and user control.',
    tags: ['software-architecture', 'local-first', 'principles'],
    source: { origin: 'article', url: 'https://www.inkandswitch.com/local-first/' },
  });

  const memory3 = memoryRepo.create({
    type: 'event',
    title: 'Started Memory Vault Project',
    content: 'Began building a local-first personal memory vault to store notes, events, and links. Goal is to create a system that works offline and can sync later.',
    tags: ['project', 'milestone', 'local-first'],
    source: { origin: 'self', date: new Date().toISOString() },
  });

  const memory4 = memoryRepo.create({
    type: 'link',
    title: 'SQLite FTS5 Documentation',
    content: 'Full-text search extension for SQLite. Provides powerful search capabilities including phrase queries, prefix queries, and BM25 ranking.',
    tags: ['database', 'sqlite', 'search', 'documentation'],
    source: { url: 'https://www.sqlite.org/fts5.html' },
  });

  const memory5 = memoryRepo.create({
    type: 'note',
    title: 'AI Context Retrieval Strategy',
    content: 'For AI assistants to provide personalized responses, they need access to relevant personal context. A memory vault with semantic search can provide this. Consider combining full-text search with vector embeddings for better results.',
    tags: ['ai', 'context', 'search', 'strategy'],
    source: { origin: 'brainstorming' },
  });

  const memory6 = memoryRepo.create({
    type: 'event',
    title: 'Implemented Full-Text Search',
    content: 'Added SQLite FTS5 support for fast full-text search across memory items. Now AI tools can efficiently query the memory vault.',
    tags: ['milestone', 'search', 'implementation'],
    source: { origin: 'self', date: new Date().toISOString() },
  });

  console.log('Created 6 sample memory items');

  // Create sample relations
  const relation1 = relationRepo.create({
    fromId: memory1.id,
    toId: memory3.id,
    relationType: 'relates_to',
  });

  const relation2 = relationRepo.create({
    fromId: memory2.id,
    toId: memory3.id,
    relationType: 'supports',
  });

  const relation3 = relationRepo.create({
    fromId: memory4.id,
    toId: memory6.id,
    relationType: 'references',
  });

  const relation4 = relationRepo.create({
    fromId: memory5.id,
    toId: memory6.id,
    relationType: 'continues',
  });

  console.log('Created 4 sample relations');

  // Create a sample sync checkpoint
  const checkpoint = syncRepo.upsertCheckpoint('remote-server-1', {
    serverUrl: 'https://example.com/sync',
    lastSyncStatus: 'success',
  });

  console.log('Created sample sync checkpoint');

  console.log('\n✓ Seeding completed successfully!');
  console.log('\nSample memories created:');
  console.log(`  1. ${memory1.title} [${memory1.tags.join(', ')}]`);
  console.log(`  2. ${memory2.title} [${memory2.tags.join(', ')}]`);
  console.log(`  3. ${memory3.title} [${memory3.tags.join(', ')}]`);
  console.log(`  4. ${memory4.title} [${memory4.tags.join(', ')}]`);
  console.log(`  5. ${memory5.title} [${memory5.tags.join(', ')}]`);
  console.log(`  6. ${memory6.title} [${memory6.tags.join(', ')}]`);
  console.log('\nTry querying:');
  console.log('  curl http://localhost:3001/api/query?q=typescript');
  console.log('  curl http://localhost:3001/api/query?q=local-first');
  console.log('  curl http://localhost:3001/api/query?tags=ai');

  process.exit(0);
}

seed();
