import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MemoryRepository } from '../repositories/memory-repository';
import {
  createMemoryItemSchema,
  updateMemoryItemSchema,
  listMemoriesSchema,
  changesSinceSchema,
} from '../lib/validation';
import { validateBody, validateQuery } from '../middleware/validation';
import { NotFoundError } from '../lib/errors';

const memoryRepo = new MemoryRepository();

// ID param schema
const idParamSchema = z.object({
  id: z.string().uuid(),
});

export async function memoryRoutes(fastify: FastifyInstance) {
  // Create a memory item
  fastify.post(
    '/items',
    {
      preHandler: validateBody(createMemoryItemSchema),
    },
    async (request, reply) => {
      const item = memoryRepo.create(request.body as any);
      return reply.code(201).send(item);
    }
  );

  // Get all memory items
  fastify.get(
    '/items',
    {
      preHandler: validateQuery(listMemoriesSchema),
    },
    async (request) => {
      const { limit, offset } = request.query as any;
      const items = memoryRepo.findAll(limit, offset);
      return { items, total: items.length };
    }
  );

  // Get a specific memory item
  fastify.get<{ Params: { id: string } }>('/items/:id', async (request) => {
    const item = memoryRepo.findById(request.params.id);

    if (!item) {
      throw new NotFoundError('Memory item', request.params.id);
    }

    return item;
  });

  // Update a memory item
  fastify.patch<{ Params: { id: string } }>(
    '/items/:id',
    {
      preHandler: validateBody(updateMemoryItemSchema),
    },
    async (request) => {
      const item = memoryRepo.update(request.params.id, request.body as any);

      if (!item) {
        throw new NotFoundError('Memory item', request.params.id);
      }

      return item;
    }
  );

  // Delete a memory item
  fastify.delete<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const deleted = memoryRepo.delete(request.params.id);

    if (!deleted) {
      throw new NotFoundError('Memory item', request.params.id);
    }

    return reply.code(204).send();
  });

  // Get changes since a timestamp (for sync)
  fastify.get(
    '/items/changes/since',
    {
      preHandler: validateQuery(changesSinceSchema),
    },
    async (request) => {
      const { since, limit } = request.query as any;
      const items = memoryRepo.listChangesSince(since, limit);
      return { items, total: items.length };
    }
  );
}
