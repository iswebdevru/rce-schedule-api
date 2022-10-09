import { FastifyPluginAsync } from 'fastify';
import { getAvailableRCEDaysWithChanges, getRCEGroups } from '../rce.service';

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/days-with-changes', () => {
    return getAvailableRCEDaysWithChanges();
  });
  fastify.get('/groups', () => {
    return getRCEGroups();
  });
  fastify.get('/create', async () => {
    await fastify.redis.set('key', 'magic');
    return 'done';
  });
  fastify.get('/get', () => {
    return fastify.redis.get('key');
  });
};

export default root;
