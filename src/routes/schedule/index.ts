import axios from 'axios';
import { FastifyPluginAsync } from 'fastify';
import PdfParse = require('pdf-parse');
import { parseSchedule } from '../../utils/parseSchedule';

const schedule: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    const { data } = await axios.get(
      'https://xn--j1al4b.xn--p1ai/assets/rasp/12092022.pdf',
      {
        responseType: 'arraybuffer',
      }
    );
    const pdf = await PdfParse(data, { version: 'v2.0.550' });
    return pdf.text;
    return parseSchedule(pdf.text);
  });
};

export default schedule;
