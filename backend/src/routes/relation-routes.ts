import { FastifyInstance } from 'fastify';
import { RelationRepository } from '../repositories/relation-repository';
import { CreateRelationRequest } from '../types';

const relationRepo = new RelationRepository();

export async function relationRoutes(fastify: FastifyInstance) {
  // Create a relation between memory items
  fastify.post<{ Body: CreateRelationRequest }>('/relations', async (request, reply) => {
    try {
      const relation = relationRepo.create(request.body);
      return reply.code(201).send(relation);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Get all relations
  fastify.get<{ Querystring: { limit?: number; offset?: number } }>(
    '/relations',
    async (request) => {
      const { limit = 100, offset = 0 } = request.query;
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
  fastify.get<{ Params: { id: string } }>('/relations/:id', async (request, reply) => {
    const relation = relationRepo.findById(request.params.id);

    if (!relation) {
      return reply.code(404).send({ error: 'Relation not found' });
    }

    return relation;
  });

  // Delete a relation
  fastify.delete<{ Params: { id: string } }>('/relations/:id', async (request, reply) => {
    const deleted = relationRepo.delete(request.params.id);

    if (!deleted) {
      return reply.code(404).send({ error: 'Relation not found' });
    }

    return reply.code(204).send();
  });
}
