import { describe, it, expect } from 'vitest';
import {
  createMemoryItemSchema,
  updateMemoryItemSchema,
  queryMemoriesSchema,
  createRelationSchema,
} from '../../lib/validation';

describe('Validation Schemas', () => {
  describe('createMemoryItemSchema', () => {
    it('should validate valid memory item', () => {
      const validData = {
        type: 'note' as const,
        title: 'Test Note',
        content: 'Test content',
        tags: ['test'],
        source: { origin: 'test' },
      };

      const result = createMemoryItemSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should use default values for optional fields', () => {
      const minimalData = {
        type: 'note' as const,
        title: 'Test',
        content: 'Content',
      };

      const result = createMemoryItemSchema.parse(minimalData);

      expect(result.tags).toEqual([]);
      expect(result.source).toEqual({});
    });

    it('should reject invalid type', () => {
      const invalidData = {
        type: 'invalid',
        title: 'Test',
        content: 'Content',
      };

      expect(() => createMemoryItemSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty title', () => {
      const invalidData = {
        type: 'note' as const,
        title: '',
        content: 'Content',
      };

      expect(() => createMemoryItemSchema.parse(invalidData)).toThrow();
    });

    it('should reject title too long', () => {
      const invalidData = {
        type: 'note' as const,
        title: 'a'.repeat(501),
        content: 'Content',
      };

      expect(() => createMemoryItemSchema.parse(invalidData)).toThrow();
    });

    it('should reject content too long', () => {
      const invalidData = {
        type: 'note' as const,
        title: 'Title',
        content: 'a'.repeat(50001),
      };

      expect(() => createMemoryItemSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateMemoryItemSchema', () => {
    it('should validate partial update', () => {
      const validData = {
        title: 'Updated Title',
      };

      const result = updateMemoryItemSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should validate multiple fields update', () => {
      const validData = {
        title: 'Updated Title',
        content: 'Updated Content',
        tags: ['new', 'tags'],
      };

      const result = updateMemoryItemSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should reject empty update object', () => {
      const invalidData = {};

      expect(() => updateMemoryItemSchema.parse(invalidData)).toThrow();
    });
  });

  describe('queryMemoriesSchema', () => {
    it('should validate query with all fields', () => {
      const validData = {
        queryText: 'search term',
        limit: 25,
        tags: ['tag1', 'tag2'],
      };

      const result = queryMemoriesSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should use default values', () => {
      const minimalData = {};

      const result = queryMemoriesSchema.parse(minimalData);

      expect(result.queryText).toBe('');
      expect(result.limit).toBe(50);
    });

    it('should reject query text too long', () => {
      const invalidData = {
        queryText: 'a'.repeat(1001),
      };

      expect(() => queryMemoriesSchema.parse(invalidData)).toThrow();
    });

    it('should reject limit too large', () => {
      const invalidData = {
        limit: 201,
      };

      expect(() => queryMemoriesSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative limit', () => {
      const invalidData = {
        limit: -1,
      };

      expect(() => queryMemoriesSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createRelationSchema', () => {
    it('should validate valid relation', () => {
      const validData = {
        fromId: '00000000-0000-0000-0000-000000000001',
        toId: '00000000-0000-0000-0000-000000000002',
        relationType: 'relates_to' as const,
      };

      const result = createRelationSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should support all relation types', () => {
      const types = ['relates_to', 'references', 'continues', 'contradicts', 'supports'] as const;

      types.forEach((type) => {
        const data = {
          fromId: '00000000-0000-0000-0000-000000000001',
          toId: '00000000-0000-0000-0000-000000000002',
          relationType: type,
        };

        const result = createRelationSchema.parse(data);
        expect(result.relationType).toBe(type);
      });
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        fromId: 'not-a-uuid',
        toId: '00000000-0000-0000-0000-000000000002',
        relationType: 'relates_to' as const,
      };

      expect(() => createRelationSchema.parse(invalidData)).toThrow();
    });

    it('should reject same fromId and toId', () => {
      const invalidData = {
        fromId: '00000000-0000-0000-0000-000000000001',
        toId: '00000000-0000-0000-0000-000000000001',
        relationType: 'relates_to' as const,
      };

      expect(() => createRelationSchema.parse(invalidData)).toThrow();
    });
  });
});
