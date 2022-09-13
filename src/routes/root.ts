import { FastifyPluginAsync } from 'fastify';
import { getAvailableRCEScheduleMetadata, getRCEGroups } from '../rce.service';

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/days-with-changes', function () {
    return getAvailableRCEScheduleMetadata();
  });
  fastify.get('/groups', function () {
    return getRCEGroups();
  });
};

export default root;
