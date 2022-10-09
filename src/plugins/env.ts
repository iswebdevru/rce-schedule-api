import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object',
  properties: {
    REDIS_URL: {
      type: 'string',
    },
  },
};

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      REDIS_URL: string;
    };
  }
}

export default fp(
  async fastify => {
    fastify.register(fastifyEnv, { schema });
  },
  {
    name: 'env-plugin',
  }
);
