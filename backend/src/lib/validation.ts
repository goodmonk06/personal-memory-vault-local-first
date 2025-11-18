import { z } from 'zod';

// Memory Item Schemas
export const memoryItemTypeSchema = z.enum(['note', 'event', 'link']);
export const relationTypeSchema = z.enum(['relates_to', 'references', 'continues', 'contradicts', 'supports']);

export const createMemoryItemSchema = z.object({
  type: memoryItemTypeSchema,
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string().min(1).max(100)).optional().default([]),
  source: z.record(z.any()).optional().default({}),
});

export const updateMemoryItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).max(50000).optional(),
  tags: z.array(z.string().min(1).max(100)).optional(),
  source: z.record(z.any()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const queryMemoriesSchema = z.object({
  queryText: z.string().max(1000).optional().default(''),
  limit: z.number().int().min(1).max(200).optional().default(50),
  tags: z.array(z.string()).optional(),
});

export const listMemoriesSchema = z.object({
  limit: z.number().int().min(1).max(200).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export const changesSinceSchema = z.object({
  since: z.string().datetime(),
  limit: z.number().int().min(1).max(200).optional().default(100),
});

// Relation Schemas
export const createRelationSchema = z.object({
  fromId: z.string().uuid(),
  toId: z.string().uuid(),
  relationType: relationTypeSchema,
}).refine((data) => data.fromId !== data.toId, {
  message: 'fromId and toId must be different',
});

// Sync Schemas
export const upsertCheckpointSchema = z.object({
  target: z.string().min(1).max(200),
  meta: z.record(z.any()).optional().default({}),
});

export const syncPullSchema = z.object({
  target: z.string().min(1).max(200),
  since: z.string().datetime().optional(),
});

export const syncPushSchema = z.object({
  target: z.string().min(1).max(200),
  items: z.array(z.any()),
});

// Helper type inference
export type CreateMemoryItemInput = z.infer<typeof createMemoryItemSchema>;
export type UpdateMemoryItemInput = z.infer<typeof updateMemoryItemSchema>;
export type QueryMemoriesInput = z.infer<typeof queryMemoriesSchema>;
export type ListMemoriesInput = z.infer<typeof listMemoriesSchema>;
export type CreateRelationInput = z.infer<typeof createRelationSchema>;
export type UpsertCheckpointInput = z.infer<typeof upsertCheckpointSchema>;
export type SyncPullInput = z.infer<typeof syncPullSchema>;
export type SyncPushInput = z.infer<typeof syncPushSchema>;
