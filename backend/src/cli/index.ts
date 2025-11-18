#!/usr/bin/env node

import { Command } from 'commander';
import { runMigrations } from '../db/sqlite';
import { MemoryRepository } from '../repositories/memory-repository';
import { RelationRepository } from '../repositories/relation-repository';
import { SyncRepository } from '../repositories/sync-repository';
import { logger } from '../lib/logger';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('memory-vault')
  .description('Personal Memory Vault CLI')
  .version('1.0.0');

// Database commands
const dbCommand = program.command('db').description('Database operations');

dbCommand
  .command('migrate')
  .description('Run database migrations')
  .action(() => {
    console.log('Running migrations...');
    runMigrations();
    console.log('✓ Migrations completed');
  });

dbCommand
  .command('backup')
  .description('Backup database to file')
  .option('-o, --output <path>', 'Output file path', './backup.db')
  .action((options) => {
    const dbPath = process.env.SQLITE_DB_PATH || './data/memory-vault.db';

    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file not found');
      process.exit(1);
    }

    fs.copyFileSync(dbPath, options.output);
    console.log(`✓ Database backed up to ${options.output}`);
  });

dbCommand
  .command('restore')
  .description('Restore database from backup')
  .requiredOption('-i, --input <path>', 'Backup file path')
  .action((options) => {
    const dbPath = process.env.SQLITE_DB_PATH || './data/memory-vault.db';

    if (!fs.existsSync(options.input)) {
      console.error('❌ Backup file not found');
      process.exit(1);
    }

    fs.copyFileSync(options.input, dbPath);
    console.log(`✓ Database restored from ${options.input}`);
  });

// Memory commands
const memoryCommand = program.command('memory').description('Memory operations');

memoryCommand
  .command('list')
  .description('List all memories')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('-t, --type <type>', 'Filter by type (note|event|link)')
  .action((options) => {
    runMigrations();
    const memoryRepo = new MemoryRepository();

    let items = memoryRepo.findAll(parseInt(options.limit, 10));

    if (options.type) {
      items = items.filter((item) => item.type === options.type);
    }

    console.log(`\nFound ${items.length} memories:\n`);

    items.forEach((item, index) => {
      console.log(`${index + 1}. [${item.type}] ${item.title}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Tags: ${item.tags.join(', ') || 'none'}`);
      console.log(`   Created: ${new Date(item.createdAt).toLocaleString()}`);
      console.log('');
    });
  });

memoryCommand
  .command('search <query>')
  .description('Search memories')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .action((query, options) => {
    runMigrations();
    const memoryRepo = new MemoryRepository();

    const items = memoryRepo.search(query, undefined, parseInt(options.limit, 10));

    console.log(`\nFound ${items.length} results for "${query}":\n`);

    items.forEach((item, index) => {
      console.log(`${index + 1}. [${item.type}] ${item.title}`);
      console.log(`   ${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}`);
      console.log(`   Tags: ${item.tags.join(', ') || 'none'}`);
      console.log('');
    });
  });

memoryCommand
  .command('create')
  .description('Create a new memory (interactive)')
  .option('-t, --type <type>', 'Memory type (note|event|link)', 'note')
  .option('--title <title>', 'Memory title')
  .option('--content <content>', 'Memory content')
  .option('--tags <tags>', 'Comma-separated tags')
  .action((options) => {
    runMigrations();
    const memoryRepo = new MemoryRepository();

    if (!options.title || !options.content) {
      console.error('❌ --title and --content are required');
      process.exit(1);
    }

    const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];

    const item = memoryRepo.create({
      type: options.type as any,
      title: options.title,
      content: options.content,
      tags,
      source: { origin: 'cli' },
    });

    console.log(`✓ Created ${options.type}: ${item.title}`);
    console.log(`  ID: ${item.id}`);
  });

memoryCommand
  .command('delete <id>')
  .description('Delete a memory by ID')
  .action((id) => {
    runMigrations();
    const memoryRepo = new MemoryRepository();

    const deleted = memoryRepo.delete(id);

    if (deleted) {
      console.log(`✓ Deleted memory ${id}`);
    } else {
      console.error(`❌ Memory ${id} not found`);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show vault statistics')
  .action(() => {
    runMigrations();
    const memoryRepo = new MemoryRepository();
    const relationRepo = new RelationRepository();
    const syncRepo = new SyncRepository();

    const allMemories = memoryRepo.findAll(10000);
    const allRelations = relationRepo.findAll(10000);
    const checkpoints = syncRepo.listCheckpoints();

    const typeCount = allMemories.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allTags = new Set<string>();
    allMemories.forEach((item) => {
      item.tags.forEach((tag) => allTags.add(tag));
    });

    console.log('\n📊 Memory Vault Statistics\n');
    console.log(`Total Memories: ${allMemories.length}`);
    console.log(`  Notes: ${typeCount.note || 0}`);
    console.log(`  Events: ${typeCount.event || 0}`);
    console.log(`  Links: ${typeCount.link || 0}`);
    console.log('');
    console.log(`Total Relations: ${allRelations.length}`);
    console.log(`Total Tags: ${allTags.size}`);
    console.log(`Sync Checkpoints: ${checkpoints.length}`);
    console.log('');

    if (allMemories.length > 0) {
      const oldest = allMemories.reduce((a, b) =>
        new Date(a.createdAt) < new Date(b.createdAt) ? a : b
      );
      const newest = allMemories.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b
      );

      console.log(`Oldest Memory: ${new Date(oldest.createdAt).toLocaleDateString()}`);
      console.log(`Newest Memory: ${new Date(newest.createdAt).toLocaleDateString()}`);
    }

    console.log('');
  });

// Export command
program
  .command('export')
  .description('Export memories to JSON file')
  .option('-o, --output <path>', 'Output file path', './export.json')
  .option('-t, --type <type>', 'Filter by type (note|event|link)')
  .action((options) => {
    runMigrations();
    const memoryRepo = new MemoryRepository();
    const relationRepo = new RelationRepository();

    let memories = memoryRepo.findAll(100000);

    if (options.type) {
      memories = memories.filter((m) => m.type === options.type);
    }

    const relations = relationRepo.findAll(100000);

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      memories,
      relations,
    };

    fs.writeFileSync(options.output, JSON.stringify(exportData, null, 2));

    console.log(`✓ Exported ${memories.length} memories to ${options.output}`);
  });

program.parse();
