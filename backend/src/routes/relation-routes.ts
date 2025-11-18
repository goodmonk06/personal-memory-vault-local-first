import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RelationRepository } from '../repositories/relation-repository';
import { createRelationSchema, listMemoriesSchema } from '../lib/validation';
import { validateBody, validateQuery } from '../middleware/validation';
import { NotFoundError } from '../lib/errors';

const relationRepo = new RelationRepository();

export async function relationRoutes(fastify: FastifyInstance) {
  // Create a relation between memory items
  fastify.post(
    '/relations',
    {
      preHandler: validateBody(createRelationSchema),
    },
    async (request, reply) => {
      const relation = relationRepo.create(request.body as any);
      return reply.code(201).send(relation);
    }
  );

  // Get all relations
  fastify.get(
    '/relations',
    {
      preHandler: validateQuery(listMemoriesSchema),
    },
    async (request) => {
      const { limit, offset } = request.query as any;
      const relations = relationRepo.findAll(limit, offset);
      return { relations, total: relations.length };
    }
  );

  // Get relations for a specific item
  fastify.get<{ Params: { itemId: string } }>('/relations/item/:itemId', async (request) => {
    const relations = relationRepo.findByItemId(request.params.itemId);
    return { relations, total: relations.length };
  });

  // Get a specific relation
  fastify.get<{ Params: { id: string } }>('/relations/:id', async (request) => {
    const relation = relationRepo.findById(request.params.id);

    if (!relation) {
      throw new NotFoundError('Relation', request.params.id);
    }

    return relation;
  });

  // Delete a relation
  fastify.delete<{ Params: { id: string } }>('/relations/:id', async (request, reply) => {
    const deleted = relationRepo.delete(request.params.id);

    if (!deleted) {
      throw new NotFoundError('Relation', request.params.id);
    }

    return reply.code(204).send();
  });
}
