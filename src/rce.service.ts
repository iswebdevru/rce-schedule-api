import axios from 'axios';
import PdfParse = require('pdf-parse');
import { pipe } from 'ramda';
import { createDay, normalizeDate } from './utils/date';
import {
  // parseRCESchedulePage,
  parseRCESchedule,
  Schedule,
} from './utils/rce-parsers';

export const RCE_HOST = 'https://xn--j1al4b.xn--p1ai';
// const RCE_SCHEDULE_PAGE = `${RCE_HOST}/obuchaushchimsya/raspisanie_zanyatii`;
const RCE_ASSETS_PAGE = `${RCE_HOST}/assets/rasp`;

function createBaseScheduleFilename(day: Date) {
  const date = normalizeDate(day.getDate());
  const month = normalizeDate(day.getMonth() + 1);
  const year = day.getFullYear();
  return `${date}${month}${year}`;
}

// async function getAvailableRCESchedules() {
//   const { data } = await axios(RCE_SCHEDULE_PAGE);
//   return parseRCESchedulePage(data);
// }

// function findNewestRCESchedule(schedules: string[], criteria:) {
//   return schedules.find();
// }

export async function getRCESchedule(
  day: number | null
): Promise<Schedule[] | null> {
  const filename = pipe(createDay, createBaseScheduleFilename)(day);
  const response = await axios.get(`${RCE_ASSETS_PAGE}/${filename}`, {
    responseType: 'arraybuffer',
  });
  if (response.headers['content-type'] !== 'application/pdf') {
    return null;
  }
  const pdf = await PdfParse(response.data, { version: 'v2.0.550' });
  return parseRCESchedule(pdf.text);
}
