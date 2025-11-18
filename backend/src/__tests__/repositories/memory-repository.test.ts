import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRepository } from '../../repositories/memory-repository';
import { runMigrations } from '../../db/sqlite';

describe('MemoryRepository', () => {
  let memoryRepo: MemoryRepository;

  beforeEach(() => {
    // Run migrations for each test
    runMigrations();
    memoryRepo = new MemoryRepository();
  });

  describe('create', () => {
    it('should create a new memory item', () => {
      const item = memoryRepo.create({
        type: 'note',
        title: 'Test Note',
        content: 'This is a test note',
        tags: ['test', 'sample'],
        source: { origin: 'test' },
      });

      expect(item.id).toBeDefined();
      expect(item.type).toBe('note');
      expect(item.title).toBe('Test Note');
      expect(item.content).toBe('This is a test note');
      expect(item.tags).toEqual(['test', 'sample']);
      expect(item.source).toEqual({ origin: 'test' });
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('should create memory with default tags and source', () => {
      const item = memoryRepo.create({
        type: 'event',
        title: 'Test Event',
        content: 'Event content',
      });

      expect(item.tags).toEqual([]);
      expect(item.source).toEqual({});
    });

    it('should support all memory types', () => {
      const types: Array<'note' | 'event' | 'link'> = ['note', 'event', 'link'];

      types.forEach((type) => {
        const item = memoryRepo.create({
          type,
          title: `Test ${type}`,
          content: `Content for ${type}`,
        });

        expect(item.type).toBe(type);
      });
    });
  });

  describe('findById', () => {
    it('should find an existing memory item', () => {
      const created = memoryRepo.create({
        type: 'note',
        title: 'Test Note',
        content: 'Content',
      });

      const found = memoryRepo.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Test Note');
    });

    it('should return null for non-existent ID', () => {
      const found = memoryRepo.findById('00000000-0000-0000-0000-000000000000');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all memory items', () => {
      memoryRepo.create({ type: 'note', title: 'Note 1', content: 'Content 1' });
      memoryRepo.create({ type: 'note', title: 'Note 2', content: 'Content 2' });
      memoryRepo.create({ type: 'event', title: 'Event 1', content: 'Content 3' });

      const items = memoryRepo.findAll();

      expect(items.length).toBe(3);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        memoryRepo.create({ type: 'note', title: `Note ${i}`, content: `Content ${i}` });
      }

      const items = memoryRepo.findAll(5);

      expect(items.length).toBe(5);
    });

    it('should respect offset parameter', () => {
      for (let i = 0; i < 10; i++) {
        memoryRepo.create({ type: 'note', title: `Note ${i}`, content: `Content ${i}` });
      }

      const items = memoryRepo.findAll(5, 5);

      expect(items.length).toBe(5);
    });
  });

  describe('update', () => {
    it('should update memory item title', () => {
      const created = memoryRepo.create({
        type: 'note',
        title: 'Original Title',
        content: 'Content',
      });

      const updated = memoryRepo.update(created.id, {
        title: 'Updated Title',
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.content).toBe('Content');
    });

    it('should update memory item content', () => {
      const created = memoryRepo.create({
        type: 'note',
        title: 'Title',
        content: 'Original Content',
      });

      const updated = memoryRepo.update(created.id, {
        content: 'Updated Content',
      });

      expect(updated?.content).toBe('Updated Content');
    });

    it('should update memory item tags', () => {
      const created = memoryRepo.create({
        type: 'note',
        title: 'Title',
        content: 'Content',
        tags: ['tag1'],
      });

      const updated = memoryRepo.update(created.id, {
        tags: ['tag1', 'tag2', 'tag3'],
      });

      expect(updated?.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should return null for non-existent ID', () => {
      const updated = memoryRepo.update('00000000-0000-0000-0000-000000000000', {
        title: 'New Title',
      });

      expect(updated).toBeNull();
    });

    it('should update updatedAt timestamp', () => {
      const created = memoryRepo.create({
        type: 'note',
        title: 'Title',
        content: 'Content',
      });

      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        const updated = memoryRepo.update(created.id, {
          title: 'New Title',
        });

        expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('delete', () => {
    it('should delete an existing memory item', () => {
      const created = memoryRepo.create({
        type: 'note',
        title: 'To Delete',
        content: 'Content',
      });

      const deleted = memoryRepo.delete(created.id);

      expect(deleted).toBe(true);

      const found = memoryRepo.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent ID', () => {
      const deleted = memoryRepo.delete('00000000-0000-0000-0000-000000000000');

      expect(deleted).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      // Create test data
      memoryRepo.create({
        type: 'note',
        title: 'TypeScript Best Practices',
        content: 'Always use strict mode and type annotations',
        tags: ['programming', 'typescript'],
      });

      memoryRepo.create({
        type: 'note',
        title: 'JavaScript Tips',
        content: 'Use const and let instead of var',
        tags: ['programming', 'javascript'],
      });

      memoryRepo.create({
        type: 'event',
        title: 'Conference 2024',
        content: 'Attended TypeScript conference',
        tags: ['event', 'typescript'],
      });

      memoryRepo.create({
        type: 'link',
        title: 'Documentation',
        content: 'Official TypeScript documentation link',
        tags: ['documentation', 'typescript'],
      });
    });

    it('should search by text query', () => {
      const results = memoryRepo.search('TypeScript');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.title.includes('TypeScript'))).toBe(true);
    });

    it('should search by tag', () => {
      const results = memoryRepo.search('', ['typescript']);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(r.tags).toContain('typescript');
      });
    });

    it('should search by text and tag combined', () => {
      const results = memoryRepo.search('conference', ['typescript']);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = memoryRepo.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('should respect limit parameter', () => {
      const results = memoryRepo.search('', undefined, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('listChangesSince', () => {
    it('should return items updated after a specific timestamp', () => {
      const timestamp1 = new Date().toISOString();

      memoryRepo.create({
        type: 'note',
        title: 'Old Note',
        content: 'Content',
      });

      // Wait a bit
      setTimeout(() => {
        const timestamp2 = new Date().toISOString();

        memoryRepo.create({
          type: 'note',
          title: 'New Note',
          content: 'Content',
        });

        const changes = memoryRepo.listChangesSince(timestamp2);

        expect(changes.length).toBeGreaterThan(0);
        expect(changes.some((c) => c.title === 'New Note')).toBe(true);
        expect(changes.some((c) => c.title === 'Old Note')).toBe(false);
      }, 10);
    });
  });
});
