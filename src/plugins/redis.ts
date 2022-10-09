import fp from 'fastify-plugin';
import { createClient } from 'redis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: ReturnType<typeof createClient>;
  }
}

export default fp(
  async fastify => {
    const client = createClient({ url: fastify.config.REDIS_URL });
    await client.connect();
    fastify.decorate('redis', client);
  },
  {
    dependencies: ['env-plugin'],
  }
);
