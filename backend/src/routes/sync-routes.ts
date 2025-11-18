import { FastifyInstance } from 'fastify';
import { SyncRepository } from '../repositories/sync-repository';
import {
  upsertCheckpointSchema,
  syncPullSchema,
  syncPushSchema,
} from '../lib/validation';
import { validateBody } from '../middleware/validation';
import { NotFoundError } from '../lib/errors';

const syncRepo = new SyncRepository();

export async function syncRoutes(fastify: FastifyInstance) {
  // Get all sync checkpoints
  fastify.get('/sync/checkpoints', async () => {
    const checkpoints = syncRepo.listCheckpoints();
    return { checkpoints, total: checkpoints.length };
  });

  // Get a specific checkpoint
  fastify.get<{ Params: { target: string } }>('/sync/checkpoints/:target', async (request) => {
    const checkpoint = syncRepo.getCheckpoint(request.params.target);

    if (!checkpoint) {
      throw new NotFoundError('Checkpoint', request.params.target);
    }

    return checkpoint;
  });

  // Upsert a checkpoint (create or update)
  fastify.post(
    '/sync/checkpoints',
    {
      preHandler: validateBody(upsertCheckpointSchema),
    },
    async (request) => {
      const { target, meta } = request.body as any;
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
        throw new NotFoundError('Checkpoint', request.params.target);
      }

      return reply.code(204).send();
    }
  );

  // Stub endpoint for future sync operations
  fastify.post(
    '/sync/pull',
    {
      preHandler: validateBody(syncPullSchema),
    },
    async (request) => {
      const { target, since } = request.body as any;

      // TODO: Implement actual sync logic (CRDT or timestamp-based)
      // For now, return a stub response

      return {
        status: 'not_implemented',
        message: 'Sync pull is not yet implemented. This is a stub for future development.',
        target,
        since: since || new Date(0).toISOString(),
        items: [],
      };
    }
  );

  // Stub endpoint for pushing changes
  fastify.post(
    '/sync/push',
    {
      preHandler: validateBody(syncPushSchema),
    },
    async (request) => {
      const { target, items } = request.body as any;

      // TODO: Implement actual sync logic
      // For now, return a stub response

      return {
        status: 'not_implemented',
        message: 'Sync push is not yet implemented. This is a stub for future development.',
        target,
        itemsReceived: items.length,
        itemsSynced: 0,
      };
    }
  );
}
