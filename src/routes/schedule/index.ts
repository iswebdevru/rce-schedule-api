import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getRCESchedule } from '../../rce.service';

const RequestQuery = z.object({
  day: z.string(),
});

const schedule: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async function ({ query }) {
    const validatedQuery = RequestQuery.safeParse(query);
    const schedule = await getRCESchedule(
      validatedQuery.success ? parseInt(validatedQuery.data.day) : null
    );
    if (!schedule) {
      return {
        error: 'Not found',
      };
    }
    return {
      error: null,
      data: schedule,
    };
  });
};

export default schedule;
