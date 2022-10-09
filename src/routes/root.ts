import { FastifyPluginAsync } from 'fastify';
import { getRCEDaysWithChanges } from '../rce.service';

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/days-with-changes', () => {
    return getRCEDaysWithChanges(fastify);
  });
};

export default root;
