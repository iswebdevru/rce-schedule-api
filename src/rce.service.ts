import axios from 'axios';
import PdfParse = require('pdf-parse');
import { pipe } from 'ramda';
import { Schedule } from './utils/parseSchedule';
import { parseSchedule } from './utils/parseSchedule';

export const RCE_HOST = 'https://xn--j1al4b.xn--p1ai';

function isValidDate(date: number | null): date is number {
  return typeof date === 'number' && date > 0 && date < 32;
}

function createDay(date: number | null) {
  return new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    isValidDate(date) ? date : new Date().getDate()
  );
}

function normalizeDate(date: number) {
  return date < 10 ? `0${date}` : date.toString();
}

function createFilename(day: Date) {
  const date = normalizeDate(day.getDate());
  const month = normalizeDate(day.getMonth() + 1);
  const year = day.getFullYear();
  return `${date}${month}${year}.pdf`;
}

export async function getSchedule(
  day: number | null
): Promise<Schedule[] | null> {
  const filename = pipe(createDay, createFilename)(day);
  const response = await axios.get(`${RCE_HOST}/assets/rasp/${filename}`, {
    responseType: 'arraybuffer',
  });
  if (response.headers['content-type'] !== 'application/pdf') {
    return null;
  }
  const pdf = await PdfParse(response.data, { version: 'v2.0.550' });
  return parseSchedule(pdf.text);
}
