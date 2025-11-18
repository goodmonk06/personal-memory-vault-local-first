import { FastifyInstance } from 'fastify';
import { SyncRepository } from '../repositories/sync-repository';

const syncRepo = new SyncRepository();

export async function syncRoutes(fastify: FastifyInstance) {
  // Get all sync checkpoints
  fastify.get('/sync/checkpoints', async () => {
    const checkpoints = syncRepo.listCheckpoints();
    return { checkpoints, total: checkpoints.length };
  });

  // Get a specific checkpoint
  fastify.get<{ Params: { target: string } }>('/sync/checkpoints/:target', async (request, reply) => {
    const checkpoint = syncRepo.getCheckpoint(request.params.target);

    if (!checkpoint) {
      return reply.code(404).send({ error: 'Checkpoint not found' });
    }

    return checkpoint;
  });

  // Upsert a checkpoint (create or update)
  fastify.post<{ Body: { target: string; meta?: Record<string, any> } }>(
    '/sync/checkpoints',
    async (request) => {
      const { target, meta } = request.body;
      const checkpoint = syncRepo.upsertCheckpoint(target, meta);
      return checkpoint;
    }
  );

  // Delete a checkpoint
  fastify.delete<{ Params: { target: string } }>(
    '/sync/checkpoints/:target',
    async (request, reply) => {
      const deleted = syncRepo.deleteCheckpoint(request.params.target);

      if (!deleted) {
        return reply.code(404).send({ error: 'Checkpoint not found' });
      }

      return reply.code(204).send();
    }
  );

  // Stub endpoint for future sync operations
  fastify.post<{ Body: { target: string; since?: string } }>('/sync/pull', async (request) => {
    const { target, since } = request.body;

    // TODO: Implement actual sync logic (CRDT or timestamp-based)
    // For now, return a stub response

    return {
      status: 'not_implemented',
      message: 'Sync pull is not yet implemented. This is a stub for future development.',
      target,
      since: since || new Date(0).toISOString(),
      items: [],
    };
  });

  // Stub endpoint for pushing changes
  fastify.post<{ Body: { target: string; items: any[] } }>('/sync/push', async (request) => {
    const { target, items } = request.body;

    // TODO: Implement actual sync logic
    // For now, return a stub response

    return {
      status: 'not_implemented',
      message: 'Sync push is not yet implemented. This is a stub for future development.',
      target,
      itemsReceived: items.length,
      itemsSynced: 0,
    };
  });
}
