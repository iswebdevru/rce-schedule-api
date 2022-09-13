import axios from 'axios';
import PdfParse = require('pdf-parse');
import { compose, curry, last, prop, sortBy } from 'ramda';
import { normalizeDate } from './utils/date';
import {
  parseRCESchedulePage,
  parseRCESchedule,
  Schedule,
  ScheduleFileMetadata,
} from './utils/rce-parsers';

export const RCE_HOST = 'https://xn--j1al4b.xn--p1ai';
const RCE_SCHEDULE_PAGE = `${RCE_HOST}/obuchaushchimsya/raspisanie_zanyatii`;
const RCE_ASSETS_PAGE = `${RCE_HOST}/assets/rasp`;

function createScheduleFilename({
  day,
  month,
  year,
  version,
}: ScheduleFileMetadata) {
  return `${normalizeDate(day)}${normalizeDate(month)}${year}${
    version ? version : ''
  }.pdf`;
}

const filterRCEScheduleMetadata = curry(
  (scheduleMetadata: ScheduleFileMetadata[], searchDay: number | null) => {
    const date = new Date();
    return scheduleMetadata.filter(({ day, month, year }) => {
      const sameDay = searchDay ? searchDay === day : date.getDate();
      const sameMonth = month === date.getMonth() + 1;
      const sameYear = year === date.getFullYear();
      return sameDay && sameMonth && sameYear;
    });
  }
);

const findNewestRCEScheduleMetadata = (
  scheduleMetadata: ScheduleFileMetadata[],
  day: number | null
) =>
  compose(
    last<ScheduleFileMetadata>,
    sortBy(prop('version')),
    filterRCEScheduleMetadata(scheduleMetadata)
  )(day);

export async function getAvailableRCEScheduleMetadata() {
  const { data } = await axios(RCE_SCHEDULE_PAGE);
  return typeof data === 'string' ? parseRCESchedulePage(data) : [];
}

export async function getRCESchedule(
  day: number | null
): Promise<Schedule[] | null> {
  const scheduleMetadataList = await getAvailableRCEScheduleMetadata();
  const exactScheduleMetadata = findNewestRCEScheduleMetadata(
    scheduleMetadataList,
    day
  );
  if (!exactScheduleMetadata) {
    return null;
  }
  const filename = createScheduleFilename(exactScheduleMetadata);
  const response = await axios.get(`${RCE_ASSETS_PAGE}/${filename}`, {
    responseType: 'arraybuffer',
  });
  if (response.headers['content-type'] !== 'application/pdf') {
    return null;
  }
  const pdf = await PdfParse(response.data, { version: 'v2.0.550' });
  return parseRCESchedule(pdf.text);
}
