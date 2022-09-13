import { FastifyPluginAsync } from 'fastify';
import { getAvailableRCEScheduleMetadata } from '../rce.service';

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/days-with-changes', async function () {
    return getAvailableRCEScheduleMetadata();
  });
};

export default root;
