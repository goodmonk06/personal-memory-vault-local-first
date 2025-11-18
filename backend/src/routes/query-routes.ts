import { FastifyInstance } from 'fastify';
import { MemoryRepository } from '../repositories/memory-repository';
import { QueryRequest } from '../types';

const memoryRepo = new MemoryRepository();

export async function queryRoutes(fastify: FastifyInstance) {
  // AI query endpoint - search memories by text and tags
  fastify.post<{ Body: QueryRequest }>('/query', async (request) => {
    const { queryText, limit = 50, tags } = request.body;

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
  });

  // Simple GET version for testing
  fastify.get<{ Querystring: { q?: string; tags?: string; limit?: number } }>(
    '/query',
    async (request) => {
      const { q = '', tags: tagsParam, limit = 50 } = request.query;
      const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : undefined;

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
