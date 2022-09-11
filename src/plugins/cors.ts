import fp from 'fastify-plugin';
import cors from '@fastify/cors';

export default fp(async fastify => {
  fastify.register(cors, { origin: 'http://127.0.0.1:5173' });
});
