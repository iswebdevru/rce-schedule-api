import { FastifyPluginAsync } from 'fastify';
import {
  getRCEScheduleChanges,
  RCEScheduleOptionsSchema,
} from '../../rce.service';

const schedule: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async function ({ query }) {
    const validatedQuery = RCEScheduleOptionsSchema.safeParse(query);
    if (!validatedQuery.success) {
      return {
        error: 'Wrong query parameters',
        message: validatedQuery.error.message,
      };
    }
    return getRCEScheduleChanges(validatedQuery.data);
  });
};

export default schedule;
