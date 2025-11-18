import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MemoryRepository } from '../repositories/memory-repository';
import { queryMemoriesSchema } from '../lib/validation';
import { validateBody, validateQuery } from '../middleware/validation';

const memoryRepo = new MemoryRepository();

// GET query schema
const getQuerySchema = z.object({
  q: z.string().max(1000).optional().default(''),
  tags: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export async function queryRoutes(fastify: FastifyInstance) {
  // AI query endpoint - search memories by text and tags
  fastify.post(
    '/query',
    {
      preHandler: validateBody(queryMemoriesSchema),
    },
    async (request) => {
      const { queryText, limit, tags } = request.body as any;

      const items = memoryRepo.search(queryText, tags, limit);

      return {
        items,
        total: items.length,
        query: {
          text: queryText,
          tags: tags || [],
          limit,
        },
      };
    }
  );

  // Simple GET version for testing
  fastify.get(
    '/query',
    {
      preHandler: validateQuery(getQuerySchema),
    },
    async (request) => {
      const { q, tags: tagsParam, limit } = request.query as any;
      const tags = tagsParam ? tagsParam.split(',').map((t: string) => t.trim()) : undefined;

      const items = memoryRepo.search(q, tags, limit);

      return {
        items,
        total: items.length,
        query: {
          text: q,
          tags: tags || [],
          limit,
        },
      };
    }
  );
}
