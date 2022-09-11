import { FastifyPluginAsync } from 'fastify';
import { getSchedule } from '../../rce.service';

const schedule: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async function () {
    return getSchedule();
  });
};

export default schedule;
