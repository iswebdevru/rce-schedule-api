import axios from 'axios';
import PdfParse = require('pdf-parse');
import { parseSchedule } from './utils/parseSchedule';

export const RCE_HOST = 'https://xn--j1al4b.xn--p1ai';

export async function getSchedule() {
  const { data } = await axios.get(`${RCE_HOST}/assets/rasp/12092022.pdf`, {
    responseType: 'arraybuffer',
  });
  const pdf = await PdfParse(data);
  return parseSchedule(pdf.text);
}
