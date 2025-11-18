import { FastifyInstance } from 'fastify';
import { MemoryRepository } from '../repositories/memory-repository';
import { CreateMemoryItemRequest, UpdateMemoryItemRequest } from '../types';

const memoryRepo = new MemoryRepository();

export async function memoryRoutes(fastify: FastifyInstance) {
  // Create a memory item
  fastify.post<{ Body: CreateMemoryItemRequest }>('/items', async (request, reply) => {
    try {
      const item = memoryRepo.create(request.body);
      return reply.code(201).send(item);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Get all memory items
  fastify.get<{ Querystring: { limit?: number; offset?: number } }>('/items', async (request) => {
    const { limit = 100, offset = 0 } = request.query;
    const items = memoryRepo.findAll(limit, offset);
    return { items, total: items.length };
  });

  // Get a specific memory item
  fastify.get<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const item = memoryRepo.findById(request.params.id);

    if (!item) {
      return reply.code(404).send({ error: 'Memory item not found' });
    }

    return item;
  });

  // Update a memory item
  fastify.patch<{ Params: { id: string }; Body: UpdateMemoryItemRequest }>(
    '/items/:id',
    async (request, reply) => {
      const item = memoryRepo.update(request.params.id, request.body);

      if (!item) {
        return reply.code(404).send({ error: 'Memory item not found' });
      }

      return item;
    }
  );

  // Delete a memory item
  fastify.delete<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const deleted = memoryRepo.delete(request.params.id);

    if (!deleted) {
      return reply.code(404).send({ error: 'Memory item not found' });
    }

    return reply.code(204).send();
  });

  // Get changes since a timestamp (for sync)
  fastify.get<{ Querystring: { since: string; limit?: number } }>(
    '/items/changes/since',
    async (request, reply) => {
      const { since, limit = 100 } = request.query;

      if (!since) {
        return reply.code(400).send({ error: 'since parameter is required' });
      }

      const items = memoryRepo.listChangesSince(since, limit);
      return { items, total: items.length };
    }
  );
}
